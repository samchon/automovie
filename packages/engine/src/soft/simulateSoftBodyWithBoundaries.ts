import type { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState } from "@automovie/interface";
import { IAutoMovieSoftBodyBoundarySample } from "./IAutoMovieSoftBodyBoundarySample";

/**
 * Integrate cloth against a complete sequence of fixed-step moving boundaries.
 *
 * Samples must cover step zero through the requested step without gaps. Static
 * domain anchors and colliders remain valid and are combined with the moving
 * boundary, so omitting this API preserves the original curtain path byte for
 * byte.
 *
 * @evidence requirements/motion/secondary-motion.md#motion-secondary-moving-boundary Samples the actor boundary on the cloth fixed clock.
 * @evidence specifications/performance-motion-and-staging/kinematics-contact-and-interaction.md#performance-secondary-motion-boundary-choice Implements the explicitly selected moving-boundary path.
 */
export const simulateSoftBodyWithBoundaries = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  boundaries: readonly IAutoMovieSoftBodyBoundarySample[],
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  if (boundaries.length !== step + 1)
    throw new Error(
      `soft body "${domain.id}" needs one moving boundary for every step from 0 through ${step}`,
    );
  const movingAnchorParticles = new Set(
    domain.anchors
      .filter((anchor) => anchor.binding !== undefined)
      .map((anchor) => anchor.particle),
  );
  const bodyCapsuleIds = new Set(
    domain.colliders
      .filter((collider) => collider.kind === "body-capsule")
      .map((collider) => collider.id),
  );
  for (let index = 0; index < boundaries.length; ++index) {
    const boundary = boundaries[index]!;
    if (boundary.step !== index)
      throw new Error(
        `soft body "${domain.id}" moving boundary[${index}] must name absolute step ${index}`,
      );
    const particles = new Set<number>();
    for (const anchor of boundary.anchors) {
      if (
        !Number.isSafeInteger(anchor.particle) ||
        anchor.particle < 0 ||
        anchor.particle >= domain.lattice.columns * domain.lattice.rows
      )
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] has an invalid anchor particle`,
        );
      if (!movingAnchorParticles.has(anchor.particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] particle ${anchor.particle} is not an authored moving anchor`,
        );
      if (particles.has(anchor.particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] repeats anchor particle ${anchor.particle}`,
        );
      particles.add(anchor.particle);
      assertVector(anchor.position, `moving boundary[${index}] anchor`);
    }
    for (const particle of movingAnchorParticles)
      if (!particles.has(particle))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] is missing authored moving anchor particle ${particle}`,
        );
    const capsules = new Set<string>();
    for (const capsule of boundary.capsules) {
      if (capsule.id.trim().length === 0)
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] capsule id must not be blank`,
        );
      if (capsules.has(capsule.id))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] repeats capsule "${capsule.id}"`,
        );
      if (!bodyCapsuleIds.has(capsule.id))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] capsule "${capsule.id}" is not an authored body capsule`,
        );
      capsules.add(capsule.id);
      assertVector(capsule.from, `moving boundary[${index}] capsule from`);
      assertVector(capsule.to, `moving boundary[${index}] capsule to`);
      if (!Number.isFinite(capsule.radius) || capsule.radius <= 0)
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] capsule radius must be finite and positive`,
        );
    }
    for (const id of bodyCapsuleIds)
      if (!capsules.has(id))
        throw new Error(
          `soft body "${domain.id}" moving boundary[${index}] is missing authored body capsule "${id}"`,
        );
  }
  return simulateSoftBodyCore(domain, step, state, boundaries);
};

const simulateSoftBodyCore = (
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

  const columns = domain.lattice.columns;
  const rows = domain.lattice.rows;
  const count = columns * rows;
  const dt = domain.solver.fixedStepSeconds;
  const damping = 1 + dt * domain.solver.drag;
  const stiffness = [
    domain.solver.stiffness.structural,
    domain.solver.stiffness.shear,
    domain.solver.stiffness.bend,
  ];

  // Anchors are resolved once: a named state is a boundary condition held for
  // the whole solve, not a keyframe that moves while it is being integrated.
  const position = restConfiguration(domain, state);
  if (boundaries !== null)
    applyResolvedAnchors(position, boundaries[0]!.anchors);
  const velocity = new Float64Array(count * 3);
  const predicted = new Float64Array(count * 3);
  const correction = new Float64Array(count * 3);
  const inverseMass = new Float64Array(count);
  const valence = new Int32Array(count);
  const restLength = new Float64Array(count * NEIGHBOURS.length);

  for (let particle = 0; particle < count; ++particle)
    inverseMass[particle] = 1 / domain.mass[particle];
  for (const anchor of domain.anchors) inverseMass[anchor.particle] = 0;

  for (let row = 0; row < rows; ++row)
    for (let column = 0; column < columns; ++column) {
      const particle = row * columns + column;
      for (let at = 0; at < NEIGHBOURS.length; ++at) {
        const other = neighbourOf(columns, rows, column, row, at);
        if (other < 0) {
          restLength[particle * NEIGHBOURS.length + at] = -1;
          continue;
        }
        restLength[particle * NEIGHBOURS.length + at] = distance(
          domain.rest,
          particle,
          other,
        );
        ++valence[particle];
      }
    }

  const gravity = domain.solver.gravity;
  const draught = windAxis(domain);
  let contacts = 0;

  for (let index = 0; index < step; ++index) {
    const boundary = boundaries?.[index + 1] ?? null;
    if (boundary !== null) applyResolvedAnchors(position, boundary.anchors);
    const gust = windAcceleration(domain, index * dt);
    contacts = 0;

    for (let particle = 0; particle < count; ++particle) {
      const base = particle * 3;
      if (inverseMass[particle] === 0) {
        const moving = boundary?.anchors.find(
          (anchor) => anchor.particle === particle,
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

    for (let sweep = 0; sweep < domain.solver.iterations; ++sweep) {
      gather({
        columns,
        rows,
        predicted,
        correction,
        inverseMass,
        valence,
        restLength,
        stiffness,
      });
      for (let value = 0; value < predicted.length; ++value)
        predicted[value] += correction[value];
    }

    for (let particle = 0; particle < count; ++particle) {
      if (inverseMass[particle] === 0) continue;
      contacts += resolveContacts(domain.colliders, predicted, particle);
      if (boundary !== null)
        contacts += resolveCapsuleContacts(
          boundary.capsules,
          predicted,
          particle,
        );
    }

    for (let particle = 0; particle < count; ++particle) {
      const base = particle * 3;
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

  let maxSpeed = 0;
  for (let particle = 0; particle < count; ++particle) {
    const base = particle * 3;
    const speed = Math.sqrt(
      velocity[base] * velocity[base] +
        velocity[base + 1] * velocity[base + 1] +
        velocity[base + 2] * velocity[base + 2],
    );
    if (speed > maxSpeed) maxSpeed = speed;
  }

  let maxStrain = 0;
  for (let row = 0; row < rows; ++row)
    for (let column = 0; column < columns; ++column) {
      const particle = row * columns + column;
      // The first four neighbour slots are the structural family; strain is a
      // statement about stretch, and a diagonal or a second neighbour bending
      // is not stretch.
      for (let at = 0; at < 4; ++at) {
        const rest = restLength[particle * NEIGHBOURS.length + at];
        if (rest < 0) continue;
        const other = neighbourOf(columns, rows, column, row, at);
        const strain =
          Math.abs(distance(position, particle, other) - rest) / rest;
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
