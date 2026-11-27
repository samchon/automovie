import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionClock,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanFlinch,
  IAutoMovieMotionHumanJoints,
  IAutoMovieMotionHumanLean,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPrimitive,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanTiming,
  IAutoMovieMotionManner,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionClock } from "../../compose/internal/AutoMovieMotionClock";
import { AutoMovieMotionHumanArm } from "../../compose/internal/AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBase } from "../../compose/internal/AutoMovieMotionHumanBase";
import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { AutoMovieMotionHumanJoints } from "../../compose/internal/AutoMovieMotionHumanJoints";
import { AutoMovieMotionHumanLean } from "../../compose/internal/AutoMovieMotionHumanLean";
import { AutoMovieMotionHumanRange } from "../../compose/internal/AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTiming } from "../../compose/internal/AutoMovieMotionHumanTiming";
import { AutoMovieMotionManner } from "../../compose/internal/AutoMovieMotionManner";
import { AutoMovieMotionPrepared } from "../../compose/internal/AutoMovieMotionPrepared";
import { composeAutoMovieMotionHumanAction } from "../../compose/internal/composeAutoMovieMotionHumanAction";
import { HumanBoneGroups } from "../../posture/internal/HumanBoneGroups";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { StrikingBody } from "../../striking/internal/StrikingBody";
import { StrikingQuality } from "../../striking/internal/StrikingQuality";
import { StrikingTarget } from "../../striking/internal/StrikingTarget";
import { ReactionSource } from "./ReactionSource";

/*
 * A flinch: the protective startle away from a sudden threat or a blow, the
 * head and trunk pulled away from it, the shoulders raised and the hands
 * brought up before the face, then a return to what the body held.
 *
 * The startle pattern (Landis and Hunt 1939, The Startle Pattern; Brown et al.
 * 1991, Brain 114:1891) starts with the eye blink at 30 to 50 ms, the head at
 * about 60 ms and the arms near 100 ms, peaks within about 0.2 s and fades over
 * a few tenths of a second, so the flinch reaches its peak at 0.2 s and returns
 * by 0.6 s. Its size grows with `intensity`: the body above the hips leans
 * lightly away from the threat (a quarter of the reach's lean limit) and the
 * hips shift away by 1.8 % of the stature, so the head moves by the trunk's
 * height above the hips times the lean's sine plus the shift; the neck ducks
 * lightly, the hands close into fists and rise to cover the face (provisional
 * sizes, no located kinematic amplitude). The lean pivots at the hips and the
 * feet stay planted. Every part leaves what the entry held and returns to it,
 * so a flinch out of quiet standing ends in quiet standing. The threat is a
 * target (the incoming weapon's region, a prop, a point), read at the start.
 *
 * The action is rows over the posture it was entered in: one phrase with no
 * preparation, whose attack is the rise and whose retraction the return, and a
 * sway of the root and the trunk, a head, two hand and two arm primitives that
 * all rise to the `stroke` instant and fall to the end on the clock's envelope.
 * A guard or a defence may cancel it from the peak on, a stagger or a knockdown
 * at any time.
 */
export namespace flinch {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionName = "flinch";

  /*
   * Cancel table: a flinch flows into a guard, a defence or a stagger.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      guard: ["fromStroke", "smooth"],
      defend: ["fromStroke", "quick"],
      stagger: ["anytime", "reflex"],
      knockdown: ["anytime", "reflex"],
    });

  /*
   * A reaction interrupts whatever the body was doing, at any instant, as a
   * reflex.
   */
  export const accepts: IAutoMovieMotionHumanActionLaw["accepts"] = {
    any: [AutoMovieMotionHumanInterrupt.row("anytime", "reflex")],
  };
  /*
   * The rise to the startle's peak, a measured reflex time.
   */
  export const RISE: IAutoMovieMotionHumanTiming.Span = {
    seconds: 0.2,
    source: "Brown et al. 1991, Brain 114:1891",
  };

