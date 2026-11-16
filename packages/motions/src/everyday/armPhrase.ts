import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmPhrase } from "../compose/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmTarget } from "../compose/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { handToFace } from "../daily/handToFace";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { armPhraseFacing } from "./armPhraseFacing";

/**
 * One arm phrase on a target: the hand visits a place, strokes along a path
 * or oscillates about a pose, on the standard instants of a phrase (Kendon
 * 1980's preparation, stroke, hold and retraction as BML's `ready`,
 * `strokeStart`, `stroke`, `strokeEnd` and `relax`). It is the law the
 * upper-body lexicon's rows are written over (#3361): a wave, a tap, a hand
 * at rest on the hip, a wipe across a table are each this law with its
 * phrase, its target and its hand fixed (`HumanUpperRows`), so they share one
 * plan, one set of refusals and one timing.
 *
 * The phrase moves the hand from where the entry pose holds it (its surface's
 * place in the performer's frame) to the target and back, by the vocabulary's
 * own arm phrases (`AutoMovieMotionHumanArmPhrase`: `visit`, `stroke`,
 * `oscillate`), and the composition keeps every other part as the carrier or
 * the entry state has it (`AutoMovieMotionHumanBase.under`). The target is
 * any `AutoMovieMotionTarget`, read where it is at the phrase's start: a
 * region of one's own body or another's, a prop's point, a point in the
 * performer's frame. An `offset` moves the target's point in the
 * performer's frame (out, up, forward) by shares of the arm's length (upper
 * arm, forearm and hand), so one row fits every body. The hand faces against
 * the target's normal with its fingers up, unless `facing` names it. A
 * phrase that names a `held` prop keeps the hand's grip on it over its whole
 * span and leaves it held, so a hammer, a spoon or a hat moves with the
 * hand; a hand that does not hold it at entry is refused. Such a phrase may
 * name one of the held prop's own points as its working `point` (a cup's
 * lip, a fork's face): that point, not the hand's surface, is brought to the
 * target, the hand's surface placed short of it by the point's lever from
 * the surface in the hand's frame, which the grip keeps fixed, and the hand
 * turned so the point faces into the target, unless `facing` names the
 * turn. Both hands may
 * perform one phrase on one clock (a clap, palms rubbed together), each
 * hand's offset mirrored by its side, so two hands sent to one median target
 * meet there; such a phrase holds no prop.
 *
 * Timing: the preparation and the retraction are travels of the distance
 * from the hand to the target (`AutoMovieMotionHumanTiming.transport`); a
 * visit's stroke is instant and its hold the named `hold` pause (a beat when
 * absent); a stroke takes one travel of its path's length; an oscillation
 * takes `cycles` beats. The manner's tempo scales every phase and its extent
 * and curvature reach the phrase (`AutoMovieMotionManner.of`). Events: the
 * phrase's instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the three phrases, what is moved and kept, the target's frame and offset, the facing, every phase's timing and its owner, and the events.
 * @evidence contracts/development/design.md#principled-representation A law record whose parameters name a phrase, a target and a hand, with a pure plan composed from the vocabulary's phrase primitives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the overlay flag, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the arm phrases, the clock, the timing, the base and the manner; it writes no movement of its own.
 * @evidence contracts/development/implementation.md#principled-implementation Kendon's phases on the phrase clock, each phase a minimum-jerk movement through the arm phrases, timed by the vocabulary's transport rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Each arm's geometry, one clock shared by the arms, one primitive per arm, one composition.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The offset's shares are the caller's and scale with the body; the phases are the timing owner's transport and pauses. Two defaults are set here and named provisional: an oscillation's swing (`SWING`, a tenth of the arm's length) and its two cycles.
 * @evidence contracts/development/implementation.md#efficient-algorithms Planning resolves entry bones and prepares fixed offsets/bend hints once; each posture pays its actual base and arm primitive work. Declared root/own-arm/own-hand dependencies let requested prefix reads omit unrelated channels without omitting any later actual limb fit.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The target, offset, swing and bend are fixed plan geometry. Target closures ignore the current posture, while the move still reads current root/yaw and preserves own arm joints and own-hand digit goals; those are exactly its declared input channels.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan's closures hold the instance's inputs only.
 */
export namespace armPhrase {
  /** The law's name, as productions register it. */
  export const name: string = "armPhrase";

