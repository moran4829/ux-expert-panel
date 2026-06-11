import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../../AppContext';
import {
  buildExecutiveSummary,
  buildFindingsFromDiscussion,
  buildScoresFromFindings,
} from '../../lib/reportFromDiscussion';
import { DEFAULT_DISCUSSION_MESSAGES } from '../../data/defaultDiscussion';
import { fetchExpertDiscussionMessage } from '../../lib/llm';
import { isLocalLlmActive } from '../../lib/llmDefaults';
import { aggregateExpertReviews } from '../../lib/reviewEngine/aggregateReport';
import { runAllExpertReasoning } from '../../lib/reviewEngine/expertReasoning';
import { runVisionExtractionForProject } from '../../lib/reviewEngine/visionExtract';
import { hasAnalyzableMaterial, materialHasStoredImage } from '../../lib/testMaterial';
import { MaterialPreview } from '../../components/MaterialPreview';
import { DiscussionMessage, ReviewProject } from '../../types';
import {
  PlayIcon,
  PauseIcon,
  ChevronRightIcon,
  MessageIcon,
  AlertCircleIcon,
  ListChecksIcon,
} from '../../components/icons';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { ExpertAvatar } from '../../components/ui/ExpertAvatar';
import { Input } from '../../components/ui/Input';

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

  const buildProductContext = (p: ReviewProject) =>
    [p.goal, p.targetAudience, p.domain, p.stage].filter(Boolean).join(' | ');

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
          expertReviews = await runAllExpertReasoning(
            selectedExpertObjs,
            project.screenExtraction,
            buildProductContext(project),
            llmSettings
          );
        }
        if (expertReviews?.length && llmSettings.taskModels.report_aggregate.provider !== 'mock') {
          aggregatedReport =
            (await aggregateExpertReviews(expertReviews, llmSettings)) ?? undefined;
        }
      }

      const findings = buildFindingsFromDiscussion(messages, project);
      const scores = aggregatedReport
        ? {
            ...buildScoresFromFindings(findings, project.selectedExperts),
            overall: aggregatedReport.overall_score,
          }
        : buildScoresFromFindings(findings, project.selectedExperts);

      updateProject(project.id, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        messages,
        findings,
        scores,
        expertReviews,
        aggregatedReport,
        executiveSummary:
          aggregatedReport?.main_summary ??
          buildExecutiveSummary(findings, experts, project),
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

  const discussionComplete = currentIndex >= totalTurns;
  const showLoading =
    isPlaying && (isGenerating || visionPhase === 'running' || (useLocalLlm && messages.length > 0));

  const providerLabel =
    discussionModel.provider === 'ollama'
      ? 'Ollama'
      : discussionModel.provider === 'lm_studio'
        ? 'LM Studio'
        : 'דמו';

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

          {!isCompleted && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={isGenerating || analysisBlocked || visionPhase === 'running'}
              title={
                analysisBlocked
                  ? 'הגדירו LLM מקומי בהגדרות'
                  : isPlaying
                    ? 'השהה ניתוח'
                    : 'המשך ניתוח'
              }
            >
              {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </Button>
          )}
          <Button
            onClick={handleGenerateReport}
            disabled={(!discussionComplete && !isCompleted) || isGenerating || generatingReport}
            icon={<ListChecksIcon size={16} />}
          >
            {generatingReport ? 'מפיק דוח...' : isCompleted ? 'צפייה בדוח' : 'הפקת דוח סופי'}
          </Button>
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

      {materialHasStoredImage(project.material) && (
        <MaterialPreview material={project.material} compact className="mb-4" />
      )}

      <Card padding="none" className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scroll-smooth">
          {messages.map((msg) => {
            if (msg.expertId === 'system') {
              return (
                <div key={msg.id} className="flex justify-center my-4">
                  <div className="bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] text-xs font-semibold px-4 py-1.5 rounded-full flex items-center gap-2 border border-[var(--color-podium-border)]">
                    <span className="w-2 h-2 rounded-full border-2 border-[var(--color-podium-text-tertiary)] border-t-transparent animate-spin" />
                    {msg.text}
                  </div>
                </div>
              );
            }

            const expert = experts.find((e) => e.id === msg.expertId);
            if (!expert) return null;

            return (
              <div key={msg.id} className="flex gap-4 animate-in slide-in-from-bottom-2 fade-in duration-300">
                <ExpertAvatar
                  expert={expert}
                  size={44}
                  className="border border-[var(--color-podium-border)]"
                />
                <div className="flex-1 max-w-2xl">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-bold text-[var(--color-podium-text)] text-sm">{expert.name}</span>
                    <Badge>{expert.role}</Badge>
                    <span className="text-xs text-[var(--color-podium-text-tertiary)] mr-2">{msg.timestamp}</span>
                  </div>

                  <div
                    className={cn(
                      'p-4 rounded-[var(--radius-podium-lg)] md:rounded-tr-none border leading-relaxed text-sm',
                      msg.type === 'conflict'
                        ? 'bg-[var(--color-podium-warning-bg)] border-amber-200 text-amber-900'
                        : msg.type === 'recommendation'
                          ? 'bg-[var(--color-podium-success-bg)] border-green-200 text-green-900'
                          : 'bg-[var(--color-podium-surface-muted)] border-[var(--color-podium-border)] text-[var(--color-podium-text)]'
                    )}
                  >
                    {msg.type === 'conflict' && (
                      <div className="flex items-center gap-1.5 text-[var(--color-podium-warning)] font-bold text-xs mb-1.5">
                        <AlertCircleIcon size={14} /> מחלוקת מקצועית
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })}

          {showLoading && (
            <div className="flex gap-4 opacity-50">
              <div className="w-11 h-11 rounded-full bg-[var(--color-podium-border)] animate-pulse flex-shrink-0" />
              <div className="flex-1 max-w-md">
                <div className="h-3.5 bg-[var(--color-podium-border)] rounded w-1/4 mb-2 animate-pulse" />
                <div className="h-14 bg-[var(--color-podium-surface-muted)] rounded-[var(--radius-podium-lg)] animate-pulse" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[var(--color-podium-border)] bg-[var(--color-podium-surface-muted)]">
          <div className="relative max-w-4xl mx-auto">
            <Input
              type="text"
              readOnly
              icon={<MessageIcon size={16} />}
              className="cursor-not-allowed opacity-70 pr-10"
              placeholder={
                analysisBlocked
                  ? 'הגדירו LLM מקומי בהגדרות כדי לנתח את החומר שהעליתם.'
                  : useLocalLlm
                    ? 'המערכת מנתחת את החומר דרך מודלים מקומיים לפי משימה. ניתן להשהות ולהמשיך.'
                    : 'מצב דמו — רק לפרויקטים ללא חומר.'
              }
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
