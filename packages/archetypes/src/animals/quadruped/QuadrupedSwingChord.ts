import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { QuadrupedHoofTrack } from "./QuadrupedHoofTrack";

/*
 * A world-anchored swing's path between its footholds, the same path the
 * one-dimensional track gives a straight course.
 *
 * The lifting foothold is read in the body frame of its release and the landing
 * foothold in the body frame of its touchdown; the swing blends the two there
 * by its eased share and the current body carries the blend, so the hoof moves
 * under the body as the body moves on, not along a world chord the body
 * outruns. On a straight course both footholds sit at fixed offsets in the body
 * frame, so this is exactly the one-dimensional track's swing. Its height
 * follows the world chord between the footholds, so ground it rises over keeps
 * its world height. At both ends the hoof is on the ground and at rest in the
 * world: the world chord between the footholds gives way to the body-carried
 * path by weight, nil at both ends, as the one-dimensional track's does, so a
 * hoof never drags on the ground it leaves or meets.
 */
export namespace QuadrupedSwingChord {
  /*
   * The body's placement when a stance releases its hoof.
   * Parameter stance: The stance.
   * Returns: Its release placement: read at release when the stance has it,
   * else its touchdown placement carried along its own heading by the
   * stance's travel, as a straight stance moves.
   */
  export function release(
    stance: QuadrupedHoofTrack.IStance,
  ): IAutoMovieTransform {
    return (
      stance.lifted ?? {
        ...stance.landed.placement,
        translation: AutoMovieEngineVector3.add(
          stance.landed.placement.translation,
          AutoMovieEngineQuaternion.rotateVector(stance.landed.placement.rotation, {
            x: 0,
            y: 0,
            z: stance.travel,
          }),
        ),
      }
    );
  }

  /*
   * The body path's share of a swing at its eased share: 1 - (1 - sin(pi s))^2,
   * nil at both ends and one mid-swing, rising fast after liftoff and falling
   * late before touchdown. The hoof's end velocity is nil with the ends alone:
   * there the ground path and the body path meet at the foothold.
   * Parameter amount: The swing's eased share, 0 to 1.
   * Returns: The weight.
   */
  export function weight(amount: number): number {
    const s: number = Math.sin(Math.PI * Math.min(1, Math.max(0, amount)));
    return s * (2 - s);
  }

  /*
   * One coordinate of a swing: the ground path's and the body path's, blended
   * by `weight`.
   * Parameter ground: The ground path's coordinate.
   * Parameter body: The body path's coordinate.
   * Parameter amount: The swing's eased share.
   * Returns: The blended coordinate.
   */
  export function blend(ground: number, body: number, amount: number): number {
    return ground + (body - ground) * weight(amount);
  }

  /*
   * A world-anchored swinging hoof's world point.
   * Parameter current: The body's current placement.
   * Parameter lifting: The lifting foothold, world.
   * Parameter released: The body's placement at release.
   * Parameter landing: The landing foothold, world.
   * Parameter touched: The body's placement at touchdown.
   * Parameter amount: The swing's eased share, 0 to 1.
   * Returns: The world point.
   */
  export function carried(
    current: IAutoMovieTransform,
    lifting: IAutoMovieVector3,
    released: IAutoMovieTransform,
    landing: IAutoMovieVector3,
    touched: IAutoMovieTransform,
    amount: number,
  ): IAutoMovieVector3 {
    const body: IAutoMovieVector3 = AutoMovieEngineVector3.add(
      current.translation,
      AutoMovieEngineQuaternion.rotateVector(
        current.rotation,
        AutoMovieEngineVector3.lerp(local(lifting, released), local(landing, touched), amount),
      ),
    );
    // On the ground at both ends the hoof is at rest in the world: the world
    // chord's point gives way to the body-carried one by weight.
    const ground: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(lifting, landing, amount);
    return {
      x: blend(ground.x, body.x, amount),
      y: lifting.y + (landing.y - lifting.y) * amount,
      z: blend(ground.z, body.z, amount),
    };
  }

  /*
   * A world point in a body frame.
   */
  function local(
    point: IAutoMovieVector3,
    frame: IAutoMovieTransform,
  ): IAutoMovieVector3 {
    return AutoMovieEngineQuaternion.rotateVector(
      AutoMovieEngineQuaternion.inverse(frame.rotation),
      AutoMovieEngineVector3.subtract(point, frame.translation),
    );
  }
}
