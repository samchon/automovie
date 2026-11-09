import type { CaptureModel } from "../inspection/CaptureModel";
import { CaptureOutliers } from "../inspection/CaptureOutliers";
import type { CaptureSelection } from "../inspection/CaptureSelection";
import type { NodeCanvasTypes as N } from "../inspection/NodeCanvasTypes";

type V3 = CaptureModel.Vec3;

/**
 * Scene assembly of the one-shot capture: for one selection, stage and
 * display frame it gathers the prepared parts' meshes and polylines in the
 * existing Node display frame (metres, +X forward, +Y up, +Z anatomical left)
 * for `NodeCanvasRaster`. Providers write the ISB convention (+Z to the
 * subject's right), so the display map negates Z after taking points into
 * the display frame; a local display frame is the inverse of that frame's
 * composed placement. Display meshes are built once per part, kind and frame
 * and reused by identity, which the reference-background cache keys on.
 *
 * Each part's reference mesh is drawn where its provider placed it: a
 * provider may register the reference to its own datums or keep her own
 * world, and the part's `reference.method` in the manifest says which. Parts
 * placed differently are not in one shared world, so a whole-figure
 * reference can show the same body more than once.
 */
export namespace NodeCaptureRender {
  /** Reference clay colour, linear RGB: light, so the original curves drawn over it keep their contrast. */
  export const REFERENCE_COLOUR: N.Point = [0.72, 0.77, 0.86];

  /** Generated clay colour, linear RGB. */
  export const CLAY_COLOUR: N.Point = [0.62, 0.56, 0.5];

  /** A display frame: `world`, or a part's segment frame. */
  export interface IDisplay {
    /** `world` or the frame name. */
    name: string;

    /** World calibration mm to display metres. */
    map(p: V3): N.Point;
  }

  /** One cell's scene before its camera is fitted. */
  export interface IScene {
    /** Meshes, reference first. */
    meshes: N.Mesh[];

    /** Polylines. */
    curves: N.Curve[];

    /** Datum points, display metres; drawn as crosses once the camera scale is known. */
    datums: N.Point[];

    /** Line visibility rule. */
    lineMode: "xray" | "depth";

    /** Whether the first mesh is a part's reference, as its provider placed it. */
    reference: boolean;

    /** Related names the cell does not draw, with causes. */
    unavailable: { name: string; cause: string }[];
  }

  /** The display map of a frame; `null` is the world. */
  export function display(name: string, transform: CaptureModel.ITransform | null): IDisplay {
    if (transform === null) return { name: "world", map: (p: V3): N.Point => [p[0] / 1000, p[1] / 1000, -p[2] / 1000] };
    const [x, y, z]: [V3, V3, V3] = transform.axes;
    const o: V3 = transform.origin;
    return {
      name,
      map: (p: V3): N.Point => {
        const d: V3 = [p[0] - o[0], p[1] - o[1], p[2] - o[2]];
        return [dot(d, x) / 1000, dot(d, y) / 1000, -dot(d, z) / 1000];
      },
    };
  }

  /**
   * A slab crop of a display mesh: triangles whose three vertices lie within
   * `[low, high]` on display axis `axis` (metres). Original vertex positions
   * stay unchanged; boundary triangles are excluded without caps, as the
   * existing reference part crop does.
   */
  export interface ICrop {
    /** Crop identity in mesh ids and cache keys. */
    id: string;

    /** Display axis index. */
    axis: 0 | 1 | 2;

    /** Lower bound, metres. */
    low: number;

    /** Upper bound, metres. */
    high: number;
  }

  /** Mesh lookup: one display mesh per (part, kind, display frame, crop), shared by identity. */
  export type IMeshes = (part: CaptureModel.IPart, kind: "reference" | "clay", d: IDisplay, crop?: ICrop | null) => N.Mesh | null;

