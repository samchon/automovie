import type { IAutoMovieSoftBodyDomain, IAutoMovieSoftBodyState, IAutoMovieSoftCollider, IAutoMovieVector3 } from "@automovie/interface";
import { IAutoMovieSoftBodyBoundarySample } from "./IAutoMovieSoftBodyBoundarySample";
import { IAutoMovieSoftBodyResolvedAnchor } from "./IAutoMovieSoftBodyResolvedAnchor";
import { IAutoMovieSoftBodyResolvedCapsule } from "./IAutoMovieSoftBodyResolvedCapsule";

/**
 * The eight lattice neighbours a particle gathers a correction from.
 *
 * Order is not incidental. The families are gathered as `((structuralU +
 * structuralV) + shear) + (bendU + bendV)`, and inside each family the two
 * mirror partners are added as one two-term sum. Mirroring a panel swaps the
 * partners and negates one coordinate, and a two-term sum is exactly
 * commutative in IEEE-754 while a four-term one is not, so this grouping is
 * what makes a symmetrically authored curtain stay symmetric to the last bit
 * instead of drifting by an ulp per step.
 */
const NEIGHBOURS: ReadonlyArray<
  readonly [column: number, row: number, family: 0 | 1 | 2]
> = [
  [-1, 0, 0],
  [1, 0, 0],
  [0, -1, 0],
  [0, 1, 0],
  [-1, -1, 1],
  [1, -1, 1],
  [-1, 1, 1],
  [1, 1, 1],
  [-2, 0, 2],
  [2, 0, 2],
  [0, -2, 2],
  [0, 2, 2],
];

