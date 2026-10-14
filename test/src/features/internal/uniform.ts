/**
 * Consume one caller-owned draw and apply min + (max - min) * draw. The ROM
 * sweep supplies its seeded [0,1) generator and finite -200/200 angle bounds.
 *
 * The helper preserves the original arithmetic and admits no ranges itself;
 * rounding or overflow for other inputs is not an independently checked
 * distribution or physical range. It owns no random state or retained result.
 */
export const uniform: (rng: () => number, min: number, max: number) => number =
  (rng: () => number, min: number, max: number): number =>
    min + (max - min) * rng();
