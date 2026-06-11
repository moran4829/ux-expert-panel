import React from 'react';
import { LoginLandscapeBackground } from '../components/login/LoginLandscapeBackground';
import { UserLlmSetupForm } from '../components/settings/UserLlmSetupForm';
import logo from '../assets/logo.svg';
import { APP_NAME } from '../lib/appBrand';

export function UserLlmSetupPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 sm:p-8 lg:p-10 rtl overflow-hidden">
      <LoginLandscapeBackground />
      <div className="relative z-10 w-full max-w-lg mx-auto">
        <div className="text-right mb-6">
          <img src={logo} alt={APP_NAME} className="h-9 sm:h-10 w-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-podium-text)] leading-snug">
            לפני שמתחילים — חיבור למודל AI
          </h1>
          <p className="mt-2 text-sm text-[var(--color-podium-text-secondary)] leading-relaxed">
            כדי שהבדיקות ירוצו על הטוקנים שלכם, הגדירו חיבור LLM אישי.
          </p>
        </div>
        <UserLlmSetupForm />
      </div>
    </div>
  );
}
