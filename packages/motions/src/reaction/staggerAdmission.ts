import { Vector3, getConstraint } from "@automovie/engine";
import type {
  IAutoMovieBone,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { walkFoot } from "../actions/walkFoot";
import { walkLeg } from "../actions/walkLeg";
import { walkLegClearance } from "../actions/walkLegClearance";
import { walkReach } from "../actions/walkReach";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanLegChain } from "../posture/HumanLegChain";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingTarget } from "../striking/StrikingTarget";
import { staggerBounds } from "./staggerBounds";
import { staggerKnots } from "./staggerKnots";
import { staggerLean } from "./staggerLean";
import type { staggerRecover } from "./staggerRecover";

/**
 * Whether a stagger's legs hold its recovery at the given instants
 * (`staggerRecover`): at each, the pelvis carried by the centre of mass's
 * course less the trunk's shift of it (`staggerLean`; the hips read upright,
 * the trunk's tilt about them left out of the legs' reading) and lowered
 * to the height its planted legs allow (`walkReach.ground`, the walk's own
 * closed-form claim of each leg's reach with its knee `walkReach`'s least
 * bend), and every planted leg then solved as the two-bone chain it is: its
 * hip-to-ankle distance within the thigh and shank, its knee's flexion
 * inside the rig's knee range (by the cosine law on the measured thigh and
 * shank), and its thigh no further behind the hip than the hip's extension
 * allows (`walkLeg.trailing` against `walkReach.EXTENSION`); a foot touching
 * down must also end its swing inside the swing's own leg ranges
 * (`walkReach.swing`, to `staggerBounds.SETTLED`). Where the feet
 * cross, the two planted legs, each posed by the posture's own leg fit,
 * must keep within the tangle audit's give of each other
 * (`walkLegClearance.excess`, `walkLegClearance.BOUND`).
 *
 * The admission decides every instant it reads: each test is a closed-form
 * reading of the legs under one pelvis, so no instant is left undecided and
 * no stance course is solved.
 *
 * @param body The body.
 * @param entry The posture the push meets.
 * @param walk The recovery's steps, the centre of mass's course from the entry's, the extrapolated centre of mass and the entry's centre, at seconds since the action's start.
 * @param bend The centre of mass's shift per sine of the trunk's pitch and roll (`staggerKnots.bending`).
 * @param instants The seconds to read, since the action's start.
 * @param crossing Whether the feet cross at these instants, so the two planted legs' clearance is read.
 * @returns Whether every planted leg holds at every instant.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pelvis, the tests, their sources and that every instant is decided.
 * @evidence contracts/development/implementation.md#principled-implementation Two-bone leg geometry: the cosine law on the measured thigh and shank gives the knee's flexion, and the hip-to-ankle line less the knee's angle the thigh's trail; the pelvis is the walk's own ground settling under the centre of mass's course; the crossed legs' clearance is the tangle audit's own reading.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One schedule and one pelvis per instant, then per planted leg the reach, the knee and the hip, then the crossed legs.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every bound is the rig's range, the walk's measured extension or the audit's give; nothing is tuned to a case, and a leg out of any of them refuses the instant.
 * @evidence contracts/development/implementation.md#efficient-algorithms Per instant one ground settling (a bracketed scalar root over at most two stance readers) and constant work per leg; two leg fits per instant only where the feet cross.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller admits each foot-order prefix once and shares the answer with every order that begins with it; the reading depends on the prefix's steps and course alone.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past its return.
 */
