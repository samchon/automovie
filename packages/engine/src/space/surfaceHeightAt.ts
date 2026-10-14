import { IAutoMovieHeightRule, IAutoMovieVector3 } from "@automovie/interface";

import { IAutoMovieHeightSurface } from "./IAutoMovieHeightSurface";

/** Squared XZ ramp span below this square-metre threshold reads as flat. */
const MIN_RAMP_AXIS: number = 1e-9;

/**
 * Evaluate the canonical surface height at XZ without checking footprint membership.
 *
 * @evidence contracts/common.md#principled-implementation An explicit constant, plane or edge-clamped bilinear heightfield takes precedence; otherwise the legacy anchor/ramp projection extrapolates a plane, with squared XZ span below 1e-9 treated as flat.
 * @evidence contracts/common.md#clear-and-simple-design Placement, motion, camera and surface tessellation share this height owner, while callers separately decide whether the query lies on the surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Absent anchor returns zero and absent heightfield samples return zero; these malformed-input fallbacks are not admission, and finite fields alone do not prevent overflow in derived arithmetic.
 * @evidence contracts/common.md#meaningful-documentation Documents metre heights, explicit-rule precedence, edge clamping, extrapolated ramps and the square-metre degeneracy threshold rather than a linear-span threshold.
 * @evidence contracts/performance.md#efficient-algorithms A height query uses constant scalar work and at most four indexed lattice samples regardless of grid population; no grid scan or emitted geometry is allocated.
 * @evidence contracts/performance.md#reuse-equivalent-work All consumers reuse the same rule implementation and supplied grid; no scalar-height or mutable-grid result cache is retained.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only a number escapes; local cell records leave scope and the borrowed surface/grid is not retained by the query.
 * @author Samchon
 */
export const surfaceHeightAt: (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
) => number = (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
): number => {
  const rule: IAutoMovieHeightRule | undefined = surface.height;
  if (rule === undefined) return anchoredHeightAt(surface, x, z);
  if (rule.kind === "constant") return rule.value;
  if (rule.kind === "plane")
    return rule.originHeight + rule.slopeX * x + rule.slopeZ * z;
  // Bilinear over the cell the point falls in. The lattice coordinate is
  // clamped before the cell is chosen, so a query outside the grid reads its
  // nearest edge instead of extrapolating relief nobody authored.
  const column: { index: number; fraction: number } = latticeCell(
    (x - rule.originX) / rule.spacingX,
    rule.columns,
  );
  const row: { index: number; fraction: number } = latticeCell(
    (z - rule.originZ) / rule.spacingZ,
    rule.rows,
  );
  const near: number = mix(
    heightfieldSample(rule, column.index, row.index),
    heightfieldSample(rule, column.index + 1, row.index),
    column.fraction,
  );
  const far: number = mix(
    heightfieldSample(rule, column.index, row.index + 1),
    heightfieldSample(rule, column.index + 1, row.index + 1),
    column.fraction,
  );
  return mix(near, far, row.fraction);
};

/** The two-anchor spelling of a level or single-plane patch. */
const anchoredHeightAt: (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
) => number = (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
): number => {
  const anchor: IAutoMovieVector3 | undefined = surface.anchor;
  if (anchor === undefined) return 0;
  const rampTo: IAutoMovieVector3 | null = surface.rampTo ?? null;
  if (rampTo === null) return anchor.y;
  const ax: number = rampTo.x - anchor.x;
  const az: number = rampTo.z - anchor.z;
  const span: number = ax * ax + az * az;
  if (span < MIN_RAMP_AXIS) return anchor.y;
  const t: number = ((x - anchor.x) * ax + (z - anchor.z) * az) / span;
  return anchor.y + t * (rampTo.y - anchor.y);
};

/**
 * Which cell of a lattice a coordinate falls in, and how far across it.
 *
 * The coordinate is clamped into the lattice first, so a point outside reads
 * the edge cell at fraction zero or one rather than an extrapolated one. A
 * lattice of a single line has no cell to cross and reads that line.
 */
const latticeCell: (
  coordinate: number,
  count: number,
) => { index: number; fraction: number } = (
  coordinate: number,
  count: number,
): { index: number; fraction: number } => {
  const last: number = Math.max(0, count - 2);
  const clamped: number = Math.min(
    Math.max(coordinate, 0),
    Math.max(0, count - 1),
  );
  const index: number = Math.min(Math.floor(clamped), last);
  return { index, fraction: clamped - index };
};

/**
 * One stored sample, with its indices clamped into the declared grid.
 *
 * A record whose `samples` is shorter than `columns * rows` is refused by
 * validation; reading it here answers zero rather than `NaN`, so a placement
 * built on a malformed field is wrong in a way a reader can see instead of
 * poisoning every arithmetic downstream of it.
 */
const heightfieldSample: (
  rule: {
    kind: "heightfield";
    originX: number;
    originZ: number;
    spacingX: number;
    spacingZ: number;
    columns: number;
    rows: number;
    samples: number[];
  },
  column: number,
  row: number,
) => number = (
  rule: Extract<IAutoMovieHeightRule, { kind: "heightfield" }>,
  column: number,
  row: number,
): number =>
  rule.samples[
    Math.min(Math.max(row, 0), rule.rows - 1) * rule.columns +
      Math.min(Math.max(column, 0), rule.columns - 1)
  ] ?? 0;

/** Interpolate scalar heights without saturation or finite-result admission. */
const mix: (from: number, to: number, progress: number) => number = (
  from: number,
  to: number,
  progress: number,
): number => from + (to - from) * progress;
