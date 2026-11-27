import {
  IAutoMovieSoftAnchor,
  type IAutoMovieSoftBodyBoundarySample,
  IAutoMovieSoftBodyDomain,
  type IAutoMovieSoftBodyObserver,
  type IAutoMovieSoftBodyResolvedAnchor,
  IAutoMovieSoftBodyState,
  IAutoMovieSoftCompliance,
  IAutoMovieSoftContact,
  IAutoMovieSoftWind,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieEngineSoftBodyNeighbours } from "../AutoMovieEngineSoftBodyNeighbours";
import { applySoftBodyFriction } from "./applySoftBodyFriction";
import { gatherSoftBodyCorrections } from "./gatherSoftBodyCorrections";
import { projectSoftBodyContacts } from "./projectSoftBodyContacts";
import { projectSoftCordSelfContact } from "./projectSoftCordSelfContact";
import { softBodyHeldLoads } from "./softBodyHeldLoads";
import { softBodyNeighbourOf } from "./softBodyNeighbourOf";
import { softBodyParticleDistance } from "./softBodyParticleDistance";
import { softBodyRestBuffer } from "./softBodyRestBuffer";
import { solveSoftBodyCompliantSweep } from "./solveSoftBodyCompliantSweep";

/*
 * Integrate an admitted cloth lattice from its authored rest boundary to one
 * absolute fixed step. Without declared compliance and contact the solve is the
 * plain position-based one, operation for operation. With compliance, each
 * sweep projects the lattice's edges as compliant constraints with their own
 * multipliers (`solveSoftBodyCompliantSweep`); with contact, a collider's push
 * is followed by Coulomb friction (`applySoftBodyFriction`) and a cord that
 * asks for self-collision keeps its segments apart after each sweep
 * (`projectSoftCordSelfContact`). A moving anchor a boundary sample lists as
 * released regains its mass for that step, leaving with the velocity its target
 * last moved at. Each position and rate must be representable at the step
 * boundary. An observer reads every completed step, with the force each held
 * particle bears when the solve is compliant.
 */
