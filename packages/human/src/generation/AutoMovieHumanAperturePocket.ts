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
  const STEPS: number = 24;

  /** Points a meridian is measured at before its steps are chosen. */
  const DENSE: number = 128;

  /**
   * Longest first handle of a meridian, in the rim's distance from the
   * opening's axis. A handle of a third of the chord to the pole, 3 mm, is
   * longer than a nostril is half wide, 2.4 mm: the wall ran on across the
   * opening in the skin's plane, under the wall opposite, before it turned
   * into the pocket within a millimetre, and from below the nostril read as
   * a slit with a white fringe.
   */
  const HANDLE: number = 0.5;

  /** A meridian's cubic controls: rim, first handle, last handle, pole. */
  type IControls = [number[], number[], number[], number[]];

  /** A point of a meridian's cubic. */
  function cubic(c: IControls, t: number): number[] {
    return c[0].map(
      (value: number, a: number): number =>
        (1 - t) ** 3 * value +
        3 * (1 - t) ** 2 * t * c[1][a]! +
        3 * (1 - t) * t * t * c[2][a]! +
        t ** 3 * c[3][a]!,
    );
  }

  /**
   * A meridian's share of its length plus its turning times a radius of a
   * chord over pi, so a half turn counts as one chord, at each of DENSE
   * steps of its parameter.
   */
  function measured(c: IControls): number[] {
    const points: number[][] = Array.from(
      { length: DENSE + 1 },
      (_: unknown, i: number): number[] => cubic(c, i / DENSE),
    );
    const radius: number =
      Math.hypot(...c[0].map((v: number, a: number): number => c[3][a]! - v)) / Math.PI;
    const out: number[] = [0];
    for (let i: number = 1; i <= DENSE; i++) {
      const d: number[] = points[i]!.map((v: number, a: number): number => v - points[i - 1]![a]!);
      let turn: number = 0;
      if (i > 1) {
        const e: number[] = points[i - 1]!.map((v: number, a: number): number => v - points[i - 2]![a]!);
        const l: number = Math.hypot(...d) * Math.hypot(...e);
        if (l > 1e-12)
          turn = Math.acos(
            Math.min(1, Math.max(-1, d.reduce((s: number, v: number, a: number): number => s + v * e[a]!, 0) / l)),
          );
      }
      out.push(out[i - 1]! + Math.hypot(...d) + radius * turn);
    }
    return out.map((v: number): number => v / (out[DENSE]! || 1));
  }

  /**
   * Each meridian's points, rim and pole excluded, at equal steps of its own
   * length plus turning. Uniform steps of the parameter put the turn under
   * the rim within one or two of them, 40 to 60 degrees a step, which shaded
   * the walls as streaks.
   */
  function meridians(controls: readonly IControls[]): number[][][] {
    return controls.map((c: IControls): number[][] => {
      const measure: number[] = measured(c);
      const out: number[][] = [];
      let j: number = 0;
      for (let k: number = 1; k < STEPS; k++) {
        const target: number = k / STEPS;
        while (j + 1 < DENSE && measure[j + 1]! < target) j++;
        const span: number = measure[j + 1]! - measure[j]! || 1;
        out.push(cubic(c, (j + Math.min(1, Math.max(0, (target - measure[j]!) / span))) / DENSE));
      }
      return out;
    });
  }

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

    const controls: IControls[] = vertices.map((v: number): IControls => {
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
      // its tangent plane using a unit direction, the handle no longer than
      // the closure's chord over three or the rim's way to the axis allows.
      const handle: number = Math.min(
        length / 3,
        HANDLE * Math.hypot(inward[0], inward[1]),
      );
      const first: number[] = p.map(
        (value: number, a: number): number =>
          value + (tangent[a]! * handle) / speed,
      );
      const last: number[] = tip.map(
        (value: number, a: number): number => value - radial[a]! / 2,
      );
      return [p, first, last, tip];
    });
    const rings: Map<number, number[]> = new Map();
    meridians(controls).forEach((points: number[][], i: number): void => {
      const row: number[] = [vertices[i]!];
      for (const point of points) {
        row.push(mesh.positions.length / 3);
        mesh.positions.push(...point);
      }
      row.push(pole);
      rings.set(vertices[i]!, row);
    });
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

  /**
   * Close an opening's trim loop on its base with the same cubic meridians,
   * each starting along the base surface's own tangent into the opening
   * (the reverse of its unit tangent across the loop, away from it), so the
   * rim continues the skin smoothly instead of a cut triangle's plane.
   *
   * @param mesh Mesh buffers to grow.
   * @param aperture The opening.
   * @param ring Loop vertices in order.
   * @param slopes Unit tangent of the base across the loop, away from the
   *   opening, at each loop vertex.
   * @param emit Triangle sink.
   */
  export function loop(
    mesh: AutoMovieHumanLoftMesh.IContext,
    aperture: IAutoMovieHumanLoftAperture,
    ring: readonly number[],
    slopes: readonly [number, number, number][],
    emit: (name: string, ...corners: number[]) => void,
  ): IAutoMovieHumanConstructionPath[] {
    const centre: number[] = [0, 1, 2].map(
      (a: number): number => ring.reduce((sum: number, v: number): number => sum + mesh.positions[3 * v + a]!, 0) / ring.length,
    );
    const tip: number[] = centre.map((v: number, a: number): number => v - aperture.forward[a]! * aperture.pocket!);
    const pole: number = mesh.positions.length / 3;
    mesh.positions.push(...tip);
    const controls: IControls[] = ring.map((v: number, i: number): IControls => {
      const p: number[] = [0, 1, 2].map((a: number): number => mesh.positions[3 * v + a]!);
      const tangent: number[] = slopes[i]!.map((x: number): number => -x);
      const length: number = Math.hypot(...p.map((value: number, a: number): number => tip[a]! - value));
      // The pole's tangent plane is across the aperture axis: the last
      // control lies toward the rim from the tip, in that plane.
      const towards: number[] = p.map((value: number, a: number): number => value - tip[a]!);
      const along: number = towards.reduce((s: number, x: number, a: number): number => s + x * aperture.forward[a]!, 0);
      const radial: number[] = towards.map((x: number, a: number): number => x - along * aperture.forward[a]!);
      const handle: number = Math.min(length / 3, HANDLE * Math.hypot(...radial));
      const first: number[] = p.map((value: number, a: number): number => value + tangent[a]! * handle);
      const last: number[] = tip.map((value: number, a: number): number => value + radial[a]! / 2);
      return [p, first, last, tip];
    });
    const rings: Map<number, number[]> = new Map();
    meridians(controls).forEach((points: number[][], i: number): void => {
      const row: number[] = [ring[i]!];
      for (const point of points) {
        row.push(mesh.positions.length / 3);
        mesh.positions.push(...point);
      }
      row.push(pole);
      rings.set(ring[i]!, row);
    });
    const open: IAutoMovieHumanApertureEdge[] = ring.map(
      (u: number, i: number): IAutoMovieHumanApertureEdge => ({ u, v: ring[(i + 1) % ring.length]!, inside: -1, name: aperture.name }),
    );
    for (const edge of open) {
      const u: number[] = rings.get(edge.u)!;
      const v: number[] = rings.get(edge.v)!;
      for (let k: number = 0; k + 1 < STEPS; k++) emit(edge.name, v[k]!, u[k]!, u[k + 1]!, v[k]!, u[k + 1]!, v[k + 1]!);
      emit(edge.name, v[STEPS - 1]!, u[STEPS - 1]!, pole);
    }
    return AutoMovieHumanApertureConstruction.generate(mesh, aperture.name, open, rings);
  }
}
