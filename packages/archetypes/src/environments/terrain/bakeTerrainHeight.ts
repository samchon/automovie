import { worldHeightfield } from "@automovie/engine";
import type {
  IAutoMovieHeightRule,
  IAutoMovieTerrainRecipe,
  IAutoMovieVector3,
} from "@automovie/interface";

/** Memory budget for one regularly sampled terrain height record. */
const MAX_SAMPLES: number = 1_000_000;

/** A stored bilinear terrain lattice. */
type IHeightfield = Extract<IAutoMovieHeightRule, { kind: "heightfield" }>;

/**
 * Bake one bounded lattice with a checked vertical mesh approximation error.
 *
 * @param id Stable terrain identity for diagnostics.
 * @param origin Column-zero and row-zero world XZ coordinates in metres.
 * @param size Width and depth in metres.
 * @param pitch Largest allowed spacing in either direction, in metres.
 * @param tolerance Largest permitted vertical error against the bilinear
 *   surface, in metres.
 * @param height Shared grade evaluator in world metres.
 * @param advice Optional sentence the sample-budget refusal appends, naming
 *   what in the relief drives the lattice and which fields lower it.
 * @returns The canonical sampled support rule used by both scene and world
 *   records.
 */
export function bakeTerrainHeight(
  id: string,
  origin: IAutoMovieVector3,
  size: IAutoMovieTerrainRecipe.Point,
  pitch: number,
  tolerance: number,
  height: (point: { x: number; z: number }) => number,
  advice?: string,
): IHeightfield {
  let columns: number = Math.ceil(size[0] / pitch);
  let rows: number = Math.ceil(size[1] / pitch);
  let previous: IHeightfield | undefined;
  for (;;) {
    if ((columns + 1) * (rows + 1) > MAX_SAMPLES)
      throw new Error(
        `Terrain "${id}" needs more than ${MAX_SAMPLES} samples for its feature widths and ${tolerance} m mesh tolerance.${advice === undefined ? "" : ` ${advice}`}`,
      );
    const x: number =
      previous === undefined ? size[0] / columns : previous.spacingX / 2;
    const z: number =
      previous === undefined ? size[1] / rows : previous.spacingZ / 2;
    if (
      origin.x + x === origin.x ||
      origin.z + z === origin.z ||
      origin.x + columns * x - x === origin.x + columns * x ||
      origin.z + rows * z - z === origin.z + rows * z
    )
      throw new Error(
        `Terrain "${id}" has unrepresentable sample spacing at this world position.`,
      );
    let index: number = 0;
    const coarse: IHeightfield | undefined = previous;
    const candidate: IAutoMovieHeightRule = worldHeightfield({
      id,
      polygon: [],
      origin,
      spacing: { x, z },
      columns: columns + 1,
      rows: rows + 1,
      height: (point: { x: number; z: number }): number => {
        const row: number = Math.floor(index / (columns + 1));
        const column: number = index % (columns + 1);
        ++index;
        return coarse !== undefined && row % 2 === 0 && column % 2 === 0
          ? coarse.samples[(row / 2) * coarse.columns + column / 2]!
          : height(point);
      },
      walkable: true,
    }).height;
    if (candidate.kind !== "heightfield")
      throw new Error(`Terrain "${id}" did not bake a canonical heightfield.`);
    if (maximumBilinearError(candidate) <= tolerance) return candidate;
    previous = candidate;
    columns *= 2;
    rows *= 2;
  }
}

/**
 * Conservative maximum linear-interpolation error over all complete lattice
 * cells.
 */
function maximumBilinearError(rule: IHeightfield): number {
  let error: number = 0;
  for (let row: number = 0; row + 1 < rule.rows; row += 1)
    for (let column: number = 0; column + 1 < rule.columns; column += 1) {
      const near: number = row * rule.columns + column;
      const far: number = near + rule.columns;
      const mixed: number =
        rule.samples[far + 1]! -
        rule.samples[far]! -
        (rule.samples[near + 1]! - rule.samples[near]!);
      error = Math.max(error, Math.abs(mixed) / 4);
    }
  return error;
}
