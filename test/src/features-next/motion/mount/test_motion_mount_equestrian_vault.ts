import { createHorse } from "@automovie/archetypes";
import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, HumanSignature } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the vaulter sits on. */
const WAIT: number = 5;

/** The vaulting take: handles taken, basic seat, handles again, bench, back to the seat. */
const FIGURES: IAutoMovieMotionHumanMounted.IFigure[] = [
  {
    seat: "entered",
    transfer: 0.6,
    hold: 0.6,
    supports: { leftHand: "leftHandle", rightHand: "rightHandle" },
  },
  { seat: "basic", transfer: 0.8, hold: 1.5 },
  {
    seat: "entered",
    transfer: 0.8,
    hold: 0.4,
    supports: { leftHand: "leftHandle", rightHand: "rightHandle" },
  },
  {
    seat: "bench",
    transfer: 1,
    hold: 1.5,
    supports: {
      leftKnee: "pad",
      rightKnee: "pad",
      leftHand: "leftHandle",
      rightHand: "rightHandle",
    },
  },
  {
    seat: "entered",
    transfer: 1,
    hold: 0.5,
    supports: { leftHand: "leftHandle", rightHand: "rightHandle" },
  },
];

/**
 * An individual vaulting take on a cantering horse's surcingle: the vaulter
 * takes both handles from the seat astride, lets go for the basic seat,
 * takes the handles again, rises to the bench on both knees and returns to
 * the seat, every support acquired and released at its declared window and
 * carried by the moving horse.
 *
 * Scenarios:
 * 1. The horse's root travels at least a metre over the take: the carrier moves.
 * 2. Through every seated hold the displayed seat region lies within 10 mm of the seat contact's plane and slides less than 10 mm in it (the campaign's held-contact bound).
 * 3. Through every hold that names the handles, each displayed wrist lies within 0.7 hand lengths of its handle and moves less than 10 mm against it, and the middle fingertip lies nearer the wrist than its knuckle (the rider attachment spec's grip criteria); in the basic seat each wrist is more than 0.15 m from its handle, the arm stretched to its side (the hand more than half an arm's length out from the shoulder across the horse) and the middle fingertip above the shoulder joint, as the FEI guideline's "fingertips at eye level" asks.
 * 4. In the bench both displayed knee regions lie within 10 mm of the pad's plane and inside its rectangle, the seat region more than 0.1 m above the seat, and the trunk inclined more than 30 degrees from the pad's up, against less than 20 degrees in the seated holds: the pelvis attitude differs.
 * 5. The plan's windows: the seat is released when the transfer into the bench begins and taken again when the transfer out arrives, the knees bear exactly over the bench's hold, and each hand grips from the first arrival to the basic seat's transfer and again from the next arrival to the end; at the knee window's start the knees are down, and halfway through the transfer into the bench they are still more than 20 mm above the pad.
 * 6. The same take on a saddled horse is refused on the missing handle, and a take that goes from the basic seat straight to the bench is refused because no support is held through the transfer.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, the six scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law on an actual cantering surcingle horse and reads the displayed seat, palms, knees and trunk against the horse's actual moving contacts; a carried posture left behind, a hand that never lets go or never arrives, a knee off the pad or a window that disagrees with the geometry fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact positions are the archetype ride's own frames; the 10 mm bound is the campaign's; the arm and knee placements come from the FEI guideline; the inclinations separate a kneeling trunk from an upright seat by a margin wider than either posture's spread.
 * @evidence contracts/development/testing.md#distinguishing-cases A held and a released hand, a borne and a free seat, knees before and at their acquisition, a valid and a missing support and an unsupported transfer.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory film of one polygon man and one archetype ride; the side-saddle and bareback specs own their seats.
 */
