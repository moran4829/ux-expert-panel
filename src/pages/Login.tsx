import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import logo from '../assets/logo.svg';
import { APP_NAME } from '../lib/appBrand';
import { LoginLandscapeBackground } from '../components/login/LoginLandscapeBackground';
import { LoginHeroCharacter } from '../components/login/LoginHeroCharacter';
import { cn } from '../lib/utils';
import { isAdminEmail } from '../lib/admin';

type Mode = 'login' | 'register';
type AuthMethod = 'password' | 'emailLink';

function LoginBranding() {
  return (
    <div className="text-right mb-6">
      <img src={logo} alt={APP_NAME} className="h-9 sm:h-10 w-auto mb-4" />
      <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-podium-text)] leading-snug">
        פאנל המומחים שלכם לבדיקת UX
      </h1>
      <p className="mt-2 text-sm text-[var(--color-podium-text-secondary)] leading-relaxed">
        העלו מסך, קבלו משוב ממומחי AI ושמרו את הבדיקות בענן — לכל משתמש בנפרד.
      </p>
    </div>
  );
}

type AuthFormProps = {
  mode: Mode;
  setMode: (mode: Mode) => void;
};

function EmailLinkPendingForm() {
  const { completeEmailLinkSignIn, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    try {
      await completeEmailLinkSignIn(email);
    } catch {
      /* authError set in context */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full login-card border-white/80 shadow-[0_8px_40px_rgba(228,37,125,0.08)]">
      <p className="text-sm font-semibold text-[var(--color-podium-text)] mb-2 text-center">
        השלימי התחברות מהמייל
      </p>
      <p className="text-xs text-[var(--color-podium-text-secondary)] mb-5 text-center leading-relaxed">
        לחצת על הקישור? הזיני את אותה כתובת אימייל שאליה נשלח הקישור.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
            אימייל
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            autoComplete="email"
            className="dir-ltr text-left"
          />
        </div>
        {authError && (
          <p className="text-sm text-[var(--color-podium-danger)] leading-relaxed rounded-[var(--radius-podium-md)] bg-[var(--color-podium-danger-bg)] px-3 py-2">
            {authError}
          </p>
        )}
        <Button type="submit" className="w-full justify-center" size="lg" disabled={submitting}>
          {submitting ? 'מתחבר...' : 'השלמת התחברות'}
        </Button>
      </form>
    </Card>
  );
}

function AuthForm({ mode, setMode }: AuthFormProps) {
  const {
    signInWithEmail,
    signUpWithEmail,
    sendEmailSignInLink,
    sendPasswordReset,
    authError,
    setAuthError,
    emailLinkPending,
  } = useAuth();

  const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailLinkSent, setEmailLinkSent] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);
  const isAdminLogin = isAdminEmail(email);

  if (emailLinkPending) {
    return <EmailLinkPendingForm />;
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    try {
      if (mode === 'login') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName);
      }
    } catch {
      /* authError set in context */
    } finally {
      setSubmitting(false);
    }
  };

  const handleEmailLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setAuthError(null);
    setEmailLinkSent(false);
    try {
      await sendEmailSignInLink(email, mode === 'register' ? displayName : undefined);
      setEmailLinkSent(true);
    } catch {
      /* authError set in context */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="w-full login-card border-white/80 shadow-[0_8px_40px_rgba(228,37,125,0.08)]">
      <p className="text-sm font-semibold text-[var(--color-podium-text-secondary)] mb-5 text-center">
        {mode === 'login' ? 'התחברות לחשבון שלך' : 'יצירת חשבון חדש'}
      </p>

      {isAdminLogin && mode === 'login' && (
        <p className="text-xs text-center text-[var(--color-podium-primary)] font-medium mb-4 leading-relaxed rounded-[var(--radius-podium-md)] bg-[var(--color-podium-primary-light)]/60 px-3 py-2">
          חשבון Admin — אותו משתמש: התחברות בסיסמה או בקישור חד-פעמי במייל.
        </p>
      )}

      <div className="flex rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] p-1 mb-4 bg-[var(--color-podium-surface-muted)]">
        {(['login', 'register'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setAuthError(null);
              setEmailLinkSent(false);
            }}
            className={cn(
              'flex-1 py-2 text-sm font-semibold rounded-[var(--radius-podium-sm)] transition-all duration-200',
              mode === tab
                ? 'bg-[var(--color-podium-primary)] text-white shadow-[var(--shadow-podium-sm)]'
                : 'text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)]'
            )}
          >
            {tab === 'login' ? 'התחברות' : 'הרשמה'}
          </button>
        ))}
      </div>

      <div className="flex rounded-[var(--radius-podium-md)] border border-[var(--color-podium-border)] p-1 mb-6 bg-[var(--color-podium-surface-muted)]">
        {(
          [
            { id: 'password' as const, label: 'סיסמה' },
            { id: 'emailLink' as const, label: 'קישור חד-פעמי במייל' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setAuthMethod(tab.id);
              setAuthError(null);
              setEmailLinkSent(false);
            }}
            className={cn(
              'flex-1 py-2 text-xs sm:text-sm font-semibold rounded-[var(--radius-podium-sm)] transition-all duration-200',
              authMethod === tab.id
                ? 'bg-white text-[var(--color-podium-primary)] shadow-[var(--shadow-podium-sm)]'
                : 'text-[var(--color-podium-text-secondary)] hover:text-[var(--color-podium-text)]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {authMethod === 'emailLink' && !emailLinkSent && (
        <p className="text-xs text-[var(--color-podium-text-secondary)] mb-4 text-center leading-relaxed">
          נשלח אליך קישור התחברות חד-פעמי — לחצי עליו במייל. הקישור תקף פעם אחת בלבד.
        </p>
      )}

      {emailLinkSent ? (
        <div className="rounded-[var(--radius-podium-lg)] bg-[var(--color-podium-success-bg)] border border-green-200 px-4 py-4 text-center space-y-2">
          <p className="text-sm font-semibold text-[var(--color-podium-success)]">הקישור נשלח!</p>
          <p className="text-xs text-[var(--color-podium-text-secondary)] leading-relaxed">
            שלחנו קישור התחברות ל-<span className="font-semibold dir-ltr inline-block">{email}</span>.
            <br />
            בדקי גם בתיקיית הספאם. פתחי את הקישור באותו דפדפן.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={() => setEmailLinkSent(false)}
          >
            שליחה מחדש
          </Button>
        </div>
      ) : (
        <form
          onSubmit={authMethod === 'password' ? handlePasswordSubmit : handleEmailLinkSubmit}
          className="space-y-4"
        >
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
                שם (אופציונלי)
              </label>
              <Input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="השם שלך"
                autoComplete="name"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)] mb-1.5">
              אימייל
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              className="dir-ltr text-left"
            />
          </div>

          {authMethod === 'password' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-[var(--color-podium-text-secondary)]">
                  סיסמה
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email.trim()) {
                        setAuthError('הזיני קודם את כתובת האימייל');
                        return;
                      }
                      setResettingPassword(true);
                      setAuthError(null);
                      setPasswordResetSent(false);
                      try {
                        await sendPasswordReset(email);
                        setPasswordResetSent(true);
                      } catch {
                        /* authError set in context */
                      } finally {
                        setResettingPassword(false);
                      }
                    }}
                    disabled={resettingPassword || submitting}
                    className="text-xs font-semibold text-[var(--color-podium-primary)] hover:underline disabled:opacity-50"
                  >
                    {resettingPassword ? 'שולח...' : 'שכחתי סיסמה'}
                  </button>
                )}
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'לפחות 6 תווים' : 'הסיסמה שלך'}
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="dir-ltr text-left"
              />
            </div>
          )}

          {passwordResetSent && (
            <div className="rounded-[var(--radius-podium-lg)] bg-[var(--color-podium-success-bg)] border border-green-200 px-4 py-3 text-center">
              <p className="text-sm font-semibold text-[var(--color-podium-success)]">נשלח מייל לאיפוס סיסמה</p>
              <p className="text-xs text-[var(--color-podium-text-secondary)] mt-1 leading-relaxed">
                בדקי את <span className="font-semibold dir-ltr inline-block">{email.trim()}</span> (גם בספאם).
              </p>
            </div>
          )}

          {authError && (
            <p className="text-sm text-[var(--color-podium-danger)] leading-relaxed rounded-[var(--radius-podium-md)] bg-[var(--color-podium-danger-bg)] px-3 py-2">
              {authError}
            </p>
          )}

          <Button type="submit" className="w-full justify-center" size="lg" disabled={submitting}>
            {submitting
              ? authMethod === 'password'
                ? mode === 'login'
                  ? 'מתחבר...'
                  : 'יוצר חשבון...'
                : 'שולח...'
              : authMethod === 'password'
                ? mode === 'login'
                  ? 'התחברות'
                  : 'הרשמה'
                : 'שלח קישור התחברות'}
          </Button>
        </form>
      )}
    </Card>
  );
}

