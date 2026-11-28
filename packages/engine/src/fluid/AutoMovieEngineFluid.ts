import { fluidCourantNumber as fluidCourantNumberImplementation } from "./internal/fluidCourantNumber";
import { fluidDomainBudget as fluidDomainBudgetImplementation } from "./internal/fluidDomainBudget";
import { fluidStateDigest as fluidStateDigestImplementation } from "./internal/fluidStateDigest";
import { fluidSurfaceGeometry as fluidSurfaceGeometryImplementation } from "./internal/fluidSurfaceGeometry";
import { lowerWaterFeature as lowerWaterFeatureImplementation } from "./internal/lowerWaterFeature";
import { sampleFluidDomain as sampleFluidDomainImplementation } from "./internal/sampleFluidDomain";
import { sampleFluidSpray as sampleFluidSprayImplementation } from "./internal/sampleFluidSpray";
import { simulateFluidDomain as simulateFluidDomainImplementation } from "./internal/simulateFluidDomain";
import { validateFluidDomain as validateFluidDomainImplementation } from "./internal/validateFluidDomain";
import { validateWaterFeatures as validateWaterFeaturesImplementation } from "./internal/validateWaterFeatures";

import type {
  IAutoMovieFluidBudget,
  IAutoMovieFluidDomain,
  IAutoMovieFluidSurfaceGeometry,
  IAutoMovieFluidSurface,
  IAutoMovieLowerWaterFeature,
  IAutoMovieWaterFeatureFrame,
  IAutoMovieFluidState,
  IAutoMovieSampleFluidSpray,
  IAutoMovieFluidSpraySample,
  IAutoMovieValidateFluidDomain,
  IAutoMovieValidateWaterFeatures,
  IAutoMovieValidation,
} from "@automovie/interface";

/** Canonical diagnostics for deterministic shallow-water domains. */
export namespace AutoMovieEngineFluid {
  /**
   * The domain's gravity-wave Courant expression `dt * sqrt(g * H) * sqrt(1/dx² +
   * 1/dz²)`, with H the solver's design referenceDepth.
   *
   * `validateFluidDomain` compares this number with `1` at the declared design
   * depth, and `fluidDomainBudget` reports it without admission. Initial depth is
   * checked against that design depth, but later inflow can exceed it without
   * another Courant check.
   *
   * Pass positive finite timestep, gravity, design depth and cell dimensions.
   * Extreme inputs are scaled before combining their magnitudes. The final
   * number rounds to zero or `Infinity` at the limits of binary64.
   */
  export function fluidCourantNumber(domain: IAutoMovieFluidDomain): number {
    return fluidCourantNumberImplementation(domain);
  }

  /**
   * Declared lattice, state-payload and spray counts derived from one fluid
   * domain.
   *
   * No step is integrated. `measureRenderSimulation` consumes the cell count and
   * spray cap; `validateFluidDomain` separately enforces authored population
   * budgets. The `courant` field uses the same calculation as the validator.
   * Estimates from an unvalidated record can be nonfinite.
   *
   * `stateBytes` counts eight bytes per depth or face velocity, excluding
   * JavaScript array/object overhead, solver scratch arrays, surface buffers and
   * spray storage. `worstCaseCellUpdates` is cells times maxSteps for one maximum
   * seek, excluding face/flow work and repeated stateless seeks.
   */
  export function fluidDomainBudget(
    domain: IAutoMovieFluidDomain,
  ): IAutoMovieFluidBudget {
    return fluidDomainBudgetImplementation(domain);
  }

