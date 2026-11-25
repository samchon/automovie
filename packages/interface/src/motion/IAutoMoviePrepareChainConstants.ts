import type { IAutoMovieQuaternion } from "../geometry/IAutoMovieQuaternion";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMovieJointRotationDomain } from "../pose/IAutoMovieJointRotationDomain";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMoviePlantChain } from "./IAutoMoviePlantChain";
import type { IAutoMoviePrepareChainRigConstants } from "./IAutoMoviePrepareChainRigConstants";

/**
 * Contracts of `prepareChainConstants`: one limb chain's fixed rest geometry
 * and rig readers.
 */
export namespace IAutoMoviePrepareChainConstants {
  /** A chain's rig constants. */
  export interface IConstants {
    /** The chain. */
    chain: IAutoMoviePlantChain;

    /**
     * The root bone's parent; null when the root bone hangs from the pose's
     * root.
     */
    parent: AutoMovieHumanoidBone | null;

    /** The root bone's rest translation in its parent's frame, metres. */
    upperTranslation: IAutoMovieVector3;

    /** The root bone's rest rotation in its parent's frame. */
    upperRotation: IAutoMovieQuaternion;

    /** The mid bone's place in the root bone's frame, metres. */
    lowerOffset: IAutoMovieVector3;

    /** The mid bone's rest rotation in the root bone's frame. */
    lowerRotation: IAutoMovieQuaternion;

    /** The end bone's place in the mid bone's frame, metres. */
    effectorOffset: IAutoMovieVector3;

    /** The end bone's rest rotation in the mid bone's frame. */
    effectorBaseRotation: IAutoMovieQuaternion;

    /** The mid joint's hinge axis in the mid bone's frame, unit. */
    hinge: IAutoMovieVector3;

    /** The root joint's range. */
    upperDomain: IAutoMovieJointRotationDomain;

    /** The mid joint's range. */
    lowerDomain: IAutoMovieJointRotationDomain;

    /**
     * The fit's rig-only readers (`prepareChainRigConstants`) over this
     * record's skeleton, clinical axes and rest frames, handed by
     * `placeChainPlant` to each chain it places; a fit of such a chain must
     * pass those same tables.
     */
    rig: IAutoMoviePrepareChainRigConstants.IRig;
  }
}
