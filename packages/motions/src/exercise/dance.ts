import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionName,
  IAutoMovieMotionClock,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanDance,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../compose/AutoMovieMotionClock";
import { AutoMovieMotionHumanBase } from "../compose/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanInterrupt } from "../compose/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanLean } from "../compose/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanLeg } from "../compose/AutoMovieMotionHumanLeg";
import { AutoMovieMotionManner } from "../compose/AutoMovieMotionManner";
import { composeAutoMovieMotionHumanAction } from "../compose/composeAutoMovieMotionHumanAction";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareDanceBeats } from "./prepareDanceBeats";
import { prepareDanceSteps } from "./prepareDanceSteps";
import { prepareWaltzBox } from "./prepareWaltzBox";

/**
 * A solo dance step locked to a declared beat: the bounce, the side-to-side
 * sway, the step-touch and the box step.
 *
 * The beat comes from the author's tempo, never from audio: beat `k` falls at
 * `k 60 / bpm` seconds, 120 bpm when absent (people resonate near 120 bpm, van
 * Noorden and Moelants 1999; the spontaneous locomotor tempo is near 2 Hz,
 * MacDougall and Moore 2005). Each beat is an event `beat{k}`. Locked to a cue
 * track (`lock`), the beats are the track's instants instead: the first on the
 * track's first beat at or after the start, the rest at the mean interval of
 * the track's beats, so footfalls land on a score's beats whatever its tempo (a
 * tempo that drifts within the step is followed at its mean, a first pass).
 *
 * - Bounce: the knees give on every beat, the hips lowest on the beat by 1 % of
 *   the stature (provisional; vertical bounce follows the rhythm, Burger et al.
 *   2013), the feet planted.
 * - Sway: the hips travel side to side over two beats, at each side on a beat, by
 *   half the feet's spacing, the feet planted. They leave the middle for the
 *   first side through the first beat and return to it after the last, and ride
 *   the arc that keeps both legs at their standing length.
 * - Step-touch: on odd beats one foot steps a shoulder width to its side, on even
 *   beats the other closes beside it; the direction turns every two beats. Each
 *   foot travels over the half beat before its footfall, so the footfall lands
 *   on the beat; the hips follow the feet's mean and sink until each leg
 *   reaches its foot, the travelling one too.
 * - Box step: six footfalls that trace a square and return, one a beat: the first
 *   foot forward, the other to its own side level with it, the first closed
 *   beside it; then the other foot back, the first to its own side level with
 *   it, the other closed. The square's side is a shoulder width (provisional);
 *   the feet and the hips move as in the step-touch.
 *
 * With `waltz`, the box adds a three-beat lowering and rise and can rotate
 * around an authored floor pivot. A second dancer can share the pivot and cue
 * track and start back on beat one. Held partner contacts are separate.
 */
export namespace dance {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "dance";

  /** Cancel table: any beat ends a step. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["anytime", "smooth"],
      dance: ["anytime", "smooth"],
      walk: ["anytime", "smooth"],
    });

  /** The default tempo, beats per minute. */
  export const BPM: number = 120;

  /** The bounce's depth, a share of the stature (provisional). */
  export const BOUNCE: number = 0.01;

