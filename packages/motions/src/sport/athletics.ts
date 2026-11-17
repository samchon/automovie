import type { AutoMovieMotionHumanActionName, IAutoMovieMotionClock, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanActionPlan, IAutoMovieMotionHumanArmPlanned, IAutoMovieMotionHumanAthletics, IAutoMovieMotionHumanFoot, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPrimitive, IAutoMovieMotionManner, IAutoMovieVector3 } from "@automovie/interface";

import { Quaternion, Vector3 } from "@automovie/engine";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { sprintStartSet } from "./sprintStartSet";

/**
 * The sprint start's crouch into the set position and its hold until the
 * gun (#3250): the hands on the start line, the front foot and the rear
 * foot on their blocks.
 *
 * The set position is solved from measured block settings and one measured
 * angle: the anthropometry-driven setting of Cavedon et al. (2019, PLoS One
 * 14:e0213979, table 2) puts the front block 0.60 of the leg's length behind
 * the line and the rear block 0.45 of it behind the front, and the front
 * knee stands at 90 degrees (their 90, SD 8; Harland and Steele 1997's
 * "about 90"). The hands lie on the line a shoulder width apart with the
 * four support frames fixed by the measured body. One whole-body fit
 * (`sprintStartSet`) keeps those supports, the front knee at 90, rear knee
 * within 117 +/- 11 and front hip within 43 +/- 6 degrees, and the sex-matched centre of mass
 * behind the line. Arm extension is free, rather than a fixed fraction
 * consuming a degree of freedom the measured posture needs. Hip height
 * and the trunk's inclination are results of that shared constrained fit.
 *
 * The crouch takes 1.5 s (provisional): the front foot steps back to its
 * block over the first half, the rear foot over the second, while the hips
 * travel and the trunk pitches down; the set is held, and the action ends
 * at the gun. Events: `onYourMarks` (the crouch's start), `set`, `gun`.
 *
 * Not drafted: the on-your-marks kneel with the rear knee down, the drive
 * out of the blocks (the run law's), hurdles, relays, jumps and throws (the
 * jump and throw laws' rows).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the posture with its source, how each place derives from the body, the timing, the events and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record composed of root, leg and arm rows over one phrase.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the angles, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The block settings and the front knee are the source's; lengths are the body's; the hip height is solved, never stated.
 */
export namespace athletics {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "athletics";

  /** Cancel table: the gun releases the start into a run. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      run: ["fromRelax", "reflex"],
      stand: ["fromRelax", "smooth"],
    });

  /** The front knee's included angle in the set, degrees: 90 (SD 8) measured with the anthropometry-driven block setting (Cavedon et al. 2019, PLoS One 14:e0213979, table 2), Harland and Steele's (1997) "about 90". */
  export const FRONT: number = sprintStartSet.FRONT;

  /** The front block's distance behind the start line, a share of the leg's length (greater trochanter to lateral malleolus): the anthropometry-driven setting (Cavedon et al. 2019, table 2). */
  export const FRONT_DISTANCE: number = sprintStartSet.FRONT_DISTANCE;

  /** The rear block's distance behind the front block, a share of the leg's length: the same setting's spacing (Cavedon et al. 2019). */
  export const SPACING: number = sprintStartSet.SPACING;

  /** The most the trunk's total tilt is searched to, degrees: a half turn, past which the trunk would point back up. */
  export const TILT: number = sprintStartSet.TILT;

  /**
   * The whole body's centre of mass behind the start line in the set, metres
   * along the ground, by the sprinter's sex as the sources stratify it: 22.9
   * cm for elite men (Slawinski et al. 2010, J Strength Cond Res 24:896, n =
   * 6) and 16.2 cm for world-class women (Ciacci et al. 2017, J Sports Sci
   * 35:1270, n = 4), both read as Valamatos et al. 2022 report them (Int J
   * Environ Res Public Health 19:4074, section 4.1.2), the primary texts being
   * closed.
   */
  export const CENTRE: Readonly<Record<"female" | "male", number>> =
    sprintStartSet.CENTRE;

  /** The most the straight arms are searched to lean forward from the vertical, degrees: a quarter turn, past which the hands would no longer bear. */
  export const LEAN: number = sprintStartSet.LEAN;

  /** The front block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const FRONT_BLOCK: number = sprintStartSet.FRONT_BLOCK;

  /** The rear block's face from the floor, degrees (provisional, within a competition block's adjustment). */
  export const REAR_BLOCK: number = sprintStartSet.REAR_BLOCK;

  /** The arm extension of the initial geometric guess (provisional), owned by sprintStartSet; the fitted stance is free to change it. */
  export const REACH: number = sprintStartSet.REACH;

  /** The crouch's seconds (provisional). */
  export const CROUCH: number = 1.5;

