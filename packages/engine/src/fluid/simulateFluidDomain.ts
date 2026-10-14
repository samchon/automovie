import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";

/**
 * Replay a caller-admitted fluid domain to one absolute step of its fixed clock.
 *
 * ## The equations
 *
 * The Arakawa C grid stores depth h at cell centres over bed elevation b and horizontal velocity on faces between cells. With free surface eta = b + h, each step approximates:
 *
 * ```text
 *   ∂u/∂t = −g·∂η/∂x − k·u                  (x momentum, on x faces)
 *   ∂v/∂t = −g·∂η/∂z − k·v                  (z momentum, on z faces)
 *   ∂h/∂t = −∂(h·u)/∂x − ∂(h·v)/∂z + q      (continuity, at cell centres)
 * ```
 *
 * `k` is linear drag and `q` is the declared source/drain volume rate per unit area. Momentum omits advection, so this gravity-wave approximation does not resolve full Navier-Stokes flow or breaking waves.
 *
 * Continuity uses first-order upwind flux `u * h_donor * dz * dt` on x faces and the analogous x-span expression on z faces. Each shared face enters neighboring updates with opposite signs; sources, drains and open edges supply the explicit ledger terms. Binary64 accumulation and the final depth clamp can introduce balance error.
 *
 * ## Face and outflow rules
 *
 * - Equal computed `bed + depth` elevations give zero pressure difference. An unchanged lake also needs closed edges, no effective sources/drains and representable arithmetic; multiplying depth by area then dividing can round even with zero flux.
 * - Each cell's requested drain and face outflow is scaled against its pre-source held volume. One donor supplies each face's scale, preserving a shared face flux; sources are added afterward and do not fund this step's outgoing limiter.
 * - A side at or below dryDepth blocks the face when its computed elevation is at least the other side's elevation. Subthreshold depth is still part of that elevation.
 * - Wall edges and faces touching solid cells have zero velocity.
 * - Open edges use a dry ghost at the interior bed height. An inward velocity has a ghost donor and contributes zero volume; outward flux is recorded in outflowVolume.
 *
 * ## Stability
 *
 * The validator compares the gravity-wave Courant expression at referenceDepth with one:
 *
 * ```text
 *   dt · √(g · referenceDepth) · √(1/dx² + 1/dz²) ≤ 1
 * ```
 *
 * `fluidCourantNumber` evaluates this expression directly. The validator's greater-than comparison misses derived NaN, and sources can raise depths beyond referenceDepth without another check, so passing admission does not prove stability throughout replay.
 *
 * ## Determinism
 *
 * Every call starts from the supplied depths with zero face velocities and retains no inter-call state. Unchanged inputs and arithmetic therefore follow the same operation order regardless of prior seeks. This is an in-process replay property, not observed Windows/POSIX byte identity or a GPU equivalence claim.
 *
 * The caller must run `validateFluidDomain`; replay does not repeat array, scalar, flow-site or budget admission. Sources and drains use step-start times in [start, end), with null end unbounded. A drain requests its full step volume only when the pre-update free surface exceeds sillLevel; the sill does not cap removal at that height.
 *
 * Drag divides the pressure-updated velocity by `1 + dt * drag`. For finite positive damping this reduces magnitude without reversing sign; damping and other intermediate products are not independently checked.
 *
 * Throws for a noninteger, negative or over-budget step and for non-finite depth/face velocities remaining after an update. Step zero skips that finite scan. The assignment `updated > 0 ? updated : 0` also turns NaN into zero before the scan, and clock, source/drain/outflow ledgers and final volume have no finite-result gate. Extreme finite flow products can therefore corrupt totals without a named refusal.
 *
 * @evidence contracts/common.md#principled-implementation Uses an Arakawa C grid, free-surface pressure, implicit drag and donor-scaled upwind continuity. Admission, representable intermediate arithmetic and suitable depths are premises; design-depth Courant admission alone does not establish them, and floating-point balance/rest preservation is conditional rather than exact for arbitrary finite inputs.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the step loop in the order momentum, sources and drains, limiter, ledger, continuity, with `faceSpeed` holding the one face rule both axes share, so the scheme reads in the order it runs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No domain or fixture is selected specially, but the nonpositive-depth ternary also hides NaN as zero, violating non-finite refusal. Derived clocks and ledger totals remain unchecked; the current finite scan covers only post-update depth and face velocities.
 * @evidence contracts/common.md#meaningful-documentation States the equations, omitted advection, boundary/limiter and activity/sill semantics, caller admission, conditional stability/replay properties and the exact finite-check gaps.
 * @evidence contracts/performance.md#efficient-algorithms With C cells, F faces, S sources, D drains and n requested steps, replay costs O(C + F + n * (C + F + S + D)) time and O(C + F) storage. Every face/cell is updated and checked each step; final volume and fresh array copies still cost O(C + F) at step zero. Validated dimensions and n are count-bounded, not elapsed-time measurements.
 * @evidence contracts/performance.md#reuse-equivalent-work Nothing is reused across calls, so a caller that samples every frame of a shot pays a total quadratic in the steps; that is an unresolved limitation of the stateless contract `IAutoMovieFluidState` declares, and no production caller samples per frame today.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Scratch arrays are call-local and become collectible after return or throw; no native handles or tasks are acquired. The caller owns fresh C depth and F velocity values in the result; copying overlaps scratch lifetime, and repeated results grow caller-held memory without an engine retention bound.
 */
