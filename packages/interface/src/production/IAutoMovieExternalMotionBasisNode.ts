import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";

/**
 * One node basis inspected directly from external motion source bytes.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalMotionBasisNode {
  /** Zero-based node index in the inspected glTF scene. */
  nodeIndex: number;

  /**
   * Stable normalized node identity used by motion channels and parent links.
   */
  id: string;

  /** Source-authored node name, or null when the node is unnamed. */
  sourceName: string | null;

  /** Parent normalized node identity, or null for a source root. */
  parent: string | null;

  /** Normalized parent-local rest transform inspected from the source node. */
  localRest: IAutoMovieTransform;
}
