import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanSide } from "../human/AutoMovieHumanSide";
import type { IAutoMovieMotionHumanActionLaw } from "./IAutoMovieMotionHumanActionLaw";
import type { IAutoMovieMotionHumanMutual } from "./IAutoMovieMotionHumanMutual";

/** A paired screen transfer between two named scene seats. */
export interface IAutoMovieMotionHumanAssistedTransfer {
  /** The staged seat the receiver already sits on. */
  from: IAutoMovieMotionHumanAssistedTransfer.ISeatReference;

  /** The destination seat to bear on before the final release. */
  to: IAutoMovieMotionHumanAssistedTransfer.ISeatReference;

  /** Desired clasp point in world metres. The helper follows the reached palm. */
  clasp: IAutoMovieVector3;

  /** The facing hand of each performer. Defaults to right. */
  hand?: AutoMovieHumanSide;

  /**
   * Seconds for each of the seven contact phases, so the transfer takes seven
   * times it; 0.55 s when absent, 3.9 s in all (`HumanAssistedTransfer`;
   * provisional, no source). The clasp is taken at 1.5 times it and released at
   * 6 times.
   */
  seconds?: number;
}

/** The staged supports and role-specific parameters of the paired transfer. */
export namespace IAutoMovieMotionHumanAssistedTransfer {
  /** Which actor contributes the standing support. */
  export type Role = "helper" | "helped";

  /** A bounded seat affordance on an existing prop. */
  export interface ISeatReference {
    /** Staged prop identity. */
    prop: string;

    /** Seat affordance id on that prop. */
    point: string;

    /** Offset along the seat front edge in model metres. Defaults to its middle. */
    along?: number;
  }

  /** One of the two configured bodies in the same transfer. */
  export interface IRoleParams extends IAutoMovieMotionHumanAssistedTransfer {
    /** Role received from the mutual cast. */
    role: Role;

    /** Subject of the other actor. */
    partner: string;
  }

  /** The per-role transfer law and the mutual action that casts both roles. */
  export interface ILaw extends IAutoMovieMotionHumanActionLaw<IRoleParams> {
    /** The mutual action that casts the helper and the helped. */
    mutual: IAutoMovieMotionHumanMutual<
      IAutoMovieMotionHumanAssistedTransfer,
      Role
    >;
  }
}
