import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import { AutoMovieHumanApertureConstruction } from "./AutoMovieHumanApertureConstruction";
import { AutoMovieHumanSkinProjection } from "./AutoMovieHumanSkinProjection";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/**
 * Inferred nasal pocket, continuing the observed exterior into a rounded
 * closure. Only its rim and exterior tangent are observations. The cubic
 * meridians and their common posterior pole are a closure convention.
 */
export namespace AutoMovieHumanAperturePocket {
  /** Meridian tessellation; geometry is the cubic, not a stack of flat walls. */
  const STEPS: number = 12;

  /**
   * Close a cut rim using cubic meridians with its exterior transverse jet.
   * The first control follows the source triangle's tangent plane. The last
   * control lies in the pole's plane perpendicular to the aperture axis,
   * giving every meridian the same limiting tangent plane at the pole.
   */
  export function generate(
    mesh: AutoMovieHumanLoftMesh.IContext,
    aperture: IAutoMovieHumanLoftAperture,
    open: readonly IAutoMovieHumanApertureEdge[],
    emit: (name: string, ...corners: number[]) => void,
  ): IAutoMovieHumanConstructionPath[] {
    if (open.length === 0) return [];
    const vertices: number[] = [
      ...new Set(
        open.flatMap((e: IAutoMovieHumanApertureEdge): number[] => [e.u, e.v]),
      ),
    ];
    const centre: number[] = [0, 1, 2].map(
      (a: number): number =>
        vertices.reduce(
          (sum: number, v: number): number => sum + mesh.positions[3 * v + a]!,
          0,
        ) / vertices.length,
    );
    const outline: AutoMovieHumanLoftAperture.IOutline =
      AutoMovieHumanLoftAperture.outline(
        aperture,
        AutoMovieHumanLoftAperture.polyline(aperture),
      );
    const owners: Map<number, IAutoMovieHumanApertureEdge> = new Map(
      open.map(
        (
          e: IAutoMovieHumanApertureEdge,
        ): [number, IAutoMovieHumanApertureEdge] => [e.u, e],
      ),
    );
    const tip: number[] = centre.map(
      (v: number, a: number): number =>
        v - aperture.forward[a]! * aperture.pocket!,
    );
    const pole: number = mesh.positions.length / 3;
    mesh.positions.push(...tip);
    // Depth slope of the exterior toward the opening at every rim vertex,
    // from the rim's jets, whose gradients are averaged along the rim
    // (`AutoMovieHumanSkinProjection.rim`): one triangle's affine jet
    // differs from the next by the facet noise of the cut, and meridians
    // started at those angles shaded the walls as facets and a bright
    // streak.
    const inwards: Map<number, [number, number]> = new Map();
    const slopes: Map<number, number> = new Map();
    const jets: Map<number, AutoMovieHumanSkinProjection.IJet> =
      AutoMovieHumanSkinProjection.rim(mesh, open, outline);
    for (const v of vertices) {
      const p: number[] = [0, 1, 2].map(
        (a: number): number => mesh.positions[3 * v + a]!,
      );
      const hit: AutoMovieHumanSkinProjection.IJet = jets.get(
        owners.get(v)!.u,
      )!;
      const inward: [number, number] = [outline.lateral, outline.up].map(
        (axis: readonly number[]): number =>
          p.reduce(
            (sum: number, value: number, a: number): number =>
              sum + (centre[a]! - value) * axis[a]!,
            0,
          ),
      ) as [number, number];
      inwards.set(v, inward);
      slopes.set(v, hit.gradient[0] * inward[0] + hit.gradient[1] * inward[1]);
    }

    const rings: Map<number, number[]> = new Map();
    for (const v of vertices) {
      const p: number[] = [0, 1, 2].map(
        (a: number): number => mesh.positions[3 * v + a]!,
      );
      const inward: [number, number] = inwards.get(v)!;
      const axial: number = slopes.get(v)!;
      const radial: number[] = [0, 1, 2].map(
        (a: number): number =>
          inward[0] * outline.lateral[a]! + inward[1] * outline.up[a]!,
      );
      const tangent: number[] = radial.map(
        (value: number, a: number): number =>
          value + axial * outline.forward[a]!,
      );
      const length: number = Math.hypot(
        ...p.map((value: number, a: number): number => tip[a]! - value),
      );
      const speed: number = Math.hypot(...tangent);
      if (!(speed > 0))
        throw new Error(
          `Nasal rim has no transverse tangent: ${aperture.name}`,
        );

      // A near-vertical exterior has a large depth derivative in the
      // projected chart, not an arbitrarily long physical handle. Preserve
      // its tangent plane using a unit direction and the closure's chord.
      const first: number[] = p.map(
        (value: number, a: number): number =>
          value + (tangent[a]! * length) / (3 * speed),
      );
      const last: number[] = tip.map(
        (value: number, a: number): number => value - radial[a]! / 2,
      );
      const row: number[] = [v];
      for (let k: number = 1; k < STEPS; k++) {
        const t: number = k / STEPS;
        row.push(mesh.positions.length / 3);
        mesh.positions.push(
          ...p.map(
            (value: number, a: number): number =>
              (1 - t) ** 3 * value +
              3 * (1 - t) ** 2 * t * first[a]! +
              3 * (1 - t) * t * t * last[a]! +
              t ** 3 * tip[a]!,
          ),
        );
      }
      row.push(pole);
      rings.set(v, row);
    }
    for (const edge of open) {
      const u: number[] = rings.get(edge.u)!;
      const v: number[] = rings.get(edge.v)!;
      for (let k: number = 0; k + 1 < STEPS; k++)
        emit(edge.name, v[k]!, u[k]!, u[k + 1]!, v[k]!, u[k + 1]!, v[k + 1]!);
      emit(edge.name, v[STEPS - 1]!, u[STEPS - 1]!, pole);
    }
    return AutoMovieHumanApertureConstruction.generate(
      mesh,
      aperture.name,
      open,
      rings,
    );
  }
}