/**
 * Integrate a soft-body domain to one **absolute** step of its fixed clock.
 *
 * ## The equations
 *
 * The panel is a lattice of particles carrying mass `m` and velocity `v`, tied
 * by distance constraints `C(a, b) = |p_b − p_a| − L(a, b)` whose rest length
 * `L` is the distance the same two particles hold in the authored rest mesh.
 * One step is the position-based scheme of Müller et al. (2007):
 *
 * ```text
 *   v ← (v + a(t)·dt) / (1 + dt·k)          predict, with implicit linear drag
 *   p̃ ← p + v·dt
 *   repeat `iterations` times:               Jacobi projection of every C
 *     Δp_i ← (1/n_i) · Σ_j s · (w_i/(w_i + w_j)) · ((d − L)/d) · (p̃_j − p̃_i)
 *     p̃_i ← p̃_i + Δp_i
 *   p̃ ← project(p̃, colliders)
 *   v ← (p̃ − p)/dt ,  p ← p̃
 * ```
 *
 * With `a(t)` the sum of gravity and the declared draught, `k` the linear drag,
 * `w = 1/m` the inverse mass (exactly `0` for an anchored particle), `s` the
 * family stiffness, `n_i` the number of constraints incident on particle `i`,
 * and `d = |p̃_j − p̃_i|`. Constraint families are the lattice's rows and
 * columns (structural), its diagonals (shear) and its second neighbours
 * (bend).
 *
 * The projection is deliberately **Jacobi**, not Gauss-Seidel: every correction
 * reads the same predicted positions, so the answer does not depend on the
 * order particles happen to be visited, which is the property a deterministic
 * engine needs and a sequential relaxation cannot offer.
 *
 * ## Why it stays well behaved
 *
 * - **Cloth at rest is exact.** A rest length is measured from the rest mesh with
 *   the same expression the solve measures `d` with, so an undisturbed panel
 *   produces `d − L = 0` exactly. With no gravity, no draught and unmoved
 *   anchors, every correction is exactly zero and the panel never drifts,
 *   however many steps are integrated.
 * - **A projection cannot explode.** Each correction moves a particle a fraction
 *   `s ≤ 1` of the way toward satisfying its constraint and is then divided by
 *   the particle's own valence, so a sweep is a contraction. Unlike an explicit
 *   spring force there is no stiffness that can overshoot.
 * - **An anchor is a hard boundary condition.** Its inverse mass is exactly zero,
 *   so it takes no share of any correction, and it is written back to its
 *   target with zero velocity after every step: no constraint and no collider
 *   can drag a curtain off its track.
 * - **A collider is escaped along its own geometry.** A half-space pushes along
 *   its normal, a ball along the radius, a box out of its least-penetrated
 *   face. Contacts are counted, so a panel that never touched anything says
 *   so.
 *
 * Two limits of that last point are stated rather than implied. Colliders are
 * resolved **once each, in the authored order**, so a particle wedged where two
 * colliders overlap can end the step satisfying only the later one; adding a
 * relaxation loop would trade a bounded step for an unbounded one, and the
 * bounded step is what this tier promised. And a particle exactly on a box's
 * mid-plane has no preferred face: the tie is broken toward the maximum side,
 * which is deterministic but is the one place a mirrored panel need not stay
 * mirrored. The constraint fold carries that property; a box collider whose
 * exact centre plane a particle lands on does not.
 *
 * ## Stability
 *
 * A position-based sweep is unconditionally stable, so the limit is not a
 * stiffness Courant number but a **travel** condition: within one step a
 * particle must not move further than the shortest constraint in the panel, or
 * it can cross a collider it should have hit and pull a constraint from the
 * wrong side.
 *
 * ```text
 *   dt · referenceSpeed / shortestRestLength ≤ 1
 * ```
 *
 * That is what {@link softBodyTravelNumber} returns and what
 * {@link validateSoftBodyDomain} refuses to exceed. `referenceSpeed` is the
 * author's declared design budget, exactly as a fluid domain declares the
 * deepest water it is meant for; {@link IAutoMovieSoftBodyState.maxSpeed}
 * reports what the solve actually reached, so the declaration can be checked
 * rather than believed.
 *
 * ## Determinism
 *
 * The state is a pure function of `(domain, step, state)`. Nothing is cached
 * between calls, so seeking backwards, forwards, or in scattered order returns
 * exactly the same numbers as playing straight through — there is no runtime
 * object for an accumulation to hide in. Only `+ − × ÷`, `Math.abs`,
 * `Math.floor` and `Math.sqrt` are used, all of which IEEE-754 specifies
 * exactly, so a domain whose authored numbers are binary-exact reproduces bit
 * for bit on Windows and POSIX alike.
 *
 * The domain is assumed to have passed {@link validateSoftBodyDomain}: that pass
 * is where an array of the wrong length, a zero-length rest edge, a particle
 * already buried in a collider or an unstable step are refused with a path, so
 * the integrator never has to guess what an inconsistent record meant.
 *
 * Throws when `step` is not an integer in `[0, solver.maxSteps]`, when `state`
 * names a state the domain does not declare, and when the state leaves the
 * reals — a genuinely runaway solve is named at the step it first appeared
 * rather than quietly turning into NaN frames a renderer would draw as
 * nothing.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-solver-state Reconstructs the complete soft-body state at a declared absolute step.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-collider-and-solver-transition Implements the bounded fixed-step transition of the soft solver.
 * @author Samchon
 */
export const simulateSoftBody = (
  domain: IAutoMovieSoftBodyDomain,
  step: number,
  state: string | null = null,
): IAutoMovieSoftBodyState => {
  if (domain.colliders.some((collider) => collider.kind === "body-capsule"))
    throw new Error(
      `soft body "${domain.id}" needs resolved moving boundaries for body capsules`,
    );
  return simulateSoftBodyCore(domain, step, state, null);
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

/**
 * {@link softBodyRestConfiguration} as the solver's own working buffer.
 *
 * The exported form hands back a plain array, which is what a validator and a
 * consumer want; the solve integrates in place and would otherwise copy the
 * whole panel twice per seek for nothing.
 */
const restConfiguration = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
): Float64Array => {
  const position = Float64Array.from(domain.rest);
  const poses = resolveState(domain, state);
  for (const anchor of domain.anchors) {
    const moved = poses.get(anchor.id);
    const target = moved ??
      anchor.position ?? {
        x: domain.rest[anchor.particle * 3],
        y: domain.rest[anchor.particle * 3 + 1],
        z: domain.rest[anchor.particle * 3 + 2],
      };
    position[anchor.particle * 3] = target.x;
    position[anchor.particle * 3 + 1] = target.y;
    position[anchor.particle * 3 + 2] = target.z;
  }
  return position;
};

