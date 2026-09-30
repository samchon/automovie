import type { IControlMesh } from "../../mesh/structures/IControlMesh";

/**
 * A component's reserved region replaced after the host has refined its skin.
 * The append operation receives the actual oriented boundary and preserves its
 * resident vertex identities. It adds source geometry and its joining faces;
 * it does not move or remove surviving host vertices or unrelated faces.
 * An appender also extends any resident reference/RGB attributes in the same
 * vertex order. The head assembler pairs current and reference appenders.
 *
 * @author Samchon
 */
export interface IPortraitRegionReplacement {
  /** Unique reserved face-region label, inherited through host subdivision. */
  group: number;

  /** Append owned millimetre geometry against the fixed refined host boundary. */
  append: (cage: IControlMesh, boundary: readonly number[]) => void;
}