function LoginLayout({ mode, setMode }: { mode: Mode; setMode: (mode: Mode) => void }) {
  return (
    <div className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
      {/* ימין — לוגו + טקסט + טופס */}
      <div className="w-full max-w-md mx-auto lg:mx-0 lg:justify-self-start order-1">
        <LoginBranding />
        <AuthForm mode={mode} setMode={setMode} />
      </div>

      {/* שמאל — דמויות */}
      <div className="w-full order-2 flex items-center justify-center lg:justify-self-end">
        <LoginHeroCharacter />
      </div>
    </div>
  );
}

export function LoginPage() {
  const { firebaseReady } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  if (!firebaseReady) {
    const isHosted =
      typeof window !== 'undefined' &&
      !window.location.hostname.includes('localhost') &&
      !window.location.hostname.includes('127.0.0.1');

    return (
      <div className="relative min-h-screen flex items-center justify-center p-6 rtl overflow-hidden">
        <LoginLandscapeBackground />
        <div className="relative z-10 w-full max-w-md">
          <LoginBranding />
          <Card className="login-card border-white/80">
            <h2 className="text-lg font-bold text-[var(--color-podium-text)] mb-2 text-center">
              Firebase לא מוגדר
            </h2>
            {isHosted ? (
              <div className="text-sm text-[var(--color-podium-text-secondary)] space-y-2 leading-relaxed">
                <p>
                  ב-Vercel חסרים משתני סביבה <code className="text-xs bg-black/5 px-1 rounded">VITE_FIREBASE_*</code>.
                </p>
                <p>
                  Settings → Environment Variables — העתיקי מ-<code className="text-xs">.env.local</code>, שמרי,
                  ואז <strong>Redeploy</strong>.
                </p>
                <p className="text-xs text-[var(--color-podium-text-tertiary)]">
                  פירוט: <code className="text-xs">firebase/SETUP-HE.md</code>
                </p>
              </div>
            ) : (
              <p className="text-sm text-[var(--color-podium-text-secondary)] text-center">
                צרי <code className="text-xs">.env.local</code> עם משתני Firebase —{' '}
                <code className="text-xs">npm run setup:env</code>
              </p>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-6 sm:p-8 lg:p-10 rtl overflow-hidden">
      <LoginLandscapeBackground />
      <LoginLayout mode={mode} setMode={setMode} />
    </div>
  );
}
