import { createHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanMounted,
  IAutoMovieMotionHumanSegment,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanRefusal, HumanSignature } from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider is seated sideways and settles. */
const WAIT: number = 6;

/** Settle onto the side saddle with the reins, ride, then turn back to the sideways seat. */
const FIGURES: IAutoMovieMotionHumanMounted.IFigure[] = [
  {
    seat: "aside",
    transfer: 1.5,
    hold: 4,
    supports: {
      rightThigh: "fixedHead",
      leftFoot: "leftStirrup",
      leftHand: "leftRein",
      rightHand: "rightRein",
    },
  },
  { seat: "entered", transfer: 1.2, hold: 0.3 },
];

/**
 * A side-saddle take on a walking horse: the rider sits on the side saddle
 * sideways from the near side, turns square to the front with the right
 * thigh over the fixed head, the left foot in the one stirrup and the hands
 * on the reins, rides so while the horse walks, and turns back to the
 * sideways seat, letting go of the head, the stirrup and the reins.
 *
 * Scenarios:
 * 1. The horse's root travels at least a metre during the side-saddle hold.
 * 2. Pelvis attitude: in the hold the displayed pelvis faces within 15 degrees of the horse's front, the Side Saddle Association's "straight and square"; sideways, before the turn and after the release, within 25 degrees of the near side.
 * 3. Asymmetry: in the hold both displayed knees lie on the near side of the horse's midline, and the right thigh's axis passes over the fixed head, within the head's and the thigh's radii plus 20 mm and between the hip and the knee.
 * 4. Support: the displayed ball of the left foot stays within 10 mm of the stirrup's tread plane and slides less than 10 mm on it; the seat region stays within 10 mm of the seat; each palm stays within 10 mm of its rein.
 * 5. Windows: the right thigh and both hands are acquired when the turn arrives and released when the turn back begins; the left foot bears through the whole hold (the leg-up may already set it in the stirrup, and the sideways seat keeps it there); after the release the right thigh clears the fixed head by more than 20 mm beyond the two radii.
 * 6. An aside figure without its stirrup is refused on the missing support, and a stirrup beyond the leg's band on its reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, the six scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law on an actual walking side-saddle horse and reads the displayed pelvis, knees, thigh, sole, seat and palms against the horse's moving contacts and root; a symmetric straddle, a pelvis left sideways, a foot left behind by the moving stirrup or a window that disagrees with the geometry fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact positions come from the archetype's own ride; the 10 mm bound is the campaign's; the arrangement (right leg round the upper head, left foot in the stirrup, sitting square) is the Side Saddle Association's.
 * @evidence contracts/development/testing.md#distinguishing-cases Sideways against square pelvis, near against off side, held against released supports, a complete against a missing support, and a reachable against an unreachable stirrup.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory film of one polygon man and one archetype ride per case; the vaulting and bareback specs own their seats.
 */