  /**
   * Plan a dance step.
   *
   * @param context The action's context.
   * @returns The plan.
   * @throws {HumanRefusal} When the tempo is not positive or the beat count is
   *   not a positive whole number.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanDance.IParams = context.params;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      body.measure;
    const bpm: number = p.bpm ?? BPM;
    const beats: number = p.count ?? 8;
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      p.manner,
    );
    // The beats: the locked track's instants from the start, at their mean
    // interval (each its own under a waltz), or the tempo's.
    const clocked: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
      context,
      bpm,
      beats,
      p.lock,
      p.waltz !== undefined,
    );
    const period: number = clocked.period;
    const lead: number = clocked.lead;
    const beatAt: (k: number) => number = clocked.at;
    const instants: IAutoMovieMotionClockInstant[] = [];
    for (let k: number = 1; k <= beats; k++)
      instants.push({ name: `beat${k}`, seconds: beatAt(k) });
    const duration: number = beatAt(beats) + period;
    const clock: IAutoMovieMotionClock = AutoMovieMotionClock(duration, [
      ...instants,
      { name: "relax", seconds: beatAt(beats) },
    ]);
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    if (p.waltz !== undefined && p.kind !== "boxStep")
      throw new HumanRefusal({
        kind: "parameter",
        axis: "waltz",
        value: p.kind,
        reason: "waltz timing describes the box step",
        fix: "use the boxStep dance kind",
      });
    const waltz: ReturnType<typeof prepareWaltzBox> | undefined =
      p.waltz === undefined
        ? undefined
        : prepareWaltzBox(
            p.waltz,
            entry.root,
            m.stature,
            period,
            lead,
            beatAt(beats),
            duration,
          );
    const leftward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 1, y: 0, z: 0 },
    );
    const forward: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const stance: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: {
        ankle: context.entry.feet.left.ankle,
        rotation: context.entry.feet.left.rotation,
      },
      right: {
        ankle: context.entry.feet.right.ankle,
        rotation: context.entry.feet.right.rotation,
      },
    };
    const root: (
      offset: (seconds: number) => IAutoMovieVector3,
    ) => IAutoMovieMotionHumanPrimitive = (
      offset: (seconds: number) => IAutoMovieVector3,
    ): IAutoMovieMotionHumanPrimitive => ({
      channels: ["root"],
      reads: ["root"],
      from: 0,
      to: duration,
      write: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => ({
        ...posture,
        root: Vector3.add(posture.root, offset(seconds)),
      }),
    });
    const primitives: IAutoMovieMotionHumanPrimitive[] = [];
    let contacts: IAutoMovieMotionHumanContactWindow[] =
      AutoMovieMotionHumanBase.plants();

    switch (p.kind) {
      case "bounce": {
        const depth: number = BOUNCE * m.stature * modifiers.extent;
        // Rises by the first beat and falls after the last, as before.
        const settle: (seconds: number) => number =
          AutoMovieMotionClock.prepareEnvelope(
            clock,
            ["start", "beat1"],
            ["relax", "end"],
          );
        primitives.push(
          root(
            (s: number): IAutoMovieVector3 => ({
              x: 0,
              y:
                -depth *
                settle(s) *
                (0.5 + 0.5 * Math.cos((2 * Math.PI * (s - lead)) / period)),
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
        const ease: (u: number) => number = (u: number): number =>
          u * u * (3 - 2 * u);
        const side: (s: number) => number = (s: number): number =>
          s <= lead
            ? lead > 0
              ? ease(s / lead)
              : 1
            : s >= beatAt(beats)
              ? Math.cos(Math.PI * (beats - 1)) *
                (1 - ease(Math.min(1, (s - beatAt(beats)) / period)))
              : Math.cos((Math.PI * (s - lead)) / period);
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
        const { paths, courses }: ReturnType<typeof prepareDanceSteps> =
          prepareDanceSteps({
            kind: p.kind,
            side: p.side,
            reverse: p.waltz?.reverse === true,
            beats,
            beatAt,
            period,
            distance: 2 * m.shoulderHalfWidth * modifiers.extent,
            clearance: 0.04 * m.stature,
            stance,
            leftward,
            forward,
            rotate: waltz?.rotate,
          });
        const placed: (
          foot: AutoMovieHumanSide,
          s: number,
        ) => IAutoMovieMotionHumanFoot.IPlacement = (
          foot: AutoMovieHumanSide,
          s: number,
        ): IAutoMovieMotionHumanFoot.IPlacement => courses[foot].placed(s);
        const planted: (foot: AutoMovieHumanSide, s: number) => boolean = (
          foot: AutoMovieHumanSide,
          s: number,
        ): boolean => courses[foot].planted(s);
        // The hips follow the feet's mean and sink until each leg reaches
        // its foot, the travelling one too: feet a shoulder width further
        // apart lie beyond the legs' standing length, and hips that waited
        // for the footfall to sink would drop at it and leave the arriving
        // foot short of its place until then.
        const sway: IAutoMovieMotionHumanPrimitive =
          AutoMovieMotionHumanLean.sway({
            body,
            from: 0,
            to: duration,
            angles: (): IAutoMovieMotionHumanLean.IAngles => ({
              pitch: 0,
              roll: 0,
            }),
            shift: (s: number): IAutoMovieVector3 => {
              if (waltz !== undefined) {
                const moved: IAutoMovieVector3 = Vector3.subtract(
                  Vector3.lerp(
                    placed("left", s).ankle,
                    placed("right", s).ankle,
                    0.5,
                  ),
                  Vector3.lerp(stance.left.ankle, stance.right.ankle, 0.5),
                );
                return {
                  x: Vector3.dot(moved, leftward),
                  y: 0,
                  z: Vector3.dot(moved, forward),
                };
              }
              const left: ReturnType<typeof courses.left.along> =
                courses.left.along(s);
              const right: ReturnType<typeof courses.right.along> =
                courses.right.along(s);
              return {
                x: (left.x + right.x) / 2,
                y: 0,
                z: (left.z + right.z) / 2,
              };
            },
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
          });
        primitives.push(
          waltz === undefined
            ? sway
            : {
                ...sway,
                write: (
                  posture,
                  s,
                  before,
                  resolution,
                  projection,
                ): IAutoMovieMotionHumanPosture => {
                  const moved: IAutoMovieMotionHumanPosture = sway.write(
                    posture,
                    s,
                    before,
                    resolution,
                    projection,
                  );
                  const turned: IAutoMovieMotionHumanPosture = {
                    ...moved,
                    yaw: moved.yaw + waltz.yaw(s),
                    root: { ...moved.root, y: moved.root.y - waltz.depth(s) },
                  };
                  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
                    ...turned.limbs,
                    leftLeg: AutoMovieMotionHumanLeg.goal(
                      body,
                      turned,
                      "left",
                      placed("left", s),
                      true,
                    ),
                    rightLeg: AutoMovieMotionHumanLeg.goal(
                      body,
                      turned,
                      "right",
                      placed("right", s),
                      true,
                    ),
                  };
                  return {
                    ...turned,
                    root: lowerHumanPosture(
                      body,
                      { ...turned, limbs },
                      undefined,
                      resolution,
                    ).root,
                  };
                },
              },
        );
        for (const foot of ["left", "right"] as const)
          primitives.push(
            AutoMovieMotionHumanLeg.place({
              body,
              side: foot,
              from: 0,
              to: duration,
              placement: (
                _: IAutoMovieMotionHumanPosture,
                s: number,
              ): IAutoMovieMotionHumanFoot.IPlacement => placed(foot, s),
              planted: (s: number): boolean => planted(foot, s),
            }),
          );

        // Each foot bears between its travels, the half beat before each of
        // its footfalls.
        contacts = [];
        for (const foot of ["left", "right"] as const) {
          let from: number = 0;
          for (const fall of [
            ...paths[foot],
            { beat: duration + period / 2 },
          ]) {
            const lifts: number = Math.max(from, fall.beat - period / 2);
            if (lifts > from)
              contacts.push({
                part: `${foot}Foot`,
                kind: "plant",
                from: from / duration,
                to: Math.min(duration, lifts) / duration,
                support: { kind: "ground" },
              });
            from = fall.beat;
          }
        }
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
