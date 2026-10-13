import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidSpray,
  IAutoMovieFluidSprayParticle,
  IAutoMovieFluidSpraySample,
  IAutoMovieFluidState,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { seededValue } from "../math/seededValue";

const JITTER_X: number = 0x73707278;
const JITTER_Y: number = 0x73707279;
const JITTER_Z: number = 0x7370727a;

/**
 * Sample the decorative spray of a fluid domain at one solved state.
 *
 * Spray is the garnish, not the water: a jet's mist and the curtain at the foot
 * of a water wall read as motion without ever entering or leaving the
 * conserved depth field, which is why the mass balance stays a statement about
 * the solver alone.
 *
 * A particle's whole life is a function of the emitter seed and its spawn
 * index, so seeking to a time reproduces exactly the set that playing straight
 * through would have shown. Particle `i` is launched at `i / rate` seconds from
 * the free surface above the emitter's cell, then follows the ballistic arc
 * `p = p₀ + d·speed·age − ½·g·age²·ŷ` for `lifetime` seconds, where `d` is the
 * unit emitter axis plus seeded jitter of up to `spread` per component,
 * renormalized.
 *
 * The live set is bounded twice. Distance thins it deterministically by keeping
 * every `1 + floor(cameraDistance / lodDistance)`-th index, so a fountain seen
 * from across a courtyard costs a fraction of the same fountain seen from its
 * rim, and the hard `maxParticles` cap then keeps the newest survivors.
 * Particles are returned per emitter in declaration order and, within one
 * emitter, in spawn order. Both bounds are enforced here rather than trusted to
 * the renderer, so the CPU reference and any GPU projection agree on how many
 * particles exist.
 *
 * Throws when the state was not solved from this domain, because the nozzle
 * stands at the free surface and a foreign state puts every jet at a depth
 * that lattice never had, and when the camera distance is not a real number,
 * which would otherwise thin the live set to nothing and read as a fountain
 * that stopped. A negative distance thins nothing.
 *
 * @evidence contracts/common.md#principled-implementation Closed-form ballistic motion from a seeded spawn index, so a particle's position is a pure function of emitter, index and the state's snapped time; the axis is normalized with `Vector3.length`, which stays exact for finite axes whose squared length would under- or overflow, matching the validator's direction rule.
 * @evidence contracts/common.md#clear-and-simple-design The public function owns the domain and distance checks, a private `emit` owns one emitter's live window, LOD stride and cap, and `jitter` owns the launch direction; spray never touches the depth field the solver conserves.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The near-end clamp of a negative distance is stated with its reason, the cap is a declared field, and no emitter, domain or distance is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the ballistic law and the launch direction, both live-set bounds, the output order, and each refusal with its reason.
 * @evidence contracts/performance.md#efficient-algorithms Each emitter walks only multiples of its LOD stride, newest first, and stops at its cap, so the work per emitter is at most `min(maxParticles, live / stride) + 1` particles regardless of how long its history or how far the camera; total work is linear in the returned particles plus the emitter count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each call derives its particles from the state and the emitters alone and caches nothing, which is what keeps a seek identical to playback.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned sample owns at most `maxParticles` particles per emitter, and the per-emitter scratch list dies with the call.
 */
export const sampleFluidSpray = (props: {
  domain: IAutoMovieFluidDomain;
  state: IAutoMovieFluidState;
  /** Camera distance in metres driving LOD thinning; defaults to `0`. */
  cameraDistance?: number;
}): IAutoMovieFluidSpraySample => {
  const domain: IAutoMovieFluidDomain = props.domain;
  const state: IAutoMovieFluidState = props.state;
  if (state.domain !== domain.id)
    throw new Error(
      `fluid domain "${domain.id}" cannot sample spray from a state of "${state.domain}"`,
    );
  const cameraDistance: number = props.cameraDistance ?? 0;
  if (!Number.isFinite(cameraDistance))
    throw new Error(
      `fluid domain "${domain.id}" cannot sample spray at a non-finite camera distance`,
    );
  const time: number = state.time;
  const particles: IAutoMovieFluidSprayParticle[] = [];
  for (const spray of domain.sprays)
    emit({ domain, state, spray, time, cameraDistance, particles });
  return { step: state.step, time, particles };
};