  /**
   * The set position's hips, pitch and feet for a body in front of a line.
   *
   * @param context The body.
   * @param entry The standing posture; the line is a hand's length ahead of its feet.
   * @param front The front foot.
   * @param sex The measured centre-of-mass stratum.
   * @returns The hips' world point, the trunk's pitch, each palm's place on the floor and each foot's placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the geometry and the result.
   * @evidence contracts/development/implementation.md#principled-implementation Delegates the four-contact, measured-angle and centre-of-mass problem to sprintStartSet.of and the shared whole-body fit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One delegate with the unchanged public inputs and result.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A fit that misses its declared constraints is reported by the solver's refusal, never hidden by moving a foot or altering a joint range.
   * @evidence contracts/development/implementation.md#efficient-algorithms The numerical cost and iteration guard are the shared whole-body fit's; no nested bisection remains.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the placed arm's wrist, pitch and root, and the foot's pivot.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function set(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    entry: IAutoMovieMotionHumanPosture,
    front: "left" | "right",
    sex: "female" | "male" = "male",
  ): ReturnType<typeof sprintStartSet.of> {
    return sprintStartSet.of(context, entry, front, sex);
  }
  /**
   * Plan a sprint start.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The set position solved once; the root, the feet and the hands carried into it on one phrase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Set, clock, root row, two leg rows, two arm rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every place is the body's; provisional times are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the leg arc, the placed arm and the posture heading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the set position and the clock.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAthletics.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanAthletics.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const hold: number = p.seconds ?? 1.5;
    HumanBound.least("seconds", hold, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const front: "left" | "right" = p.front ?? "left";
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const target: ReturnType<typeof set> = set(
      context,
      entry,
      front,
      p.sex ?? "male",
    );
    const timed: IAutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: CROUCH,
        attack: 0,
        hold,
        retract: 0.001,
      }),
      modifiers,
    );
    const clock: IAutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "onYourMarks", seconds: 0 },
        { name: "set", seconds: timed.at("ready") },
        { name: "gun", seconds: timed.at("relax") },
      ],
    );
    const into: (seconds: number) => number = (seconds: number): number =>
      clock.progress("start", "ready", seconds);
    // The span the arms are planned over: the reach to the place, held to the end.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: clock.at("end"),
      end: clock.at("end"),
    };
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standingHips: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(entry), hipsRest),
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (posture: IAutoMovieMotionHumanPosture, seconds: number): IAutoMovieMotionHumanPosture => {
          const w: number = into(seconds);
          // The spine's share of the trunk's tilt comes in with the pelvis's.
          const flexed: (
            bone: "spine" | "chest",
          ) => readonly [number, number, number] = (
            bone: "spine" | "chest",
          ): readonly [number, number, number] => {
            const was: readonly [number, number, number] = posture.joints[
              bone
            ] ?? [0, 0, 0];
            const added: number =
              (target.joints[bone]?.[0] ?? 0) - (entry.joints[bone]?.[0] ?? 0);
            return [was[0] + added * w, was[1], was[2]];
          };
          const pitched: IAutoMovieMotionHumanPosture = {
            ...posture,
            pitch: posture.pitch + (target.pitch - entry.pitch) * w,
            joints: {
              ...posture.joints,
              spine: flexed("spine"),
              chest: flexed("chest"),
            },
          };
          const hips: IAutoMovieVector3 = Vector3.lerp(
            standingHips,
            target.hips,
            w,
          );
          return {
            ...pitched,
            root: Vector3.subtract(
              hips,
              Quaternion.rotateVector(
                resolveHumanPosture.heading(pitched),
                hipsRest,
              ),
            ),
          };
        },
      },
    ];
    for (const [side, from, to] of [
      [front, "start", "half"],
      [rear, "half", "ready"],
    ] as const) {
      const stance: IAutoMovieMotionHumanFoot.IPlacement = {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      };
      const block: IAutoMovieMotionHumanFoot.IPlacement = target.feet[side];
      const share: (seconds: number) => number = (seconds: number): number => {
        const half: number = clock.at("ready") / 2;
        const a: number = from === "start" ? 0 : half;
        const b: number = to === "half" ? half : clock.at("ready");
        return Math.min(1, Math.max(0, (seconds - a) / (b - a)));
      };
      primitives.push(
        AutoMovieMotionHumanLeg.place({
          body,
          side,
          from: 0,
          to: clock.duration,
          placement: (
            _: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanFoot.IPlacement =>
            AutoMovieMotionHumanLeg.arc(
              stance,
              block,
              0.05 * body.measure.stature,
              share(seconds),
            ),
          planted: (seconds: number): boolean =>
            share(seconds) <= 0 || share(seconds) >= 1,
        }),
      );
    }
    for (const side of ["left", "right"] as const)
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: into,
          span,
          place: () => target.palms[side],
          bend: "front",
        }),
      );
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, [
        {
          part: "leftFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "leftHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
        {
          part: "rightHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: 1,
          support: { kind: "ground" },
        },
      ]),
      clock,
      primitives,
      contact: "set",
    });
  }
}