export const simulateFluidDomain: (
  domain: IAutoMovieFluidDomain,
  step: number,
) => IAutoMovieFluidState = (
  domain: IAutoMovieFluidDomain,
  step: number,
): IAutoMovieFluidState => {
  if (!Number.isInteger(step) || step < 0)
    throw new Error(
      `fluid domain "${domain.id}" cannot be seeked to step ${step}: an absolute step must be a non-negative integer`,
    );
  if (step > domain.solver.maxSteps)
    throw new Error(
      `fluid domain "${domain.id}" cannot be seeked to step ${step}: the declared budget stops at ${domain.solver.maxSteps}`,
    );

  const columns: number = domain.grid.columns;
  const rows: number = domain.grid.rows;
  const cells: number = columns * rows;
  const dx: number = domain.grid.cellX;
  const dz: number = domain.grid.cellZ;
  const area: number = dx * dz;
  const dt: number = domain.solver.fixedStepSeconds;
  const gravity: number = domain.solver.gravity;
  const dry: number = domain.solver.dryDepth;
  const damping: number = 1 + dt * domain.solver.drag;

  const depth: Float64Array = Float64Array.from(domain.depth);
  const velocityX: Float64Array = new Float64Array((columns + 1) * rows);
  const velocityZ: Float64Array = new Float64Array(columns * (rows + 1));
  const fluxX: Float64Array = new Float64Array(velocityX.length);
  const fluxZ: Float64Array = new Float64Array(velocityZ.length);
  const donorX: Int32Array = new Int32Array(velocityX.length);
  const donorZ: Int32Array = new Int32Array(velocityZ.length);
  const sourceCell: Float64Array = new Float64Array(cells);
  const drainCell: Float64Array = new Float64Array(cells);
  const scale: Float64Array = new Float64Array(cells);

  let sourceVolume: number = 0;
  let drainVolume: number = 0;
  let outflowVolume: number = 0;

  for (let index: number = 0; index < step; ++index) {
    const time: number = index * dt;

    // ---- momentum and upwind flux on the x faces --------------------------
    for (let row: number = 0; row < rows; ++row)
      for (let column: number = 0; column <= columns; ++column) {
        const face: number = row * (columns + 1) + column;
        const left: number = column > 0 ? row * columns + column - 1 : -1;
        const right: number = column < columns ? row * columns + column : -1;
        const speed: number = faceSpeed({
          previous: velocityX[face],
          // An `open` edge is a permanently dry ghost cell at the interior
          // cell's own bed: water spills off the rim, nothing seeps back.
          blocked:
            (left < 0 && domain.boundaries.xMin === "wall") ||
            (right < 0 && domain.boundaries.xMax === "wall") ||
            (left >= 0 && domain.solid[left] === true) ||
            (right >= 0 && domain.solid[right] === true),
          bedBefore: left >= 0 ? domain.bed[left] : domain.bed[right],
          bedAfter: right >= 0 ? domain.bed[right] : domain.bed[left],
          depthBefore: left >= 0 ? depth[left] : 0,
          depthAfter: right >= 0 ? depth[right] : 0,
          dry,
          gravity,
          dt,
          span: dx,
          damping,
        });
        velocityX[face] = speed;
        const donor: number = speed > 0 ? left : speed < 0 ? right : -1;
        donorX[face] = donor;
        fluxX[face] = donor >= 0 ? speed * depth[donor] * dz * dt : 0;
      }

    // ---- momentum and upwind flux on the z faces --------------------------
    for (let row: number = 0; row <= rows; ++row)
      for (let column: number = 0; column < columns; ++column) {
        const face: number = row * columns + column;
        const back: number = row > 0 ? (row - 1) * columns + column : -1;
        const front: number = row < rows ? row * columns + column : -1;
        const speed: number = faceSpeed({
          previous: velocityZ[face],
          blocked:
            (back < 0 && domain.boundaries.zMin === "wall") ||
            (front < 0 && domain.boundaries.zMax === "wall") ||
            (back >= 0 && domain.solid[back] === true) ||
            (front >= 0 && domain.solid[front] === true),
          bedBefore: back >= 0 ? domain.bed[back] : domain.bed[front],
          bedAfter: front >= 0 ? domain.bed[front] : domain.bed[back],
          depthBefore: back >= 0 ? depth[back] : 0,
          depthAfter: front >= 0 ? depth[front] : 0,
          dry,
          gravity,
          dt,
          span: dz,
          damping,
        });
        velocityZ[face] = speed;
        const donor: number = speed > 0 ? back : speed < 0 ? front : -1;
        donorZ[face] = donor;
        fluxZ[face] = donor >= 0 ? speed * depth[donor] * dx * dt : 0;
      }

    // ---- declared sources and drains for this step ------------------------
    sourceCell.fill(0);
    drainCell.fill(0);
    for (const source of domain.sources) {
      if (active(source.start, source.end, time) === false) continue;
      sourceCell[source.row * columns + source.column] += source.flowRate * dt;
    }
    for (const drain of domain.drains) {
      if (active(drain.start, drain.end, time) === false) continue;
      const cell: number = drain.row * columns + drain.column;
      if (domain.bed[cell] + depth[cell] <= drain.sillLevel) continue;
      drainCell[cell] += drain.flowRate * dt;
    }

    // ---- positivity limiter ----------------------------------------------
    for (let row: number = 0; row < rows; ++row)
      for (let column: number = 0; column < columns; ++column) {
        const cell: number = row * columns + column;
        const westFace: number = row * (columns + 1) + column;
        const southFace: number = row * columns + column;
        let outgoing: number = drainCell[cell];
        if (fluxX[westFace] < 0) outgoing -= fluxX[westFace];
        if (fluxX[westFace + 1] > 0) outgoing += fluxX[westFace + 1];
        if (fluxZ[southFace] < 0) outgoing -= fluxZ[southFace];
        if (fluxZ[southFace + columns] > 0)
          outgoing += fluxZ[southFace + columns];
        const held: number = depth[cell] * area;
        scale[cell] = outgoing > held ? held / outgoing : 1;
      }
    for (let face: number = 0; face < fluxX.length; ++face)
      if (donorX[face] >= 0) fluxX[face] *= scale[donorX[face]];
    for (let face: number = 0; face < fluxZ.length; ++face)
      if (donorZ[face] >= 0) fluxZ[face] *= scale[donorZ[face]];

    // ---- the volume ledger ------------------------------------------------
    for (let cell: number = 0; cell < cells; ++cell) {
      drainCell[cell] *= scale[cell];
      drainVolume += drainCell[cell];
      sourceVolume += sourceCell[cell];
    }
    for (let row: number = 0; row < rows; ++row) {
      // A boundary face's donor is the ghost whenever the flow points inward,
      // and a ghost is dry, so a boundary flux is either zero or outward.
      outflowVolume -= fluxX[row * (columns + 1)];
      outflowVolume += fluxX[row * (columns + 1) + columns];
    }
    for (let column: number = 0; column < columns; ++column) {
      outflowVolume -= fluxZ[column];
      outflowVolume += fluxZ[rows * columns + column];
    }

    // ---- continuity --------------------------------------------------------
    for (let row: number = 0; row < rows; ++row)
      for (let column: number = 0; column < columns; ++column) {
        const cell: number = row * columns + column;
        const westFace: number = row * (columns + 1) + column;
        const southFace: number = row * columns + column;
        // Pair opposing fluxes per axis before combining them. This preserves
        // the same grouping under a mirrored face pair; it is not a guarantee
        // that arbitrary rounded inputs or the whole solve remain symmetric.
        const netX: number = fluxX[westFace] - fluxX[westFace + 1];
        const netZ: number = fluxZ[southFace] - fluxZ[southFace + columns];
        const net: number = netX + netZ + (sourceCell[cell] - drainCell[cell]);
        const updated: number = (depth[cell] * area + net) / area;
        depth[cell] = updated > 0 ? updated : 0;
      }

    if (allFinite([depth, velocityX, velocityZ]) === false)
      throw new Error(
        `fluid domain "${domain.id}" produced a non-finite state at step ${index + 1}`,
      );
  }

  let volume: number = 0;
  for (let cell: number = 0; cell < cells; ++cell) volume += depth[cell] * area;
  return {
    domain: domain.id,
    step,
    time: step * dt,
    depth: Array.from(depth),
    velocityX: Array.from(velocityX),
    velocityZ: Array.from(velocityZ),
    volume,
    sourceVolume,
    drainVolume,
    outflowVolume,
  };
};

