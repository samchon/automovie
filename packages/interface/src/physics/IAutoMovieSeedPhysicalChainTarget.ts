import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { IAutoMoviePhysicalProfile } from "./IAutoMoviePhysicalProfile";

/** Data and callback contracts shared by the SeedPhysicalChainTarget operations. */
export namespace IAutoMovieSeedPhysicalChainTarget {
  /**
   * Seed a straight-chain singularity with the shared triangle solver, through bounded coordinates only.
   */
  export type IInput = {
    /** Admitted tree and coordinate bounds. */ profile: IAutoMoviePhysicalProfile;
    /** Declared proximal-to-distal chain. */ chain: readonly string[];
    /** Working motor goals, mutated only through rotate. */ targets: Record<
      string,
      IAutoMoviePhysicalProfile.ITransform
    >;
    /** Requested support endpoint. */ goal: IAutoMovieVector3;
    /** Bone-local terminal endpoint, metres. */ localPoint?: IAutoMovieVector3;
    /** Metre degeneracy threshold. */ tolerance: number;
    /** The caller's range-limited subtree update. */ rotate: (
      joint: IAutoMoviePhysicalProfile.IJoint,
      axis: IAutoMoviePhysicalProfile.IAxis,
      request: number,
    ) => void;
  };
}
