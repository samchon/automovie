import {
  type IAutoMovieRecoilPush,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";

/*
 * Bridge an IAutoMovieImpact's impulse to a recoil
 * IAutoMovieRecoilPush: the missing consumer between collision response
 * and flinch. The impulse magnitude (N·s) scaled by `gainDegPerImpulse` becomes
 * the `flexion` the struck body yields; impactRecoil then bounds that
 * push by joint ROM and spreads it down the chain. Kept deliberately simple
 * (one dominant flexion axis): it is an AI hint, not a solved contact
 * response.
 */
export function impulseToRecoilPush(
  impulse: IAutoMovieVector3,
  gainDegPerImpulse: number,
): IAutoMovieRecoilPush {
  if (gainDegPerImpulse < 0)
    throw new RangeError(
      `recoil push gain must be >= 0, but was ${gainDegPerImpulse}`,
    );
  return { flexion: Vector3.length(impulse) * gainDegPerImpulse };
}
