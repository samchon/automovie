import type { IAutoMovieFormationCadenceSegment } from "@automovie/interface";

import type { IAutoMovieFormationCadence } from "../IAutoMovieFormationCadence.js";
import type { IAutoMovieFormationCycle } from "../IAutoMovieFormationCycle.js";
import { formationCycleCadence } from "./formationCycleCadence.js";

/**
 * Write one unit's current cadence into the cells its materials read.
 *
 * Cadence integration selects a take and absolute advance/turn, then writes two
 * float cells and one texture cell per tier without per-member mutation. This
 * describes cadence uniforms only; culling, instance transforms and draws
 * remain additional work, and final pixels also depend on host scene state.
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
