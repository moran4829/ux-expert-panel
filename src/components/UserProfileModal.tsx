import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { compressAvatarImage } from '../lib/expertSkill';
import { mapAuthError } from '../lib/authErrors';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { UploadIcon, TrashIcon } from './icons';
import { cn } from '../lib/utils';

type UserProfileModalProps = {
  open: boolean;
  onClose: () => void;
};

export function UserProfileModal({ open, onClose }: UserProfileModalProps) {
  const {
    user,
    userPhoto,
    isAdmin,
    profileVersion,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    setLoginPassword,
    signOut,
  } = useAuth();

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDirty, setPhotoDirty] = useState(false);

  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupPasswordConfirm, setSetupPasswordConfirm] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [settingUpPassword, setSettingUpPassword] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setDisplayName(user.displayName ?? '');
    setPhotoPreview(userPhoto);
    setPhotoDirty(false);
    setNewEmail(user.email ?? '');
    setEmailPassword('');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setSetupPassword('');
    setSetupPasswordConfirm('');
    setMessage(null);
    setError(null);
  }, [open, user, userPhoto, profileVersion]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open || !user) return null;

  const userInitial =
    user.displayName?.charAt(0) ?? user.email?.charAt(0)?.toUpperCase() ?? '?';

  const showStatus = (text: string, isError = false) => {
    if (isError) {
      setError(text);
      setMessage(null);
    } else {
      setMessage(text);
      setError(null);
    }
    setTimeout(() => {
      setMessage(null);
      setError(null);
    }, 4000);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressAvatarImage(file, 128);
      setPhotoPreview(dataUrl);
      setPhotoDirty(true);
      showStatus('תמונה נבחרה — לחצי "שמור פרופיל"');
    } catch {
      showStatus('שגיאה בטעינת התמונה', true);
    }
    event.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoPreview(null);
    setPhotoDirty(true);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setError(null);
    try {
      const fields: { displayName?: string; photoDataUrl?: string | null } = {
        displayName: displayName.trim() || undefined,
      };
      if (photoDirty) {
        fields.photoDataUrl = photoPreview;
      }
      await updateUserProfile(fields);
      setPhotoDirty(false);
      showStatus('הפרופיל נשמר');
    } catch (err) {
      showStatus(mapAuthError(err), true);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!emailPassword) {
      showStatus('הזיני את הסיסמה הנוכחית לאימות', true);
      return;
    }
    if (newEmail.trim() === user.email) {
      showStatus('זה כבר האימייל שלך', true);
      return;
    }
    setSavingEmail(true);
    setError(null);
    try {
      await updateUserEmail(newEmail, emailPassword);
      setEmailPassword('');
      showStatus('האימייל עודכן');
    } catch (err) {
      showStatus(mapAuthError(err), true);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleSetupPassword = async () => {
    if (setupPassword.length < 6) {
      showStatus('סיסמה — לפחות 6 תווים', true);
      return;
    }
    if (setupPassword !== setupPasswordConfirm) {
      showStatus('הסיסמאות לא תואמות', true);
      return;
    }
    setSettingUpPassword(true);
    setError(null);
    try {
      await setLoginPassword(setupPassword);
      setSetupPassword('');
      setSetupPasswordConfirm('');
      showStatus('סיסמה הוגדרה — מעכשיו אפשר להיכנס גם בסיסמה');
    } catch (err) {
      showStatus(mapAuthError(err), true);
    } finally {
      setSettingUpPassword(false);
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword) {
      showStatus('הזיני את הסיסמה הנוכחית', true);
      return;
    }
    if (newPassword.length < 6) {
      showStatus('סיסמה חדשה — לפחות 6 תווים', true);
      return;
    }
    if (newPassword !== confirmPassword) {
      showStatus('הסיסמאות החדשות לא תואמות', true);
      return;
    }
    setSavingPassword(true);
    setError(null);
    try {
      await updateUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showStatus('הסיסמה עודכנה');
    } catch (err) {
      showStatus(mapAuthError(err), true);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      onClose();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-[var(--radius-podium-xl)] bg-white shadow-[var(--shadow-podium-lg)] border border-[var(--color-podium-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--color-podium-border)] bg-white/95 backdrop-blur-sm">
          <div>
            <h2 id="profile-modal-title" className="text-lg font-bold text-[var(--color-podium-text)]">
              פרופיל משתמש
            </h2>
            {isAdmin && (
              <span className="text-xs font-bold text-[var(--color-podium-warning)]">Admin</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-[var(--color-podium-text-secondary)] hover:bg-[var(--color-podium-surface-muted)] transition-colors text-xl leading-none"
            aria-label="סגירה"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          {(message || error) && (
            <p
              className={cn(
                'text-sm font-medium rounded-[var(--radius-podium-md)] px-3 py-2',
                error
                  ? 'bg-red-50 text-[var(--color-podium-danger)]'
                  : 'bg-green-50 text-[var(--color-podium-success)]'
              )}
            >
              {error ?? message}
            </p>
          )}

          {/* Avatar + display name */}
          <section className="space-y-4">
            <h3 className="text-sm font-bold text-[var(--color-podium-text)]">פרטים אישיים</h3>
            <div className="flex items-center gap-4">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt=""
                  className="w-16 h-16 rounded-full object-cover border-2 border-[var(--color-podium-border)] shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-[var(--color-podium-primary)] flex items-center justify-center text-xl font-bold text-white shrink-0">
                  {userInitial}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  icon={<UploadIcon size={14} />}
                  onClick={() => avatarInputRef.current?.click()}
                >
                  העלאת תמונה
                </Button>
                {photoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    icon={<TrashIcon size={14} />}
                    onClick={handleRemovePhoto}
                  >
                    הסרה
                  </Button>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                שם תצוגה
              </label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="השם שלך"
              />
            </div>
            <Button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full"
            >
              {savingProfile ? 'שומר...' : 'שמור פרופיל'}
            </Button>
          </section>

          <hr className="border-[var(--color-podium-border)]" />

          {/* Email */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-podium-text)]">אימייל</h3>
            <p className="text-xs text-[var(--color-podium-text-secondary)]">
              לשינוי אימייל נדרשת הסיסמה הנוכחית לאימות.
            </p>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                כתובת אימייל
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="you@example.com"
                dir="ltr"
                className="text-left"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                סיסמה נוכחית (לאימות)
              </label>
              <Input
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSaveEmail}
              disabled={savingEmail}
              className="w-full"
            >
              {savingEmail ? 'מעדכן...' : 'עדכן אימייל'}
            </Button>
          </section>

          <hr className="border-[var(--color-podium-border)]" />

          {/* Password setup (e.g. after email-link login) */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-podium-text)]">הגדרת סיסמה לכניסה</h3>
            <p className="text-xs text-[var(--color-podium-text-secondary)]">
              {isAdmin
                ? 'לאחר כניסה בקישור מייל — הגדירי סיסמה כדי להיכנס גם כך בפעם הבאה.'
                : 'אם נכנסת בקישור מייל, אפשר להוסיף סיסמה לכניסה הבאה.'}
            </p>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                סיסמה חדשה
              </label>
              <Input
                type="password"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                אימות סיסמה
              </label>
              <Input
                type="password"
                value={setupPasswordConfirm}
                onChange={(e) => setSetupPasswordConfirm(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <Button
              type="button"
              onClick={handleSetupPassword}
              disabled={settingUpPassword}
              className="w-full"
            >
              {settingUpPassword ? 'שומר...' : 'הגדר סיסמה'}
            </Button>
          </section>

          <hr className="border-[var(--color-podium-border)]" />

          {/* Password change */}
          <section className="space-y-3">
            <h3 className="text-sm font-bold text-[var(--color-podium-text)]">שינוי סיסמה</h3>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                סיסמה נוכחית
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                סיסמה חדשה
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="לפחות 6 תווים"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-[var(--color-podium-text-secondary)] mb-1.5">
                אימות סיסמה חדשה
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="w-full"
            >
              {savingPassword ? 'מעדכן...' : 'עדכן סיסמה'}
            </Button>
          </section>

          <hr className="border-[var(--color-podium-border)]" />

          <Button
            type="button"
            variant="danger"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full"
          >
            {signingOut ? 'מתנתק...' : 'התנתקות'}
          </Button>
        </div>
      </div>
    </div>
  );
}
