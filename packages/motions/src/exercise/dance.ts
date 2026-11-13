import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import type { tags } from "typia";

import type { HumanActionName } from "../HumanActionName";
import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import type { IAutoMovieMotionHumanPrimitive } from "../compose/IAutoMovieMotionHumanPrimitive";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanBound } from "../law/HumanBound";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanActionLaw } from "../law/IHumanActionLaw";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import type { IHumanContactWindow } from "../law/IHumanContactWindow";
import type { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * A solo dance step locked to a declared beat (#3253, M23): the bounce, the
 * side-to-side sway, the step-touch and the box step.
 *
 * The beat comes from the author's tempo, never from audio: beat `k` falls
 * at `k 60 / bpm` seconds, 120 bpm when absent (people resonate near 120
 * bpm, van Noorden and Moelants 1999; the spontaneous locomotor tempo is
 * near 2 Hz, MacDougall and Moore 2005). Each beat is an event `beat{k}`.
 *
 * - Bounce: the knees give on every beat, the hips lowest on the beat by 1
 *   % of the stature (provisional; vertical bounce follows the rhythm,
 *   Burger et al. 2013), the feet planted.
 * - Sway: the hips travel side to side over two beats, at each side on a
 *   beat, by half the feet's spacing, the feet planted. They leave the
 *   middle for the first side through the first beat and return to it
 *   after the last, and ride the arc that keeps both legs at their standing
 *   length.
 * - Step-touch: on odd beats one foot steps a shoulder width to its side,
 *   on even beats the other closes beside it; the direction turns every two
 *   beats. Each foot travels over the half beat before its footfall, so
 *   the footfall lands on the beat; the hips follow the feet's mean and
 *   sink until each leg reaches its foot, the travelling one too.
 *
 * - Box step: six footfalls that trace a square and return, one a beat:
 *   the first foot forward, the other to its own side level with it, the
 *   first closed beside it; then the other foot back, the first to its own
 *   side level with it, the other closed. The square's side is a shoulder
 *   width (provisional); the feet and the hips move as in the step-touch.
 *
 * First pass: the box step has no rise and fall and no turn, and its three
 * counts are even beats, not a waltz's bar. Not drafted here: turns with
 * spotting; the partner figures are rows of other laws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the beat rule and its sources, each step's geometry and provisional values, and what is not drafted.
 * @evidence contracts/development/design.md#principled-representation A law record whose steps are root and leg rows on a beat clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The name, the cancel table, the kinds, the parameters and the plan.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is authored, the sizes are shares of the body.
 */
export namespace dance {
  /** The action's name. */
  export const name: HumanActionName = "dance";

  /** Cancel table: any beat ends a step. */
  export const interrupts: IHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["anytime", "smooth"],
      dance: ["anytime", "smooth"],
      walk: ["anytime", "smooth"],
    });

  /** The steps. */
  export type Kind = "bounce" | "sway" | "stepTouch" | "boxStep";

  /** A foot's offset from its stance over the floor, metres: `x` to the body's left, `z` forward. */
  interface IOffset {
    /** To the body's left. */
    x: number;

    /** Forward. */
    z: number;
  }

  /** The default tempo, beats per minute. */
  export const BPM: number = 120;

  /** The bounce's depth, a share of the stature (provisional). */
  export const BOUNCE: number = 0.01;

  /**
   * Parameters.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and default.
   * @evidence contracts/development/design.md#principled-representation The step, the tempo and the number of beats.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The values the plan reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The tempo is a number, not audio.
   */
  export interface IParams {
    /** The step. */
    kind: Kind;

    /** Beats per minute; `BPM` when absent. */
    bpm?: number & tags.ExclusiveMinimum<0>;

    /** How many beats; 8 when absent. */
    beats?: number & tags.Type<"uint32"> & tags.Minimum<1>;

    /** The foot that steps first; `right` when absent. */
    side?: "left" | "right";

    /** How it is performed. */
    manner?: AutoMovieMotionManner.IManner;
  }

  /**
   * Plan a dance step.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the tempo is not positive or the beat count is not a positive whole number.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input, the plan and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation A beat clock with one instant per beat; each step's root and foot curves are written against the beats.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Clock, then one branch per step.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The beat is never moved by the manner: the manner scales sizes only.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the beats per written second.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the leg placement and its arc.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan closes over the beat list and the stance.
   */
  export function plan(
    context: IHumanActionContext<IParams>,
  ): IHumanActionPlan {
    const p: IParams = context.params;
    const body = context.body;
    const m = body.measure;
    const bpm: number = p.bpm ?? BPM;
    const beats: number = p.beats ?? 8;
    HumanBound.above("bpm", bpm, 0, "beats per minute");
    HumanBound.whole("beats", beats);
    const modifiers: AutoMovieMotionManner.IModifiers =
      AutoMovieMotionManner.of(context, p.manner);
    const period: number = 60 / bpm;
    const instants: AutoMovieMotionClock.IInstant[] = [];
    for (let k: number = 1; k <= beats; k++)
      instants.push({ name: `beat${k}`, seconds: k * period });
    const duration: number = (beats + 1) * period;
    const clock: AutoMovieMotionClock.IClock = AutoMovieMotionClock.of(
      duration,
      [...instants, { name: "relax", seconds: beats * period }],
    );
    const entry: IHumanPosture = context.entry.posture;
    const leftward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const stance: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    // Rises from 0 at the start to 1 by the first beat and falls after the last.
    const settle = (seconds: number): number =>
      clock.envelope(["start", "beat1"], ["relax", "end"], seconds);
    const root = (
      offset: (seconds: number) => IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive => ({
      channels: ["root"],
      from: 0,
      to: duration,
      write: (posture: IHumanPosture, seconds: number): IHumanPosture => ({
        ...posture,
        root: Vector3.add(posture.root, offset(seconds)),
      }),
    });
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IHumanContactWindow[] = AutoMovieMotionHumanBase.plants();

    switch (p.kind) {
      case "bounce": {
        const depth: number = BOUNCE * m.stature * modifiers.extent;
        primitives.push(
          root(
            (s: number): IAutoMovieVector3 => ({
              x: 0,
              y:
                -depth *
                settle(s) *
                (0.5 + 0.5 * Math.cos((2 * Math.PI * s) / period)),
              z: 0,
            }),
          ),
        );
        break;
      }
      case "sway": {
        const half: number =
          (Vector3.length(
            Vector3.subtract(stance.left.ankle, stance.right.ankle),
          ) /
            2) *
          modifiers.extent;
        const first: number = (p.side ?? "right") === "right" ? -1 : 1;
        // The hips' height over the ankles while standing: each hip joint
        // stands over its ankle, so a sideways travel at this height would
        // stretch both legs past their standing length.
        const height: number =
          m.hipHeight +
          entry.root.y -
          (stance.left.ankle.y + stance.right.ankle.y) / 2;
        const ease = (u: number): number => u * u * (3 - 2 * u);
        const side = (s: number): number =>
          s <= period
            ? ease(s / period)
            : s >= beats * period
              ? Math.cos(Math.PI * (beats - 1)) *
                (1 - ease(Math.min(1, (s - beats * period) / period)))
              : Math.cos((Math.PI * (s - period)) / period);
        primitives.push(
          root((s: number): IAutoMovieVector3 => {
            const x: number = first * half * side(s);
            return Vector3.add(Vector3.scale(leftward, x), {
              x: 0,
              y: Math.sqrt(height * height - x * x) - height,
              z: 0,
            });
          }),
        );
        break;
      }
      case "stepTouch":
      case "boxStep": {
        const d: number = 2 * m.shoulderHalfWidth * modifiers.extent;
        const first: "left" | "right" = p.side ?? "right";
        const second: "left" | "right" = first === "right" ? "left" : "right";
        // Each footfall: the foot, its beat and the offset from its stance
        // it lands at, `x` to the body's left and `z` forward.
        const falls: { foot: "left" | "right"; beat: number; at: IOffset }[] =
          [];
        const offset: Record<"left" | "right", IOffset> = {
          left: { x: 0, z: 0 },
          right: { x: 0, z: 0 },
        };
        // The second foot's own side.
        const out: number = first === "right" ? 1 : -1;
        for (let k: number = 1; k <= beats; k++) {
          let foot: "left" | "right";
          if (p.kind === "stepTouch") {
            const group: number = Math.floor((k - 1) / 2);
            const leader: "left" | "right" = group % 2 === 0 ? first : second;
            foot = k % 2 === 1 ? leader : leader === "left" ? "right" : "left";
            offset[foot] = {
              x: offset[foot].x + (group % 2 === 0 ? -1 : 1) * out * d,
              z: 0,
            };
          } else {
            // The square's corners in the order the feet take them: forward,
            // side, close, back, side, close.
            const count: number = (k - 1) % 6;
            foot = count % 2 === 0 ? first : second;
            offset[foot] = {
              x: count === 1 || count === 2 || count === 3 ? out * d : 0,
              z: count < 3 ? d : 0,
            };
          }
          falls.push({ foot, beat: k * period, at: offset[foot] });
        }
        const lateral = (
          foot: "left" | "right",
          s: number,
        ): { at: IOffset; swing: number; from: IOffset } => {
          let at: IOffset = { x: 0, z: 0 };
          for (const f of falls)
            if (f.foot === foot) {
              const start: number = f.beat - period / 2;
              if (s >= f.beat) at = f.at;
              else if (s > start)
                return {
                  at: f.at,
                  swing: (s - start) / (period / 2),
                  from: at,
                };
            }
          return { at, swing: 1, from: at };
        };
        const placed = (
          foot: "left" | "right",
          s: number,
        ): HumanFoot.IPlacement => {
          const l = lateral(foot, s);
          const shift = (o: IOffset): HumanFoot.IPlacement => ({
            ankle: Vector3.add(
              stance[foot].ankle,
              Vector3.add(
                Vector3.scale(leftward, o.x),
                Vector3.scale(forward, o.z),
              ),
            ),
            rotation: stance[foot].rotation,
          });
          return AutoMovieMotionHumanLeg.arc(
            shift(l.from),
            shift(l.at),
            0.04 * m.stature,
            l.swing,
          );
        };
        const planted = (foot: "left" | "right", s: number): boolean =>
          lateral(foot, s).swing >= 1;
        const along = (foot: "left" | "right", s: number): IOffset => {
          const l = lateral(foot, s);
          return {
            x: l.from.x + (l.at.x - l.from.x) * l.swing,
            z: l.from.z + (l.at.z - l.from.z) * l.swing,
          };
        };
        // The hips follow the feet's mean and sink until each leg reaches
        // its foot, the travelling one too: feet a shoulder width further
        // apart lie beyond the legs' standing length, and hips that waited
        // for the footfall to sink would drop at it and leave the arriving
        // foot short of its place until then.
        primitives.push(
          AutoMovieMotionHumanLean.sway({
            body,
            from: 0,
            to: duration,
            angles: (): AutoMovieMotionHumanLean.IAngles => ({
              pitch: 0,
              roll: 0,
            }),
            shift: (s: number): IAutoMovieVector3 => ({
              x: (along("left", s).x + along("right", s).x) / 2,
              y: 0,
              z: (along("left", s).z + along("right", s).z) / 2,
            }),
            legs: (s: number) => ({
              leftLeg: AutoMovieMotionHumanLeg.goal(
                body,
                entry,
                "left",
                placed("left", s),
                true,
              ),
              rightLeg: AutoMovieMotionHumanLeg.goal(
                body,
                entry,
                "right",
                placed("right", s),
                true,
              ),
            }),
          }),
        );
        for (const foot of ["left", "right"] as const)
          primitives.push(
            AutoMovieMotionHumanLeg.place({
              body,
              side: foot,
              from: 0,
              to: duration,
              placement: (_: IHumanPosture, s: number): HumanFoot.IPlacement =>
                placed(foot, s),
              planted: (s: number): boolean => planted(foot, s),
            }),
          );
        contacts = [];
        break;
      }
    }
    return composeAutoMovieMotionHumanAction({
      base: AutoMovieMotionHumanBase.still(duration, entry, contacts),
      clock,
      primitives,
    });
  }
}
