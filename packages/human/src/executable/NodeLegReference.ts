import fs from "node:fs";
import { AutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanLegSegmentFrames } from "../generation/leg/AutoMovieHumanLegSegmentFrames";
import { HumanInspectionReferenceMesh } from "../inspection/HumanInspectionReferenceMesh";
import { HumanNodePaths } from "./HumanNodePaths";
import type { NodeLegBuild } from "./NodeLegBuild";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * The reference's left leg and foot for the leg view-curve renderer's
 * diagnostic overlay, read and registered into this leg's own chain for
 * comparison only; nothing here feeds generation.
 */
export namespace NodeLegReference {
  /** The registered points and the registration's own measurements. */
  export interface IRegistered {
    /** Reference vertices placed in the femur frame of this leg. */
    points: V3[];

    /** Measurements of the registration, calibration mm or radians. */
    measures: Record<string, number>;
  }

  /** One curve's deviation from the registered reference over its segment, mm. */
  export interface IDeviation {
    /** Segment: `femur`, `tibia` or `foot`. */
    segment: string;

    /** The curve: an outline (guide) or a quarter's diagonal (fullness). */
    curve: string;

    /** Its section phase, radians (0 lateral, pi / 2 posterior on the left leg). */
    phase: number;

    /** Stations compared (every 2 mm where the reference has points). */
    samples: number;

    /** Largest absolute deviation. */
    max: number;

    /** Mean absolute deviation. */
    mean: number;

    /** Mean signed deviation, the model's radius less the reference's (positive: the model is fuller). */
    signed: number;

    /** The walk station of the largest deviation, or null. */
    worst: number | null;
  }

  /** The compared curves: the four guides (the outlines) and the four quarters' diagonals (the fullness), by section phase on the left leg's chart. */
  export const CURVES: readonly [string, number][] = [
    ["lateral", 0],
    ["lateral-posterior diagonal", Math.PI / 4],
    ["posterior", Math.PI / 2],
    ["posterior-medial diagonal", (3 * Math.PI) / 4],
    ["medial", Math.PI],
    ["medial-anterior diagonal", (5 * Math.PI) / 4],
    ["anterior", (3 * Math.PI) / 2],
    ["anterior-lateral diagonal", (7 * Math.PI) / 4],
  ];

  /**
   * The reference's left-leg vertices in calibration mm and the leg tool's
   * world axes. The native artifact is metres with +X forward, +Y up and +Z
   * anatomical left; ISB Z points to the subject's right, so Z is negated.
   * The leg is selected as vertices left of the midline by more than 5 mm,
   * less than 200 mm lateral and below `top`: a display selection, not a
   * measurement.
   */
  export function load(scale: number, top: number, side: "left" | "right" = "left"): V3[] {
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    return mesh(model, scale, top, side).points;
  }

  /** The selection with its triangles, read from the reference artifact (see {@link mesh}). */
  export function loadMesh(scale: number, top: number, side: "left" | "right" = "left"): { points: V3[]; indices: number[] } {
    const model: IAutoMovieModel = JSON.parse(fs.readFileSync(HumanNodePaths.resolve("test/.shots/f1/reference-model.json"), "utf8"));
    return mesh(model, scale, top, side);
  }