  /** Cancel table: a phrase may be left for anything once it retracts. */
  export const interrupts: IHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** A phrase is performed over a carrier that yields its arm and hand. */
  export const overlay: boolean = true;

  /** The phrase. */
  export type Phrase = (typeof PHRASES)[number];

  /** The phrases of {@link Phrase}, as data. */
  export const PHRASES = ["visit", "stroke", "oscillate"] as const;

  /** A point offset in the performer's frame by shares of the arm's length. */
  export interface IOffset {
    /** Away from the midline on the acting side. */
    out: number;

    /** Upward. */
    up: number;

    /** Forward. */
    forward: number;
  }

  /** Parameters. */
  export interface IParams {
    /** The phrase. */
    phrase: Phrase;

    /** Where the hand's surface goes: the visit's place, the stroke's end, the oscillation's pose. */
    target: AutoMovieMotionTarget;

    /** The target's point moved in the performer's frame by shares of the arm's length; none when absent. */
    offset?: IOffset;

    /** A stroke's start, by the same shares from the target's point; the target's point when absent. */
    from?: IOffset;

    /** An oscillation's swing, by the same shares at the swing's ends; a tenth of the arm out and in when absent. */
    swing?: IOffset;

    /** The oscillation's cycles; 2 when absent (provisional: no measured count read). */
    cycles?: number;

    /**
     * `true` when the target is written for the right hand, as a row writes
     * it: a self region of a side (`hipRight`) is read on the acting arm's
     * own side (`hipLeft` for the left hand, `handToFace.mirrored`), and a
     * midline region is its own mirror. The target as named when absent.
     */
    mirror?: boolean;

    /** The hand, or both hands on one clock with their offsets mirrored (a clap, palms rubbed together); the right when absent. */
    side?: HumanHand.Side | "both";

    /** The hand's surface brought to the target; the palm when absent. */
    surface?: HumanHand.Surface;

    /** The hand's shape; flat when absent. */
    shape?: HumanHand.Shape;

    /** How the hand is turned; against the target's normal with the fingers up when absent. */
    facing?: HumanHand.IFacing;

    /** A visit's hold on its place; a beat when absent. */
    hold?: AutoMovieMotionHumanTiming.Pause;

    /** The manner; neutral when absent. */
    manner?: AutoMovieMotionManner.IManner;

    /**
     * A prop the hand holds through the phrase and keeps after it (a hammer,
     * a spoon, a hat on its way to the head): the phrase takes the hand's
     * grip on it over its whole span, so the prop rides the hand with the
     * offset it was held by, and leaves it held. The hand must hold it at
     * entry; none when absent.
     */
    held?: string;

    /**
     * The held prop's point brought to the target instead of the hand's
     * surface, one of its affordance ids (a cup's `lip` to the mouth, a
     * fork's `face`); it needs `held`. The hand's surface when absent.
     */
    point?: string;
  }

