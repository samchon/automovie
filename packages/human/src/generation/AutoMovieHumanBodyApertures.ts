import { AutoMovieHumanLoftAperture } from "../lofting/AutoMovieHumanLoftAperture";
import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftMesh } from "../lofting/AutoMovieHumanLoftMesh";
import type { IAutoMovieHumanLoftAperture } from "../lofting/IAutoMovieHumanLoftAperture";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanAperturePocket } from "./AutoMovieHumanAperturePocket";
import { AutoMovieHumanEyelid } from "./AutoMovieHumanEyelid";
import { AutoMovieHumanEyelidSurface } from "./AutoMovieHumanEyelidSurface";
import type { IAutoMovieHumanApertureEdge } from "./IAutoMovieHumanApertureEdge";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanConstructionPath } from "./IAutoMovieHumanConstructionPath";

/** Openings and their refinement, clipping, and shared skin boundaries. */
export namespace AutoMovieHumanBodyApertures {
  /** An aperture with its margin and projected cut outline evaluated once. */
  export interface IPrepared {
    /** Aperture data. */
    aperture: IAutoMovieHumanLoftAperture;

    /**
     * Projected outline of the cut: the margin itself, or for an eye the
     * outer edge of the lid band around it.
     */
    outline: AutoMovieHumanLoftAperture.IOutline;

    /**
     * Lid of an eye opening: the calibrated eye nearest the margin's centre
     * lies behind it; null for any other opening.
     */
    lid: AutoMovieHumanEyelid.ILid | null;
  }

  /** Station spacing where a chain's rings pass near an opening, mm. */
  const SPACING: number = 0.5;

  /** Distance around an opening's outline that still counts as near, mm. */
  const REACH: number = 2;

  /**
   * Evaluate each aperture's margin once and find the globe behind it.
   *
   * @param apertures Calibrated openings.
   * @param eyes Calibrated eye spheres.
   */
  export function prepare(
    apertures: readonly IAutoMovieHumanLoftAperture[],
    eyes: readonly IAutoMovieHumanBodyCalibration.IEye[],
  ): IPrepared[] {
    return apertures.map((aperture: IAutoMovieHumanLoftAperture): IPrepared => {
      const margin: AutoMovieHumanLoftAperture.Point[] =
        AutoMovieHumanLoftAperture.polyline(aperture);

      // A globe belongs to the opening whose margin centre lies within its
      // radius plus a margin of half that again.
      const centre: number[] = [0, 1, 2].map(
        (axis: number): number =>
          margin.reduce(
            (sum: number, p: AutoMovieHumanLoftAperture.Point): number =>
              sum + p[axis]!,
            0,
          ) / margin.length,
      );
      let globe: IAutoMovieHumanBodyCalibration.IEye | null = null;
      let best: number = Infinity;
      for (const eye of eyes) {
        const d: number = Math.hypot(
          eye.centre[0] - centre[0]!,
          eye.centre[1] - centre[1]!,
          eye.centre[2] - centre[2]!,
        );
        if (d < 1.5 * eye.radius && d < best) {
          best = d;
          globe = eye;
        }
      }
      if (globe === null)
        return {
          aperture,
          outline: AutoMovieHumanLoftAperture.outline(aperture, margin),
          lid: null,
        };

      // An eye is cut out to the lid band's outer edge.
      const lid: AutoMovieHumanEyelid.ILid = AutoMovieHumanEyelid.create(
        aperture,
        globe,
      );
      return {
        aperture,
        outline: AutoMovieHumanLoftAperture.outline(
          aperture,
          lid.samples.map(
            (
              s: AutoMovieHumanEyelid.ISample,
            ): AutoMovieHumanLoftAperture.Point =>
              AutoMovieHumanEyelid.add(
                s.contact,
                AutoMovieHumanEyelid.scale(
                  s.outward,
                  AutoMovieHumanEyelid.rule.band,
                ),
              ),
          ),
        ),
        lid,
      };
    });
  }

