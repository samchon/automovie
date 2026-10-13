import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * One live decorative spray particle at the sampled step, as `sampleFluidSpray`
 * places it.
 *
 * @evidence contracts/common.md#principled-implementation A particle is a pure function of its emitter and spawn index evaluated at the sample time, so two samples of one step produce identical particles whatever order the seeks ran in.
 * @evidence contracts/common.md#clear-and-simple-design Carries the emitter id and index as identity plus only what a billboard renderer draws (position, size, normalized age); the viewer uploads exactly these three attributes.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No particle is special-cased or clipped to the lattice; `ageRatio` is age over lifetime, with a zero clamp on age only to absorb a rounding ulp at the newest index.
 * @evidence contracts/common.md#meaningful-documentation States the identity pair, the launch time an index implies, the world frame and metre unit of position and size, where size comes from, and the range of `ageRatio`.
 * @author Samchon
 */
export interface IAutoMovieFluidSprayParticle {
  /** Id of the emitter that spawned it. */
  spray: string;

  /**
   * Stable zero-based spawn identity within that emitter; the particle launched
   * at `index / rate` seconds.
   */
  index: number;

  /** World position in metres at the sampled step, on its ballistic arc. */
  position: IAutoMovieVector3;

  /** World billboard size in metres, copied from the emitter. */
  size: number;

  /** Age divided by the emitter's `lifetime`, in `[0, 1)`. */
  ageRatio: number;
}
