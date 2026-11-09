import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanArmCurveSpec } from "../generation/arm/AutoMovieHumanArmCurveSpec";
import { AutoMovieHumanTrunkComposedSection } from "../generation/trunk/AutoMovieHumanTrunkComposedSection";
import type { AutoMovieHumanTrunkSegmentFrames } from "../generation/trunk/AutoMovieHumanTrunkSegmentFrames";
import type { AutoMovieHumanTrunkSpecLandmarks } from "../generation/trunk/AutoMovieHumanTrunkSpecLandmarks";
import { AutoMovieHumanTrunkViewCurves } from "../generation/trunk/AutoMovieHumanTrunkViewCurves";
import { NodeArmDraw } from "./NodeArmDraw";
import { NodeTrunkReference } from "./NodeTrunkReference";

type V3 = AutoMovieHumanArmCurveSpec.Vec3;

/**
 * Drawing of the trunk's three stages for `node:trunk-specs`: the 2D view
 * curves with their construction aids, the engine loft's curves, and its
 * clay. Display only: it measures nothing and owns no geometry.
 */
export namespace NodeTrunkDraw {
  /** What one build provides to the drawings. */
  export interface IBuild {
    /** Trunk frames. */
    frames: AutoMovieHumanTrunkSegmentFrames.IOutput;

    /** Trunk landmarks. */
    landmarks: AutoMovieHumanTrunkSpecLandmarks.IOutput;

    /** S00 view curves. */
    curves: AutoMovieHumanTrunkViewCurves.IOutput;

    /** The composed S00 chain, or null. */
    chain: IAutoMovieLoftChain | null;
  }

  /** One view curve kind shown alone. */
  export type Curve = "lateral" | "anterior" | "posterior" | "fullness" | "mounds" | "all";

  /** Outline colours. */
  export const COLOUR: Record<"lateral" | "anterior" | "posterior", string> = { lateral: "#008080", anterior: "#e07000", posterior: "#8040c0" };

  /** Stage 1: the chosen view curves with their datums, tangent and extremum aids, and the axis. */
  export function specs(v: NodeArmDraw.IView, b: IBuild, only: Curve): void {
    const c: AutoMovieHumanTrunkViewCurves.IOutput = b.curves;
    const ys: number[] = range(c.bottom, c.top, 1.5);
    const read: (s: AutoMovieHumanTrunkComposedSection.IScalar, y: number) => number = AutoMovieHumanTrunkComposedSection.read;
    NodeArmDraw.line(v, ys.map((y: number): V3 => c.axis.turn.frame(y).origin as V3), "#7a7a7a", 1, [6, 3]);
    const draw: (label: "lateral" | "anterior" | "posterior") => void = (label: "lateral" | "anterior" | "posterior"): void => {
      const s: AutoMovieHumanTrunkComposedSection.IScalar = c.source[label];
      const knots: AutoMovieHumanTrunkViewCurves.IKnot[] = c.outlines[label];

      // A value at a station sits in that station's plane: along u for the
      // midlines, along v for the lateral outline.
      const place: (y: number, value: number, sign: 1 | -1) => V3 = (y: number, value: number, sign: 1 | -1): V3 => {
        const f: { origin: number[]; u: number[]; v: number[] } = c.axis.turn.frame(y);
        const d: number[] = label === "lateral" ? f.v.map((x: number): number => sign * x) : f.u;
        return [f.origin[0]! + value * d[0]!, f.origin[1]! + value * d[1]!, f.origin[2]! + value * d[2]!];
      };
      for (const sign of label === "lateral" ? ([1, -1] as const) : ([1] as const)) {
        NodeArmDraw.line(v, ys.map((y: number): V3 => place(y, read(s, y), sign)), COLOUR[label], 2.2);
        for (const k of knots) {
          const p: V3 = place(k.y, k.jet.value, sign);
          NodeArmDraw.dots(v, [p], "#000000", 5);
          if (only !== "all") NodeArmDraw.text(v, p, `${k.site}${k.value !== null ? "" : " (free)"}`, "#303030");
          if (k.slope !== null) {
            // Tangent ray of a fixed slope dv/ds, 40 mm along the curve, read
            // as the chord to the curve 1 mm of station on either side.
            const a: V3 = place(k.y - 1, k.jet.value - k.slope, sign);
            const b: V3 = place(k.y + 1, k.jet.value + k.slope, sign);
            const t: V3 = NodeArmDraw.scale(NodeArmDraw.sub(b, a), 1 / Math.hypot(...NodeArmDraw.sub(b, a)));
            NodeArmDraw.line(v, [NodeArmDraw.add(p, NodeArmDraw.scale(t, -40)), NodeArmDraw.add(p, NodeArmDraw.scale(t, 40))], "#1a9fff", 1);
          }
          if (k.slope === 0) NodeArmDraw.line(v, [place(k.y, k.jet.value - 25, sign), place(k.y, k.jet.value + 25, sign)], "#ff2bd6", 1, [2, 2]);
        }
      }
    };
    if (only === "all" || only === "lateral") draw("lateral");
    if (only === "all" || only === "anterior") draw("anterior");
    if (only === "all" || only === "posterior") draw("posterior");
    if (only === "all" || only === "fullness") for (const site of c.sites) section(v, b, site.y, `${site.name} rho ${site.shoulder.toFixed(3)} tape ${site.girth.toFixed(1)} hull ${site.perimeter.toFixed(1)}`);
    if (only === "all" || only === "mounds") mounds(v, b);
  }

