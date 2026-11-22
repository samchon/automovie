import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";

/**
 * A swing's path between its footholds: on the ground at both ends, carried under the body between them.
 *
 * Two paths run between the lifting and the landing foothold. On the ground, the hoof moves along the chord between them by the swing's eased share, so it leaves and lands at rest in the world. Under the body, the lifting foothold is read in the body frame of its release and the landing foothold in the body frame of its touchdown, blended there and carried by the current body, so the hoof stays within the limb's reach as the body moves on. The swing follows the ground path at its ends and the body path mid-swing, blended by `weight`, which is zero at both ends: the two paths coincide there, so the hoof's world velocity at liftoff and touchdown is the ground path's, zero, and mid-swing it is where the limb reaches. A hoof in the air never bounds the trunk; the ride pose brings it within reach (`QuadrupedRidePose`), so a landing foothold that lies beyond the limb's reach until the body arrives is met as the limb allows and the hoof is not yet at rest there: the known limit of the limbs' forward reach. Its height follows the world chord between the footholds, so ground it rises over keeps its world height. A straight course gives the same path whether the track is one-dimensional or world-anchored, since both footholds then sit at fixed offsets in either frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States both paths, the blend, its end conditions, the height and the straight-course equivalence.
 * @evidence contracts/development/design.md#principled-representation Two world footholds, two body placements, the current body and a share.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `QuadrupedHoofTrack.target` for both tracks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The weight's end conditions are the rest at liftoff and touchdown; nothing is tuned.
 */
export namespace QuadrupedSwingChord {
  /**
   * The body path's share of a swing at its eased share: 1 − (1 − sin(π s))², zero at both ends, one mid-swing, rising fast after liftoff and falling late before touchdown. Zero end velocity needs only the zero ends: the paths coincide there, so the weight's own slope multiplies a vanishing difference.
   *
   * @param amount The swing's eased share, 0 to 1.
   * @returns The weight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the profile.
   * @evidence contracts/development/implementation.md#principled-implementation A smooth symmetric weight vanishing at both ends, steep there so the hoof rejoins the body path soon after breakover.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(amount: number): number {
    const s: number = Math.sin(Math.PI * amount);
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
   * @evidence contracts/development/implementation.md#principled-implementation (1 − w) ground + w body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by both tracks.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function blend(ground: number, body: number, amount: number): number {
    const w: number = weight(amount);
    return ground + (body - ground) * w;
  }

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
   * @evidence contracts/development/implementation.md#principled-implementation The ground path is the world chord by the share; the body path is each foothold in its own instant's body frame, blended by the share and carried by the current body; the two are blended by `weight`, the height kept on the world chord.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two paths, one blend.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `blend` with the one-dimensional track.
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
    const ground: IAutoMovieVector3 = Vector3.lerp(lifting, landing, amount);
    const body: IAutoMovieVector3 = Vector3.add(
      current.translation,
      Quaternion.rotateVector(
        current.rotation,
        Vector3.lerp(local(lifting, released), local(landing, touched), amount),
      ),
    );
    return {
      x: blend(ground.x, body.x, amount),
      y: ground.y,
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
