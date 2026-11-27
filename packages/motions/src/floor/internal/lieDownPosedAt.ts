import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanLieDown,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { floorEntry } from "./floorEntry";

/*
 * The route's posture at key `index` and share `u` toward the next key: the
 * keys' pitch and roll interpolated and the joints from the prepared blend, the
 * root at the origin, and on the last key turned about the body's long axis
 * toward the roll side.
 *
 * Part of `lieDown.plan`, which prepares it once per plan.
 * Parameter prepared: What the plan prepared for it.
 * Returns: The plan's `posedAt`.
 */
export function lieDownPosedAt(
  prepared: lieDownPosedAt.IPrepared,
): (index: number, u: number) => IAutoMovieMotionHumanPosture {
  const { standing, keys, rollSide, route, blend }: lieDownPosedAt.IPrepared =
    prepared;
  return (index: number, u: number): IAutoMovieMotionHumanPosture => ({
    root: { x: 0, y: 0, z: 0 },
    yaw: standing.yaw,
    pitch:
      keys[index]!.pitch + (keys[index + 1]!.pitch - keys[index]!.pitch) * u,
    roll: keys[index]!.roll + (keys[index + 1]!.roll - keys[index]!.roll) * u,
    // From supine, turn around the body's longitudinal axis. In the
    // Ry Rx Rz chart this is Rx(-90) Ry(turn), with the horizontal
    // projection of the chest normal pointing left or right throughout.
    ...(rollSide !== undefined && index === route.length - 1 && u > 0
      ? {
          yaw: standing.yaw + (rollSide === "left" ? 90 : -90),
          pitch: -90 + Math.abs(keys[index + 1]!.roll) * u,
          roll: rollSide === "left" ? -90 : 90,
        }
      : {}),
    joints: blend[index]!(u),
    limbs: {},
  });
}

/*
 * The `posedAt` of `lieDown.plan`, built from what that plan prepared.
 */
export namespace lieDownPosedAt {
  /*
   * What `lieDown.plan` prepared for its `posedAt`.
   */
  export interface IPrepared {
    /*
     * The `standing` `lieDown.plan` prepared.
     */
    standing: floorEntry.IStart["standing"];

    /*
     * The `keys` `lieDown.plan` prepared.
     */
    keys: IAutoMovieMotionHumanLieDown.IPose[];

    /*
     * The `rollSide` `lieDown.plan` prepared.
     */
    rollSide: AutoMovieHumanSide | undefined;

    /*
     * The `route` `lieDown.plan` prepared.
     */
    route: readonly [string, string][];

    /*
     * The `blend` `lieDown.plan` prepared.
     */
    blend: ((weight: number) => IAutoMovieMotionHumanPosture["joints"])[];
  }
}
