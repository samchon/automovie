import { Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanVariation } from "../compose/AutoMovieMotionHumanVariation";
import { AutoMovieMotionHumanVariationPlace } from "../compose/AutoMovieMotionHumanVariationPlace";
import type { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { HumanUnit } from "../law/HumanUnit";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanArmTrajectory } from "../posture/HumanArmTrajectory";
import { HumanHand } from "../posture/HumanHand";
import { HumanHandShape } from "../posture/HumanHandShape";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanEffort } from "./HumanEffort";
import { gestureBow } from "./gestureBow";
import { gestureHands } from "./gestureHands";
import { gestureJoints } from "./gestureJoints";
import { gestureStroke } from "./gestureStroke";
import { gestureStrokeTables } from "./gestureStrokeTables";
import { handGoals } from "./handGoals";

/**
 * A communicative gesture while standing: the hand, head or trunk moves
 * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
 * preparation from rest to the stroke's start, the stroke that carries the
 * meaning, an optional post-stroke hold, and retraction to rest.
 *
 * The feet stay planted and the body stands as the stand law places it;
 * performed over a carrier (a walk, a seat, a ride) the body is the
 * carrier's, instant by instant, and the gesture takes only the parts it
 * moves. Each moving hand is an effector goal ({@link gestureStroke}),
 * solved by inverse kinematics with a natural elbow hint widened by the
 * gesture and the Effort; the moving arms are planned over the whole
 * gesture as one trajectory (`gestureHands.planned`): from what the entry
 * left to the stroke's goals in the preparation, on them through the
 * stroke, and back to the relaxed hanging arm's in the retraction, while
 * the fingers take the gesture's shape and leave it on the same share. Head, shoulder and trunk gestures add their joint angles under an
 * envelope that rises in the preparation and falls in the retraction; a bow
 * pitches the whole trunk about the hips by its depth (15, 30 or 45 degrees
 * are the conventional light, ordinary and deep bows) while the hips move
 * back to keep the body balanced over the feet ({@link HumanBalance}).
 *
 * Transport time is the free-space time of the distance moved
 * (`AutoMovieMotionHumanTiming.transport`),
 * 0.3 s for head and shoulder gestures and one second per 30 degrees of a
 * bow (provisional). The Effort's tempo scales every phase, its extent the
 * gesture's size and its elbow term the arm's width ({@link HumanEffort}).
 *
 * The plan names the hands it moves (`hands`), so a gesture with a hand that
 * holds a prop is refused, naming the free hand.
 *
 * Events: `prepare`, `strokeStart`, `strokeEnd`, `retract`. A gesture may be
 * cut into another during its retraction, making a gesture unit, and into
 * standing or moving before its stroke or after it; its stroke is never cut,
 * since a cut stroke loses the gesture's meaning.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the goal, the method, the timing, the events and the refusals, with sources and provisional values marked.
 * @evidence contracts/development/design.md#principled-representation A law record of the action-law core: a name, a closed cancel table and a pure plan of postures in world metres and seconds.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Exposes the name, the cancel table, the parameters and the plan the performance dispatches through, plus the helpers its tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the posture, plan, hand and frame types; no body is special-cased.
 */
