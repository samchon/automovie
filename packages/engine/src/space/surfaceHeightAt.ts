import { IAutoMovieHeightRule } from "@automovie/interface";
import { IAutoMovieHeightSurface } from "./IAutoMovieHeightSurface";

/**
 * Height of one surface at `(x, z)`, ignoring its footprint.
 *
 * **The one height function.** A performer standing, a crowd member placed on
 * terrain, a foot planted through {@link spaceGround}, the gate that refuses a
 * unit standing under its ground, and the camera base solved from where they
 * all ended up: every one of them reaches this. A second implementation that
 * agrees today is exactly how a named performer and the crowd behind it came to
 * stand on two different grounds — the world's terrain rose and the scene's
 * patch stayed a plane — so there is one, and both records state their ground
 * in terms it reads.
 *
 * A stated {@link IAutoMovieHeightRule} is authoritative: `constant` is a level,
 * `plane` is `originHeight + slopeX·x + slopeZ·z`, and `heightfield` is
 * bilinear across the lattice cell the point falls in, clamped to the edge
 * samples outside it so a query off the lattice reads terrain that was authored
 * rather than extrapolated.
 *
 * Without one, the two-anchor spelling answers, unchanged: a flat patch is
 * `anchor.y` everywhere; a sloped patch interpolates linearly along the `anchor
 * → rampTo` axis on the ground plan (constant perpendicular, a plane). Points
 * beyond the anchors extrapolate on that plane; the polygon, not the anchors,
 * bounds where the surface exists (see {@link surfaceContains}). A degenerate
 * ramp axis (same XZ as the anchor, rejected by {@link validateSpace}) safely
 * reads as flat.
 *
 * A surface stating neither reads as the scalar zero plane the engine assumed
 * before spaces existed. `validateSpace` refuses one, so this is what a
 * hand-built patch reaching a renderer answers rather than a throw.
 *
 * @evidence requirements/staging/marks-zones-and-blocking.md#staging-mark-surface `surfaceHeightAt` produces height of one surface at `(x, z)`, ignoring its footprint. This ensures marks and supports resolve against their declared host geometry.
 * @evidence specifications/performance-motion-and-staging/staging-space-state-and-choreography.md#performance-staging-mark-surface-zone-membership `surfaceHeightAt` performs height at surface evaluation when the engine resolves host-relative support geometry and whole-footprint zone membership.
 * @author Samchon
 */
export const surfaceHeightAt = (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
): number => {
  const rule = surface.height;
  if (rule === undefined) return anchoredHeightAt(surface, x, z);
  if (rule.kind === "constant") return rule.value;
  if (rule.kind === "plane")
    return rule.originHeight + rule.slopeX * x + rule.slopeZ * z;
  // Bilinear over the cell the point falls in. The lattice coordinate is
  // clamped before the cell is chosen, so a query outside the grid reads its
  // nearest edge instead of extrapolating relief nobody authored.
  const column = latticeCell((x - rule.originX) / rule.spacingX, rule.columns);
  const row = latticeCell((z - rule.originZ) / rule.spacingZ, rule.rows);
  const near = mix(
    heightfieldSample(rule, column.index, row.index),
    heightfieldSample(rule, column.index + 1, row.index),
    column.fraction,
  );
  const far = mix(
    heightfieldSample(rule, column.index, row.index + 1),
    heightfieldSample(rule, column.index + 1, row.index + 1),
    column.fraction,
  );
  return mix(near, far, row.fraction);
};

/** The two-anchor spelling of a level or single-plane patch. */
const anchoredHeightAt = (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
): number => {
  const anchor = surface.anchor;
  if (anchor === undefined) return 0;
  const rampTo = surface.rampTo ?? null;
  if (rampTo === null) return anchor.y;
  const ax = rampTo.x - anchor.x;
  const az = rampTo.z - anchor.z;
  const span = ax * ax + az * az;
  if (span < MIN_RAMP_AXIS) return anchor.y;
  const t = ((x - anchor.x) * ax + (z - anchor.z) * az) / span;
  return anchor.y + t * (rampTo.y - anchor.y);
};

/**
 * Which cell of a lattice a coordinate falls in, and how far across it.
 *
 * The coordinate is clamped into the lattice first, so a point outside reads
 * the edge cell at fraction zero or one rather than an extrapolated one. A
 * lattice of a single line has no cell to cross and reads that line.
 */
const latticeCell = (
  coordinate: number,
  count: number,
): { index: number; fraction: number } => {
  const last = Math.max(0, count - 2);
  const clamped = Math.min(Math.max(coordinate, 0), Math.max(0, count - 1));
  const index = Math.min(Math.floor(clamped), last);
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
const heightfieldSample = (
  rule: Extract<IAutoMovieHeightRule, { kind: "heightfield" }>,
  column: number,
  row: number,
): number =>
  rule.samples[
    Math.min(Math.max(row, 0), rule.rows - 1) * rule.columns +
      Math.min(Math.max(column, 0), rule.columns - 1)
  ] ?? 0;

const mix = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress;

/** Below this XZ span a ramp axis is degenerate and the patch reads as flat. */
const MIN_RAMP_AXIS = 1e-9;

/** The two-anchor spelling of a level or single-plane patch. */
const anchoredHeightAt = (
  surface: IAutoMovieHeightSurface,
  x: number,
  z: number,
): number => {
  const anchor = surface.anchor;
  if (anchor === undefined) return 0;
  const rampTo = surface.rampTo ?? null;
  if (rampTo === null) return anchor.y;
  const ax = rampTo.x - anchor.x;
  const az = rampTo.z - anchor.z;
  const span = ax * ax + az * az;
  if (span < MIN_RAMP_AXIS) return anchor.y;
  const t = ((x - anchor.x) * ax + (z - anchor.z) * az) / span;
  return anchor.y + t * (rampTo.y - anchor.y);
};

/**
 * Which cell of a lattice a coordinate falls in, and how far across it.
 *
 * The coordinate is clamped into the lattice first, so a point outside reads
 * the edge cell at fraction zero or one rather than an extrapolated one. A
 * lattice of a single line has no cell to cross and reads that line.
 */
const latticeCell = (
  coordinate: number,
  count: number,
): { index: number; fraction: number } => {
  const last = Math.max(0, count - 2);
  const clamped = Math.min(Math.max(coordinate, 0), Math.max(0, count - 1));
  const index = Math.min(Math.floor(clamped), last);
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
const heightfieldSample = (
  rule: Extract<IAutoMovieHeightRule, { kind: "heightfield" }>,
  column: number,
  row: number,
): number =>
  rule.samples[
    Math.min(Math.max(row, 0), rule.rows - 1) * rule.columns +
      Math.min(Math.max(column, 0), rule.columns - 1)
  ] ?? 0;

const mix = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress;
