import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditDifference,
  AutoMovieMotionHumanTouchDrink,
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanSegment,
  type IAutoMovieMotionHumanAuditMeasure,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  handToFace,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * Everything one hand-to-face task owes on screen, read off the displayed
 * bones of a body standing at the origin heading +Z, as complaints. The
 * task's right-hand film on the body named is performed once and every
 * expectation that reads it reads that one film: the audit's seven parts
 * (`motionHumanLaw.auditParts`) read 1, the film's own checks 2 to 6 and 8,
 * the population check 7 its own body, and the mirror 9 its right-hand
 * side. The only other performances are the left-hand film of the mirror
 * and the population's other bodies.
 *
 * On the body named, over the whole film at 24 Hz:
 *
 * 1. The generic audit is clean: nothing passes into the body, nothing
 *    sinks, slips or leaves the floor, no joint jumps or spikes, the body
 *    stays balanced.
 * 2. No elbow travels more than 80 mm in one frame (1.9 m/s): an arm
 *    raised to the face is carried in joint space toward one fitted branch,
 *    so its elbow follows the trend and never swaps sides of the arm's
 *    plane.
 * 3. At the task's own event the acting wrist is at the face: within a
 *    hand's length plus the head's height of the head's joint, the farthest
 *    a tool held in the hand can lie from a wrist whose tool touches the
 *    head. Reading holds a sheet instead, 17.5 to 58 cm from the eyes
 *    (Bababekova et al. 2011), so the wrist lies within that range plus a
 *    hand's length of the eyes.
 * 4. The film ends where it began: each hand within 10 mm of its place at
 *    the entry, the task being performed from standing and back to it.
 * 5. A one-hand task leaves the other hand within 80 mm of its place.
 * 6. A two-hand task keeps each elbow on its own side of the body's
 *    median plane, read through the chest's joint, from the arrival to the
 *    leave.
 * 7. Drinking and sipping tip the cup toward the lips only as much as the
 *    arm needs, on every body of the population sample: at the mouth the
 *    cup's axis (the row's effector's along axis in the hand, the axis of
 *    the cylinder the fist holds) leans with its top toward the face (the
 *    performer faces +Z, so its Z part is at most the sine of 1 degree) and
 *    no more than the lean the law asked plus one
 *    `AutoMovieMotionHumanTouchDrink.LEAN_STEP`, the asked lean read as that
 *    axis carried by the hand rotation the arm was asked for. A cup held
 *    level at the lips asks the elbow up to the shoulder's height, and a
 *    drinker tips the cup at the lips with the elbow low (Murphy, Willén and
 *    Sunnerhagen 2011), so the lean is the drinking arm's answer and not a
 *    fixed angle; `motionPropHeldAttitude` bounds a held glass
 *    the same way.
 * 8. Reading flexes the neck and head 33 to 45 degrees from the upright
 *    entry at the sheet (Lee et al. 2015).
 * 9. A one-hand task done with the left hand is the right-hand task
 *    mirrored in the median plane within 5 mm, read 4 times a second.
 *
 * @param task The task.
 * @param name The body audited over the whole film.
 * @returns One complaint per expectation that does not hold, with its measured numbers (an elbow's travel and the mirror also with the task's events in film seconds); empty when the task is right.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every expectation with its bound and where the bound comes from, and which films are performed.
 * @evidence contracts/development/implementation.md#principled-implementation Each expectation is a physical requirement, a cited range or a symmetry, read off displayed bones; none is the law's own goal but the cup's lean at the mouth, bounded by the lean the law asked plus one search step, since that lean is the drinking arm's answer (Murphy et al. 2011) and not a fixed angle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One right-hand film, then the audit's parts, the film's checks, the population and the mirror, each reading it.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every expectation is evaluated and reported; none stops the others, and no bound differs from the part-by-part reading it replaces.
 * @evidence contracts/development/implementation.md#efficient-algorithms One right-hand performance per task instead of one per expectation group; the audit's parts and the film's checks share its remembered frames; a complaint's events and numbers are formatted only when it fails.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The right-hand film is the same input every expectation read before (task, right side, this body, the seed `hand-face`), so one performance stands for all of them; `motionHumanLaw` owns the film, the event, the travel and the audit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films are local and released on return.
 */
export function motionHumanLawHandToFace(
  task: handToFace.Task,
  name: "m-average" | "f-minus-one" | "f-small" | "m-large" = "m-average",
): string[] {
  const row: handToFace.IRow = handToFace.ROWS[task];
  const body: IHumanBody = motionHumanBody(name);
  const perform = (
    who: IHumanBody,
    side: "left" | "right",
  ): motionHumanLaw.IFilm =>
    motionHumanLaw.perform(
      "hand-face",
      [{ subject: "a", body: who }],
      HumanChain.subject("a").act("handToFace", { task, side }),
    );
  const film: motionHumanLaw.IFilm = perform(body, "right");
  return [
    ...motionHumanLaw.auditParts(film, `${task} ${name}`, "a", body),
    ...expectations(task, row, body, film),
    ...population(task, row, name, body, film, perform),
    ...mirror(task, row, body, film, perform),
  ];
}

