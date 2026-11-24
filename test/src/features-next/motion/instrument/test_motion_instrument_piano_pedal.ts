import { createInstrument, createSeat } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPianoPedal,
  IAutoMovieMotionHumanSeated,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanInstrument,
  HumanChain,
  HumanObject,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../../features/internal/archetypeExtent";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A seated right foot depresses and releases the upright damper twice
 * from a fixed heel, then returns to the floor without moving the seat or
 * the left foot.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the independent moving part and the preserved supports.
 * @evidence contracts/development/testing.md#behavioral-verification Uses a staged upright, a seated polygon body, the registered law and displayed bones and articulation, with motion and support bounds collected together.
 * @evidence contracts/development/testing.md#independent-expectations Checks plate travel against the model's geometry, fixed support points against the entry pose, and full and half stroke at authored times.
 * @evidence contracts/development/testing.md#distinguishing-cases Samples approach, both presses, the released interval between them and recovery, while another key stays at rest.
 * @evidence contracts/development/testing.md#execution-ownership Discovered as a direct motion feature test without a viewer.
 */
export function test_motion_instrument_piano_pedal(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const piano: ReturnType<typeof createInstrument> = createInstrument(
    { kind: "uprightPiano" },
    5,
  );
  const pedal: IAutoMovieAffordance = piano.affordance("damperPedal");
  const hinge: IAutoMovieAffordance = piano.affordance("damperPedalHinge");
  const pivot: IAutoMovieVector3 = hinge.frame.translation;
  const radius: number = pedal.frame.translation.z - pivot.z;
  const front: number = archetypeExtent(piano, "z", ["case"]).high;
  const stance: number = front + body.measure.footLength + 0.095;
  const bench: ReturnType<typeof createSeat> = createSeat(
    { kind: "bench", places: 1 },
    2,
  );
  const benchFrame: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(
    bench,
    { at: { x: 0, y: 0, z: 0 }, yaw: 180 },
  );
  const seat: IAutoMovieMotionHumanSeated.ISeat = HumanObject.seat(bench, {
    at: { x: 0, y: 0, z: stance - benchFrame.at.z },
    yaw: 180,
  });
  const params: IAutoMovieMotionHumanPianoPedal = {
    prop: "upright",
    presses: [
      { from: 0.48, at: 0.72, release: 0.94, to: 1.18 },
      { from: 1.4, at: 1.6, release: 1.78, to: 1.98 },
    ],
    duration: 2.48,
  };
  const performance: HumanPerformance = new HumanPerformance({
    seed: "upright damper pedal",
    performers: [
      {
        subject: "pianist",
        body,
        at: { x: seat.at.x, y: 0, z: stance },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop(params.prop, piano, {
        fixed: true,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
      }),
    ],
    laws: [AutoMovieMotionHumanInstrument.pianoPedal],
    composition: HumanChain.subject("pianist")
      .sit({ seat, hold: 1 })
      .registered("pianoPedal", params, "damper").node,
  });

  const start: number = performance.instant({ of: "damper", event: "start" });
  const entry: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("pianist", start);
  const floor: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
    body,
    entry,
    "right",
  );
  const stage: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    performance.bones("pianist", start + params.presses[0]!.from);
  const heel: IAutoMovieVector3 = HumanFoot.sockets(body, stage, "right")[0]!
    .point;
  const findings: string[] = [];

  const pivotWindow: IAutoMovieMotionHumanContactWindow | undefined =
    performance
      .segments("pianist")[1]!
      .plan.contacts.find(
        (contact: IAutoMovieMotionHumanContactWindow): boolean =>
          contact.part === "rightFoot" &&
          contact.kind === "pivot" &&
          contact.support.kind === "ground",
      );
  if (pivotWindow?.region !== "heelRight")
    findings.push("the ground pivot must identify the right heel");

  if (
    Math.abs(radius * Math.sin((hinge.travel! * Math.PI) / 180) - 0.012) > 1e-8
  )
    findings.push(
      "full hinge rotation does not drop the plate centre by 12 mm",
    );
  for (const [local, share, touching] of [
    [0, 0, false],
    [0.24, 0, false],
    [0.48, 0, true],
    [0.6, 0.5, true],
    [0.84, 1, true],
    [1.06, 0.5, true],
    [1.28, 0, true],
    [1.5, 0.5, true],
    [1.7, 1, true],
    [1.88, 0.5, true],
    [1.98, 0, true],
    [2.23, 0, false],
    [2.48, 0, false],
  ] as const) {
    const seconds: number = start + local;
    const state: Readonly<Record<string, number>> = performance.state(
      params.prop,
      seconds,
    );
    const moved: ReturnType<typeof createInstrument> = piano.articulate(state);
    const plate: IAutoMovieAffordance = moved.affordance("damperPedal");
    const point: IAutoMovieVector3 = plate.frame.translation;
    const expected: number = hinge.travel! * share;
    const radians: number = (expected * Math.PI) / 180;
    const expectedCentre: IAutoMovieVector3 = {
      x: pivot.x,
      y: pivot.y - radius * Math.sin(radians),
      z: pivot.z + radius * Math.cos(radians),
    };
    const normal: IAutoMovieVector3 = Quaternion.rotateVector(
      plate.frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const top: number = archetypeExtent(moved, "y", [
      "damper-pedal-plate",
    ]).high;
    if (
      Math.abs((state[hinge.id] ?? 0) - expected) > 1e-8 ||
      Vector3.length(Vector3.subtract(point, expectedCentre)) > 1e-8 ||
      Math.abs(normal.y - Math.cos(radians)) > 1e-8 ||
      Math.abs(normal.z - Math.sin(radians)) > 1e-8 ||
      Math.abs(
        top - (pivot.y - (radius - pedal.depth! / 2) * Math.sin(radians)),
      ) > 1e-8
    )
      findings.push(
        `plate geometry misses ${expected} degrees of travel at ${local}s`,
      );
    if (
      moved.affordance("key40").frame.translation.y !==
      piano.affordance("key40").frame.translation.y
    )
      findings.push(`unscored key moved at ${local}s`);

    const shown: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      performance.bones("pianist", seconds);
    const right: IAutoMovieMotionHumanFoot.ISocket[] = HumanFoot.sockets(
      body,
      shown,
      "right",
    );
    for (const bone of ["hips", "leftFoot", "leftToes"] as const) {
      const drift: number = Vector3.length(
        Vector3.subtract(
          shown.get(bone)!.worldPosition,
          entry.get(bone)!.worldPosition,
        ),
      );
      if (drift > 0.002)
        findings.push(`${bone} drifted ${drift} m at ${local}s`);
    }
    if (touching) {
      const ball: IAutoMovieVector3 = right[1]!.point;
      const toPlate: IAutoMovieQuaternion = Quaternion.inverse(
        plate.frame.rotation,
      );
      const localBall: IAutoMovieVector3 = Quaternion.rotateVector(
        toPlate,
        Vector3.subtract(ball, point),
      );
      const slip: number = Vector3.length(
        Vector3.subtract(right[0]!.point, heel),
      );
      if (
        Math.abs(localBall.y) > 0.006 ||
        Math.abs(localBall.x) > pedal.width! / 2 ||
        Math.abs(localBall.z) > pedal.depth! / 2 ||
        slip > 0.006 ||
        Math.abs(heel.y - floor[0]!.point.y) > 0.006
      )
        findings.push(
          `foot misses plate at ${local}s, normal separation ${localBall.y} m, heel drift ${slip} m`,
        );
    } else if (local === params.duration) {
      const miss: number = Vector3.length(
        Vector3.subtract(right[1]!.point, floor[1]!.point),
      );
      if (miss > 0.002)
        findings.push(`foot misses its recovered floor plant by ${miss} m`);
    } else if (local > 0 && right[1]!.point.y - floor[1]!.point.y < 0.01) {
      findings.push(`forefoot does not clear the ground at ${local}s`);
    }
  }
  for (const [event, local] of [
    ["pedalDown1", 0.72],
    ["pedalUp1", 1.18],
    ["pedalDown2", 1.6],
    ["pedalUp2", 1.98],
  ] as const) {
    const actual: number = performance.instant({ of: "damper", event }) - start;
    if (Math.abs(actual - local) > 1e-9)
      findings.push(`${event} falls at ${actual}s, expected ${local}s`);
  }
  TestValidator.equals("the forefoot and damper move together", findings, []);
}
