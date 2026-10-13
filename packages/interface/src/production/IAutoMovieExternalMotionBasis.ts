import { IAutoMovieExternalMotionBasisNode } from "./IAutoMovieExternalMotionBasisNode";

/**
 * Canonical byte-grounded coordinate and hierarchy basis for external motion.
 *
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
