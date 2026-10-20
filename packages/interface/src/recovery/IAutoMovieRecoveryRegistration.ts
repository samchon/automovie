/**
 * Caller-declared registration of already evaluated indexed source triangles.
 * Container inspection cannot establish these facts. A host loader applies node
 * transforms, evaluated deformation and unit conversion before this handoff. The
 * recovery package checks structure and finite values, not the truth of an unknown
 * pose or visibility mask. Unknown facts belong in uncertainty rather than guesses.
 *
 * @evidence contracts/common.md#principled-implementation Explicit physical coordinates, transform provenance and evaluated component policy distinguish a registered mesh from container inspection metadata.
 * @evidence contracts/common.md#clear-and-simple-design This pure record carries host assertions without a decoder, renderer, filesystem or numerical dependency.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The record supplies no automatic pose, hidden component filtering, frame guess or source normal fallback.
 * @evidence contracts/common.md#meaningful-documentation States millimetres, handedness, transform layout, evaluated pose and uncertainty limits.
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

  /** Unknown source visibility, material, transform or pose facts remain explicit. */
  uncertainty: string[];
}