export namespace gesture {
  /** The action's name. */
  export const name: HumanActionName = "gesture";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    stand: [
      { window: [0, "strokeStart"], kind: "inertialize", entry: 0 },
      { window: ["strokeEnd", 1], kind: "inertialize", entry: 0 },
    ],
    walk: [
      { window: [0, "strokeStart"], kind: "inertialize", entry: 0, blend: 0.3 },
      { window: ["strokeEnd", 1], kind: "inertialize", entry: 0, blend: 0.3 },
    ],
    look: [{ window: ["strokeEnd", 1], kind: "inertialize", entry: 0 }],
    gesture: [{ window: ["retract", 1], kind: "inertialize", entry: 0 }],
  };

  /** A gesture may be performed over a carrier: it claims the moving arms with their hands, and the head or the trunk when its kind moves them. */
  export const overlay: boolean = true;

  /**
   * Parameters of a gesture: which gesture, which hand, what it points at or
   * touches, how many strokes, the hold, a bow's depth and the movement
   * quality.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each field states its meaning, unit, the gestures it applies to and the default an absent value takes.
   * @evidence contracts/development/design.md#principled-representation The kind is gestureStroke's closed union; the target is the shared motion target union, read at each instant so pointing follows a moving target; count, hold and depth are a whole number, seconds and degrees, validated at plan time (positive whole count, non-negative hold, a bow in (0, 60]) since the types cannot express those ranges.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by this law and read only by its plan; the kind, face region, hand and Effort types are imported from their owners.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fields that apply to only some kinds (target, region, depth) stay optional on one record rather than a union per kind: a field a kind does not read is ignored, and the one required pairing, `point` with a target, is refused at plan time. A per-kind discriminated union would rule that state out by type.
   */
  export interface IParams {
    /** The gesture. */
    kind: gestureStroke.Kind;

    /** The hand of a one-hand gesture; `right` when absent. */
    side?: HumanHand.Side;

    /** What to point at; required by `point`. */
    target?: AutoMovieMotionTarget;

    /** The face region a `touchFace` reaches; `forehead` when absent. */
    region?: gestureStroke.FaceRegion;

    /** Stroke repetitions (waves, nods, claps); the gesture's own count when absent. */
    count?: number & tags.Type<"uint32"> & tags.Minimum<1> & HumanUnit<"">;

    /** Post-stroke hold, seconds; 0 when absent. */
    hold?: number & tags.Minimum<0> & HumanUnit<"s">;

    /** A bow's depth, degrees in (0, 60], refused outside that range only for a bow, so it carries no schema bound; 30 when absent. */
    depth?: number;

    /** Movement quality. */
    effort?: HumanEffort.IEffort;

    /** Degrees the moving hands are turned in the plane of their own palms from the gesture's attitude, the thumb's side rising for a positive turn (provisional sign, held by `test_human_motion_emblem_thumbs`): a quarter turn stands a held-out fist's thumb up, the opposite one points it down. No turn when absent. */
    turn?: number;

    /** A hand shape with a meaning of its own, taken by the moving hands in place of the gesture's working shape: a thumbs up, an OK ring, a V, a count; the gesture's own shape when absent. */
    shape?: HumanHandShape.Emblem;

    /** A digit of `shape` aimed straight at the world's up or down: the moving hands turn by the least rotation from the gesture's attitude, after `turn`, that points the digit's own direction (`HumanHandShape.digit`) there, since a straight digit does not lie along the hand's axes (a thumbs up's thumb stands about 35 degrees off the knuckle line). Requires `shape`; no aim when absent. */
    aim?: { digit: "thumb" | "forefinger"; toward: "up" | "down" };

    /**
     * How much repeats of the gesture differ: `variation` in [0, 1] scales
     * the spread of the preparation's length and of where a `wave` or a
     * `stopPalm` holds the hand within its named place, and `proficiency`
     * replaces the performer's skill for those spreads. Absent or 0, every
     * repeat is the same.
     */
    manner?: Pick<AutoMovieMotionManner.IManner, "variation" | "proficiency">;
  }

  /**
   * Plan a gesture: the phase times from the hands' transport, the stroke's
   * rhythm and the Effort, a bow's balance shift, and postures that move the
   * hands, head and trunk through preparation, stroke, hold and retraction.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} On a missing pointing target, a count that is not a positive whole number, a negative hold, or a bow outside (0, 60] degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is planned and every refusal; the law's doc gives the phases, timing laws and provisional values.
   * @evidence contracts/development/implementation.md#principled-implementation Kendon's phases (Kendon 1980; McNeill 1992): hand goals from gestureStroke solved by the arm's inverse kinematics, the moving arms planned to, on and from them as one trajectory clear of the body; joint gestures added under an envelope; a bow's hip shift from the engine's centre of mass (HumanBalance.shift) at the peak pitch, scaled by the pitch's sine between. The entry's and the rest's arm angles are joint angles, so they follow the standing body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan owns phase timing, transport and the channels and hands it declares; the body under it is the stand law's or, over a carrier, the carrier's (`under`); gestureStroke owns each gesture's goals and angles, `bow` the pitched posture, handGoals the arm solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The free-space transport time is the timing owner's; the 0.3 s joint-gesture preparation and the second per 30 degrees of a bow are named provisional values; Effort modifiers come from HumanEffort; no gesture or body is special-cased beyond the kind's own table rows.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning costs two bone resolves for the start and rest hands and, for a bow, one balance solve; the arms' trajectory is planned once, at the first posture written inside the gesture; each posture costs one base posture (the stand's or the carrier's), one stroke goal per moving hand (each may aim at the target) and one cubic read of the planned arms, or one hand solve at either end.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Phase times, start and rest hands and the bow's shift are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The posture closure holds this instance's body, parameters, phase times and start and rest hands, released with the performance; nothing grows per call.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const mods: HumanEffort.IModifiers = HumanEffort.modifiers(p.effort);
    const rhythm = gestureStrokeTables.RHYTHM[p.kind];
    const cycles: number = p.count ?? rhythm.cycles;
    HumanBound.whole("count", cycles);
    const hold: number = p.hold ?? 0;
    HumanBound.least("hold", hold, 0, "s");
    const depth: number = p.depth ?? 30;
    if (p.kind === "bow")
      HumanBound.within("depth", depth, 0, 60, "degrees", "minimum");
    if (p.kind === "point" && p.target === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "target",
        value: undefined,
        reason: "Pointing needs a target",
        fix: "give the point gesture a target",
      });
    if (p.aim !== undefined && p.shape === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "aim",
        value: p.aim,
        reason:
          "an aim points a digit of the hand's emblem shape, and no shape is given",
        fix: "give the gesture a shape whose digit is aimed, or leave out aim",
      });

    const sides: HumanHand.Side[] = ((): HumanHand.Side[] => {
      const which = gestureStrokeTables.HANDS[p.kind];
      return which === "both"
        ? ["left", "right"]
        : which === "one"
          ? [p.side ?? "right"]
          : [];
    })();
    const target = (seconds: number): IAutoMovieVector3 | undefined =>
      p.target === undefined
        ? undefined
        : context.aim(p.target, context.start + seconds).point;
    const input = (
      base: IHumanPosture,
      seconds: number,
      side: HumanHand.Side,
    ): gestureStroke.IInput => ({
      body,
      base,
      side,
      region: p.region ?? "forehead",
      extent: mods.extent,
      ...(target(seconds) === undefined ? {} : { target: target(seconds)! }),
      ...(source === undefined || travel === undefined
        ? {}
        : {
            vary: (
              record: AutoMovieMotionHumanTarget.IDefault,
            ): AutoMovieMotionHumanTarget.IDefault =>
              AutoMovieMotionHumanVariationPlace.vary(
                source,
                "place",
                body,
                side,
                record,
                travel,
              ),
          }),
    });
    // This repeat's variation, and the arrival its place offset is read
    // from: set once the named place's transport is known, so the places are
    // as named until then.
    const source: AutoMovieMotionHumanVariation.ISource | undefined =
      AutoMovieMotionHumanVariation.of(context, p.manner);
    let travel: AutoMovieMotionHumanVariationPlace.ITravel | undefined;

    // The body under the gesture: the carrier's when the gesture is an
    // overlay, otherwise the stand law's. Each hand starts where the entry
    // left it and rests where that body's arm hangs.
    const under = (seconds: number): IHumanActionPlan =>
      context.carrier === undefined
        ? stand.plan({ ...context, params: { seconds } })
        : AutoMovieMotionHumanBase.under(context, seconds);
    const probe: IHumanActionPlan = under(1);
    const at0: IHumanPosture = probe.posture(0);
    const entryBones = poseBones(body, context.entry.pose);
    const restPose: IAutoMoviePose = resolveHumanPosture(body, at0);
    const begin: Partial<
      Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>
    > = {};
    const rest: Partial<
      Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>
    > = {};
    // The aimed digit's own direction in each moving hand's frame, read once.
    const digits: Partial<Record<HumanHand.Side, IAutoMovieVector3>> = {};
    for (const side of sides) {
      begin[side] = AutoMovieMotionHumanArm.angles(context.entry.pose, side);
      rest[side] = AutoMovieMotionHumanArm.angles(restPose, side);
      if (p.aim !== undefined && p.shape !== undefined)
        digits[side] = HumanHandShape.digit(
          body,
          side,
          HumanHandShape.emblem(side, p.shape),
          p.aim.digit === "thumb" ? "Thumb" : "Index",
        );
    }
    // The farthest a hand travels from the entry to its stroke's start.
    const span = (): number => {
      let far: number = 0;
      for (const side of sides) {
        const goal: gestureStroke.IHand = gestureStroke.hand(
          p.kind,
          side,
          0,
          cycles,
          input(at0, 0, side),
        );
        far = Math.max(
          far,
          Vector3.length(
            Vector3.subtract(
              goal.point,
              HumanHand.frame(body, entryBones, side, goal.surface, "relaxed")
                .point,
            ),
          ),
        );
      }
      return far;
    };

    const T: number = mods.tempo;
    const named: number = span();
    if (source !== undefined && named > 0)
      travel = {
        distance: named,
        seconds: T * AutoMovieMotionHumanTiming.transport(named),
      };
    const transport: number = travel === undefined ? named : span();
    // The retraction keeps the named length; only the preparation varies, so
    // the stroke's start moves and the stroke's own length does not.
    const retract: number =
      T *
      (p.kind === "bow"
        ? depth / 30
        : sides.length === 0
          ? 0.3
          : AutoMovieMotionHumanTiming.transport(transport));
    const prepare: number = AutoMovieMotionHumanVariation.duration(
      source,
      "prepare",
      retract,
    );
    const stroke: number =
      T * cycles * AutoMovieMotionHumanTiming.seconds(rhythm.period);
    const strokeEnd: number = prepare + stroke;
    const retractAt: number = strokeEnd + hold;
    const duration: number = retractAt + retract;
    const base: IHumanActionPlan = under(duration);

    // What the gesture moves, which an overlay takes from its carrier: the
    // moving arms with their hands, the parts its joint angles belong to and,
    // for a bow, the root and the trunk.
    const claimed: Set<AutoMovieMotionHumanChannel> = new Set(
      (
        Object.keys(
          gestureJoints.at(p.kind, 0.25, cycles, 1, 1),
        ) as AutoMovieHumanoidBone[]
      ).map(AutoMovieMotionHumanChannel.of),
    );
    for (const side of sides) {
      claimed.add(`${side}Arm`);
      claimed.add(`${side}Hand`);
    }
    if (p.kind === "bow") {
      claimed.add("root");
      claimed.add("trunk");
    }

    // A bow's balance: the hips' shift at the deepest pitch, scaled by the pitch's sine in between.
    const peak: number = depth * mods.extent;
    const lean: number =
      p.kind === "bow"
        ? HumanBalance.shift(
            body,
            (back: number): IHumanPosture =>
              gestureBow.bowed(body, at0, peak, back),
          ) / Math.sin((peak * Math.PI) / 180)
        : 0;

    // The posture before the arms at a second, the stroke's hand requests
    // and the transport's share.
    const prior = (t: number): gestureHands.IPrior => {
      const envelope: number =
        t < prepare
          ? minimumJerk(t / prepare).s
          : t <= retractAt
            ? 1
            : 1 - minimumJerk((t - retractAt) / retract).s;
      const u: number = Math.min(1, Math.max(0, (t - prepare) / stroke));
      let posture: IHumanPosture = base.posture(t);
      if (p.kind === "bow")
        posture = gestureBow.bowed(
          body,
          posture,
          peak * envelope,
          lean * Math.sin((peak * envelope * Math.PI) / 180),
        );

      // Head, shoulder and trunk angles, added to what the stand holds.
      const joints: IHumanPosture["joints"] = { ...posture.joints };
      for (const [bone, add] of Object.entries(
        gestureJoints.at(p.kind, u, cycles, envelope, mods.extent),
      ) as [AutoMovieHumanoidBone, readonly [number, number, number]][]) {
        const was: readonly [number, number, number] = joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [was[0] + add[0], was[1] + add[1], was[2] + add[2]];
      }

      // Hands: on the stroke's goals, and planned to its start and back
      // to rest.
      const requests: AutoMovieMotionHumanArm.ISided[] = [];
      for (const side of sides) {
        const hand: { request: AutoMovieMotionHumanArm.ISided; fingers: IHumanPosture["joints"] } = gestureHands.hand(
          body,
          posture,
          side,
          gestureStroke.hand(p.kind, side, u, cycles, input(posture, t, side)),
          p,
          digits[side],
          mods.elbow,
          envelope,
        );
        requests.push(hand.request);
        Object.assign(joints, hand.fingers);
      }      return { posture: { ...posture, joints }, requests, envelope };
    };
    let arms: Map<HumanHand.Side, HumanArmTrajectory.Trajectory> | undefined;

    return {
      duration,
      events: [
        { name: "prepare", share: 0 },
        { name: "strokeStart", share: prepare / duration },
        { name: "strokeEnd", share: strokeEnd / duration },
        { name: "retract", share: retractAt / duration },
      ],
      contacts: base.contacts,

      // The hands the gesture moves, so a hand that holds a prop is refused it.
      ...(sides.length === 0 ? {} : { hands: sides }),
      ...(context.carrier === undefined
        ? {}
        : {
            channels: AutoMovieMotionHumanChannel.ORDER.filter(
              (c: AutoMovieMotionHumanChannel): boolean => claimed.has(c),
            ),
          }),
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const { posture, requests, envelope }: gestureHands.IPrior = prior(t);
        // The arms planned over the whole gesture as one trajectory, once.
        if (sides.length > 0 && t > 0 && t < duration) {
          arms ??= gestureHands.planned(body, { start: 0, ready: prepare, relax: retractAt, end: duration }, sides, begin, rest, prior);
          return gestureHands.written(posture, arms, t);
        }
        return AutoMovieMotionHumanArm.carry(
          body,
          handGoals(body, posture, requests),
          t < prepare ? begin : rest,
          envelope,
        );
      },
    };
  }
}
