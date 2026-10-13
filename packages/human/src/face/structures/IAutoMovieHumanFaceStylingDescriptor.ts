/**
 * Product-neutral metadata for one named hair or skin appearance trait.
 * Null endpoints mean no numerical bound from the runtime owner. Open bounds
 * are preserved explicitly, and dependent rules remain visible rather than
 * becoming invented universal slider limits. A current value comes from the
 * document reader, never a universal person's anatomical default.
 *
 * @evidence contracts/common.md#principled-implementation Shared hair/facial-shaft/skin catalogues expose the runtime owner's units, open/closed bounds, choices and dependent rules; current values remain with the numerical document readers.
 * @evidence contracts/common.md#clear-and-simple-design Path/label/unit, scalar interval, closed choices and qualification are independent metadata rather than one guessed universal slider range.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Null bounds do not become fabricated finite limits, scalar intervals do not replace coupled runtime admission, and styling metadata supplies no physiological default or clinical population calibration.
 * @evidence contracts/common.md#meaningful-documentation Exclusive flags, optional step and visible dependency/qualification explain the exact numerical authoring domain without converting units.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This descriptor performs no document update or styling validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared metadata catalogues are data ownership, not evaluated geometry caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Strings/scalars/choice arrays create no hair meshes, skin textures or editor task.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceStylingDescriptor {
  /** Relative path beneath one population's traits, terminal-shaft profile or named skin area. */
  path: readonly string[];

  /** Human-readable meaning of the control. */
  label: string;

  /** The owner's unit, such as mm, micrometres, degrees, count, ratio or choice, without conversion. */
  unit: string;

  /** Numerical minimum; null means no scalar bound. */
  minimum: number | null;

  /** Numerical maximum; null means no finite upper bound. */
  maximum: number | null;

  /** Whether equality at the numerical minimum is refused. */
  minimumExclusive?: boolean;

  /** Whether equality at the numerical maximum is refused. */
  maximumExclusive?: boolean;

  /** Numerical entry step when supplied by the owner; admission still enforces its domain. */
  step?: number | null;

  /** Closed permitted choices for an enum control. */
  choices?: readonly string[];

  /** Runtime dependent condition that a standalone interval cannot express. */
  dependentRule?: string;

  /** Value qualification and supported meaning, shown with the control. */
  qualification: string;
}
