import { AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/*
 * A wheel's bearing windows (`GymnasticsWheel`) with each foot's edge declared
 * where the foot rolls past the ankle's range: the wheel's carried foot turns
 * with its leg, so at an end of its window it stands rolled; where that roll
 * passes the ankle's (`AutoMovieEngineDefaultHumanoidRom`'s foot abduction), the laid foot
 * bears on the edge the roll lowers (`HumanFoot.edge`) and turns about it
 * (`AutoMovieMotionHumanFootRelax`), so the window declares that edge as the
 * point held and the plant audits read the point the foot bears on. Read once
 * per plan.
 * Parameter body: The body.
 * Parameter contacts: The wheel's bearing windows, shares of the duration.
 * Parameter duration: The action's seconds.
 * Parameter carried: The wheel's rigid posture at an action second.
 * Returns: The windows, a rolled foot's with its edge.
 */
export function edgeGymnasticsWheelFeet(
  body: IAutoMovieMotionHumanBody,
  contacts: readonly IAutoMovieMotionHumanContactWindow[],
  duration: number,
  carried: (seconds: number) => IAutoMovieMotionHumanPosture,
): IAutoMovieMotionHumanContactWindow[] {
  const range: number = AutoMovieEngineDefaultHumanoidRom.leftFoot!.abduction!.max;
  return contacts.map(
    (
      c: IAutoMovieMotionHumanContactWindow,
    ): IAutoMovieMotionHumanContactWindow => {
      if (c.part !== "leftFoot" && c.part !== "rightFoot") return c;
      const bone: AutoMovieHumanoidBone = c.part;
      const side: AutoMovieHumanSide = c.part === "leftFoot" ? "left" : "right";
      const toes: AutoMovieHumanoidBone = `${side}Toes`;
      const shown: (
        share: number,
      ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
        share: number,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        poseBones(
          body,
          resolveHumanPosture(body, {
            ...carried(share * duration),
            limbs: {},
          }),
          undefined,
          new Set<AutoMovieHumanoidBone>([bone, toes]),
        );
      const a: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = shown(
        c.from,
      );
      const b: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = shown(c.to);
      const rollA: number = HumanFoot.roll(a.get(bone)!.worldRotation);
      const rollB: number = HumanFoot.roll(b.get(bone)!.worldRotation);
      const rolled: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        Math.abs(rollA) > Math.abs(rollB) ? a : b;
      const most: number = Math.abs(rollA) > Math.abs(rollB) ? rollA : rollB;
      if (!(Math.abs(most) > range)) return c;
      // The edge lies where the foot's own shape reaches when so rolled: the
      // drop of its lowest collider below the ball's sole point, over the
      // roll's sine, is the edge's distance from the midline; at least half
      // the foot's breadth across the metatarsal heads.
      const ball: number = HumanFoot.sockets(body, rolled, side).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point.y;
      const low: number = HumanColliders.prepareMinima(body, [
        new Set<AutoMovieHumanoidBone>([bone, toes]),
      ])(rolled)[0]!;
      const half: number = Math.max(
        body.measure.footBreadth / 2,
        (ball - low) / Math.sin((Math.abs(most) * Math.PI) / 180),
      );
      return { ...c, socket: HumanFoot.edge(body, side, -most, half) };
    },
  );
}