  /**
   * Plan the phrase.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When a held prop is named that the hand does not hold at entry or with both hands, when a working point is named without a held prop, or when the held prop has no such point.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body: IHumanBody = context.body;
    const sides: readonly HumanHand.Side[] =
      p.side === "both" ? ["left", "right"] : [p.side ?? "right"];
    const surface: HumanHand.Surface = p.surface ?? "palm";
    const shape: HumanHand.Shape = p.shape ?? "flat";
    const hold: IHumanPosture = context.entry.posture;
    const reach: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    const mods: AutoMovieMotionManner.IModifiers = AutoMovieMotionManner.of(
      context,
      p.manner,
    );
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set(sides.flatMap((side: HumanHand.Side): AutoMovieHumanoidBone[] =>
        [...HumanHand.frameBones(body, side, surface)])),
    );

    // A held prop must be in the one acting hand at entry, and a working
    // point needs one.
    if (
      p.held !== undefined &&
      (sides.length !== 1 || context.entry.holds[sides[0]!] !== p.held)
    )
      throw new HumanRefusal({
        kind: "base",
        axis: "held",
        value: p.held,
        reason:
          sides.length !== 1
            ? `a phrase of both hands names no held prop, but names ${p.held}`
            : `the ${sides[0]!} hand does not hold ${p.held} at the phrase's start`,
        fix: "take the prop up in that hand first",
      });
    if (p.point !== undefined && p.held === undefined)
      throw new HumanRefusal({
        kind: "base",
        axis: "point",
        value: p.point,
        reason: `the working point ${p.point} belongs to no held prop`,
        fix: "name the prop the hand holds as `held`, or drop `point` to bring the hand's surface",
      });

    // The target where it is at the phrase's start, for one arm: a target
    // written for the right hand reads a self region of a side on the arm's
    // own side.
    const aim = (
      side: HumanHand.Side,
    ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =>
      context.aim(
        p.mirror === true && p.target.kind === "self"
          ? { ...p.target, region: handToFace.mirrored(p.target.region, side) }
          : p.target,
        context.start,
      );

    // Each arm's geometry: its hand's place before and after, an offset in
    // the performer's frame by shares of the arm's length (`out` mirrored by
    // the arm, so two hands at one median target meet there), its place and
    // its turn.
    const arms: IArm[] = sides.map((side: HumanHand.Side): IArm => {
      const origin: AutoMovieMotionHumanArmTarget.IOrigin =
        AutoMovieMotionHumanArmTarget.origin(
          body,
          bones,
          { origin: hold.root, yaw: hold.yaw },
          side,
          surface,
        );
      const shift: (o: IOffset | undefined) => IAutoMovieVector3 = (
        o: IOffset | undefined,
      ): IAutoMovieVector3 =>
        o === undefined
          ? { x: 0, y: 0, z: 0 }
          : Vector3.scale(
              Vector3.add(
                Vector3.add(
                  Vector3.scale(HumanHand.direction(side, hold.yaw, "out"), o.out),
                  Vector3.scale(HumanHand.direction(side, hold.yaw, "up"), o.up),
                ),
                Vector3.scale(
                  HumanHand.direction(side, hold.yaw, "forward"),
                  o.forward,
                ),
              ),
              reach,
            );
      const aimed: { point: IAutoMovieVector3; normal: IAutoMovieVector3 } =
        aim(side);
      const place: IAutoMovieVector3 = Vector3.add(aimed.point, shift(p.offset));
      // A held prop's working point, from the grip socket in the hand's rest
      // axes, with the direction it faces out of the prop.
      const named: { point: IAutoMovieVector3; direction: IAutoMovieVector3 } | null =
        p.point === undefined || p.held === undefined
          ? null
          : AutoMovieMotionHumanHeld.point(
              AutoMovieMotionHumanHeld.of(context, side, p.held),
              p.point,
            );
      // The hand's turn: as named; else, for a working point, the point
      // facing into the target (against its normal) with the fingers as near
      // upright as that allows, as `HumanHeld` lays a held point on a region;
      // else the hand's surface against the normal, the fingers up.
      const rotation: IAutoMovieQuaternion =
        p.facing !== undefined
          ? HumanHand.facing(side, hold.yaw, p.facing)
          : named !== null
            ? HumanHand.align(
                {
                  normal: named.direction,
                  forward: AutoMovieMotionHumanTouchEffector.axis(
                    side,
                    "fingers",
                  ),
                },
                {
                  normal: Vector3.scale(aimed.normal, -1),
                  forward: { x: 0, y: 1, z: 0 },
                },
              )
            : armPhraseFacing(side, aimed.normal);
      // The working point's lever from the surface, world metres at the
      // hand's asked rotation: both offsets are from the wrist joint in the
      // hand's rest axes, the prop's read from the grip socket it rides.
      const lever: IAutoMovieVector3 =
        named === null
          ? { x: 0, y: 0, z: 0 }
          : Quaternion.rotateVector(
              rotation,
              Vector3.subtract(
                Vector3.add(
                  HumanHand.offset(body, side, "grip").point,
                  named.point,
                ),
                HumanHand.offset(body, side, surface, shape).point,
              ),
            );
      const bend: IAutoMovieVector3 =
        AutoMovieMotionHumanBend.hang(body, hold, side, 0.1);
      const target: (
        point: IAutoMovieVector3,
      ) => AutoMovieMotionHumanArmTarget.ITarget = (
        point: IAutoMovieVector3,
      ): AutoMovieMotionHumanArmTarget.ITarget => ({
        surface,
        shape,
        point: Vector3.subtract(point, lever),
        rotation,
        bend: { ...bend },
      });
      const start: IAutoMovieVector3 = AutoMovieMotionHumanArmTarget.point(
        hold,
        origin,
      );
      return {
        side,
        origin,
        place,
        shift,
        target,
        distance: Vector3.length(
          Vector3.subtract(Vector3.subtract(place, lever), start),
        ),
      };
    });

    // The phases: travels of the farthest arm's distance to its place, a
    // beat-long stroke or hold, scaled by the manner's tempo, one clock for
    // both arms so two hands meet together.
    const travel: number = AutoMovieMotionHumanTiming.transport(
      Math.max(...arms.map((a: IArm): number => a.distance)),
    );
    const beat: number = AutoMovieMotionHumanTiming.seconds("beat");
    const cycles: number = p.cycles ?? 2;
    const path: number =
      p.phrase === "stroke" && p.from !== undefined
        ? Vector3.length(arms[0]!.shift(p.from))
        : 0;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.phrase({
      prepare: mods.tempo * travel,
      attack:
        p.phrase === "oscillate"
          ? mods.tempo * cycles * beat
          : p.phrase === "stroke"
            ? mods.tempo * AutoMovieMotionHumanTiming.transport(path)
            : 0,
      hold:
        p.phrase === "visit"
          ? mods.tempo * AutoMovieMotionHumanTiming.seconds(p.hold ?? "beat")
          : 0,
      retract: mods.tempo * travel,
    });
    const primitives: IAutoMovieMotionHumanPrimitive[] = arms.map(
      (a: IArm): IAutoMovieMotionHumanPrimitive => {
        const from: IAutoMovieVector3 = Vector3.add(a.place, a.shift(p.from));
        const sweep: IAutoMovieVector3 =
          a.shift(p.swing ?? { out: SWING, up: 0, forward: 0 });
        const phrase: AutoMovieMotionHumanArmPhrase.IPhrase = {
          body,
          clock,
          side: a.side,
          origin: a.origin,
          manner: mods,
        };
        const primitive: IAutoMovieMotionHumanPrimitive = p.phrase === "visit"
          ? AutoMovieMotionHumanArmPhrase.visit({
              ...phrase,
              target: () => a.target(a.place),
            })
          : p.phrase === "stroke"
            ? AutoMovieMotionHumanArmPhrase.stroke({
                ...phrase,
                path: (
                  _posture: IHumanPosture,
                  _seconds: number,
                  progress: number,
                ) =>
                  a.target(
                    Vector3.lerp(
                      from,
                      a.place,
                      progress,
                    ),
                  ),
              })
            : AutoMovieMotionHumanArmPhrase.oscillate({
                ...phrase,
                cycles,
                pose: (_posture: IHumanPosture, _seconds: number, swing: number) =>
                  a.target(
                    Vector3.add(
                      a.place,
                      Vector3.scale(
                        sweep,
                        swing,
                      ),
                    ),
                  ),
              });

        // Targets are fixed above; the move reads root and preserves its
        // own arm joints and digit goals, so no other channel is an input.
        return {
          ...primitive,
          reads: ["root", `${a.side}Arm`, `${a.side}Hand`],
        };
      },
    );
    const side: HumanHand.Side = sides[0]!;
    const composed: IHumanActionPlan = composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives,
      contact: "stroke",
    });
    if (p.held === undefined) return composed;

    // A held prop: the hand's grip on it over the whole phrase takes the
    // hand over without letting the prop go, and the hold carries it on.
    const grip: IHumanContactWindow = {
      part: side === "left" ? "leftHand" : "rightHand",
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: p.held },
    };
    return {
      ...composed,
      contacts: [...composed.contacts, grip],
      holds: [...(composed.holds ?? []), { side, prop: p.held, from: 1 }],
    };
  }
}

/** One arm's geometry in a phrase: its origin, its place, its offset in the performer's frame and its target at a point. */
interface IArm {
  /** The arm. */
  side: HumanHand.Side;

  /** The hand's place before and after. */
  origin: AutoMovieMotionHumanArmTarget.IOrigin;

  /** The working point's place (the surface's, or a held prop's point), world metres. */
  place: IAutoMovieVector3;

  /** An offset by shares of the arm's length, out mirrored by the arm. */
  shift: (o: armPhrase.IOffset | undefined) => IAutoMovieVector3;

  /** The target that brings the working point to a point. */
  target: (point: IAutoMovieVector3) => AutoMovieMotionHumanArmTarget.ITarget;

  /** The distance from the surface's place before to its place at the target, metres. */
  distance: number;
}

/** An oscillation's swing when none is given, a share of the arm's length to each side (provisional: a wave's sweep, read from no measured source). */
const SWING: number = 0.1;

