import {
  IAutoMovieFluidDomain,
  IAutoMovieFluidDrain,
  IAutoMovieFluidSource,
  IAutoMovieFluidSpray,
  IAutoMovieValidation,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { ViolationCollector } from "../validation/ViolationCollector";
import { validateRange } from "../validation/validateRange";
import { FLUID_MAX_CELLS } from "./constants/FLUID_MAX_CELLS";
import { FLUID_MAX_FLOWS } from "./constants/FLUID_MAX_FLOWS";
import { FLUID_MAX_SPRAYS } from "./constants/FLUID_MAX_SPRAYS";
import { FLUID_MAX_SPRAY_PARTICLES } from "./constants/FLUID_MAX_SPRAY_PARTICLES";
import { FLUID_MAX_STEPS } from "./constants/FLUID_MAX_STEPS";
import { fluidCourantNumber } from "./fluidCourantNumber";

/** Closed boundary vocabulary read by the four edge checks; module-owned constant-size lookup with no mutation after construction. */
const BOUNDARY_KINDS: ReadonlySet<string> = new Set(["wall", "open"]);

/** Every solver edge, visited in diagnostic order without building per-domain key lists. */
const EDGES: readonly ["xMin", "xMax", "zMin", "zMax"] = ["xMin", "xMax", "zMin", "zMax"];

/**
 * Validate a fluid domain's lattice, budgets, stability, and declared flows.
 *
 * For a structurally typed domain, checks schema/id, safe positive grid counts, finite authored scalars, count budgets, per-cell array lengths/values, boundary vocabulary, nonsolid source/drain/spray sites, activity windows and sibling identities. Initial depths must lie in [0, referenceDepth], and solid cells must start dry. Violations retain field paths and authored values; inputs are not modified.
 *
 * The Courant comparison runs only when its five authored inputs are finite and positive. A computed value above one, including Infinity, is refused; derived NaN is missed by that comparison. Admission also does not bound finite area, damping, clock, flow accumulation or spray-index products, and later water depth may exceed referenceDepth. It does not certify every derived solver/surface/spray result or perform general unknown-object shape admission.
 *
 * @evidence contracts/common.md#principled-implementation Checks authored scalar domains, indexed-array cardinality and population/site constraints before callers integrate. The design-depth Courant expression is rejected only when greater than one; representable intermediate arithmetic, future depth stability and valid object structure remain premises rather than guarantees of this pass.
 * @evidence contracts/common.md#clear-and-simple-design One linear pass per field group with private helpers for integer, length, budget, identity, cell-site and activity-window rules; finite intervals use the shared `validateRange` and blank ids the collector's `nonEmpty`, so no range or blank rule is restated here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No authored value is clamped or defaulted; named budgets apply uniformly. A broken referenceDepth uses Infinity only as the depth-check ceiling to avoid repeated dependent findings. Finite cell products past the budget are refused even outside safe-integer precision, while the derived-NaN Courant bypass remains unresolved.
 * @evidence contracts/common.md#meaningful-documentation Gives the field groups checked, path/value preservation, typed-object premise and the derived arithmetic/depth limits that admission leaves to consumers.
 * @evidence contracts/performance.md#efficient-algorithms Time is linear in actual bed/depth/solid array lengths, source/drain/spray counts and id text, even when declared counts are invalid or over budget. Full array scans name bad entries after cardinality/budget findings; id sets avoid sibling rescans, and findings plus distinct ids determine temporary/result storage.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A single validation pass per call; nothing is shared across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing; the collector and id sets die with the call, and the returned violations, at most a few per declared field, belong to the caller.
 */
export const validateFluidDomain: (props: { domain: IAutoMovieFluidDomain }) => IAutoMovieValidation = (props: {
  domain: IAutoMovieFluidDomain;
}): IAutoMovieValidation => {
  const domain: IAutoMovieFluidDomain = props.domain;
  const out: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  out.nonEmpty(`${root}.id`, domain.id, "fluid domain id");
  if (domain.version !== 1)
    out.push(
      "type",
      `${root}.version`,
      `fluid domain schema version must be 1, but was ${String(domain.version)}`,
      domain.version,
    );
  if (domain.units !== "meter")
    out.push(
      "type",
      `${root}.units`,
      `fluid domain units must be "meter", but was ${String(domain.units)}`,
      domain.units,
    );

  const columns: number = domain.grid.columns;
  const rows: number = domain.grid.rows;
  integer(out, `${root}.grid.columns`, "grid columns", columns, 1, Infinity);
  integer(out, `${root}.grid.rows`, "grid rows", rows, 1, Infinity);
  positive(out, `${root}.grid.cellX`, "cell size x", domain.grid.cellX);
  positive(out, `${root}.grid.cellZ`, "cell size z", domain.grid.cellZ);
  for (const axis of ["x", "y", "z"] as const)
    validateRange(
      domain.grid.origin[axis],
      `${root}.grid.origin.${axis}`,
      -Infinity,
      Infinity,
      `grid origin ${axis}`,
      out.items,
    );
  const cells: number = columns * rows;
  // Finite rather than safe-integer: a 2³⁰ × 2³⁰ lattice counts 2⁶⁰ cells,
  // which is past `Number.MAX_SAFE_INTEGER`, and a guard that skipped exactly
  // the grids too large to count would let the only ones nobody can afford
  // past the one budget written to refuse them. A non-finite product means
  // `columns` or `rows` is itself unusable and has already been named.
  if (Number.isFinite(cells) && cells > FLUID_MAX_CELLS)
    out.push(
      "range",
      `${root}.grid`,
      `fluid lattice must hold at most ${FLUID_MAX_CELLS} cells, but declared ${cells}`,
      cells,
      cells - FLUID_MAX_CELLS,
    );

  const solver: IAutoMovieFluidDomain["solver"] = domain.solver;
  positive(out, `${root}.solver.fixedStepSeconds`, "fixed step", solver.fixedStepSeconds);
  positive(out, `${root}.solver.gravity`, "gravity", solver.gravity);
  validateRange(solver.drag, `${root}.solver.drag`, 0, Infinity, "drag", out.items);
  validateRange(solver.dryDepth, `${root}.solver.dryDepth`, 0, Infinity, "dry depth", out.items);
  positive(out, `${root}.solver.referenceDepth`, "reference depth", solver.referenceDepth);
  integer(out, `${root}.solver.maxSteps`, "max steps", solver.maxSteps, 1, FLUID_MAX_STEPS);

  // Bad authored operands are reported at their fields. Infinity exceeds this
  // comparison, but NaN from extreme finite intermediates currently bypasses it.
  const courant: number = fluidCourantNumber(domain);
  if (
    [
      solver.fixedStepSeconds,
      solver.gravity,
      solver.referenceDepth,
      domain.grid.cellX,
      domain.grid.cellZ,
    ].every((value: number): boolean => Number.isFinite(value) && value > 0) &&
    courant > 1
  )
    out.push(
      "range",
      `${root}.solver.fixedStepSeconds`,
      `the explicit shallow-water step is stable only while dt·sqrt(g·referenceDepth)·sqrt(1/dx² + 1/dz²) <= 1, but the Courant number is ${courant}`,
      solver.fixedStepSeconds,
      Number.isFinite(courant) ? courant - 1 : undefined,
    );

  for (const edge of EDGES)
    if (!BOUNDARY_KINDS.has(domain.boundaries[edge]))
      out.push(
        "type",
        `${root}.boundaries.${edge}`,
        `boundary must be "wall" or "open", but was ${String(domain.boundaries[edge])}`,
        domain.boundaries[edge],
      );

  length(out, `${root}.bed`, "bed", domain.bed.length, cells);
  length(out, `${root}.depth`, "depth", domain.depth.length, cells);
  length(out, `${root}.solid`, "solid", domain.solid.length, cells);
  domain.bed.forEach((value: number, index: number): void =>
    validateRange(value, `${root}.bed[${index}]`, -Infinity, Infinity, "bed elevation", out.items),
  );
  // A broken design depth is named at its own field, not again at every cell.
  const deepest: number =
    Number.isFinite(solver.referenceDepth) && solver.referenceDepth > 0
      ? solver.referenceDepth
      : Infinity;
  domain.depth.forEach((value: number, index: number): void => {
    validateRange(
      value,
      `${root}.depth[${index}]`,
      0,
      deepest,
      "water depth",
      out.items,
    );
    if (domain.solid[index] === true && value !== 0)
      out.push(
        "type",
        `${root}.depth[${index}]`,
        "a solid cell must hold no water",
        value,
      );
  });
  // A cell is solid or it is not, and the two readers of this flag ask the
  // question in opposite directions: the solver blocks a face when the cell
  // `=== true`, the surface draws a quad when it `=== false`. A value that is
  // neither answers no to both, so the water would flow through a pier the
  // renderer refuses to draw around. Refusing the flag here is what keeps the
  // solve and the surface one statement.
  domain.solid.forEach((value: boolean, index: number): void => {
    if (typeof value !== "boolean")
      out.push(
        "type",
        `${root}.solid[${index}]`,
        "a solidity flag must be a boolean",
        value,
      );
  });

  count(out, `${root}.sources`, "sources", domain.sources.length, FLUID_MAX_FLOWS);
  const sourceIds: Set<string> = new Set<string>();
  domain.sources.forEach((source: IAutoMovieFluidSource, index: number): void => {
    const path: string = `${root}.sources[${index}]`;
    identity(out, path, "source", source.id, sourceIds);
    site(out, path, domain, source.column, source.row);
    validateRange(source.flowRate, `${path}.flowRate`, 0, Infinity, "source flow rate", out.items);
    window(out, path, source.start, source.end);
  });

  count(out, `${root}.drains`, "drains", domain.drains.length, FLUID_MAX_FLOWS);
  const drainIds: Set<string> = new Set<string>();
  domain.drains.forEach((drain: IAutoMovieFluidDrain, index: number): void => {
    const path: string = `${root}.drains[${index}]`;
    identity(out, path, "drain", drain.id, drainIds);
    site(out, path, domain, drain.column, drain.row);
    validateRange(drain.flowRate, `${path}.flowRate`, 0, Infinity, "drain flow rate", out.items);
    validateRange(
      drain.sillLevel,
      `${path}.sillLevel`,
      -Infinity,
      Infinity,
      "drain sill level",
      out.items,
    );
    window(out, path, drain.start, drain.end);
  });

  count(out, `${root}.sprays`, "spray emitters", domain.sprays.length, FLUID_MAX_SPRAYS);
  const sprayIds: Set<string> = new Set<string>();
  domain.sprays.forEach((spray: IAutoMovieFluidSpray, index: number): void => {
    const path: string = `${root}.sprays[${index}]`;
    identity(out, path, "spray emitter", spray.id, sprayIds);
    site(out, path, domain, spray.column, spray.row);
    positive(out, `${path}.rate`, "spray rate", spray.rate);
    positive(out, `${path}.lifetime`, "spray lifetime", spray.lifetime);
    validateRange(spray.speed, `${path}.speed`, 0, Infinity, "spray speed", out.items);
    validateRange(spray.spread, `${path}.spread`, 0, 1, "spray spread", out.items);
    positive(out, `${path}.size`, "spray particle size", spray.size);
    positive(out, `${path}.lodDistance`, "spray LOD distance", spray.lodDistance);
    integer(
      out,
      `${path}.maxParticles`,
      "spray particle cap",
      spray.maxParticles,
      1,
      FLUID_MAX_SPRAY_PARTICLES,
    );
    if (!Number.isSafeInteger(spray.seed))
      out.push(
        "type",
        `${path}.seed`,
        "spray seed must be a safe integer",
        spray.seed,
      );
    // Match the sampler's norm helper, including its hypot fallback for failed
    // squares. An unrepresentable norm can still be Infinity and pass this gate.
    const axis: IAutoMovieFluidSpray["direction"] = spray.direction;
    if (
      !Number.isFinite(axis.x) ||
      !Number.isFinite(axis.y) ||
      !Number.isFinite(axis.z) ||
      Vector3.length(axis) === 0
    )
      out.push(
        "type",
        `${path}.direction`,
        "spray direction must be a finite non-zero vector",
        axis,
      );
  });

  return out.toValidation();
};

/** Append the shared finite, open-lower-bound range finding; scalar work has the diagnostic conversion costs of validateRange and mutates only the borrowed collector. */
const positive: (out: ViolationCollector, path: string, label: string, value: number) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
): void => validateRange(value, path, 0, Infinity, label, out.items, false);

