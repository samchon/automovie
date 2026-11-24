import { DEFAULT_HUMANOID_ROM, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanKiss,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRise,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionManner,
  IAutoMovieMotionMeeting,
  IAutoMovieMotionTarget,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHead } from "../compose/AutoMovieMotionHumanHead";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanRise } from "../compose/AutoMovieMotionHumanRise";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { AutoMovieMotionMeeting } from "../compose/AutoMovieMotionMeeting";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { kissBody } from "./kissBody";
import { kissCanLower } from "./kissCanLower";
import { kissClock } from "./kissClock";
import { kissHandClearance } from "./kissHandClearance";
import { kissHandMeeting } from "./kissHandMeeting";
import { kissPitch } from "./kissPitch";
import { kissPose } from "./kissPose";
import { kissPresentedHand } from "./kissPresentedHand";
import { kissProjection } from "./kissProjection";

/** The alternatives of `PlanSurface`'s site. */
type PlanSurface = "point" | "normal";

/**
 * A kiss while standing: the lips brought to a partner's region (a cheek, the
 * forehead, the crown, the lips, the back of a hand) by leaning the body from
 * the hips and flexing the neck, the head turned to one side for a cheek or the
 * lips so the noses stay clear.
 *
 * The lean and the neck's flexion are solved at plan time so the mouth region
 * of the leaned posture lands on the target as it stands at the kiss's start: a
 * grid of pitch and flexion at 5 degree steps, then 1 degree steps about the
 * best, then a lean to the side the target lies on, as far as the hips' range
 * lets a body on planted feet lean (`ROLL`), and, when the mouth is still
 * short, a rise onto the toes of up to 35 degrees of heel (provisional). The
 * head turns 30 degrees for a cheek or the lips (provisional), to the right
 * unless `side` says otherwise; Guntürkün 2003 observed a two-to-one rightward
 * bias, which Sedgewick et al. 2019 did not find, so the side is a parameter.
 * The approach is the free-space transport of the mouth's travel, the kiss
 * holds 0.6 s (provisional) and the return takes the approach's time. The feet
 * stay planted where they stand, so no balance is solved: the lean and the rise
 * are the kiss's key poses within their ranges. A difference of more than
 * `NEAR` that the lean, the neck and the toes cannot close is out of reach and
 * refused with what they reach, rather than pressed on into the partner; a step
 * in is not drafted yet.
 *
 * Events: the phrase instants, with `contact` at `ready` and `part` at `relax`.
 */
export namespace kiss {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "kiss";

  /** Cancel table. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    });

  /** The head's turn for a cheek or the lips, degrees (provisional). */
  export const TURN: number = 30;

  /** The kiss's hold, seconds (provisional). */
  export const HOLD: number = 0.6;

  /**
   * The most the body leans to a side, degrees: with both feet planted a side
   * lean from the hips turns one hip into adduction and the other into
   * abduction by the lean, so it is the lesser of the hip's adduction and
   * abduction ranges (`DEFAULT_HUMANOID_ROM`, the upper leg's abduction).
   */
  export const ROLL: number = Math.min(
    -(DEFAULT_HUMANOID_ROM.leftUpperLeg?.abduction?.min ?? 0),
    DEFAULT_HUMANOID_ROM.leftUpperLeg?.abduction?.max ?? 0,
  );

  /** The most the heels rise, degrees (provisional). */
  export const RAISE: number = 35;

  /** The miss under which the heels stay down, metres (provisional). */
  export const NEAR: number = 0.005;