export function test_motion_mount_equestrian_sidesaddle(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const scene: mountedHorseScene.IScene = stage(
    createHorse(
      { tack: "sidesaddle", withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
      4,
    ),
    body,
    FIGURES,
  );
  const take: IAutoMovieMotionHumanSegment = scene.segments.find(
    (segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.events.some((e): boolean => e.name === "aside:0"),
  )!;
  const length: number = take.end - take.start;
  const arrive = (i: number): number =>
    take.start + take.plan.events[i]!.share * length;
  const begin = (i: number): number =>
    i === 0 ? take.start : arrive(i) - FIGURES[i]!.transfer;
  const holding: number[] = [0.1, 0.5, 0.9].map(
    (share: number): number => arrive(0) + FIGURES[0]!.hold * share,
  );

  // 1. The carrier moves while the rider sits aside.
  if (
    Vector3.distance(
      scene.place(holding[0]!).position,
      scene.place(holding[2]!).position,
    ) < 1
  )
    findings.push("the horse must walk on during the side-saddle hold");

  // 2. The pelvis turns square, then back.
  const facing = (at: number): IAutoMovieVector3 => {
    const hips = scene.film.bones("rider", at).get("hips")!;
    const frame: IAutoMovieTransform = {
      translation: scene.place(at).position,
      rotation: scene.place(at).rotation,
      scale: { x: 1, y: 1, z: 1 },
    };
    return mountedHorseScene.turned(
      frame,
      Quaternion.rotateVector(hips.worldRotation, { x: 0, y: 0, z: 1 }),
    );
  };
  const off = (direction: IAutoMovieVector3, axis: IAutoMovieVector3): number =>
    (Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(Vector3.normalize({ ...direction, y: 0 }), axis),
        ),
      ),
    ) *
      180) /
    Math.PI;
  for (const at of holding)
    if (off(facing(at), { x: 0, y: 0, z: 1 }) > 15)
      findings.push(
        `aside: the pelvis is ${off(facing(at), { x: 0, y: 0, z: 1 }).toFixed(1)} degrees off square at ${at.toFixed(2)} s`,
      );
  for (const at of [take.start, take.end])
    if (off(facing(at), { x: 1, y: 0, z: 0 }) > 25)
      findings.push(
        `sideways: the pelvis is ${off(facing(at), { x: 1, y: 0, z: 0 }).toFixed(1)} degrees off the near side at ${at.toFixed(2)} s`,
      );

  // 3. Both knees on the near side; the right thigh over the fixed head.
  const head = scene.horse.affordances.find(
    (a): boolean => a.id === "fixedHead",
  )!;
  const thighOver = (at: number): { gap: number; along: number } => {
    const hip: IAutoMovieVector3 = mountedHorseScene.joint(
      scene,
      "rightUpperLeg",
      at,
    );
    const knee: IAutoMovieVector3 = mountedHorseScene.joint(
      scene,
      "rightLowerLeg",
      at,
    );
    const point: IAutoMovieVector3 = scene.part("fixedHead", at).translation;
    const axis: IAutoMovieVector3 = Vector3.subtract(knee, hip);
    const along: number =
      Vector3.dot(Vector3.subtract(point, hip), axis) / Vector3.dot(axis, axis);
    const nearest: IAutoMovieVector3 = Vector3.add(
      hip,
      Vector3.scale(axis, Math.max(0, Math.min(1, along))),
    );
    return { gap: Vector3.distance(point, nearest), along };
  };
  for (const at of holding) {
    const root: IAutoMovieTransform = {
      translation: scene.place(at).position,
      rotation: scene.place(at).rotation,
      scale: { x: 1, y: 1, z: 1 },
    };
    for (const side of ["left", "right"] as const) {
      const knee: IAutoMovieVector3 = mountedHorseScene.local(
        root,
        mountedHorseScene.joint(scene, `${side}LowerLeg`, at),
      );
      if (!(knee.x > 0))
        findings.push(
          `aside: the ${side} knee is off the near side (${knee.x.toFixed(3)} m)`,
        );
    }
    const { gap, along } = thighOver(at);
    const most: number = head.aperture! / 2 + body.measure.thighRadius + 0.02;
    if (!(gap <= most && gap >= head.aperture! / 2 && along > 0 && along < 1))
      findings.push(
        `aside: the right thigh is not over the fixed head (gap ${gap.toFixed(3)} m, along ${along.toFixed(2)})`,
      );
  }

  // 4. The sole, the seat and the palms hold their moving contacts.
  const ball = (at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part("leftStirrup", at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(scene.reader, at),
        "left",
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point,
    );
  const rested: IAutoMovieVector3 = ball(holding[0]!);
  const seatAt = (at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    );
  const sat: IAutoMovieVector3 = seatAt(holding[0]!);
  for (const at of holding) {
    const foot: IAutoMovieVector3 = ball(at);
    if (Math.abs(foot.y) > CONTACT || Vector3.distance(foot, rested) > CONTACT)
      findings.push(
        `aside: the left sole leaves its stirrup at ${at.toFixed(2)} s (${JSON.stringify(foot)})`,
      );
    const seat: IAutoMovieVector3 = seatAt(at);
    if (Math.abs(seat.y) > CONTACT || Vector3.distance(seat, sat) > CONTACT)
      findings.push(
        `aside: the seat leaves the saddle at ${at.toFixed(2)} s (${JSON.stringify(seat)})`,
      );
    for (const side of ["left", "right"] as const) {
      const gap: number = mountedHorseScene.palm(
        scene,
        side,
        `${side}Rein`,
        at,
      );
      if (gap > CONTACT)
        findings.push(
          `aside: the ${side} palm misses its rein by ${gap.toFixed(3)} m at ${at.toFixed(2)} s`,
        );
    }
  }

  // 5. Acquisition when the turn arrives, release when the turn back begins.
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
      ]);
  for (const part of ["rightUpperLeg", "leftHand", "rightHand"] as const) {
    const found: number[][] = windows(part);
    if (
      found.length !== 1 ||
      Math.abs(found[0]![0]! - arrive(0)) > 1e-6 ||
      Math.abs(found[0]![1]! - begin(1)) > 1e-6
    )
      findings.push(
        `${part} windows ${JSON.stringify(found)}, wanted [[${arrive(0)}, ${begin(1)}]]`,
      );
  }
  // The sideways leg-up may already set the left foot in the stirrup, where the sideways seat keeps it; either way it bears through the whole side-saddle hold.
  if (
    !windows("leftFoot").some(
      (w: number[]): boolean =>
        w[0]! <= arrive(0) + 1e-6 && w[1]! >= begin(1) - 1e-6,
    )
  )
    findings.push(
      `left foot windows ${JSON.stringify(windows("leftFoot"))} lack the stirrup's [[${arrive(0)}, ${begin(1)}]]`,
    );
  if (
    thighOver(take.end).gap <
    head.aperture! / 2 + body.measure.thighRadius + 0.02
  )
    findings.push("released: the right thigh still lies on the fixed head");

  // 6. Refusals.
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
  refused("no stirrup", "figures.0.supports.leftFoot", () => {
    const rest: IAutoMovieMotionHumanMounted.ISupports = {
      rightThigh: "fixedHead",
      leftHand: "leftRein",
      rightHand: "rightRein",
    };
    const missing: mountedHorseScene.IScene = stage(
      createHorse(
        {
          tack: "sidesaddle",
          withersHeight: 1.65,
          stirrupDrop: 0.66,
          tempo: 0,
        },
        4,
      ),
      body,
      [{ ...FIGURES[0]!, supports: rest }, FIGURES[1]!],
    );
    missing.film.bones("rider", missing.film.duration - 0.1);
  });
  refused("an unreachable stirrup", "supports.leftFoot", () => {
    const far: mountedHorseScene.IScene = stage(
      createHorse(
        {
          tack: "sidesaddle",
          withersHeight: 1.8,
          stirrupDrop: 0.775,
          tempo: 0,
        },
        4,
      ),
      motionHumanBody("f-small"),
      FIGURES,
    );
    far.film.bones("rider", far.film.duration - 0.1);
  });

  assertTakeClean("the side-saddle take", scene.film);
  TestValidator.equals("side-saddle supports on a walking horse", findings, []);
}

/** Sit sideways on the side saddle from the near side, then perform the figures. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  figures: IAutoMovieMotionHumanMounted.IFigure[],
): mountedHorseScene.IScene {
  return mountedHorseScene.build({
    horse,
    body,
    gait: "walk",
    wait: WAIT,
    from: { x: 0, y: 0, z: 0.35 },
    acts: (seated) =>
      seated.registered("mounted", { on: "horse", frame: "seat", figures }),
  });
}
