/**
 * A part's exact skin attachment, in the host's millimetre coordinate frame.
 * The host spreads its displacement through neighbouring skin within reach.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Declares one exact component-to-skin attachment and its connected influence reach.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Binds a retained host vertex to a finite millimetre target and maximum skin-travel distance.
 */
export interface IPortraitSkinConstraint {
  /** Existing host vertex identity, retained through assembly and subdivision. */
  vertex: number;

  /** Requested XYZ position of that shared attachment vertex, in millimetres. */
  target: number[];

  /** Maximum distance along the original skin over which surrounding skin adapts. */
  reach: number;
}
