import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanHand } from "../compose/AutoMovieMotionHumanHand";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../compose/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../compose/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "../compose/AutoMovieMotionHumanTargetGrid";
import { AutoMovieMotionHumanTiming } from "../compose/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A whole-body self action while standing (#3285): the yawn-and-stretch with
 * both arms overhead, both arms raised in victory, a fist pump, a neck roll
 * and a shoulder roll. The body-directed touches of the same family (pats,
 * rubs, scratches, covers, pain holds) are rows of the `touch` law.
 *
 * Each action is a phrase: the parts rise to their place over the free-space
 * transport of the hand's travel (`AutoMovieMotionHumanTiming.transport`), or
 * 0.4 s for the head and the shoulders, perform the stroke, hold and return
 * in the rise's time. The arms are carried in joint space from the entry's
 * angles to a named place of the air (`AutoMovieMotionHumanTargetGrid.place`):
 * overhead above the shoulders for the stretch, overhead and outside them
 * for victory, at eye height a forearm ahead of the shoulder for the fist
 * pump, the forearm rising to it from an elbow near the body; its fist drops
 * a fifth of the arm and rises again `count` times. A neck roll circles the
 * head through a light share of the neck's flexion and lateral range, a
 * shoulder roll circles both shoulder girdles through a light share of
 * theirs. The stretch lasts 6 s in all, the yawn's duration of Provine 1986
 * (unverified); every other time and size is provisional.
 *
 * Events: the phrase instants.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the actions, where each part goes, the timing and its sources and the provisional values.
 * @evidence contracts/development/design.md#principled-representation A law record composed of arm carries to named places and joint circles over a held base.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kind union, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Places are named grid places of the body, sizes are range levels; no metre is typed.
 */
export namespace selfAction {
  /** The action's name. */
  export const name: HumanActionName = "selfAction";

  /** Cancel table. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      touch: ["fromRelax", "smooth"],
      gesture: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
      flinch: ["anytime", "reflex"],
    });

  /** The actions. */
  export type Kind =
    | "stretch"
    | "victory"
    | "fistPump"
    | "neckRoll"
    | "shoulderRoll";

  /** The yawn-and-stretch's whole duration, seconds (Provine 1986, unverified). */
  export const YAWN: number = 6;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The action by name, the hand of a one-arm action and the repetitions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed kind union.
   */
  export interface IParams {
    /** The action. */
    kind: Kind;

    /** The arm of a fist pump; `right` when absent. */
    side?: HumanHand.Side;

    /** Pumps or rolls; 3 for a pump, 2 for a roll when absent. */
    count?: number;

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /** Each arm action's place for the right hand (the left mirrors). */
  const PLACES: Readonly<
    Record<
      "stretch" | "victory" | "fistPump",
      AutoMovieMotionHumanTargetGrid.IGrid
    >
  > = {
    stretch: { height: "overhead", lateral: "shoulder", distance: "close" },
    victory: { height: "overhead", lateral: "outside", distance: "close" },
    fistPump: { height: "eye", lateral: "outside", distance: "mid" },
  };

  /** May be performed over a carrier: it claims only the parts it moves. */
  export const overlay: boolean = true;

  /**
   * Where the pumping arm's elbow hangs, which the fist's forearm rises
   * from: the knuckles face away from it. With the fist a forearm ahead of
   * the shoulder, the whole drop stays within the elbow's flexion range.
   */
  const ELBOW: AutoMovieMotionHumanTargetGrid.IGrid = {
    height: "shoulder",
    lateral: "outside",
    distance: "near",
  };

