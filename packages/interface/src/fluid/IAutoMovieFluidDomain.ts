import { IAutoMovieFluidBoundaries } from "./IAutoMovieFluidBoundaries";
import { IAutoMovieFluidDrain } from "./IAutoMovieFluidDrain";
import { IAutoMovieFluidGrid } from "./IAutoMovieFluidGrid";
import { IAutoMovieFluidSolver } from "./IAutoMovieFluidSolver";
import { IAutoMovieFluidSource } from "./IAutoMovieFluidSource";
import { IAutoMovieFluidSpray } from "./IAutoMovieFluidSpray";

/**
 * One independent deterministic fluid computation domain.
 *
 * A domain is independent of architecture: IAutoMovieWaterFeature binds it to a logical basin, while a building-free production can use the same domain directly. The grid, state and flow model do not depend on which record owns its placement.
 *
 * The fixed-grid, fixed-step shallow-water state stores cell depths/bed elevations and horizontal face velocities. It does not resolve 3D Navier-Stokes flow, breaking waves, vertical recirculation or surface tension. simulateFluidDomain's CPU state is normative; GPU projection supplies no byte-identity guarantee.
 *
 * Cell arrays are row-major at row * grid.columns + column, with columns increasing along +X and rows along +Z.
 *
 * Authored initial depths sit over the bed with zero face velocity. An uneven free surface, declared flow or open rim drives subsequent motion; this record exposes no initial velocity field.
 *
 * The solver assumes caller-run validateFluidDomain admission for version 1, metre units, identity, array lengths, finite authored values, initial depths within design depth, nonsolid flow sites and count budgets. It does not repeat those checks. The Courant comparison uses the initial design depth and can miss derived NaN; integration and surface/spray arithmetic retain separate finite-result and representation limits.
 *
 * @evidence contracts/common.md#principled-implementation The explicit linearized shallow-water field uses an Arakawa C grid, with centre depths/beds and face velocities. Flux-form updates target conservation except declared sources, drains and open edges; the design-depth Courant premise and finite representable arithmetic are necessary, while current validation and integration leave the numerical gaps documented on the solver/state types.
 * @evidence contracts/common.md#clear-and-simple-design The domain owns only lattice, solver settings, edges, per-cell arrays and declared flows; its placement in a building is a separate `IAutoMovieWaterFeature` binding, so the same record serves a building basin and a building-free world.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Initial face velocities are zero and motion derives from surface/flow inputs. Caller-run validation rejects its stated field violations without rewriting them, but the integrator assumes admission, clamps nonpositive depth and does not independently close every derived-arithmetic gap.
 * @evidence contracts/common.md#meaningful-documentation States why the domain is independent of architecture, the model and what it does not resolve, the normative CPU state, the row-major layout, the at-rest initial state, and the validation preconditions; members give units, lengths, datums and caps.
 */
export interface IAutoMovieFluidDomain {
  /** Schema version; the validator accepts only `1`. */
  version: 1;

  /**
   * Stable, nonblank identity; validateWaterFeatures also rejects duplicate domain ids in the supplied binding population.
   */
  id: string;

  /** All authored lengths are measured in metres. */
  units: "meter";

  /** Fixed computational lattice. */
  grid: IAutoMovieFluidGrid;

  /** Fixed-step integration settings and declared budgets. */
  solver: IAutoMovieFluidSolver;

  /** Which side of the lattice reflects and which lets water leave. */
  boundaries: IAutoMovieFluidBoundaries;

  /**
   * Finite cell bed elevations in metres above grid.origin.y, row-major with grid.columns * grid.rows entries. Dry ground's world height is grid.origin.y + bed[k].
   */
  bed: number[];

  /**
   * Initial cell water depths in metres, row-major, each finite and within [0, solver.referenceDepth]. The free surface's world height is grid.origin.y + bed[k] + depth[k].
   */
  depth: number[];

  /**
   * Solid-cell flags in row-major order, with grid.columns * grid.rows booleans. A solid cell must have zero depth, touching faces reflect, and no source, drain or spray may occupy it.
   */
  solid: boolean[];

  /** Declared inflows, at most 256, whose added volume is counted. */
  sources: IAutoMovieFluidSource[];

  /**
   * Declared outflows such as a return or overflow, at most 256, whose removed volume is counted.
   */
  drains: IAutoMovieFluidDrain[];

  /**
   * Decorative spray emitters, at most 32, sampled on the same clock outside the conserved depth field. Their particle mass is not added to or removed from water depth.
   */
  sprays: IAutoMovieFluidSpray[];
}