export function test_motion_mount_equestrian_vault(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const scene: mountedHorseScene.IScene = stage(
    createHorse({ tack: "surcingle", withersHeight: 1.65, tempo: 0 }, 3),
    body,
    FIGURES,
  );
  const take: IAutoMovieMotionHumanSegment = scene.segments.find(
    (segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.events.some((e): boolean => e.name === "bench:3"),
  )!;
  const length: number = take.end - take.start;
  const arrive = (i: number): number =>
    take.start + take.plan.events[i]!.share * length;
  const begin = (i: number): number =>
    i === 0 ? take.start : arrive(i) - FIGURES[i]!.transfer;
  const held = (i: number): number => arrive(i) + FIGURES[i]!.hold / 2;

  // 1. The carrier moves.
  if (
    Vector3.distance(
      scene.place(take.start).position,
      scene.place(take.end).position,
    ) < 1
  )
    findings.push("the horse must travel through the take");

  // 2. The seat holds on its contact through the seated figures.
  const seatAt = (at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    );
  const first: IAutoMovieVector3 = seatAt(held(0));
  for (const i of [0, 1, 2, 4])
    for (const share of [0.1, 0.5, 0.9]) {
      const at: number = arrive(i) + FIGURES[i]!.hold * share;
      const seat: IAutoMovieVector3 = seatAt(at);
      if (
        Math.abs(seat.y) > CONTACT ||
        Math.hypot(seat.x - first.x, seat.z - first.z) > CONTACT
      )
        findings.push(
          `figure ${i}: the seat leaves its contact at ${at.toFixed(2)} s (${JSON.stringify(seat)})`,
        );
    }

  // 3. Hands on their handles where named, stretched out in the basic seat.
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  for (const i of [0, 2, 3, 4])
    for (const side of ["left", "right"] as const) {
      const wrist = (at: number): IAutoMovieVector3 =>
        mountedHorseScene.local(
          scene.part(`${side}Handle`, at),
          mountedHorseScene.joint(scene, `${side}Hand`, at),
        );
      const grasp: IAutoMovieVector3 = wrist(arrive(i));
      for (const share of [0, 0.5, 1]) {
        const at: number = arrive(i) + FIGURES[i]!.hold * share;
        if (
          Vector3.length(wrist(at)) > 0.7 * m.hand ||
          Vector3.distance(wrist(at), grasp) > CONTACT
        )
          findings.push(
            `figure ${i}: the ${side} wrist loses its handle at ${at.toFixed(2)} s`,
          );
      }
      const at: number = held(i);
      const root: IAutoMovieVector3 = mountedHorseScene.joint(
        scene,
        `${side}Hand`,
        at,
      );
      const knuckle: IAutoMovieVector3 = mountedHorseScene.joint(
        scene,
        `${side}MiddleProximal`,
        at,
      );
      const tip: IAutoMovieVector3 = mountedHorseScene.joint(
        scene,
        `${side}MiddleDistal`,
        at,
      );
      if (Vector3.distance(root, tip) >= Vector3.distance(root, knuckle))
        findings.push(
          `figure ${i}: the ${side} fingers do not close on the handle (tip ${Vector3.distance(root, tip).toFixed(3)} m, knuckle ${Vector3.distance(root, knuckle).toFixed(3)} m from the wrist)`,
        );
    }
  for (const side of ["left", "right"] as const) {
    const at: number = held(1);
    if (
      Vector3.length(
        mountedHorseScene.local(
          scene.part(`${side}Handle`, at),
          mountedHorseScene.joint(scene, `${side}Hand`, at),
        ),
      ) < 0.15
    )
      findings.push(`basic seat: the ${side} hand stays on its handle`);
    const frame: IAutoMovieTransform = scene.part("seat", at);
    const shoulder: IAutoMovieVector3 = mountedHorseScene.joint(
      scene,
      `${side}UpperArm`,
      at,
    );
    const wrist: IAutoMovieVector3 = mountedHorseScene.joint(
      scene,
      `${side}Hand`,
      at,
    );
    const out: number =
      (side === "left" ? 1 : -1) *
      (mountedHorseScene.local(frame, wrist).x -
        mountedHorseScene.local(frame, shoulder).x);
    const tip: IAutoMovieVector3 = HumanSignature.region(
      scene.reader,
      side === "left" ? "middleTipLeft" : "middleTipRight",
      at,
    );
    if (out < 0.5 * (m.upperArm + m.forearm))
      findings.push(
        `basic seat: the ${side} arm is not stretched to the side (${out.toFixed(3)} m)`,
      );
    if (
      mountedHorseScene.local(frame, tip).y <=
      mountedHorseScene.local(frame, shoulder).y
    )
      findings.push(
        `basic seat: the ${side} fingertips are below the shoulder`,
      );
  }

  // 4. The bench kneels on the pad with the trunk inclined; the seated holds stay upright.
  const pad = scene.horse.affordances.find((a): boolean => a.id === "pad")!;
  const kneel = (at: number): IAutoMovieVector3[] =>
    (["kneeLeft", "kneeRight"] as const).map(
      (region): IAutoMovieVector3 =>
        mountedHorseScene.local(
          scene.part("pad", at),
          HumanSignature.region(scene.reader, region, at),
        ),
    );
  for (const share of [0.1, 0.5, 0.9]) {
    const at: number = arrive(3) + FIGURES[3]!.hold * share;
    for (const knee of kneel(at))
      if (
        Math.abs(knee.y) > CONTACT ||
        Math.abs(knee.x) > pad.width! / 2 ||
        Math.abs(knee.z) > pad.depth! / 2
      )
        findings.push(
          `bench: a knee is off the pad at ${at.toFixed(2)} s (${JSON.stringify(knee)})`,
        );
    if (seatAt(at).y < 0.1)
      findings.push(`bench: the seat still bears at ${at.toFixed(2)} s`);
  }
  const incline = (at: number): number => {
    const frame: IAutoMovieTransform = scene.part("seat", at);
    const hips: IAutoMovieVector3 = Vector3.lerp(
      mountedHorseScene.joint(scene, "leftUpperLeg", at),
      mountedHorseScene.joint(scene, "rightUpperLeg", at),
      0.5,
    );
    const shoulders: IAutoMovieVector3 = Vector3.lerp(
      mountedHorseScene.joint(scene, "leftUpperArm", at),
      mountedHorseScene.joint(scene, "rightUpperArm", at),
      0.5,
    );
    const trunk: IAutoMovieVector3 = Vector3.normalize(
      mountedHorseScene.turned(frame, Vector3.subtract(shoulders, hips)),
    );
    return (Math.acos(Math.max(-1, Math.min(1, trunk.y))) * 180) / Math.PI;
  };
  if (!(incline(held(3)) > 30))
    findings.push(
      `bench: the trunk inclines only ${incline(held(3)).toFixed(1)} degrees`,
    );
  for (const i of [0, 1, 2, 4])
    if (!(incline(held(i)) < 20))
      findings.push(
        `figure ${i}: the seated trunk inclines ${incline(held(i)).toFixed(1)} degrees`,
      );

  // 5. The windows, and the geometry at their boundaries.
  const windows = (
    part: IAutoMovieMotionHumanContactWindow["part"],
  ): number[][] =>
    take.plan.contacts
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean => c.part === part,
      )
      .map((c: IAutoMovieMotionHumanContactWindow): number[] => [
        take.start + c.from * length,
        take.start + c.to * length,
      ])
      .sort((a: number[], b: number[]): number => a[0]! - b[0]!);
  const near = (a: number, b: number): boolean => Math.abs(a - b) < 1e-6;
  const expect = (
    label: string,
    actual: number[][],
    wanted: number[][],
  ): void => {
    if (
      actual.length !== wanted.length ||
      actual.some(
        (w: number[], i: number): boolean =>
          !near(w[0]!, wanted[i]![0]!) || !near(w[1]!, wanted[i]![1]!),
      )
    )
      findings.push(
        `${label} windows ${JSON.stringify(actual)}, wanted ${JSON.stringify(wanted)}`,
      );
  };
  expect("seat", windows("seat"), [
    [take.start, begin(3)],
    [arrive(4), take.end],
  ]);
  expect("left knee", windows("leftLowerLeg"), [[arrive(3), begin(4)]]);
  expect("right knee", windows("rightLowerLeg"), [[arrive(3), begin(4)]]);
  expect("left hand", windows("leftHand"), [
    [arrive(0), begin(1)],
    [arrive(2), take.end],
  ]);
  for (const knee of kneel(arrive(3)))
    if (Math.abs(knee.y) > CONTACT)
      findings.push(
        `bench: a knee is not down when its window opens (${knee.y.toFixed(3)} m)`,
      );
  const halfway: number = (begin(3) + arrive(3)) / 2;
  if (
    kneel(halfway).some(
      (knee: IAutoMovieVector3): boolean =>
        Math.abs(knee.y) < 0.02 &&
        Math.abs(knee.x) <= pad.width! / 2 &&
        Math.abs(knee.z) <= pad.depth! / 2,
    )
  )
    findings.push("bench: a knee bears before its window opens");

  // 6. Refused setups.
  const refused = (label: string, axis: string, run: () => void): void => {
    let error: unknown = null;
    try {
      run();
    } catch (failure) {
      error = failure;
    }
    if (!(error instanceof HumanRefusal && error.axis === axis))
      findings.push(
        `${label}: wanted a refusal on ${axis}, got ${String(error)}`,
      );
  };
  refused("a saddle has no handles", "figures.0.supports.leftHand", () => {
    const saddled: mountedHorseScene.IScene = stage(
      createHorse({ withersHeight: 1.65, tempo: 0, stirrupDrop: 0.66 }, 3),
      body,
      FIGURES,
    );
    saddled.film.bones("rider", saddled.film.duration - 0.1);
  });
  refused("no support held into the bench", "figures.2.supports", () => {
    const unsupported: mountedHorseScene.IScene = stage(
      createHorse({ tack: "surcingle", withersHeight: 1.65, tempo: 0 }, 3),
      body,
      [FIGURES[0]!, FIGURES[1]!, FIGURES[3]!, FIGURES[4]!],
    );
    unsupported.film.bones("rider", unsupported.film.duration - 0.1);
  });

  assertTakeClean("the vaulting take", scene.film);
  TestValidator.equals("vaulting supports on a moving surcingle", findings, []);
}

/** Sit on the surcingle's seat, ride on while the horse sets off, then vault. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  figures: IAutoMovieMotionHumanMounted.IFigure[],
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", { on: "horse", duration: 2, seat: "seat" })
        .registered("mounted", { on: "horse", frame: "seat", figures }),
  });
}
