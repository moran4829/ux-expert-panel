import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../AppContext';
import {
  buildFindingsFromDiscussion,
  buildFindingsFromExpertReviews,
  buildScoreExplanations,
  buildScoresFromFindings,
  resolveExecutiveSummary,
} from '../../lib/reportFromDiscussion';
import { DEFAULT_DISCUSSION_MESSAGES } from '../../data/defaultDiscussion';
import { fetchExpertDiscussionMessage } from '../../lib/llm';
import { fetchUserChatExpertResponses, mergePanelAndChatFindings } from '../../lib/userExpertChat';
import { isLocalLlmActive } from '../../lib/llmDefaults';
import { aggregateExpertReviews } from '../../lib/reviewEngine/aggregateReport';
import { runAllExpertReasoning } from '../../lib/reviewEngine/expertReasoning';
import { runVisionExtractionForProject } from '../../lib/reviewEngine/visionExtract';
import { hasAnalyzableMaterial, materialHasStoredImage, getMaterialPreviewUrl } from '../../lib/testMaterial';
import { DiscussionFocusPanels } from '../../components/DiscussionFocusPanels';
import { DiscussionMessage, ReviewProject } from '../../types';
import {
  PlayIcon,
  PauseIcon,
  ChevronRightIcon,
  MessageIcon,
  ListChecksIcon,
} from '../../components/icons';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ExpertAvatar } from '../../components/ui/ExpertAvatar';

type VisionPhase = 'idle' | 'running' | 'done' | 'skipped' | 'failed';

function countCompletedExpertTurns(
  messages: DiscussionMessage[],
  expertIds: string[]
): number {
  const expertSet = new Set(expertIds);
  return messages.filter((m) => expertSet.has(m.expertId)).length;
}

function hasVisionFailureNotice(messages: DiscussionMessage[]): boolean {
  return messages.some(
    (m) => m.expertId === 'system' && m.text.includes('חילוץ Vision נכשל')
  );
}

function shouldResumeDiscussion(
  project: ReviewProject,
  expertIds: string[],
  requiresRealAnalysis: boolean,
  useLocalLlm: boolean
): boolean {
  if (project.status === 'completed') return false;
  if (requiresRealAnalysis && !useLocalLlm) return false;
  const completedTurns = countCompletedExpertTurns(project.messages ?? [], expertIds);
  return completedTurns < expertIds.length;
}

