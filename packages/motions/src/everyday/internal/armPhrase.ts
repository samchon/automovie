import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanArmPhrase,
  IAutoMovieMotionHumanArmTarget,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArmPhrase } from "../../compose/internal/AutoMovieMotionHumanArmPhrase";
import { AutoMovieMotionHumanArmReach } from "../../compose/internal/AutoMovieMotionHumanArmReach";
import { AutoMovieMotionHumanArmTarget } from "../../compose/internal/AutoMovieMotionHumanArmTarget";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanHeld } from "../../compose/internal/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionHumanTouchEffector } from "../../compose/internal/AutoMovieMotionHumanTouchEffector";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { handToFaceMirrored } from "../../daily/internal/handToFaceMirrored";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanHand } from "../../posture/internal/HumanHand";
import { HumanHandDirection } from "../../posture/internal/HumanHandDirection";
import { poseBones } from "../../posture/internal/poseBones";
import type { IArmPhraseArm } from "./IArmPhraseArm";
import { armPhraseFacing } from "./armPhraseFacing";

/** The record of `IPlanArmsNamed`'s site. */
type IPlanArmsNamed = {
  point: IAutoMovieVector3;
  direction: IAutoMovieVector3;
};

/** The record of `IPlanArmsAimed`'s site. */
type IPlanArmsAimed = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/** The record of `IPlanAimResult`'s site. */
type IPlanAimResult = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/**
 * One arm phrase on a target: the hand visits a place, strokes along a path or
 * oscillates about a pose, on the standard instants of a phrase (Kendon 1980's
 * preparation, stroke, hold and retraction as BML's `ready`, `strokeStart`,
 * `stroke`, `strokeEnd` and `relax`). It is the law the upper-body lexicon's
 * rows are written over: a wave, a tap, a hand at rest on the hip, a wipe
 * across a table are each this law with its phrase, its target and its hand
 * fixed (`HumanUpperRows`), so they share one plan, one set of refusals and one
 * timing.
 *
 * The phrase moves the hand from where the entry pose holds it (its surface's
 * place in the performer's frame) to the target and back, by the vocabulary's
 * own arm phrases (`AutoMovieMotionHumanArmPhrase`: `visit`, `stroke`,
 * `oscillate`), and the composition keeps every other part as the carrier or
 * the entry state has it (`AutoMovieMotionHumanBase.under`). The target is any
 * `AutoMovieMotionTarget`, read where it is at the phrase's start: a region of
 * one's own body or another's, a prop's point, a point in the performer's
 * frame. An `offset` moves the target's point in the performer's frame (out,
 * up, forward) by shares of the arm's length (upper arm, forearm and hand), so
 * one row fits every body. The hand faces against the target's normal with its
 * fingers up, unless `facing` names it. A phrase that names a `held` prop keeps
 * the hand's grip on it over its whole span and leaves it held, so a hammer, a
 * spoon or a hat moves with the hand; a hand that does not hold it at entry is
 * refused. Such a phrase may name one of the held prop's own points as its
 * working `point` (a cup's lip, a fork's face): that point, not the hand's
 * surface, is brought to the target, the hand's surface placed short of it by
 * the point's lever from the surface in the hand's frame, which the grip keeps
 * fixed, and the hand turned so the point faces into the target, unless
 * `facing` names the turn. Both hands may perform one phrase on one clock (a
 * clap, palms rubbed together), each hand's offset mirrored by its side, so two
 * hands sent to one median target meet there; such a phrase holds no prop.
 *
 * Timing: the preparation is a travel of the distance from the hand to the
 * phrase's first goal (a stroke's start, otherwise the target) and the
 * retraction one of the distance back from its last, the target
 * (`AutoMovieMotionHumanTiming.transport`); a visit's stroke is instant and its
 * hold the named `hold` pause (a beat when absent); a stroke takes one travel
 * of its path's length; an oscillation takes `cycles` beats. The manner's tempo
 * scales every phase and its extent and curvature reach the phrase
 * (`AutoMovieMotionManner`). Events: the phrase's instants.
 */
