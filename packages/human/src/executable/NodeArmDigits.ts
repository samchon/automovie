import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import { AutoMovieHumanFairOutline } from "../generation/arm/AutoMovieHumanFairOutline";
import type { AutoMovieHumanHandDigits } from "../generation/hand/AutoMovieHumanHandDigits";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];

/**
 * The digits' stages for the arm experiment's Node images: each digit's view
 * curves with their aids (axis, joint ticks, tangent rays, extremum-free
 * outlines on all four sides), its loft curves with the open root drawn as
 * the pending palm-port band, and its clay triangles. Display only.
 */
export namespace NodeArmDigits {
  /** Outline colours by chart side: lateral (+u), medial (-u), +v, -v. */
  const COLOURS: string[] = ["#008080", "#c00060", "#8040c0", "#e07000"];

  /** Stage 1: every digit's four outlines in its own plane, with aids and datums. */
  export function specs(v: NodeArmDraw.IView, digits: readonly AutoMovieHumanHandDigits.IDigit[], sides: readonly number[] = [0, 1, 2, 3]): void {
    for (const d of digits) {
      const axis: (s: number) => V3 = (s: number): V3 => NodeArmDraw.add(d.root, NodeArmDraw.scale(d.axes.distal, s));
      const dirs: V3[] = [d.axes.lateral, NodeArmDraw.scale(d.axes.lateral, -1), d.axes.v, NodeArmDraw.scale(d.axes.v, -1)];
      NodeArmDraw.line(v, [axis(0), axis(d.length)], "#7a7a7a", 1, [6, 3]);
      for (const s of d.joints) NodeArmDraw.line(v, [NodeArmDraw.add(axis(s), NodeArmDraw.scale(dirs[0]!, 4)), NodeArmDraw.add(axis(s), NodeArmDraw.scale(dirs[1]!, 4))], "#202020", 1.2);
      const qs: number[] = d.knots.map((k: AutoMovieHumanHandDigits.IDigit["knots"][number]): number => k.q);
      const jets: AutoMovieHumanFairOutline.IJet[] = d.knots.map((k: AutoMovieHumanHandDigits.IDigit["knots"][number]): AutoMovieHumanFairOutline.IJet => ({ value: k.value, first: k.first, second: k.second }));
      for (const side of sides) {
        const dir: V3 = dirs[side]!;
        const pts: V3[] = Array.from({ length: 61 }, (_: unknown, j: number): V3 => {
          const s: number = (d.length * j) / 60;
          const y: number = AutoMovieHumanFairOutline.evaluate(qs, jets, -Math.sqrt(Math.max(0, d.length - s)))[0];
          return NodeArmDraw.add(axis(s), NodeArmDraw.scale(dir, y));
        });
        NodeArmDraw.line(v, pts, COLOURS[side]!, 1.6);
        for (const k of d.knots) {
          const p: V3 = NodeArmDraw.add(axis(k.station), NodeArmDraw.scale(dir, k.value));
          NodeArmDraw.dots(v, [p], "#000000", 3);
          if (k.q < 0) {
            const ys: number = k.first / (-2 * k.q);
            const t: number = 6 / Math.hypot(1, ys);
            NodeArmDraw.line(v, [NodeArmDraw.add(axis(k.station - t), NodeArmDraw.scale(dir, k.value - t * ys)), NodeArmDraw.add(axis(k.station + t), NodeArmDraw.scale(dir, k.value + t * ys))], "#1a9fff", 1);
          }
        }
      }
    }
  }

  /** Stages 2 and 3: every digit's layer rings, four guides and its open root as the pending palm-port band. */
  export function loft(v: NodeArmDraw.IView, digits: readonly AutoMovieHumanHandDigits.IDigit[]): void {
    const ring: number[] = Array.from({ length: 49 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 48);
    for (const d of digits) {
      const chain: IAutoMovieLoftChain | null = d.loft.chain;
      if (chain === null) continue;
      for (const layer of chain.layers) NodeArmDraw.line(v, AutoMovieLoftChain.ring(chain, layer.y, ring), "#505050", 0.6);
      const ys: number[] = stations(chain, 1);
      [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((phase: number, k: number): void => {
        NodeArmDraw.line(v, ys.map((y: number): V3 => AutoMovieLoftChain.point(chain, y, phase)), COLOURS[[0, 2, 1, 3][k]!]!, 1.4);
      });
      NodeArmDraw.line(v, AutoMovieLoftChain.ring(chain, chain.layers[0]!.y, ring), "#ff7a00", 2, [4, 3]);
    }
  }

  /** Clay triangles of every digit's actual chain, fanned to its tip pole. */
  export function triangles(digits: readonly AutoMovieHumanHandDigits.IDigit[]): [V3, V3, V3][] {
    const out: [V3, V3, V3][] = [];
    const phases: number[] = Array.from({ length: 48 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 48);
    for (const d of digits) {
      const chain: IAutoMovieLoftChain | null = d.loft.chain;
      if (chain === null) continue;
      const rows: V3[][] = stations(chain, 1).map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases));
      for (let i: number = 0; i + 1 < rows.length; ++i)
        for (let k: number = 0; k < phases.length; ++k) {
          const k1: number = (k + 1) % phases.length;
          out.push([rows[i]![k]!, rows[i + 1]![k]!, rows[i + 1]![k1]!], [rows[i]![k]!, rows[i + 1]![k1]!, rows[i]![k1]!]);
        }
      // The tip pole closes the last row (its `end` is "top").
      const tip: V3 | undefined = chain.pole?.end === "top" ? (chain.pole.point as V3) : undefined;
      const last: V3[] = rows[rows.length - 1]!;
      if (tip !== undefined) for (let k: number = 0; k < phases.length; ++k) out.push([tip, last[k]!, last[(k + 1) % phases.length]!]);
    }
    return out;
  }

  /** Stations from the first to the last layer at about the given step. */
  function stations(chain: IAutoMovieLoftChain, step: number): number[] {
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil((z - a) / step));
    return Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((z - a) * k) / n);
  }
}