  /** Display meshes built once per (part, kind, display frame, crop), so equal requests share one object. */
  export function meshes(): IMeshes {
    const cache: Map<string, N.Mesh | null> = new Map();
    return (part: CaptureModel.IPart, kind: "reference" | "clay", d: IDisplay, crop: ICrop | null = null): N.Mesh | null => {
      const key: string = `${part.name}|${kind}|${d.name}|${crop?.id ?? ""}`;
      if (cache.has(key)) return cache.get(key)!;
      const source: CaptureModel.ITriangles | null =
        kind === "reference" ? (part.reference.status === "available" ? part.reference.mesh : null) : part.loft.status === "available" ? part.loft.clay : null;
      let mesh: N.Mesh | null = null;
      if (source !== null) {
        const positions: number[] = new Array<number>(source.positions.length);
        for (let i: number = 0; i + 2 < source.positions.length; i += 3) {
          const p: N.Point = d.map([source.positions[i]!, source.positions[i + 1]!, source.positions[i + 2]!]);
          positions[i] = p[0];
          positions[i + 1] = p[1];
          positions[i + 2] = p[2];
        }
        let indices: readonly number[] = source.indices;
        if (crop !== null) {
          const inside: (v: number) => boolean = (v: number): boolean => positions[v * 3 + crop.axis]! >= crop.low && positions[v * 3 + crop.axis]! <= crop.high;
          const kept: number[] = [];
          for (let i: number = 0; i + 2 < indices.length; i += 3) if (inside(indices[i]!) && inside(indices[i + 1]!) && inside(indices[i + 2]!)) kept.push(indices[i]!, indices[i + 1]!, indices[i + 2]!);
          indices = kept;
        }
        const id: string = `${kind === "reference" ? "reference" : "loft-clay"}:${part.name}@${d.name}${crop === null ? "" : `#${crop.id}`}`;
        mesh = indices.length === 0 ? null : { id, positions, indices, colour: kind === "reference" ? REFERENCE_COLOUR : CLAY_COLOUR };
      }
      cache.set(key, mesh);
      return mesh;
    };
  }

  /**
   * The reference slab of a single-curve row: the display axis along which
   * the curve, its aids and datums extend most, between their extremes
   * widened by the existing 15 mm reference crop margin. Along a limb this is
   * the segment's stations, so a top view shows that segment's reference
   * section instead of the whole region in front of it. Null for other rows.
   */
  export function crop(selection: CaptureSelection.ISelection, parts: ReadonlyMap<string, CaptureModel.IPart>, d: IDisplay): ICrop | null {
    if (selection.curve === null) return null;
    const points: N.Point[] = CaptureOutliers.finite(framing(selection, parts, d)).points;
    if (points.length === 0) return null;
    const low: N.Point = [Infinity, Infinity, Infinity];
    const high: N.Point = [-Infinity, -Infinity, -Infinity];
    for (const p of points)
      for (let c: number = 0; c < 3; ++c) {
        low[c] = Math.min(low[c]!, p[c]!);
        high[c] = Math.max(high[c]!, p[c]!);
      }
    const axis: 0 | 1 | 2 = ([0, 1, 2] as const).reduce((best: 0 | 1 | 2, c: 0 | 1 | 2): 0 | 1 | 2 => (high[c]! - low[c]! > high[best]! - low[best]! ? c : best), 0);
    return { id: `slab:${selection.curve}:${"xyz"[axis]}`, axis, low: low[axis]! - 0.015, high: high[axis]! + 0.015 };
  }

  /**
   * The reference slab of a part row: the display height range of the part's
   * own clay, widened by the existing 15 mm reference crop margin, so the
   * reference stage and the framing show the reference's same region rather
   * than the part's whole reference body. A provider can preserve its own
   * selected reference extent. Null without a loft.
   */
  export function regionCrop(part: CaptureModel.IPart, d: IDisplay): ICrop | null {
    if (part.reference.status === "available" && part.reference.cropToLoft === false) return null;
    if (part.loft.status !== "available") return null;
    const s: CaptureModel.ITriangles = part.loft.clay;
    let low: number = Infinity;
    let high: number = -Infinity;
    for (let i: number = 0; i + 2 < s.positions.length; i += 3) {
      const y: number = d.map([s.positions[i]!, s.positions[i + 1]!, s.positions[i + 2]!])[1];
      if (y < low) low = y;
      if (y > high) high = y;
    }
    if (!(low <= high)) return null;
    return { id: `region:${part.name}:y`, axis: 1, low: low - 0.015, high: high + 0.015 };
  }

