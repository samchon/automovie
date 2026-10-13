/**
 * Linear interpolation of one scalar, `from · (1 − progress) + to · progress`.
 *
 * This weighted form returns `from` exactly at `progress = 0` and `to` exactly
 * at `progress = 1`, so a formation cue lands on its authored end value without
 * rounding drift. `progress` is not clamped; values outside `[0, 1]`
 * extrapolate along the same line. The formation samplers and slot positions
 * use it for every interpolated coordinate and heading.
 *
 * @param from Value at `progress = 0`.
 * @param to Value at `progress = 1`.
 * @param progress Interpolation fraction, normally in `[0, 1]`.
 *
 * @evidence contracts/common.md#principled-implementation The two-weight form of linear interpolation, which is exact at both endpoints in floating point because `1 − 0` and `1 − 1` are exact and a product with zero vanishes, unlike `from + (to − from) · progress`, which can miss `to` at one; it premises finite inputs and leaves an infinite input to propagate.
 * @evidence contracts/common.md#clear-and-simple-design One scalar helper shared by the formation motion samplers and `formationSlotPosition`, so every formation coordinate interpolates by the same rule.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No clamp, easing or caller-specific case; extrapolation outside `[0, 1]` is stated rather than hidden.
 * @evidence contracts/common.md#meaningful-documentation States the formula, the exact-endpoint property and why it matters, that progress is unclamped, and who uses it.
 * @evidence contracts/performance.md#efficient-algorithms Two multiplications, one subtraction and one addition with no allocation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure function of three numbers that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Allocates and retains nothing.
 * @author Samchon
 */
export const lerp = (from: number, to: number, progress: number): number =>
  from * (1 - progress) + to * progress;
