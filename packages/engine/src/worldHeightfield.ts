import { IAutoMovieWorldSurface } from "@automovie/interface";

/**
 * Build one heightfield terrain surface by sampling a height function.
 *
 * The relief a production wants is almost always a rule — a slope that eases
 * off, a terrace, a bank falling to a river — and transcribing that rule into a
 * flat array by hand is where a hill acquires a step nobody meant. The function
 * is evaluated once per lattice point, in row-major order, and only its results
 * are kept: the compiled design carries numbers, so nothing at render time
 * depends on the function still existing or still answering the same way.
 *
 * That makes determinism the caller's to keep for exactly one thing: `height`
 * must be a pure function of the point it is given. A sampler that reads a
 * clock, a counter or unseeded randomness bakes one machine's terrain into the
 * design, which is the one way this can produce different frames elsewhere.
 *
 * @evidence requirements/map/terrain-and-landforms.md#map-elevation-slope Samples an authored elevation rule on a declared XZ lattice and stores the resulting terrain heights.
 * @evidence requirements/map/terrain-and-landforms.md#map-terrain-resolution-uncertainty `worldHeightfield` makes sample origin, spacing, row and column counts, and every finite height explicit so callers can retain the terrain's actual resolution.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-elevation-slope-surface-input Fixes footprint, origin, spacing, sample order, and finite elevations in the emitted heightfield record.
 * @evidence specifications/world-and-site/terrain-ground-and-geology.md#world-site-terrain-resolution-gap The heightfield record exposes the finite lattice resolution rather than presenting unsampled terrain as continuous measured detail.
 */
export const worldHeightfield = (input: {
  id: string;
  polygon: IAutoMovieWorldSurface["polygon"];
  /** World XZ of sample column and row zero. */
  origin: { x: number; z: number };
  /** Column and row pitch in meters, both strictly above zero. */
  spacing: { x: number; z: number };
  /** Sample columns along +X; at least two. */
  columns: number;
  /** Sample rows along +Z; at least two. */
  rows: number;
  /** Surface height in meters at one lattice point. */
  height: (point: { x: number; z: number }) => number;
  walkable: boolean;
}): IAutoMovieWorldSurface => {
  assertText(input.id, "World heightfield id");
  if (
    Number.isFinite(input.spacing.x) === false ||
    input.spacing.x <= 0 ||
    Number.isFinite(input.spacing.z) === false ||
    input.spacing.z <= 0 ||
    Number.isFinite(input.origin.x) === false ||
    Number.isFinite(input.origin.z) === false
  )
    throw new Error(
      `World heightfield "${input.id}" requires a finite origin and positive spacing.`,
    );
  if (
    Number.isSafeInteger(input.columns) === false ||
    Number.isSafeInteger(input.rows) === false ||
    input.columns < 2 ||
    input.rows < 2
  )
    throw new Error(
      `World heightfield "${input.id}" requires at least two sample columns and rows.`,
    );
  const samples: number[] = [];
  for (let row = 0; row < input.rows; ++row)
    for (let column = 0; column < input.columns; ++column) {
      const height = input.height({
        x: input.origin.x + column * input.spacing.x,
        z: input.origin.z + row * input.spacing.z,
      });
      if (Number.isFinite(height) === false)
        throw new Error(
          `World heightfield "${input.id}" sampled a non-finite height at column ${column}, row ${row}.`,
        );
      samples.push(height);
    }
  return {
    id: input.id,
    polygon: structuredClone(input.polygon),
    height: {
      kind: "heightfield",
      originX: input.origin.x,
      originZ: input.origin.z,
      spacingX: input.spacing.x,
      spacingZ: input.spacing.z,
      columns: input.columns,
      rows: input.rows,
      samples,
    },
    walkable: input.walkable,
  };
};
