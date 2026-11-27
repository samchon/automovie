import type { IAutoMovieRenderFormationCycleTake } from "./IAutoMovieRenderFormationCycleTake.js";
import type { IAutoMovieRenderFormationCycleUniforms } from "./IAutoMovieRenderFormationCycleUniforms.js";

/**
 * One figure's repertoire, baked once and replayed by every member that wears
 * it.
 *
 * An anonymous member is not a scene node: it has no skeleton to pose and no
 * player to drive it, only a 64-byte instance matrix and a phase scalar. What
 * it can still do is carry tables that say where each of its rigid parts sits
 * at every point of a cycle, and let the vertex stage look the playing one up
 * at the position its unit's cues have reached. The tables are per LOD tier, so
 * ten members and a hundred thousand members cost the same bake.
 *
 * Members differ only in where they are in the cycle, never in the cycle
 * itself, which is exactly the shape a crowd has: one figure, many phases. What
 * they perform, and how fast, belongs to the unit and changes with its cues.
 */
export interface IAutoMovieRenderFormationCycle {
  /** Even samples across one cycle; sample `samples` wraps to sample zero. */
  samples: number;

  /** Rigid part names in the order the `automoviePart` attribute indexes them. */
  names: readonly string[];

  /** Every gait this figure declares, by name. */
  takes: ReadonlyMap<string, IAutoMovieRenderFormationCycleTake>;

  /** Take performed where a cue calls for no gait this figure declares. */
  fallback: IAutoMovieRenderFormationCycleTake;

  /** Take the last written frame selected. */
  active: IAutoMovieRenderFormationCycleTake;

  /** Uniform cells shared by every material drawing this figure. */
  uniforms: IAutoMovieRenderFormationCycleUniforms;
}
