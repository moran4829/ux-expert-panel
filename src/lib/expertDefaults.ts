import { Expert, ExpertEditableFields, ExpertOverrides } from '../types';
import { DEFAULT_EXPERTS } from '../data/experts';

export function getExpertEditableFields(
  expert: Expert,
  overrides?: ExpertOverrides
): ExpertEditableFields {
  const override = overrides?.[expert.id];
  return {
    name: expert.name,
    archetype: expert.archetype,
    role: expert.role,
    description: expert.description,
    focusAreas: [...expert.focusAreas],
    avatar: expert.avatar,
    avatarBg: expert.avatarBg,
    skillExtra: override?.skillExtra ?? '',
  };
}

export function getDefaultExpertAssetFields(expertId: string): Pick<ExpertEditableFields, 'avatar' | 'avatarBg'> {
  const defaults = DEFAULT_EXPERTS.find((item) => item.id === expertId);
  return {
    avatar: defaults?.avatar,
    avatarBg: defaults?.avatarBg,
  };
}
