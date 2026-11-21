import { Vector3, minimumJerk, wrapDegrees } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  AutoMovieMotionHumanChannel,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanClimbLadder,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanLadder,
  IAutoMovieMotionHumanPlayback,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { stand } from "../actions/stand";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanChannel as HumanChannels } from "../compose/AutoMovieMotionHumanChannel";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import { HumanPreparedPlayback } from "../perform/HumanPreparedPlayback";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanLadder } from "./HumanLadder";
import { climbLadderHands } from "./climbLadderHands";
import { planLadderAccess } from "./planLadderAccess";

/** How far below the shoulder the hands' first rung is sought, upper-arm lengths (provisional: a grip with the elbow part bent rather than a straight overhead reach). */
const GRIP_DROP: number = 0.5;

/**
 * Climbing a vertical fixed ladder from the floor before it, in the
 * four-beat ipsilateral pattern: right hand, right foot, left hand, left
 * foot, one limb moving at a time, so three limbs always hold the ladder
 * (Jensen and Holland 2020, Int J Environ Res Public Health 17:2897).
 *
 * The goals are rungs: the ladder is a prop of the scene, a fixture
 * (`IHumanProp.fixed`) that the hands grip and never carry, and its rungs are
 * its own `rung1` upward (`createLadder`'s affordances), read where the
 * ladder stands at the action's start. The rungs' spacing must lie in OSHA
 * 1910.23(b)(2)'s 25 to 36 cm and their line be upright; the climber stands
 * before the ladder, facing it within `FACING` degrees, the toes within
 * `NEAR` of the rungs and between the rails. A ladder that is no fixture,
 * leans, has too few rungs above the hands, or one the climber stands away
 * from, is refused. Each foot stands with its ball on a rung's top,
 * and each hand grips a rung (Jensen and Holland found rungs used in 59 of
 * 80 tasks) at the rung nearest half an upper arm below the shoulder's
 * height above the feet (`GRIP_DROP`, provisional). Each foot's rungs take
 * the settled stance's heading, while the feet leave the floor from where
 * the entry put them. First
 * both hands reach their rungs, then every beat moves one limb up one rung:
 * a foot on a minimum-jerk arc that clears the rung below by `CLEARANCE`, a
 * hand on a minimum-jerk path. The pelvis stays `BACK` leg lengths behind
 * the rungs and rises with the feet, lowered wherever a planted leg could
 * not reach. Each beat takes `BEAT` seconds (provisional), scaled by the
 * manner's tempo. Events: `handsOn`, then per beat `<limb>Release<n>` and
 * `<limb>Contact<n>`, the limb one of `rightHand`, `rightFoot`, `leftHand`,
 * `leftFoot`.
 *
 * A named `landing` hands the whole floor-to-landing route, up or down, to
 * `planLadderAccess`, which stages it over the shared support law.
 *
 * Not yet: the two-beat patterns, and hanging, traversing, mantling and
 * vaulting (the rest of #3238).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the pattern with its source, the ladder's geometry and band, the holds, the timing, the events and what is missing.
 * @evidence contracts/development/design.md#principled-representation A law record of one whole-body row over a beat schedule on one clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters, the constants, the rung geometry and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The ladder is the author's architecture; every hold follows from it and the body's measure.
 */
export namespace climbLadder {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "climbLadder";

  /** Cancel table: none yet; the climber holds the ladder at the end. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {};

  /** One beat's seconds (provisional). */
  export const BEAT: number = 0.8;

  /** How far a swinging foot clears its path's straight line, metres (provisional). */
  export const CLEARANCE: number = 0.06;

  /** How far the hip joints stay behind the rungs, in leg lengths (provisional). */
  export const BACK: number = 0.35;

  /** The most the climber's heading may differ from facing the ladder, degrees (provisional). */
  export const FACING: number = 30;

  /** The farthest the toes may stand from the rungs, metres (provisional): a step from the ladder. */
  export const NEAR: number = 0.5;

