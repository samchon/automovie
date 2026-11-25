/**
 * Caller-declared registration of already evaluated indexed source triangles.
 * Container inspection cannot establish these facts. A host loader applies node
 * transforms, evaluated deformation and unit conversion before this handoff.
 * The recovery package checks structure and finite values, not the truth of an
 * unknown pose or visibility mask. Unknown facts belong in uncertainty rather
 * than guesses.
 */
export interface IAutoMovieRecoveryRegistration {
  /** Positions reaching recovery are already millimetres. */
  units: "mm";

  /** Stable caller-defined physical coordinate-frame name. */
  frame: string;

  /** Engine cross products use a right-handed registered frame. */
  handedness: "right-handed";

  /** Already applied source-to-registered homogeneous matrix, column-major. */
  sourceToRegistered: [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
  ];

  /** Description or identity of the pose evaluated by the source loader. */
  evaluatedPose: string;

  /** Every component supplied by the evaluated host population is retained. */
  componentPolicy: "all-evaluated";

  /**
   * Unknown source visibility, material, transform or pose facts remain
   * explicit.
   */
  uncertainty: string[];
}