export function staggerAdmission(
  body: IHumanActionContext["body"],
  entry: IHumanActionContext["entry"],
  walk: {
    steps: readonly staggerRecover.IStep[];
    course: (seconds: number) => IAutoMovieVector3;
    extrapolated: (seconds: number) => IAutoMovieVector3;
    centre: IAutoMovieVector3;
  },
  bend: Record<"pitch" | "roll", IAutoMovieVector3>,
  instants: readonly number[],
  crossing: boolean,
): boolean {
  const lean: ReturnType<typeof staggerLean> = staggerLean(body, entry, walk, bend);
  const entered: Record<"left" | "right", HumanFoot.IPlacement> =
    StrikingTarget.feet(entry);
  const thigh: number = body.measure.thigh;
  const shank: number = body.measure.shank;
  const knee: (side: "left" | "right") => number = (side: "left" | "right"): number =>
    getConstraint(
      `${side}LowerLeg`,
      body.skeleton.bones.find(
        (b: IAutoMovieBone): boolean => b.bone === `${side}LowerLeg`,
      )?.constraint ?? null,
    )?.flexion?.max ?? 180;

  for (const t of instants) {
    // The feet as the steps schedule them, a swinging foot read where it
    // left with its share, as the displayed feet are (`StaggerFeet`).
    const feet: Record<"left" | "right", walkFoot.IScheduled> = {
      left: { placement: entered.left, toes: 0 },
      right: { placement: entered.right, toes: 0 },
    };
    for (const step of walk.steps)
      if (t >= step.land - 1e-9) feet[step.side] = { placement: step.to, toes: 0 };
    for (const step of walk.steps)
      if (t > step.start && t < step.land - 1e-9)
        feet[step.side] = {
          placement: step.from,
          toes: 0,
          swing: {
            u: (t - step.start) / (step.land - step.start),
            off: step.start,
            on: step.land,
          },
        };

    // The pelvis on the centre of mass's course less the trunk's shift of
    // it (`staggerLean`), lowered as the legs ask.
    const ground: walkReach.IGround = walkReach.ground(
      body,
      lean(t).root,
      entry.posture.yaw,
      entry.posture.joints.hips ?? [0, 0, 0],
      feet,
    );
    const planted: ("left" | "right")[] = (["left", "right"] as const).filter(
      (side: "left" | "right"): boolean => feet[side].swing === undefined,
    );
    for (const side of planted) {
      const hip: IAutoMovieVector3 = ground.hips[side];
      const ankle: IAutoMovieVector3 = ground.feet[side].ankle;
      const reach: number = Vector3.distance(hip, ankle);
      if (!(reach <= thigh + shank + 1e-9)) return false;

      // The knee's flexion by the cosine law: 180 degrees less the angle
      // between the thigh and the shank at the knee.
      const inner: number = Math.acos(
        Math.min(1, Math.max(-1, (thigh ** 2 + shank ** 2 - reach ** 2) / (2 * thigh * shank))),
      );
      if (180 - (inner * 180) / Math.PI > knee(side)) return false;
      if (walkLeg.trailing(body, hip, ankle, ground.yaw) > walkReach.EXTENSION)
        return false;

      // A foot touching down here ends its swing where the swing's own leg
      // ranges hold it (`walkReach.swing`), or the displayed swing, held
      // short of it, would snap onto it at the touch-down.
      if (walk.steps.some((step: staggerRecover.IStep): boolean => step.side === side && Math.abs(step.land - t) < 1e-9)) {
        const foot: walkFoot.IEnd = ground.feet[side];
        const swung: walkFoot.IEnd = walkReach.swing(body, side, ground, {
          placement: { ankle: foot.ankle, rotation: foot.rotation },
          toes: foot.toes,
        });
        if (Vector3.distance(swung.ankle, foot.ankle) > staggerBounds.SETTLED) return false;
      }
    }

    // Crossed feet: the two planted legs as the posture's fit poses them,
    // their knees toward the hints the posture gives them.
    if (crossing && planted.length === 2) {
      const pelvis: IAutoMovieQuaternion =
        ground.pelvis ?? resolveHumanPosture.heading({ yaw: ground.yaw, pitch: 0, roll: 0 });
      const legs: walkLegClearance.ILeg[] = [];
      for (const side of planted) {
        const foot: walkFoot.IEnd = ground.feet[side];
        const bend: IAutoMovieVector3 = staggerKnots.kneePole(
          body,
          ground.root,
          ground.yaw,
          side,
          HumanFoot.heading(foot.rotation),
        );
        const swivel: HumanLegChain.ISwivel = HumanLegChain.fit(
          body, side, pelvis, ground.hips[side], foot.ankle, bend, foot.rotation,
        );
        const posed: HumanLegChain.IPosed | null = HumanLegChain.pose(
          body, side, pelvis, ground.hips[side], foot.ankle, swivel,
        );
        if (posed === null) return false;
        legs.push({ ...posed, side, rotation: foot.rotation });
      }
      if (walkLegClearance.excess(body, legs[0]!, legs[1]!) > walkLegClearance.BOUND)
        return false;
    }
  }
  return true;
}