  /** The beat order of the four-beat ipsilateral pattern. */
  export const ORDER: readonly IAutoMovieMotionHumanClimbLadder.Limb[] = [
    "rightHand",
    "rightFoot",
    "leftHand",
    "leftFoot",
  ];

  /** A rung's centre at a lateral place (`HumanLadder.rung`). */
  export const rung: typeof HumanLadder.rung = HumanLadder.rung;

  /** A rung's radius when the ladder declares none (`HumanLadder.RUNG`). */
  export const RUNG: number = HumanLadder.RUNG;

  /**
   * Plan a ladder climb.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the ladder is no fixture, leans, spaces its rungs outside the OSHA band or has too few above the hands, the climber does not stand before it facing it, or the rung count is not a positive integer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace gives the four-beat pattern, rung geometry, timing and refusals; this entry prepares the fixed supports and limb clocks.
   * @evidence contracts/development/implementation.md#principled-implementation Preserves each original minimum-jerk limb move and rung contact, the pelvis height and lowering, and initial hand reach from the entry arms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Body/ladder admission precedes fixed footprint/handhold preparation and per-limb beat arrays; separate support and arm primitives let root/leg demand omit arm work.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the authored rung count, beat order, clearance, approach bounds and contact windows, and still fits every requested hand against its actual wrist pose and ROM.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each fixed rung contact, arc and socket is prepared once. Ordinary requests use logarithmic limb lookups. Native interior evaluations index the four intervals selected at event boundaries.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed body, still base and ladder share rung/arc/socket geometry, root-line scalars and entry arms. Held grips read their prepared point directly and moving grips keep their continuous anatomy-based bend reference.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Plan-owned rung/beat and fixed-geometry arrays release with the plan. Current FK/ROM loans end with the synchronous write.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanClimbLadder.IParams>,
  ): IAutoMovieMotionHumanClimbLadder.IPlan {
    const body: IAutoMovieMotionHumanBody = context.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const count: number = context.params.rungs ?? 3;
    HumanBound.whole("rungs", count);
    const ladder: IAutoMovieMotionHumanLadder.ILadder = HumanLadder.of(
      context,
      context.params.ladder,
    );
    if (context.params.landing !== undefined)
      return {
        ...planLadderAccess(context, ladder, context.params.landing),
        ladder,
      };
    const spacing: number = ladder.spacing;
    const frame: IAutoMovieMotionHumanFrame = ladder.frame;
    const yaw: number = frame.yaw;
    const modifiers: IAutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, context.params.manner);
    // The feet leave the floor from the entry; the rungs take the settled
    // stance's foot headings (`stand.footprints`).
    const stood: stand.IFootprints = stand.footprints(context);
    const standing: IAutoMovieMotionHumanPosture = stood.standing;
    const flats: Record<
      "left" | "right",
      IAutoMovieMotionHumanFoot.IPlacement
    > = stood.entered;
    const quiet: Record<
      "left" | "right",
      IAutoMovieMotionHumanFoot.IPlacement
    > = stood.settled;
    const flat: (
      side: "left" | "right",
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: "left" | "right",
    ): IAutoMovieMotionHumanFoot.IPlacement => flats[side];

    // Admit the stance against the ladder before preparing limb moves.
    const turned: number = Math.abs(wrapDegrees(standing.yaw - yaw));
    HumanBound.within("facing", turned, 0, FACING, "degrees");
    const toe: number = Math.max(
      ...(["left", "right"] as const).map(
        (side: "left" | "right"): number =>
          HumanFrame.local(
            frame,
            HumanFoot.point(body, side, "toe", flat(side)),
          ).z,
      ),
    );
    HumanBound.within("toes", -toe, 0, NEAR, "m");
    const laterals: Record<"left" | "right", number> = {
      left: HumanFrame.local(frame, flats.left.ankle).x,
      right: HumanFrame.local(frame, flats.right.ankle).x,
    };
    const lateral: (side: "left" | "right") => number = (
      side: "left" | "right",
    ): number => laterals[side];
    HumanBound.within(
      "beside",
      Math.abs((lateral("left") + lateral("right")) / 2),
      0,
      ladder.width / 2,
      "m",
    );
    const reach: number = Math.round(
      (m.shoulderHeight - GRIP_DROP * m.upperArm) / spacing,
    );
    HumanBound.within("rungs", reach + count, 1, ladder.count, "");
    const atRung: ReturnType<typeof HumanLadder.prepareRung> =
      HumanLadder.prepareRung(ladder);

    // A foot's placement on a rung: the ball on the rung's top.
    const onRung: Record<
      "left" | "right",
      ReturnType<typeof HumanFoot.prepareAt>
    > = {
      left: HumanFoot.prepareAt(
        body,
        "left",
        "ball",
        HumanFoot.heading(quiet.left.rotation),
        0,
      ),
      right: HumanFoot.prepareAt(
        body,
        "right",
        "ball",
        HumanFoot.heading(quiet.right.rotation),
        0,
      ),
    };
    const footOn: (
      side: "left" | "right",
      index: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: "left" | "right",
      index: number,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      index === 0
        ? flat(side)
        : onRung[side](
            Vector3.add(atRung(index, lateral(side)), {
              x: 0,
              y: ladder.radius,
              z: 0,
            }),
          );
    const footprints: Record<
      "left" | "right",
      IAutoMovieMotionHumanFoot.IPlacement[]
    > = {
      left: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieMotionHumanFoot.IPlacement =>
          footOn("left", i),
      ),
      right: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieMotionHumanFoot.IPlacement =>
          footOn("right", i),
      ),
    };
    const footArcs: Record<
      "left" | "right",
      ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc>[]
    > = {
      left: footprints.left
        .slice(1)
        .map(
          (
            to: IAutoMovieMotionHumanFoot.IPlacement,
            i: number,
          ): ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =>
            AutoMovieMotionHumanLeg.prepareArc(
              footprints.left[i]!,
              to,
              CLEARANCE,
            ),
        ),
      right: footprints.right
        .slice(1)
        .map(
          (
            to: IAutoMovieMotionHumanFoot.IPlacement,
            i: number,
          ): ReturnType<typeof AutoMovieMotionHumanLeg.prepareArc> =>
            AutoMovieMotionHumanLeg.prepareArc(
              footprints.right[i]!,
              to,
              CLEARANCE,
            ),
        ),
    };
    const goals: Record<
      "left" | "right",
      ReturnType<typeof AutoMovieMotionHumanLeg.preparePlacement>
    > = {
      left: AutoMovieMotionHumanLeg.preparePlacement(
        body,
        "left",
        footprints.left[1]!.rotation,
      ),
      right: AutoMovieMotionHumanLeg.preparePlacement(
        body,
        "right",
        footprints.right[1]!.rotation,
      ),
    };
    // Pick a grip in each shoulder's plane, within the rung's width.
    const halfWidth: number = ladder.width / 2;
    const handLane: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number =>
      Math.max(
        -halfWidth,
        Math.min(halfWidth, body.rest.get(`${side}UpperArm`)!.x),
      );
    const leftLane: number = handLane("left");
    const rightLane: number = handLane("right");
    const handholds: Record<AutoMovieHumanSide, IAutoMovieVector3[]> = {
      left: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieVector3 =>
          atRung(reach + i, leftLane),
      ),
      right: Array.from(
        { length: count + 1 },
        (_: unknown, i: number): IAutoMovieVector3 =>
          atRung(reach + i, rightLane),
      ),
    };
    const handArcs: Record<
      "left" | "right",
      ReturnType<typeof Vector3.prepareLerp>[]
    > = {
      left: handholds.left
        .slice(1)
        .map(
          (
            to: IAutoMovieVector3,
            i: number,
          ): ReturnType<typeof Vector3.prepareLerp> =>
            Vector3.prepareLerp(handholds.left[i]!, to),
        ),
      right: handholds.right
        .slice(1)
        .map(
          (
            to: IAutoMovieVector3,
            i: number,
          ): ReturnType<typeof Vector3.prepareLerp> =>
            Vector3.prepareLerp(handholds.right[i]!, to),
        ),
    };
    const direction: IAutoMovieMotionHumanFrame = {
      origin: { x: 0, y: 0, z: 0 },
      yaw,
    };
    const directional: HumanFrame.IPrepared = HumanFrame.prepare(direction);
    const normal: IAutoMovieVector3 = HumanFrame.point(direction, {
      x: 0,
      y: 0,
      z: -1,
    });
    const handGoal: ReturnType<typeof climbLadderHands> = climbLadderHands(
      body,
      normal,
    );

    // Clear the rung by the toe's reach past the ball or the fingers' wrap.
    const toeReach: (side: "left" | "right") => number = (
      side: "left" | "right",
    ): number =>
      HumanFoot.offset(body, side, "toe").z -
      HumanFoot.offset(body, side, "ball").z;
    const footBack: Record<"left" | "right", number> = {
      left: toeReach("left") + ladder.radius + CLEARANCE,
      right: toeReach("right") + ladder.radius + CLEARANCE,
    };
    const handBack: number = 2 * ladder.radius + CLEARANCE;
    const rootAlong: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: 0,
      y: 0,
      z: ladder.ahead - BACK * (m.thigh + m.shank),
    });
    const entryArms: Parameters<typeof AutoMovieMotionHumanArm.carry>[2] = {
      left: AutoMovieMotionHumanArm.angles(context.entry.pose, "left"),
      right: AutoMovieMotionHumanArm.angles(context.entry.pose, "right"),
    };

    // The schedule: hands on, then four beats a rung.
    const beat: number = BEAT * modifiers.tempo;
    const instants: IAutoMovieMotionClockInstant[] = [
      { name: "handsOn", seconds: beat },
    ];
    const moves: Record<
      IAutoMovieMotionHumanClimbLadder.Limb,
      { n: number; from: number; to: number }[]
    > = {
      leftHand: [],
      rightHand: [],
      leftFoot: [],
      rightFoot: [],
    };
    for (let k: number = 1; k <= count; k++)
      ORDER.forEach(
        (limb: IAutoMovieMotionHumanClimbLadder.Limb, i: number): void => {
          const from: number = beat * (1 + (k - 1) * 4 + i);
          moves[limb].push({ n: k, from, to: from + beat });
          instants.push(
            { name: `${limb}Release${k}`, seconds: from },
            { name: `${limb}Contact${k}`, seconds: from + beat },
          );
        },
      );
    const duration: number = beat * (2 + count * 4);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.of(
      duration,
      instants,
    );
    const reaching: (seconds: number) => number = AutoMovieMotionClock.prepare(
      clock,
      "start",
      "handsOn",
    ).progress;

    /** Find the first interval whose landing has yet to happen. */
    function nextMove(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): number {
      const own: (typeof moves)[IAutoMovieMotionHumanClimbLadder.Limb] =
        moves[limb];
      let low: number = 0;
      let high: number = own.length;
      while (low < high) {
        const middle: number = (low + high) >>> 1;
        if (seconds >= own[middle]!.to) low = middle + 1;
        else high = middle;
      }
      return low;
    }