/** Append one emitter's live, LOD-thinned, capped particles in spawn order. */
const emit = (props: {
  domain: IAutoMovieFluidDomain;
  state: IAutoMovieFluidState;
  spray: IAutoMovieFluidSpray;
  time: number;
  cameraDistance: number;
  particles: IAutoMovieFluidSprayParticle[];
}): void => {
  const domain: IAutoMovieFluidDomain = props.domain;
  const spray: IAutoMovieFluidSpray = props.spray;
  const cell: number = spray.row * domain.grid.columns + spray.column;
  const nozzle: IAutoMovieVector3 = {
    x: domain.grid.origin.x + (spray.column + 0.5) * domain.grid.cellX,
    y: domain.grid.origin.y + domain.bed[cell]! + props.state.depth[cell]!,
    z: domain.grid.origin.z + (spray.row + 0.5) * domain.grid.cellZ,
  };
  // Clamped at the near end so a caller that hands back a signed depth rather
  // than a distance thins nothing instead of everything: an unclamped negative
  // gives a stride of zero, and `index % 0` is NaN, which silently rejects
  // every particle and reads as "the fountain stopped".
  const stride: number =
    1 + Math.floor(Math.max(0, props.cameraDistance) / spray.lodDistance);
  const newest: number = Math.floor(props.time * spray.rate);
  const oldest: number = Math.floor(
    (props.time - spray.lifetime) * spray.rate,
  );
  const gravity: number = domain.solver.gravity;
  const axis: IAutoMovieVector3 = spray.direction;
  const axisLength: number = Vector3.length(axis);

  // Walk the kept indices newest-first, the multiples of the stride, so the
  // hard cap keeps the freshest particles and a far camera never visits the
  // indices it thins away; then put the survivors back in spawn order.
  const collected: IAutoMovieFluidSprayParticle[] = [];
  for (
    let index: number = newest - (newest % stride);
    index >= 0 && index > oldest;
    index -= stride
  ) {
    if (collected.length === spray.maxParticles) break;
    // `oldest < index <= time·rate` is the exact integer statement of "alive
    // for less than `lifetime`", so aliveness needs no second test; the clamp
    // only absorbs a rounding ulp in `floor(time·rate)`.
    const age: number = Math.max(0, props.time - index / spray.rate);
    const direction: IAutoMovieVector3 = jitter(spray, axis, axisLength, index);
    collected.push({
      spray: spray.id,
      index,
      position: {
        x: nozzle.x + direction.x * spray.speed * age,
        y:
          nozzle.y +
          direction.y * spray.speed * age -
          0.5 * gravity * age * age,
        z: nozzle.z + direction.z * spray.speed * age,
      },
      size: spray.size,
      ageRatio: age / spray.lifetime,
    });
  }
  for (let at: number = collected.length - 1; at >= 0; --at)
    props.particles.push(collected[at]!);
};

/** The unit launch direction of one particle: the unit jet axis plus seeded jitter. */
const jitter = (
  spray: IAutoMovieFluidSpray,
  axis: IAutoMovieVector3,
  axisLength: number,
  index: number,
): IAutoMovieVector3 => {
  const x: number =
    axis.x / axisLength +
    spray.spread * (2 * seededValue(spray.seed, index, JITTER_X) - 1);
  const y: number =
    axis.y / axisLength +
    spray.spread * (2 * seededValue(spray.seed, index, JITTER_Y) - 1);
  const z: number =
    axis.z / axisLength +
    spray.spread * (2 * seededValue(spray.seed, index, JITTER_Z) - 1);
  const length: number = Math.sqrt(x * x + y * y + z * z);
  return { x: x / length, y: y / length, z: z / length };
};