  /**
   * A 32-bit FNV-1a digest of selected fluid-state numbers, as eight lowercase
   * hex digits.
   *
   * The bytes are the little-endian IEEE-754 doubles of step, every depth, every
   * x and z face velocity, then the volume, source, drain and outflow ledgers, in
   * that order; domain, time and array lengths are omitted. Equal serialized
   * sequences hash alike, and a mismatch identifies a difference in that
   * sequence. A match cannot prove state identity: the 32-bit hash collides,
   * omitted fields are invisible, and array partition boundaries are not encoded.
   * No collision probability is established for this workload.
   *
   * Signed zero is serialized distinctly. DataView serializes the JavaScript
   * Number value; NaN payload preservation across runtimes is not guaranteed, and
   * this helper performs no finite-state admission.
   */
  export function fluidStateDigest(state: IAutoMovieFluidState): string {
    return fluidStateDigestImplementation(state);
  }

  /**
   * Derive the drawable free surface of one solved fluid state.
   *
   * Numerical mesh derivation belongs to the engine; the viewer copies these
   * attributes into Float32 buffers. That projection does not preserve every
   * binary64 bit or establish rendered pixel equality.
   *
   * One vertex per cell lies at its centre and world height origin.y + bed +
   * depth in row-major cell order. A quad is triangulated only when all four
   * corner cells have depth > solver.dryDepth and none is solid. Thus drained or
   * singleton-axis lattices have no triangles; nondegenerate X/Z spacing gives
   * counter-clockwise winding seen from above and a positive Y cross-product
   * component.
   *
   * Normals use `normalize(-dEta/dX, 1, -dEta/dZ)` from central differences,
   * one-sided differences at edges, and zero slope on a singleton axis. They do
   * not infer submerged/solid boundary slopes separately. Equal computed
   * elevations give flat normals when derived arithmetic is representable; a
   * singleton on one axis leaves the other axis's slope intact.
   *
   * IAutoMovieFluidSurface.flow is the per-cell average of its two x faces and of
   * its two z faces. The viewer uploads flow for supplied shaders; its default
   * material does not use it to animate ripples. UVs span [0, 1] independently on
   * each axis, or zero on a singleton. bounds measures only triangle-referenced
   * vertices and is null when no quad is drawn, even though all cell vertices
   * remain in the mesh.
   *
   * Throws for a mismatched state domain id. Matching ids do not validate
   * provenance, array lengths or finite fields; caller admission and a compatible
   * solved state are required. Extreme finite sums, slopes, squared normal
   * lengths and face averages have no finite-result gate.
   */

  export function fluidSurfaceGeometry(
    props: IAutoMovieFluidSurfaceGeometry.IProps,
  ): IAutoMovieFluidSurface {
    return fluidSurfaceGeometryImplementation(props);
  }

  /**
   * Lower one bound water feature to its state, surface and spray at a shot
   * second.
   *
   * A static feature reads step zero and ignores time; flowing and simulated use
   * sampleFluidDomain's converted step for the shot second. The latter modes use
   * the same solve for unchanged domain/time, while static can intentionally
   * differ. The viewer records flowing as metadata; its stock material does not
   * consume that flag or flow vectors for animation.
   *
   * Throws for a feature/domain id mismatch and propagates child failures.
   * Non-finite time is refused only for nonstatic modes; non-finite camera
   * distance is refused for every mode. The caller must run domain/binding
   * admission, whose documented arithmetic and containment gaps remain; lowering
   * does not revalidate them.
   */

  export function lowerWaterFeature(
    props: IAutoMovieLowerWaterFeature.IProps,
  ): IAutoMovieWaterFeatureFrame {
    return lowerWaterFeatureImplementation(props);
  }

  /**
   * Sample a fluid domain at a shot second using its fixed-step clock.
   *
   * The selected step is `floor(max(time, 0) / fixedStepSeconds + 1e-9)`. The
   * step-fraction allowance can advance a time just before a boundary as well as
   * compensate division roundoff; this is not an unconditional floor of the
   * original quotient. Equivalent converted steps use the same stateless solve
   * regardless of playback frame rate.
   *
   * A finite negative second reads step 0 for an admitted domain. Non-finite time
   * throws here, while an invalid or over-budget converted step throws from
   * `simulateFluidDomain`. Domain admission and the integrator's numerical limits
   * still apply.
   */