  /**
   * The lean, the neck flexion and the heel raise that bring the mouth nearest
   * a point.
   *
   * @param context The body.
   * @param entry The standing posture.
   * @param stance Both feet as they stand.
   * @param twist The head's twist, degrees.
   * @param at The point, world.
   * @param seated Whether a seat bears the body: no heel is raised then, the
   *   lean from the seat being all.
   * @returns The angles, degrees, and the miss, metres.
   */
  export function solve(
    context: Pick<IAutoMovieMotionHumanActionContext, "body">,
    entry: IAutoMovieMotionHumanPosture,
    stance: IAutoMovieMotionHumanRise.Stance,
    twist: number,
    at: IAutoMovieVector3,
    seated: boolean = false,
    heldHand?: kissPresentedHand.IHand,
  ): IAutoMovieMotionHumanKiss.ISolved {
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const resolution: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const postureAt: ReturnType<typeof kissPose> = kissPose(
      body,
      entry,
      stance,
      twist,
      seated,
    );
    const mouth: ReturnType<typeof HumanTrunk.preparePoint> =
      HumanTrunk.preparePoint(body, "mouth");
    const miss = (s: Omit<IAutoMovieMotionHumanKiss.ISolved, "miss">): number =>
      Vector3.distance(mouth(postureAt(s), resolution), at);
    const least = (
      candidates: Omit<IAutoMovieMotionHumanKiss.ISolved, "miss">[],
    ): IAutoMovieMotionHumanKiss.ISolved => {
      let best: IAutoMovieMotionHumanKiss.ISolved | null = null;
      for (const c of candidates) {
        const m: number = miss(c);
        if (best === null || m < best.miss) best = { ...c, miss: m };
      }
      return best!;
    };
    const span = (from: number, to: number, step: number): number[] => {
      const out: number[] = [];
      for (let v: number = from; v <= to; v += step) out.push(v);
      return out;
    };
    const sagittal = (
      s: IAutoMovieMotionHumanKiss.ISolved,
    ): IAutoMovieMotionHumanKiss.ISolved => {
      const coarse: IAutoMovieMotionHumanKiss.ISolved = least([
        s,
        ...span(-10, 45, 5).flatMap((pitch: number) =>
          span(-30, 45, 5).map((flexion: number) => ({ ...s, pitch, flexion })),
        ),
      ]);
      return least([
        coarse,
        ...span(coarse.pitch - 4, coarse.pitch + 4, 1).flatMap(
          (pitch: number) =>
            span(coarse.flexion - 4, coarse.flexion + 4, 1).map(
              (flexion: number) => ({ ...coarse, pitch, flexion }),
            ),
        ),
      ]);
    };
    const neutral: IAutoMovieMotionHumanKiss.ISolved = {
      pitch: 0,
      roll: 0,
      flexion: 0,
      raise: 0,
      miss: Infinity,
    };
    const start: IAutoMovieVector3 = mouth(postureAt(neutral), resolution);
    neutral.miss = Vector3.distance(start, at);
    if (neutral.miss <= NEAR) return neutral;

    // Try the rigid sagittal arc first, then check it on the actual stance.
    const hip: IAutoMovieVector3 = HumanTrunk.resolve(
      body,
      entry,
      entry.joints,
      resolution,
      new Set<AutoMovieHumanoidBone>(["hips"]),
    ).get("hips")!.worldPosition;
    const bowed: IAutoMovieMotionHumanKiss.ISolved = {
      ...neutral,
      pitch: Math.min(45, Math.max(-10, kissPitch(hip, entry.yaw, start, at))),
    };
    bowed.miss = miss(bowed);
    if (heldHand !== undefined && !seated) {
      const contact: IAutoMovieMotionHumanKiss.ISolved | undefined =
        kissPresentedHand(
          body,
          entry,
          stance,
          hip,
          at,
          bowed,
          heldHand,
          postureAt,
          mouth,
          resolution,
          NEAR,
          RAISE,
          ROLL,
        );
      if (contact !== undefined) return contact;
    }
    if (bowed.miss <= NEAR) return bowed;

    // Two trunk angles place the mouth's horizontal projection. A standing
    // body can then lower the hips over the same plants to meet a lower face.
    const horizontal: IAutoMovieMotionHumanLean.IAngles | null = kissProjection(
      entry,
      hip,
      start,
      at,
    );
    if (
      horizontal !== null &&
      horizontal.pitch >= -10 &&
      horizontal.pitch <= 45 &&
      Math.abs(horizontal.roll) <= ROLL
    ) {
      const projected: IAutoMovieMotionHumanKiss.ISolved = {
        ...neutral,
        ...horizontal,
      };
      const keyed: IAutoMovieMotionHumanPosture = postureAt(projected);
      const landed: IAutoMovieVector3 = mouth(keyed, resolution);
      projected.miss = Vector3.distance(landed, at);
      if (projected.miss <= NEAR) return projected;
      const sink: number = landed.y - at.y;
      if (
        !seated &&
        sink > 0 &&
        Math.hypot(landed.x - at.x, landed.z - at.z) <= NEAR &&
        kissCanLower(body, keyed, stance, sink, resolution)
      ) {
        const dropped: IAutoMovieMotionHumanKiss.ISolved = {
          ...projected,
          sink,
        };
        dropped.miss = miss(dropped);
        if (dropped.miss <= NEAR) return dropped;
      }
    }
    let best: IAutoMovieMotionHumanKiss.ISolved = sagittal(neutral);
    best = sagittal(
      least(span(-ROLL, ROLL, 1).map((roll: number) => ({ ...best, roll }))),
    );
    // A seated body has no heels to raise: the lean from the seat is all.
    if (best.miss <= NEAR || seated) return best;
    const raised: IAutoMovieMotionHumanKiss.ISolved[] = span(0, RAISE, 1).map(
      (raise: number): IAutoMovieMotionHumanKiss.ISolved => {
        const c = { ...best, raise };
        return { ...c, miss: miss(c) };
      },
    );
    const closest: number = Math.min(
      ...raised.map((c: IAutoMovieMotionHumanKiss.ISolved) => c.miss),
    );
    const lifted: IAutoMovieMotionHumanKiss.ISolved = sagittal(
      raised.find(
        (c: IAutoMovieMotionHumanKiss.ISolved): boolean =>
          c.miss <= closest + NEAR / 5,
      )!,
    );
    if (heldHand === undefined) return lifted;
    return (
      kissPresentedHand(
        body,
        entry,
        stance,
        hip,
        at,
        lifted,
        heldHand,
        postureAt,
        mouth,
        resolution,
        NEAR,
        RAISE,
        ROLL,
      ) ?? lifted
    );
  }

