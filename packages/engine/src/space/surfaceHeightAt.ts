import {
  IAutoMovieHeightRule,
  type IAutoMovieHeightSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { lerp } from "../lerp";

/** Squared XZ ramp span below this square-metre threshold reads as flat. */
const MIN_RAMP_AXIS: number = 1e-9;

/**
 * Evaluate the canonical surface height at XZ without checking footprint
 * membership.
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

/** Read an exact endpoint or interpolate two heights across a clamped fraction. */
const mix: (from: number, to: number, progress: number) => number = (
  from: number,
  to: number,
  progress: number,
): number => {
  if (progress === 0) return from;
  if (progress === 1) return to;
  const difference: number = to - from;
  return Math.abs(difference) < Infinity
    ? from + difference * progress
    : lerp(from, to, progress);
};
