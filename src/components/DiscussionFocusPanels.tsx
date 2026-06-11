import React from 'react';
import { FocusPanelLayout } from './FocusPanelLayout';
import { MaterialPreview } from './MaterialPreview';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { ExpertAvatar } from './ui/ExpertAvatar';
import { Input } from './ui/Input';
import { AlertCircleIcon, MessageIcon } from './icons';
import { cn } from '../lib/utils';
import { getMaterialPreviewUrl } from '../lib/testMaterial';
import type { TestMaterial } from '../types/material';
import type { DiscussionMessage, Expert } from '../types';

type DiscussionFocusPanelsProps = {
  focusPanel: 'discussion' | 'chat' | 'image';
  onFocusChange: (id: 'discussion' | 'chat' | 'image') => void;
  material?: TestMaterial;
  hasImage: boolean;
  isChatMode: boolean;
  messages: DiscussionMessage[];
  chatMessages: DiscussionMessage[];
  experts: Expert[];
  showLoading: boolean;
  expertTurnsInDiscussion: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  chatGenerating: boolean;
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSendChat: () => void;
  analysisBlocked: boolean;
  useLocalLlm: boolean;
};

export function DiscussionFocusPanels({
  focusPanel,
  onFocusChange,
  material,
  hasImage,
  isChatMode,
  messages,
  chatMessages,
  experts,
  showLoading,
  expertTurnsInDiscussion,
  scrollRef,
  chatScrollRef,
  chatGenerating,
  chatInput,
  onChatInputChange,
  onSendChat,
  analysisBlocked,
  useLocalLlm,
}: DiscussionFocusPanelsProps) {
  const previewUrl = getMaterialPreviewUrl(material);

  const footer = (
    <div className="p-4">
      <div className="relative max-w-4xl mx-auto">
        {isChatMode ? (
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onSendChat();
            }}
          >
            <Input
              type="text"
              value={chatInput}
              onChange={(e) => onChatInputChange(e.target.value)}
              disabled={chatGenerating}
              icon={<MessageIcon size={16} />}
              className="flex-1"
              placeholder="שאלו את המומחים, אתגרו מסקנות, או בקשו המלצות נוספות..."
            />
            <Button type="submit" disabled={!chatInput.trim() || chatGenerating}>
              שליחה
            </Button>
          </form>
        ) : (
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
                  : 'מצב דemo — רק לפרויקטים ללא חומר.'
            }
          />
        )}
      </div>
    </div>
  );

  return (
    <FocusPanelLayout
      className="flex-1 min-h-0"
      focusId={focusPanel}
      onFocusChange={(id) => onFocusChange(id as 'discussion' | 'chat' | 'image')}
      footer={footer}
      panels={[
        {
          id: 'discussion',
          label: 'דיון מומחים',
          miniPreview: (
            <span className="text-lg leading-none font-bold">{expertTurnsInDiscussion || '—'}</span>
          ),
          content: (
            <div ref={scrollRef} className="p-6 md:p-8 space-y-6 scroll-smooth min-h-full">
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
                    <ExpertAvatar expert={expert} size={44} className="border border-[var(--color-podium-border)]" />
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
          ),
        },
        {
          id: 'chat',
          label: "צ'אט",
          hidden: !isChatMode,
          miniPreview: <MessageIcon size={20} className="text-[var(--color-podium-primary)]" />,
          content: (
            <div ref={chatScrollRef} className="p-6 md:p-8 space-y-4 min-h-full">
              {chatMessages.length === 0 && (
                <p className="text-center text-sm text-[var(--color-podium-text-secondary)] py-8">
                  שאלו את המומחים, אתגרו מסקנות, או בקשו הבהרות — כולם כאן.
                </p>
              )}
              {chatMessages.map((msg) => {
                if (msg.expertId === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <Badge variant="warning">{msg.text}</Badge>
                    </div>
                  );
                }
                if (msg.expertId === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end">
                      <div className="max-w-xl bg-[var(--color-podium-primary)] text-white p-4 rounded-[var(--radius-podium-lg)] rounded-tl-none text-sm leading-relaxed">
                        <p className="text-xs font-semibold opacity-80 mb-1">את/ה</p>
                        {msg.text}
                      </div>
                    </div>
                  );
                }
                const expert = experts.find((e) => e.id === msg.expertId);
                if (!expert) return null;
                return (
                  <div key={msg.id} className="flex gap-3">
                    <ExpertAvatar expert={expert} size={40} className="border border-[var(--color-podium-border)]" />
                    <div className="flex-1 max-w-2xl">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-[var(--color-podium-text)]">{expert.name}</span>
                        <Badge variant="info">צ&apos;אט</Badge>
                      </div>
                      <div className="p-4 rounded-[var(--radius-podium-lg)] md:rounded-tr-none border bg-[var(--color-podium-surface-muted)] border-[var(--color-podium-border)] text-sm leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}
              {chatGenerating && (
                <div className="flex gap-3 opacity-50">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-podium-border)] animate-pulse" />
                  <div className="h-12 flex-1 max-w-md bg-[var(--color-podium-surface-muted)] rounded-[var(--radius-podium-lg)] animate-pulse" />
                </div>
              )}
            </div>
          ),
        },
        {
          id: 'image',
          label: 'תמונה',
          hidden: !hasImage,
          miniPreview: previewUrl ? (
            <img src={previewUrl} alt="" className="w-full h-full object-cover object-top" />
          ) : (
            'IMG'
          ),
          content: (
            <div className="p-4 flex justify-center">
              <MaterialPreview material={material} compact expandable className="max-w-2xl w-full" />
            </div>
          ),
        },
      ]}
    />
  );
}