  /**
   * The scene of one cell, or the cause it cannot be drawn. The original
   * stage draws the selected curves with their aids and datums over each
   * part's reference as its provider placed it, lines always visible (xray);
   * the loft stages draw the generated loft curves alone, over the clay with
   * depth-tested lines, and the clay alone. A missing loft makes the loft
   * stages unavailable; a missing reference is named in the cell's
   * unavailable list.
   */
  export function scene(
    selection: CaptureSelection.ISelection,
    stage: CaptureSelection.Stage,
    parts: ReadonlyMap<string, CaptureModel.IPart>,
    d: IDisplay,
    mesh: IMeshes,
  ): IScene | { cause: string } {
    const drawn: CaptureModel.IPart[] = selection.parts.map((name: string): CaptureModel.IPart => parts.get(name)!);
    const unavailable: { name: string; cause: string }[] = [...selection.unavailable];
    const line: (l: CaptureModel.ILine) => N.Curve = (l: CaptureModel.ILine): N.Curve => ({ id: l.id, points: l.points.map(d.map), closed: l.closed, colour: l.colour });
    if (stage === "original") {
      const meshes: N.Mesh[] = [];
      const slab: ICrop | null = crop(selection, parts, d);
      for (const part of drawn) {
        const ref: N.Mesh | null = mesh(part, "reference", d, slab);
        if (ref !== null) meshes.push(ref);
        else unavailable.push({ name: `reference:${part.name}`, cause: part.reference.status === "unavailable" ? part.reference.cause : "no reference mesh" });
      }
      const curves: N.Curve[] = [];
      const datums: N.Point[] = [];
      const seen: Set<string> = new Set();
      for (const part of drawn)
        for (const c of part.curves) {
          if (selection.curve !== null && c.id !== selection.curve) continue;
          for (const a of c.aids)
            if (!seen.has(a.id)) {
              seen.add(a.id);
              curves.push(line(a));
            }
          for (const l of c.lines) curves.push(line(l));
          for (const p of c.datums) datums.push(d.map(p));
        }
      if (selection.curve !== null && curves.length === 0) return { cause: `curve ${selection.curve} has no evaluated line or aid` };
      return { meshes, curves, datums, lineMode: "xray", reference: meshes.length !== 0, unavailable };
    }
    if (stage === "reference") {
      // Each drawn part's reference mesh as clay, as its provider placed it,
      // under the cameras every stage of the row shares, so each view pairs
      // with the clay stage's view of the same row.
      const meshes: N.Mesh[] = [];
      const sources: Set<CaptureModel.ITriangles> = new Set();
      for (const part of drawn) {
        // The whole figure shows each distinct reference mesh once, uncut;
        // a part row shows the reference at its own clay's height range.
        const whole: boolean = selection.kind === "whole";
        if (whole && part.reference.status === "available") {
          if (sources.has(part.reference.mesh)) continue;
          sources.add(part.reference.mesh);
        }
        const ref: N.Mesh | null = mesh(part, "reference", d, whole ? null : regionCrop(part, d));
        if (ref !== null) meshes.push(ref);
        else unavailable.push({ name: `reference:${part.name}`, cause: part.reference.status === "unavailable" ? part.reference.cause : "no reference mesh" });
      }
      if (meshes.length === 0) return { cause: `no reference mesh for ${selection.parts.join(", ")}` };
      return { meshes, curves: [], datums: [], lineMode: "depth", reference: false, unavailable };
    }
    const meshes: N.Mesh[] = [];
    const candidates: Map<CaptureModel.IPart, N.Mesh> = new Map();
    const curves: N.Curve[] = [];
    const refused: string[] = [];
    for (const part of drawn) {
      if (part.loft.status === "unavailable") {
        refused.push(`${part.name}: ${part.loft.cause}`);
        continue;
      }
      if (stage !== "clay") for (const l of part.loft.lines) curves.push(line(l));
      if (stage !== "loft") {
        const clay: N.Mesh | null = mesh(part, "clay", d);
        if (clay !== null) candidates.set(part, clay);
      }
    }

    // Only a displayed host replaces the separate clay meshes it contains.
    const included: Set<string> = new Set();
    for (const part of candidates.keys())
      for (const name of part.included ?? []) if (name !== part.name) included.add(name);
    const covered: Set<string> = new Set();
    for (const part of candidates.keys()) {
      if (included.has(part.name)) continue;
      for (const name of part.included ?? []) if (name !== part.name) covered.add(name);
    }
    for (const [part, clay] of candidates) if (!covered.has(part.name)) meshes.push(clay);

    if (refused.length === drawn.length) return { cause: `no loft: ${refused.join(" | ")}` };
    for (const r of refused) unavailable.push({ name: `loft:${r.split(":")[0]}`, cause: r });
    return { meshes, curves, datums: [], lineMode: "depth", reference: false, unavailable };
  }

