import { IAutoMovieExternalMotionBasisNode } from "./IAutoMovieExternalMotionBasisNode";

/**
 * Canonical byte-grounded coordinate and hierarchy basis for external motion.
 *
 * @evidence contracts/common.md#principled-implementation A versioned metre, right-handed, Y-up record declares inspected hierarchy and rest transforms independently of semantic bone labels. Current-byte inspection and truthful ordering are host premises; the retired production inventory no longer verifies these declarations automatically.
 * @evidence contracts/common.md#clear-and-simple-design Coordinate convention lives once around a stable source-index node list, avoiding per-node unit flags or duplicated source-name mappings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Authored bone labels cannot replace the inspected source hierarchy or local rest basis, and ingestion does not treat a matching filename as proof of coordinate compatibility.
 * @evidence contracts/common.md#meaningful-documentation Gives the basis protocol, metre units, handedness, vertical axis and stable inspected node ordering that adoption must preserve.
 * @author Samchon
 */
export interface IAutoMovieExternalMotionBasis {
  /** Versioned canonical basis profile. */
  profile: "gltf-motion-basis-v1";

  /** Canonical length unit of normalized translations. */
  lengthUnit: "meter";

  /** Canonical coordinate handedness. */
  handedness: "right-handed";

  /** Canonical vertical axis. */
  upAxis: "Y-up";

  /** Inspected nodes in stable source index order. */
  nodes: IAutoMovieExternalMotionBasisNode[];
}
