import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * A wheel's bearing windows (`GymnasticsWheel`) with each foot's edge
 * declared where the foot rolls past the ankle's range: the wheel's carried
 * foot turns with its leg, so at an end of its window it stands rolled;
 * where that roll passes the ankle's (`DEFAULT_HUMANOID_ROM`'s foot
 * abduction), the laid foot bears on the edge the roll lowers
 * (`HumanFoot.edge`) and turns about it (`AutoMovieMotionHumanFootRelax`),
 * so the window declares that edge as the point held and the plant audits
 * read the point the foot bears on. Read once per plan.
 *
 * @param body The body.
 * @param contacts The wheel's bearing windows, shares of the duration.
 * @param duration The action's seconds.
 * @param carried The wheel's rigid posture at an action second.
 * @returns The windows, a rolled foot's with its edge.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States when a window takes an edge, which edge and who reads it.
 * @evidence contracts/development/implementation.md#principled-implementation A foot rolled past the subtalar range bears on its forefoot border; the border the roll lowers is the one opposite the border it lifts (`HumanFoot.roll`'s sign).
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Two readings of the carried foot per foot window, one choice.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A foot within the range keeps the window as it was.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two resolves per foot window, once per plan.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The foot's roll and edge readers.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function edgeGymnasticsWheelFeet(
  body: IAutoMovieMotionHumanBody,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  duration: number,
  carried: (seconds: number) => IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanContactWindow[] {
  const range: number = DEFAULT_HUMANOID_ROM.leftFoot!.abduction!.max;
  return contacts.map(
    (c: IAutoMovieMotionHumanContactWindow): IAutoMovieMotionHumanContactWindow => {
      if (c.part !== "leftFoot" && c.part !== "rightFoot") return c;
      const bone: AutoMovieHumanoidBone = c.part;
      const roll: (share: number) => number = (share: number): number =>
        HumanFoot.roll(
          poseBones(
            body,
            resolveHumanPosture(body, {
              ...carried(share * duration),
              limbs: {},
            }),
            undefined,
            new Set<AutoMovieHumanoidBone>([bone]),
          ).get(bone)!.worldRotation,
        );
      const a: number = roll(c.from);
      const b: number = roll(c.to);
      const most: number = Math.abs(a) > Math.abs(b) ? a : b;
      if (!(Math.abs(most) > range)) return c;
      return {
        ...c,
        socket: HumanFoot.edge(
          body,
          c.part === "leftFoot" ? "left" : "right",
          -most,
        ),
      };
    },
  );
}
