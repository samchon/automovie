import type { IAutoMovieFormationCadenceSegment } from "@automovie/engine";

import type { IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence.js";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import { formationCycleCadence } from "./formationCycleCadence.js";

/**
 * Write one unit's current cadence into the cells its materials read.
 *
 * Cadence integration selects a take and absolute advance/turn, then writes
 * two float cells and one texture cell per tier without per-member mutation.
 * This describes cadence uniforms only; culling, instance transforms and draws
 * remain additional work, and final pixels also depend on host scene state.
 *
 * @evidence contracts/common.md#principled-implementation Computes absolute cadence from the baked cycle and admitted segment sequence, assigns its active take/texture and advance/turn uniforms; metre travel and turn radius use the existing bake-derived stride heuristic rather than a general exact foot-contact solver.
 * @evidence contracts/common.md#clear-and-simple-design Keeps cadence integration in formationCycleCadence and only realizes the result into one tier's shared material cells, avoiding per-member mutable animation clocks.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses authored segments and the actual baked take table without fixture timestamps or accumulated-frame compensation; every call overwrites cadence cells from absolute inputs.
 * @evidence contracts/common.md#meaningful-documentation States take/absolute uniform writes and distinguishes this tier-local work from the crowd's remaining culling, transform and render costs.
 * @evidence contracts/performance.md#efficient-algorithms Cadence integration visits the supplied segments and takes required by its selection logic, then assigns four fixed fields; no anonymous-member traversal or new instance buffer is performed here.
 * @evidence contracts/performance.md#reuse-equivalent-work Reuses the cycle's baked take textures and existing uniform cells across frames; changed segment motion/time requires fresh absolute integration and no prior-frame clock is cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrows the cycle/segments and switches references among cycle-owned take textures without allocating another GPU texture or task; bake/runtime retirement still owns those textures.
 */
export const applyFormationCycleCadence: (
  cycle: IAutoMovieFormationCycle,
  segments: readonly IAutoMovieFormationCadenceSegment[],
) => IAutoMovieFormationCadence = (
  cycle: IAutoMovieFormationCycle,
  segments: readonly IAutoMovieFormationCadenceSegment[],
): IAutoMovieFormationCadence => {
  const cadence: IAutoMovieFormationCadence = formationCycleCadence(
    cycle,
    segments,
  );
  cycle.active = cadence.take;
  cycle.uniforms.automovieCycleTexture.value = cadence.take.texture;
  cycle.uniforms.automovieCycleAdvance.value = cadence.advance;
  cycle.uniforms.automovieCycleTurn.value = cadence.turn;
  return cadence;
};
