import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { stand } from "../actions/stand";
import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import type { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanVariation } from "../compose/AutoMovieMotionHumanVariation";
import { AutoMovieMotionHumanVariationPlace } from "../compose/AutoMovieMotionHumanVariationPlace";
import type { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanBalance } from "./HumanBalance";
import { HumanEffort } from "./HumanEffort";
import { gestureJoints } from "./gestureJoints";
import { gestureStroke } from "./gestureStroke";
import { handGoals } from "./handGoals";

/**
 * A communicative gesture while standing: the hand, head or trunk moves
 * through Kendon's phases (Kendon 1980; McNeill 1992, Hand and Mind):
 * preparation from rest to the stroke's start, the stroke that carries the
 * meaning, an optional post-stroke hold, and retraction to rest.
 *
 * The feet stay planted and the body stands as the stand law places it.
 * Each moving hand is an effector goal ({@link gestureStroke}): in the
 * preparation the arm's joint angles go from what the entry left to the
 * solution of the stroke's goal on a minimum-jerk course
 * (`AutoMovieMotionHumanArm.carry`) and the fingers take the gesture's
 * shape; in the stroke the hand follows the stroke's goals; in the
 * retraction the angles return to the relaxed hanging arm's. The arm is
 * solved by inverse
 * kinematics with a natural elbow hint widened by the gesture and the
 * Effort. Head, shoulder and trunk gestures add their joint angles under an
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
    count?: number;

    /** Post-stroke hold, seconds; 0 when absent. */
    hold?: number;

    /** A bow's depth, degrees in (0, 60]; 30 when absent. */
    depth?: number;

    /** Movement quality. */
    effort?: HumanEffort.IEffort;

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
   * @evidence contracts/development/implementation.md#principled-implementation Kendon's phases (Kendon 1980; McNeill 1992): hand goals from gestureStroke solved by the arm's inverse kinematics, the arm carried to and from them in joint angles on a minimum-jerk course; joint gestures added under an envelope; a bow's hip shift from the engine's centre of mass (HumanBalance.shift) at the peak pitch, scaled by the pitch's sine between. The entry's and the rest's arm angles are joint angles, so they follow the standing body.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The plan owns phase timing and transport; gestureStroke owns each gesture's goals and angles, `bow` the pitched posture, handGoals the arm solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The free-space transport time is the timing owner's; the 0.3 s joint-gesture preparation and the second per 30 degrees of a bow are named provisional values; Effort modifiers come from HumanEffort; no gesture or body is special-cased beyond the kind's own table rows.
   * @evidence contracts/development/implementation.md#efficient-algorithms Planning costs two bone resolves for the start and rest hands and, for a bow, one balance solve; each posture costs one stand posture, one stroke goal per moving hand (each may aim at the target) and one hand solve.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Phase times, start and rest hands and the bow's shift are computed once per instance and every posture reads them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The posture closure holds this instance's body, parameters, phase times and start and rest hands, released with the performance; nothing grows per call.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const mods: HumanEffort.IModifiers = HumanEffort.modifiers(p.effort);
    const rhythm = gestureStroke.RHYTHM[p.kind];
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

    const sides: HumanHand.Side[] = ((): HumanHand.Side[] => {
      const which = gestureStroke.HANDS[p.kind];
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

    // Where each hand starts (the entry) and rests (the relaxed hanging arm), in the performer's frame.
    const probe: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: 1 },
    });
    const at0: IHumanPosture = probe.posture(0);
    const entryBones = poseBones(body, context.entry.pose);
    const restPose: IAutoMoviePose = resolveHumanPosture(body, at0);
    const begin: Partial<
      Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>
    > = {};
    const rest: Partial<
      Record<HumanHand.Side, AutoMovieMotionHumanArm.IAngles>
    > = {};
    for (const side of sides) {
      begin[side] = AutoMovieMotionHumanArm.angles(context.entry.pose, side);
      rest[side] = AutoMovieMotionHumanArm.angles(restPose, side);
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
    const base: IHumanActionPlan = stand.plan({
      ...context,
      params: { seconds: duration },
    });

    // A bow's balance: the hips' shift at the deepest pitch, scaled by the pitch's sine in between.
    const peak: number = depth * mods.extent;
    const lean: number =
      p.kind === "bow"
        ? HumanBalance.shift(
            body,
            (back: number): IHumanPosture => bow(body, at0, peak, back),
          ) / Math.sin((peak * Math.PI) / 180)
        : 0;

    return {
      duration,
      events: [
        { name: "prepare", share: 0 },
        { name: "strokeStart", share: prepare / duration },
        { name: "strokeEnd", share: strokeEnd / duration },
        { name: "retract", share: retractAt / duration },
      ],
      contacts: base.contacts,
      posture: (seconds: number): IHumanPosture => {
        const t: number = Math.min(duration, Math.max(0, seconds));
        const envelope: number =
          t < prepare
            ? minimumJerk(t / prepare).s
            : t <= retractAt
              ? 1
              : 1 - minimumJerk((t - retractAt) / retract).s;
        const u: number = Math.min(1, Math.max(0, (t - prepare) / stroke));
        let posture: IHumanPosture = base.posture(t);
        if (p.kind === "bow")
          posture = bow(
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

        // Hands: on the stroke's goals, and carried in joint space to its
        // start and back to rest.
        const requests: AutoMovieMotionHumanArm.ISided[] = [];
        for (const side of sides) {
          const goal: gestureStroke.IHand = gestureStroke.hand(
            p.kind,
            side,
            u,
            cycles,
            input(posture, t, side),
          );
          requests.push({
            side,
            surface: goal.surface,
            shape: goal.shape,
            point: goal.point,
            rotation: goal.rotation,
            bend: AutoMovieMotionHumanBend.hang(
              body,
              posture,
              side,
              goal.out + mods.elbow,
            ),
          });
          const shape = HumanHand.shape(side, goal.shape);
          const relaxed = HumanHand.shape(side, "relaxed");
          for (const bone of Object.keys(shape) as AutoMovieHumanoidBone[]) {
            const a: readonly [number, number, number] = shape[bone]!;
            const r: readonly [number, number, number] = relaxed[bone]!;
            const curl: number = bone.includes("Thumb") ? 0 : (goal.curl ?? 0);
            joints[bone] = [r[0] + (a[0] + curl - r[0]) * envelope, 0, 0];
          }
        }
        // The envelope is the transport's share: the arms leave the entry's
        // angles in the preparation and reach the rest's in the retraction.
        return AutoMovieMotionHumanArm.carry(
          body,
          handGoals(body, { ...posture, joints }, requests),
          t < prepare ? begin : rest,
          envelope,
        );
      },
    };
  }

  /**
   * A standing posture bowed by a trunk pitch: the whole body above the feet
   * tips about the hips, the hips move back by the balance shift, and the
   * planted legs are re-solved by their unchanged goals.
   *
   * @param body The body.
   * @param posture The standing posture.
   * @param pitch Forward pitch, degrees.
   * @param back How far the hips move back, metres.
   * @returns The bowed posture.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the pivot, what moves, the units of the pitch and the shift, and that the legs keep their goals.
   * @evidence contracts/development/implementation.md#principled-implementation Adds the pitch to the posture's root pitch and places the root so the rest hips land at their standing point moved back by `back` in the posture's frame, a rotation about the hips; the leg goals stay on the feet and are solved when the posture is resolved.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure posture transform shared by the plan and its balance solve.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No constants; the pitch and shift come from the caller.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time: one heading quaternion and one rotated offset.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A pure function with nothing to share.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new posture and retains nothing.
   */
  export function bow(
    body: IHumanBody,
    posture: IHumanPosture,
    pitch: number,
    back: number,
  ): IHumanPosture {
    const hips: IAutoMovieVector3 = body.rest.get("hips")!;
    const frame: HumanFrame.IFrame = { origin: posture.root, yaw: posture.yaw };
    const target: IAutoMovieVector3 = HumanFrame.point(frame, {
      x: hips.x,
      y: hips.y,
      z: hips.z - back,
    });
    const tipped: IHumanPosture = { ...posture, pitch: posture.pitch + pitch };
    const offset: IAutoMovieVector3 = Quaternion.rotateVector(
      resolveHumanPosture.heading(tipped),
      hips,
    );
    return { ...tipped, root: Vector3.subtract(target, offset) };
  }
}
