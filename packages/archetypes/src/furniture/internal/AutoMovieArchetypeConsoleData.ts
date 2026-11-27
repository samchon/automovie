import { AutoMovieArchetypeUnits } from "../../core/index";

export namespace AutoMovieArchetypeConsoleData {
  /*
   * The control console read.
   */
  export const WINSTED: string =
    'Winsted E-SOC Control Station specification sheet: "Base Consoles shall be 34-5/8" (880mm) deep, 29" (736mm) high" in 48, 60 and 72 in widths (5.1); "a 20" (508mm) deep 1-1/8" (32mm) thick" work surface (1.6); the side profile\'s work surface at 28-7/8 in (733 mm) and the ergonomic page\'s 28-9/16 in (726 mm) (https://www.winsted.com/media/25vlxeet/e-soc-specsheet.pdf)';

  /*
   * A Winsted E-SOC base console's fixed sizes, metres, from the maker's sheet:
   * its overall `depth`, 34-5/8 in, and its work surface's `surface` depth, 20
   * in, and `thickness`, 1-1/8 in.
   */
  export const CONSOLE: Readonly<{ depth: number; surface: number; thickness: number }> =
    {
      depth: 34.625 * AutoMovieArchetypeUnits.INCH,
      surface: 20 * AutoMovieArchetypeUnits.INCH,
      thickness: 1.125 * AutoMovieArchetypeUnits.INCH,
    };
}