/** Require a safe integer inside inclusive bounds; one constant-work predicate appends at most one finding without clamping. */
const integer: (out: ViolationCollector, path: string, label: string, value: number, min: number, max: number) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  value: number,
  min: number,
  max: number,
): void => {
  if (!Number.isSafeInteger(value) || value < min || value > max)
    out.push(
      "type",
      path,
      `${label} must be an integer within [${min}, ${max}]`,
      value,
    );
};

/** Compare actual length with the computed cell count, appending at most one finding even for an unusable count; no array is traversed or resized here. */
const length: (out: ViolationCollector, path: string, label: string, actual: number, cells: number) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  cells: number,
): void => {
  if (actual !== cells)
    out.push(
      "type",
      path,
      `${label} must hold exactly one value per cell (${cells}), but held ${actual}`,
      actual,
    );
};

/** Append one range finding and overshoot when an actual collection length exceeds its named budget; constant scalar work leaves the collection unchanged. */
const count: (out: ViolationCollector, path: string, label: string, actual: number, budget: number) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  actual: number,
  budget: number,
): void => {
  if (actual > budget)
    out.push(
      "range",
      path,
      `a fluid domain may declare at most ${budget} ${label}, but declared ${actual}`,
      actual,
      actual - budget,
    );
};

/** Check blank text and sibling duplication, then add the exact id to the call-owned set. Text trimming/hashing scales with id length; blank siblings receive blank findings without duplicate findings. */
const identity: (out: ViolationCollector, path: string, label: string, id: string, seen: Set<string>) => void = (
  out: ViolationCollector,
  path: string,
  label: string,
  id: string,
  seen: Set<string>,
): void => {
  out.nonEmpty(`${path}.id`, id, `${label} id`);
  if (seen.has(id) && id.trim().length !== 0)
    out.push("type", `${path}.id`, `${label} id "${id}" is duplicated`, id);
  seen.add(id);
};