  /**
   * Stations refined wherever a chain's rings pass near an opening.
   *
   * An interval between consecutive stations is split into SPACING mm steps
   * when its end or middle ring has a point within REACH of an opening's
   * cut outline, so the cut is traced finely whatever the bisection chose
   * and whatever the orientation of the chain's sections.
   *
   * @param apertures Prepared openings.
   * @param target Chain being lofted.
   * @param heights Increasing stations from the bisection.
   * @param phases Probe phases, the chain's own ring phases.
   */
  export function refine(
    apertures: readonly IPrepared[],
    target: IAutoMovieHumanLoftChain,
    heights: readonly number[],
    phases: readonly number[],
  ): number[] {
    if (!apertures.length) return [...heights];
    const near = (s: number): boolean =>
      AutoMovieHumanLoftChain.ring(target, s, phases).some(
        (p: [number, number, number]): boolean =>
          apertures.some(
            (a: IPrepared): boolean =>
              AutoMovieHumanLoftAperture.signed(a.outline, p, REACH) < REACH,
          ),
      );

    const out: number[] = [heights[0]!];
    const marked: boolean[] = heights.map(near);
    for (let k: number = 0; k + 1 < heights.length; k++) {
      const a: number = heights[k]!;
      const b: number = heights[k + 1]!;
      const steps: number = Math.ceil((b - a) / SPACING);
      if (steps > 1 && (marked[k] || marked[k + 1] || near((a + b) / 2)))
        for (let i: number = 1; i < steps; i++)
          out.push(a + ((b - a) * i) / steps);
      out.push(b);
    }
    return out;
  }