    /** Evaluate the known interval without retaining the sampled limb state. */
    function rung(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
      next: number,
    ): { index: number; u: number; moving: boolean } {
      const base: number = limb.endsWith("Hand") ? reach : 0;
      const own: (typeof moves)[IAutoMovieMotionHumanClimbLadder.Limb] =
        moves[limb];
      const move: (typeof own)[number] | undefined = own[next];
      if (move !== undefined && seconds > move.from)
        return {
          index: base + move.n,
          u: minimumJerk.share((seconds - move.from) / (move.to - move.from)),
          moving: true,
        };
      return { index: base + (own[next - 1]?.n ?? 0), u: 1, moving: false };
    }

    /** Determine the rung for an ordinary query. */
    function level(
      limb: IAutoMovieMotionHumanClimbLadder.Limb,
      seconds: number,
    ): ReturnType<typeof rung> {
      return rung(limb, seconds, nextMove(limb, seconds));
    }

    // Both feet follow authored ankle paths. Their reach is continuous when
    // the plant flag changes, so a release alone cannot raise the hips.
    const reachDrop: ReturnType<typeof resolveHumanPosture.prepareShort> =
      resolveHumanPosture.prepareShort(body, resolveHumanPosture.KNEE);
    function stance(
      posture: IAutoMovieMotionHumanPosture,
      feet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement>,
      levels: Record<"left" | "right", ReturnType<typeof level>>,
      resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
    ): IAutoMovieMotionHumanPosture {
      const rise: number =
        (feet.left.ankle.y + feet.right.ankle.y) / 2 - m.ankleHeight;
      const root: IAutoMovieVector3 = { ...rootAlong, y: rise - stand.DROP };
      const placed: IAutoMovieMotionHumanPosture = { ...posture, root, yaw };
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
      for (const side of ["left", "right"] as const)
        limbs[`${side}Leg`] = goals[side](
          placed,
          feet[side],
          !levels[side].moving,
        );
      const hips: Record<AutoMovieHumanSide, IAutoMovieVector3> = hipJoints(
        body,
        root,
        resolveHumanPosture.heading(placed),
        placed.joints.hips,
        resolution === undefined
          ? undefined
          : prepareHumanPoseResolution.read(resolution),
      );
      const drop: number = Math.max(
        0,
        reachDrop(hips.left, feet.left.ankle),
        reachDrop(hips.right, feet.right.ankle),
      );
      return {
        ...placed,
        root: { ...root, y: root.y - drop },
        limbs: structuredClone(limbs),
      };
    }

