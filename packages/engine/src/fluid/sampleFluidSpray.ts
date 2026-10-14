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

/** Domain salts separate the three seeded component samples without retaining a random stream. */
const JITTER_X: number = 0x73707278;
/** Y component salt used with the same emitter seed and spawn index. */
const JITTER_Y: number = 0x73707279;
/** Z component salt used with the same emitter seed and spawn index. */
const JITTER_Z: number = 0x7370727a;

/**
 * Sample the decorative spray of a fluid domain at one solved state.
 *
 * Decorative particles do not change depths or volume ledgers. The supplied state and domain must have matching ids; that check alone does not establish state provenance, array layout or finite fields.
 *
 * Particle i has nominal birth i / rate and age time - i / rate. Its position is `p0 + direction * speed * age - gravity * age² / 2 * y`, where p0 is the emitter cell's free surface in the supplied current state, shared by all its particles. Historical spawn heights are not reconstructed. Direction normalizes the axis, adds seeded per-component jitter scaled by spread, then normalizes again.
 *
 * LOD keeps spawn indices divisible by `1 + floor(max(cameraDistance, 0) / lodDistance)`; the maxParticles cap then keeps the newest survivors. This assumes representable live-window and stride arithmetic.
 *
 * Particles are returned per emitter in declaration order and, for representable indices, in increasing spawn order. LOD and caps are applied in the CPU sample; this does not prove GPU display agreement.
 *
 * Throws for a mismatched state domain id or non-finite camera distance. Negative distance uses the nearest LOD, and omitted distance defaults to zero. Caller-run domain admission remains required; finite authored fields do not prove finite/safe spawn indices, finite stride or ballistic arithmetic, or a finite nonzero jitter norm. Those derived values are not checked here.
 *
 * @evidence contracts/common.md#principled-implementation Uses seeded index jitter and closed-form ballistic age, with nozzle height from the current supplied depth rather than spawn history. Vector3.length avoids many square overflow/underflow cases through Math.hypot fallback, but a finite axis can still have an unrepresentable norm; index, jitter and position arithmetic have no separate finite gate.
 * @evidence contracts/common.md#clear-and-simple-design The public function owns domain-id and distance checks, emit owns one emitter's live window/LOD/cap, and jitter owns direction; decorative sampling does not mutate the solver's depth field.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Negative distance is clamped to the nearest LOD and age is clamped at zero after rounded spawn-window arithmetic. These apply uniformly rather than selecting fixtures; unsafe/non-finite index and direction outcomes remain unresolved, and the age clamp is not a complete lifetime-error bound.
 * @evidence contracts/common.md#meaningful-documentation Gives the ballistic law, current-state nozzle choice, seeded direction, LOD/cap/order, exact identity and distance checks, caller admission and unchecked derived-value limits.
 * @evidence contracts/performance.md#efficient-algorithms Each emitter jumps directly between kept stride multiples newest-first, stops after maxParticles appends and reverses only those survivors. With admitted integer caps, work/storage are O(emitters + returned particles) and O(returned particles), bounded by summed caps even when floating-point indices lose progress; correctness of distinct live indices still requires representable arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No cross-call cache or random stream is owned; unchanged domain, full state and camera distance reproduce this operation order, while equal step/id alone does not prove those mutable inputs equivalent.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the returned sample owns at most `maxParticles` particles per emitter, and the per-emitter scratch list dies with the call.
 */
export const sampleFluidSpray: (props: {
  domain: IAutoMovieFluidDomain;
  state: IAutoMovieFluidState;
  cameraDistance?: number;
}) => IAutoMovieFluidSpraySample = (props: {
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

/**
 * Append one emitter's newest stride-selected survivors, reversing the local list for increasing index order when indices are representable. The nozzle uses the current state's depth; age/window products and ballistic values are not validated. One axis norm/nozzle is shared within the emitter, and admitted maxParticles bounds appends even if unsafe integer subtraction stops advancing. Scratch storage becomes collectible on return; appended particles belong to the caller's output list.
 */
const emit: (props: {
  domain: IAutoMovieFluidDomain;
  state: IAutoMovieFluidState;
  spray: IAutoMovieFluidSpray;
  time: number;
  cameraDistance: number;
  particles: IAutoMovieFluidSprayParticle[];
}) => void = (props: {
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
  // Negative distance uses the nearest LOD. Without clamping it could produce
  // a nonpositive stride; the finite quotient can still overflow here.
  const stride: number =
    1 + Math.floor(Math.max(0, props.cameraDistance) / spray.lodDistance);
  const newest: number = Math.floor(props.time * spray.rate);
  const oldest: number = Math.floor((props.time - spray.lifetime) * spray.rate);
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
    // The rounded integer window approximates birth <= time < birth + lifetime.
    // Clamp negative computed age; there is no second lifetime or finite check.
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

/**
 * Normalize the axis using the per-emitter borrowed norm, add three domain-salted seeded components, then normalize the result. Constant scalar work allocates one direction with no random-stream state. A finite nonzero axis norm and finite nonzero jitter norm are premises, not checks made here; invalid derived norms can yield nonunit or non-finite directions.
 */
const jitter: (
  spray: IAutoMovieFluidSpray,
  axis: IAutoMovieVector3,
  axisLength: number,
  index: number,
) => IAutoMovieVector3 = (
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
