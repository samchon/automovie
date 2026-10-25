import type { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";

/** Exact affine depth jet of the retained triangle owning a cut edge. */
export namespace AutoMovieHumanSkinProjection {
  /** Depth and its gradient in an opening's projection plane. */
  export interface IJet {
    /** Depth along the opening's forward axis at the edge's first vertex, mm. */
    x: number;

    /** Depth gradient along the lateral and up axes, mm per mm. */
    gradient: [number, number];
  }

  /**
   * Read depth and gradient in an opening's projection plane. The edge's
   * third vertex identifies its own retained triangle; another frontmost
   * triangle or a finite probe outside the edge cannot replace that owner.
   *
   * @returns The jet, or null when the owning triangle is degenerate in the
   *   projection (area below 1e-9 of its squared size): the cut can pass so
   *   close to a vertex that the kept sliver's three corners lie on one
   *   ring, and such a triangle defines no transverse slope.
   */
  export function edge(
    mesh: AutoMovieHumanLoftMesh.IContext,
    boundary: IAutoMovieHumanApertureEdge,
    outline: AutoMovieHumanLoftAperture.IOutline,
  ): IJet | null {
    const q: number[][] = [boundary.u, boundary.v, boundary.inside].map(
      (v: number): number[] =>
        [outline.lateral, outline.up, outline.forward].map(
          (axis: readonly number[]): number =>
            axis.reduce(
              (sum: number, d: number, a: number): number =>
                sum + d * mesh.positions[3 * v + a]!,
              0,
            ),
        ),
    );
    const a: number[] = q[0]!,
      b: number[] = q[1]!,
      c: number[] = q[2]!;
    const det: number =
      (b[0]! - a[0]!) * (c[1]! - a[1]!) - (c[0]! - a[0]!) * (b[1]! - a[1]!);
    const size: number =
      (b[0]! - a[0]!) ** 2 +
      (b[1]! - a[1]!) ** 2 +
      (c[0]! - a[0]!) ** 2 +
      (c[1]! - a[1]!) ** 2;
    if (!(Math.abs(det) > 1e-9 * size)) return null;
    return {
      x: a[2]!,
      gradient: [
        ((b[2]! - a[2]!) * (c[1]! - a[1]!) -
          (c[2]! - a[2]!) * (b[1]! - a[1]!)) /
          det,
        ((b[0]! - a[0]!) * (c[2]! - a[2]!) -
          (c[0]! - a[0]!) * (b[2]! - a[2]!)) /
          det,
      ],
    };
  }

  /**
   * Jets of every open edge of one opening, by the edge's first vertex.
   * A degenerate owner ({@link edge} null) takes the depth of its own
   * vertex and the gradient of the nearest regular edges before and after
   * it along the rim, averaged; those are the slopes of the same skin a
   * fraction of a millimetre away.
   *
   * Every gradient is then averaged with those of {@link SPREAD} rim
   * neighbours on each side. One retained triangle's slope differs from the
   * next by the facet noise of the cut, and the lid columns and nostril
   * meridians started at those slopes shaded as a comb of streaks round the
   * eye and a bright streak inside the nostril. Depths stay each vertex's
   * own.
   *
   * @throws {Error} When no edge of the opening has a regular owner.
   */
  export function rim(
    mesh: AutoMovieHumanLoftMesh.IContext,
    open: readonly IAutoMovieHumanApertureEdge[],
    outline: AutoMovieHumanLoftAperture.IOutline,
  ): Map<number, IJet> {
    const own: Map<number, IJet | null> = new Map(
      open.map((e: IAutoMovieHumanApertureEdge): [number, IJet | null] => [
        e.u,
        edge(mesh, e, outline),
      ]),
    );
    const next: Map<number, number> = new Map(
      open.map((e: IAutoMovieHumanApertureEdge): [number, number] => [
        e.u,
        e.v,
      ]),
    );
    const previous: Map<number, number> = new Map(
      open.map((e: IAutoMovieHumanApertureEdge): [number, number] => [
        e.v,
        e.u,
      ]),
    );
    const out: Map<number, IJet> = new Map();
    for (const e of open) {
      const jet: IJet | null = own.get(e.u)!;
      if (jet !== null) {
        out.set(e.u, jet);
        continue;
      }
      const found: [number, number][] = [];
      for (const step of [next, previous]) {
        let w: number | undefined = step.get(e.u);
        for (let k: number = 0; k < open.length && w !== undefined; k++) {
          const candidate: IJet | null | undefined = own.get(w);
          if (candidate) {
            found.push(candidate.gradient);
            break;
          }
          w = step.get(w);
        }
      }
      if (found.length === 0)
        throw new Error("Aperture rim has no regular skin depth chart");
      const depth: number = [0, 1, 2].reduce(
        (sum: number, a: number): number =>
          sum + outline.forward[a]! * mesh.positions[3 * e.u + a]!,
        0,
      );
      out.set(e.u, {
        x: depth,
        gradient: [
          found.reduce(
            (s: number, g: [number, number]): number => s + g[0],
            0,
          ) / found.length,
          found.reduce(
            (s: number, g: [number, number]): number => s + g[1],
            0,
          ) / found.length,
        ],
      });
    }

    // Gradients averaged along the rim; a rim that is not one cycle keeps
    // the neighbours it has.
    const smooth: Map<number, IJet> = new Map();
    for (const [v, jet] of out) {
      const sum: [number, number] = [...jet.gradient];
      let count: number = 1;
      for (const step of [next, previous]) {
        let w: number | undefined = v;
        for (let k: number = 0; k < SPREAD; k++) {
          w = w === undefined ? undefined : step.get(w);
          if (w === undefined || w === v) break;
          const other: IJet | undefined = out.get(w);
          if (other === undefined) break;
          sum[0] += other.gradient[0];
          sum[1] += other.gradient[1];
          count++;
        }
      }
      smooth.set(v, { x: jet.x, gradient: [sum[0] / count, sum[1] / count] });
    }
    return smooth;
  }
}

/** Rim neighbours on each side averaged into a vertex's gradient. */
const SPREAD: number = 3;
