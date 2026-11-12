import { Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditDifference,
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanBody,
  handToFace,
} from "@automovie/motions";

import { motionHumanBody } from "./motionHumanBody";
import { motionHumanLaw } from "./motionHumanLaw";

/**
 * Everything one hand-to-face task owes on screen, read off the displayed
 * bones of a body standing at the origin heading +Z, as complaints.
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
 *    median plane from the arrival to the leave.
 * 7. Drinking and sipping hold the cup level at the mouth: the thumb's
 *    axis within 10 degrees of world up (Mayer and Krechetnikov 2012), on
 *    every body of the population sample.
 * 8. Reading flexes the neck and head 33 to 45 degrees from the upright
 *    entry at the sheet (Lee et al. 2015).
 * 9. The left-hand task is the right-hand task mirrored in the median
 *    plane within 5 mm, read 4 times a second.
 *
 * @param task The task.
 * @param name The body audited over the whole film.
 * @returns One complaint per expectation that does not hold, with its measured numbers; empty when the task is right.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists every expectation with its bound and where the bound comes from.
 * @evidence contracts/development/implementation.md#principled-implementation Each expectation is a physical requirement, a cited range or a symmetry, read off displayed bones; none is the law's own goal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One film, then one block per expectation.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every expectation is evaluated and reported; none stops the others.
 * @evidence contracts/development/implementation.md#efficient-algorithms Every expectation on the grid reads the film's remembered frames; the population check resolves one instant per body.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `motionHumanLaw` for the film, the event, the travel and the audit.
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
  const at = (
    bone: AutoMovieHumanoidBone,
    seconds: number,
  ): IAutoMovieVector3 => film.bones("a", seconds).get(bone)!.worldPosition;
  const distance = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  const mm = (metres: number): string => (metres * 1000).toFixed(1);
  const both: boolean = row.other !== undefined;
  const out: string[] = [];

  out.push(...motionHumanLaw.audit(film, `${task} ${name}`, "a", body));
  for (const bone of ["rightLowerArm", "leftLowerArm"] as const) {
    const elbow = motionHumanLaw.travel(film, "a", bone);
    out.push(
      ...motionHumanLaw.expect(
        `${task}: ${bone} travels ${mm(elbow.value)} mm in the frame from ${elbow.seconds.toFixed(3)} s (limit 80.0)`,
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
            (t: number): number =>
              -own * (at(bone, t).x - at("upperChest", t).x),
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

  if (row.upright === true)
    for (const who of [
      "m-average",
      "f-minus-one",
      "f-small",
      "m-large",
    ] as const) {
      const shown: motionHumanLaw.IFilm =
        who === name ? film : perform(motionHumanBody(who), "right");
      const thumb: IAutoMovieVector3 = Quaternion.rotateVector(
        shown.bones("a", motionHumanLaw.event(shown, row.at)).get("rightHand")!
          .worldRotation,
        AutoMovieMotionHumanTouchEffector.axis("right", "thumb"),
      );
      const tilt: number =
        (Math.acos(
          Math.min(1, thumb.y / Math.hypot(thumb.x, thumb.y, thumb.z)),
        ) *
          180) /
        Math.PI;
      out.push(
        ...motionHumanLaw.expect(
          `${task} ${who}: the cup's axis is ${tilt.toFixed(1)} deg off vertical at ${row.at} (limit 10.0)`,
          tilt <= 10,
        ),
      );
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

  if (!both) {
    const mirrored = AutoMovieMotionHumanAuditDifference.measure(
      film,
      perform(body, "left"),
      "a",
      { mirror: 0, rate: 4 },
    );
    out.push(
      ...motionHumanLaw.expect(
        `${task}: the left-hand task is ${mm(mirrored.distance.value)} mm off the right-hand task's mirror at ${mirrored.distance.seconds.toFixed(2)} s on ${mirrored.distance.where} (limit 5.0)`,
        mirrored.distance.value <= 0.005 && mirrored.duration <= 1e-9,
      ),
    );
  }
  return out;
}