  export function sampleFluidDomain(
    domain: IAutoMovieFluidDomain,
    time: number,
  ): IAutoMovieFluidState {
    return sampleFluidDomainImplementation(domain, time);
  }

  /**
   * Sample the decorative spray of a fluid domain at one solved state.
   *
   * Decorative particles do not change depths or volume ledgers. The supplied
   * state and domain must have matching ids; that check alone does not establish
   * state provenance, array layout or finite fields.
   *
   * Particle i has nominal birth i / rate and age time - i / rate. Its position
   * is `p0 + direction * speed * age - gravity * age² / 2 * y`, where p0 is the
   * emitter cell's free surface in the supplied current state, shared by all its
   * particles. Historical spawn heights are not reconstructed. Direction
   * normalizes the axis, adds seeded per-component jitter scaled by spread, then
   * normalizes again.
   *
   * LOD keeps spawn indices divisible by `1 + floor(max(cameraDistance, 0) /
   * lodDistance)`; the maxParticles cap then keeps the newest survivors. This
   * assumes representable live-window and stride arithmetic.
   *
   * Particles are returned per emitter in declaration order and, for
   * representable indices, in increasing spawn order. LOD and caps are applied in
   * the CPU sample; this does not prove GPU display agreement.
   *
   * Throws for a mismatched state domain id or an unrepresentable LOD stride.
   * Negative distance uses the nearest LOD, and omitted distance defaults to
   * zero. The caller admits the domain before sampling.
   */

  export function sampleFluidSpray(
    props: IAutoMovieSampleFluidSpray.IProps,
  ): IAutoMovieFluidSpraySample {
    return sampleFluidSprayImplementation(props);
  }

  /**
   * Replay a caller-admitted fluid domain to one absolute step of its fixed
   * clock.
   *
   * ## The equations
   *
   * The Arakawa C grid stores depth h at cell centres over bed elevation b and
   * horizontal velocity on faces between cells. With free surface eta = b + h,
   * each step approximates:
   *
   * ```text
   *   ∂u/∂t = −g·∂η/∂x − k·u                  (x momentum, on x faces)
   *   ∂v/∂t = −g·∂η/∂z − k·v                  (z momentum, on z faces)
   *   ∂h/∂t = −∂(h·u)/∂x − ∂(h·v)/∂z + q      (continuity, at cell centres)
   * ```
   *
   * `k` is linear drag and `q` is the declared source/drain volume rate per unit
   * area. Momentum omits advection, so this gravity-wave approximation does not
   * resolve full Navier-Stokes flow or breaking waves.
   *
   * Continuity uses first-order upwind flux `u * h_donor * dz * dt` on x faces
   * and the analogous x-span expression on z faces. Each shared face enters
   * neighboring updates with opposite signs; sources, drains and open edges
   * supply the explicit ledger terms. Binary64 accumulation and the final depth
   * clamp can introduce balance error.
   *
   * ## Face and outflow rules
   *
   * - Equal computed `bed + depth` elevations give zero pressure difference. An
   *   unchanged lake also needs closed edges, no effective sources/drains and
   *   representable arithmetic; multiplying depth by area then dividing can round
   *   even with zero flux.
   * - Each cell's requested drain and face outflow is scaled against its pre-source
   *   held volume. One donor supplies each face's scale, preserving a shared face
   *   flux; sources are added afterward and do not fund this step's outgoing
   *   limiter.
   * - A side at or below dryDepth blocks the face when its computed elevation is at
   *   least the other side's elevation. Subthreshold depth is still part of that
   *   elevation.
   * - Wall edges and faces touching solid cells have zero velocity.
   * - Open edges use a dry ghost at the interior bed height. An inward velocity has
   *   a ghost donor and contributes zero volume; outward flux is recorded in
   *   outflowVolume.
   *
   * ## Stability
   *
   * The validator compares the gravity-wave Courant expression at referenceDepth
   * with one:
   *
   * ```text
   *   dt · √(g · referenceDepth) · √(1/dx² + 1/dz²) ≤ 1
   * ```
   *
   * `fluidCourantNumber` scales extreme operands before evaluating the bound.
   * Admission checks the authored design depth. Sources can raise the simulated
   * depth beyond that value during replay.
   *
   * ## Determinism
   *
   * Every call starts from the supplied depths with zero face velocities and
   * retains no inter-call state. Unchanged inputs and arithmetic therefore follow
   * the same operation order regardless of prior seeks. This is an in-process
   * replay property, not observed Windows/POSIX byte identity or a GPU
   * equivalence claim.
   *
   * The caller must run `validateFluidDomain`; replay does not repeat array,
   * scalar, flow-site or budget admission. Sources and drains use step-start
   * times in [start, end), with null end unbounded. A drain requests its full
   * step volume only when the pre-update free surface exceeds sillLevel; the sill
   * does not cap removal at that height.
   *
   * Drag divides the pressure-updated velocity by `1 + dt * drag`. For finite
   * positive damping this reduces magnitude without reversing sign; damping and
   * other intermediate products are not independently checked.
   *
   * A replay uses whole absolute steps within the domain's declared budget. Each
   * computed face velocity and depth update must fit in the field before it is
   * written. The depth clamp applies only after this check, so it cannot turn an
   * indeterminate update into an apparently dry cell.
   */

