import type { IAutoMovieTransform } from "../../geometry/IAutoMovieTransform";

/** One node of a motion source with the local rest basis read from its bytes. */
export interface IAutoMovieExternalMotionNodeInspection {
  /** `node_{index}`, the id tracks and source-rig mappings cite. */
  id: string;

  /** Zero-based node index in the inspected glTF revision. */
  index: number;

  /** Declared name when non-empty, otherwise `null`. */
  name: string | null;

  /** Id of the node listing this one as a child, or `null` for a root. */
  parent: string | null;

  /**
   * Caller-owned parent-local rest TRS in metres, right-handed Y-up. Ingest
   * uses zero translation, identity quaternion and unit scale for absent
   * fields; present components must be finite, scale positive, and quaternion
   * magnitude within 1e-4 of one before normalization. Matrix-authored nodes
   * are refused.
   */
  transform: IAutoMovieTransform;
}
