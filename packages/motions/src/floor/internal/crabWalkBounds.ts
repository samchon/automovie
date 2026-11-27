import type {
  AutoMovieHumanoidBone,
  IAutoMovieAngleRange,
  IAutoMovieBodyMeasure,
  IAutoMovieBone,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * What the crab walk's body can hold: the pelvis heights its bent arms and legs
 * reach, and the trunk extension its spine and chest allow.
 */
export namespace crabWalkBounds {
  /*
   * The trunk's bones that arch, from the pelvis up.
   */
  export const TRUNK: readonly AutoMovieHumanoidBone[] = [
    "spine",
    "chest",
    "upperChest",
  ];

  /*
   * The lowest pelvis height, statures: authored.
   */
  export const LOWEST: number = 0.1;

  /*
   * The highest pelvis height, hip heights: authored.
   */
  export const HIGHEST: number = 0.6;

  /*
   * What the arch reads of a body: its trunk bones' constraints.
   */
  export interface IBones {
    /*
     * The rig's bones by name.
     */
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieBone, "constraint">
    >;
  }

  /*
   * The pelvis's height over the floor.
   * Parameter measure: The body's stature and hip height.
   * Parameter share: The authored height, statures.
   * Returns: The height, metres.
   * On `height` below `LOWEST` statures or above
   * `HIGHEST` hip heights.
   */
  export function height(
    measure: Pick<IAutoMovieBodyMeasure, "stature" | "hipHeight">,
    share: number,
  ): number {
    const metres: number = share * measure.stature;
    if (
      !(
        metres >= LOWEST * measure.stature &&
        metres <= HIGHEST * measure.hipHeight
      )
    )
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "height",
        value: share,
        feasible: {
          kind: "range",
          unit: "stature",
          minimum: LOWEST,
          maximum: (HIGHEST * measure.hipHeight) / measure.stature,
        },
        reason:
          "the bent arms and legs hold the pelvis only within this height",
        fix: "give a pelvis height inside the range",
      });
    return metres;
  }

  /*
   * The trunk's extension shared among its bones by the room each has (its
   * flexion range's extension side).
   * Parameter body: The body's bones.
   * Parameter degrees: The whole extension, degrees.
   * Returns: Each trunk bone's flexion, degrees, negative extending.
   * On `backbend` for more extension than the trunk
   * holds.
   */
  export function arch(
    body: IBones,
    degrees: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const rooms: readonly number[] = TRUNK.map(
      (bone: AutoMovieHumanoidBone): number => {
        const flexion: IAutoMovieAngleRange | null | undefined =
          body.bones.get(bone)?.constraint?.flexion;
        return flexion === null || flexion === undefined
          ? 0
          : Math.max(0, -flexion.min);
      },
    );
    const room: number = rooms.reduce(
      (a: number, b: number): number => a + b,
      0,
    );
    if (degrees > room)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "backbend",
        value: true,
        feasible: { kind: "range", unit: "deg", minimum: 0, maximum: room },
        reason: `a full backbend arches the trunk by ${degrees} degrees; this body's spine and chest extend by ${room.toFixed(0)}`,
        fix: "crawl without the backbend",
      });
    const arched: IAutoMovieMotionHumanPosture["joints"] = {};
    TRUNK.forEach((bone: AutoMovieHumanoidBone, k: number): void => {
      if (room > 0) arched[bone] = [(-degrees * rooms[k]!) / room, 0, 0];
    });
    return arched;
  }
}