  /**
   * Plan a kiss.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the hold is negative, or when the solved lean,
   *   neck and rise leave the mouth more than `NEAR` from the region.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanKiss.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanKiss.IParams = context.params;
    const body = context.body;
    const hold: number = p.hold ?? HOLD;
    HumanBound.least("hold", hold, 0, "s");
    const hand: AutoMovieHumanSide | undefined =
      p.region === "handBackLeft"
        ? "left"
        : p.region === "handBackRight"
          ? "right"
          : undefined;
    if (p.handRole !== undefined && hand === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "region",
        value: p.region,
        feasible: {
          kind: "alternatives",
          values: ["handBackLeft", "handBackRight"],
        },
        reason: "a hand kiss role presents or kisses the named back of a hand",
        fix: "name the hand the participants share",
      });
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const meeting: IAutoMovieMotionMeeting | undefined =
      p.handRole === undefined || hand === undefined
        ? undefined
        : context.meeting(kissHandMeeting.kind(hand, hold), p.handRole, {
            role: p.handRole === "kisser" ? "presenter" : "kisser",
            subject: p.partner,
          });
    const shared: IAutoMovieMotionClock | undefined =
      meeting === undefined
        ? undefined
        : kissClock.meeting(meeting, context.start);
    if (
      p.handRole === "presenter" &&
      hand !== undefined &&
      meeting !== undefined &&
      shared !== undefined
    )
      return kissHandMeeting.present(context, hand, meeting, shared);
    const target: IAutoMovieMotionTarget = {
      kind: "person",
      subject: p.partner,
      region: p.region,
    };
    // A cheek, a jaw or the lips turn the head; the other regions do not.
    const turned: boolean =
      p.region === "mouth" ||
      p.region.startsWith("cheek") ||
      p.region.startsWith("jaw");

    const surface: Pick<IAutoMovieMotionHumanTarget.IPlace, PlanSurface> =
      meeting === undefined
        ? context.aim(target, context.start)
        : AutoMovieMotionMeeting.place(meeting, "contact", entry);
    const at: IAutoMovieVector3 = surface.point;
    const twist: number = turned ? (p.side === "left" ? TURN : -TURN) : 0;
    const stance: IAutoMovieMotionHumanRise.Stance = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    // Seated, the seat bears the body: the lean pivots about the hips over
    // it and the legs keep their place, so neither the heels rise nor the
    // root is lowered onto the feet.
    const seated: boolean = context.entry.supports.some(
      (s: IAutoMovieMotionHumanEntryState.ISupport): boolean =>
        s.kind === "seat",
    );
    // The body at a share of the kiss: risen, leaned from the hips and,
    // standing, lowered onto the planted legs: the one model the solve
    // scores (`kissBody`).
    const written = (
      posture: IAutoMovieMotionHumanPosture,
      s: IAutoMovieMotionHumanKiss.ISolved,
      k: number,
    ): IAutoMovieMotionHumanPosture =>
      kissBody(body, posture, stance, s, k, seated);
    const clock: IAutoMovieMotionClock = shared ?? solo();
    const solved: IAutoMovieMotionHumanKiss.ISolved = solve(
      context,
      entry,
      stance,
      twist,
      at,
      seated,
      hand !== undefined && meeting === undefined
        ? {
            clock,
            start: context.start,
            normal: surface.normal,
            clearance: () => kissHandClearance(context, hand),
          }
        : undefined,
    );
    // A region the lean, the neck and the rise do not bring the mouth to is
    // out of reach: the kiss refuses with what they reach, rather than
    // driving the head on into the partner (laws/authoring.md, Out of reach).
    if (solved.miss > NEAR)
      throw new HumanRefusal({
        kind: "reach",
        axis: "region",
        value: p.region,
        feasible: { kind: "range", minimum: null, maximum: NEAR, unit: "m" },
        reason: `the mouth stays ${(solved.miss * 1000).toFixed(0)} mm from the partner's ${p.region} at a lean of ${solved.pitch.toFixed(0)} degrees forward and ${solved.roll.toFixed(0)} to the side, the neck flexed ${solved.flexion.toFixed(0)} and the heels raised ${solved.raise.toFixed(0)}`,
        fix: "come nearer first, or kiss a region within the lean's reach",
      });

    /** The direct kiss keeps its own transport and manner. */
    function solo(): IAutoMovieMotionClock {
      const travel: number = Vector3.distance(
        HumanTrunk.region(body, entry, "mouth").point,
        at,
      );
      const approach: number = AutoMovieMotionHumanTiming.transport(travel);
      return kissClock(
        AutoMovieMotionManner.time(
          AutoMovieMotionClock.phrase({
            prepare: approach,
            attack: 0,
            hold,
            retract: approach,
          }),
          modifiers,
        ),
      );
    }
    const share = (seconds: number): number =>
      clock.envelope(["start", "ready"], ["relax", "end"], seconds);
    const head = AutoMovieMotionHumanHead.share(0, solved.flexion);
    const turn = AutoMovieMotionHumanHead.share(2, solved.twist ?? twist);
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives: [
        {
          channels: ["root", "trunk"],
          from: 0,
          to: clock.duration,
          write: (
            posture: IAutoMovieMotionHumanPosture,
            seconds: number,
          ): IAutoMovieMotionHumanPosture =>
            written(posture, solved, share(seconds)),
        },
        ...(solved.raise > 0
          ? AutoMovieMotionHumanRise.legs({
              body,
              stance,
              from: 0,
              to: clock.duration,
              degrees: (seconds: number): number =>
                solved.raise * share(seconds),
            })
          : []),
        AutoMovieMotionHumanJoints.pulse(
          clock,
          ["start", "ready"],
          ["relax", "end"],
          {
            neck: [head.neck![0], 0, turn.neck![2]],
            head: [head.head![0], 0, turn.head![2]],
          },
        ),
      ],
      contact: "contact",
    });
  }
}