    const climb: IAutoMovieMotionHumanPrimitive = {
      channels: ["root", "leftLeg", "rightLeg"],
      reads: ["root", "trunk", "leftLeg", "rightLeg"],
      from: 0,
      to: duration,
      write: (posture, seconds, _before, resolution) =>
        legsAt(posture, seconds, resolution, level),
    };
    /** Write both ankle goals, then solve the live stance reach. */
    function legsAt(
      posture: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      readLevel: typeof level,
    ): IAutoMovieMotionHumanPosture {
      const feet: Record<
        "left" | "right",
        IAutoMovieMotionHumanFoot.IPlacement
      > = {
        left: flat("left"),
        right: flat("right"),
      };
      const footLevels: Record<"left" | "right", ReturnType<typeof level>> = {
        left: readLevel("leftFoot", seconds),
        right: readLevel("rightFoot", seconds),
      };
      for (const side of ["left", "right"] as const) {
        const at: ReturnType<typeof level> = footLevels[side];
        const b: IAutoMovieMotionHumanFoot.IPlacement =
          footprints[side][at.index]!;
        feet[side] = at.moving
          ? (() => {
              const out: IAutoMovieMotionHumanFoot.IPlacement = footArcs[side][
                at.index - 1
              ]!(at.u);
              // Move back off the rungs and in again so the toe clears them.
              return {
                ...out,
                ankle: Vector3.add(
                  out.ankle,
                  directional.point({
                    x: 0,
                    y: 0,
                    z: -footBack[side] * Math.sin(Math.PI * at.u),
                  }),
                ),
              };
            })()
          : b;
      }

      return stance(posture, feet, footLevels, resolution);
    }
    const arms: IAutoMovieMotionHumanPrimitive = {
      channels: ["leftArm", "rightArm"],
      reads: (seconds: number): readonly AutoMovieMotionHumanChannel[] =>
        reaching(seconds) >= 1
          ? ["root", "trunk", "leftArm", "rightArm"]
          : HumanChannels.ORDER,
      from: 0,
      to: duration,
      write: (lowered, seconds, _before, resolution, projection) =>
        armsAt(lowered, seconds, resolution, projection, level),
    };
    /** Write the current grip goals and carry the entering arm angles through the first reach. */
    function armsAt(
      lowered: IAutoMovieMotionHumanPosture,
      seconds: number,
      resolution: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
      projection: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      readLevel: typeof level,
    ): IAutoMovieMotionHumanPosture {
      const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...lowered.limbs };