  /** A composed source section at a height with its wall box, labelled. */
  export function section(v: NodeArmDraw.IView, b: IBuild, y: number, label: string): void {
    const src: AutoMovieHumanTrunkComposedSection.ISource = b.curves.source;
    const pts: V3[] = AutoMovieHumanTrunkComposedSection.ring(src, y, 360).map(([x, z]: [number, number]): V3 => [x, y, z]);
    NodeArmDraw.line(v, [...pts, pts[0]!], "#000000", 1.6);
    const e: number[] = AutoMovieHumanTrunkComposedSection.inputs(src, y).extents;
    const o: number = src.axis?.(y) ?? b.curves.axis.xs;
    NodeArmDraw.line(v, [[o + e[0]!, y, e[1]!], [o - e[2]!, y, e[1]!], [o - e[2]!, y, -e[3]!], [o + e[0]!, y, -e[3]!], [o + e[0]!, y, e[1]!]], "#9fa8ff", 0.8, [3, 3]);
    NodeArmDraw.text(v, pts[90]!, label, "#202020");
  }

  /** The mounds' footprints on the wall (their zero contour) and apices. */
  export function mounds(v: NodeArmDraw.IView, b: IBuild): void {
    for (const m of b.curves.mounds) {
      const ring: V3[] = [];
      for (let k: number = 0; k <= 96; ++k) {
        const w: number = (2 * Math.PI * k) / 96;
        const vv: number = Math.sin(w) * (Math.sin(w) >= 0 ? m.extents.up : m.extents.down);
        const aa: number = Math.cos(w) * (Math.cos(w) >= 0 ? m.extents.lateral : m.extents.medial);
        const y: number = m.station + vv;
        const phi: number = m.phase + (aa / m.radius) * m.lateral;
        const r: number = AutoMovieHumanTrunkComposedSection.radius(b.curves.source, y, phi);
        const f: { origin: number[]; u: number[]; v: number[] } = b.curves.axis.turn.frame(y);
        ring.push([0, 1, 2].map((c: number): number => f.origin[c]! + r * (Math.cos(phi) * f.u[c]! + Math.sin(phi) * f.v[c]!)) as V3);
      }
      NodeArmDraw.line(v, ring, "#3cba3c", 1.4, [4, 2]);
      const apex: { name: string; point: V3 } | undefined = b.curves.points.find((p: { name: string }): boolean => p.name === `${m.name} apex`);
      if (apex !== undefined) {
        NodeArmDraw.dots(v, [apex.point], "#d00000", 7);
        NodeArmDraw.text(v, apex.point, `${m.name} P ${m.projection.toFixed(1)}`, "#900000");
      }
    }
  }

  /** Stages 2 and 3: the chain's layer rings, four guides and the axis. */
  export function loft(v: NodeArmDraw.IView, b: IBuild): void {
    if (b.chain === null) {
      NodeArmDraw.caption(v, ["", "NO CHAIN"]);
      return;
    }
    const chain: IAutoMovieLoftChain = b.chain;
    const phases: number[] = Array.from({ length: 145 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 144);
    for (const layer of chain.layers) NodeArmDraw.line(v, AutoMovieLoftChain.ring(chain, layer.y, phases), "#505050", 0.7);
    const ys: number[] = range(chain.layers[0]!.y, chain.layers[chain.layers.length - 1]!.y, 1.5);
    const guide: string[] = [COLOUR.anterior, COLOUR.lateral, COLOUR.posterior, COLOUR.lateral];
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((phase: number, k: number): void => {
      NodeArmDraw.line(v, ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, phase)), guide[k]!, 2);
    });
    const top: V3[] = AutoMovieLoftChain.ring(chain, chain.layers[chain.layers.length - 1]!.y, phases);
    NodeArmDraw.line(v, top, "#ff7a00", 3, [8, 4]);
    NodeArmDraw.text(v, top[0]!, "open neck-base end (level at the cervicale height)", "#c05a00");
  }

  /** Clay triangles: a station-phase grid of the actual chain, fanned to its pole. */
  export function triangles(chain: IAutoMovieLoftChain | null): [V3, V3, V3][] {
    if (chain === null) return [];
    const phases: number[] = Array.from({ length: 180 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 180);
    const rows: V3[][] = range(chain.layers[0]!.y, chain.layers[chain.layers.length - 1]!.y, 2).map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases));
    const out: [V3, V3, V3][] = [];
    for (let i: number = 0; i + 1 < rows.length; ++i)
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
      }
    if (chain.pole !== undefined) for (let k: number = 0; k < phases.length; ++k) out.push([chain.pole.point, rows[0]![k]!, rows[0]![(k + 1) % phases.length]!]);
    return out;
  }

  /** The reference's own horizontal cut at a height, as segments. */
  export function referenceCut(v: NodeArmDraw.IView, r: NodeTrunkReference.IRegistered, y: number): void {
    for (const [a, c] of NodeTrunkReference.cut(r.mesh, [0, 1, 0], y)) if (Math.abs(a[2]) < 260 && Math.abs(c[2]) < 260) NodeArmDraw.line(v, [a, c], "#9a9a9a", 1.4);
  }

  /** Stations from `a` to `b` at about the given step. */
  export function range(a: number, b: number, step: number): number[] {
    const n: number = Math.max(2, Math.ceil((b - a) / step));
    return Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((b - a) * k) / n);
  }
}
