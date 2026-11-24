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
import { HumanFoot, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { mountedHorseScene } from "../../../features/internal/mountedHorseScene";

/** The campaign's held-contact bound, metres. */
const CONTACT: number = 0.01;

/** Seconds the horse stands while the rider sits on. */
const WAIT: number = 6;

/** The four contacts every figure keeps. */
const HOLD: IAutoMovieMotionHumanMounted.ISupports = {
  leftFoot: "leftStirrup",
  rightFoot: "rightStirrup",
  leftHand: "leftRein",
  rightHand: "rightRein",
};

/** Seated, two-point, a crouch with a hand ride, standing in the stirrups, seated again. */
const FIGURES: IAutoMovieMotionHumanMounted.IFigure[] = [
  { seat: "entered", transfer: 0.4, hold: 0.3, supports: HOLD },
  { seat: "twoPoint", transfer: 0.8, hold: 1.5, supports: HOLD },
  { seat: "crouch", transfer: 0.8, hold: 2, supports: HOLD, handRide: true },
  { seat: "standing", transfer: 0.8, hold: 1, supports: HOLD },
  { seat: "entered", transfer: 0.8, hold: 0.5, supports: HOLD },
];

/**
 * Riding a canter out of the saddle: from the seat to the two-point seat,
 * the racing crouch with a hand ride, standing in the stirrups and back to
 * the seat, the stirrups and reins held throughout.
 *
 * Scenarios:
 * 1. Out of the saddle, the displayed seat region stands at least 30 mm over the saddle's seat (`HumanMountedStirrups.CLEAR`) and the seat bears no window; seated, it stays within 10 mm.
 * 2. Both displayed balls of the feet stay within 10 mm of their stirrups' treads at every hold and halfway through every transfer: no jump in contact; the stirrup and rein windows run the whole take.
 * 3. Over one stride of the crouch the displayed pelvis rises and falls less than the saddle does, the decoupling Pfau et al. (2009) describe.
 * 4. Each displayed palm stays within 10 mm of its rein's line; in the hand ride it travels along the rein, more than 30 mm between the stride's extremes, and returns within 10 mm a stride later.
 * 5. A second take adds right-hand whip strokes in the crouch at the stride's leading-fore landings: each stroke's event is at its cue instant, the displayed right wrist reaches farthest back of the pelvis within 1/24 s of it, lies out and behind the right hip there, and the right rein window is open around it.
 * 6. Stirrups at the band's longest refuse the crouch for a small rider, and a hand ride without a stride is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the take, the six scenarios and each bound's source.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the mounted law on an actual cantering saddle horse and reads the displayed seat, balls, pelvis and palms against the horse's moving seat, stirrups and reins; a seat left in the saddle, a pelvis bobbing with the back, a foot jumping off its stirrup, a hand off its rein or an accepted unreachable stirrup fails.
 * @evidence contracts/development/testing.md#independent-expectations Contact frames are the archetype ride's own; the 10 mm bound is the campaign's; the decoupling is the cited relation, read as a comparison of two measured excursions.
 * @evidence contracts/development/testing.md#distinguishing-cases Seated against out of the saddle, a hand ride against still hands, reachable against too long stirrups and a hand ride with and without a stride.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory film of one polygon man and one archetype ride, plus two refused plans.
 */
export function test_motion_mount_equestrian_twopoint(): void {
  const findings: string[] = [];
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-tall");
  const horse: mountedHorseScene.Horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.575, tempo: 0 },
    8,
  );
  const scene: mountedHorseScene.IScene = stage(horse, body, FIGURES);
  const stride: number = strideOf(scene.ride);
  const take: IAutoMovieMotionHumanSegment = scene.segments.find(
    (segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.events.some((e): boolean => e.name === "crouch:2"),
  )!;
  const length: number = take.end - take.start;
  const arrive = (i: number): number =>
    take.start + take.plan.events[i]!.share * length;
  const begin = (i: number): number =>
    i === 0 ? take.start : arrive(i) - FIGURES[i]!.transfer;
  const held = (i: number): number => arrive(i) + FIGURES[i]!.hold / 2;

  // 1. The seat clears the saddle out of it, and bears in it.
  const seatAt = (at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part("seat", at),
      HumanSignature.region(scene.reader, "seat", at),
    );
  FIGURES.forEach(
    (figure: IAutoMovieMotionHumanMounted.IFigure, i: number): void => {
      const y: number = seatAt(held(i)).y;
      if (figure.seat === "entered" ? Math.abs(y) > CONTACT : y < 0.03)
        findings.push(
          `${figure.seat}: the seat stands ${y.toFixed(3)} m over the saddle`,
        );
    },
  );
  const seats: number[][] = windows(take, "seat");
  if (
    seats.length !== 2 ||
    Math.abs(seats[0]![1]! - begin(1)) > 1e-6 ||
    Math.abs(seats[1]![0]! - arrive(4)) > 1e-6
  )
    findings.push(`seat windows ${JSON.stringify(seats)}`);

  // 2. The stirrups hold through every hold and transfer.
  const ball = (side: "left" | "right", at: number): IAutoMovieVector3 =>
    mountedHorseScene.local(
      scene.part(`${side}Stirrup`, at),
      HumanFoot.sockets(
        body,
        HumanSignature.bones(scene.reader, at),
        side,
      ).find(
        (s: IAutoMovieMotionHumanFoot.ISocket): boolean => s.socket === "ball",
      )!.point,
    );
  const rested: Record<"left" | "right", IAutoMovieVector3> = {
    left: ball("left", held(0)),
    right: ball("right", held(0)),
  };
  const instants: number[] = FIGURES.flatMap((_, i: number): number[] => [
    held(i),
    (begin(i) + arrive(i)) / 2,
  ]);
  for (const at of instants)
    for (const side of ["left", "right"] as const) {
      const foot: IAutoMovieVector3 = ball(side, at);
      if (
        Math.abs(foot.y) > CONTACT ||
        Vector3.distance(foot, rested[side]) > CONTACT
      )
        findings.push(
          `the ${side} ball leaves its stirrup at ${at.toFixed(2)} s (${JSON.stringify(foot)})`,
        );
    }
  for (const part of [
    "leftFoot",
    "rightFoot",
    "leftHand",
    "rightHand",
  ] as const) {
    const found: number[][] = windows(take, part);
    if (
      found.length !== 1 ||
      found[0]![0]! > take.start + 1e-6 ||
      found[0]![1]! < take.end - 1e-6
    )
      findings.push(
        `${part} windows ${JSON.stringify(found)} do not run the whole take`,
      );
  }

  // 3. The pelvis rides level over the crouch's stride while the saddle rises and falls.
  const span = (read: (at: number) => number): number => {
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let k: number = 0; k <= 24; ++k) {
      const value: number = read(arrive(2) + 0.2 + (k / 24) * stride);
      low = Math.min(low, value);
      high = Math.max(high, value);
    }
    return high - low;
  };
  const pelvis: number = span(
    (at: number): number => mountedHorseScene.joint(scene, "hips", at).y,
  );
  const saddle: number = span(
    (at: number): number => scene.part("seat", at).translation.y,
  );
  if (!(pelvis < saddle))
    findings.push(
      `crouch: the pelvis moves ${pelvis.toFixed(4)} m vertically, the saddle ${saddle.toFixed(4)} m`,
    );

  // 4. The palms stay on the rein lines; the hand ride travels along them once a stride.
  const along = (side: "left" | "right", at: number): number[] => {
    const hand = scene.film.bones("rider", at).get(`${side}Hand`)!;
    const palm: IAutoMovieVector3 = Vector3.add(
      hand.worldPosition,
      Quaternion.rotateVector(
        hand.worldRotation,
        HumanHand.offset(body, side, "palm").point,
      ),
    );
    const rein: IAutoMovieTransform = scene.part(`${side}Rein`, at);
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(rein.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const radius: number =
      scene.horse.affordances.find((a): boolean => a.id === `${side}Rein`)!
        .aperture! / 2;
    const skin: IAutoMovieVector3 = Vector3.addScaled(
      rein.translation,
      Quaternion.rotateVector(rein.rotation, { x: 0, y: 1, z: 0 }),
      radius,
    );
    const offset: IAutoMovieVector3 = Vector3.subtract(palm, skin);
    const run: number = Vector3.dot(offset, axis);
    return [
      Vector3.length(Vector3.subtract(offset, Vector3.scale(axis, run))),
      run,
    ];
  };
  for (const i of [0, 1, 2, 3, 4])
    for (const side of ["left", "right"] as const) {
      const [off] = along(side, held(i));
      if (off! > CONTACT)
        findings.push(
          `figure ${i}: the ${side} palm is ${off!.toFixed(3)} m off its rein`,
        );
    }
  for (const side of ["left", "right"] as const) {
    let low: number = Infinity;
    let high: number = -Infinity;
    const start: number = arrive(2) + 0.1;
    for (let k: number = 0; k <= 16; ++k) {
      const [, run] = along(side, start + (k / 16) * stride);
      low = Math.min(low, run!);
      high = Math.max(high, run!);
    }
    if (!(high - low > 0.03))
      findings.push(
        `hand ride: the ${side} palm travels only ${(high - low).toFixed(3)} m along its rein`,
      );
    if (
      Math.abs(along(side, start)[1]! - along(side, start + stride)[1]!) >
      CONTACT
    )
      findings.push(
        `hand ride: the ${side} palm does not return a stride later`,
      );
  }

  // 5. Whip strokes on the right at the stride's landings inside the crouch, a second take.
  const strike: number[] = scene.ride.instants
    .filter((e): boolean => e.label === "leftForeOn")
    .map((e): number => WAIT + e.seconds)
    .filter(
      (t: number): boolean =>
        t > arrive(2) + 0.4 && t < arrive(2) + FIGURES[2]!.hold - 0.4,
    );
  const whipped: mountedHorseScene.IScene = stage(
    horse,
    body,
    FIGURES.map(
      (
        figure: IAutoMovieMotionHumanMounted.IFigure,
        i: number,
      ): IAutoMovieMotionHumanMounted.IFigure =>
        i === 2
          ? { ...figure, whip: { hand: "right", cue: "stride" } }
          : figure,
    ),
    true,
    strike,
  );
  const stroked: IAutoMovieMotionHumanSegment = whipped.segments.find(
    (segment: IAutoMovieMotionHumanSegment): boolean =>
      segment.plan.events.some((e): boolean => e.name === "whip:0"),
  )!;
  const events: number[] = stroked.plan.events
    .filter((e): boolean => e.name.startsWith("whip:"))
    .map(
      (e): number => stroked.start + e.share * (stroked.end - stroked.start),
    );
  if (
    strike.length === 0 ||
    events.length !== strike.length ||
    events.some(
      (t: number, k: number): boolean => Math.abs(t - strike[k]!) > 1e-6,
    )
  )
    findings.push(
      `whip: strokes at ${JSON.stringify(events)}, cues at ${JSON.stringify(strike)}`,
    );
  for (const cue of strike) {
    // How far behind the rider's own pelvis the striking wrist is: the stroke's own frame, free of the saddle's travel under a levelled pelvis.
    const behind = (at: number): number => {
      const pelvis = whipped.film.bones("rider", at).get("hips")!;
      return mountedHorseScene.local(
        {
          translation: pelvis.worldPosition,
          rotation: pelvis.worldRotation,
          scale: { x: 1, y: 1, z: 1 },
        },
        mountedHorseScene.joint(whipped, "rightHand", at),
      ).z;
    };
    let farthest: number = cue;
    for (let k: number = -12; k <= 12; ++k) {
      const at: number = cue + k / 48;
      if (behind(at) < behind(farthest)) farthest = at;
    }
    if (Math.abs(farthest - cue) > 1 / 24)
      findings.push(
        `whip: the stroke reaches back at ${farthest.toFixed(3)} s, its cue is ${cue.toFixed(3)} s`,
      );
    const hip: IAutoMovieVector3 = mountedHorseScene.local(
      whipped.part("seat", cue),
      mountedHorseScene.joint(whipped, "rightUpperLeg", cue),
    );
    const wrist: IAutoMovieVector3 = mountedHorseScene.local(
      whipped.part("seat", cue),
      mountedHorseScene.joint(whipped, "rightHand", cue),
    );
    if (!(wrist.z < hip.z && wrist.x < hip.x))
      findings.push(
        `whip: at ${cue.toFixed(3)} s the right wrist is not out and behind the right hip`,
      );
    if (
      windows(stroked, "rightHand").some(
        (w: number[]): boolean => w[0]! <= cue && w[1]! >= cue,
      )
    )
      findings.push(
        `whip: the right hand still grips its rein at the stroke ${cue.toFixed(3)} s`,
      );
  }

  // 6. Refusals.
  const refused = (label: string, axis: RegExp, run: () => void): void => {
    let error: unknown = null;
    try {
      run();
    } catch (failure) {
      error = failure;
    }
    if (!(error instanceof HumanRefusal && axis.test(error.axis)))
      findings.push(
        `${label}: wanted a refusal on ${axis}, got ${String(error)}`,
      );
  };
  refused(
    "long stirrups",
    /^supports\.(left|right)Foot$|^figures\.crouch$/,
    () => {
      const long: mountedHorseScene.IScene = stage(
        createHorse({ withersHeight: 1.8, stirrupDrop: 0.775, tempo: 0 }, 8),
        motionHumanBody("f-small"),
        [
          {
            ...FIGURES[0]!,
            supports: { leftHand: "leftRein", rightHand: "rightRein" },
          },
          { ...FIGURES[2]!, handRide: false },
          {
            ...FIGURES[4]!,
            supports: { leftHand: "leftRein", rightHand: "rightRein" },
          },
        ],
      );
      long.film.bones("rider", long.film.duration - 0.1);
    },
  );
  refused("a hand ride without a stride", /^figures\.2\.handRide$/, () => {
    const loose: mountedHorseScene.IScene = stage(horse, body, FIGURES, false);
    loose.film.bones("rider", loose.film.duration - 0.1);
  });

  assertTakeClean("the out-of-saddle seats", scene.film);
  assertTakeClean("the whipped two-point", whipped.film);
  TestValidator.equals("out-of-saddle seats at the canter", findings, []);
}

