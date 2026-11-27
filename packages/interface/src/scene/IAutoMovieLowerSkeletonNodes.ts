import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";

/** Data and callback contracts shared by the LowerSkeletonNodes operations. */
export namespace IAutoMovieLowerSkeletonNodes {
  /**
   * Lower an admitted skeleton into a fresh identity group root and bone rest
   * nodes. Prefixes concatenate onto node/parent ids and rootParent seats the
   * synthetic root under a placement. Root records are independent; bone rest
   * translation/rotation are borrowed and bone scales are fresh unit vectors.
   */
  export type IProps = {
    /** The rig to lower. */
    skeleton: IAutoMovieSkeleton;
    /** Node-id prefix for every lowered node. Defaults to `""` (bare names). */
    prefix?: string;
    /** Parent node id for the synthetic root, or `null` for a graph root. */
    rootParent?: string | null;
  };
}
