import {
  IAutoMovieSoftBodyDomain,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftWind,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieSoftBodyBoundarySample } from "./IAutoMovieSoftBodyBoundarySample";
import { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import { SOFT_BODY_NEIGHBOURS } from "./SOFT_BODY_NEIGHBOURS";
import { gatherSoftBodyCorrections } from "./gatherSoftBodyCorrections";
import { projectSoftBodyContacts } from "./projectSoftBodyContacts";
import { softBodyNeighbourOf } from "./softBodyNeighbourOf";
import { softBodyParticleDistance } from "./softBodyParticleDistance";
import { softBodyRestBuffer } from "./softBodyRestBuffer";

/** Integrate an admitted cloth lattice from its authored rest boundary to one absolute fixed step.
 *
 * @evidence contracts/common.md#principled-implementation Damped prediction, ordered simultaneous Jacobi constraint gathers and discrete collider escape form the existing position-based scheme. Anchors have zero inverse mass and prescribed targets; domain admission and complete moving samples are caller premises. Nonfinite integrated arrays throw, without proving universal stability or collision freedom.
 * @evidence contracts/common.md#clear-and-simple-design Static and moving-boundary public wrappers delegate to one core, sharing rest-target setup, lattice topology, fold ordering and contact geometry without changing their admission APIs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every seek replays the fixed clock from rest; no fixture state, adaptive timestep, concealed self-collision pass or substituted moving target changes the declared trajectory.
 * @evidence contracts/common.md#meaningful-documentation States absolute replay, caller admission, fixed-order stages and nonfinite failure rather than claiming every admitted large arithmetic input is safe.
 * @evidence contracts/performance.md#efficient-algorithms For P particles, I sweeps, K target steps, C colliders, B moving capsules and A anchors, setup is O(P+A+S+T) for S states and T selected targets, each step is O(P*I+P*(C+B)+P*A) in the moving-anchor find path, with O(P) working arrays plus supplied boundary storage.
 * @evidence contracts/performance.md#reuse-equivalent-work Rest lengths, valences, inverse masses and static targets are built once and reused across all steps/sweeps in this solve; changing domains, states or complete boundary sequences starts a new replay, without cross-call cache equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Working typed arrays and maps are call-local; only fresh plain position/velocity arrays and scalar measurements transfer in the result, and thrown failure retains no integration task or cursor.
 */
export const simulateSoftBodyCore: (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[] | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[] | null,
): IAutoMovieSoftBodyState => {
  if (!Number.isInteger(step) || step < 0)
    throw new Error(
      `soft body "${domain.id}" cannot be seeked to step ${step}: an absolute step must be a non-negative integer`,
    );
  if (step > domain.solver.maxSteps)
    throw new Error(
      `soft body "${domain.id}" cannot be seeked to step ${step}: the declared budget stops at ${domain.solver.maxSteps}`,
    );

  const columns: number = domain.lattice.columns;
  const rows: number = domain.lattice.rows;
  const count: number = columns * rows;
  const dt: number = domain.solver.fixedStepSeconds;
  const damping: number = 1 + dt * domain.solver.drag;
  const stiffness: number[] = [
    domain.solver.stiffness.structural,
    domain.solver.stiffness.shear,
    domain.solver.stiffness.bend,
  ];

  // Anchors are resolved once: a named state is a boundary condition held for
  // the whole solve, not a keyframe that moves while it is being integrated.
  const position: Float64Array<ArrayBufferLike> = softBodyRestBuffer(
    domain,
    state,
  );
  if (boundaries !== null)
    applyResolvedAnchors(position, boundaries[0]!.anchors);
  const velocity: Float64Array<ArrayBuffer> = new Float64Array(count * 3);
  const predicted: Float64Array<ArrayBuffer> = new Float64Array(count * 3);
  const correction: Float64Array<ArrayBuffer> = new Float64Array(count * 3);
  const inverseMass: Float64Array<ArrayBuffer> = new Float64Array(count);
  const valence: Int32Array<ArrayBuffer> = new Int32Array(count);
  const restLength: Float64Array<ArrayBuffer> = new Float64Array(
    count * SOFT_BODY_NEIGHBOURS.length,
  );

  for (let particle: number = 0; particle < count; ++particle)
    inverseMass[particle] = 1 / domain.mass[particle];
  for (const anchor of domain.anchors) inverseMass[anchor.particle] = 0;

  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      for (let at: number = 0; at < SOFT_BODY_NEIGHBOURS.length; ++at) {
        const other: number = softBodyNeighbourOf(
          columns,
          rows,
          column,
          row,
          at,
        );
        if (other < 0) {
          restLength[particle * SOFT_BODY_NEIGHBOURS.length + at] = -1;
          continue;
        }
        restLength[particle * SOFT_BODY_NEIGHBOURS.length + at] =
          softBodyParticleDistance(domain.rest, particle, other);
        ++valence[particle];
      }
    }

  const gravity: IAutoMovieVector3 = domain.solver.gravity;
  const draught: IAutoMovieVector3 = windAxis(domain);
  let contacts: number = 0;

  for (let index: number = 0; index < step; ++index) {
    const boundary: IAutoMovieSoftBodyBoundarySample | null =
      boundaries?.[index + 1] ?? null;
    if (boundary !== null) applyResolvedAnchors(position, boundary.anchors);
    const gust: number = windAcceleration(domain, index * dt);
    contacts = 0;

    for (let particle: number = 0; particle < count; ++particle) {
      const base: number = particle * 3;
      if (inverseMass[particle] === 0) {
        const moving: IAutoMovieSoftBodyResolvedAnchor | undefined =
          boundary?.anchors.find(
            (anchor: IAutoMovieSoftBodyResolvedAnchor): boolean =>
              anchor.particle === particle,
          );
        predicted[base] = moving?.position.x ?? position[base];
        predicted[base + 1] = moving?.position.y ?? position[base + 1];
        predicted[base + 2] = moving?.position.z ?? position[base + 2];
        continue;
      }
      velocity[base] =
        (velocity[base] + (gravity.x + draught.x * gust) * dt) / damping;
      velocity[base + 1] =
        (velocity[base + 1] + (gravity.y + draught.y * gust) * dt) / damping;
      velocity[base + 2] =
        (velocity[base + 2] + (gravity.z + draught.z * gust) * dt) / damping;
      predicted[base] = position[base] + velocity[base] * dt;
      predicted[base + 1] = position[base + 1] + velocity[base + 1] * dt;
      predicted[base + 2] = position[base + 2] + velocity[base + 2] * dt;
    }

    for (let sweep: number = 0; sweep < domain.solver.iterations; ++sweep) {
      gatherSoftBodyCorrections({
        columns,
        rows,
        predicted,
        correction,
        inverseMass,
        valence,
        restLength,
        stiffness,
      });
      for (let value: number = 0; value < predicted.length; ++value)
        predicted[value] += correction[value];
    }

    for (let particle: number = 0; particle < count; ++particle) {
      if (inverseMass[particle] === 0) continue;
      contacts = projectSoftBodyContacts(
        domain.colliders,
        boundary?.capsules ?? null,
        predicted,
        particle,
        contacts,
      );
    }

    for (let particle: number = 0; particle < count; ++particle) {
      const base: number = particle * 3;
      if (inverseMass[particle] === 0) {
        velocity[base] = 0;
        velocity[base + 1] = 0;
        velocity[base + 2] = 0;
        position[base] = predicted[base];
        position[base + 1] = predicted[base + 1];
        position[base + 2] = predicted[base + 2];
        continue;
      }
      velocity[base] = (predicted[base] - position[base]) / dt;
      velocity[base + 1] = (predicted[base + 1] - position[base + 1]) / dt;
      velocity[base + 2] = (predicted[base + 2] - position[base + 2]) / dt;
      position[base] = predicted[base];
      position[base + 1] = predicted[base + 1];
      position[base + 2] = predicted[base + 2];
    }

    if (allFinite(position) === false || allFinite(velocity) === false)
      throw new Error(
        `soft body "${domain.id}" produced a non-finite state at step ${index + 1}`,
      );
  }

  let maxSpeed: number = 0;
  for (let particle: number = 0; particle < count; ++particle) {
    const base: number = particle * 3;
    const speed: number = Math.sqrt(
      velocity[base] * velocity[base] +
        velocity[base + 1] * velocity[base + 1] +
        velocity[base + 2] * velocity[base + 2],
    );
    if (speed > maxSpeed) maxSpeed = speed;
  }

  let maxStrain: number = 0;
  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      // The first four neighbour slots are the structural family; strain is a
      // statement about stretch, and a diagonal or a second neighbour bending
      // is not stretch.
      for (let at: number = 0; at < 4; ++at) {
        const rest: number =
          restLength[particle * SOFT_BODY_NEIGHBOURS.length + at];
        if (rest < 0) continue;
        const other: number = softBodyNeighbourOf(
          columns,
          rows,
          column,
          row,
          at,
        );
        const strain: number =
          Math.abs(softBodyParticleDistance(position, particle, other) - rest) /
          rest;
        if (strain > maxStrain) maxStrain = strain;
      }
    }

  return {
    domain: domain.id,
    state,
    step,
    time: step * dt,
    positions: Array.from(position),
    velocities: Array.from(velocity),
    maxSpeed,
    maxStrain,
    contacts,
  };
};

