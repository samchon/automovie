/**
 * Product-neutral metadata for one named hair or skin appearance trait.
 * Null endpoints mean no numerical bound from the runtime owner. Open bounds
 * are preserved explicitly, and dependent rules remain visible rather than
 * becoming invented universal slider limits. A current value comes from the
 * document reader, never a universal person's anatomical default.
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
