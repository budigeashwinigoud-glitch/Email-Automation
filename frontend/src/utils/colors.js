// Color palette generator for employee avatars and visual tags
const AVATAR_PALETTES = [
  { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' }, // Blue
  { bg: '#f5f3ff', text: '#6d28d9', border: '#ddd6fe' }, // Purple
  { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' }, // Emerald
  { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa' }, // Orange
  { bg: '#fdf2f8', text: '#be185d', border: '#fbcfe8' }, // Pink
  { bg: '#f0fdfa', text: '#0f766e', border: '#99f6e4' }, // Teal
  { bg: '#fefce8', text: '#a16207', border: '#fef08a' }, // Amber
  { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }, // Sky
];

export function getAvatarColor(name = '', id = 0) {
  let hash = id;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[index];
}

export function getInitials(name = '') {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
