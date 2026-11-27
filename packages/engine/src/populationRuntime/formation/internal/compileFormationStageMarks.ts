import type {
  IAutoMovieFormationDesign,
  IAutoMovieFormationPlacement,
  IAutoMovieFormationSlotMotion,
  IAutoMovieFormationSlotState,
  IAutoMovieFormationStageMarkSet,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieEngineIdentityFormationSlotState } from "../../../constants/IAutoMovieEngineIdentityFormationSlotState";
import { formationSlotPosition } from "./formationSlotPosition";

/*
 * Turn a level-stage mark sheet into ordinary sparse member-motion cues.
 *
 * Supply the fixed design with its admitted layout. Sets must be in
 * chronological order with no overlap. Marks use the design's local axes and
 * absolute coordinates from its anchor, including when the unit has a nonzero
 * heading or consists of blocks. The compiler returns ordinary slot cues for
 * the shot's `formationSlotMotions`; shot admission still owns duration, cue
 * limits, numeric bounds and coexistence with other source tracks. Use a fixed
 * unit layout and spacing for the named marks to describe exact destinations.
 * This compiles root placement. Existing gait and shot clearance checks retain
 * ownership of foot motion and clearance.
 * Parameter design: The admitted formation design that owns the named slots.
 * Parameter sets: Chronological assignments in shot-local seconds.
 * Returns: Fresh member cue records in set and mark order.
 * For conflicting intervals or identity, missing or
 * promoted slots, and nonfinite marks or offsets.
 */
export function compileFormationStageMarks(
  design: IAutoMovieFormationDesign,
  sets: readonly IAutoMovieFormationStageMarkSet[],
): IAutoMovieFormationSlotMotion[] {
  const local: IAutoMovieFormationPlacement = {
    id: design.id,
    count: design.count,
    layout: design.layout,
    blocks: design.blocks,
    seed: design.seed,
    anchor: { x: 0, y: 0, z: 0 },
    facingDeg: 0,
  };
  const heroes: Set<number> = new Set(
    design.heroOverrides.map((hero) => hero.slot),
  );
  const slots: Map<
    number,
    { rest: IAutoMovieVector3; target: IAutoMovieFormationSlotState }
  > = new Map();
  const ids: Set<string> = new Set();
  const motions: IAutoMovieFormationSlotMotion[] = [];
  let end: number = 0;
  for (const set of sets) {
    if (ids.has(set.id))
      throw new RangeError("Formation stage mark set ids must be unique.");
    ids.add(set.id);
    const duration: number = set.end - set.start;
    if (set.start < end || !(duration > 0 && duration < Infinity))
      throw new RangeError(
        `Stage marks "${set.id}" must have a positive finite interval starting at or after ${end}s.`,
      );
    end = set.end;
    if (set.marks.length === 0)
      throw new RangeError(`Stage marks "${set.id}" must assign a slot.`);

    const assigned: Set<number> = new Set();
    for (const mark of set.marks) {
      if (assigned.has(mark.slot) || heroes.has(mark.slot))
        throw new RangeError(
          `Stage marks "${set.id}" must name anonymous slot ${mark.slot} only once.`,
        );
      assigned.add(mark.slot);
      const previous = slots.get(mark.slot);
      const origin: IAutoMovieVector3 =
        previous?.rest ?? formationSlotPosition(local, mark.slot);
      const before: IAutoMovieFormationSlotState =
        previous?.target ?? IAutoMovieEngineIdentityFormationSlotState;
      const to: IAutoMovieFormationSlotState = {
        present: true,
        offset: { x: mark.lateral - origin.x, y: 0, z: mark.depth - origin.z },
        facingOffsetDeg: mark.facingOffsetDeg ?? before.facingOffsetDeg,
      };
      const dx: number = to.offset.x - before.offset.x;
      const dz: number = to.offset.z - before.offset.z;
      const turn: number = to.facingOffsetDeg - before.facingOffsetDeg;
      if (
        !(
          Math.abs(dx) < Infinity &&
          Math.abs(dz) < Infinity &&
          Math.abs(turn) < Infinity
        )
      )
        throw new RangeError(
          `Stage marks "${set.id}" must give finite coordinates and facing for slot ${mark.slot}.`,
        );
      motions.push({
        id: `${set.id}.slot.${mark.slot}`,
        formation: design.id,
        slots: [mark.slot],
        start: set.start,
        end: set.end,
        from: { ...before, offset: { ...before.offset } },
        to,
        easing: set.easing ?? "linear",
      });
      slots.set(mark.slot, { rest: origin, target: to });
    }
  }
  return motions;
}
