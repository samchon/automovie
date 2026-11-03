import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";

/**
 * The scalp shell's vault, centred on the vertical through the head: one
 * column per chart azimuth cell plus a closing column at u = 1 (so the
 * texture never wraps across a seam), {@link ROWS} rows from each column's
 * edge on the boundary (`AutoMovieHumanScalpShellEdge`) to the row below the
 * vertex. It stands a millimetre over the skin, under the cards (1.2 mm and
 * more) and far enough that it does not lose the depth test to the skin where
 * a view grazes the vault. Texture coordinates are the chart's: u the azimuth
 * over a turn, v the elevation from -90 to 90 degrees, so the coverage image
 * is read where it was accumulated.
 */
export namespace AutoMovieHumanScalpShellVault {
  /** Shell rows from its edge to the row below the vertex (convention). */
  export const ROWS: number = 32;

  /** Height of the shell over the skin, millimetres (convention). */
  export const LIFT: number = 1;

  /** Growing vertex and index buffers of a shell. */
  export interface IBuffer {
    /** Positions in model metres. */
    positions: number[];

    /** Unit normals, the chart directions. */
    normals: number[];

    /** Texture coordinates. */
    uvs: number[];

    /** Triangle indices. */
    indices: number[];
  }

  /**
   * Append one shell vertex at a chart direction.
   *
   * @param field Head chart
   * @param buffer Buffers to grow
   * @param alpha Azimuth, radians
   * @param beta Elevation, radians
   * @param u Texture coordinate along the azimuth
   */
  export function vertex(
    field: AutoMovieHumanHeadField.IField,
    buffer: IBuffer,
    alpha: number,
    beta: number,
    u: number,
  ): void {
    const d: [number, number, number] = AutoMovieHumanHeadField.direction(
      alpha,
      beta,
    );
    const r: number = AutoMovieHumanHeadField.radius(field, d) + LIFT;
    for (let k: number = 0; k < 3; ++k) {
      buffer.positions.push((field.centre[k]! + d[k]! * r) / 1000);
      buffer.normals.push(d[k]!);
    }
    buffer.uvs.push(u, (beta + Math.PI / 2) / Math.PI);
  }

  /**
   * Append the vault's vertices (rows 0 to ROWS - 1, column by column) and
   * the triangles of every row but the last, which the pole closes
   * (`AutoMovieHumanScalpShellPole`). Counterclockwise seen from outside:
   * azimuth runs from +X toward +Z and elevation upward, so (i, j),
   * (i, j + 1), (i + 1, j) faces out.
   *
   * @param field Head chart
   * @param buffer Buffers to grow
   * @param edges The edge elevation of every column
   */
  export function rows(
    field: AutoMovieHumanHeadField.IField,
    buffer: IBuffer,
    edges: number[],
  ): void {
    const NA: number = AutoMovieHumanHeadField.azimuthCells;
    for (let j: number = 0; j < ROWS; ++j)
      for (let i: number = 0; i <= NA; ++i) {
        const beta: number = edges[i]! + ((Math.PI / 2 - edges[i]!) * j) / ROWS;
        vertex(field, buffer, (i / NA) * 2 * Math.PI, beta, i / NA);
      }

    const W: number = NA + 1;
    for (let j: number = 0; j + 1 < ROWS; ++j)
      for (let i: number = 0; i < NA; ++i) {
        const a: number = j * W + i;
        const b: number = a + 1;
        buffer.indices.push(a, a + W, b, b, a + W, b + W);
      }
  }
}
