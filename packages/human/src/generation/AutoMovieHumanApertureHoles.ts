import type { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";

/**
 * The holes an aperture's cut leaves in the skin: the opening's own least
 * height, which sets how finely the skin's rows must cross it.
 *
 * A row of skin that steps over an opening between two of its rows leaves a
 * bridge across it, and the opening falls into two holes: a mouth slit about
 * a millimetre tall, crossed by tilted sections whose front points rise by
 * more than that between two rows, split on the male heads into two rim
 * loops (m2: 185 of the rim's edges in the second) and stopped the oral
 * cavity.
 */
export namespace AutoMovieHumanApertureHoles {
  /**
   * The opening's mean thickness across its long axis: twice its projected
   * area over its perimeter, the height of a thin slit and about the minor
   * axis of an oval.
   *
   * @param outline The opening's projected outline.
   * @returns Thickness, mm, zero for a degenerate outline.
   */
  export function thickness(outline: AutoMovieHumanLoftAperture.IOutline): number {
    const p: readonly [number, number][] = outline.points;
    let twice: number = 0;
    let perimeter: number = 0;
    for (let i: number = 0; i < p.length; i++) {
      const a: readonly [number, number] = p[i]!;
      const b: readonly [number, number] = p[(i + 1) % p.length]!;
      twice += a[0] * b[1] - b[0] * a[1];
      perimeter += Math.hypot(b[0] - a[0], b[1] - a[1]);
    }
    return perimeter > 0 ? Math.abs(twice) / perimeter : 0;
  }
}
