import type {
  IAutoMovieFormationDesign,
  IAutoMovieFormationPlacement,
  IAutoMovieFormationSlotMotion,
  IAutoMovieFormationSlotState,
  IAutoMovieFormationStageMarkSet,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IDENTITY_FORMATION_SLOT_STATE } from "./constants/IDENTITY_FORMATION_SLOT_STATE";
import { formationSlotPosition } from "./formationSlotPosition";

/**
 * Turn a level-stage mark sheet into ordinary sparse member-motion cues.
 *
 * Supply the fixed design with its admitted layout. Sets must be in
 * chronological order with no overlap. Marks use the design's local axes
 * and absolute coordinates from its anchor, including when the unit has a
 * nonzero heading or consists of blocks. The compiler returns ordinary slot cues
 * for the shot's `formationSlotMotions`; shot admission still owns duration,
 * cue limits, numeric bounds and coexistence with other source tracks. Use a fixed unit
 * layout and spacing for the named marks to describe exact destinations.
 * This compiles root placement. Existing gait and shot clearance checks
 * retain ownership of foot motion and clearance.
 *
 * @param design The admitted formation design that owns the named slots.
 * @param sets Chronological assignments in shot-local seconds.
 * @returns Fresh member cue records in set and mark order.
 * @throws {RangeError} For conflicting intervals or identity, missing or promoted slots, and nonfinite marks or offsets.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes units, fixed frame, whole-shot limits, ordering, consumer and refusal boundaries.
 * @evidence contracts/development/implementation.md#principled-implementation Subtracts each regenerated local rest position from its absolute floor mark, then uses the previous target as the next starting state.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Formation placement supplies the rest slot at a zero anchor and heading. Ordinary sparse member cues own interpolation and retained endpoints.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No reallocation of member identities, fitted route, terrain sampling, or silently removed conflicting marks.
 * @evidence contracts/development/implementation.md#efficient-algorithms Visits each set and mark once with indexed prior targets, plus one ordinary layout placement per distinct named slot; a blocked layout placement can scan its blocks.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Request-local rest points are reused across marks for the same slot and released after compilation.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources No tasks or resources are acquired. Output records own fresh start and end vectors.
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
    if (set.id.trim().length === 0 || ids.has(set.id))
      throw new RangeError(
        "Formation stage mark set ids must be nonblank and unique.",
      );
    ids.add(set.id);
    if (
      !Number.isFinite(set.start) ||
      !Number.isFinite(set.end) ||
      set.start < end ||
      set.end <= set.start
    )
      throw new RangeError(
        `Stage marks "${set.id}" must have a positive interval starting at or after ${end}s.`,
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
        previous?.target ?? IDENTITY_FORMATION_SLOT_STATE;
      const to: IAutoMovieFormationSlotState = {
        present: true,
        offset: { x: mark.lateral - origin.x, y: 0, z: mark.depth - origin.z },
        facingOffsetDeg: mark.facingOffsetDeg ?? before.facingOffsetDeg,
      };
      if (
        !Number.isFinite(mark.lateral) ||
        !Number.isFinite(mark.depth) ||
        !Number.isFinite(to.offset.x) ||
        !Number.isFinite(to.offset.z) ||
        !Number.isFinite(to.facingOffsetDeg)
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
