/**
 * A part's exact skin attachment, in the host's millimetre coordinate frame.
 * The host spreads its displacement through neighbouring skin within reach.
 *
 * @author Samchon
 */
export interface IPortraitSkinConstraint {
  /** Existing host vertex identity, retained through assembly and subdivision. */
  vertex: number;

  /** Requested XYZ position of that shared attachment vertex, in millimetres. */
  target: number[];

  /** Maximum distance along the original skin over which surrounding skin adapts. */
  reach: number;
}
