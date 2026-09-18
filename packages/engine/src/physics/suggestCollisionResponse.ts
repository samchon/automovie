import { AutoMovieHumanoidBone, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";
import { resolveImpact } from "./resolveImpact";
import { impactRecoil } from "./impactRecoil";
import { impulseToRecoilPush } from "./impulseToRecoilPush";
import { IAutoMovieCollisionResponse } from "./IAutoMovieCollisionResponse";

/**
 * Suggest how a collision resolves: run {@link resolveImpact} for the impulse,
 * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
 * given) bound that push by joint ROM into a flinch pose via
 * {@link impactRecoil}. This is the reusable core the pipeline (and
 * {@link detectBodyCollision}) attaches to a contact warning; it wires together
 * resolveImpact and impactRecoil, whose consumer was previously missing.
 *
 * @evidence requirements/effects-and-simulation/rigid-motion-ballistics-and-collision.md#effects-impact-consequence Resolves contact into impulse, reaction cue, and optional bounded flinch.
 * @evidence specifications/simulation-effects-and-sound/rigid-collision-and-damage.md#collision-proxy-and-world-contact-output Connects the world-contact output to the reaction consumer.
 * @author Samchon
 */
export const suggestCollisionResponse = (props: {
  /** The struck actor's colliding body (mass, velocity, material). */
  a: IAutoMovieImpactBody;
  /** The other colliding body. */
  b: IAutoMovieImpactBody;
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
}): IAutoMovieCollisionResponse => {
  const impact = resolveImpact(props.a, props.b, props.normal);
  const push = impulseToRecoilPush(impact.impulse, props.gainDegPerImpulse);
  const recoil =
    props.chain !== undefined && props.skeleton !== undefined
      ? impactRecoil(push, props.chain, props.skeleton, props.falloff)
      : null;
  return { impact, push, recoil };
};