      // Each hand grips its rung, reaching it from where it hung at first.
      const reachShare: number = reaching(seconds);
      for (const side of ["left", "right"] as const) {
        const at: ReturnType<typeof level> = readLevel(`${side}Hand`, seconds);
        const grip: IAutoMovieVector3 = at.moving
          ? handArcs[side][at.index - reach - 1]!(at.u)
          : handholds[side][at.index - reach]!;
        const lifted: IAutoMovieVector3 = at.moving
          ? Vector3.add(
              grip,
              directional.point({
                x: 0,
                y: 0,
                z: -handBack * Math.sin(Math.PI * at.u),
              }),
            )
          : grip;
        limbs[`${side}Arm`] = handGoal(side, lowered, lifted);
      }
      const gripped: IAutoMovieMotionHumanPosture = {
        ...lowered,
        limbs: {
          ...lowered.limbs,
          leftArm: limbs.leftArm!,
          rightArm: limbs.rightArm!,
        },
      };
      if (reachShare >= 1) return gripped;
      return AutoMovieMotionHumanArm.carry(
        body,
        gripped,
        entryArms,
        reachShare,
        undefined,
        resolution,
        projection,
      );
    }

    // Contact windows between each limb's moves.
    const contacts: IAutoMovieMotionHumanContactWindow[] = [];
    for (const limb of ORDER) {
      const own: (typeof moves)[IAutoMovieMotionHumanClimbLadder.Limb] =
        moves[limb];
      const hand: boolean = limb.endsWith("Hand");
      let from: number = hand ? beat : 0;
      for (let i: number = 0; i <= own.length; i++) {
        const to: number = i < own.length ? own[i]!.from : duration;

        // The first hand to move leaves its rung the instant both hands are
        // on: it holds nothing in between, so it declares no window.
        if (to <= from) {
          if (i < own.length) from = own[i]!.to;
          continue;
        }
        contacts.push({
          part: limb,
          kind: hand ? "grip" : "plant",
          from: from / duration,
          to: to / duration,
          support:
            !hand && i === 0
              ? { kind: "ground" }
              : { kind: "prop", subject: context.params.ladder },
        });
        if (i < own.length) from = own[i]!.to;
      }
    }

    const planned: IAutoMovieMotionHumanClimbLadder.IPlan = {
      ...composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.still(duration, standing, contacts),
        clock,
        contact: "handsOn",
        primitives: [climb, arms],
      }),
      ladder,
    };
    const exact: IAutoMovieMotionHumanActionPlan["posture"] = planned.posture;
    const mergeLegs: ReturnType<typeof HumanChannels.prepareMerge> =
      HumanChannels.prepareMerge(climb.channels);
    const mergeArms: ReturnType<typeof HumanChannels.prepareMerge> =
      HumanChannels.prepareMerge(arms.channels);
    const bounds: number[] = [
      ...new Set([0, ...instants.map((instant) => instant.seconds), duration]),
    ].sort((a, b) => a - b);
    const playback: IAutoMovieMotionHumanPlayback = {
      mode: "posture",
      phases: bounds.slice(0, -1).map((from, index) => {
        const to: number = bounds[index + 1]!;
        const intervals: Map<IAutoMovieMotionHumanClimbLadder.Limb, number> =
          new Map(ORDER.map((limb) => [limb, nextMove(limb, from)]));
        const at: typeof level = (limb, seconds) =>
          rung(limb, seconds, intervals.get(limb)!);
        return {
          from,
          to,
          sample: (t, channels, resolution, projection) => {
            if (
              !prepareHumanPoseResolution.isNativeSource(resolution) ||
              channels !== undefined
            )
              return undefined;
            if (t === from || t === to)
              return { posture: exact(t, channels, resolution, projection) };
            const lowered: IAutoMovieMotionHumanPosture = mergeLegs(
              standing,
              legsAt(standing, t, resolution, at),
            );
            return {
              posture: mergeArms(
                lowered,
                armsAt(lowered, t, resolution, projection, at),
              ),
            };
          },
        };
      }),
    };
    HumanPreparedPlayback.attach(planned, body, playback);
    return planned;
  }
}
