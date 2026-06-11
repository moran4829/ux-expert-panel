/** Active Firebase user uid — set by AuthContext for storage uploads */
let activeFirebaseUid: string | null = null;

export function setActiveFirebaseUid(uid: string | null) {
  activeFirebaseUid = uid;
}

export function getActiveFirebaseUid(): string | null {
  return activeFirebaseUid;
}
