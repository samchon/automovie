import {
  Vector3,
  AutoMovieEngineMotionSampling,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieArchetypeFrame, AutoMovieArchetypeRefusal } from "../../core";
import { AutoMovieArchetypeEquineHobble } from "../AutoMovieArchetypeEquineHobble";
import type { AutoMovieArchetypeEquineStanceCue } from "../AutoMovieArchetypeEquineStanceCue";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { EquineBodyPose } from "./EquineBodyPose";
import type { EquineHobbleCue } from "./EquineHobbleCue";
import type { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/**
 * The trunk's nose-up pitch about the hind hooves at the top of a hop, degrees:
 * authored, enough to unload the forehand.
 */
const PITCH: number = 6;

/** A hopping or stepping hoof's peak lift, metres: authored, the stance's step. */
const LIFT: number = 0.08;

/**
 * The share of a hind's step spent moving the weight before it lifts: authored,
 * the stance's step.
 */
const LOAD: number = 0.35;

/** The pieces of one hop: the fores together, then each hind. */
const PIECES: number = 3;

/** The hinds in the order they step up. */
const HINDS: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
  "leftHind",
  "rightHind",
];

/**
 * The hobbled equid's hops (`EquineHobbleCue.IHops`): in each hop the trunk
 * pitches nose-up about the hind hooves to unload the forehand and carries both
 * fores forward together on one path that rises with the pitched shoulders and
 * lifts over that, then each hind in turn takes the weight off itself and steps
 * up the same length, so the fores keep the separation they started with and
 * the strap is never drawn tighter.
 */
export namespace EquineHobbleRows {
  /**
   * Whether a stance cue is a hobbled hop.
   *
   * @param cue The cue.
   * @returns Whether it is.
   */
  export function owns(
    cue: AutoMovieArchetypeEquineStanceCue.Cue,
  ): cue is EquineHobbleCue.Row {
    return cue.kind === "hops";
  }

