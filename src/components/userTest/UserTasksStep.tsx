import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

type UserTasksStepProps = {
  tasks: string[];
  onChange: (tasks: string[]) => void;
};

export function UserTasksStep({ tasks, onChange }: UserTasksStepProps) {
  const handleChange = (index: number, value: string) => {
    const next = [...tasks];
    next[index] = value;
    onChange(next);
  };

  const addTask = () => {
    if (tasks.length < 3) onChange([...tasks, '']);
  };

  const removeTask = (index: number) => {
    const next = tasks.filter((_, i) => i !== index);
    onChange(next.length ? next : ['']);
  };

  const hasValidTask = tasks.some((t) => t.trim());

  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-podium-text-secondary)]">
        מה המשתמש מצפה לעשות במסכים? (עד 3 משימות — משותף לכל הפרסונות)
      </p>
      {tasks.map((task, index) => (
        <div key={index} className="flex gap-2 items-center">
          <span className="w-8 h-8 rounded-full bg-[var(--color-podium-surface-muted)] text-[var(--color-podium-text-secondary)] font-bold flex items-center justify-center shrink-0 text-sm">
            {index + 1}
          </span>
          <Input
            value={task}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={`משימה ${index + 1} (לדוגמה: להירשם לשירות...)`}
            className="flex-1"
          />
          {tasks.length > 1 && (
            <Button size="sm" variant="ghost" onClick={() => removeTask(index)}>
              ×
            </Button>
          )}
        </div>
      ))}
      {tasks.length < 3 && (
        <Button size="sm" variant="secondary" onClick={addTask}>
          + הוסף משימה
        </Button>
      )}
      {!hasValidTask && (
        <p className="text-sm text-[var(--color-podium-text-tertiary)]">יש להזין לפחות משימה אחת</p>
      )}
    </div>
  );
}

export function hasValidUserTasks(tasks: string[]): boolean {
  return tasks.some((t) => t.trim());
}