/**
 * The task's events in film seconds, so a complaint at a second says which
 * phase it falls in.
 *
 * @param film The film.
 * @returns Each event's name and second, joined.
 */
function events(film: motionHumanLaw.IFilm): string {
  return film.performance
    .segments("a")
    .flatMap((segment: HumanSegment.ISegment): string[] =>
      segment.plan.events.map(
        (event: { name: string; share: number }): string =>
          `${event.name} ${(segment.start + event.share * segment.plan.duration).toFixed(2)}`,
      ),
    )
    .join(", ");
}

/** Millimetres of a length in metres, to one decimal. */
function mm(metres: number): string {
  return (metres * 1000).toFixed(1);
}

/** The distance between two points, metres. */
function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

/**
 * Expectations 2 to 6 and 8 of `motionHumanLawHandToFace`, on its
 * right-hand film.
 *
 * @param task The task.
 * @param row Its row.
 * @param body The body.
 * @param film Its right-hand film.
 * @returns One complaint per expectation that does not hold.
 */
function expectations(
  task: handToFace.Task,
  row: handToFace.IRow,
  body: IHumanBody,
  film: motionHumanLaw.IFilm,
): string[] {
  const at = (
    bone: AutoMovieHumanoidBone,
    seconds: number,
  ): IAutoMovieVector3 => film.bones("a", seconds).get(bone)!.worldPosition;
  const both: boolean = row.other !== undefined;
  const out: string[] = [];

  for (const bone of ["rightLowerArm", "leftLowerArm"] as const) {
    const elbow: IAutoMovieMotionHumanAuditMeasure = motionHumanLaw.travel(
      film,
      "a",
      bone,
    );
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `${task}: ${bone} travels ${mm(elbow.value)} mm in the frame from ${elbow.seconds.toFixed(3)} s (limit 80.0; events ${events(film)})`,
        elbow.value <= 0.08,
      ),
    );
  }

  const arrival: number = motionHumanLaw.event(film, row.at);
  const hand: number = body.measure.hand;
  const eyes: IAutoMovieVector3 = {
    x: (at("leftEye", arrival).x + at("rightEye", arrival).x) / 2,
    y: (at("leftEye", arrival).y + at("rightEye", arrival).y) / 2,
    z: (at("leftEye", arrival).z + at("rightEye", arrival).z) / 2,
  };
  if (row.region === null) {
    const far: number = distance(at("rightHand", arrival), eyes);
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `${task}: the wrist is ${mm(far)} mm from the eyes at ${row.at} (band ${mm(0.175 - hand)} to ${mm(0.58 + hand)})`,
        far >= 0.175 - hand && far <= 0.58 + hand,
      ),
    );
  } else {
    const head: number = body.measure.stature - at("head", 0).y;
    for (const bone of both
      ? (["rightHand", "leftHand"] as const)
      : (["rightHand"] as const)) {
      const far: number = distance(at(bone, arrival), at("head", arrival));
      out.push(
        ...motionHumanLaw.expect(
          (): string =>
            `${task}: the ${bone} is ${mm(far)} mm from the head's joint at ${row.at} (limit ${mm(hand + head)})`,
          far <= hand + head,
        ),
      );
    }
  }

  for (const bone of ["rightHand", "leftHand"] as const) {
    const back: number = distance(at(bone, film.duration), at(bone, 0));
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `${task}: the ${bone} ends ${mm(back)} mm from its entry (limit 10.0)`,
        back <= 0.01,
      ),
    );
  }
  const times: number[] = IAutoMovieMotionHumanAuditMotion.grid(
    0,
    film.duration,
    24,
  );
  if (!both) {
    const strayed: number = Math.max(
      ...times.map((t: number): number =>
        distance(at("leftHand", t), at("leftHand", 0)),
      ),
    );
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `${task}: the idle hand strays ${mm(strayed)} mm (limit 80.0)`,
        strayed <= 0.08,
      ),
    );
  } else {
    const ready: number = motionHumanLaw.event(film, "ready");
    const relax: number = motionHumanLaw.event(film, "relax");
    for (const [bone, shoulder] of [
      ["rightLowerArm", "rightUpperArm"],
      ["leftLowerArm", "leftUpperArm"],
    ] as const) {
      const own: number = Math.sign(at(shoulder, 0).x - at("hips", 0).x);
      const crossed: number = Math.max(
        ...times
          .filter((t: number): boolean => t >= ready && t <= relax)
          .map(
            (t: number): number => -own * (at(bone, t).x - at("chest", t).x),
          ),
      );
      out.push(
        ...motionHumanLaw.expect(
          (): string =>
            `${task}: the ${bone} joint crosses the median plane by ${mm(crossed)} mm`,
          crossed <= 0,
        ),
      );
    }
  }

  if (task === "read") {
    let flexion: number = 0;
    for (const [seconds, sign] of [
      [arrival, 1],
      [0, -1],
    ] as const)
      for (const joint of film.performance.pose("a", seconds)
        .joints as IAutoMovieJointPose[])
        if (joint.bone === "neck" || joint.bone === "head")
          flexion += sign * (joint.flexion ?? 0);
    out.push(
      ...motionHumanLaw.expect(
        (): string =>
          `read: the neck and head flex ${flexion.toFixed(1)} deg at ${row.at} (band 33.0 to 45.0)`,
        flexion >= 33 && flexion <= 45,
      ),
    );
  }
  return out;
}