  export function simulateFluidDomain(
    domain: IAutoMovieFluidDomain,
    step: number,
  ): IAutoMovieFluidState {
    return simulateFluidDomainImplementation(domain, step);
  }

  /**
   * Validate a fluid domain's lattice, budgets, stability, and declared flows.
   *
   * For a structurally typed domain, checks schema/id, safe positive grid counts,
   * finite authored scalars, count budgets, per-cell array lengths/values,
   * boundary vocabulary, nonsolid source/drain/spray sites, activity windows and
   * sibling identities. Initial depths must lie in [0, referenceDepth], and solid
   * cells must start dry. Violations retain field paths and authored values;
   * inputs are not modified.
   *
   * The Courant comparison runs only when its five authored inputs are finite and
   * positive. A computed value above one, including Infinity, is refused at
   * `solver.fixedStepSeconds`. Admission also does not bound finite area,
   * damping, clock, flow accumulation or spray-index products, and later water
   * depth may exceed referenceDepth. It does not certify every derived
   * solver/surface/spray result or perform general unknown-object shape
   * admission.
   */

  export function validateFluidDomain(
    props: IAutoMovieValidateFluidDomain.IProps,
  ): IAutoMovieValidation {
    return validateFluidDomainImplementation(props);
  }

  /**
   * Validate bindings between independent fluid domains and a building's water
   * features.
   *
   * Joins a feature's environment, space, rim and domain ids without adding
   * architecture fields to fluid domains. The supplied environment must already
   * be structurally admitted; space and boundary maps resolve duplicate ids
   * last-wins without validating those environment identities here. Rim
   * membership uses the boundary's spaces list, and material checks reject blank
   * ids without resolving a material catalogue.
   *
   * Every supplied domain is validated with validateFluidDomain, cited or not,
   * and violations are re-pathed to $input.domains[i]. Duplicate domain ids are
   * refused; features resolve both domain and validation verdict from the last
   * record with that id.
   *
   * A volume-less root basin and a domain rejected by validateFluidDomain skip
   * geometry. Other bindings test cell centres at origin.y + bed against the
   * root/descendant spaces using builtSpaceContainsPoint's numerical tolerances.
   * The test does not measure the full cell footprint or water height.
   *
   * Every bed point is checked in row-major order, including in convex basins:
   * arbitrary interior bed elevations need not lie in the corners' convex hull.
   * This initial bed-centre check does not certify future solved surfaces fit the
   * basin.
   */

  export function validateWaterFeatures(
    props: IAutoMovieValidateWaterFeatures.IProps,
  ): IAutoMovieValidation {
    return validateWaterFeaturesImplementation(props);
  }

}
