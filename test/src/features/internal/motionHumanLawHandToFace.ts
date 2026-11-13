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
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  handToFace,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * Everything one hand-to-face task owes on screen, read off the displayed
 * bones of a body standing at the origin heading +Z, as complaints, in parts
 * so each spec runs within the time a test may take: the audit's parts
 * (`motionHumanLaw.auditPart`: `tangle` and `motion-1` to `motion-6`) read 1,
 * and `film` 2 to 6 and 8, all on the right-hand film of the body named; `population` reads 7 on the four bodies
 * of the population sample, and `mirror` reads 9 against the left-hand film.
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
 *    fixed angle; `test_human_motion_prop_held_attitude` bounds a held glass
 *    the same way.
 * 8. Reading flexes the neck and head 33 to 45 degrees from the upright
 *    entry at the sheet (Lee et al. 2015).
 * 9. The left-hand task is the right-hand task mirrored in the median
 *    plane within 5 mm, read 4 times a second.
 *
 * @param task The task.
 * @param part Which expectations are read: an audit part (1, `motionHumanLaw.auditPart`), `film` (2 to 6 and 8), `population` (7, on a vessel's task) or `mirror` (9, on a one-hand task).
 * @param name The body audited over the whole film.
 * @returns One complaint per expectation of the part that does not hold, with its measured numbers (an elbow's travel and the mirror also with the task's events in film seconds); empty when the task is right.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every expectation with its bound and where the bound comes from.
 * @evidence contracts/development/implementation.md#principled-implementation Each expectation is a physical requirement, a cited range or a symmetry, read off displayed bones; none is the law's own goal but the cup's lean at the mouth, bounded by the lean the law asked plus one search step, since that lean is the drinking arm's answer (Murphy et al. 2011) and not a fixed angle.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One film, then one block per expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every expectation is evaluated and reported; none stops the others.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every expectation on the grid reads the film's remembered frames; the population check resolves one instant per body; a part reads only its own expectations, so the audit's finer frames are resolved by its parts alone.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `motionHumanLaw` for the film, the event, the travel and the audit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The films are local and released on return.
 */
export function motionHumanLawHandToFace(
  task: handToFace.Task,
  part: motionHumanLaw.AuditPart | "film" | "population" | "mirror",
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
  const at = (
    bone: AutoMovieHumanoidBone,
    seconds: number,
  ): IAutoMovieVector3 => film.bones("a", seconds).get(bone)!.worldPosition;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const both: boolean = row.other !== undefined;
  const out: string[] = [];
  // The task's events in film seconds, so a complaint at a second says
  // which phase it falls in.
  const events: string = film.performance
    .segments("a")
    .flatMap((segment: HumanSegment.ISegment): string[] =>
      segment.plan.events.map(
        (event: { name: string; share: number }): string =>
          `${event.name} ${(segment.start + event.share * segment.plan.duration).toFixed(2)}`,
      ),
    )
    .join(", ");

  if (part === "population")
    return population(task, row, name, body, film, perform);
  if (part === "mirror") {
    if (both) return out;
    const mirrored = AutoMovieMotionHumanAuditDifference.measure(
      film,
      perform(body, "left"),
      "a",
      { mirror: 0, rate: 4 },
    );
    return motionHumanLaw.expect(
      `${task}: the left-hand task is ${mm(mirrored.distance.value)} mm off the right-hand task's mirror at ${mirrored.distance.seconds.toFixed(2)} s on ${mirrored.distance.where} (limit 5.0; events ${events})`,
      mirrored.distance.value <= 0.005 && mirrored.duration <= 1e-9,
    );
  }

  if (part !== "film")
    return motionHumanLaw.auditPart(film, `${task} ${name}`, "a", body, part);
  for (const bone of ["rightLowerArm", "leftLowerArm"] as const) {
    const elbow = motionHumanLaw.travel(film, "a", bone);
    out.push(
      ...motionHumanLaw.expect(
        `${task}: ${bone} travels ${mm(elbow.value)} mm in the frame from ${elbow.seconds.toFixed(3)} s (limit 80.0; events ${events})`,
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
        `read: the neck and head flex ${flexion.toFixed(1)} deg at ${row.at} (band 33.0 to 45.0)`,
        flexion >= 33 && flexion <= 45,
      ),
    );
  }
  return out;
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
          `${task} ${who}: the cup's axis leans ${from(axis).toFixed(1)} deg at ${row.at} with its top ${axis.z <= 0 ? "toward" : "away from"} the face, toward it (Z at most the sine of 1 deg) and at most the asked ${asked.toFixed(1)} plus ${step} expected`,
          axis.z <= Math.sin(Math.PI / 180) && from(axis) <= asked + step,
        ),
      );
    }
  return out;
}