export namespace armPhrase {
  /** Select the acting hands and admit each requested held prop and site. */
  export function selectHands(
    p: Pick<IAutoMovieMotionHumanArmPhrase.IParams, "hand" | "held" | "point">,
    holds: IAutoMovieMotionHumanEntryState["holds"],
  ): readonly AutoMovieHumanSide[] {
    const sides: readonly AutoMovieHumanSide[] = p.hand === "both" ? ["left", "right"] : [p.hand ?? "right"];
    if (p.held !== undefined && (sides.length !== 1 || holds[sides[0]!] !== p.held))
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
    return sides;
  }
  /** The law's name, as productions register it. */
  export const name: string = "armPhrase";

  /** Cancel table: a phrase may be left for anything once it retracts. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: ["relax", 1], kind: "inertialize", entry: 0 }],
  };

  /** A phrase is performed over a carrier that yields its arm and hand. */
  export const overlay: boolean = true;

  /**
   * Plan the phrase.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When a held prop is named that the hand does not
   *   hold at entry or with both hands, when a working point is named without a
   *   held prop, or when the held prop has no such point.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanArmPhrase.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanArmPhrase.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const sides: readonly AutoMovieHumanSide[] = selectHands(p, context.entry.holds);
    const surface: IAutoMovieMotionHumanHand.Surface = p.surface ?? "palm";
    const shape: IAutoMovieMotionHumanHand.Shape = p.shape ?? "flat";
    const hold: IAutoMovieMotionHumanPosture = context.entry.posture;
    const reach: number =
      body.measure.upperArm + body.measure.forearm + body.measure.hand;
    const mods: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    const bones: ReturnType<typeof poseBones> = poseBones(
      body,
      context.entry.pose,
      undefined,
      new Set(
        sides.flatMap((side: AutoMovieHumanSide): AutoMovieHumanoidBone[] => [
          ...HumanHand.frameBones(body, side, surface),
        ]),
      ),
    );

    // The target where it is at the phrase's start, for one arm: a target
    // written for the right hand reads a self region of a side on the arm's
    // own side.
    const aim = (side: AutoMovieHumanSide): IPlanAimResult =>
      context.aim(
        p.mirror === true && p.target.kind === "self"
          ? { ...p.target, region: handToFaceMirrored(p.target.region, side) }
          : p.target,
        context.start,
      );

    // Each arm's geometry: its hand's place before and after, an offset in
    // the performer's frame by shares of the arm's length (`out` mirrored by
    // the arm, so two hands at one median target meet there), its place and
    // its turn.
    const arms: IArmPhraseArm[] = sides.map(
      (side: AutoMovieHumanSide): IArmPhraseArm => {
        const origin: IAutoMovieMotionHumanArmTarget.IOrigin =
          AutoMovieMotionHumanArmTarget.origin(
            body,
            bones,
            { origin: hold.root, yaw: hold.yaw },
            side,
            surface,
          );
        const direction: ReturnType<typeof HumanHandDirection.prepare> =
          HumanHandDirection.prepare(side);
        const shift: (
          o: IAutoMovieMotionHumanArmPhrase.IOffset | undefined,
        ) => IAutoMovieVector3 = (
          o: IAutoMovieMotionHumanArmPhrase.IOffset | undefined,
        ): IAutoMovieVector3 =>
          o === undefined
            ? { x: 0, y: 0, z: 0 }
            : Vector3.scale(
                Vector3.add(
                  Vector3.add(
                    Vector3.scale(direction(hold.yaw, "out"), o.out),
                    Vector3.scale(direction(hold.yaw, "up"), o.up),
                  ),
                  Vector3.scale(direction(hold.yaw, "forward"), o.forward),
                ),
                reach,
              );
        const aimed: IPlanArmsAimed = aim(side);
        const place: IAutoMovieVector3 = Vector3.add(
          aimed.point,
          shift(p.offset),
        );
        // A held prop's working point, from the grip socket in the hand's rest
        // axes, with the direction it faces out of the prop.
        const named: IPlanArmsNamed | null =
          p.point === undefined || p.held === undefined
            ? null
            : AutoMovieMotionHumanHeld.point(
                AutoMovieMotionHumanHeld(context, side, p.held),
                p.point,
              );
        // The elbow hangs as the entry posture hangs it, the target being read
        // where it is at the phrase's start: one hint for the whole phrase.
        const bend: IAutoMovieVector3 = AutoMovieMotionHumanBend.hang(
          body,
          hold,
          side,
          HANG_OUT,
        );
        const emit: ReturnType<
          typeof AutoMovieMotionHumanArmTarget.prepareTarget
        > = AutoMovieMotionHumanArmTarget.prepareTarget(
          body,
          side,
          surface,
          shape,
        );
        // The working point's offset from the surface in the hand's rest axes:
        // both offsets are from the wrist joint, the prop's read from the grip
        // socket it rides.
        const offset: IAutoMovieVector3 | null =
          named === null
            ? null
            : Vector3.subtract(
                Vector3.add(
                  HumanHand.offset(body, side, "grip").point,
                  named.point,
                ),
                HumanHand.offset(body, side, surface, shape).point,
              );
        // The hand's turn: as named; else, for a working point, the point
        // facing into the target (against its normal) with the fingers as near
        // upright as the arm meets at the place, turned about the normal, which
        // the point's aim leaves free (`AutoMovieMotionHumanArmReach`): a fixed
        // upright turn asked the forearm's twist beyond its range for a utensil
        // at the mouth; else the hand's surface against the normal, the fingers
        // up.
        const rotation: IAutoMovieQuaternion =
          p.facing !== undefined
            ? HumanHand.facing(side, hold.yaw, p.facing)
            : named !== null && offset !== null
              ? ((): IAutoMovieQuaternion => {
                  const aligned: IAutoMovieQuaternion = HumanHand.align(
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
                  );
                  return AutoMovieMotionHumanArmReach.attitude({
                    body,
                    posture: hold,
                    side,
                    bend,
                    requested: aligned,
                    axis: aimed.normal,
                    // The wrist that puts the working point on the place: the
                    // point's grip-socket offset turned with the hand.
                    wrist: (r: IAutoMovieQuaternion): IAutoMovieVector3 =>
                      Vector3.subtract(
                        place,
                        Quaternion.rotateVector(
                          r,
                          Vector3.add(
                            HumanHand.offset(body, side, "grip").point,
                            named.point,
                          ),
                        ),
                      ),
                    name: "point",
                  }).rotation;
                })()
              : armPhraseFacing(side, aimed.normal, hold.yaw);
        // The working point's lever from the surface, world metres at the
        // hand's asked rotation.
        const lever: IAutoMovieVector3 =
          offset === null
            ? { x: 0, y: 0, z: 0 }
            : Quaternion.rotateVector(rotation, offset);
        const target: (
          point: IAutoMovieVector3,
        ) => IAutoMovieMotionHumanArmTarget.ITarget = (
          point: IAutoMovieVector3,
        ): IAutoMovieMotionHumanArmTarget.ITarget =>
          emit({
            point: Vector3.subtract(point, lever),
            rotation,
            bend,
          });
        const start: IAutoMovieVector3 = AutoMovieMotionHumanArmTarget.point(
          hold,
          origin,
        );

        // A stroke begins at its path's start, `from` away from the place it
        // ends on, so its preparation travels there and its retraction from
        // the place; a visit and an oscillation begin and end on the place.
        const from: IAutoMovieVector3 =
          p.phrase === "stroke" ? shift(p.from) : ZERO;
        const swing: IAutoMovieVector3 = shift(
          p.swing ?? { out: SWING, up: 0, forward: 0 },
        );
        return {
          side,
          origin,
          place,
          from,
          swing,
          target,
          prepare: Vector3.distance(
            Vector3.subtract(Vector3.add(place, from), lever),
            start,
          ),
          retract: Vector3.distance(Vector3.subtract(place, lever), start),
        };
      },
    );

    // The phases: travels of the farthest arm's distance to its first goal
    // and back from its last, a beat-long stroke or hold, scaled by the
    // manner's tempo, one clock for both arms so two hands meet together.
    const prepared: number = AutoMovieMotionHumanTiming.transport(
      Math.max(...arms.map((a: IArmPhraseArm): number => a.prepare)),
    );
    const retracted: number = AutoMovieMotionHumanTiming.transport(
      Math.max(...arms.map((a: IArmPhraseArm): number => a.retract)),
    );
    const beat: number = AutoMovieMotionHumanTiming.seconds("beat");
    const cycles: number = p.count ?? 2;
    const path: number = Vector3.length(arms[0]!.from);
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock.phrase({
      prepare: mods.tempo * prepared,
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
      retract: mods.tempo * retracted,
    });
    const primitives: IAutoMovieMotionHumanPrimitive[] = arms.map(
      (a: IArmPhraseArm): IAutoMovieMotionHumanPrimitive => {
        const phrase: IAutoMovieMotionHumanArmPhrase.IPhrase = {
          body,
          clock,
          side: a.side,
          origin: a.origin,
          manner: mods,
        };
        const begin: IAutoMovieVector3 = Vector3.add(a.place, a.from);
        const visited: IAutoMovieMotionHumanArmTarget.ITarget = a.target(
          a.place,
        );
        const primitive: IAutoMovieMotionHumanPrimitive =
          p.phrase === "visit"
            ? AutoMovieMotionHumanArmPhrase.visit({
                ...phrase,
                target: (): IAutoMovieMotionHumanArmTarget.ITarget => visited,
              })
            : p.phrase === "stroke"
              ? AutoMovieMotionHumanArmPhrase.stroke({
                  ...phrase,
                  path: (
                    _posture: IAutoMovieMotionHumanPosture,
                    _seconds: number,
                    progress: number,
                  ): IAutoMovieMotionHumanArmTarget.ITarget =>
                    a.target(Vector3.lerp(begin, a.place, progress)),
                })
              : AutoMovieMotionHumanArmPhrase.oscillate({
                  ...phrase,
                  cycles,
                  pose: (
                    _posture: IAutoMovieMotionHumanPosture,
                    _seconds: number,
                    swing: number,
                  ): IAutoMovieMotionHumanArmTarget.ITarget =>
                    a.target(Vector3.addScaled(a.place, a.swing, swing)),
                });

        // Targets are fixed above; the move reads root and preserves its
        // own arm joints and digit goals, so no other channel is an input.
        return {
          ...primitive,
          reads: ["root", `${a.side}Arm`, `${a.side}Hand`],
        };
      },
    );
    const side: AutoMovieHumanSide = sides[0]!;
    const composed: IAutoMovieMotionHumanActionPlan =
      composeAutoMovieMotionHumanAction({
        base: AutoMovieMotionHumanBase.under(context, clock.duration),
        clock,
        primitives,
        contact: "stroke",
      });
    if (p.held === undefined) return composed;

    // A held prop: the hand's grip on it over the whole phrase takes the
    // hand over without letting the prop go, and the hold carries it on.
    const grip: IAutoMovieMotionHumanContactWindow = {
      part: side === "left" ? "leftHand" : "rightHand",
      kind: "grip",
      from: 0,
      to: 1,
      support: { kind: "prop", subject: p.held },
    };
    return {
      ...composed,
      contacts: [...composed.contacts, grip],
      // The same grip is kept, with the use it was chosen for.
      holds: [
        ...(composed.holds ?? []),
        {
          side,
          prop: p.held,
          from: 1,
          ...(context.entry.uses[side] === undefined
            ? {}
            : { use: context.entry.uses[side] }),
        },
      ],
    };
  }
}

/**
 * An oscillation's swing when none is given, a share of the arm's length to
 * each side (provisional: a wave's sweep, read from no measured source).
 */
const SWING: number = 0.1;

/**
 * The outward share of the upper arm the elbow's hanging hint is widened by
 * (provisional: a tenth, enough to keep the elbow off the flank, read from no
 * measured source).
 */
const HANG_OUT: number = 0.1;

/** No offset. */
const ZERO: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
