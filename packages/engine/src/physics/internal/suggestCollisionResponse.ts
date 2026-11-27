import type {
  IAutoMovieCollisionResponse,
  IAutoMovieImpact,
  IAutoMoviePose,
  IAutoMovieRecoilPush,
  IAutoMovieSuggestCollisionResponse,
} from "@automovie/interface";

import { impactRecoil } from "./impactRecoil";
import { impulseToRecoilPush } from "./impulseToRecoilPush";
import { resolveImpact } from "./resolveImpact";

/*
 * Suggest how a collision resolves: run resolveImpact for the impulse,
 * bridge it to a recoil push, and (when a struck `chain` + `skeleton` are
 * given) bound that push by joint ROM into a flinch pose via
 * impactRecoil. This is the reusable core the pipeline (and
 * detectBodyCollision) attaches to a contact warning; it wires together
 * resolveImpact and impactRecoil, whose consumer was previously missing.
 */
export function suggestCollisionResponse(
  props: IAutoMovieSuggestCollisionResponse.IProps,
): IAutoMovieCollisionResponse {
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
}
