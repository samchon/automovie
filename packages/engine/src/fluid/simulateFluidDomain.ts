import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidState,
} from "@automovie/interface";

/**
 * Integrate a fluid domain to one **absolute** step of its fixed clock.
 *
 * ## The equations
 *
 * The domain is a shallow-water field on an Arakawa C grid: water depth `h` at
 * cell centres over a bed elevation `b`, and horizontal velocity on the faces
 * between cells. Writing the free surface as `η = b + h`, one step advances
 *
 * ```text
 *   ∂u/∂t = −g·∂η/∂x − k·u                  (x momentum, on x faces)
 *   ∂v/∂t = −g·∂η/∂z − k·v                  (z momentum, on z faces)
 *   ∂h/∂t = −∂(h·u)/∂x − ∂(h·v)/∂z + q      (continuity, at cell centres)
 * ```
 *
 * With `k` the linear drag and `q` the declared source/drain volume rate per
 * unit area. Momentum is linearized — advection `u·∂u/∂x` is deliberately
 * absent — which is the bounded first tier this project committed to: a
 * gravity-wave solver for basins, channels, jets and ledges, not a
 * Navier-Stokes CFD and not a breaking-wave research code.
 *
 * Continuity is solved in **flux form** with a first-order upwind depth: the
 * volume crossing a face is `u · h_donor · dz · dt`, taken from whichever cell
 * the velocity points away from. Every interior face appears once with each
 * sign, so the only ways the total volume can change are a declared source, a
 * declared drain, and an `open` edge — which is exactly the mass-balance
 * contract this domain promises.
 *
 * ## Why it stays well behaved
 *
 * - **Lake at rest is exact.** The pressure term reads the free surface `η`, not
 *   the depth, so a still pond over an uneven bed produces a numerically exact
 *   zero gradient: velocities stay at zero and depths never drift, however many
 *   steps are integrated.
 * - **Depth never goes negative.** After the fluxes are known, each cell's total
 *   outgoing volume — faces plus drain — is compared with the water it actually
 *   holds and, if it exceeds it, every one of that cell's outgoing fluxes is
 *   scaled by the same factor. A face has exactly one donor, so scaling by the
 *   donor's factor leaves the shared face single-valued and mass still exactly
 *   conserved.
 * - **Dry land is not climbed.** A face against a dry cell carries no flow unless
 *   the wet side's free surface actually stands above the dry side's ground.
 * - **A wall reflects.** A `wall` edge, and every face touching a solid cell,
 *   pins the velocity to zero: the reflecting boundary condition.
 * - **An open edge spills.** An `open` edge behaves as a permanently dry
 *   neighbour at the boundary cell's own bed height, so water pours off the
 *   rim, never seeps back in, and the volume that left is counted.
 *
 * ## Stability
 *
 * The explicit scheme is stable while the Courant number of the gravity wave `c
 * = √(g·H)` stays at or below one:
 *
 * ```text
 *   dt · √(g · referenceDepth) · √(1/dx² + 1/dz²) ≤ 1
 * ```
 *
 * That is what {@link fluidCourantNumber} returns and what
 * {@link validateFluidDomain} refuses to exceed.
 *
 * ## Determinism
 *
 * The state is a pure function of `(domain, step)`. Nothing is cached between
 * calls, so seeking backwards, forwards, or in scattered order returns exactly
 * the same numbers as playing straight through — there is no runtime object for
 * an accumulation to hide in. Only `+ − × ÷` and `Math.sqrt` are used, all of
 * which IEEE-754 specifies exactly, so a domain whose authored numbers are
 * binary-exact reproduces bit for bit on Windows and POSIX alike.
 *
 * The domain is assumed to have passed {@link validateFluidDomain}: that pass is
 * where an array of the wrong length, a depth past the design depth, a source
 * pouring into solid matter, or an unstable step are refused with a path, so
 * the integrator never has to guess what an inconsistent record meant.
 *
 * Drag is applied implicitly, dividing each face's updated velocity by
 * `1 + dt·k`, so drag alone never reverses a face's velocity however large
 * `k·dt` is.
 *
 * Throws when `step` is not an integer in `[0, solver.maxSteps]`, and when the
 * state leaves the reals — a non-finite bed or depth, or a genuinely runaway
 * solve, is named at the step it first appeared rather than quietly turning
 * into NaN frames a renderer would draw as nothing at all.
 *
 * @evidence contracts/common.md#principled-implementation A linearized shallow-water solve on an Arakawa C grid with flux-form first-order upwind continuity, a donor-scaled positivity limiter, a free-surface pressure gradient for an exact lake at rest, and implicit drag, stable under the Courant bound the validator enforces; advection is deliberately absent, and the premise is a domain `validateFluidDomain` accepted.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the step loop in the order momentum, sources and drains, limiter, ledger, continuity, with `faceSpeed` holding the one face rule both axes share, so the scheme reads in the order it runs.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The only clamp, `max(0, updated)` on depth, absorbs roundoff after the limiter already bounded every outflow, and a non-finite state is thrown at the step it appears instead of being patched; no domain or boundary is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States the equations and the terms left out, how volume, positivity, dry land, walls and open edges behave, the stability bound, the determinism guarantee, the validation premise, the drag form, and both refusals.
 * @evidence contracts/performance.md#efficient-algorithms Each step is linear in cells plus faces plus declared sources and drains, so one call costs `O(step × cells)` time and a fixed set of typed arrays sized to the lattice; the replay from step zero is the price of a stateless seek and is bounded by `FLUID_MAX_STEPS` and `FLUID_MAX_CELLS` through the validator.
 * @evidence contracts/performance.md#reuse-equivalent-work Nothing is reused across calls, so a caller that samples every frame of a shot pays a total quadratic in the steps; that is an unresolved limitation of the stateless contract `IAutoMovieFluidState` declares, and no production caller samples per frame today.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Owns its typed scratch arrays only for the call and releases them on return or throw; the returned state copies depth and face velocities into fresh arrays the caller owns, sized by the lattice.
 */
export const simulateFluidDomain = (
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
        // Each axis is folded on its own before the two are added. Mirroring a
        // domain negates a face flux and swaps the pair, and a two-term sum is
        // exactly commutative in IEEE-754 while a four-term one is not: keeping
        // the axes apart is what makes a symmetric basin stay symmetric to the
        // last bit instead of drifting by an ulp per step.
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
 * `before`/`after` are the two cells the face separates in increasing index
 * order, an absent one already substituted by its dry ghost. The face is silent
 * — exactly zero, so a still lake stays still — when a wall or solid blocks it,
 * when neither side holds water, and when the only water present would have to
 * climb onto ground standing above its own free surface.
 */
const faceSpeed = (props: {
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

/** Whether a declared source or drain is open at this step's start time. */
const active = (start: number, end: number | null, time: number): boolean =>
  time >= start && (end === null || time < end);

/** Whether every value of every array is a real number. */
const allFinite = (arrays: Float64Array[]): boolean => {
  for (const values of arrays)
    for (let index: number = 0; index < values.length; ++index)
      if (Number.isFinite(values[index]) === false) return false;
  return true;
};
