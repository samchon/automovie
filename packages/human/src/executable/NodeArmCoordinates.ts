import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import type { AutoMovieHumanArmSegmentFrames } from "../generation/arm/AutoMovieHumanArmSegmentFrames";
import type { AutoMovieHumanArmViewCurves } from "../generation/arm/AutoMovieHumanArmViewCurves";
import { NodeArmDeviation } from "./NodeArmDeviation";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;
type V2 = [number, number];

/**
 * Reads f1's sparse arm view-curve coordinates from the reference, for the
 * f1-only authoring of `AutoMovieHumanF1ArmCoordinates` (`node:arm-specs`).
 *
 * Frame: f1's reference placed by bone landmarks on its own skin
 * (`NodeArmReference.placeByLandmarks`: GH, epicondyles, styloids), so its
 * GH, elbow centre and wrist centre stand on this arm's. Each reading is in
 * its segment's own frame, from that segment's origin (GH, elbow centre,
 * wrist centre) along its distal axis: the plane normal to the axis there
 * cuts f1's mesh, and the loop enclosing the axis point is f1's section.
 * Read: its four extents from the axis along the segment's lateral and
 * anterior directions (the four outlines), and each quarter's conic shoulder
 * (`AutoMovieViewSection`'s `rho`: the share from the quarter chord's
 * midpoint toward the box corner at which f1's section crosses that line),
 * quarters in the arm part's guide order (left arm: lateral to posterior,
 * posterior to medial, medial to anterior, anterior to lateral).
 */
export namespace NodeArmCoordinates {
  /** One reading. */
  export interface IReading {
    /** Segment. */ segment: "humerus" | "forearm" | "hand";
    /** Distance from the segment's origin along its distal axis, mm. */ along: number;
    /** Extents lateral, medial, anterior, posterior from the axis, mm. */ extents: [number, number, number, number];
    /** Quarter shoulders in guide order. */ shoulders: [number, number, number, number];
  }

  /** The arm's build parts this reads. */
  export interface IBuild {
    /** The segment frames. */ frames: AutoMovieHumanArmSegmentFrames.IOutput;
    /** The view curves: segments and girth sites. */ curves: AutoMovieHumanArmViewCurves.IOutput;
    /** World placement of the humerus frame. */ root: AutoMovieHumanArmCurveSpec.ITransform;
  }