  /**
   * Points a selection's cameras are fitted to in one display frame, the
   * same for every stage so the stages of a row share their cameras: a curve
   * row frames its curve, aids and datums; other rows frame every drawn
   * part's curves and aids, its clay or, without a loft, nothing more, and
   * its reference as its provider placed it.
   */
  export function framing(selection: CaptureSelection.ISelection, parts: ReadonlyMap<string, CaptureModel.IPart>, d: IDisplay): N.Point[] {
    const out: N.Point[] = [];
    for (const name of selection.parts) {
      const part: CaptureModel.IPart = parts.get(name)!;
      for (const c of part.curves) {
        if (selection.curve !== null && c.id !== selection.curve) continue;
        for (const l of [...c.lines, ...c.aids]) for (const p of l.points) out.push(d.map(p));
        for (const p of c.datums) out.push(d.map(p));
      }
      if (selection.curve !== null) continue;
      const sources: CaptureModel.ITriangles[] = [];
      if (part.loft.status === "available") sources.push(part.loft.clay);
      if (part.reference.status === "available") sources.push(part.reference.mesh);
      // A part row frames the reference only within its clay's height range,
      // the region the reference stage draws; the whole figure frames it all.
      const region: ICrop | null = selection.kind === "whole" ? null : regionCrop(part, d);
      const referenceMesh: CaptureModel.ITriangles | null = part.reference.status === "available" ? part.reference.mesh : null;
      for (const s of sources)
        for (let i: number = 0; i + 2 < s.positions.length; i += 3 * 7) {
          const p: N.Point = d.map([s.positions[i]!, s.positions[i + 1]!, s.positions[i + 2]!]);
          if (region === null || s !== referenceMesh || (p[region.axis]! >= region.low && p[region.axis]! <= region.high)) out.push(p);
        }
    }
    return out;
  }

  /**
   * Thicken lines to two pixels for legible contact sheets: each polyline is
   * repeated shifted by one pixel along screen right, up and both, which
   * leaves its depth unchanged; loft layer rings stay one pixel so the dense
   * rings do not hide the clay. Each datum becomes a 7-pixel black cross.
   */
  export function finish(scene: IScene, camera: N.Camera): N.Curve[] {
    const px: number = 1 / camera.scale;
    const shift: (c: N.Curve, sx: number, sy: number) => N.Curve = (c: N.Curve, sx: number, sy: number): N.Curve => ({
      ...c,
      points: c.points.map((p: N.Point): N.Point => [p[0] + (camera.right[0] * sx + camera.up[0] * sy) * px, p[1] + (camera.right[1] * sx + camera.up[1] * sy) * px, p[2] + (camera.right[2] * sx + camera.up[2] * sy) * px]),
    });
    const out: N.Curve[] = [];
    for (const c of scene.curves) {
      out.push(c);
      if (!c.id.startsWith("loft:ring:")) out.push(shift(c, 1, 0), shift(c, 0, 1), shift(c, 1, 1));
    }
    const r: number = 3.5 * px;
    scene.datums.forEach((p: N.Point, k: number): void => {
      for (const [ax, ay] of [[1, 1], [1, -1]] as const) {
        const a: N.Point = [p[0] - (camera.right[0] * ax + camera.up[0] * ay) * r, p[1] - (camera.right[1] * ax + camera.up[1] * ay) * r, p[2] - (camera.right[2] * ax + camera.up[2] * ay) * r];
        const b: N.Point = [p[0] + (camera.right[0] * ax + camera.up[0] * ay) * r, p[1] + (camera.right[1] * ax + camera.up[1] * ay) * r, p[2] + (camera.right[2] * ax + camera.up[2] * ay) * r];
        const cross: N.Curve = { id: `datum:${k}`, points: [a, b], closed: false, colour: "000000" };
        out.push(cross, shift(cross, 1, 0));
      }
    });
    return out;
  }

  function dot(a: V3, b: V3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
}
