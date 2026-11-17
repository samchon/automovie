import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieHumanoidBone } from "../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSkeleton } from "../skeleton/IAutoMovieSkeleton";
import type { IAutoMovieImpactBodyState } from "./IAutoMovieImpactBodyState";

/**
 * Suggest how a collision resolves: run {@link resolveImpact} for the impulse, bridge it to a recoil push, and (when a struck `chain` + `skeleton` are given) bound that push by joint ROM into a flinch pose via {@link impactRecoil}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the two impact bodies, normal, recoil gain and optional rig-bounded flinch context.
 * @evidence contracts/development/design.md#principled-representation Impact states carry SI mass/velocity; the unit world normal points from a to b and recoil gain is clinical degrees per N s.
 * @evidence contracts/development/design.md#minimal-and-owned-surface suggestCollisionResponse reuses resolveImpact and impactRecoil for collision diagnostics; skeleton and chain remain canonical humanoid contracts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A flinch requires both optional chain and skeleton at runtime; this suggestion is neither an applied physical impulse nor a guaranteed valid performed pose.
 */
export namespace IAutoMovieSuggestCollisionResponse {
  /**
   * Suggest how a collision resolves: run {@link resolveImpact} for the impulse,
   * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
   * given) bound that push by joint ROM into a flinch pose via
   * {@link impactRecoil}. This is the reusable core the pipeline (and
   * {@link detectBodyCollision}) attaches to a contact warning; it wires together
   * resolveImpact and impactRecoil.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Specifies the two impact bodies, normal, recoil gain and optional rig-bounded flinch context.
   * @evidence contracts/development/design.md#principled-representation Impact states carry SI mass/velocity; the unit world normal points from a to b and recoil gain is clinical degrees per N s.
   * @evidence contracts/development/design.md#minimal-and-owned-surface suggestCollisionResponse reuses resolveImpact and impactRecoil for collision diagnostics; skeleton and chain remain canonical humanoid contracts.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A flinch requires both optional chain and skeleton at runtime; this suggestion is neither an applied physical impulse nor a guaranteed valid performed pose.
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