/** Check each safe integer coordinate before reading solidity; an in-grid solid site appends a separate finding. Constant work borrows the domain and collector without retaining them. */
const site: (out: ViolationCollector, path: string, domain: IAutoMovieFluidDomain, column: number, row: number) => void = (
  out: ViolationCollector,
  path: string,
  domain: IAutoMovieFluidDomain,
  column: number,
  row: number,
): void => {
  integer(
    out,
    `${path}.column`,
    "cell column",
    column,
    0,
    domain.grid.columns - 1,
  );
  integer(out, `${path}.row`, "cell row", row, 0, domain.grid.rows - 1);
  if (
    inside(column, domain.grid.columns) &&
    inside(row, domain.grid.rows) &&
    domain.solid[row * domain.grid.columns + column] === true
  )
    out.push(
      "type",
      path,
      `cell (${column}, ${row}) is solid and cannot host a declared source, drain, or spray`,
      { column, row },
    );
};

/** Constant-work safe-index predicate used before solidity lookup; the limit is the authored count and is admitted separately. No state is retained. */
const inside: (value: number, limit: number) => boolean = (value: number, limit: number): boolean =>
  Number.isSafeInteger(value) && value >= 0 && value < limit;

/** Check finite nonnegative endpoints and strict end-after-start ordering; null end is unbounded. Scalar checks append their own findings without mutating the window or repeating ordering errors for non-finite endpoints. */
const window: (out: ViolationCollector, path: string, start: number, end: number | null) => void = (
  out: ViolationCollector,
  path: string,
  start: number,
  end: number | null,
): void => {
  validateRange(start, `${path}.start`, 0, Infinity, "activity start", out.items);
  if (end === null) return;
  validateRange(end, `${path}.end`, 0, Infinity, "activity end", out.items);
  if (Number.isFinite(end) && Number.isFinite(start) && end <= start)
    out.push(
      "range",
      `${path}.end`,
      `activity end must be strictly after its start (${start}), but was ${end}`,
      end,
    );
};
