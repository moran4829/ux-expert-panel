import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_FINDINGS, DEFAULT_REPORT_SCORES, useAppContext } from '../../AppContext';
import { DEFAULT_DISCUSSION_MESSAGES } from '../../data/defaultDiscussion';
import { DiscussionMessage } from '../../types';
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

export function DiscussionRoom() {
  const { currentProjectId, projects, navigate, experts, updateProject } = useAppContext();
  const project = projects.find((p) => p.id === currentProjectId);

  const savedMessages = project?.messages ?? [];
  const hasSavedDiscussion = savedMessages.length > 0;
  const isCompleted = project?.status === 'completed';

  const [messages, setMessages] = useState<DiscussionMessage[]>(savedMessages);
  const [isPlaying, setIsPlaying] = useState(!hasSavedDiscussion && !isCompleted);
  const [currentIndex, setCurrentIndex] = useState(savedMessages.length);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!project) return;
    setMessages(project.messages ?? []);
    setCurrentIndex(project.messages?.length ?? 0);
    setIsPlaying(!project.messages?.length && project.status !== 'completed');
  }, [project?.id]);

  useEffect(() => {
    if (!project || messages.length === 0) return;
    updateProject(project.id, { messages });
  }, [messages, project?.id]);

  useEffect(() => {
    if (!isPlaying || isCompleted || currentIndex >= DEFAULT_DISCUSSION_MESSAGES.length) {
      if (currentIndex >= DEFAULT_DISCUSSION_MESSAGES.length && isPlaying) setIsPlaying(false);
      return;
    }

    const timer = setTimeout(
      () => {
        setMessages((prev) => [
          ...prev,
          {
            ...DEFAULT_DISCUSSION_MESSAGES[currentIndex],
            id: `${project?.id}-${currentIndex}-${Date.now()}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        setCurrentIndex((c) => c + 1);
      },
      currentIndex === 0 ? 1000 : 2500 + Math.random() * 2000
    );

    return () => clearTimeout(timer);
  }, [currentIndex, isPlaying, isCompleted, project?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleGenerateReport = () => {
    if (!project) return;

    updateProject(project.id, {
      status: 'completed',
      messages,
      findings: project.findings ?? DEFAULT_FINDINGS,
      scores: project.scores ?? DEFAULT_REPORT_SCORES,
    });
    navigate('report');
  };

  if (!project) return <div>Project not found</div>;

  const currentExperts = project.selectedExperts
    .map((id) => experts.find((e) => e.id === id))
    .filter(Boolean);

  const discussionComplete = currentIndex >= DEFAULT_DISCUSSION_MESSAGES.length;

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
            <h1 className="text-xl font-bold text-[var(--color-podium-text)] flex items-center gap-3">
              {project.name}
              {isPlaying && (
                <span className="text-xs font-semibold text-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-podium-primary)] animate-pulse" />
                  ניתוח פעיל
                </span>
              )}
            </h1>
            <p className="text-[var(--color-podium-text-secondary)] text-sm mt-0.5">
              {project.url || 'ניתוח תהליך'} • דוגמים ומנתחים בזמן אמת
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
              title={isPlaying ? 'השהה ניתוח' : 'המשך ניתוח'}
            >
              {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            </Button>
          )}
          <Button
            onClick={handleGenerateReport}
            disabled={!discussionComplete && !isCompleted}
            icon={<ListChecksIcon size={16} />}
          >
            {isCompleted ? 'צפייה בדוח' : 'הפקת דוח סופי'}
          </Button>
        </div>
      </header>

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

                  {msg.type === 'conflict' && (
                    <div className="mt-3 flex items-center gap-2">
                      <button className="text-xs font-bold text-[var(--color-podium-primary)] bg-[var(--color-podium-primary-light)] hover:bg-[var(--color-podium-primary-muted)] px-3 py-1.5 rounded-[var(--radius-podium-md)] transition-colors">
                        👈 לקבל המלצה זו
                      </button>
                      <button className="text-xs font-bold text-[var(--color-podium-text-secondary)] bg-[var(--color-podium-surface-muted)] hover:bg-[var(--color-podium-border)] border border-[var(--color-podium-border)] px-3 py-1.5 rounded-[var(--radius-podium-md)] transition-colors">
                        בקש מהמומחים להגיע לעמק השווה
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isPlaying && messages.length > 0 && (
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
              placeholder="המערכת מנתחת אוטומטית. ניתן להתערב במקרה של מחלוקות..."
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
