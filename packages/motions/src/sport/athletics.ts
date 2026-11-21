import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPlanned,
  IAutoMovieMotionHumanAthletics,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionHumanPlaced } from "../compose/AutoMovieMotionHumanPlaced";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { blendHumanJoint } from "../posture/blendHumanJoint";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { sprintStartBlocks } from "./sprintStartBlocks";
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
 * travel and the trunk pitches down. With an authored drive, the hands
 * leave at the gun, the rear foot leaves next, and the front foot pushes
 * to block exit. Slawinski et al. (2010, PMID 19935105) separate these
 * phases; this pass stages the hip acceleration and rear-foot recovery
 * while the front foot still bears. The drive's shape shares are
 * provisional. The first airborne stride belongs to the subsequent act.
 *
 * With `on`, the feet sit on a placed starting block's `front` and `rear`
 * plates instead of the body-scaled setting, each ball at its plate's lower
 * edge, and bear on that prop; the plate on the runner's left or right
 * decides the front foot. The front knee then keeps within its measured
 * spread (90 +/- 8) and the centre of mass follows from the plates.
 *
 * Events: `onYourMarks`, `set`, `gun`, and when driving, `rearBlockOff`
 * and `blockExit`. The knee-down marks posture is a separate phase.
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

  /** The rear knee's included angle in the set, degrees (`sprintStartSet.REAR`), from which the rear block is placed. */
  export const REAR: readonly [number, number] = sprintStartSet.REAR;

  /** The front hip's included angle in the set, degrees (`sprintStartSet.HIP`). */
  export const HIP: readonly [number, number] = sprintStartSet.HIP;

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
    context: Pick<IAutoMovieMotionHumanActionContext, "body" | "entry">,
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
   * @throws {HumanRefusal} When the hold is negative, the optional drive is not positive, a named block's plates are missing, misaligned or contradict `front` (`sprintStartBlocks.of`), or the set cannot be fitted to them.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The set position solved once; the root, the feet and the hands carried into it on one phrase.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Set, clock, root row, two leg rows, two arm rows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every place is the body's; provisional times are named.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed entry/block pairs prepare each leg's original quaternion arc once; fixed standing/set hip points share Vector3.prepareLerp's original component deltas. Trunk pitch/flexion differences and the joint reader also prepare once, while current joints/shares/points evaluate each second. Placed-arm and posture-heading formulas remain shared owners.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the set position and the clock.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAthletics.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanAthletics.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const hold: number = p.seconds ?? 1.5;
    HumanBound.least("seconds", hold, 0, "s");
    if (p.drive !== undefined) HumanBound.above("drive", p.drive, 0, "s");
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const blocks: sprintStartBlocks.IPlaced | undefined =
      p.on === undefined
        ? undefined
        : sprintStartBlocks.of(context, p.on, p.front);
    const front: "left" | "right" = blocks?.front ?? p.front ?? "left";
    const rear: "left" | "right" = front === "left" ? "right" : "left";
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const target: ReturnType<typeof set> = sprintStartSet.of(
      context,
      entry,
      front,
      p.sex ?? "male",
      blocks?.feet,
    );
    const timed: IAutoMovieMotionClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: CROUCH,
        attack: 0,
        hold,
        retract: p.drive ?? 0.001,
      }),
      modifiers,
    );
    const gun: number = timed.at("relax");
    const end: number = timed.duration;
    const rearOff: number = gun + (end - gun) / 2;
    const drive: (seconds: number) => number = (seconds: number): number =>
      p.drive === undefined
        ? 0
        : Math.max(0, Math.min(1, (seconds - gun) / (end - gun)));
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      timed.duration,
      [
        ...timed.instants,
        { name: "onYourMarks", seconds: 0 },
        { name: "set", seconds: timed.at("ready") },
        { name: "gun", seconds: gun },
        ...(p.drive === undefined
          ? []
          : [
              { name: "rearBlockOff", seconds: rearOff },
              { name: "blockExit", seconds: end },
            ]),
      ],
    );
    const ready: number = clock.at("ready");
    const into: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "start",
      "ready",
    ).progress;
    // The hands release the track at the gun and open into the drive.
    const span: IAutoMovieMotionHumanArmPlanned.ISpan = {
      start: clock.at("start"),
      ready: clock.at("ready"),
      relax: p.drive === undefined ? end : gun,
      end: clock.at("end"),
    };
    const hipsRest: IAutoMovieVector3 = body.rest.get("hips")!;
    const standingHips: IAutoMovieVector3 = Vector3.add(
      entry.root,
      Quaternion.rotateVector(resolveHumanPosture.heading(entry), hipsRest),
    );
    const hipsAt: ReturnType<typeof Vector3.prepareLerp> = Vector3.prepareLerp(
      standingHips,
      target.hips,
    );
    const ahead: IAutoMovieVector3 = HumanFrame.forward(entry.yaw);
    const push: IAutoMovieVector3 = {
      ...Vector3.scale(ahead, 0.12 * body.measure.stature),
      y: 0.04 * body.measure.stature,
    };
    const flexions: Record<"spine" | "chest", number> = {
      spine: (target.joints.spine?.[0] ?? 0) - (entry.joints.spine?.[0] ?? 0),
      chest: (target.joints.chest?.[0] ?? 0) - (entry.joints.chest?.[0] ?? 0),
    };
    const pitchDelta: number = target.pitch - entry.pitch;
    const flexed: (
      joints: IAutoMovieMotionHumanPosture["joints"],
      bone: "spine" | "chest",
      share: number,
    ) => readonly [number, number, number] = (
      joints: IAutoMovieMotionHumanPosture["joints"],
      bone: "spine" | "chest",
      share: number,
    ): readonly [number, number, number] => {
      const was: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      return [was[0] + flexions[bone] * share, was[1], was[2]];
    };
    const primitives: IAutoMovieMotionHumanPrimitive[] = [
      {
        channels: ["root", "trunk"],
        reads: ["root", "trunk"],
        from: 0,
        to: clock.duration,
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          const w: number = into(seconds);
          const t: number = drive(seconds);
          // The spine's share of the trunk's tilt comes in with the pelvis's.
          const pitched: IAutoMovieMotionHumanPosture = {
            ...posture,
            pitch: posture.pitch + pitchDelta * w - 0.25 * target.pitch * t * t,
            joints: {
              ...posture.joints,
              spine: flexed(posture.joints, "spine", w - 0.2 * t * t),
              chest: flexed(posture.joints, "chest", w - 0.2 * t * t),
            },
          };
          const hips: IAutoMovieVector3 = Vector3.add(
            hipsAt(w),
            Vector3.scale(push, t * t),
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
      const trajectory: ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =
        AutoMovieMotionHumanLeg.prepareArc(
          stance,
          block,
          0.05 * body.measure.stature,
        );
      const recovery:
        | ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>
        | undefined =
        p.drive === undefined || side === front
          ? undefined
          : AutoMovieMotionHumanLeg.prepareArc(
              block,
              {
                ankle: Vector3.add(block.ankle, {
                  ...Vector3.scale(ahead, 0.24 * body.measure.stature),
                  y: 0.11 * body.measure.stature,
                }),
                rotation: stance.rotation,
              },
              0.04 * body.measure.stature,
            );
      const half: number = ready / 2;
      const a: number = from === "start" ? 0 : half;
      const b: number = to === "half" ? half : ready;
      const share: (seconds: number) => number = (seconds: number): number => {
        return Math.min(1, Math.max(0, (seconds - a) / (b - a)));
      };
      const leg: IAutoMovieMotionHumanPrimitive = AutoMovieMotionHumanLeg.place(
        {
          body,
          side,
          from: 0,
          to: clock.duration,
          placement: (
            _: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanFoot.IPlacement =>
            recovery !== undefined && seconds > rearOff
              ? recovery((seconds - rearOff) / (end - rearOff))
              : trajectory(share(seconds)),
          planted: (seconds: number): boolean => {
            if (recovery !== undefined && seconds > rearOff) return false;
            const at: number = share(seconds);
            return at <= 0 || at >= 1;
          },
        },
      );
      const toes: AutoMovieHumanoidBone = `${side}Toes`;
      const articulated: ReturnType<typeof blendHumanJoint.between> =
        blendHumanJoint.between(
          body,
          toes,
          entry.joints[toes] ?? [0, 0, 0],
          target.joints[toes] ?? [0, 0, 0],
        );
      primitives.push({
        ...leg,
        reads: ["root", `${side}Leg`],
        write: (
          posture: IAutoMovieMotionHumanPosture,
          seconds: number,
        ): IAutoMovieMotionHumanPosture => {
          // The block fit placed both the rigid foot and the toe hinge.
          // Preserve that hinge as the foot lands and through its hold.
          const moved: IAutoMovieMotionHumanPosture = leg.write(
            posture,
            seconds,
          );
          return {
            ...moved,
            joints: {
              ...moved.joints,
              [toes]: articulated(
                into(seconds) *
                  (recovery === undefined
                    ? 1
                    : 1 - Math.max(0, 2 * drive(seconds) - 1)),
              ),
            },
          };
        },
      });
    }
    for (const side of ["left", "right"] as const)
      primitives.push(
        ...AutoMovieMotionHumanPlaced.arm({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: (seconds: number): number =>
            into(seconds) * (1 - drive(seconds)),
          span,
          place: () => target.palms[side],
          bend: "front",
        }),
      );
    // Feet on a placed block bear on that prop, so its frame carries them.
    const footSupport: IAutoMovieMotionHumanContactWindow["support"] =
      p.on === undefined ? { kind: "ground" } : { kind: "prop", subject: p.on };
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(clock.duration, entry, [
        {
          part: "leftFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: p.drive !== undefined && rear === "left" ? rearOff / end : 1,
          support: footSupport,
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: p.drive !== undefined && rear === "right" ? rearOff / end : 1,
          support: footSupport,
        },
        {
          part: "leftHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: p.drive === undefined ? 1 : gun / end,
          support: { kind: "ground" },
        },
        {
          part: "rightHand",
          kind: "plant",
          from: clock.at("ready") / clock.duration,
          to: p.drive === undefined ? 1 : gun / end,
          support: { kind: "ground" },
        },
      ]),
      clock,
      primitives,
      contact: "set",
    });
  }
}
