const QUALITY_HEIGHTS = Object.freeze({
  tiny: 144,
  small: 240,
  medium: 360,
  large: 480,
  hd720: 720,
  hd1080: 1080,
  hd1440: 1440,
  hd2160: 2160,
  hd2880: 2880,
  highres: 4320
});

export const QUALITY_MODES = Object.freeze([
  'highest',
  'auto',
  ...Object.keys(QUALITY_HEIGHTS).filter(level => level !== 'tiny' && level !== 'small' && level !== 'medium' && level !== 'large')
]);

export function highestAvailableQuality(levels) {
  if (!Array.isArray(levels)) return null;
  return levels
    .filter(level => level !== 'auto' && Object.hasOwn(QUALITY_HEIGHTS, level))
    .sort((a, b) => QUALITY_HEIGHTS[b] - QUALITY_HEIGHTS[a])[0] ?? null;
}

export function resolveQuality(requested, availableLevels) {
  if (!Array.isArray(availableLevels) || availableLevels.length === 0) return null;
  if (requested === 'highest') return highestAvailableQuality(availableLevels);
  if (requested === 'auto') return availableLevels.includes('auto') ? 'auto' : null;
  if (availableLevels.includes(requested)) return requested;
  if (!Object.hasOwn(QUALITY_HEIGHTS, requested)) return null;

  const available = availableLevels.filter(level => Object.hasOwn(QUALITY_HEIGHTS, level));
  if (available.length === 0) return null;
  return available.reduce((closest, level) => {
    const distance = Math.abs(QUALITY_HEIGHTS[level] - QUALITY_HEIGHTS[requested]);
    const closestDistance = Math.abs(QUALITY_HEIGHTS[closest] - QUALITY_HEIGHTS[requested]);
    return distance < closestDistance ? level : closest;
  });
}

export function isKnownQuality(level) {
  return Object.hasOwn(QUALITY_HEIGHTS, level);
}
