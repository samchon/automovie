import type { IAutoMovieFormationCadenceSegment } from "@automovie/engine";

import type { IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence.js";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle.js";
import { formationCycleCadence } from "./formationCycleCadence.js";

/**
 * Write one unit's current cadence into the cells its materials read.
 *
 * The whole per-frame cost of an animated crowd: two floats and a texture
 * handle, once per tier. Nothing is written per member, and nothing carries
 * over from the previous frame, so the same time always draws the same frame.
 */
export const applyFormationCycleCadence = (
  cycle: IAutoMovieFormationCycle,
  segments: readonly IAutoMovieFormationCadenceSegment[],
): IAutoMovieFormationCadence => {
  const cadence = formationCycleCadence(cycle, segments);
  cycle.active = cadence.take;
  cycle.uniforms.automovieCycleTexture.value = cadence.take.texture;
  cycle.uniforms.automovieCycleAdvance.value = cadence.advance;
  cycle.uniforms.automovieCycleTurn.value = cadence.turn;
  return cadence;
};