/**
 * Expectation 9 of `motionHumanLawHandToFace`, the left-hand film against
 * the right-hand film's mirror image.
 *
 * @param task The task.
 * @param row Its row.
 * @param body The body.
 * @param film Its right-hand film.
 * @param perform Performs the task on a body with a hand.
 * @returns The complaint when the mirror does not hold; none for a two-hand task.
 */
function mirror(
  task: handToFace.Task,
  row: handToFace.IRow,
  body: IHumanBody,
  film: motionHumanLaw.IFilm,
  perform: (who: IHumanBody, side: "left" | "right") => motionHumanLaw.IFilm,
): string[] {
  if (row.other !== undefined) return [];
  const mirrored: AutoMovieMotionHumanAuditDifference.IResult =
    AutoMovieMotionHumanAuditDifference.measure(
    film,
    perform(body, "left"),
    "a",
    { mirror: 0, rate: 4 },
  );
  return motionHumanLaw.expect(
    (): string =>
      `${task}: the left-hand task is ${mm(mirrored.distance.value)} mm off the right-hand task's mirror at ${mirrored.distance.seconds.toFixed(2)} s on ${mirrored.distance.where} (limit 5.0; events ${events(film)})`,
    mirrored.distance.value <= 0.005 && mirrored.duration <= 1e-9,
  );
}

/**
 * Expectation 7 of `motionHumanLawHandToFace`, the cup's lean at the mouth,
 * on the four bodies of the population sample.
 *
 * @param task The task.
 * @param row Its row.
 * @param name The body whose film is given.
 * @param body That body.
 * @param film Its right-hand film.
 * @param perform Performs the task on another body with a hand.
 * @returns One complaint per body whose cup leans wrong; none for a task without a vessel.
 */
function population(
  task: handToFace.Task,
  row: handToFace.IRow,
  name: string,
  body: IHumanBody,
  film: motionHumanLaw.IFilm,
  perform: (who: IHumanBody, side: "left" | "right") => motionHumanLaw.IFilm,
): string[] {
  const out: string[] = [];
  if (row.upright === true)
    for (const who of [
      "m-average",
      "f-minus-one",
      "f-small",
      "m-large",
    ] as const) {
      const subject: IHumanBody = who === name ? body : motionHumanBody(who);
      const shown: motionHumanLaw.IFilm =
        who === name ? film : perform(subject, "right");
      const seconds: number = motionHumanLaw.event(shown, row.at);
      const cup: IAutoMovieVector3 = AutoMovieMotionHumanTouchEffector.local(
        subject,
        "right",
        row.effector,
      ).forward;
      const off = (rotation: IAutoMovieQuaternion): IAutoMovieVector3 =>
        Quaternion.rotateVector(rotation, cup);
      const from = (direction: IAutoMovieVector3): number =>
        (Math.acos(Math.min(1, Math.max(-1, direction.y))) * 180) / Math.PI;
      const hand: IAutoMovieQuaternion = shown
        .bones("a", seconds)
        .get("rightHand")!.worldRotation;
      const axis: IAutoMovieVector3 = off(hand);
      const asked: number = from(
        off(
          shown.performance.posture("a", seconds).limbs.rightArm?.rotation ??
            hand,
        ),
      );
      const step: number = AutoMovieMotionHumanTouchDrink.LEAN_STEP;
      out.push(
        ...motionHumanLaw.expect(
          (): string =>
            `${task} ${who}: the cup's axis leans ${from(axis).toFixed(1)} deg at ${row.at} with its top ${axis.z <= 0 ? "toward" : "away from"} the face, toward it (Z at most the sine of 1 deg) and at most the asked ${asked.toFixed(1)} plus ${step} expected`,
          axis.z <= Math.sin(Math.PI / 180) && from(axis) <= asked + step,
        ),
      );
    }
  return out;
}