  /**
   * Plan the hops from a state.
   *
   * @param body The prepared solver.
   * @param start The state it starts from.
   * @param cue The hops.
   * @returns Its plan.
   * @throws {AutoMovieArchetypeRefusal} For a count that is not whole and
   *   positive, a nonpositive length or strap, or fores already standing wider
   *   than the strap.
   */
  export function plan<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: EquineHobbleCue.IHops,
  ): EquineStanceRows.IPlan {
    // Where the cuffs close: `AutoMovieArchetypeEquineHobble.ABOVE` up each fore cannon from its fetlock, as the pose places it.
    const apart = (goal: EquineBodyPose.IGoal): number => {
      const cuff = (
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
      ): IAutoMovieVector3 => {
        const chain: readonly IAutoMovieVector3[] = body.chain(
          limb,
          goal.trunk,
          goal.limbs[limb],
        );
        return Vector3.addScaled(
          chain[3]!,
          Vector3.normalize(Vector3.subtract(chain[2]!, chain[3]!)),
          AutoMovieArchetypeEquineHobble.ABOVE,
        );
      };
      return Vector3.distance(cuff("leftFore"), cuff("rightFore"));
    };
    if (!(cue.count >= 1) || !(cue.length > 0 && cue.strap > 0))
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: "horse",
        axis: "hops",
        value: cue.count,
        feasible: null,
        reason:
          "hops are a whole number from one of a positive length in a strap of positive length",
        fix: "Give whole positive hops of a positive length and a positive strap.",
      });
    const forward: IAutoMovieVector3 = EquineStanceSupport.along(start.trunk, {
      x: 0,
      y: 0,
      z: cue.length,
    });
    const shifted = (
      anchor: IAutoMovieVector3,
      hops: number,
    ): IAutoMovieVector3 => Vector3.addScaled(anchor, forward, hops);
    const carried = (
      trunk: AutoMovieArchetypeFrame.IMotion,
      share: number,
    ): AutoMovieArchetypeFrame.IMotion =>
      EquineStanceSupport.moved(trunk, Vector3.scale(forward, share));

    // Each hop's states: after the fores, after the left hind, after the right hind; and each hind's loaded trunk.
    const states: EquineStanceRows.IState[] = [start];
    const loads: AutoMovieArchetypeFrame.IMotion[] = [];
    for (let k: number = 0; k < cue.count; ++k) {
      const before: EquineStanceRows.IState = states.at(-1)!;
      const fores: EquineStanceRows.IState = {
        trunk: carried(before.trunk, 0.5),
        anchors: {
          ...before.anchors,
          leftFore: shifted(start.anchors.leftFore, k + 1),
          rightFore: shifted(start.anchors.rightFore, k + 1),
        },
      };
      states.push(fores);
      for (const [j, limb] of HINDS.entries()) {
        const from: EquineStanceRows.IState = states.at(-1)!;
        loads.push(
          EquineStanceSupport.moved(
            from.trunk,
            EquineStanceSupport.transfer(body, from, limb),
          ),
        );
        states.push({
          trunk: carried(fores.trunk, (j + 1) / 4),
          anchors: {
            ...from.anchors,
            [limb]: shifted(start.anchors[limb], k + 1),
          },
        });
      }
    }
    const end: EquineStanceRows.IState = states.at(-1)!;
    const steps: number = cue.count * PIECES;
    const piece: number = 1 / steps;
    const events: EquineStanceRows.IEvent[] = [];
    for (let s: number = 0; s < steps; ++s) {
      const limbs: readonly AutoMovieArchetypeQuadrupedBody.Limb[] =
        s % PIECES === 0
          ? ["leftFore", "rightFore"]
          : [s % PIECES === 1 ? "leftHind" : "rightHind"];
      const off: number = s % PIECES === 0 ? s * piece : (s + LOAD) * piece;
      for (const limb of limbs)
        events.push(
          { label: `${limb}Off`, entry: true, time: AutoMovieEngineMotionSampling.minimumJerkTime(off) },
          {
            label: `${limb}On`,
            entry: true,
            time: AutoMovieEngineMotionSampling.minimumJerkTime((s + 1) * piece),
          },
        );
    }
    const plan: EquineStanceRows.IPlan = {
      cue,
      start,
      end,
      keys: Array.from(
        { length: steps },
        (_: unknown, s: number): number => (s + 0.5) * piece,
      ).concat([1]),
      events,
      goal: (share: number): EquineBodyPose.IGoal => {
        if (share >= 1)
          return {
            trunk: end.trunk,
            limbs: EquineStanceSupport.placed(end.anchors),
          };
        const s: number = Math.min(steps - 1, Math.floor(share / piece));
        const local: number = share / piece - s;
        const before: EquineStanceRows.IState = states[s]!;
        const after: EquineStanceRows.IState = states[s + 1]!;
        if (s % PIECES === 0) {
          // The fores together, the trunk pitched about the hind hooves' middle at the hop's top.
          const pivot: IAutoMovieVector3 = Vector3.lerp(
            before.anchors.leftHind,
            before.anchors.rightHind,
            0.5,
          );
          const trunk: AutoMovieArchetypeFrame.IMotion =
            EquineStanceSupport.blend(before.trunk, after.trunk, local);
          const pitch: number = PITCH * Math.sin(Math.PI * local);
          // The fores rise with the pitched shoulders, and their own lift over that.
          const reach: number = Vector3.distance(
            { ...pivot, y: 0 },
            {
              ...Vector3.lerp(
                before.anchors.leftFore,
                before.anchors.rightFore,
                0.5,
              ),
              y: 0,
            },
          );
          const rise: number =
            reach * Math.sin((pitch * Math.PI) / 180) +
            LIFT * Math.sin(Math.PI * local);
          const hop = (
            limb: AutoMovieArchetypeQuadrupedBody.Limb,
          ): EquineBodyPose.IPlaced => ({
            kind: "placed",
            anchor: Vector3.add(
              Vector3.lerp(before.anchors[limb], after.anchors[limb], local),
              { x: 0, y: rise, z: 0 },
            ),
            fold: 0,
          });
          return {
            trunk: AutoMovieArchetypeFrame.chain(
              EquineBodyPose.turn(
                pitch,
                0,
                pivot,
                { x: 0, y: 0, z: 0 },
                EquineStanceSupport.heading(start.trunk),
              ),
              trunk,
            ),
            limbs: {
              ...EquineStanceSupport.placed(before.anchors),
              leftFore: hop("leftFore"),
              rightFore: hop("rightFore"),
            },
          };
        }
        const limb: AutoMovieArchetypeQuadrupedBody.Limb =
          s % PIECES === 1 ? "leftHind" : "rightHind";
        const load: AutoMovieArchetypeFrame.IMotion =
          loads[2 * Math.floor(s / PIECES) + (s % PIECES) - 1]!;
        if (local <= LOAD)
          return {
            trunk: EquineStanceSupport.blend(before.trunk, load, local / LOAD),
            limbs: EquineStanceSupport.placed(before.anchors),
          };
        const swing: number = (local - LOAD) / (1 - LOAD);
        return {
          trunk: EquineStanceSupport.blend(load, after.trunk, swing),
          limbs: {
            ...EquineStanceSupport.placed(before.anchors),
            [limb]: arc(before, after, limb, swing),
          },
        };
      },
    };
    return admit(plan, cue.strap, apart);
  }

  /**
   * Refuse a plan whose fores stand wider at the cuffs than the strap at the
   * start or any key.
   */
  function admit(
    plan: EquineStanceRows.IPlan,
    strap: number,
    apart: (goal: EquineBodyPose.IGoal) => number,
  ): EquineStanceRows.IPlan {
    for (const share of [0, ...plan.keys]) {
      const wide: number = apart(plan.goal(share));
      if (!(wide <= strap))
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: "horse",
          axis: "strap",
          value: strap,
          feasible: {
            kind: "range",
            minimum: wide,
            maximum: Infinity,
            unit: "m",
          },
          reason: `the fores stand ${wide} m apart at the cuffs at share ${share} of the hops, wider than the ${strap} m strap`,
          fix: "Hobble with a strap at least as long as the forelegs stand apart at the cuffs.",
        });
    }
    return plan;
  }

  /** A hoof on its lifted path between two states, at a share. */
  function arc(
    before: EquineStanceRows.IState,
    after: EquineStanceRows.IState,
    limb: AutoMovieArchetypeQuadrupedBody.Limb,
    share: number,
  ): EquineBodyPose.IPlaced {
    return {
      kind: "placed",
      anchor: EquineStanceSupport.arc(
        before.anchors[limb],
        after.anchors[limb],
        share,
        LIFT,
      ),
      fold: 0,
    };
  }
}
