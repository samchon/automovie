import { IAutoMovieFluidBoundaries } from "./IAutoMovieFluidBoundaries";
import { IAutoMovieFluidDrain } from "./IAutoMovieFluidDrain";
import { IAutoMovieFluidGrid } from "./IAutoMovieFluidGrid";
import { IAutoMovieFluidSolver } from "./IAutoMovieFluidSolver";
import { IAutoMovieFluidSource } from "./IAutoMovieFluidSource";
import { IAutoMovieFluidSpray } from "./IAutoMovieFluidSpray";

/**
 * One independent deterministic fluid computation domain.
 *
 * The record is deliberately **not** a member of the architecture package. A
 * pond in an atrium, a circulating channel around a courtyard, a fountain basin
 * and a falling water wall are all the same computational object as a tank in a
 * production world with no building at all; the building only _binds_ a domain
 * to one of its logical spaces (see `IAutoMovieWaterFeature`). Making the
 * solver a child of the building would make the same water two different things
 * depending on who owns the frame.
 *
 * The state is a **fixed grid, fixed step** shallow-water field: a per-cell
 * water depth over a per-cell bed elevation plus horizontal face velocities.
 * That is a bounded first tier on purpose. It is not an arbitrary 3D
 * Navier-Stokes solver, it does not resolve breaking waves, vertical
 * recirculation, or surface tension, and it does not promise byte-identical
 * results from a GPU projection: the CPU reference state defined here is the
 * only normative one.
 *
 * All cell-indexed arrays are **row-major**: index `row * grid.columns +
 * column`, with `column` increasing along `+x` and `row` along `+z`.
 *
 * The authored state is **water at rest**: a domain states depths over a bed,
 * and every face velocity starts at zero. Motion comes from what the water
 * cannot be in equilibrium with — an uneven free surface, a declared source or
 * drain, an open rim — so an initial velocity field is not a thing an author
 * has to invent, and two authors cannot state the same current twice.
 *
 * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `IAutoMovieFluidDomain` as the portable data boundary for the interior fluid initial boundary record requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `IAutoMovieFluidDomain` for the interior space water feature fluid domain system contract.
 */
export interface IAutoMovieFluidDomain {
  /**
   * Schema version.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `version` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `version` for the interior space water feature fluid domain system contract.
   */
  version: 1;

  /**
   * Stable identity of this fluid domain.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `id` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `id` for the interior space water feature fluid domain system contract.
   */
  id: string;

  /**
   * All authored lengths are measured in metres.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `units` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `units` for the interior space water feature fluid domain system contract.
   */
  units: "meter";

  /**
   * Fixed computational lattice.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `grid` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `grid` for the interior space water feature fluid domain system contract.
   */
  grid: IAutoMovieFluidGrid;

  /**
   * Fixed-step integration settings and declared budgets.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `solver` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `solver` for the interior space water feature fluid domain system contract.
   */
  solver: IAutoMovieFluidSolver;

  /**
   * Which side of the lattice reflects and which lets water leave.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `boundaries` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `boundaries` for the interior space water feature fluid domain system contract.
   */
  boundaries: IAutoMovieFluidBoundaries;

  /**
   * Bed elevation of every cell in metres **above `grid.origin.y`**, row-major.
   * Length must be exactly `grid.columns * grid.rows`. The world elevation of
   * dry ground in a cell is therefore `grid.origin.y + bed[k]`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `bed` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `bed` for the interior space water feature fluid domain system contract.
   */
  bed: number[];

  /**
   * Initial water depth of every cell in metres, row-major, each `>= 0`. The
   * world elevation of the free surface is `grid.origin.y + bed[k] +
   * depth[k]`.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `depth` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `depth` for the interior space water feature fluid domain system contract.
   */
  depth: number[];

  /**
   * Cells occupied by solid matter (a pier, an island, a channel wall). A solid
   * cell holds no water and every face touching it reflects. Length must be
   * exactly `grid.columns * grid.rows`, row-major.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `solid` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `solid` for the interior space water feature fluid domain system contract.
   */
  solid: boolean[];

  /**
   * Declared inflows. Water they add is counted, never invented silently.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `sources` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `sources` for the interior space water feature fluid domain system contract.
   */
  sources: IAutoMovieFluidSource[];

  /**
   * Declared outflows such as a fountain return or a basin overflow.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `drains` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `drains` for the interior space water feature fluid domain system contract.
   */
  drains: IAutoMovieFluidDrain[];

  /**
   * Decorative bounded spray emitters. Spray is **not** part of the conserved
   * water: it is a bounded particle garnish sampled from the same clock, and
   * its mass never enters or leaves the depth field.
   *
   * @evidence requirements/interior/water-and-fluid-features.md#interior-fluid-initial-boundary-record Exposes `sprays` as the portable data boundary for the interior fluid initial boundary record requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-water-feature-fluid-domain Types `sprays` for the interior space water feature fluid domain system contract.
   */
  sprays: IAutoMovieFluidSpray[];
}
