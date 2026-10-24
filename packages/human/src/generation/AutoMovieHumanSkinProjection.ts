import type { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";

/** Exact affine depth jet of the retained triangle owning a cut edge. */
export namespace AutoMovieHumanSkinProjection {
  /**
   * Read depth and gradient in an opening's projection plane. The edge's
   * third vertex identifies its own retained triangle; another frontmost
   * triangle or a finite probe outside the edge cannot replace that owner.
   */
  export function edge(
    mesh: AutoMovieHumanLoftMesh.IContext,
    boundary: IAutoMovieHumanApertureEdge,
    outline: AutoMovieHumanLoftAperture.IOutline,
  ): { x: number; gradient: [number, number] } {
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
    if (det === 0)
      throw new Error("Aperture edge has no regular skin depth chart");
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
}
