import {
  AutoMovieGravity,
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type { IAutoMovieMotionHumanProp } from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditBalance,
  HumanFoot,
  HumanSportCarry,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../internal/motionHumanBody";

/**
 * Both hands take the sled handles while the standing body supplies a support
 * margin.
 *
 * Scenarios:
 *
 * 1. Read the displayed grip points and extrapolated centre at the first loaded
 *    instant of a push.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Both hands take the sled handles while the standing body supplies a support margin.
 * @evidence contracts/development/testing.md#independent-expectations Handles sit at symmetric quarter-metre lateral offsets in the rigid sled frame; XCoM advances by v sqrt(1.34 hip height / g).
 * @evidence contracts/development/testing.md#distinguishing-cases The time boundary separates attachment from free hands and both lateral grips must reach independently.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_balance_push(): void {
  const body = motionHumanBody("m-average");
  const sled: IAutoMovieMotionHumanProp = {
    subject: "sled",
    frame: {
      position: { x: 0, y: 0, z: 0.55 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    },
    points: {},
    affordances: (["left", "right"] as const).map((id) => ({
      id,
      kind: "handle",
      frame: {
        translation: {
          x: id === "left" ? 0.25 : -0.25,
          y: 0.55 * body.measure.stature,
          z: 0,
        },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      extent: null,
    })),
  };
  const film = new HumanPerformance({
    seed: "sled",
    laws: [HumanSportCarry.sledPush],
    props: [sled],
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").registered("sledPush", {
      sled: "sled",
      to: { x: 0, y: 0, z: 3 },
    }).node,
  });
  const segment = film.segments("a")[0]!;
  const exit = film.prop("sled", segment.end);
  TestValidator.predicate(
    "sled advances two metres without leaving its starting height",
    exit.position.z - sled.frame.position.z >= 2 &&
      Math.abs(exit.position.y - sled.frame.position.y) <= 0.01,
  );
  const from =
    segment.start +
    segment.plan.events.find((e) => e.name === "gripped")!.share *
      segment.plan.duration;
  const t = from + 0.05,
    bones = film.bones("a", t),
    frame = film.prop("sled", t);
  for (const side of ["left", "right"] as const) {
    const socket =
      body.surfaces.sockets[side === "left" ? "gripLeft" : "gripRight"];
    const actual = resolveAutoMovieHumanoidSurfaces.place(
      socket,
      bones.get(socket.bone)!,
    ).point;
    const handle = Vector3.add(
      frame.position,
      Quaternion.rotateVector(
        frame.rotation,
        sled.affordances!.find((a) => a.id === side)!.frame.translation,
      ),
    );
    TestValidator.predicate(
      "hand reaches its own handle",
      Vector3.distance(actual, handle) <= 0.015,
    );
    const local = (time: number) => {
      const hand = film.bones("a", time).get(`${side}Hand`)!,
        prop = film.prop("sled", time);
      const point = Vector3.add(
        prop.position,
        Quaternion.rotateVector(
          prop.rotation,
          sled.affordances!.find((a) => a.id === side)!.frame.translation,
        ),
      );
      return Quaternion.rotateVector(
        Quaternion.inverse(hand.worldRotation),
        Vector3.subtract(point, hand.worldPosition),
      );
    };
    for (const at of [t, (t + segment.end) / 2, segment.end]) {
      TestValidator.predicate(
        "handle stays within one millimetre in the hand frame",
        Vector3.distance(local(t), local(at)) <= 0.001,
      );
      const posed = film.bones("a", at),
        trunk = Vector3.subtract(
          posed.get("neck")!.worldPosition,
          posed.get("hips")!.worldPosition,
        );
      TestValidator.predicate(
        "push inclines the trunk at least fifteen degrees",
        (Math.acos(trunk.y / Vector3.length(trunk)) * 180) / Math.PI >= 15,
      );
    }
  }
  const centre = (seconds: number) =>
    resolveAutoMovieCenterOfMass.place(
      body.massModel,
      film.bones("a", seconds),
    );
  const h = 1 / 240,
    velocity = (centre(t + h).z - centre(t - h).z) / (2 * h);
  const xcom =
    centre(t).z +
    velocity *
      Math.sqrt((1.34 * body.measure.hipHeight) / AutoMovieGravity.STANDARD);
  const front = Math.max(...HumanFoot.base(body, bones).map((p) => p.z));
  const margin = AutoMovieMotionHumanAuditBalance.margin(
    film,
    "a",
    body,
    body.massModel,
    t,
  );
  TestValidator.predicate(
    "front support limits forward margin",
    margin <= front - xcom + 0.005,
  );
}
