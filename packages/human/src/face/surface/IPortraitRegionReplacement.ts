import type { IControlMesh } from "../mesh/IControlMesh";

/**
 * A component's reserved region replaced after the host has refined its skin.
 * The append operation receives the actual oriented boundary and preserves its
 * resident vertex identities. It adds source geometry and its joining faces;
 * it does not move or remove surviving host vertices or unrelated faces.
 * An appender also extends any resident reference/RGB attributes in the same
 * vertex order. The head assembler pairs current and reference appenders.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Assigns a component a reserved refined-skin region and its owned appended geometry.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-attachments Binds one nonnegative region label to an append operation that receives the fixed oriented host boundary.
 */
export interface IPortraitRegionReplacement {
  /** Unique reserved face-region label, inherited through host subdivision. */
  group: number;
  /** Append owned millimetre geometry against the fixed refined host boundary. */
  append: (cage: IControlMesh, boundary: readonly number[]) => void;
}