/** Overwrite each resolved hard target in the working position buffer, leaving unrelated particles untouched. */
const applyResolvedAnchors: (
  position: Float64Array<ArrayBufferLike>,
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[],
) => void = (
  position: Float64Array,
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[],
): void => {
  for (const anchor of anchors) {
    const base: number = anchor.particle * 3;
    position[base] = anchor.position.x;
    position[base + 1] = anchor.position.y;
    position[base + 2] = anchor.position.z;
  }
};

/** Normalize the admitted draught direction with the existing square-root expression, or return zero for no wind. */
const windAxis: (domain: IAutoMovieSoftBodyDomain) => IAutoMovieVector3 = (
  domain: IAutoMovieSoftBodyDomain,
): IAutoMovieVector3 => {
  const wind: IAutoMovieSoftWind | null = domain.wind;
  if (wind === null) return { x: 0, y: 0, z: 0 };
  const length: number = Math.sqrt(
    wind.direction.x * wind.direction.x +
      wind.direction.y * wind.direction.y +
      wind.direction.z * wind.direction.z,
  );
  return {
    x: wind.direction.x / length,
    y: wind.direction.y / length,
    z: wind.direction.z / length,
  };
};

/** Evaluate the declared triangle gust at a fixed-clock time with the existing binary64 phase arithmetic. */
const windAcceleration: (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
) => number = (domain: IAutoMovieSoftBodyDomain, time: number): number => {
  const wind: IAutoMovieSoftWind | null = domain.wind;
  if (wind === null) return 0;
  const cycles: number = wind.gustHz * time;
  const phase: number = cycles - Math.floor(cycles);
  return (
    wind.acceleration + wind.gustAcceleration * (4 * Math.abs(phase - 0.5) - 1)
  );
};

/** Reject nonfinite integrated coordinates by scanning the completed working buffer. */
const allFinite: (values: Float64Array<ArrayBufferLike>) => boolean = (
  values: Float64Array,
): boolean => {
  for (let index: number = 0; index < values.length; ++index)
    if (Number.isFinite(values[index]) === false) return false;
  return true;
};
