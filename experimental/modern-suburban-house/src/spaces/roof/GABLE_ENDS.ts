/** Front gable wall ends a, b on the front wall Z = 0 (roof-mass-allocation). */

export const GABLE_ENDS = (() => {
  const a = -5.75;
  const b = -1.8;
  return { a, b, center: (a + b) / 2 } as const;
})();
