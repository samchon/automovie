import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImpactBodyState } from "./IAutoMovieImpactBodyState";

/**
 * Suggest how a collision resolves: run {@link resolveImpact} for the impulse,
 * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
 * given) bound that push by joint ROM into a flinch pose via
 * {@link impactRecoil}.
 */
export namespace IAutoMovieSuggestCollisionResponse {
  /**
   * Suggest how a collision resolves: run {@link resolveImpact} for the impulse,
   * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
   * given) bound that push by joint ROM into a flinch pose via
   * {@link impactRecoil}. This is the reusable core the pipeline (and
   * {@link detectBodyCollision}) attaches to a contact warning; it wires
   * together resolveImpact and impactRecoil.
   */
  export type IProps = {
    /** The struck actor's colliding body (mass, velocity, material). */
    a: IAutoMovieImpactBodyState;
    /** The other colliding body. */
    b: IAutoMovieImpactBodyState;
    /** Unit contact normal from `a` toward `b`. */
    normal: IAutoMovieVector3;
    /** Degrees of recoil flexion per unit impulse. */
    gainDegPerImpulse: number;
    /** Struck bone chain (contact bone toward the body), for the flinch pose. */
    chain?: AutoMovieHumanoidBone[];
    /** Skeleton the flinch is bounded against. */
    skeleton?: IAutoMovieSkeleton;
    /** Flinch falloff down the chain. Defaults to `impactRecoil`'s default. */
    falloff?: number;
  };
}
