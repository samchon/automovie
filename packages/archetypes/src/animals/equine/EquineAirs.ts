import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeEquineStanceCue } from "../AutoMovieArchetypeEquineStanceCue";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { EquineBodyPose } from "./EquineBodyPose";
import type { EquineStanceRows } from "./EquineStanceRows";
import { EquineStanceSupport } from "./EquineStanceSupport";

/*
 * The school airs above the ground, as stance rows: the held pesade and levade,
 * the courbette's hind-leg leaps and the capriole's leap with its hind kick.
 *
 * The pesade and levade are a rear held at their sources' trunk angles: 45
 * degrees and about 30 to 35 degrees with the ground (Airs above the ground,
 * Wikipedia; IFCE Equipedia), the levade taken at 32.5, the middle of its
 * range. The courbette starts as a levade and, through its hold, leaps forward
 * on the hind legs: each leap is a ballistic flight whose height follows from
 * its duration, h = g T² / 8, with the hind limbs tucked and the forelegs kept
 * off the floor; the forehand then comes down where the leaps end. The capriole
 * gathers, then the whole horse flies for its hold, its height again g T² / 8,
 * the forelegs tucked and the hind legs kicking out at the top, and lands on
 * all four where it took off. The Spanish walk is
 * `AutoMovieArchetypeEquineSpanishWalk`'s layer over a walk. Leap travel, the
 * gathering drop and the tucked joint turns are authored.
 */
export namespace EquineAirs {
  /*
   * The trunk pitch a held air takes, degrees: the pesade's 45 and the middle
   * of the levade's 30 to 35 (Airs above the ground, Wikipedia).
   * Parameter air: The air.
   * Returns: Its pitch, degrees.
   */
  export function pitch(air: AutoMovieArchetypeEquineStanceCue.Air): number {
    return air === "pesade" ? 45 : 32.5;
  }

