import type { AutoMovieHumanSeamPatch } from "../../../src/lofting/AutoMovieHumanSeamPatch";
import { AutoMovieHumanFootPrior } from "../../../src/generation/AutoMovieHumanFootPrior";
import { AutoMovieHumanWebPatch } from "../../../src/generation/web/AutoMovieHumanWebPatch";
import { AutoMovieHumanWebSaddleQuads } from "../../../src/generation/web/AutoMovieHumanWebSaddleQuads";
import type { IHumanDebugDocument } from "../../contracts/IHumanDebugDocument";
import type { IHumanDebugPerson } from "../../people/IHumanDebugPerson";
import { HumanDebugPieceMesh } from "../HumanDebugPieceMesh";
import type { IHumanDebugPiece } from "../IHumanDebugPiece";
import { HumanDebugFootKit } from "../foot/HumanDebugFootKit";

type Point = IHumanDebugDocument.Point;

/**
 * `web.saddle`: one child's web saddle as the two seam patches of
 * `AutoMovieHumanWebSaddleQuads`, alone, on the web's analytic translational
 * surface at the size of the person's second toe.
 *
 * The surface is the chart's own, `F(u, v) = D(u) + lip(v) - S`, in the web's
 * frame: the pinches' chord along the body's left axis with its middle at the
 * origin, the web's outward direction forward, the crest S one margin radius
 * forward of the chord's middle, the lip `mid + xi rho v sqrt(2 - v^2) +
 * e_a rho (1 - v^2)` (a quarter round from the pinch to S, taken with its
 * side's sign so it is smooth across v = 0), and the child's own column
 * `D(u) = S + rho u^2 g` along the child's direction `g`, forward, a little
 * down and toward its own side. The margin radius `rho` is the second toe's
 * shaft half breadth from the person's foot breadth. The child's section
 * stands {@link BOTTOM} margin radii below the crest, the fade column
 * {@link FADE} radii from the pinch, inside the lip's domain (`v^2 <= 2`
 * holds at the ring's corner for a fade of at most `sqrt(8)`).
 *
 * Parts: the upper patch (ring to the crest's row), the lower patch (row to
 * the section), and the surface itself over the upper quadrilateral, on the
 * bilinear chart of its corners in branch coordinates, for comparison;
 * curves: the five boundary curves, the two fade halves and the row the
 * patches share.
 */
export const HumanDebugPieceWebSaddle: IHumanDebugPiece = {
  name: "web.saddle",
  region: "foot",
  description: "One web saddle as its two seam patches over the analytic translational surface, at the person's second toe's size",
  arguments: [],
  build: (person: IHumanDebugPerson): IHumanDebugDocument => {
    const f: HumanDebugFootKit.IFixed = HumanDebugFootKit.fixed(person);
    const rho: number = 0.5 * AutoMovieHumanFootPrior.PRIOR.toes[1]!.breadth * f.frame.B;
    const g: Point = unit([1, -0.25, 0.35]);
    const surface = (u: number, v: number): Point => {
      const lift: number = v * Math.sqrt(Math.max(0, 2 - v * v));

      return [rho + rho * u * u * g[0] - rho * v * v, rho * u * u * g[1], rho * u * u * g[2] + rho * lift];
    };
    const chart: AutoMovieHumanWebSaddleQuads.IChart = { surface, bottom: BOTTOM, fade: FADE };
    const patches: AutoMovieHumanWebSaddleQuads.IPatches = AutoMovieHumanWebSaddleQuads.of("web.saddle", chart);
    const sides: AutoMovieHumanWebSaddleQuads.IBoundaries = AutoMovieHumanWebSaddleQuads.boundaries("web.saddle", chart);

    // Each side's curve read back from its jet, for the curve overlay.
    const curve = (id: string, jet: (a: number) => { point: number[] }): IHumanDebugDocument.ICurve => ({
      id: "human.construction.web.saddle.upper/" + id,
      closed: false,
      points: Array.from({ length: CURVE_POINTS }, (_: unknown, k: number): Point => {
        const p: number[] = jet(k / (CURVE_POINTS - 1)).point;

        return [p[0]!, p[1]!, p[2]!];
      }),
    });
    const curves: IHumanDebugDocument.ICurve[] = [
      curve("lip", sides.upper.bottom.jet),
      curve("ring", sides.upper.right.jet),
      curve("fade-upper", sides.upper.top.jet),
      curve("row", sides.upper.left.jet),
      curve("column", sides.lower.bottom.jet),
      curve("section", sides.lower.right.jet),
      curve("fade-lower", sides.lower.top.jet),
    ];
    const meshOf = (patch: AutoMovieHumanSeamPatch.IPatch): HumanDebugPieceMesh.IMesh => {
      const m: AutoMovieHumanWebPatch.IMesh = AutoMovieHumanWebPatch.mesh(patch, CELLS, CELLS);

      return { points: m.points, indices: m.indices };
    };

    // The surface itself over the upper quadrilateral, on the bilinear chart
    // of its four corners in branch coordinates, for the patch against its
    // source.
    const c: AutoMovieHumanWebSaddleQuads.ICorners = AutoMovieHumanWebSaddleQuads.corners(chart);
    const reference: HumanDebugPieceMesh.IMesh = HumanDebugPieceMesh.grid(
      Array.from({ length: CELLS + 1 }, (_: unknown, j: number): Point[] =>
        Array.from({ length: CELLS + 1 }, (__: unknown, i: number): Point => {
          const s: number = i / CELLS;
          const t: number = j / CELLS;
          const w = (k: 0 | 1): number =>
            (1 - s) * (1 - t) * c.crest[k] + s * (1 - t) * c.pinch[k] + s * t * c.ring[k] + (1 - s) * t * c.row[k];

          return surface(w(0), w(1));
        }),
      ),
      false,
    );

    return {
      parts: [
        HumanDebugPieceMesh.part("human.skin.web.saddle.upper/0", meshOf(patches.upper), curves),
        HumanDebugPieceMesh.part("human.skin.web.saddle.lower/0", meshOf(patches.lower)),
        HumanDebugPieceMesh.part("human.skin.web.saddle.grid/0", reference),
      ],
      provenance: {
        piece: "web.saddle",
        person: person.alias,
        rho,
        corners: patches.upper.corners.concat(patches.lower.corners).map(
          (k: AutoMovieHumanSeamPatch.ICorner): { gap: number; first: number; twist: number } => ({ gap: k.gap, first: k.first, twist: k.twist }),
        ),
      },
    };
  },
};

/** A vector of unit length. */
function unit(p: Point): Point {
  const l: number = Math.hypot(p[0], p[1], p[2]);

  return [p[0] / l, p[1] / l, p[2] / l];
}

/** The child's section's depth below the crest, in margin radii: a section two radii down, as the web's own columns run. */
const BOTTOM: number = 2;

/** The fade column's distance from the pinch, in margin radii, inside the lip's domain (at most `sqrt(8)`). */
const FADE: number = 2.5;

/** Cells of each patch's mesh along each chart direction. */
const CELLS: number = 24;

/** Points of each boundary curve. */
const CURVE_POINTS: number = 33;
