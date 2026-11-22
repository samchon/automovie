import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";

/**
 * A world-anchored swing's path between its footholds, the same path the one-dimensional track gives a straight course.
 *
 * The lifting foothold is read in the body frame of its release and the landing foothold in the body frame of its touchdown; the swing blends the two there by its eased share and the current body carries the blend, so the hoof moves under the body as the body moves on, not along a world chord the body outruns. On a straight course both footholds sit at fixed offsets in the body frame, so this is exactly the one-dimensional track's swing. Its height follows the world chord between the footholds, so ground it rises over keeps its world height. At both ends the hoof is on the ground and at rest in the world: the world chord between the footholds gives way to the body-carried path by weight, nil at both ends, as the one-dimensional track's does, so a hoof never drags on the ground it leaves or meets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both frames, the blend, the straight-course equivalence, the height and the rest at the swing's ends.
 * @evidence contracts/development/design.md#principled-representation Two world footholds, two body placements, the current body and a share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `QuadrupedHoofTrack.target` for both tracks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
 */
export namespace QuadrupedSwingChord {
  /**
   * The body's placement when a stance releases its hoof.
   *
   * @param stance The stance.
   * @returns Its release placement: read at release when the stance has it, else its touchdown placement carried along its own heading by the stance's travel, as a straight stance moves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States both cases.
   * @evidence contracts/development/implementation.md#principled-implementation A straight stance's body moves its travel along its heading.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One fallback.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A stance that read its release placement keeps it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh transform.
   */
  export function release(
    stance: QuadrupedHoofTrack.IStance,
  ): IAutoMovieTransform {
    return (
      stance.lifted ?? {
        ...stance.landed.placement,
        translation: Vector3.add(
          stance.landed.placement.translation,
          Quaternion.rotateVector(stance.landed.placement.rotation, {
            x: 0,
            y: 0,
            z: stance.travel,
          }),
        ),
      }
    );
  }

  /**
   * The body path's share of a swing at its eased share: 1 - (1 - sin(pi s))^2, nil at both ends and one mid-swing, rising fast after liftoff and falling late before touchdown. The hoof's end velocity is nil with the ends alone: there the ground path and the body path meet at the foothold.
   *
   * @param amount The swing's eased share, 0 to 1.
   * @returns The weight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the profile and its end conditions.
   * @evidence contracts/development/implementation.md#principled-implementation A smooth symmetric weight vanishing at both ends, so the hoof leaves and lands at rest in the world and joins the body path soon after.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(amount: number): number {
    const s: number = Math.sin(Math.PI * Math.min(1, Math.max(0, amount)));
    return s * (2 - s);
  }

  /**
   * One coordinate of a swing: the ground path's and the body path's, blended by `weight`.
   *
   * @param ground The ground path's coordinate.
   * @param body The body path's coordinate.
   * @param amount The swing's eased share.
   * @returns The blended coordinate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the blend.
   * @evidence contracts/development/implementation.md#principled-implementation (1 - w) ground + w body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the world-anchored and the one-dimensional track.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(ground: number, body: number, amount: number): number {
    return ground + (body - ground) * weight(amount);
  }

  /**
   * A world-anchored swinging hoof's world point.
   *
   * @param current The body's current placement.
   * @param lifting The lifting foothold, world.
   * @param released The body's placement at release.
   * @param landing The landing foothold, world.
   * @param touched The body's placement at touchdown.
   * @param amount The swing's eased share, 0 to 1.
   * @returns The world point.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames and the share.
   * @evidence contracts/development/implementation.md#principled-implementation Each foothold in its own instant's body frame, blended by the share, carried by the current body, giving way at both ends to the world chord by weight; the height blended in the world.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two frame reads, one blend, one carry.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh point.
   */
  export function carried(
    current: IAutoMovieTransform,
    lifting: IAutoMovieVector3,
    released: IAutoMovieTransform,
    landing: IAutoMovieVector3,
    touched: IAutoMovieTransform,
    amount: number,
  ): IAutoMovieVector3 {
    const body: IAutoMovieVector3 = Vector3.add(
      current.translation,
      Quaternion.rotateVector(
        current.rotation,
        Vector3.lerp(local(lifting, released), local(landing, touched), amount),
      ),
    );
    // On the ground at both ends the hoof is at rest in the world: the world
    // chord's point gives way to the body-carried one by weight.
    const ground: IAutoMovieVector3 = Vector3.lerp(lifting, landing, amount);
    return {
      x: blend(ground.x, body.x, amount),
      y: lifting.y + (landing.y - lifting.y) * amount,
      z: blend(ground.z, body.z, amount),
    };
  }

  /** A world point in a body frame. */
  function local(
    point: IAutoMovieVector3,
    frame: IAutoMovieTransform,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(frame.rotation),
      Vector3.subtract(point, frame.translation),
    );
  }
}
