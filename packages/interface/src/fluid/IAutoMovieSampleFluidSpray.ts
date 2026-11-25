import type { IAutoMovieFluidDomain } from "./IAutoMovieFluidDomain";
import type { IAutoMovieFluidState } from "./IAutoMovieFluidState";

/** Inputs to deterministic decorative spray sampling from a fluid snapshot. */
export namespace IAutoMovieSampleFluidSpray {
  /**
   * Borrowed emitter definitions and fluid snapshot for one decorative spray
   * sample.
   *
   * Decorative particles do not change depths or volume ledgers. The supplied
   * state and domain must have matching ids; that check alone does not
   * establish state provenance, array layout or finite fields.
   *
   * Particle i has nominal birth i / rate and age time - i / rate. Its position
   * is `p0 + direction * speed * age - gravity * age² / 2 * y`, where p0 is the
   * emitter cell's free surface in the supplied current state, shared by all
   * its particles. Historical spawn heights are not reconstructed. Direction
   * normalizes the axis, adds seeded per-component jitter scaled by spread,
   * then normalizes again.
   *
   * LOD keeps spawn indices divisible by `1 + floor(max(cameraDistance, 0) /
   * lodDistance)`; the maxParticles cap then keeps the newest survivors. This
   * assumes representable live-window and stride arithmetic.
   *
   * Particles are returned per emitter in declaration order and, for
   * representable indices, in increasing spawn order. LOD and caps are applied
   * in the CPU sample; this does not prove GPU display agreement.
   *
   * Throws for a mismatched state domain id or non-finite camera distance.
   * Negative distance uses the nearest LOD, and omitted distance defaults to
   * zero. Caller-run domain admission remains required; finite authored fields
   * do not prove finite/safe spawn indices, finite stride or ballistic
   * arithmetic, or a finite nonzero jitter norm. Those derived values are not
   * checked here.
   *
   * Sampling mutates neither input and retains no random stream. The returned
   * particle list and position objects are fresh; an empty emitter list
   * produces no particles.
   */
  export type IProps = {
    /**
     * Admitted grid, emitter definitions and gravity; the sampler borrows these
     * without advancing a fluid solve.
     */
    domain: IAutoMovieFluidDomain;

    /**
     * Same-domain depth snapshot and absolute time in seconds; all births use
     * this snapshot's nozzle height.
     */
    state: IAutoMovieFluidState;

    /**
     * Finite camera distance in metres driving LOD thinning; omission means
     * zero and negative values use the nearest LOD.
     */
    cameraDistance?: number;
  };
}