  /**
   * Plan a self action.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusal; the law's doc gives the places and timing.
   * @evidence contracts/development/implementation.md#principled-implementation Arms carried in joint space (Soechting and Lacquaniti 1981) to named places solved by the arm's inverse kinematics; head and shoulder circles as joint angles on the clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One clock, then the rows of the kind.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Sizes are range levels and named places; times are named provisional or sourced.
   * @evidence contracts/development/implementation.md#efficient-algorithms One posture solve per carried arm per second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the arm carry, the target places, the hand shapes and the joint primitives.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the clock and the entry.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const kind: Kind = p.kind;
    const count: number =
      p.count ?? (kind === "fistPump" ? 3 : kind.endsWith("Roll") ? 2 : 1);
    HumanBound.whole("count", count);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    const rise: number =
      kind === "neckRoll" || kind === "shoulderRoll"
        ? AutoMovieMotionHumanTiming.PAUSES.beat
        : AutoMovieMotionHumanTiming.transport(arm * 1.5);
    const attack: number =
      kind === "stretch"
        ? Math.max(0.5, YAWN - 2 * rise)
        : kind === "victory"
          ? AutoMovieMotionHumanTiming.PAUSES.long
          : count *
            AutoMovieMotionHumanTiming.seconds("beat") *
            (kind === "fistPump" ? 1 : 2.5);
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase({
        prepare: rise,
        attack,
        hold: AutoMovieMotionHumanTiming.PAUSES.brief,
        retract: rise,
      }),
      modifiers,
    );
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];

    const raise = (
      side: HumanHand.Side,
      grid: AutoMovieMotionHumanTargetGrid.IGrid,
      shape: HumanHand.Shape,
      pump: boolean,
    ): void => {
      const surface: HumanHand.Surface = shape === "fist" ? "fist" : "palm";
      primitives.push(
        AutoMovieMotionHumanArm.carried({
          body,
          side,
          from: 0,
          to: clock.duration,
          rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
          weight: (seconds: number): number =>
            clock.envelope(["start", "ready"], ["relax", "end"], seconds),
          goal: (
            posture: IHumanPosture,
            seconds: number,
          ): IHumanPosture.IGoal => {
            const place = AutoMovieMotionHumanTarget.fallback(
              body,
              posture,
              AutoMovieMotionHumanTargetGrid.place(body, side, grid),
            );
            const drop: number = pump
              ? 0.2 *
                arm *
                modifiers.extent *
                Math.sin(
                  Math.PI *
                    count *
                    clock.linear("strokeStart", "strokeEnd", seconds),
                ) **
                  2
              : 0;
            const point: IAutoMovieVector3 = {
              ...place.point,
              y: place.point.y - drop,
            };
            return AutoMovieMotionHumanArm.goal(
              body,
              side,
              AutoMovieMotionHumanTarget.hand(
                body,
                posture,
                side,
                {
                  point,
                  normal: pump
                    ? Vector3.subtract(
                        AutoMovieMotionHumanTarget.fallback(
                          body,
                          posture,
                          AutoMovieMotionHumanTargetGrid.place(
                            body,
                            side,
                            ELBOW,
                          ),
                        ).point,
                        place.point,
                      )
                    : { x: 0, y: -1, z: 0 },
                },
                { surface, shape, bend: "raised" },
              ),
            );
          },
        }),
        AutoMovieMotionHumanHand.form(
          clock,
          side,
          ["start", "ready"],
          ["relax", "end"],
          shape,
        ),
      );
    };
    const circle = (
      angles: (cos: number, sin: number) => AutoMovieMotionHumanJoints.Angles,
    ): IAutoMovieMotionHumanPrimitive => {
      const probe: AutoMovieMotionHumanJoints.Angles = angles(1, 1);
      return AutoMovieMotionHumanJoints.add({
        channels: AutoMovieMotionHumanJoints.channels(probe),
        from: 0,
        to: clock.duration,
        delta: (seconds: number): AutoMovieMotionHumanJoints.Angles => {
          const w: number = clock.envelope(
            ["start", "ready"],
            ["relax", "end"],
            seconds,
          );
          const phase: number =
            2 *
            Math.PI *
            count *
            clock.linear("strokeStart", "strokeEnd", seconds);
          return angles(w * Math.cos(phase), w * Math.sin(phase));
        },
      });
    };

    switch (kind) {
      case "stretch":
      case "victory":
        raise("right", PLACES[kind], "flat", false);
        raise("left", PLACES[kind], "flat", false);
        break;
      case "fistPump":
        raise(p.side ?? "right", PLACES.fistPump, "fist", true);
        break;
      case "neckRoll": {
        const flex: number = AutoMovieMotionHumanRange.degrees(
          "neck",
          "flexion",
          "light",
        );
        const side: number = AutoMovieMotionHumanRange.degrees(
          "neck",
          "abduction",
          "light",
        );
        primitives.push(
          circle((c: number, s: number) => ({
            neck: [flex * c * modifiers.extent, side * s * modifiers.extent, 0],
          })),
        );
        break;
      }
      case "shoulderRoll": {
        const lift = (
          bone: "leftShoulder" | "rightShoulder",
          motion: AutoMovieMotionHumanRange.Motion,
        ): number =>
          AutoMovieMotionHumanRange.degrees(bone, motion, "light") *
          modifiers.extent;
        primitives.push(
          circle((c: number, s: number) => ({
            leftShoulder: [
              lift("leftShoulder", "flexion") * c,
              lift("leftShoulder", "abduction") * s,
              0,
            ],
            rightShoulder: [
              lift("rightShoulder", "flexion") * c,
              lift("rightShoulder", "abduction") * s,
              0,
            ],
          })),
        );
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.under(context, clock.duration),
      clock,
      primitives,
      contact: "stroke",
    });
  }
}