export function DiscussionRoom() {
  const {
    currentProjectId,
    projects,
    navigate,
    experts,
    expertOverrides,
    llmSettings,
    updateProject,
  } = useAppContext();
  const project = projects.find((p) => p.id === currentProjectId);

  const useLocalLlm = isLocalLlmActive(llmSettings);
  const discussionModel = llmSettings.taskModels.discussion_turn;
  const requiresRealAnalysis = project ? hasAnalyzableMaterial(project) : false;
  const canPlayMockDemo = !requiresRealAnalysis;
  const analysisBlocked = requiresRealAnalysis && !useLocalLlm;
  const expertTurnOrder = useMemo(
    () => project?.selectedExperts ?? [],
    [project?.selectedExperts]
  );
  const totalTurns = useLocalLlm || requiresRealAnalysis
    ? expertTurnOrder.length
    : DEFAULT_DISCUSSION_MESSAGES.length;

  const savedMessages = project?.messages ?? [];
  const savedExpertTurns = countCompletedExpertTurns(
    savedMessages,
    project?.selectedExperts ?? []
  );
  const isCompleted = project?.status === 'completed';

  const [messages, setMessages] = useState<DiscussionMessage[]>(savedMessages);
  const [isPlaying, setIsPlaying] = useState(
    project
      ? shouldResumeDiscussion(project, expertTurnOrder, requiresRealAnalysis, useLocalLlm)
      : false
  );
  const [currentIndex, setCurrentIndex] = useState(savedExpertTurns);
  const [isGenerating, setIsGenerating] = useState(false);
  const [visionPhase, setVisionPhase] = useState<VisionPhase>(
    project?.screenExtraction ? 'done' : 'idle'
  );
  const [visionWarning, setVisionWarning] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [isChatMode, setIsChatMode] = useState((project?.userChatMessages?.length ?? 0) > 0);
  const [chatMessages, setChatMessages] = useState<DiscussionMessage[]>(project?.userChatMessages ?? []);
  const [chatInput, setChatInput] = useState('');
  const [chatGenerating, setChatGenerating] = useState(false);
  const [focusPanel, setFocusPanel] = useState<'discussion' | 'chat' | 'image'>('discussion');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const llmRunId = useRef(0);
  const messagesRef = useRef(messages);
  const visionRunId = useRef(0);
  const projectRef = useRef(project);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    projectRef.current = project;
  }, [project]);

  useEffect(() => {
    if (!project) return;
    setMessages(project.messages ?? []);
    setChatMessages(project.userChatMessages ?? []);
    setIsChatMode((project.userChatMessages?.length ?? 0) > 0);
    setCurrentIndex(countCompletedExpertTurns(project.messages ?? [], project.selectedExperts));
    setVisionPhase(
      project.screenExtraction
        ? 'done'
        : hasVisionFailureNotice(project.messages ?? [])
          ? 'failed'
          : 'idle'
    );
    setIsPlaying(
      shouldResumeDiscussion(
        project,
        project.selectedExperts,
        hasAnalyzableMaterial(project),
        isLocalLlmActive(llmSettings)
      )
    );
  }, [project?.id, llmSettings]);

  useEffect(() => {
    if (!project || messages.length === 0) return;
    updateProject(project.id, { messages });
  }, [messages, project?.id]);

  useEffect(() => {
    if (!project || chatMessages.length === 0) return;
    updateProject(project.id, { userChatMessages: chatMessages });
  }, [chatMessages, project?.id]);

  useEffect(() => {
    if (!useLocalLlm || !project || isCompleted) return;
    if (project.screenExtraction) {
      setVisionPhase('done');
      return;
    }
    if (!materialHasStoredImage(project.material)) {
      setVisionPhase('skipped');
      return;
    }
    if (llmSettings.taskModels.vision_extract.provider === 'mock') {
      setVisionPhase('skipped');
      return;
    }
    if (hasVisionFailureNotice(project.messages ?? [])) {
      setVisionPhase('failed');
      return;
    }

    const runId = ++visionRunId.current;
    setVisionPhase('running');
    setVisionWarning(null);

    runVisionExtractionForProject(project, llmSettings)
      .then((extraction) => {
        if (visionRunId.current !== runId || !extraction) return;
        updateProject(project.id, { screenExtraction: extraction });
        setVisionPhase('done');
        setMessages((prev) => [
          ...prev,
          {
            id: `${project.id}-vision-${Date.now()}`,
            expertId: 'system',
            type: 'status',
            text: `חילוץ Vision הושלם — ${extraction.screen_summary || 'נתוני מסך נשמרו'}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      })
      .catch((error) => {
        if (visionRunId.current !== runId) return;
        const msg = error instanceof Error ? error.message : 'שגיאה בחילוץ Vision';
        setVisionPhase('failed');
        setVisionWarning(msg);
        setMessages((prev) => [
          ...prev,
          {
            id: `${project.id}-vision-err-${Date.now()}`,
            expertId: 'system',
            type: 'status',
            text: `חילוץ Vision נכשל — הדיון ימשיך עם תמונה ישירה. (${msg})`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      });

    return () => {
      visionRunId.current += 1;
    };
  }, [project?.id, useLocalLlm, isCompleted]);

  useEffect(() => {
    if (useLocalLlm || !canPlayMockDemo || !isPlaying || isCompleted || !project) return;
    if (currentIndex >= DEFAULT_DISCUSSION_MESSAGES.length) {
      if (isPlaying) setIsPlaying(false);
      return;
    }

    const timer = setTimeout(
      () => {
        setMessages((prev) => [
          ...prev,
          {
            ...DEFAULT_DISCUSSION_MESSAGES[currentIndex],
            id: `${project.id}-${currentIndex}-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setCurrentIndex((c) => c + 1);
      },
      currentIndex === 0 ? 1000 : 2500 + Math.random() * 2000
    );

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, isCompleted, project?.id, useLocalLlm, canPlayMockDemo]);

  useEffect(() => {
    if (!useLocalLlm || !isPlaying || isCompleted || !project) return;
    if (currentIndex >= expertTurnOrder.length) {
      setIsPlaying(false);
      return;
    }

    const runId = ++llmRunId.current;
    const expertId = expertTurnOrder[currentIndex];
    const expert = experts.find((e) => e.id === expertId);

    if (!expert) {
      setCurrentIndex((c) => c + 1);
      return;
    }

    const run = async () => {
      setIsGenerating(true);

      const liveProject = projectRef.current;
      if (!liveProject) return;

      let prior = messagesRef.current;
      const completedExpertTurns = countCompletedExpertTurns(prior, expertTurnOrder);
      if (currentIndex === 0 && completedExpertTurns === 0) {
        const intro: DiscussionMessage = {
          id: `${liveProject.id}-intro-${Date.now()}`,
          expertId: 'system',
          type: 'status',
          text: `מתחבר ל-${discussionModel.provider} (${discussionModel.modelId})${
            liveProject.screenExtraction
              ? ' — מנתח לפי JSON מחולץ'
              : materialHasStoredImage(liveProject.material)
                ? ` — מנתח תמונה/מסך${liveProject.material?.imageUrl ? ' (מהשרת)' : ''}`
                : liveProject.material?.sourceUrl
                  ? ` — חומר מקישור: ${liveProject.material.sourceUrl}`
                  : ''
          }...`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        prior = [intro];
        messagesRef.current = prior;
        setMessages(prior);
      }

      try {
        const { text, type } = await fetchExpertDiscussionMessage(
          expert,
          liveProject,
          prior,
          expertOverrides,
          experts,
          llmSettings
        );

        if (llmRunId.current !== runId) return;

        const nextMessage: DiscussionMessage = {
          id: `${liveProject.id}-${expertId}-${Date.now()}`,
          expertId,
          text,
          type,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        const next = [...messagesRef.current, nextMessage];
        messagesRef.current = next;
        setMessages(next);
        setCurrentIndex((c) => c + 1);
      } catch (error) {
        if (llmRunId.current !== runId) return;
        const message = error instanceof Error ? error.message : 'שגיאת LLM';
        setMessages((prev) => [
          ...prev,
          {
            id: `${liveProject.id}-error-${Date.now()}`,
            expertId: 'system',
            type: 'status',
            text: `שגיאה: ${message}. בדקו הגדרות LLM ומודל למשימת "דיון מומחים".`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setIsPlaying(false);
      } finally {
        if (llmRunId.current === runId) setIsGenerating(false);
      }
    };

    run();

    return () => {
      llmRunId.current += 1;
    };
  }, [
    currentIndex,
    isPlaying,
    isCompleted,
    project?.id,
    useLocalLlm,
    expertTurnOrder,
    llmSettings,
    visionPhase,
    discussionModel.modelId,
    discussionModel.provider,
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, chatGenerating]);

  useEffect(() => {
    if (isChatMode) setFocusPanel('chat');
  }, [isChatMode]);

  const buildProductContext = (p: ReviewProject) =>
    [p.goal, p.targetAudience, p.domain, p.stage].filter(Boolean).join(' | ');

  const handleSendChat = async () => {
    if (!project || !chatInput.trim() || chatGenerating) return;

    const selectedExpertObjs = project.selectedExperts
      .map((id) => experts.find((e) => e.id === id))
      .filter(Boolean) as typeof experts;

    if (!selectedExpertObjs.length) return;

    const userMsg: DiscussionMessage = {
      id: `${project.id}-user-${Date.now()}`,
      expertId: 'user',
      text: chatInput.trim(),
      type: 'observation',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const nextChat = [...chatMessages, userMsg];
    setChatMessages(nextChat);
    setChatInput('');
    setChatGenerating(true);

    try {
      const responses = await fetchUserChatExpertResponses(
        userMsg.text,
        project,
        messages,
        nextChat,
        selectedExpertObjs,
        expertOverrides,
        experts,
        llmSettings
      );

      const expertMsgs: DiscussionMessage[] = responses.map((r) => ({
        id: `${project.id}-chat-${r.expertId}-${Date.now()}-${Math.random()}`,
        expertId: r.expertId,
        text: r.text,
        type: r.type,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }));

      setChatMessages((prev) => [...prev, ...expertMsgs]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'שגיאה בצ\'אט';
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${project.id}-chat-err-${Date.now()}`,
          expertId: 'system',
          type: 'status',
          text: `שגיאה בצ'אט: ${message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setChatGenerating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!project) return;
    setGeneratingReport(true);

    try {
      let expertReviews = project.expertReviews;
      let aggregatedReport = project.aggregatedReport;

      const selectedExpertObjs = project.selectedExperts
        .map((id) => experts.find((e) => e.id === id))
        .filter(Boolean) as typeof experts;

      if (project.screenExtraction && selectedExpertObjs.length) {
        if (llmSettings.taskModels.expert_reasoning.provider !== 'mock') {
          try {
            expertReviews = await runAllExpertReasoning(
              selectedExpertObjs,
              project.screenExtraction,
              buildProductContext(project),
              llmSettings
            );
          } catch (error) {
            console.error('Expert reasoning failed:', error);
          }
        }
        if (expertReviews?.length && llmSettings.taskModels.report_aggregate.provider !== 'mock') {
          try {
            aggregatedReport =
              (await aggregateExpertReviews(expertReviews, llmSettings)) ?? undefined;
          } catch (error) {
            console.error('Report aggregate failed:', error);
          }
        }
      }

      const liveMessages = messagesRef.current.length > 0 ? messagesRef.current : messages;
      const liveChatMessages = chatMessages;

      const panelFindings = buildFindingsFromDiscussion(liveMessages, project, {
        findingSource: 'panel',
      });
      const chatFindings = buildFindingsFromDiscussion(liveChatMessages, project, {
        idPrefix: 'chat-finding',
        findingSource: 'user_chat',
      });
      let findings = mergePanelAndChatFindings(panelFindings, chatFindings);

      if (findings.length === 0 && expertReviews?.length) {
        findings = buildFindingsFromExpertReviews(expertReviews, project, experts).map((f) => ({
          ...f,
          findingSource: 'panel' as const,
        }));
      }

      const baseScores = buildScoresFromFindings(findings, project.selectedExperts);
      const aggregatedOverall =
        aggregatedReport?.overall_score && aggregatedReport.overall_score > 0
          ? aggregatedReport.overall_score
          : null;
      const scores = aggregatedOverall
        ? { ...baseScores, overall: aggregatedOverall }
        : baseScores;

      const scoreExplanations = buildScoreExplanations(
        scores,
        findings,
        experts,
        liveMessages,
        expertReviews
      );

      const executiveSummary = resolveExecutiveSummary(project, findings, experts, {
        messages: [...liveMessages, ...liveChatMessages],
        expertReviews,
        aggregatedReport,
        screenExtraction: project.screenExtraction,
      });

      updateProject(project.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        messages: liveMessages,
        userChatMessages: liveChatMessages,
        findings,
        scores,
        scoreExplanations,
        expertReviews,
        aggregatedReport,
        executiveSummary,
      });
      navigate('report');
    } finally {
      setGeneratingReport(false);
    }
  };

  if (!project) return <div>Project not found</div>;

  const currentExperts = project.selectedExperts
    .map((id) => experts.find((e) => e.id === id))
    .filter(Boolean);

  const discussionComplete =
    project.selectedExperts.length === 0
      ? false
      : currentIndex >= totalTurns;
  const expertTurnsInDiscussion = countCompletedExpertTurns(messages, project.selectedExperts);
  const showPostPanelChoice =
    discussionComplete && !isCompleted && !isChatMode && expertTurnsInDiscussion > 0;
  const canGenerateReport =
    isCompleted || (isChatMode && expertTurnsInDiscussion > 0) || (discussionComplete && expertTurnsInDiscussion > 0 && !showPostPanelChoice);
  const showLoading =
    isPlaying && (isGenerating || visionPhase === 'running' || (useLocalLlm && messages.length > 0));

  const providerLabel =
    discussionModel.provider === 'ollama'
      ? 'Ollama'
      : discussionModel.provider === 'lm_studio'
        ? 'LM Studio'
        : 'דמו';
  const hasImage = Boolean(getMaterialPreviewUrl(project.material));

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-screen">
      <header className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('dashboard')}
            className="text-[var(--color-podium-text-tertiary)] hover:text-[var(--color-podium-text)] p-2 -mr-2 transition-colors"
          >
            <ChevronRightIcon size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[var(--color-podium-text)] flex items-center gap-3 flex-wrap">
              {project.name}
              <Badge variant={useLocalLlm ? 'primary' : analysisBlocked ? 'warning' : 'default'}>
                {useLocalLlm ? providerLabel : analysisBlocked ? 'נדרש LLM מקומי' : 'דמו (ללא חומר)'}
              </Badge>
              {visionPhase === 'running' && (
                <Badge variant="info">מנתח מסך (Vision)...</Badge>
              )}
              {project.screenExtraction && (
                <Badge variant="success">JSON מחולץ</Badge>
              )}
              {isPlaying && (
                <span className="text-xs font-semibold text-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-podium-primary)] animate-pulse" />
                  ניתוח פעיל
                </span>
              )}
            </h1>
            <p className="text-[var(--color-podium-text-secondary)] text-sm mt-0.5">
              {project.material?.sourceUrl || project.url || 'ניתוח מבוסס חומר שהועלה'}
              {useLocalLlm
                ? ` • דיון: ${discussionModel.modelId}`
                : analysisBlocked
                  ? ' • מצב דמו לא מנתח את המוצר שהעליתם'
                  : ' • דמו ללא חומר בלבד'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2 space-x-reverse mr-4">
            {currentExperts.map((exp, i) =>
              exp ? (
                <ExpertAvatar
                  key={exp.id}
                  expert={exp}
                  size={36}
                  className="border-2 border-white"
                  style={{ zIndex: 10 - i }}
                />
              ) : null
            )}
          </div>

          {!isCompleted && !isChatMode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isGenerating || analysisBlocked || visionPhase === 'running' || discussionComplete}
              title={
                analysisBlocked
                  ? 'הגדירו LLM מקומי בהגדרות'
                  : discussionComplete
                    ? 'הדיון הסתיים'
                    : isPlaying
                      ? 'השהה ניתוח'
                      : 'המשך ניתוח'
              }
            >
              {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </Button>
          )}
          {isChatMode && !isCompleted && (
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating || generatingReport}
              icon={<ListChecksIcon size={16} />}
            >
              {generatingReport ? 'מפיק דוח...' : 'סיים צ\'אט והפק דוח'}
            </Button>
          )}
          {!isChatMode && !showPostPanelChoice && (
            <Button
              onClick={() => (isCompleted ? navigate('report') : handleGenerateReport())}
              disabled={!canGenerateReport || isGenerating || generatingReport}
              icon={<ListChecksIcon size={16} />}
            >
              {generatingReport ? 'מפיק דוח...' : isCompleted ? 'צפייה בדוח' : 'הפקת דוח סופי'}
            </Button>
          )}
          {isCompleted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleGenerateReport}
              disabled={isGenerating || generatingReport || expertTurnsInDiscussion === 0}
              title={
                expertTurnsInDiscussion === 0
                  ? 'אין הודעות דיון שמורות — הריצו את הדיון מחדש'
                  : 'הפיקו דוח מחדש מהודעות הדיון השמורות'
              }
            >
              {generatingReport ? 'מפיק...' : 'הפק דוח מחדש'}
            </Button>
          )}
        </div>
      </header>

      {analysisBlocked && messages.length === 0 && (
        <Card className="mb-4 border-amber-200 bg-[var(--color-podium-warning-bg)]">
          <p className="text-sm text-amber-900 font-semibold mb-2">
            הועלה חומר אמיתי (קישור/תמונה) — מצב דמו לא מנתח אותו.
          </p>
          <p className="text-sm text-amber-800 mb-3">
            הגדירו Ollama או LM Studio בהגדרות, והקצו מודל למשימת &quot;דיון מומחים שורה-שורה&quot;.
          </p>
          <Button size="sm" onClick={() => navigate('settings')}>
            מעבר להגדרות LLM
          </Button>
        </Card>
      )}

      {visionWarning && (
        <Card className="mb-4 border-amber-200 bg-[var(--color-podium-warning-bg)]">
          <p className="text-sm text-amber-800">{visionWarning}</p>
        </Card>
      )}

      {showPostPanelChoice && (
        <Card className="mb-4 border-[var(--color-podium-primary-muted)] bg-[var(--color-podium-primary-light)]/50">
          <h3 className="font-bold text-[var(--color-podium-text)] mb-1">הדיון הסתיים — מה הלאה?</h3>
          <p className="text-sm text-[var(--color-podium-text-secondary)] mb-4">
            אפשר להפיק דוח סופי מיד, או לנהל צ&apos;אט עם המומחים כדי לדיון נוסף, לשנות מסקנות, ורק אז להפיק דוח.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleGenerateReport} disabled={generatingReport} icon={<ListChecksIcon size={16} />}>
              {generatingReport ? 'מפיק דוח...' : 'הפקת דוח סופי'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsChatMode(true)}
              icon={<MessageIcon size={16} />}
            >
              צ&apos;אט עם המומחים
            </Button>
          </div>
        </Card>
      )}

      <DiscussionFocusPanels
        focusPanel={focusPanel}
        onFocusChange={setFocusPanel}
        material={project.material}
        hasImage={hasImage}
        isChatMode={isChatMode}
        messages={messages}
        chatMessages={chatMessages}
        experts={experts}
        showLoading={showLoading}
        expertTurnsInDiscussion={expertTurnsInDiscussion}
        scrollRef={scrollRef}
        chatScrollRef={chatScrollRef}
        chatGenerating={chatGenerating}
        chatInput={chatInput}
        onChatInputChange={setChatInput}
        onSendChat={handleSendChat}
        analysisBlocked={analysisBlocked}
        useLocalLlm={useLocalLlm}
      />
    </div>
  );
}
