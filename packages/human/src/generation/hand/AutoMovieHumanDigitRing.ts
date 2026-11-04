import { AutoMovieHumanSeamKnot } from "../../lofting/AutoMovieHumanSeamKnot";
import type { AutoMovieHumanDigitSection } from "../AutoMovieHumanDigitSection";
import { AutoMovieHumanDigitSector } from "./AutoMovieHumanDigitSector";

/**
 * A digit's section as four sectors between four guides, in the section's own
 * `[across, palmar]` plane about the bone: the radial side line, the palmar
 * midline, the ulnar side line and the dorsal midline.
 *
 * Each guide owns its point, tangent and curvature in every section it
 * crosses, so the four sectors meet C2 at the guides and the ring is one
 * chain section every consumer reads unchanged (`AutoMovieHumanSeamKnot`).
 * The side points are the tightest turn of the section, so their curvature
 * is the largest (`w / (h_p h_d)`, the ellipse's side curvature); the
 * midlines turn the least (`h w^-2` times the apex share). A sector is built
 * by the quintic Hermite of its two guides (`AutoMovieHumanDigitSector`) and
 * keeps the control points between its guides' three, so each of the four
 * sectors takes eight knot spans of the 32 and keeps four control points of
 * its own, more than the four spans the assembly needs.
 *
 * It replaces the two-half section of `AutoMovieHumanDigitSection` (a half is
 * one sector there, with the side points the only guides) when the pieces are
 * wired; the shape contract is the same.
 */
export namespace AutoMovieHumanDigitRing {
  /**
   * The ring's control points in its plane, phase `2 pi m / count` from the
   * radial side point toward the palm.
   *
   * @param shape The section's shape, mm.
   * @param count Control points, a multiple of 4 with at least 16.
   */
  export function controls(shape: AutoMovieHumanDigitSection.IShape, count: number): [number, number][] {
    if (count % 4 !== 0 || count < 16) throw new Error(`A four-guide section needs a multiple of 4 of at least 16, not ${count}`);

    const w: number = shape.width;
    const side: number = shape.side / w;
    const palmar: number = (shape.palmarApex * shape.palmar) / (w * w);
    const dorsal: number = (shape.dorsalApex * shape.dorsal) / (w * w);
    const lambdaSide: number = Math.sqrt(shape.palmar * shape.dorsal);
    const quarter: number = Math.PI / 2;
    const guides: AutoMovieHumanDigitSector.IGuide[] = [
      { point: [w, 0], tangent: [0, 1], curvature: [-side, 0], speed: lambdaSide },
      { point: [0, shape.palmar], tangent: [-1, 0], curvature: [0, -palmar], speed: w },
      { point: [-w, 0], tangent: [0, -1], curvature: [side, 0], speed: lambdaSide },
      { point: [0, -shape.dorsal], tangent: [1, 0], curvature: [0, dorsal], speed: w },
    ];
    const names: string[] = ["palmar-radial", "palmar-ulnar", "dorsal-ulnar", "dorsal-radial"];
    const flat: number[] = AutoMovieHumanSeamKnot.assemble(
      count,
      guides.map((g: AutoMovieHumanDigitSector.IGuide, j: number): AutoMovieHumanSeamKnot.IGuide => ({
        knot: (j * count) / 4,
        jet: { point: g.point, tangent: g.tangent, curvature: g.curvature },
        speed: g.speed,
      })),
      guides.map((g: AutoMovieHumanDigitSector.IGuide, j: number): AutoMovieHumanSeamKnot.ISector => ({
        name: names[j]!,
        jet: AutoMovieHumanDigitSector.of(g, guides[(j + 1) % 4]!, quarter, j * quarter),
      })),
    );
    return Array.from({ length: count }, (_: unknown, m: number): [number, number] => [flat[m]!, flat[count + m]!]);
  }
}