/** Sit, ride on with the stirrups and reins while the horse sets off at the canter, then the figures. */
function stage(
  horse: mountedHorseScene.Horse,
  body: IAutoMovieMotionHumanBody,
  figures: IAutoMovieMotionHumanMounted.IFigure[],
  stride: boolean = true,
  strokes: readonly number[] = [],
): mountedHorseScene.IScene {
  let time: number | undefined;
  const scene: mountedHorseScene.IScene = mountedHorseScene.build({
    horse,
    body,
    gait: "canter",
    wait: WAIT,
    cues: {
      stride: strokes.map((seconds: number) => ({ name: "stroke", seconds })),
    },
    from: { x: 0.6, y: 0, z: -0.2 },
    acts: (seated) =>
      seated
        .registered("ride", {
          on: "horse",
          duration: 3,
          seat: "seat",
          feet: { left: "leftStirrup", right: "rightStirrup" },
          hands: { left: "leftRein", right: "rightRein" },
        })
        .registered("mounted", {
          on: "horse",
          frame: "seat",
          figures,
          ...(stride
            ? {
                stride: (time ??= strideOf(
                  mountedHorseScene.course(horse, "canter"),
                )),
              }
            : {}),
        }),
  });
  return scene;
}

/** The ride's stride time, seconds: the median interval between the leading fore hoof's landings. */
function strideOf(ride: mountedHorseScene.Ride): number {
  const lands: number[] = ride.instants
    .filter((e): boolean => e.label === "leftForeOn")
    .map((e): number => e.seconds);
  const gaps: number[] = lands
    .slice(1)
    .map((t: number, i: number): number => t - lands[i]!)
    .sort((a: number, b: number): number => a - b);
  return gaps[Math.floor(gaps.length / 2)]!;
}

/** A part's windows in film seconds. */
function windows(
  take: IAutoMovieMotionHumanSegment,
  part: IAutoMovieMotionHumanContactWindow["part"],
): number[][] {
  const length: number = take.end - take.start;
  return take.plan.contacts
    .filter((c: IAutoMovieMotionHumanContactWindow): boolean => c.part === part)
    .map((c: IAutoMovieMotionHumanContactWindow): number[] => [
      take.start + c.from * length,
      take.start + c.to * length,
    ]);
}
