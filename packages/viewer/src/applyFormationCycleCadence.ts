import type { IAutoMovieFormationCadenceSegment } from "@automovie/engine";

import type { IAutoMovieFormationCadence } from "./IAutoMovieFormationCadence";
import type { IAutoMovieFormationCycle } from "./IAutoMovieFormationCycle";
import { formationCycleCadence } from "./formationCycleCadence";

/**
 * Write one unit's current cadence into the cells its materials read.
 *
 * The whole per-frame cost of an animated crowd: two floats and a texture
 * handle, once per tier. Nothing is written per member, and nothing carries
 * over from the previous frame, so the same time always draws the same frame.
 *
 * @evidence requirements/formations/reform-and-group-motion.md#formation-turn-speed-response Writes the resolved take, travelled cycles and radius-scaled turn cycles into the same cells all tier materials read.
 * @evidence specifications/performance-motion-and-staging/formation-motion-resolution-and-budgets.md#performance-formation-member-exception-command-event Writes the resolved take, travelled cycles and radius-scaled turn cycles into the same cells all tier materials read.
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
