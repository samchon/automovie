import {
  Quaternion,
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../core";
import type { AutoMovieArchetypeEquineStanceCue } from "./AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/**
 * The stance responses that travel, repeat or brace (`EquineStanceRows`): a
 * spin on the haunches, a run of crow hops and a set back against a rope. A
 * spin turns the whole horse about the middle of its hind hooves in increments,
 * each hoof stepping around in turn after the weight is on the other three, as
 * a step aside steps sideways; a run of crow hops repeats a small buck, each
 * hop leaving the forehand planted and the hindquarters lifted and set down
 * again. Both end where they finish: a spin facing its new heading, crow hops
 * standing as they began.
 */
export namespace EquineStanceMoves {
  /** The most a spin turns per increment, degrees: authored. */
  export const STEP: number = 15;

  /** A stepping hoof's peak lift, metres: authored, the step aside's. */
  export const LIFT: number = 0.08;

  /**
   * The share of a hoof's step spent moving the weight before it lifts:
   * authored, the step aside's.
   */
  export const LOAD: number = 0.35;

  /**
   * A spin on the haunches or on the centre: the horse turns `degrees` about
   * the middle of its hind hooves, or of all four on the centre, in increments
   * of at most `STEP`, each increment stepping the outside fore, the inside
   * fore, the outside hind and the inside hind in turn around the pivot, the
   * trunk turning with them; the exit settles over the new anchors.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The spin.
   * @returns Its plan.
   */
  export function spin<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineStanceCue.ISpin,
  ): EquineStanceRows.IPlan {
    const increments: number = Math.max(
      1,
      Math.ceil(Math.abs(cue.degrees) / STEP),
    );
    const hinds: IAutoMovieVector3 = Vector3.lerp(
      start.anchors.leftHind,
      start.anchors.rightHind,
      0.5,
    );
    const pivot: IAutoMovieVector3 =
      cue.about === "centre"
        ? Vector3.lerp(
            hinds,
            Vector3.lerp(start.anchors.leftFore, start.anchors.rightFore, 0.5),
            0.5,
          )
        : hinds;
    const turned = (k: number): AutoMovieArchetypeFrame.IMotion =>
      AutoMovieArchetypeFrame.turn(
        pivot,
        { x: 0, y: 1, z: 0 },
        (cue.degrees * k) / increments,
      );
    const apply = (
      motion: AutoMovieArchetypeFrame.IMotion,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Vector3.add(
        motion.translation,
        Quaternion.rotateVector(motion.rotation, point),
      );

    // A turn to the left (positive about up) steps the right side first, the outside of the turn.
    const outside: "left" | "right" = cue.degrees > 0 ? "right" : "left";
    const inside: "left" | "right" = outside === "left" ? "right" : "left";
    const order: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
      `${outside}Fore`,
      `${inside}Fore`,
      `${outside}Hind`,
      `${inside}Hind`,
    ];
    const states: EquineStanceRows.IState[] = [start];
    const loads: AutoMovieArchetypeFrame.IMotion[] = [];
    for (let k: number = 0; k < increments; ++k) {
      const goal: AutoMovieArchetypeFrame.IMotion = turned(k + 1);
      for (const [j, limb] of order.entries()) {
        const before: EquineStanceRows.IState = states.at(-1)!;
        const loaded: AutoMovieArchetypeFrame.IMotion =
          EquineStanceSupport.moved(
            before.trunk,
            EquineStanceSupport.transfer(body, before, limb),
          );
        loads.push(loaded);
        states.push({
          trunk: EquineStanceSupport.blend(
            loaded,
            AutoMovieArchetypeFrame.chain(goal, start.trunk),
            (j + 1) / order.length,
          ),
          anchors: {
            ...before.anchors,
            [limb]: apply(goal, start.anchors[limb]),
          },
        });
      }
    }
    const end: EquineStanceRows.IState = {
      trunk: AutoMovieArchetypeFrame.chain(turned(increments), start.trunk),
      anchors: states.at(-1)!.anchors,
    };
    const steps: number = increments * order.length;
    const piece: number = 1 / steps;
    const events: EquineStanceRows.IEvent[] = [];
    for (let s: number = 0; s < steps; ++s) {
      const limb: AutoMovieArchetypeQuadrupedBody.Limb =
        order[s % order.length]!;
      events.push(
        {
          label: `${limb}Off`,
          entry: true,
          time: AutoMovieEngineMotionSampling.minimumJerkTime((s + LOAD) * piece),
        },
        {
          label: `${limb}On`,
          entry: true,
          time: AutoMovieEngineMotionSampling.minimumJerkTime((s + 1) * piece),
        },
      );
    }
    return {
      cue,
      start,
      end,
      keys: Array.from(
        { length: steps },
        (_: unknown, s: number): number => (s + (1 + LOAD) / 2) * piece,
      ).concat([1, 2]),
      events,
      goal: (share: number): EquineBodyPose.IGoal => {
        if (share >= 1)
          return {
            trunk: EquineStanceSupport.blend(
              states.at(-1)!.trunk,
              end.trunk,
              share - 1,
            ),
            limbs: EquineStanceSupport.placed(end.anchors),
          };
        const s: number = Math.min(steps - 1, Math.floor(share / piece));
        const local: number = share / piece - s;
        const before: EquineStanceRows.IState = states[s]!;
        const limb: AutoMovieArchetypeQuadrupedBody.Limb =
          order[s % order.length]!;
        if (local <= LOAD)
          return {
            trunk: EquineStanceSupport.blend(
              before.trunk,
              loads[s]!,
              local / LOAD,
            ),
            limbs: EquineStanceSupport.placed(before.anchors),
          };
        const swing: number = AutoMovieEngineMotionSampling.minimumJerkShare((local - LOAD) / (1 - LOAD));
        const anchor: IAutoMovieVector3 = Vector3.add(
          Vector3.lerp(
            before.anchors[limb],
            states[s + 1]!.anchors[limb],
            swing,
          ),
          { x: 0, y: LIFT * Math.sin(Math.PI * swing), z: 0 },
        );
        return {
          trunk: EquineStanceSupport.blend(
            loads[s]!,
            states[s + 1]!.trunk,
            swing,
          ),
          limbs: {
            ...EquineStanceSupport.placed(before.anchors),
            [limb]: { kind: "placed", anchor, fold: 0 },
          },
        };
      },
    };
  }

  /**
   * A run of crow hops: `count` small bucks of `pitch` one after another over
   * the entry, each lifting the hindquarters off the floor and setting them
   * down again with the forehand planted; the horse stands as it began from the
   * last hop on.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The crow hops.
   * @returns Its plan.
   */
  export function crowHops<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineStanceCue.ICrowHops,
  ): EquineStanceRows.IPlan {
    const hop: EquineStanceRows.IPlan = EquineStanceRows.plan(body, start, {
      ...cue,
      kind: "buck",
    });
    const events: EquineStanceRows.IEvent[] = [];
    // A buck event at entry time t falls where the buck's share is minimum-jerk(t); each hop reaches that share on its way up and again on its way down, rising events on the first and falling ones on the second, and the run's own entry clock is minimum-jerk too.
    for (let k: number = 0; k < cue.count; ++k)
      for (const event of hop.events) {
        const rise: number =
          Math.asin(Math.sqrt(AutoMovieEngineMotionSampling.minimumJerkShare(event.time))) / Math.PI;
        events.push({
          label: event.label,
          entry: true,
          time: AutoMovieEngineMotionSampling.minimumJerkTime(
            (k + (event.entry ? rise : 1 - rise)) / cue.count,
          ),
        });
      }

    // The run ends standing as it began; a state of its own, so the exit settles forward instead of replaying the hops.
    const end: EquineStanceRows.IState = { ...start };
    return {
      cue,
      start,
      end,
      keys: Array.from(
        { length: cue.count },
        (_: unknown, k: number): number => (k + 0.5) / cue.count,
      ).concat([1, 2]),
      events,
      goal: (share: number): EquineBodyPose.IGoal =>
        share >= 1
          ? EquineStanceRows.still(end)
          : hop.goal(Math.sin(Math.PI * share * cue.count) ** 2),
    };
  }

  /**
   * A set back against a rope: the horse sits back on its hocks, the
   * hindquarters lowered by `pitch` about the shoulder joints while all four
   * hooves stay planted, holds, and stands up again as it began.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The set back.
   * @returns Its plan.
   */
  export function setBack<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineStanceCue.ISetBack,
  ): EquineStanceRows.IPlan {
    const shoulders: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(body.chains.leftFore[0]!, body.chains.rightFore[0]!),
      0.5,
    );
    const sat: AutoMovieArchetypeFrame.IMotion = AutoMovieArchetypeFrame.chain(
      EquineBodyPose.turn(
        cue.pitch,
        0,
        EquineBodyPose.point(start.trunk, shoulders),
        { x: 0, y: 0, z: 0 },
        EquineStanceSupport.heading(start.trunk),
      ),
      start.trunk,
    );
    // It stands up as it began: a state of its own, so the exit returns forward over 1 to 2.
    const end: EquineStanceRows.IState = { ...start };
    return {
      cue,
      start,
      end,
      keys: [0.5, 1, 1.5, 2],
      events: [],
      goal: (share: number): EquineBodyPose.IGoal => ({
        trunk: EquineStanceSupport.blend(
          start.trunk,
          sat,
          share <= 1 ? share : 2 - share,
        ),
        limbs: EquineStanceSupport.placed(start.anchors),
      }),
    };
  }
}
