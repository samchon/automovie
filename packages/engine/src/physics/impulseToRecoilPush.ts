import { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieRecoilPush } from "./IAutoMovieRecoilPush";

/**
 * Bridge an {@link IAutoMovieImpact}'s impulse to a recoil
 * {@link IAutoMovieRecoilPush}: the missing consumer between collision response
 * and flinch. The impulse magnitude (N·s) scaled by `gainDegPerImpulse` becomes
 * the `flexion` the struck body yields; {@link impactRecoil} then bounds that
 * push by joint ROM and spreads it down the chain. Kept deliberately simple
 * (one dominant flexion axis): it is an AI hint, not a solved contact
 * response.
 *
 *
 * @evidence contracts/common.md#principled-implementation Euclidean impulse magnitude multiplied by a finite nonnegative degree-per-impulse gain becomes flexion; direction is deliberately discarded by this existing scalar response policy.
 * @evidence contracts/common.md#clear-and-simple-design Conversion of collision magnitude into a pose target is separate from resolveImpact's mechanics and impactRecoil's constraint projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no per-actor gain override hidden here; the caller supplies gain explicitly. Finite impulse admission is upstream, and extreme multiplication can overflow.
 * @evidence contracts/common.md#meaningful-documentation Docs give gain units, nonnegative finite admission, magnitude-only flexion and thrown invalid gain.
 * @evidence contracts/performance.md#efficient-algorithms One three-component norm and multiplication take O(1) time and one returned scalar record.
 * @evidence contracts/performance.md#reuse-equivalent-work Vector3 owns the norm formula; no push is reused across distinct impulse/gain pairs or mutable inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the returned push and no impact history, callback or native resource is retained.
 */
export const impulseToRecoilPush: (
  impulse: IAutoMovieVector3,
  gainDegPerImpulse: number,
) => IAutoMovieRecoilPush = (
  impulse: IAutoMovieVector3,
  gainDegPerImpulse: number,
): IAutoMovieRecoilPush => {
  if (!Number.isFinite(gainDegPerImpulse))
    throw new RangeError(
      `recoil push gain must be finite, but was ${gainDegPerImpulse}`,
    );
  if (gainDegPerImpulse < 0)
    throw new RangeError(
      `recoil push gain must be >= 0, but was ${gainDegPerImpulse}`,
    );
  return { flexion: Vector3.length(impulse) * gainDegPerImpulse };
};