/**
 * One face's velocity after this step's momentum update.
 *
 * `before`/`after` separate the face in increasing index order, with absent cells replaced by dry ghosts. Walls/solids return zero before arithmetic; a side at or below dryDepth also blocks when its bed-plus-depth elevation is at least the opposite elevation. Otherwise pressure updates the previous velocity before implicit damping. All work is scalar and call-local; finite inputs can still produce non-finite sums/products, which the owning replay checks only after its update.
 */
const faceSpeed: (props: {
  previous: number;
  blocked: boolean;
  bedBefore: number;
  bedAfter: number;
  depthBefore: number;
  depthAfter: number;
  dry: number;
  gravity: number;
  dt: number;
  span: number;
  damping: number;
}) => number = (props: {
  previous: number;
  blocked: boolean;
  bedBefore: number;
  bedAfter: number;
  depthBefore: number;
  depthAfter: number;
  dry: number;
  gravity: number;
  dt: number;
  span: number;
  damping: number;
}): number => {
  if (props.blocked) return 0;
  const etaBefore: number = props.bedBefore + props.depthBefore;
  const etaAfter: number = props.bedAfter + props.depthAfter;
  const wetBefore: boolean = props.depthBefore > props.dry;
  const wetAfter: boolean = props.depthAfter > props.dry;
  if (wetBefore === false && etaAfter <= etaBefore) return 0;
  if (wetAfter === false && etaBefore <= etaAfter) return 0;
  return (
    (props.previous -
      (props.dt * props.gravity * (etaAfter - etaBefore)) / props.span) /
    props.damping
  );
};

/** Scalar half-open activity test at the step start; null end is unbounded. Admission belongs to the caller, and the predicate neither retains nor clamps its inputs. */
const active: (start: number, end: number | null, time: number) => boolean = (
  start: number,
  end: number | null,
  time: number,
): boolean => time >= start && (end === null || time < end);

/** Scan borrowed arrays until the first non-finite entry, with O(total entries) time and constant local storage. The caller supplies depth/velocities only; this does not inspect ledgers, clocks or pre-clamp intermediates. */
const allFinite: (arrays: Float64Array[]) => boolean = (
  arrays: Float64Array[],
): boolean => {
  for (const values of arrays)
    for (let index: number = 0; index < values.length; ++index)
      if (Number.isFinite(values[index]) === false) return false;
  return true;
};