  /**
   * Every reading from the axilla level to the knuckles, every `step` mm of
   * walk plus the joint walks; stations with no enclosing loop are skipped.
   */
  export function read(b: IBuild, mesh: NodeArmDeviation.IMesh, step: number, twist: number = 0): IReading[] {
    const S: typeof AutoMovieHumanArmCurveSpec = AutoMovieHumanArmCurveSpec;
    const m: number = b.frames.medial;
    const site = (name: string): number => b.curves.sites.find((s: AutoMovieHumanArmViewCurves.ISite): boolean => s.name === name)!.walk;
    const axilla: number = site("axilla level");
    const to: number = site("knuckles");
    const joints: number[] = b.curves.segments.slice(1).map((s: AutoMovieHumanArmViewCurves.ISegment): number => s.walk);
    const walks: number[] = [];
    // Above the axilla level the arm's skin and the chest's are one loop: the cap is read on its lateral half only (from 10 mm under the dome pole, every 10 mm).
    for (let w: number = b.curves.start + 10; w < axilla; w += 10) walks.push(w);
    for (let w: number = axilla; w < to; w += step) walks.push(w);
    walks.push(to, ...joints);
    walks.sort((a: number, c: number): number => a - c);
    const out: IReading[] = [];
    for (const w of walks) {
      if (out.length > 0 && Math.abs(w - (out[out.length - 1]!.along + segmentOf(b, out[out.length - 1]!.segment).walk)) < 1e-6) continue;
      // The proximal segment owns a joint walk.
      const seg: AutoMovieHumanArmViewCurves.ISegment = b.curves.segments.find((x: AutoMovieHumanArmViewCurves.ISegment): boolean => w >= x.interval[0] && w <= x.interval[1])!;
      const t: AutoMovieHumanArmCurveSpec.ITransform = b.frames.chain(seg.frame, b.root);
      const centre: V3 = S.apply(t, NodeArmDraw.add(seg.origin, NodeArmDraw.scale(seg.distal, w - seg.walk)));
      // f1's forearm stands pronated: with its styloids aligned, its proximal sections keep part of the twist. The reading frame turns
      // with f1's forearm, linearly from its epicondyle line at the elbow (by `twist`) to its styloid line at the wrist (by 0), so each
      // section is read in f1's own supinated lateral and anterior directions.
      const length: number = seg.interval[1] - seg.walk;
      const turn: number = seg.name === "forearm" ? twist * (1 - (w - seg.walk) / length) : 0;
      const lateral: V3 = S.rotate(t, seg.lateral);
      const anteriorDir: V3 = S.rotate(t, seg.anterior);
      const x: V3 = NodeArmDraw.add(NodeArmDraw.scale(lateral, Math.cos(turn)), NodeArmDraw.scale(anteriorDir, Math.sin(turn)));
      const y: V3 = NodeArmDraw.add(NodeArmDraw.scale(anteriorDir, Math.cos(turn)), NodeArmDraw.scale(lateral, -Math.sin(turn)));
      const loop: V2[] | null = NodeArmDeviation.section(mesh, centre, S.rotate(t, seg.distal), x, y);
      if (loop === null) continue;
      const cap: boolean = w < axilla;
      const half: V2[] = cap ? loop.filter((p: V2): boolean => p[0] >= 0) : loop;
      if (half.length < 3) continue;
      const xs: number[] = half.map((p: V2): number => p[0]);
      const ys: number[] = half.map((p: V2): number => p[1]);
      const extents: [number, number, number, number] = [Math.max(...xs), cap ? NaN : -Math.min(...xs), Math.max(...ys), -Math.min(...ys)];
      // Guide directions in the (lateral, anterior) chart and their extents, in the part's guide order.
      const posterior: V2 = [0, -1];
      const anterior: V2 = [0, 1];
      const guides: [V2, number][] = m > 0
        ? [[[1, 0], extents[0]], [posterior, extents[3]], [[-1, 0], extents[1]], [anterior, extents[2]]]
        : [[[1, 0], extents[0]], [anterior, extents[2]], [[-1, 0], extents[1]], [posterior, extents[3]]];
      const shoulders: number[] = [0, 1, 2, 3].map((q: number): number => {
        const [g1, e1]: [V2, number] = guides[q]!;
        const [g2, e2]: [V2, number] = guides[(q + 1) % 4]!;
        const corner: V2 = [g1[0] * e1 + g2[0] * e2, g1[1] * e1 + g2[1] * e2];
        const mid: V2 = [corner[0] / 2, corner[1] / 2];
        const toward: V2 = [corner[0] - mid[0], corner[1] - mid[1]];
        const length: number = Math.hypot(...toward);
        const reach: number | null = farthest(loop.map((p: V2): V2 => [p[0] - mid[0], p[1] - mid[1]]), [toward[0] / length, toward[1] / length]);
        return reach === null ? NaN : reach / length;
      });
      out.push({ segment: seg.name, along: w - seg.walk, extents, shoulders: shoulders as [number, number, number, number] });
    }
    return out;
  }

  function segmentOf(b: IBuild, name: string): AutoMovieHumanArmViewCurves.ISegment {
    return b.curves.segments.find((s: AutoMovieHumanArmViewCurves.ISegment): boolean => s.name === name)!;
  }

  /** The farthest crossing of the ray from the origin along unit `u` with the closed polygon, or null. */
  function farthest(loop: readonly V2[], u: V2): number | null {
    let far: number | null = null;
    for (let k: number = 0; k < loop.length; ++k) {
      const a: V2 = loop[k]!;
      const c: V2 = loop[(k + 1) % loop.length]!;
      const e: V2 = [c[0] - a[0], c[1] - a[1]];
      const den: number = u[0] * e[1] - u[1] * e[0];
      if (den === 0) continue;
      const t: number = (a[0] * e[1] - a[1] * e[0]) / den;
      const s: number = (a[0] * u[1] - a[1] * u[0]) / den;
      if (t > 0 && s >= 0 && s <= 1) far = Math.max(far ?? 0, t);
    }
    return far;
  }
}