  /**
   * The registered reference's section by one plane: every triangle crossing
   * the plane gives one segment, written in the plane's (u, v) chart about
   * `centre`. A measurement of f1's own surface by the plane, not a copy.
   */
  export function section(points: readonly V3[], indices: readonly number[], centre: V3, u: V3, v: V3): [number, number, number, number][] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const normal: V3 = S.unit(S.cross(u, v));
    const out: [number, number, number, number][] = [];
    for (let i: number = 0; i + 2 < indices.length; i += 3) {
      const tri: V3[] = [points[indices[i]!]!, points[indices[i + 1]!]!, points[indices[i + 2]!]!];
      const d: number[] = tri.map((p: V3): number => S.dot(sub(p, centre), normal));
      const cut: V3[] = [];
      for (let k: number = 0; k < 3; ++k) {
        const a: number = d[k]!;
        const b: number = d[(k + 1) % 3]!;
        if ((a < 0 && b >= 0) || (a >= 0 && b < 0)) cut.push(add(tri[k]!, scale(sub(tri[(k + 1) % 3]!, tri[k]!), a / (a - b))));
      }
      if (cut.length !== 2) continue;
      const [p, q]: V3[] = [sub(cut[0]!, centre), sub(cut[1]!, centre)];
      out.push([S.dot(p!, u), S.dot(p!, v), S.dot(q!, u), S.dot(q!, v)]);
    }
    return out;
  }

  /** The outermost crossing of a section's segments by the ray from its origin at `phase`, or null. */
  export function radius(segments: readonly [number, number, number, number][], phase: number): number | null {
    const [cx, cy]: [number, number] = [Math.cos(phase), Math.sin(phase)];
    let best: number | null = null;
    for (const [x1, y1, x2, y2] of segments) {
      const ex: number = x2 - x1;
      const ey: number = y2 - y1;
      const det: number = cx * -ey - cy * -ex;
      if (Math.abs(det) < 1e-12) continue;
      const t: number = (x1 * -ey - y1 * -ex) / det;
      const r: number = (cx * y1 - cy * x1) / det;
      if (t > 0 && r >= 0 && r <= 1) best = best === null ? t : Math.max(best, t);
    }
    return best;
  }

  /** A section's support extents along +u, +v, -u, -v and its taut-tape girth (convex hull perimeter). */
  export function measure(segments: readonly [number, number, number, number][]): { extents: [number, number, number, number]; girth: number } {
    const pts: [number, number][] = segments.flatMap(([x1, y1, x2, y2]: [number, number, number, number]): [number, number][] => [[x1, y1], [x2, y2]]);
    const extents: [number, number, number, number] = [Math.max(...pts.map((p: [number, number]): number => p[0])), Math.max(...pts.map((p: [number, number]): number => p[1])), Math.max(...pts.map((p: [number, number]): number => -p[0])), Math.max(...pts.map((p: [number, number]): number => -p[1]))];
    const sorted: [number, number][] = [...pts].sort((a: [number, number], b: [number, number]): number => a[0] - b[0] || a[1] - b[1]);
    const cross: (o: [number, number], a: [number, number], b: [number, number]) => number = (o: [number, number], a: [number, number], b: [number, number]): number => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half: (list: [number, number][]) => [number, number][] = (list: [number, number][]): [number, number][] => {
      const h: [number, number][] = [];
      for (const q of list) {
        while (h.length >= 2 && cross(h[h.length - 2]!, h[h.length - 1]!, q) <= 0) h.pop();
        h.push(q);
      }
      h.pop();
      return h;
    };
    const hull: [number, number][] = [...half(sorted), ...half([...sorted].reverse())];
    let girth: number = 0;
    for (let k: number = 0; k < hull.length; ++k) girth += Math.hypot(hull[(k + 1) % hull.length]![0] - hull[k]![0], hull[(k + 1) % hull.length]![1] - hull[k]![1]);
    return { extents, girth };
  }

  /**
   * At each girth site of the leg: the model's tape and box (lateral, medial,
   * anterior, posterior about the axis) against f1's own section there, cut
   * from the registered reference mesh in the loft's plane: its taut-tape
   * girth and its support extents about the same axis (anterior is -v and
   * posterior +v on the left leg).
   */
  export function sites(build: NodeLegBuild.IBuild, points: readonly V3[], indices: readonly number[]): { site: string; walk: number; tape: number; girth: number; box: [number, number, number, number]; reference: [number, number, number, number] }[] {
    const chain: NodeLegBuild.IBuild["chain"] = build.chain;
    const axis: NodeLegBuild.IBuild["loft"]["course"]["axis"] = build.loft.course.axis;
    if (chain === null || axis === null || indices.length === 0) return [];
    return build.curves.sites.map((site: { name: string; walk: number; girth: number; box: [number, number, number, number] }): { site: string; walk: number; tape: number; girth: number; box: [number, number, number, number]; reference: [number, number, number, number] } => {
      const s: number = build.loft.station(site.walk);
      const plane: { origin: V3; u: V3; v: V3 } = axis.at(s);
      const m: { extents: [number, number, number, number]; girth: number } = measure(section(points, indices, AutoMovieLoftChain.axis(chain, s) as V3, plane.u, plane.v));
      return { site: site.name, walk: site.walk, tape: site.girth, girth: m.girth, box: site.box, reference: [m.extents[0], m.extents[2], m.extents[3], m.extents[1]] };
    });
  }

  /**
   * f1's own readings by their published definitions, on her reference in
   * world (calibration mm, floor at zero), each a person input's receipt:
   * - mid-patella (ISO 7250-1 knee height's mid-patella; ANSUR knee
   *   circumference): the level of the knee region's most anterior skin point
   *   (the patella's apex, from 60 mm under to 80 mm over the knee centre's
   *   height), and the horizontal taut-tape girth there;
   * - calf height (ANSUR 1988 (29)): the level of the greatest horizontal
   *   calf girth between 60 mm under the knee centre and twice the lateral
   *   malleolus height, every 1 mm, with that girth.
   * Each girth is the convex hull of the horizontal cut of the reference's
   * left-leg mesh (the selection of {@link mesh}).
   */
  export function readings(points: readonly V3[], indices: readonly number[], heights: { knee: number; lateralMalleolus: number }): { midpatella: { height: number; girth: number }; calf: { height: number; girth: number } } {
    const horizontal: (y: number) => number = (y: number): number => {
      const cut: [number, number, number, number][] = section(points, indices, [0, y, 0], [0, 0, 1], [1, 0, 0]);
      return cut.length === 0 ? NaN : measure(cut).girth;
    };
    let apex: V3 | null = null;
    for (const p of points) if (p[1] >= heights.knee - 60 && p[1] <= heights.knee + 80 && (apex === null || p[0] > apex[0])) apex = p;
    const level: number = apex === null ? NaN : apex[1];
    let calf: { height: number; girth: number } = { height: NaN, girth: -Infinity };
    for (let y: number = heights.knee - 60; y >= 2 * heights.lateralMalleolus; y -= 1) {
      const g: number = horizontal(y);
      if (g > calf.girth) calf = { height: y, girth: g };
    }
    return { midpatella: { height: level, girth: horizontal(level) }, calf };
  }

  /**
   * f1 brought into each segment's own frame by her own joints, to compare
   * the authored lines with (never to copy): the thigh turns about the shared
   * hip so her knee centre (the epicondyles' midpoint at our knee's height)
   * lands on ours; the shank moves her knee centre onto ours and turns her
   * knee-to-IM line (IM the malleoli's midpoint at our malleolus heights)
   * onto ours; the foot moves with the shank onto our IM. Every 10 mm of the
   * walk, in the loft's own plane about our axis: her extents along +u
   * (lateral), +v (posterior), -u, -v and her radii on the four diagonals,
   * beside the model's own, mm.
   */
  export function segmentTable(build: NodeLegBuild.IBuild, world: readonly V3[], indices: readonly number[], root: AutoMovieHumanArmCurveSpec.ITransform): { segment: string; walk: number; f1: number[]; model: number[] }[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const chain: NodeLegBuild.IBuild["chain"] = build.chain;
    const axis: NodeLegBuild.IBuild["loft"]["course"]["axis"] = build.loft.course.axis;
    if (chain === null || axis === null || indices.length === 0) return [];
    const frames: AutoMovieHumanLegSegmentFrames.IOutput = build.frames;
    const h: AutoMovieHumanLegSegmentFrames.IOutput["heights"] = frames.heights;
    const m: 1 | -1 = frames.medial;
    const local: V3[] = world.map((p: V3): V3 => S.apply(S.inverse(root), p));
    const band: (y: number, near: V3, reach: number) => V3[] = (y: number, near: V3, reach: number): V3[] => local.filter((p: V3): boolean => Math.abs(p[1] - y) < 3 && Math.abs(p[0] - near[0]) < reach);
    const extreme: (list: V3[], sign: number) => V3 | null = (list: V3[], sign: number): V3 | null => (list.length === 0 ? null : list.reduce((a: V3, b: V3): V3 => (b[2] * sign > a[2] * sign ? b : a)));
    const middle: (a: V3 | null, b: V3 | null, fallback: V3) => V3 = (a: V3 | null, b: V3 | null, fallback: V3): V3 => (a === null || b === null ? fallback : scale(add(a, b), 0.5));
    const knee: V3 = frames.points.knee;
    const im: V3 = frames.points.im;
    const f1Knee: V3 = middle(extreme(band(knee[1], knee, 40), -m), extreme(band(knee[1], knee, 40), m), knee);
    const f1Im: V3 = middle(extreme(band(h.lateralMalleolus - h.hip, im, 25), -m), extreme(band(h.medialMalleolus - h.hip, im, 25), m), im);
    const hip: V3 = frames.points.hip;
    const placed: V3[] = local.map((p: V3): V3 => {
      if (p[1] >= f1Knee[1]) return add(hip, turn(sub(p, hip), S.unit(sub(f1Knee, hip)), S.unit(sub(knee, hip))));
      return add(knee, turn(sub(p, f1Knee), S.unit(sub(f1Im, f1Knee)), S.unit(sub(im, knee))));
    });
    const around: number[] = Array.from({ length: 360 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 360);
    const read: (segments: [number, number, number, number][]) => number[] = (segments: [number, number, number, number][]): number[] => {
      const e: [number, number, number, number] = measure(segments).extents;
      return [...e, ...[1, 3, 5, 7].map((k: number): number => radius(segments, (k * Math.PI) / 4) ?? NaN)];
    };
    const out: { segment: string; walk: number; f1: number[]; model: number[] }[] = [];
    for (const segment of build.curves.segments)
      for (let walk: number = segment.interval[0] + 5; walk <= segment.interval[1] - 1; walk += 10) {
        const s: number = build.loft.station(walk);
        const plane: { origin: V3; u: V3; v: V3 } = axis.at(s);
        const centre: V3 = AutoMovieLoftChain.axis(chain, s) as V3;
        const cut: [number, number, number, number][] = section(placed, indices, centre, plane.u, plane.v);
        if (cut.length === 0) continue;
        const ring: V3[] = (AutoMovieLoftChain.ring(chain, s, around) as V3[]).map((p: V3): V3 => sub(p, centre));
        const model: [number, number, number, number][] = ring.map((p: V3, k: number): [number, number, number, number] => {
          const q: V3 = ring[(k + 1) % ring.length]!;
          return [S.dot(p, plane.u), S.dot(p, plane.v), S.dot(q, plane.u), S.dot(q, plane.v)];
        });
        out.push({ segment: segment.name, walk, f1: read(cut).map((x: number): number => Math.round(x * 10) / 10), model: read(model).map((x: number): number => Math.round(x * 10) / 10) });
      }
    return out;
  }

  /**
   * f1's own landmarks and girths by their definitions, for the deviation
   * round's causes, world calibration mm (diagnostic readings and receipts):
   * - pternion: the heel's most posterior skin point (within 40 mm of IM
   *   across, under 60 mm); the heel's first floor contact: its most
   *   posterior point under 4 mm;
   * - front-ankle juncture: on the anterior skin profile through IM's plane
   *   (within 6 mm across), from 30 to 160 mm high, the height where the
   *   profile bends most (its second difference's peak over 4 mm steps);
   * - her heel-ankle loop: the plane through the floor contact and the
   *   juncture holding the lateral axis, its taut-tape girth;
   * - mid-patella: on the anterior profile within 30 mm of the knee centre
   *   across, between tibiale and tibiale + 100 mm (twice a patellar length
   *   bound: 41.3 +- 4.4 mm, MRI, DergiPark, used only to bound the search),
   *   the patella's prominence (the profile's local maximum) and its borders
   *   (the nearest inflections above and below); the midpoint's horizontal
   *   girth;
   * - ankle minimum: the least horizontal girth from 0.25 S down to 0.05 S,
   *   with its section's breadth and depth (diagnostic);
   * - ball: the girth on the vertical plane through head I's medial and head
   *   V's lateral skin points (the forefoot's most medial and most lateral
   *   skin under 45 mm).
   */
  export function investigate(points: readonly V3[], indices: readonly number[], at: { stature: number; tibiale: number; knee: V3; im: V3 }): Record<string, number | number[]> {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const girthOn: (centre: V3, u: V3, v: V3) => number = (centre: V3, u: V3, v: V3): number => {
      const cut: [number, number, number, number][] = section(points, indices, centre, u, v);
      return cut.length === 0 ? NaN : measure(cut).girth;
    };
    const horizontal: (y: number) => { girth: number; breadth: number; depth: number } = (y: number): { girth: number; breadth: number; depth: number } => {
      const cut: [number, number, number, number][] = section(points, indices, [0, y, 0], [0, 0, 1], [1, 0, 0]);
      if (cut.length === 0) return { girth: NaN, breadth: NaN, depth: NaN };
      const m: { extents: [number, number, number, number]; girth: number } = measure(cut);
      return { girth: m.girth, breadth: m.extents[0] + m.extents[2], depth: m.extents[1] + m.extents[3] };
    };
    const pick: (filter: (p: V3) => boolean, better: (a: V3, b: V3) => boolean) => V3 | null = (filter: (p: V3) => boolean, better: (a: V3, b: V3) => boolean): V3 | null => {
      let best: V3 | null = null;
      for (const p of points) if (filter(p) && (best === null || better(p, best))) best = p;
      return best;
    };
    const heel: V3 | null = pick((p: V3): boolean => p[1] < 60 && Math.abs(p[2] - at.im[2]) < 40, (a: V3, b: V3): boolean => a[0] < b[0]);
    const contact: V3 | null = pick((p: V3): boolean => p[1] < 4 && Math.abs(p[2] - at.im[2]) < 40, (a: V3, b: V3): boolean => a[0] < b[0]);
    // The anterior profile x(y) on a band of planes across, every `step` mm.
    const profile: (z: number, half: number, from: number, to: number, step: number) => [number, number][] = (z: number, half: number, from: number, to: number, step: number): [number, number][] => {
      const out: [number, number][] = [];
      for (let y: number = from; y <= to; y += step) {
        let best: number = -Infinity;
        for (const p of points) if (Math.abs(p[1] - y) < step / 2 && Math.abs(p[2] - z) < half) best = Math.max(best, p[0]);
        if (Number.isFinite(best)) out.push([y, best]);
      }
      return out;
    };
    const ankle: [number, number][] = profile(at.im[2], 6, 30, 160, 4);
    let juncture: V3 | null = null;
    let bend: number = -Infinity;
    for (let i: number = 1; i + 1 < ankle.length; ++i) {
      const d2: number = Math.abs(ankle[i + 1]![1] - 2 * ankle[i]![1] + ankle[i - 1]![1]);
      if (d2 > bend) [bend, juncture] = [d2, [ankle[i]![1], ankle[i]![0], at.im[2]]];
    }
    const loop: number = heel === null || contact === null || juncture === null ? NaN : girthOn(contact, S.unit(sub(juncture, contact)), [0, 0, 1]);
    const knee: [number, number][] = profile(at.knee[2], 30, at.tibiale, at.tibiale + 100, 1);
    let apex: number = -1;
    for (let i: number = 2; i + 2 < knee.length; ++i) if (knee[i]![1] >= knee[i - 1]![1] && knee[i]![1] >= knee[i + 1]![1] && (apex < 0 || knee[i]![1] > knee[apex]![1])) apex = i;
    const curvature: (i: number) => number = (i: number): number => knee[i + 1]![1] - 2 * knee[i]![1] + knee[i - 1]![1];
    let above: number = -1;
    let below: number = -1;
    if (apex > 0) {
      for (let i: number = apex + 1; i + 1 < knee.length; ++i) if (curvature(i) > 0) { above = i; break; }
      for (let i: number = apex - 1; i > 0; --i) if (curvature(i) > 0) { below = i; break; }
    }
    const mid: number = above > 0 && below > 0 ? (knee[above]![0] + knee[below]![0]) / 2 : NaN;
    let minimum: { y: number; girth: number; breadth: number; depth: number } = { y: NaN, girth: Infinity, breadth: NaN, depth: NaN };
    for (let y: number = 0.25 * at.stature; y >= 0.05 * at.stature; y -= 1) {
      const h: { girth: number; breadth: number; depth: number } = horizontal(y);
      if (h.girth < minimum.girth) minimum = { y, ...h };
    }
    const medialSign: number = Math.sign(-at.im[2]) || 1;
    const headI: V3 | null = pick((p: V3): boolean => p[1] < 45 && p[0] > at.im[0] + 80, (a: V3, b: V3): boolean => a[2] * medialSign > b[2] * medialSign);
    const headV: V3 | null = pick((p: V3): boolean => p[1] < 45 && p[0] > at.im[0] + 60, (a: V3, b: V3): boolean => a[2] * medialSign < b[2] * medialSign);
    const ball: number = headI === null || headV === null ? NaN : girthOn(headI, S.unit(sub(headV, headI)), [0, 1, 0]);
    return {
      pternion: heel ?? [],
      heelContact: contact ?? [],
      pternionBehindIm: heel === null ? NaN : at.im[0] - heel[0],
      juncture: juncture ?? [],
      heelAnkleLoop: loop,
      patellaApexHeight: apex < 0 ? NaN : knee[apex]![0],
      patellaBorders: above > 0 && below > 0 ? [knee[below]![0], knee[above]![0]] : [],
      midpatellaHeight: mid,
      midpatellaGirth: Number.isFinite(mid) ? horizontal(mid).girth : NaN,
      ankleMinimum: [minimum.y, minimum.girth, minimum.breadth, minimum.depth],
      headI: headI ?? [],
      headV: headV ?? [],
      ballOblique: ball,
    };
  }

  /**
   * The same selection with the triangles whose three vertices are selected,
   * so a capture can draw the reference as a surface. The right leg is the
   * vertices right of the midline by the same margins.
   */
  export function mesh(model: IAutoMovieModel, scale: number, top: number, side: "left" | "right"): { points: V3[]; indices: number[] } {
    const points: V3[] = [];
    const indices: number[] = [];
    const outward: number = side === "left" ? 1 : -1;
    for (const part of HumanInspectionReferenceMesh(model).parts) {
      if (part.geometry.type !== "mesh") continue;
      const p: ArrayLike<number> = part.geometry.mesh.positions;
      const slot: Int32Array = new Int32Array(p.length / 3).fill(-1);
      for (let i: number = 0; i + 2 < p.length; i += 3) {
        const x: number = p[i]! * 1000 * scale;
        const y: number = p[i + 1]! * 1000 * scale;
        const z: number = p[i + 2]! * 1000 * scale * outward;
        if (z > 5 * scale && z < 200 * scale && y < top) {
          slot[i / 3] = points.length;
          points.push([x, y, -z * outward]);
        }
      }
      const tri: ArrayLike<number> | null = part.geometry.mesh.indices;
      if (tri === null) continue;
      for (let i: number = 0; i + 2 < tri.length; i += 3) {
        const a: number = slot[tri[i]!]!;
        const b: number = slot[tri[i + 1]!]!;
        const c: number = slot[tri[i + 2]!]!;
        if (a >= 0 && b >= 0 && c >= 0) indices.push(a, b, c);
      }
    }
    return { points, indices };
  }

  /**
   * Diagnostic registration by the reference region's own segment axes, at
   * the heights this leg's laws give (an assumption the measures record):
   * the shank axis is the principal line of the centroids of 4 mm horizontal
   * slices from 1.5 lateral malleolus heights to 40 mm under the knee centre,
   * the thigh axis that of the slices from 40 mm over the knee centre to
   * 30 mm under the crotch. The reference knee centre is the midpoint of the
   * knee band's most lateral and most medial skin points (the epicondyles),
   * and the reference IM the midpoint of the ankle band's (the malleoli's
   * tips), by ISB 2002's definitions. The shank turns about the knee centre
   * so its knee-to-IM line runs along this leg's; the thigh turns about the
   * knee centre along its slices' centroid line (no hip landmark reaches the
   * skin); the foot (below 1.5 lateral malleolus heights) moves with the
   * shank onto this leg's IM and turns about the vertical so its own long
   * axis (principal direction of its sole points under 15 mm) runs along +X.
   * Roll about the long axes is unresolved.
   */
  export function register(points: V3[], frames: AutoMovieHumanLegSegmentFrames.IOutput, crotch: number, root?: AutoMovieHumanArmCurveSpec.ITransform): IRegistered {
    if (points.length < 100) return { points: [], measures: {} };
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const h: AutoMovieHumanLegSegmentFrames.IOutput["heights"] = frames.heights;
    if (root !== undefined) {
      // f1's reference and this leg stand in one world (calibration mm, one floor): the reference is carried into the femur frame by the leg's own root, with no fitting. The bone landmarks read on its skin at this leg's own landmark heights only check that placement.
      const placed: V3[] = points.map((p: V3): V3 => S.apply(S.inverse(root), p));
      const m: 1 | -1 = frames.medial;
      const band: (y: number, near: V3, reach: number) => V3[] = (y: number, near: V3, reach: number): V3[] => placed.filter((p: V3): boolean => Math.abs(p[1] - y) < 3 && Math.abs(p[0] - near[0]) < reach);
      const extreme: (list: V3[], sign: number) => V3 | null = (list: V3[], sign: number): V3 | null => (list.length === 0 ? null : list.reduce((a: V3, b: V3): V3 => (b[2] * sign > a[2] * sign ? b : a)));
      const knee: V3 = frames.points.knee;
      const im: V3 = frames.points.im;
      const epicondyles: [V3 | null, V3 | null] = [extreme(band(knee[1], knee, 40), -m), extreme(band(knee[1], knee, 40), m)];
      const lateral: V3 | null = extreme(band(h.lateralMalleolus - h.hip, im, 25), -m);
      const medial: V3 | null = extreme(band(h.medialMalleolus - h.hip, im, 25), m);
      const offset: (a: V3 | null, b: V3 | null, ours: V3) => [number, number] = (a: V3 | null, b: V3 | null, ours: V3): [number, number] => (a === null || b === null ? [NaN, NaN] : [(a[0] + b[0]) / 2 - ours[0], (a[2] + b[2]) / 2 - ours[2]]);
      const [kx, kz]: [number, number] = offset(epicondyles[0], epicondyles[1], knee);
      const [ix, iz]: [number, number] = offset(lateral, medial, im);
      return {
        points: placed,
        measures: {
          selected: points.length,
          kneeCentreOffsetX: kx,
          kneeCentreOffsetZ: kz,
          referenceKneeBreadth: epicondyles[0] === null || epicondyles[1] === null ? NaN : Math.abs(epicondyles[0][2] - epicondyles[1][2]),
          imOffsetX: ix,
          imOffsetZ: iz,
          referenceBimalleolarBreadth: lateral === null || medial === null ? NaN : Math.abs(lateral[2] - medial[2]),
        },
      };
    }
    const shank: { point: V3; axis: V3 } = lineOf(points, 1.5 * h.lateralMalleolus, h.knee - 40);
    const thigh: { point: V3; axis: V3 } = lineOf(points, h.knee + 40, crotch - 30);
    const at: (line: { point: V3; axis: V3 }, y: number) => V3 = (line: { point: V3; axis: V3 }, y: number): V3 => add(line.point, scale(line.axis, (y - line.point[1]) / line.axis[1]));
    // Bone landmarks on f1's skin by their definitions (ISB 2002): the knee centre is the midpoint of the femoral epicondyles, read as the knee band's most lateral and most medial skin points; IM is the midpoint of the malleoli's tips, read as the ankle band's most lateral and most medial skin points. Placement is compared by these, never by soft-tissue centroids.
    const m: 1 | -1 = frames.medial;
    const extreme: (lo: number, hi: number, near: V3, sign: number) => V3 = (lo: number, hi: number, near: V3, sign: number): V3 =>
      points.filter((p: V3): boolean => p[1] >= lo && p[1] <= hi && Math.abs(p[0] - near[0]) < 60).reduce((a: V3, b: V3): V3 => (b[2] * sign > a[2] * sign ? b : a));
    const kneeLine: V3 = scale(add(at(shank, h.knee), at(thigh, h.knee)), 0.5);
    const epicondyles: [V3, V3] = [extreme(h.knee - 25, h.knee + 25, kneeLine, -m), extreme(h.knee - 25, h.knee + 25, kneeLine, m)];
    const ankleLine: V3 = at(shank, h.im);
    const malleoli: [V3, V3] = [extreme(0.6 * h.lateralMalleolus, 1.6 * h.lateralMalleolus, ankleLine, -m), extreme(0.6 * h.lateralMalleolus, 1.6 * h.lateralMalleolus, ankleLine, m)];
    const kneeRef: V3 = scale(add(epicondyles[0], epicondyles[1]), 0.5);
    const ankleRef: V3 = scale(add(malleoli[0], malleoli[1]), 0.5);
    const shankAxis: V3 = S.unit(sub(kneeRef, ankleRef));
    const foot: V3[] = points.filter((p: V3): boolean => p[1] < 1.5 * h.lateralMalleolus);
    const sole: V3[] = foot.filter((p: V3): boolean => p[1] < 15);
    const footAxis: V3 = principalXZ(sole);
    const ours: { knee: V3; im: V3; femurUp: V3; tibiaUp: V3 } = {
      knee: frames.points.knee,
      im: frames.points.im,
      femurUp: S.unit(sub(frames.points.hip, frames.points.knee)),
      tibiaUp: S.unit(sub(frames.points.knee, frames.points.im)),
    };
    // The shank by its two bone landmarks (knee centre and IM); the thigh about the knee centre along its slices' centroid line (no hip landmark reaches the skin: that orientation is the one centroid-based residual); the foot about IM, yawed by its sole's long axis.
    const placed: V3[] = points.map((p: V3): V3 => {
      if (p[1] >= h.knee) return add(ours.knee, turn(sub(p, kneeRef), thigh.axis, ours.femurUp));
      const shankPlaced: V3 = add(ours.knee, turn(sub(p, kneeRef), shankAxis, ours.tibiaUp));
      if (p[1] >= 1.5 * h.lateralMalleolus) return shankPlaced;
      const ankleOurs: V3 = add(ours.knee, turn(sub(ankleRef, kneeRef), shankAxis, ours.tibiaUp));
      return add(ours.im, turn(sub(shankPlaced, ankleOurs), footAxis[0] >= 0 ? footAxis : scale(footAxis, -1), [1, 0, 0]));
    });
    return {
      points: placed,
      measures: {
        selected: points.length,
        referenceKneeToAnkle: dist(kneeRef, ankleRef),
        legKneeToIm: dist(ours.knee, ours.im),
        referenceKneeBreadth: dist(epicondyles[0], epicondyles[1]),
        referenceBimalleolarBreadth: dist(malleoli[0], malleoli[1]),
        referenceLateralMalleolusHeight: malleoli[0][1],
        referenceMedialMalleolusHeight: malleoli[1][1],
        thighTiltFromVertical: Math.acos(Math.min(1, Math.abs(thigh.axis[1]))),
        shankTiltFromVertical: Math.acos(Math.min(1, Math.abs(shankAxis[1]))),
        kneeAngleBetweenAxes: Math.acos(Math.min(1, Math.abs(S.dot(thigh.axis, shankAxis)))),
        footYawFromForward: Math.atan2(-footAxis[2], Math.abs(footAxis[0])),
        kneeCentreFromCentroidLines: dist(kneeRef, kneeLine),
        imFromShankCentroidLine: dist(ankleRef, ankleLine),
      },
    };
  }

  /**
   * Each curve's deviation from the registered reference, a diagnostic
   * comparison only: every 2 mm of each segment's walk, in the loft's own
   * section plane, the model's actual ring radius at the curve's phase
   * against f1's own section there (the registered reference mesh cut by the
   * plane, its outermost crossing at that phase), both from the chain's axis. The
   * guides read the outlines; the diagonals read the fullness between them.
   * Registration leaves the roll about each segment's long axis unresolved.
   */
  export function deviation(build: NodeLegBuild.IBuild, points: readonly V3[], indices: readonly number[]): IDeviation[] {
    const chain: NodeLegBuild.IBuild["chain"] = build.chain;
    const axis: NodeLegBuild.IBuild["loft"]["course"]["axis"] = build.loft.course.axis;
    if (chain === null || axis === null || indices.length === 0) return [];
    const rows: IDeviation[] = [];
    // The foot is compared up to head V: beyond it the reference's silhouette holds the toes, which are separate parts here.
    const headV: number = build.landmarks.list.find((l: { name: string }): boolean => l.name === "metatarsal head V")?.walk ?? Infinity;
    const furrow: number = build.landmarks.list.find((l: { name: string }): boolean => l.name === "gluteal furrow")?.walk ?? -Infinity;
    for (const segment of build.curves.segments) {
      // Per station: the section frame and f1's own section there, cut from the registered reference mesh in the loft's plane.
      // Shape is compared about each section's own box centre (the frame the review fixed): the model's ring and f1's cut section are each shifted to their own centre, so a centroid-registered placement never reads as shape.
      const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
      const around: number[] = Array.from({ length: 360 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 360);
      const own: (segments: [number, number, number, number][]) => [number, number, number, number][] = (segments: [number, number, number, number][]): [number, number, number, number][] => {
        const e: [number, number, number, number] = measure(segments).extents;
        const [cx, cy]: [number, number] = [(e[0] - e[2]) / 2, (e[1] - e[3]) / 2];
        return segments.map(([x1, y1, x2, y2]: [number, number, number, number]): [number, number, number, number] => [x1 - cx, y1 - cy, x2 - cx, y2 - cy]);
      };
      const stations: { walk: number; model: [number, number, number, number][]; reference: [number, number, number, number][] }[] = [];
      const last: number = segment.name === "foot" ? Math.min(segment.interval[1], headV) : segment.interval[1];
      // The thigh is compared from the gluteal furrow down: above it the plane cuts the buttock and trunk of the reference, not the thigh.
      const first: number = segment.name === "femur" ? Math.max(segment.interval[0], furrow) : segment.interval[0];
      for (let walk: number = first + 1; walk <= last - 1; walk += 2) {
        const s: number = build.loft.station(walk);
        const plane: { origin: V3; u: V3; v: V3 } = axis.at(s);
        const centre: V3 = AutoMovieLoftChain.axis(chain, s) as V3;
        const cut: [number, number, number, number][] = section(points, indices, centre, plane.u, plane.v);
        if (cut.length === 0) continue;
        const ring: V3[] = (AutoMovieLoftChain.ring(chain, s, around) as V3[]).map((p: V3): V3 => sub(p, centre));
        const model: [number, number, number, number][] = ring.map((p: V3, k: number): [number, number, number, number] => {
          const q: V3 = ring[(k + 1) % ring.length]!;
          return [S.dot(p, plane.u), S.dot(p, plane.v), S.dot(q, plane.u), S.dot(q, plane.v)];
        });
        stations.push({ walk, model: own(model), reference: own(cut) });
      }
      for (const [curve, phase] of CURVES) {
        let samples: number = 0;
        let sum: number = 0;
        let signed: number = 0;
        let max: number = 0;
        let worst: number | null = null;
        for (const st of stations) {
          const reference: number | null = radius(st.reference, phase);
          const ours: number | null = radius(st.model, phase);
          if (reference === null || ours === null) continue;
          const model: number = ours;
          const d: number = model - reference;
          samples += 1;
          sum += Math.abs(d);
          signed += d;
          if (Math.abs(d) > max) [max, worst] = [Math.abs(d), st.walk];
        }
        rows.push({ segment: segment.name, curve, phase, samples, max, mean: samples === 0 ? NaN : sum / samples, signed: samples === 0 ? NaN : signed / samples, worst });
      }
    }
    return rows;
  }

  /**
   * Where each section stands against the reference's, every 10 mm of each
   * segment: the reference's box centre (half the difference of its support
   * extents along +u and -u, +v and -v, from vertices within 2 mm of the
   * plane) and the model's (the same from its actual ring), both from the
   * chain's axis, mm; +u lateral, +v posterior on the left leg. An offset
   * shows here; a shape difference shows in {@link deviation} once the
   * centres agree.
   */
  export function centres(build: NodeLegBuild.IBuild, points: readonly V3[], indices: readonly number[]): { segment: string; walk: number; reference: [number, number]; model: [number, number] }[] {
    const chain: NodeLegBuild.IBuild["chain"] = build.chain;
    const axis: NodeLegBuild.IBuild["loft"]["course"]["axis"] = build.loft.course.axis;
    if (chain === null || axis === null || indices.length === 0) return [];
    const out: { segment: string; walk: number; reference: [number, number]; model: [number, number] }[] = [];
    for (const segment of build.curves.segments)
      for (let walk: number = segment.interval[0] + 5; walk <= segment.interval[1] - 5; walk += 10) {
        const s: number = build.loft.station(walk);
        const plane: { origin: V3; u: V3; v: V3 } = axis.at(s);
        const centre: V3 = AutoMovieLoftChain.axis(chain, s) as V3;
        const cut: [number, number, number, number][] = section(points, indices, centre, plane.u, plane.v);
        if (cut.length === 0) continue;
        const ext: [number, number, number, number] = measure(cut).extents;
        const r: (phase: number) => number = (phase: number): number => Math.hypot(...sub(AutoMovieLoftChain.point(chain, s, phase) as V3, centre));
        out.push({ segment: segment.name, walk, reference: [(ext[0]! - ext[2]!) / 2, (ext[1]! - ext[3]!) / 2], model: [(r(0) - r(Math.PI)) / 2, (r(Math.PI / 2) - r((3 * Math.PI) / 2)) / 2] });
      }
    return out;
  }

  /** Principal line of the centroids of 4 mm horizontal slices between two heights. */
  function lineOf(points: V3[], lo: number, hi: number): { point: V3; axis: V3 } {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const centroids: V3[] = [];
    for (let y: number = lo; y < hi; y += 4) {
      const slab: V3[] = points.filter((p: V3): boolean => p[1] >= y && p[1] < y + 4);
      if (slab.length > 5) centroids.push(scale(slab.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / slab.length));
    }
    const mean: V3 = scale(centroids.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / centroids.length);
    let axis: V3 = [0, 1, 0];
    for (let k: number = 0; k < 30; ++k) {
      let next: V3 = [0, 0, 0];
      for (const c of centroids) next = add(next, scale(sub(c, mean), S.dot(sub(c, mean), axis)));
      axis = S.unit(next);
    }
    return { point: mean, axis: axis[1] < 0 ? scale(axis, -1) : axis };
  }

  /** Principal horizontal direction of points (in X-Z). */
  function principalXZ(points: V3[]): V3 {
    const mean: V3 = scale(points.reduce((a: V3, b: V3): V3 => add(a, b), [0, 0, 0]), 1 / Math.max(1, points.length));
    let axis: V3 = [1, 0, 0];
    for (let k: number = 0; k < 30; ++k) {
      let next: V3 = [0, 0, 0];
      for (const p of points) {
        const d: V3 = [p[0] - mean[0], 0, p[2] - mean[2]];
        next = add(next, scale(d, d[0] * axis[0] + d[2] * axis[2]));
      }
      axis = AutoMovieHumanArmCurveSpec.unit(next);
    }
    return axis;
  }

  /** Minimal rotation taking unit `from` to unit `to`, applied to `v` (Rodrigues). */
  function turn(v: V3, from: V3, to: V3): V3 {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const k: V3 = S.cross(from, to);
    const s: number = Math.hypot(...k);
    const cosA: number = S.dot(from, to);
    if (s < 1e-12) return cosA > 0 ? v : scale(v, -1);
    const u: V3 = scale(k, 1 / s);
    return add(add(scale(v, cosA), scale(S.cross(u, v), s)), scale(u, S.dot(u, v) * (1 - cosA)));
  }
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

function dist(a: V3, b: V3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}
