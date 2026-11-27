import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSwipeTouchscreen,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../../law/HumanBound";
import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * A swipe's screen in the world at the action's start (`swipeTouchscreen`): the
 * named surface affordance of a stationary fixture, unscaled and of positive
 * width, its centre, the stroke's two ends at the authored shares of its width
 * along its local X, its outward normal (local Y) and its forward (local Z).
 *
 * @param read The prop's reader.
 * @param params The swipe's prop, screen and two shares of the width.
 * @param start The action's film start, seconds.
 * @returns The screen's world geometry.
 * @throws {HumanRefusal} On a share outside [-0.5, 0.5], two equal shares, or a
 *   screen that is not an unscaled rigid surface of positive width on a fixed,
 *   unmoving, unworn and unmounted prop.
 */
export function swipeTouchscreenScreen(
  read: Pick<IAutoMovieMotionHumanPropReader, "prop" | "frame">,
  params: Pick<
    IAutoMovieMotionHumanSwipeTouchscreen,
    "prop" | "screen" | "from" | "to"
  >,
  start: number,
): swipeTouchscreenScreen.IScreen {
  const from: number = HumanBound.within("from", params.from, -0.5, 0.5);
  const to: number = HumanBound.within("to", params.to, -0.5, 0.5);
  HumanBound.above("swipe distance", Math.abs(from - to), 0, "width");
  const screen: IAutoMovieAffordance | undefined = read.prop.affordances?.find(
    (a: IAutoMovieAffordance): boolean => a.id === params.screen,
  );
  if (
    screen?.kind !== "surface" ||
    screen.width === undefined ||
    !(screen.width > 0) ||
    screen.rides !== undefined ||
    screen.frame.scale.x !== 1 ||
    screen.frame.scale.y !== 1 ||
    screen.frame.scale.z !== 1 ||
    read.prop.fixed !== true ||
    read.prop.motion !== undefined ||
    read.prop.soft !== undefined ||
    read.prop.worn !== undefined ||
    read.prop.mounted !== undefined
  )
    throw new HumanRefusal({
      kind: "affordance",
      axis: "screen",
      value: `${params.prop}.${params.screen}`,
      reason:
        "a swipe needs a stationary fixture with an unscaled rigid surface of positive width",
      fix: "stage a fixed touchscreen with a unit-scale surface affordance and width",
    });
  const width: number = screen.width;
  const frame: IAutoMovieRigidTransform = read.frame(start);
  const rotation: IAutoMovieQuaternion = Quaternion.multiply(
    frame.rotation,
    screen.frame.rotation,
  );
  const center: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, screen.frame.translation),
  );
  const site: (share: number) => IAutoMovieVector3 = (
    share: number,
  ): IAutoMovieVector3 =>
    Vector3.add(
      center,
      Quaternion.rotateVector(rotation, { x: share * width, y: 0, z: 0 }),
    );
  return {
    center,
    first: site(from),
    last: site(to),
    normal: Quaternion.rotateVector(rotation, { x: 0, y: 1, z: 0 }),
    forward: Quaternion.rotateVector(rotation, { x: 0, y: 0, z: 1 }),
  };
}

/** Companion types of {@link swipeTouchscreenScreen}. */
export namespace swipeTouchscreenScreen {
  /** A swipe's screen in the world. */
  export interface IScreen {
    /** The surface's centre, world metres. */
    center: IAutoMovieVector3;

    /** The stroke's first point, world metres. */
    first: IAutoMovieVector3;

    /** Its last point, world metres. */
    last: IAutoMovieVector3;

    /** The surface's outward normal. */
    normal: IAutoMovieVector3;

    /** The surface's forward, the fingertip's pointing. */
    forward: IAutoMovieVector3;
  }
}
