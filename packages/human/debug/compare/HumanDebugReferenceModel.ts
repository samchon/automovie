import type { IAutoMovieModelPart } from "@automovie/interface";

import type { IHumanDebugDocument } from "../contracts/IHumanDebugDocument";
import type { IHumanDebugReferencePack } from "../contracts/IHumanDebugReferencePack";

/** Largest reach of a wall above or below its section, mm; past it the stack shows a gap. */
const REACH: number = 25;

/** Colour of the reference's loft curves. */
const LOFT: string = "7a808a";

/**
 * The reference person drawn as the comparison's underlay: its sections as a clay surface or as
 * their own curves.
 *
 * `clay` stands every loop of a region's section as a vertical wall from halfway to the section
 * below to halfway to the section above (each reach at most {@link REACH} mm), so the walls of a
 * region close on each other with no gap and nothing has to be paired across sections: the stack is
 * exact at every section's height and stepped between, a display of the pack's own cuts, never a
 * surface fitted to them. Seen from the front or the side its silhouette is the sections' extremes;
 * from the top it shows the rims. `loft` draws every kept loop as a closed curve. Coordinates come
 * in as the pack's millimetres and leave in metres.
 */
export namespace HumanDebugReferenceModel {
  /**
   * The reference's parts or curves.
   *
   * @param pack The reference's sections.
   * @param style `clay` or `loft`.
   * @param keep Whether a point of a region (pack mm) is drawn; a loop edge is drawn when both
   *   its ends are, so a region cut to a part's box shows only its skin there.
   * @returns One clay part per region, `human.skin.reference.<region>/0`, or the loft curves
   *   `human.construction.reference.<region>/<k>`, in metres.
   */
  export function of(
    pack: IHumanDebugReferencePack,
    style: "clay" | "loft",
    keep: (region: string, x: number, y: number, z: number) => boolean = (): boolean => true,
  ): { parts: IAutoMovieModelPart[]; curves: IHumanDebugDocument.ICurve[] } {
    const parts: IAutoMovieModelPart[] = [];
    const curves: IHumanDebugDocument.ICurve[] = [];
    for (const region of pack.regions) {
      const sections: IHumanDebugReferencePack.ISection[] = region.sections;
      if (style === "loft") {
        let k: number = 0;
        for (const s of sections)
          for (const loop of s.loops) {
            // The loop whole, or each run of its kept points as an open curve.
            const points: [number, number][] = pairs(loop);
            const kept: boolean[] = points.map(([x, z]: [number, number]): boolean => keep(region.name, x, s.y, z));
            const metres = (run: [number, number][]): IHumanDebugDocument.Point[] =>
              run.map(([x, z]: [number, number]): IHumanDebugDocument.Point => [x / 1000, s.y / 1000, z / 1000]);
            if (kept.every(Boolean)) {
              curves.push({ id: `human.construction.reference.${region.name}/${k++}`, closed: true, points: metres(points), colour: LOFT });
              continue;
            }
            const start: number = kept.indexOf(false);
            let run: [number, number][] = [];
            for (let i: number = 1; i <= points.length; i++) {
              const j: number = (start + i) % points.length;
              if (kept[j]) run.push(points[j]!);
              if ((!kept[j] || i === points.length) && run.length >= 2) {
                curves.push({ id: `human.construction.reference.${region.name}/${k++}`, closed: false, points: metres(run), colour: LOFT });
              }
              if (!kept[j]) run = [];
            }
          }
        continue;
      }
      const positions: number[] = [];
      const indices: number[] = [];
      sections.forEach((s: IHumanDebugReferencePack.ISection, k: number): void => {
        const below: number = k === 0 ? REACH : Math.min(REACH, (s.y - sections[k - 1]!.y) / 2);
        const above: number = k === sections.length - 1 ? REACH : Math.min(REACH, (sections[k + 1]!.y - s.y) / 2);
        for (const loop of s.loops) {
          const points: [number, number][] = pairs(loop);
          const n: number = points.length;
          if (n < 3) continue;
          const base: number = positions.length / 3;
          for (const [x, z] of points) positions.push(x / 1000, (s.y - below) / 1000, z / 1000, x / 1000, (s.y + above) / 1000, z / 1000);
          const kept: boolean[] = points.map(([x, z]: [number, number]): boolean => keep(region.name, x, s.y, z));
          for (let i: number = 0; i < n; i++) {
            const j: number = (i + 1) % n;
            if (!kept[i] || !kept[j]) continue;
            indices.push(base + 2 * i, base + 2 * j, base + 2 * i + 1, base + 2 * j, base + 2 * j + 1, base + 2 * i + 1);
          }
        }
      });
      if (indices.length === 0) continue;
      parts.push({
        id: `human.skin.reference.${region.name}/0`,
        name: `reference ${pack.id} ${region.name}`,
        attachedBone: null,
        material: null,
        transform: null,
        geometry: { type: "mesh", mesh: { positions, indices, normals: null, uvs: null, skin: null } },
      });
    }
    return { parts, curves };
  }

  /** Flat `x, z` pairs as points. */
  function pairs(flat: readonly number[]): [number, number][] {
    const out: [number, number][] = [];
    for (let i: number = 0; i + 1 < flat.length; i += 2) out.push([flat[i]!, flat[i + 1]!]);
    return out;
  }
}