  /**
   * Cut every opening out of the skin and close it: lids for eyes, pockets
   * for the rest.
   *
   * Each vertex takes the least {@link AutoMovieHumanLoftAperture.signed}
   * distance over the openings' cut outlines. Every triangle is clipped at
   * its zero level: vertices on the opening side are dropped, and each edge
   * the outline crosses gets one new vertex on its original edge and
   * shared by the two triangles of the edge, so the cut skin stays
   * connected and its open edge lies on the outline.
   *
   * The open edges of an eye form a loop on the lid band's outer edge,
   * which {@link AutoMovieHumanEyelidSurface} continues into the lid. Nasal
   * openings continue along regular cubic meridians into an inferred rounded
   * closure, preserving the retained triangle's exterior tangent plane.
   * New triangles take the group of the skin triangle on the open edge they
   * continue, so they render with the skin they belong to.
   *
   * @param mesh Skin buffers with groups; triangles counter-clockwise from
   *   outside.
   * @param apertures Prepared openings.
   */
  export function cut(
    mesh: AutoMovieHumanLoftMesh.IContext,
    apertures: readonly IPrepared[],
  ): IAutoMovieHumanConstructionPath[] {
    if (!apertures.length) return [];

    // Signed distance and owning opening of every original vertex.
    const count: number = mesh.positions.length / 3;
    const value: number[] = new Array<number>(count).fill(Infinity);
    const owner: number[] = new Array<number>(count).fill(-1);
    for (let v: number = 0; v < count; v++) {
      const p: AutoMovieHumanLoftAperture.Point = [
        mesh.positions[3 * v]!,
        mesh.positions[3 * v + 1]!,
        mesh.positions[3 * v + 2]!,
      ];
      apertures.forEach((a: IPrepared, i: number): void => {
        const d: number = AutoMovieHumanLoftAperture.signed(
          a.outline,
          p,
          2 * REACH,
        );
        if (d < value[v]!) {
          value[v] = d;
          owner[v] = i;
        }
      });
    }

    // Margin vertices: originals exactly on the outline, and edge
    // crossings. A crossing remembers the kept vertex of its edge, from
    // which the skin's slope across the outline is read.
    const margin: Map<number, number> = new Map();
    for (let v: number = 0; v < count; v++)
      if (value[v] === 0) margin.set(v, owner[v]!);
    const crossings: Map<number, number> = new Map();
    /** One shared root on each original edge; projection never moves retained skin. */
    const crossing: (p: number, q: number) => number = (
      p: number,
      q: number,
    ): number => {
      // A far vertex (infinite distance) next to the opening places the
      // crossing at the opening's side.
      let f: number = Number.isFinite(value[p]!)
        ? value[p]! / (value[p]! - value[q]!)
        : 1;
      // A crossing within rounding of an edge's end is that end, which then
      // lies on the outline.
      const side: number = owner[value[p]! < 0 ? p : q]!;
      if (f <= 1e-9) {
        margin.set(p, side);
        return p;
      }
      if (f >= 1 - 1e-9) {
        if (Number.isFinite(value[p]!)) margin.set(q, side);
        return q;
      }
      const key: number = Math.min(p, q) * count + Math.max(p, q);
      const found: number | undefined = crossings.get(key);
      if (found !== undefined) return found;

      // Signed Euclidean distance is nonlinear along a triangle edge. A
      // secant crossing need not lie on the cut outline and gives adjacent
      // profile columns different band widths. Bracket the actual root on
      // the original edge, retaining its triangle's position authority.
      let lower: number = 0;
      let upper: number = 1;
      const negative: boolean = value[p]! < 0;
      for (let iteration: number = 0; iteration < 40; iteration++) {
        f = (lower + upper) / 2;
        const probe: AutoMovieHumanLoftAperture.Point = [0, 1, 2].map(
          (axis: number): number =>
            mesh.positions[3 * p + axis]! +
            f * (mesh.positions[3 * q + axis]! - mesh.positions[3 * p + axis]!),
        ) as AutoMovieHumanLoftAperture.Point;
        const signed: number = AutoMovieHumanLoftAperture.signed(
          apertures[side]!.outline,
          probe,
          2 * REACH,
        );
        if (signed < 0 === negative) lower = f;
        else upper = f;
      }
      const index: number = mesh.positions.length / 3;
      const linear: AutoMovieHumanLoftAperture.Point = [0, 1, 2].map(
        (axis: number): number =>
          mesh.positions[3 * p + axis]! +
          f * (mesh.positions[3 * q + axis]! - mesh.positions[3 * p + axis]!),
      ) as AutoMovieHumanLoftAperture.Point;
      // Keep the crossing on its original triangle edge. Moving it in the
      // projection plane can reverse a retained triangle and detaches the
      // boundary from the surface whose transverse derivative we consume.
      mesh.positions.push(linear[0], linear[1], linear[2]);
      crossings.set(key, index);
      margin.set(index, side);
      return index;
    };

    // Clip group by group, keeping the side where the distance is not
    // negative, and fan the kept polygon.
    const indices: number[] = [];
    const groups: { name: string; start: number }[] = [];
    const faces: string[] = [];
    mesh.groups.forEach(
      (g: { name: string; start: number }, k: number): void => {
        const end: number = mesh.groups[k + 1]?.start ?? mesh.indices.length;
        groups.push({ name: g.name, start: indices.length });
        for (let t: number = g.start; t < end; t += 3) {
          const corners: number[] = [
            mesh.indices[t]!,
            mesh.indices[t + 1]!,
            mesh.indices[t + 2]!,
          ];
          const polygon: number[] = [];
          corners.forEach((p: number, i: number): void => {
            const q: number = corners[(i + 1) % 3]!;
            const keep: boolean = value[p]! >= 0;
            if (keep) polygon.push(p);
            if (keep !== value[q]! >= 0) polygon.push(crossing(p, q));
          });
          const kept: number[] = polygon.filter(
            (v: number, i: number): boolean =>
              v !== polygon[(i + polygon.length - 1) % polygon.length],
          );
          for (let i: number = 1; i + 1 < kept.length; i++) {
            indices.push(kept[0]!, kept[i]!, kept[i + 1]!);
            faces.push(g.name);
          }
        }
      },
    );

    // Open margin edges per opening: directed edges whose reverse no
    // triangle uses, with the group of their triangle.
    const directed: Set<number> = new Set();
    const total: number = mesh.positions.length / 3;
    for (let t: number = 0; t < indices.length; t += 3)
      for (let i: number = 0; i < 3; i++)
        directed.add(indices[t + i]! * total + indices[t + ((i + 1) % 3)]!);
    const open: IAutoMovieHumanApertureEdge[][] = apertures.map(
      (): IAutoMovieHumanApertureEdge[] => [],
    );
    for (let t: number = 0; t < indices.length; t += 3)
      for (let i: number = 0; i < 3; i++) {
        const u: number = indices[t + i]!;
        const v: number = indices[t + ((i + 1) % 3)]!;
        if (directed.has(v * total + u)) continue;
        const a: number | undefined = margin.get(u);
        if (a === undefined || a !== margin.get(v)) continue;
        open[a]!.push({
          u,
          v,
          inside: indices[t + ((i + 2) % 3)]!,
          name: faces[t / 3]!,
        });
      }

    // Close each opening, collecting its triangles by group.
    const added: Map<string, number[]> = new Map();
    /** Group continuation triangles with the skin edge that owns them. */
    const emit: (name: string, ...corners: number[]) => void = (
      name: string,
      ...corners: number[]
    ): void => {
      const list: number[] = added.get(name) ?? [];
      list.push(...corners);
      added.set(name, list);
    };
    const construction: IAutoMovieHumanConstructionPath[] = [];
    apertures.forEach((prepared: IPrepared, a: number): void => {
      if (prepared.lid !== null)
        construction.push(
          ...AutoMovieHumanEyelidSurface.generate(
            mesh,
            prepared,
            prepared.lid,
            open[a]!,
            emit,
          ),
        );
      else if (prepared.aperture.pocket! > 0)
        construction.push(
          ...AutoMovieHumanAperturePocket.generate(
            mesh,
            prepared.aperture,
            open[a]!,
            emit,
          ),
        );
    });
    for (const [name, list] of added) {
      groups.push({ name, start: indices.length });
      indices.push(...list);
    }

    mesh.indices = indices;
    mesh.groups = groups;
    return construction;
  }
}