export const simulateSoftBodyCore: (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[] | null,
  observer?: IAutoMovieSoftBodyObserver | null,
) => IAutoMovieSoftBodyState = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[] | null,
  observer: IAutoMovieSoftBodyObserver | null = null,
): IAutoMovieSoftBodyState => {
  const ticks: number = Math.floor(step);
  if (!(ticks >= 0 && ticks < Infinity && ticks === step))
    throw new Error(
      `soft body "${domain.id}" cannot be seeked to step ${step}: an absolute step must be a non-negative integer`,
    );
  if (ticks > domain.solver.maxSteps)
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
    count * AutoMovieEngineSoftBodyNeighbours.length,
  );

  for (let particle: number = 0; particle < count; ++particle)
    inverseMass[particle] = 1 / domain.mass[particle];
  for (const anchor of domain.anchors) inverseMass[anchor.particle] = 0;

  for (let row: number = 0; row < rows; ++row)
    for (let column: number = 0; column < columns; ++column) {
      const particle: number = row * columns + column;
      for (let at: number = 0; at < AutoMovieEngineSoftBodyNeighbours.length; ++at) {
        const other: number = softBodyNeighbourOf(
          columns,
          rows,
          column,
          row,
          at,
        );
        if (other < 0) {
          restLength[particle * AutoMovieEngineSoftBodyNeighbours.length + at] = -1;
          continue;
        }
        restLength[particle * AutoMovieEngineSoftBodyNeighbours.length + at] =
          softBodyParticleDistance(domain.rest, particle, other);
        ++valence[particle];
      }
    }

  // The compliant solve (XPBD) when the domain declares compliance, with one
  // multiplier per particle and neighbour slot, reset at every step; the
  // plain weighted sweeps otherwise, unchanged.
  const declared: IAutoMovieSoftCompliance | null =
    domain.solver.compliance ?? null;
  const compliance: readonly number[] | null =
    declared === null
      ? null
      : [declared.structural, declared.shear, declared.bend];
  const lambda: Float64Array<ArrayBuffer> | null =
    compliance === null
      ? null
      : new Float64Array(count * AutoMovieEngineSoftBodyNeighbours.length);
  const contact: IAutoMovieSoftContact | null = domain.contact ?? null;
  const friction: number = contact?.friction ?? 0;
  const cord: boolean =
    contact !== null && domain.selfCollision && (columns === 1 || rows === 1);
  const before: [number, number, number] = [0, 0, 0];

  // A moving anchor a boundary releases regains its mass and leaves with
  // the velocity its target last moved at, so a dropped corner keeps the
  // hand's motion instead of starting from rest.
  const moving: number[] = domain.anchors
    .filter(
      (anchor: IAutoMovieSoftAnchor): boolean => anchor.binding !== undefined,
    )
    .map((anchor: IAutoMovieSoftAnchor): number => anchor.particle);
  const carried: Float64Array<ArrayBuffer> = new Float64Array(count * 3);
  const free: Uint8Array<ArrayBuffer> = new Uint8Array(count);

  const gravity: IAutoMovieVector3 = domain.solver.gravity;
  const draught: IAutoMovieVector3 = windAxis(domain);
  let contacts: number = 0;

  for (let index: number = 0; index < ticks; ++index) {
    const boundary: IAutoMovieSoftBodyBoundarySample | null =
      boundaries?.[index + 1] ?? null;
    if (boundary !== null) {
      for (const anchor of boundary.anchors) {
        const base: number = anchor.particle * 3;
        carried[base] = (anchor.position.x - position[base]) / dt;
        carried[base + 1] = (anchor.position.y - position[base + 1]) / dt;
        carried[base + 2] = (anchor.position.z - position[base + 2]) / dt;
      }
      applyResolvedAnchors(position, boundary.anchors);
      const released: ReadonlySet<number> = new Set(boundary.released ?? []);
      for (const particle of moving) {
        const now: number = released.has(particle) ? 1 : 0;
        if (now === 1 && free[particle] === 0)
          for (let axis: number = 0; axis < 3; ++axis)
            velocity[particle * 3 + axis] = carried[particle * 3 + axis];
        free[particle] = now;
        inverseMass[particle] = now === 1 ? 1 / domain.mass[particle] : 0;
      }
    }
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

    if (lambda !== null) lambda.fill(0);
    for (let sweep: number = 0; sweep < domain.solver.iterations; ++sweep) {
      if (lambda !== null)
        solveSoftBodyCompliantSweep({
          columns,
          rows,
          predicted,
          inverseMass,
          restLength,
          compliance: compliance!,
          lambda,
          dt,
        });
      else {
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
      if (cord)
        projectSoftCordSelfContact({
          count,
          position,
          predicted,
          inverseMass,
          radius: contact!.thickness,
          friction,
        });
    }

    for (let particle: number = 0; particle < count; ++particle) {
      if (inverseMass[particle] === 0) continue;
      before[0] = predicted[particle * 3];
      before[1] = predicted[particle * 3 + 1];
      before[2] = predicted[particle * 3 + 2];
      contacts = projectSoftBodyContacts(
        domain.colliders,
        boundary?.capsules ?? null,
        predicted,
        particle,
        contacts,
      );
      if (friction > 0)
        applySoftBodyFriction({
          particle,
          position,
          predicted,
          before,
          friction,
        });
    }

    for (let particle: number = 0; particle < count; ++particle) {
      const base: number = particle * 3;
      const held: boolean = inverseMass[particle] === 0;
      for (let axis: number = 0; axis < 3; ++axis) {
        const coordinate: number = base + axis;
        const next: number = predicted[coordinate];
        const rate: number = held ? 0 : (next - position[coordinate]) / dt;
        if (!(Math.max(Math.abs(next), Math.abs(rate)) < Infinity))
          throw new Error(
            `soft body "${domain.id}" produced a non-finite state at step ${index + 1}`,
          );
        velocity[coordinate] = rate;
        position[coordinate] = next;
      }
    }

    observer?.step(
      index + 1,
      position,
      velocity,
      lambda === null
        ? EMPTY
        : softBodyHeldLoads({
            columns,
            rows,
            position,
            inverseMass,
            restLength,
            lambda,
            dt,
          }),
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
          restLength[particle * AutoMovieEngineSoftBodyNeighbours.length + at];
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
    step: ticks,
    time: ticks * dt,
    positions: Array.from(position),
    velocities: Array.from(velocity),
    maxSpeed,
    maxStrain,
    contacts,
  };
};

/*
 * The loads of a solve with no multipliers to read them from.
 */
const EMPTY: ReadonlyMap<number, IAutoMovieVector3> = new Map();

/*
 * Overwrite each resolved hard target in the working position buffer, leaving
 * unrelated particles untouched.
 */
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

/*
 * Normalize the admitted draught direction with the existing square-root
 * expression, or return zero for no wind.
 */
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

/*
 * Evaluate the declared triangle gust at a fixed-clock time with the existing
 * binary64 phase arithmetic.
 */
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