  /*
   * The return from the peak (provisional).
   */
  export const RETURN: IAutoMovieMotionHumanTiming.Span = "beat";

  /*
   * The trunk's lean away from the threat at full intensity (provisional).
   */
  export const LEAN: IAutoMovieMotionHumanRange.Amount = "light";

  /*
   * The root's shift away from the threat at full intensity, as a share of the
   * stature (provisional).
   */
  export const SHIFT: number = 0.018;

  /*
   * The neck's added flexion at full intensity (provisional).
   */
  export const DUCK: IAutoMovieMotionHumanRange.Amount = "light";

  /*
   * A flinch's timetable: no preparation, the rise `RISE` to the `stroke` and
   * the return `RETURN`, the manner's tempo stretching both but never the
   * stroke's start, and no hold.
   * Parameter modifiers: The manner's timing.
   * Returns: The phrase clock.
   */
  export function timetable(
    modifiers: IAutoMovieMotionManner.IModifiers,
  ): IAutoMovieMotionClock {
    return AutoMovieMotionManner.time(
      AutoMovieMotionClock.phrase(
        AutoMovieMotionHumanTiming.phrase({
          prepare: "none",
          attack: RISE,
          retract: RETURN,
        }),
      ),
      modifiers,
      { holds: [], fixed: ["strokeStart"] },
    );
  }
  /*
   * Plan a flinch.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the intensity lies outside (0, 1], or the manner is
   * out of range.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanFlinch.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanFlinch.IParams = context.params;
    const modifiers: IAutoMovieMotionManner.IModifiers = AutoMovieMotionManner(
      context,
      {
        ...(p.intensity === undefined ? {} : { intensity: p.intensity }),
        ...p.manner,
      },
    );
    const intensity: number = modifiers.extent;
    const body: IAutoMovieMotionHumanActionContext["body"] = context.body;
    const m: IAutoMovieMotionHumanActionContext["body"]["measure"] =
      body.measure;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;

    // The startle's rise is a reflex and keeps its time; the return follows
    // the manner's tempo.
    const clock: IAutoMovieMotionClock = timetable(modifiers);

    const duration: number = clock.duration;
    const rise: readonly [string, string] = [
      AutoMovieMotionClock.START,
      "stroke",
    ];
    const fall: readonly [string, string] = ["relax", AutoMovieMotionClock.END];
    const share: (seconds: number) => number = (seconds: number): number =>
      intensity * clock.envelope(rise, fall, seconds);
    const lean: number = AutoMovieMotionHumanRange.lean(LEAN);
    const shift: number = AutoMovieMotionHumanRange.shift(body, SHIFT);
    const duck: number = AutoMovieMotionHumanRange.degrees(
      "neck",
      "flexion",
      DUCK,
    );

    // Away from the threat in the performer's floor frame: `x` left, `z`
    // forward. The threat is read at the look before the start, solved once
    // the performance is placed (`prepare`); a read before reads it there.
    const solved: AutoMovieMotionPrepared.IValue<IAutoMovieVector3> =
      AutoMovieMotionPrepared(
        (): IAutoMovieVector3 =>
          HumanFrame.local(
            { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
            AutoMovieMotionHumanTarget.away(
              ReactionSource.at(
                context,
                p.target,
                context.start - StrikingTarget.LOOK,
                entry,
                AutoMovieMotionHumanTarget.DEFAULTS.ahead,
              ),
              StrikingBody.trunk(
                body,
                entry,
                undefined,
                HumanBoneGroups.HEAD,
              ).get("head")!.worldPosition,
              entry.yaw,
            ),
          ),
      );
    const away: () => IAutoMovieVector3 = (): IAutoMovieVector3 =>
      solved.read();

    // A glove before the face on the trunk the action has placed so far.
    const faceBones: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([body.surfaces.regions.face.bone]);
    const faceAt: ReturnType<typeof StrikingBody.prepareTrunk> =
      StrikingBody.prepareTrunk(body, faceBones);
    const fist: number = StrikingQuality.fist(m.hand);
    const cover: (
      side: AutoMovieHumanSide,
    ) => Parameters<typeof AutoMovieMotionHumanArm.carried>[0]["goal"] =
      (
        side: AutoMovieHumanSide,
      ): Parameters<typeof AutoMovieMotionHumanArm.carried>[0]["goal"] =>
      (
        posture: IAutoMovieMotionHumanPosture,
        _seconds: number,
        resolution?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieHumanLimbGoal => {
        const bones: ReturnType<typeof faceAt> = faceAt(
          posture,
          resolution,
          projection,
        );
        const face: ReturnType<typeof StrikingBody.region> =
          StrikingBody.region(body, bones, "face");
        const out: IAutoMovieVector3 = HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
          { x: side === "left" ? fist : -fist, y: 0, z: 0 },
        );
        const rotation: ReturnType<typeof StrikingBody.fist> =
          StrikingBody.fist(
            body,
            side,
            { x: 0, y: 1, z: 0 },
            Vector3.scale(face.normal, -1),
          );
        const point: IAutoMovieVector3 = Vector3.subtract(
          Vector3.add(
            Vector3.add(
              face.point,
              Vector3.scale(face.normal, m.forearmRadius + fist),
            ),
            out,
          ),
          StrikingBody.socket(
            body,
            side === "left" ? "fistLeft" : "fistRight",
            rotation,
          ),
        );
        return {
          point,

          // The elbow of least strain; where the solver refuses the goal, an
          // elbow straight below the shoulder, the cover's place before it.
          bend: AutoMovieMotionHumanBend.solve({
            body,
            posture,
            side,
            point,
            rotation,
            fallback: { out: 0, up: -1, forward: 0 },
          }),
          rotation,
        };
      };

    // Each arm leaves the angles the entry held and comes back to them.
    const arm: (side: AutoMovieHumanSide) => IAutoMovieMotionHumanPrimitive = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanPrimitive =>
      AutoMovieMotionHumanArm.carried({
        body,
        side,
        from: 0,
        to: duration,
        rest: AutoMovieMotionHumanArm.angles(context.entry.pose, side),
        goal: cover(side),
        weight: share,
      });

    // The neck's duck and the fingers' closing into fists, each over what the
    // entry held: a body entered with closed fists adds nothing to them.
    const startle: IAutoMovieMotionHumanJoints.Angles = {
      neck: [duck * intensity, 0, 0],
    };
    for (const side of ["left", "right"] as const)
      for (const [bone, fist] of Object.entries(StrikingBody.curl(side)) as [
        AutoMovieHumanoidBone,
        readonly [number, number, number],
      ][]) {
        const held: readonly [number, number, number] = entry.joints[bone] ?? [
          0, 0, 0,
        ];
        startle[bone] = [
          (fist[0] - held[0]) * intensity,
          (fist[1] - held[1]) * intensity,
          (fist[2] - held[2]) * intensity,
        ];
      }

    return composeAutoMovieMotionHumanAction({
      base: {
        ...AutoMovieMotionHumanBase.still(
          duration,
          entry,
          AutoMovieMotionHumanBase.plants(),
        ),
        prepare: (): void => void solved.prepare(),
      },
      clock,
      primitives: [
        // Leaning away from the hips up, the hips carried away with it: a
        // forward tip when the threat is behind, a back tip when it is
        // ahead, a tip to the side away from it. The feet keep their plants.
        AutoMovieMotionHumanLean.sway({
          body,
          from: 0,
          to: duration,
          angles: (seconds: number): IAutoMovieMotionHumanLean.IAngles => ({
            pitch: lean * share(seconds) * away().z,
            roll: -lean * share(seconds) * away().x,
          }),
          shift: (seconds: number): IAutoMovieVector3 =>
            Vector3.scale(away(), shift * share(seconds)),
        }),
        AutoMovieMotionHumanJoints.pulse(clock, rise, fall, startle),
        arm("left"),
        arm("right"),
      ],
    });
  }
}
