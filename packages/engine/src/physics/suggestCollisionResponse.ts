import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieCollisionResponse } from "./IAutoMovieCollisionResponse";
import type { IAutoMovieImpact } from "./IAutoMovieImpact";
import { IAutoMovieImpactBody } from "./IAutoMovieImpactBody";
import type { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";
import { impactRecoil } from "./impactRecoil";
import { impulseToRecoilPush } from "./impulseToRecoilPush";
import { resolveImpact } from "./resolveImpact";

/**
 * Suggest how a collision resolves: run {@link resolveImpact} for the impulse,
 * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
 * given) bound that push by joint ROM into a flinch pose via
 * {@link impactRecoil}. This is the reusable core the pipeline (and
 * {@link detectBodyCollision}) attaches to a contact warning; it wires together
 * resolveImpact and impactRecoil, whose consumer was previously missing.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Compose resolveImpact, magnitude-to-flexion conversion and optional chain recoil; the result predicts normal velocities and a constrained pose target rather than a coupled rigid-body animation.
 * @evidence contracts/common.md#clear-and-simple-design Each helper owns one responsibility: impact mechanics, gain conversion and skeletal constraint response; absent chain or skeleton gives a null flinch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Direction is lost at the magnitude-only push seam, so the struck-body label does not imply directional pose physics; no consumer-specific pose correction is added.
 * @evidence contracts/common.md#meaningful-documentation Docs describe response/impulse units, explicit gain and optional rig requirements; admission failures and helper exceptions propagate.
 * @evidence contracts/performance.md#efficient-algorithms Mechanics/conversion are O(1); an available C-bone chain adds impactRecoil's O(CB) skeleton lookup and O(C) pose output.
 * @evidence contracts/performance.md#reuse-equivalent-work The computed impact impulse is passed directly to the push conversion in this call; no cross-request cache assumes mutable body or rig equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned aggregate owns its new response/push/pose records except documented borrowed no-closing velocities; no ongoing physical state or handle is retained.
 */
export const suggestCollisionResponse: (props: {
  /** The struck actor's colliding body (mass, velocity, material). */ a: IAutoMovieImpactBody;
  /** The other colliding body. */ b: IAutoMovieImpactBody;
  /** Unit contact normal from `a` toward `b`. */ normal: IAutoMovieVector3;
  /** Degrees of recoil flexion per unit impulse. */ gainDegPerImpulse: number;
  /** Struck bone chain (contact bone toward the body), for the flinch pose. */ chain?: AutoMovieHumanoidBone[];
  /** Skeleton the flinch is bounded against. */ skeleton?: IAutoMovieSkeleton;
  /** Flinch falloff down the chain. Defaults to `impactRecoil`'s default. */ falloff?: number;
}) => IAutoMovieCollisionResponse = (props: {
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
  const impact: IAutoMovieImpact = resolveImpact(
    props.a,
    props.b,
    props.normal,
  );
  const push: IAutoMovieRecoilPush = impulseToRecoilPush(
    impact.impulse,
    props.gainDegPerImpulse,
  );
  const recoil: IAutoMoviePose | null =
    props.chain !== undefined && props.skeleton !== undefined
      ? impactRecoil(push, props.chain, props.skeleton, props.falloff)
      : null;
  return { impact, push, recoil };
};
