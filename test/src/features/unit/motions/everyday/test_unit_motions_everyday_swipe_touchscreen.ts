import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  HumanRefusal,
  swipeTouchscreenScreen,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of a few rotations, metres. */
const ROUNDING: number = 1e-12;

/**
 * `swipeTouchscreenScreen` places a swipe's screen in the world: the named
 * surface of a fixed prop, its centre, the stroke's ends at the authored shares
 * of its width along its local X, and its local Y and Z as the outward normal
 * and the forward.
 *
 * Scenarios, a tablet at (0, 1, 0.5) turned 90 degrees about +Y, its 0.2 m wide
 * glass 0.01 m above its origin:
 *
 * 1. Shares -0.25 to 0.25 run from (0, 1.01, 0.55) to (0, 1.01, 0.45), across the
 *    glass's X turned onto -Z; the normal is +Y and the forward +X.
 * 2. A share past half the width is refused on `from`, equal shares on `swipe
 *    distance`, and a glass on a prop that is not fixed, a scaled glass and an
 *    unknown screen on `screen`.
 */
export async function test_unit_motions_everyday_swipe_touchscreen(): Promise<void> {
  const glass: IAutoMovieAffordance = {
    id: "glass",
    kind: "surface",
    frame: {
      translation: { x: 0, y: 0.01, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
    width: 0.2,
  };
  const placed: IAutoMovieRigidTransform = {
    position: { x: 0, y: 1, z: 0.5 },
    rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 90),
  };
  const reader: (
    affordance: IAutoMovieAffordance,
    fixed: boolean,
  ) => Parameters<typeof swipeTouchscreenScreen>[0] = (
    affordance: IAutoMovieAffordance,
    fixed: boolean,
  ): Parameters<typeof swipeTouchscreenScreen>[0] => {
    const prop: IAutoMovieMotionHumanProp = {
      subject: "tablet",
      frame: placed,
      points: {},
      affordances: [affordance],
      fixed,
    };
    return { prop, frame: (): IAutoMovieRigidTransform => placed };
  };
  const screen: swipeTouchscreenScreen.IScreen = swipeTouchscreenScreen(
    reader(glass, true),
    { prop: "tablet", screen: "glass", from: -0.25, to: 0.25 },
    0,
  );
  TestValidator.predicate(
    "the screen",
    vclose(screen.center, { x: 0, y: 1.01, z: 0.5 }, ROUNDING) &&
      vclose(screen.first, { x: 0, y: 1.01, z: 0.55 }, ROUNDING) &&
      vclose(screen.last, { x: 0, y: 1.01, z: 0.45 }, ROUNDING) &&
      vclose(screen.normal, { x: 0, y: 1, z: 0 }, ROUNDING) &&
      vclose(screen.forward, { x: 1, y: 0, z: 0 }, ROUNDING),
  );
  const refused: (
    read: Parameters<typeof swipeTouchscreenScreen>[0],
    from: number,
    to: number,
    name?: string,
  ) => string = (
    read: Parameters<typeof swipeTouchscreenScreen>[0],
    from: number,
    to: number,
    name: string = "glass",
  ): string => {
    try {
      swipeTouchscreenScreen(
        read,
        { prop: "tablet", screen: name, from, to },
        0,
      );
    } catch (error: unknown) {
      if (error instanceof HumanRefusal) return error.axis;
    }
    return "admitted";
  };
  TestValidator.equals(
    "refusals",
    [
      refused(reader(glass, true), -0.6, 0.25),
      refused(reader(glass, true), 0.1, 0.1),
      refused(reader(glass, false), -0.25, 0.25),
      refused(
        reader(
          {
            ...glass,
            frame: { ...glass.frame, scale: { x: 2, y: 1, z: 1 } },
          },
          true,
        ),
        -0.25,
        0.25,
      ),
      refused(reader(glass, true), -0.25, 0.25, "keyboard"),
    ],
    ["from", "swipe distance", "screen", "screen", "screen"],
  );
}
