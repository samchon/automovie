/** Local band; a higher roof elsewhere on the same host cannot conceal this station. */

export const localUpperBand = (
  hostTop: number, first: { physical: number; volume: number; }, second: { physical: number; volume: number; }
): number => {
  const upperVolume = first.physical < second.physical ? second.volume : first.volume;
  return Math.max(0, Math.min(hostTop, upperVolume) - Math.min(first.physical, second.physical));
};