/** The anchor poses one named state applies, or an empty map for the default. */
const resolveState = (
  domain: IAutoMovieSoftBodyDomain,
  state: string | null,
): Map<string, IAutoMovieVector3> => {
  const poses = new Map<string, IAutoMovieVector3>();
  if (state === null) return poses;
  const named = domain.states.find((candidate) => candidate.id === state);
  if (named === undefined)
    throw new Error(
      `soft body "${domain.id}" does not declare a named state "${state}"`,
    );
  for (const pose of named.anchors) poses.set(pose.anchor, pose.position);
  return poses;
};

/** Row-major index of one lattice neighbour, or `-1` when it falls outside. */
const neighbourOf = (
  columns: number,
  rows: number,
  column: number,
  row: number,
  at: number,
): number => {
  const neighbourColumn = column + NEIGHBOURS[at][0];
  const neighbourRow = row + NEIGHBOURS[at][1];
  if (neighbourColumn < 0 || neighbourColumn >= columns) return -1;
  if (neighbourRow < 0 || neighbourRow >= rows) return -1;
  return neighbourRow * columns + neighbourColumn;
};

/** Distance between two particles of a flat `[x, y, z, ...]` position array. */
const distance = (values: ArrayLike<number>, a: number, b: number): number => {
  const dx = values[b * 3] - values[a * 3];
  const dy = values[b * 3 + 1] - values[a * 3 + 1];
  const dz = values[b * 3 + 2] - values[a * 3 + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
};

/**
 * One Jacobi sweep: every particle gathers its own correction from every
 * incident constraint, in the mirror-exact family order {@link NEIGHBOURS}
 * documents.
 *
 * Gathering costs each constraint twice — once from each end — and buys the
 * property that the summation order a particle sees is fixed by its own
 * neighbourhood rather than by a global constraint list, which is what makes
 * the fold mirror-exact at all.
 */
const gather = (props: {
  columns: number;
  rows: number;
  predicted: Float64Array;
  correction: Float64Array;
  inverseMass: Float64Array;
  valence: Int32Array;
  restLength: Float64Array;
  stiffness: number[];
}): void => {
  const { columns, rows, predicted, correction, inverseMass } = props;
  // Six mirror-partner slots of three components each, in the order the family
  // fold below adds them: structural along the lattice's two axes, the lower
  // and upper diagonal pairs, and bending along the two axes.
  const fold = new Float64Array(18);
  for (let row = 0; row < rows; ++row)
    for (let column = 0; column < columns; ++column) {
      const particle = row * columns + column;
      const base = particle * 3;
      if (inverseMass[particle] === 0 || props.valence[particle] === 0) {
        correction[base] = 0;
        correction[base + 1] = 0;
        correction[base + 2] = 0;
        continue;
      }
      fold.fill(0);
      for (let at = 0; at < NEIGHBOURS.length; ++at) {
        const rest = props.restLength[particle * NEIGHBOURS.length + at];
        if (rest < 0) continue;
        const other = neighbourOf(columns, rows, column, row, at);
        const dx = predicted[other * 3] - predicted[base];
        const dy = predicted[other * 3 + 1] - predicted[base + 1];
        const dz = predicted[other * 3 + 2] - predicted[base + 2];
        const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (length === 0) continue;
        const share =
          inverseMass[particle] / (inverseMass[particle] + inverseMass[other]);
        const factor =
          (props.stiffness[NEIGHBOURS[at][2]] * share * (length - rest)) /
          length;
        const slot = 3 * foldSlot(NEIGHBOURS[at]);
        fold[slot] += factor * dx;
        fold[slot + 1] += factor * dy;
        fold[slot + 2] += factor * dz;
      }
      const inverse = 1 / props.valence[particle];
      for (let axis = 0; axis < 3; ++axis)
        correction[base + axis] =
          (fold[axis] +
            fold[3 + axis] +
            (fold[6 + axis] + fold[9 + axis]) +
            (fold[12 + axis] + fold[15 + axis])) *
          inverse;
    }
};

/**
 * Which mirror-partner slot one neighbour offset folds into.
 *
 * Exactly two offsets share a slot, and they are each other's image under the
 * mirror their family can be reflected by, which is what makes the two-term sum
 * inside a slot exactly commutative.
 */
const foldSlot = (
  neighbour: readonly [column: number, row: number, family: 0 | 1 | 2],
): number => {
  if (neighbour[2] === 1) return neighbour[1] < 0 ? 2 : 3;
  const axis = neighbour[0] === 0 ? 1 : 0;
  return neighbour[2] === 0 ? axis : 4 + axis;
};

/** Push one particle out of every collider it currently violates. */
const resolveContacts = (
  colliders: IAutoMovieSoftCollider[],
  predicted: Float64Array,
  particle: number,
): number => {
  const base = particle * 3;
  let resolved = 0;
  for (const collider of colliders) {
    const wasX = predicted[base];
    const wasY = predicted[base + 1];
    const wasZ = predicted[base + 2];
    if (collider.kind === "plane") escapePlane(collider, predicted, base);
    else if (collider.kind === "sphere")
      escapeSphere(collider, predicted, base);
    else if (collider.kind === "box") escapeBox(collider, predicted, base);
    if (
      predicted[base] !== wasX ||
      predicted[base + 1] !== wasY ||
      predicted[base + 2] !== wasZ
    )
      ++resolved;
  }
  return resolved;
};

/** Write resolved hard targets into the working position buffer. */
const applyResolvedAnchors = (
  position: Float64Array,
  anchors: readonly IAutoMovieSoftBodyResolvedAnchor[],
): void => {
  for (const anchor of anchors) {
    const base = anchor.particle * 3;
    position[base] = anchor.position.x;
    position[base + 1] = anchor.position.y;
    position[base + 2] = anchor.position.z;
  }
};

/** Push one particle out of every resolved body capsule. */
const resolveCapsuleContacts = (
  capsules: readonly IAutoMovieSoftBodyResolvedCapsule[],
  predicted: Float64Array,
  particle: number,
): number => {
  const base = particle * 3;
  let resolved = 0;
  for (const capsule of capsules) {
    const wasX = predicted[base];
    const wasY = predicted[base + 1];
    const wasZ = predicted[base + 2];
    escapeCapsule(capsule, predicted, base);
    if (
      predicted[base] !== wasX ||
      predicted[base + 1] !== wasY ||
      predicted[base + 2] !== wasZ
    )
      ++resolved;
  }
  return resolved;
};

/** Project one point to the surface of a resolved segment-and-radius capsule. */
const escapeCapsule = (
  capsule: IAutoMovieSoftBodyResolvedCapsule,
  predicted: Float64Array,
  base: number,
): void => {
  const sx = capsule.to.x - capsule.from.x;
  const sy = capsule.to.y - capsule.from.y;
  const sz = capsule.to.z - capsule.from.z;
  const span = sx * sx + sy * sy + sz * sz;
  const along =
    span === 0
      ? 0
      : Math.max(
          0,
          Math.min(
            1,
            ((predicted[base] - capsule.from.x) * sx +
              (predicted[base + 1] - capsule.from.y) * sy +
              (predicted[base + 2] - capsule.from.z) * sz) /
              span,
          ),
        );
  const closestX = capsule.from.x + sx * along;
  const closestY = capsule.from.y + sy * along;
  const closestZ = capsule.from.z + sz * along;
  let dx = predicted[base] - closestX;
  let dy = predicted[base + 1] - closestY;
  let dz = predicted[base + 2] - closestZ;
  let distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (distance >= capsule.radius) return;
  if (distance === 0) {
    if (span === 0) {
      dx = 0;
      dy = 1;
      dz = 0;
    } else {
      // Cross the segment with the least-aligned cardinal axis, so the escape
      // direction is radial even for a vertical capsule.
      const length = Math.sqrt(span);
      const nx = sx / length;
      const ny = sy / length;
      const nz = sz / length;
      if (Math.abs(nx) <= Math.abs(ny) && Math.abs(nx) <= Math.abs(nz)) {
        dx = 0;
        dy = nz;
        dz = -ny;
      } else if (Math.abs(ny) <= Math.abs(nz)) {
        dx = -nz;
        dy = 0;
        dz = nx;
      } else {
        dx = ny;
        dy = -nx;
        dz = 0;
      }
      distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    distance = distance === 0 ? 1 : distance;
  }
  const factor = capsule.radius / distance;
  predicted[base] = closestX + dx * factor;
  predicted[base + 1] = closestY + dy * factor;
  predicted[base + 2] = closestZ + dz * factor;
};

/** Keep a particle on the allowed side of a half-space. */
const escapePlane = (
  collider: IAutoMovieSoftCollider.IPlane,
  predicted: Float64Array,
  base: number,
): void => {
  const normal = collider.normal;
  const length = Math.sqrt(
    normal.x * normal.x + normal.y * normal.y + normal.z * normal.z,
  );
  const nx = normal.x / length;
  const ny = normal.y / length;
  const nz = normal.z / length;
  const signed =
    nx * predicted[base] + ny * predicted[base + 1] + nz * predicted[base + 2];
  if (signed >= collider.offset) return;
  const push = collider.offset - signed;
  predicted[base] += nx * push;
  predicted[base + 1] += ny * push;
  predicted[base + 2] += nz * push;
};

/** Push a particle out to the surface of a ball. */
const escapeSphere = (
  collider: IAutoMovieSoftCollider.ISphere,
  predicted: Float64Array,
  base: number,
): void => {
  const dx = predicted[base] - collider.center.x;
  const dy = predicted[base + 1] - collider.center.y;
  const dz = predicted[base + 2] - collider.center.z;
  const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (length >= collider.radius) return;
  if (length === 0) {
    // A particle exactly at the centre has no radius to escape along. It leaves
    // upward, which is where furniture pushes fabric in a gravity field, and it
    // is stated rather than left to whichever axis happened to be first.
    predicted[base + 1] = collider.center.y + collider.radius;
    return;
  }
  const factor = collider.radius / length;
  predicted[base] = collider.center.x + dx * factor;
  predicted[base + 1] = collider.center.y + dy * factor;
  predicted[base + 2] = collider.center.z + dz * factor;
};

/**
 * Push a particle out of an axis-aligned box by its least-penetrated face.
 *
 * The axis is chosen by strict comparison, so the first axis wins a tie between
 * axes and the maximum side wins a tie between the two faces of one axis. Both
 * are deterministic; the second is the one degenerate configuration a mirrored
 * panel does not survive, and it is documented on {@link simulateSoftBody}
 * rather than hidden here.
 */
const escapeBox = (
  collider: IAutoMovieSoftCollider.IBox,
  predicted: Float64Array,
  base: number,
): void => {
  const min = [collider.min.x, collider.min.y, collider.min.z];
  const max = [collider.max.x, collider.max.y, collider.max.z];
  for (let axis = 0; axis < 3; ++axis)
    if (
      predicted[base + axis] <= min[axis] ||
      predicted[base + axis] >= max[axis]
    )
      return;
  let bestAxis = 0;
  let bestDepth = Infinity;
  let bestTarget = 0;
  for (let axis = 0; axis < 3; ++axis) {
    const low = predicted[base + axis] - min[axis];
    const high = max[axis] - predicted[base + axis];
    const depth = low < high ? low : high;
    if (depth < bestDepth) {
      bestDepth = depth;
      bestAxis = axis;
      bestTarget = low < high ? min[axis] : max[axis];
    }
  }
  predicted[base + bestAxis] = bestTarget;
};

/** The unit direction of the declared draught, or a zero vector for still air. */
const windAxis = (domain: IAutoMovieSoftBodyDomain): IAutoMovieVector3 => {
  const wind = domain.wind;
  if (wind === null) return { x: 0, y: 0, z: 0 };
  const length = Math.sqrt(
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

/**
 * The draught's signed acceleration at one step's start time.
 *
 * The gust is a triangle wave `4·|φ − ½| − 1` over the unit phase `φ = f·t −
 * ⌊f·t⌋`, so it runs from `+1` at the start of a period down to `−1` at its
 * middle and back. Every operation is exactly specified, which a sinusoid is
 * not; a curtain must billow the same way on every machine.
 */
const windAcceleration = (
  domain: IAutoMovieSoftBodyDomain,
  time: number,
): number => {
  const wind = domain.wind;
  if (wind === null) return 0;
  const cycles = wind.gustHz * time;
  const phase = cycles - Math.floor(cycles);
  return (
    wind.acceleration + wind.gustAcceleration * (4 * Math.abs(phase - 0.5) - 1)
  );
};

/** Whether every value of the array is a real number. */
const allFinite = (values: Float64Array): boolean => {
  for (let index = 0; index < values.length; ++index)
    if (Number.isFinite(values[index]) === false) return false;
  return true;
};