  /*
   * A held air or a courbette, from the rear the stance rows plan at the air's
   * pitch.
   * Parameter body: The prepared solver.
   * Parameter cue: The air or the courbette.
   * Parameter rear: The stance rows' rear planner from the same start.
   * Returns: The air's plan: the rear at its pitch for a held air, the leaps
   * from a levade for a courbette.
   * As `courbette` refuses.
   */
  export function held<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    cue:
      | AutoMovieArchetypeEquineStanceCue.IAir
      | AutoMovieArchetypeEquineStanceCue.ICourbette,
    rear: (
      cue: AutoMovieArchetypeEquineStanceCue.IRear,
    ) => EquineStanceRows.IPlan,
  ): EquineStanceRows.IPlan {
    const levade: EquineStanceRows.IPlan = rear({
      kind: "rear",
      pitch: pitch(cue.kind === "air" ? cue.air : "levade"),
      from: cue.from,
      entry: cue.entry,
      hold: cue.hold,
      exit: cue.exit,
    });
    return cue.kind === "air"
      ? { ...levade, cue }
      : courbette(body, cue, levade);
  }

  /*
   * The courbette, from the levade it starts and ends with.
   * Parameter body: The prepared solver.
   * Parameter cue: The courbette.
   * Parameter levade: The levade planned from the same start over the courbette's
   * phases.
   * Returns: The courbette's plan, ending displaced forward by its leaps.
   * For a leap count that is not a positive whole number.
   */
  export function courbette<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    cue: AutoMovieArchetypeEquineStanceCue.ICourbette,
    levade: EquineStanceRows.IPlan,
  ): EquineStanceRows.IPlan {
    if (!(cue.leaps > 0))
      throw new RangeError(
        "A courbette takes a positive whole number of leaps",
      );
    const forward: IAutoMovieVector3 = EquineStanceSupport.along(
      levade.start.trunk,
      { x: 0, y: 0, z: LEAP },
    );
    const travel: IAutoMovieVector3 = Vector3.scale(forward, cue.leaps);
    const held: EquineBodyPose.IGoal = levade.goal(1);
    const period: number = cue.hold / cue.leaps;
    const apex: number = (GRAVITY * period * period) / 8;
    const hind: readonly AutoMovieArchetypeQuadrupedBody.Limb[] = [
      "leftHind",
      "rightHind",
    ];
    return {
      cue,
      start: levade.start,
      end: shiftState(levade.start, travel),
      keys: levade.keys,
      events: levade.events,
      goal: (share: number): EquineBodyPose.IGoal =>
        share <= 1 ? levade.goal(share) : shift(levade.goal(2 - share), travel),
      hold: (seconds: number): EquineBodyPose.IGoal => {
        const k: number = Math.min(cue.leaps - 1, Math.floor(seconds / period));
        const u: number = Math.min(1, seconds / period - k);
        const base: EquineBodyPose.IGoal = shift(
          held,
          Vector3.scale(forward, k),
        );
        const limbs: Record<
          AutoMovieArchetypeQuadrupedBody.Limb,
          EquineBodyPose.Limb
        > = {
          ...base.limbs,
        };
        for (const limb of hind)
          limbs[limb] = EquineStanceSupport.folded(
            body.chain(limb, base.trunk, base.limbs[limb]),
            TUCK.hind,
            Math.sin(Math.PI * u),
          );
        return {
          trunk: EquineStanceSupport.moved(
            base.trunk,
            Vector3.addScaled(
              { x: 0, y: 4 * apex * u * (1 - u), z: 0 },
              forward,
              u,
            ),
          ),
          limbs,
        };
      },
    };
  }

  /*
   * The capriole from a halt.
   * Parameter body: The prepared solver.
   * Parameter start: The stance it starts from.
   * Parameter cue: The capriole.
   * Returns: Its plan, returning to the start.
   */
  export function capriole<Id extends string, D extends string>(
    body: EquineBodyPose.IPrepared<Id, D>,
    start: EquineStanceRows.IState,
    cue: AutoMovieArchetypeEquineStanceCue.ICapriole,
  ): EquineStanceRows.IPlan {
    const gathered: AutoMovieArchetypeFrame.IMotion = EquineStanceSupport.moved(
      start.trunk,
      { x: 0, y: -GATHER, z: 0 },
    );
    const placed: Record<
      AutoMovieArchetypeQuadrupedBody.Limb,
      EquineBodyPose.Limb
    > = EquineStanceSupport.placed(start.anchors);
    const chains: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    > = {
      leftFore: body.chain("leftFore", gathered, placed.leftFore),
      rightFore: body.chain("rightFore", gathered, placed.rightFore),
      leftHind: body.chain("leftHind", gathered, placed.leftHind),
      rightHind: body.chain("rightHind", gathered, placed.rightHind),
    };
    const apex: number = (GRAVITY * cue.hold * cue.hold) / 8;
    return {
      cue,
      start,
      end: start,
      keys: [1],
      events: [],
      goal: (share: number): EquineBodyPose.IGoal => ({
        trunk: EquineStanceSupport.blend(start.trunk, gathered, share),
        limbs: placed,
      }),
      hold: (seconds: number): EquineBodyPose.IGoal => {
        const u: number = Math.max(0, Math.min(1, seconds / cue.hold));
        const tuck: number = Math.sin(Math.PI * u);
        const limbs: Record<
          AutoMovieArchetypeQuadrupedBody.Limb,
          EquineBodyPose.Limb
        > = {
          leftFore: EquineStanceSupport.folded(
            chains.leftFore,
            TUCK.fore,
            tuck,
          ),
          rightFore: EquineStanceSupport.folded(
            chains.rightFore,
            TUCK.fore,
            tuck,
          ),
          leftHind: EquineStanceSupport.folded(
            chains.leftHind,
            TUCK.kick,
            tuck * tuck,
          ),
          rightHind: EquineStanceSupport.folded(
            chains.rightHind,
            TUCK.kick,
            tuck * tuck,
          ),
        };
        return {
          trunk: EquineStanceSupport.moved(gathered, {
            x: 0,
            y: 4 * apex * u * (1 - u),
            z: 0,
          }),
          limbs,
        };
      },
    };
  }

  /*
   * A pose moved by a level translation: the trunk shifted and each placed
   * anchor with it.
   */
  function shift(
    goal: EquineBodyPose.IGoal,
    by: IAutoMovieVector3,
  ): EquineBodyPose.IGoal {
    const limbs: Record<
      AutoMovieArchetypeQuadrupedBody.Limb,
      EquineBodyPose.Limb
    > = {
      ...goal.limbs,
    };
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const state: EquineBodyPose.Limb = goal.limbs[limb];
      if (state.kind === "placed")
        limbs[limb] = { ...state, anchor: Vector3.add(state.anchor, by) };
    }
    return { trunk: EquineStanceSupport.moved(goal.trunk, by), limbs };
  }

  /*
   * A stance moved by a level translation.
   */
  function shiftState(
    state: EquineStanceRows.IState,
    by: IAutoMovieVector3,
  ): EquineStanceRows.IState {
    return {
      trunk: EquineStanceSupport.moved(state.trunk, by),
      anchors: {
        leftFore: Vector3.add(state.anchors.leftFore, by),
        rightFore: Vector3.add(state.anchors.rightFore, by),
        leftHind: Vector3.add(state.anchors.leftHind, by),
        rightHind: Vector3.add(state.anchors.rightHind, by),
      },
    };
  }
}

/*
 * Standard gravity, m/s².
 */
const GRAVITY: number = 9.80665;

/*
 * Each courbette leap's forward travel, metres: authored.
 */
const LEAP: number = 0.35;

/*
 * The capriole's gathering drop before take-off, metres: authored.
 */
const GATHER: number = 0.06;

/*
 * Folded limbs' joint turns in the air, degrees, shoulder or hip first,
 * positive swinging the distal end back: authored poses.
 */
const TUCK: Readonly<Record<Tuck, Turns>> = {
  fore: [-40, -10, 100, 20],
  hind: [-25, 20, -60, 30],
  kick: [45, -10, 20, 10],
};

/*
 * A tucked limb in the air.
 */
type Tuck = "fore" | "hind" | "kick";

/*
 * Four joint turns, degrees, shoulder or hip first.
 */
type Turns = readonly [number, number, number, number];
