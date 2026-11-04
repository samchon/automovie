import { AutoMovieHumanHeadField } from "./AutoMovieHumanHeadField";
import { AutoMovieHumanScalpShellVault } from "./AutoMovieHumanScalpShellVault";

/**
 * The scalp shell's cap at the vertex, centred on the vertical through the
 * head: one pole vertex per column at elevation 90 degrees, and the fan of
 * triangles that closes the vault's last row onto them.
 */
export namespace AutoMovieHumanScalpShellPole {
  /**
   * Append the pole vertices and the closing triangles.
   *
   * @param field Head chart
   * @param buffer Buffers to grow, already holding the vault's rows
   */
  export function cap(
    field: AutoMovieHumanHeadField.IField,
    buffer: AutoMovieHumanScalpShellVault.IBuffer,
  ): void {
    const NA: number = AutoMovieHumanHeadField.azimuthCells;
    const pole: number = buffer.positions.length / 3;
    for (let i: number = 0; i <= NA; ++i)
      AutoMovieHumanScalpShellVault.vertex(
        field,
        buffer,
        (i / NA) * 2 * Math.PI,
        Math.PI / 2,
        i / NA,
      );

    const W: number = NA + 1;
    for (let i: number = 0; i < NA; ++i) {
      const a: number = (AutoMovieHumanScalpShellVault.ROWS - 1) * W + i;
      buffer.indices.push(a, pole + i, a + 1);
    }
  }
}
