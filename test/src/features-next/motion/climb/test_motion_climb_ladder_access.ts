import { createLadder, createPlyoBox } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapePairDistance,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import {
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HumanColliders,
  HumanFoot,
  HumanHand,
} from "@automovie/motions/internal";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * Join the floor and a raised landing over a fixed rung ladder, up and down.
 *
 * Scenarios:
 * 1. An average man and a small woman climb from the floor to a plyo box's
 *    top and walk on across it, and climb down from it and walk away.
 * 2. Every loaded ladder grip holds its displayed hand within 25 mm of a
 *    named rung or side rail, and a side rail is gripped.
 * 3. No displayed segment enters the landing box by more than 25 mm.
 * 4. Both soles end at the departure surface's height and the onward walk
 *    leaves the ladder in the declared direction.
 * 5. A landing too high above the rungs is refused naming its point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes both complete staged routes and their actual supports.
 * @evidence contracts/development/testing.md#behavioral-verification Reads both feet in the displayed settled pose, the real outgoing walk and fixture contact ownership.
 * @evidence contracts/development/testing.md#independent-expectations Creates the upper support and reads the installed archetype's true surface height.
 * @evidence contracts/development/testing.md#distinguishing-cases Two canonical bodies, ascent, descent, ground, named rungs and inconsistent upper geometry.
 * @evidence contracts/development/testing.md#execution-ownership Runs complete HumanPerformance chains in memory.
 */
export function test_motion_climb_ladder_access(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  const ladder = createLadder({
    kind: "fixed",
    rungs: 5,
    spacing: 0.3,
    width: 0.47,
  });
  const upper = createPlyoBox({ kind: "wood" });
  const model = upper.affordances.find((a) => a.id === "surface")!;
  const height: number = model.frame.translation.y;
  const near: number = 0.21;
  const center: number = near + model.depth! / 2;
  const placedLadder = HumanObject.prop("ladder", ladder, {
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
    fixed: true,
  });
  const platform = HumanObject.prop("upper", upper, {
    at: { x: 0, y: 0, z: -center },
    yaw: 0,
    fixed: true,
  });
  const highPlatform = HumanObject.prop("high", upper, {
    at: { x: 0, y: 1.9, z: -center },
    yaw: 0,
    fixed: true,
  });
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    for (const direction of ["up", "down"] as const) {
      const label: string = name + " " + direction;
      const down: boolean = direction === "down";
      const params: IAutoMovieMotionHumanClimbLadder.IParams = {
        ladder: "ladder",
        landing: { prop: "upper", point: "surface", direction },
      };
      const entry = HumanChain.subject("a").climbLadder(params);
      const take = (point: string) =>
        new HumanPerformance({
          seed: "ladder-access:" + direction,
          props: [placedLadder, platform, highPlatform],
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: down ? height : 0, z: down ? -center : 0.38 },
              yaw: 180,
              proficiency: { level: "trained" },
            },
          ],
          composition:
            point === "upper"
              ? entry.walk({
                  to: {
                    x: down ? 0 : 0.11,
                    y: down ? 0 : height,
                    z: down ? 1.25 : -center,
                  },
                  ...(down
                    ? { face: 0 }
                    : { face: -90, on: { prop: "upper" } }),
                  pace: "slow",
                }).node
              : HumanChain.subject("a").climbLadder({
                  ladder: "ladder",
                  landing: { prop: point, point: "surface", direction },
                }).node,
        });
      let film: HumanPerformance;
      try {
        film = take("upper");
      } catch (error) {
        all.check(
          label +
            ": real floor and landing admit the complete route: " +
            String(error),
          false,
        );
        continue;
      }
      const route: IAutoMovieMotionHumanSegment = film.segments("a")[0]!;
      all.check(
        label + ": named rung ownership was present",
        route.plan.contacts.some(
          (contact) =>
            contact.kind === "grip" &&
            contact.support.kind === "prop" &&
            contact.support.subject === "ladder",
        ),
      );
      let maximumGrip: number = 0;
      let loadedRail: boolean = false;
      const blades = ladder.affordances.filter(
        (affordance) => affordance.kind === "bar",
      );
      for (const window of route.plan.contacts) {
        if (
          window.kind !== "grip" ||
          window.support.kind !== "prop" ||
          window.support.subject !== "ladder" ||
          (window.part !== "leftHand" && window.part !== "rightHand")
        )
          continue;
        const side = window.part === "leftHand" ? "left" : "right";
        for (const u of [0.2, 0.5, 0.8]) {
          const share = window.from + u * (window.to - window.from);
          const read = film.bones(
            "a",
            route.start + share * route.plan.duration,
          );
          const hand = HumanHand.frame(body, read, side, "grip").point;
          let distance: number = Infinity;
          let closest: string = "";
          for (const bar of blades) {
            const axis = Quaternion.rotateVector(bar.frame.rotation, {
              x: 1,
              y: 0,
              z: 0,
            });
            const difference = Vector3.subtract(hand, bar.frame.translation);
            const half = (bar.length ?? 0) / 2;
            const along = Math.max(
              -half,
              Math.min(half, Vector3.dot(difference, axis)),
            );
            const gap = Vector3.length(
              Vector3.subtract(difference, Vector3.scale(axis, along)),
            );
            if (gap < distance) {
              distance = gap;
              closest = bar.id;
            }
          }
          maximumGrip = Math.max(maximumGrip, distance);
          loadedRail ||= closest.endsWith("Rail") && (window.load ?? 0) > 0;
        }
      }
      all.check(
        label +
          ": the actual hand stays on a named rung or rail while loaded, max " +
          maximumGrip.toFixed(4) +
          " m",
        loadedRail && maximumGrip <= 0.025,
      );

      let worstEdge = { distance: 0, bone: "", time: 0 };
      const probes: number = Math.ceil(route.plan.duration * 30);
      for (let frame: number = 0; frame <= probes; frame++) {
        const seconds = (frame * route.plan.duration) / probes;
        for (const bodyPart of HumanColliders.placed(
          body,
          film.bones("a", route.start + seconds),
        )) {
          for (const bodyShape of bodyPart.shapes) {
            for (const shape of platform.shapes ?? []) {
              const distance = physicalShapePairDistance(
                bodyPart.pose,
                bodyShape,
                platform.frame,
                shape,
              );
              if (distance < worstEdge.distance) {
                worstEdge = { distance, bone: bodyPart.bone, time: seconds };
              }
            }
          }
        }
      }
      all.check(
        label +
          ": the whole displayed body clears the edge, minimum " +
          worstEdge.distance.toFixed(4) +
          " m at " +
          worstEdge.bone +
          " " +
          worstEdge.time.toFixed(3) +
          " s",
        worstEdge.distance >= -0.025,
      );
      const bones = film.bones("a", film.duration);
      for (const side of ["left", "right"] as const) {
        const socket = HumanFoot.sockets(body, bones, side)[1]!.point;
        all.check(
          label +
            ": " +
            side +
            " actual sole bears at the departure height " +
            socket.y,
          Math.abs(socket.y - (down ? 0 : height)) < 0.018,
        );
      }
      all.check(
        label + ": onward travel goes clear of the ladder",
        down
          ? bones.get("hips")!.worldPosition.z > 0.9
          : -bones.get("hips")!.worldPosition.z > near,
      );
      let failure: unknown;
      try {
        take("high");
      } catch (error) {
        failure = error;
      }
      all.check(
        label +
          ": high landing refuses its actual named surface: " +
          String(failure),
        failure instanceof HumanRefusal && failure.axis === "landing.point",
      );
    }
  }
  all.assert("the real ladder joins two supporting floors in either direction");
}
