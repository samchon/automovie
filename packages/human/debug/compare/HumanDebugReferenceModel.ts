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
 * region meet vertically when neighbouring support is within the reach cap; no paths are paired
 * across sections. Missing outer support and wider intervals remain gaps. The stack follows each
 * supplied polyline at its own section height and steps between, a display of the pack's cuts, never a
 * surface fitted to them. Seen from the front or the side its silhouette is the sections' extremes;
 * from the top it shows the rims. Open arcs form walls only along their consecutive points, without an invented closing edge. `loft` preserves each kept curve's closure. Coordinates come
 * in as the pack's millimetres and leave in metres.
 *
 * @evidence contracts/common.md#principled-implementation Displays the supplied section polylines without fitting a skin: closed loops wrap, open arcs retain their endpoints, and clay walls stop halfway to adjacent sections with the declared 25 mm reach cap. Gaps beyond that support remain visible.
 * @evidence contracts/common.md#clear-and-simple-design One producer owns both clay walls and loft curves, preserving the same reference coordinates and closure in each representation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Adds no reference-specific repair, closing chord across an open arc or generated-person adjustment.
 * @evidence contracts/common.md#meaningful-documentation States the wall approximation, endpoint ownership, crop behavior and conversion from pack mm to model metres.
 * @evidence contracts/performance.md#efficient-algorithms Visits each supplied point a constant number of times, plus the keep predicate's own cost; buffers grow with the displayed reference points.
 * @evidence contracts/performance.md#reuse-equivalent-work Clay and loft consume one pack supplied by the caller; display-dependent geometry is rebuilt so crop and style changes take effect.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returns fresh O(P) point/index or curve arrays for P input points and retains no pack, cache, renderer or GPU handle after the call.
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
   *
   * @evidence contracts/common.md#principled-implementation A closed N-point loop has N edges and an open N-point arc has N-1; cropped open runs are traversed linearly, while a cropped closed loop can cross its stored start. No missing support is filled.
   * @evidence contracts/common.md#clear-and-simple-design The style branch changes only the displayed primitive; region identity, point conversion and the caller's keep predicate remain shared inputs.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not join the endpoints of an open arc or infer coordinates from the compared person's shape.
   * @evidence contracts/common.md#meaningful-documentation Names the coordinate units, ids, edge-based crop rule and returned ownership.
   * @evidence contracts/performance.md#efficient-algorithms Traversal and temporary pairs are O(P) plus P predicate calls; a predicate testing B crop boxes can make the combined work O(PB). No nearest-surface solve or full-figure build occurs here.
   * @evidence contracts/performance.md#reuse-equivalent-work Computes each section's wall reaches once and each path's converted point list once within its selected style; different display requests intentionally rebuild their own arrays.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns returned geometry, and each loop's temporary pairs/keep flags end with that loop; the input pack is read without mutation.
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
          for (const closed of [true, false])
          for (const loop of (closed ? s.loops : (s.arcs ?? []))) {
            // The loop whole, or each run of its kept points as an open curve.
            const points: [number, number][] = pairs(loop);
            if (points.length < (closed ? 3 : 2)) continue;
            const kept: boolean[] = points.map(([x, z]: [number, number]): boolean => keep(region.name, x, s.y, z));
            const metres = (run: [number, number][]): IHumanDebugDocument.Point[] =>
              run.map(([x, z]: [number, number]): IHumanDebugDocument.Point => [x / 1000, s.y / 1000, z / 1000]);
            if (kept.every(Boolean)) {
              curves.push({ id: `human.construction.reference.${region.name}/${k++}`, closed, points: metres(points), colour: LOFT });
              continue;
            }
            const start: number = closed ? kept.indexOf(false) : -1;
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
        for (const closed of [true, false])
        for (const loop of (closed ? s.loops : (s.arcs ?? []))) {
          const points: [number, number][] = pairs(loop);
          const n: number = points.length;
          if (n < (closed ? 3 : 2)) continue;
          const base: number = positions.length / 3;
          for (const [x, z] of points) positions.push(x / 1000, (s.y - below) / 1000, z / 1000, x / 1000, (s.y + above) / 1000, z / 1000);
          const kept: boolean[] = points.map(([x, z]: [number, number]): boolean => keep(region.name, x, s.y, z));
          for (let i: number = 0; i < (closed ? n : n - 1); i++) {
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
