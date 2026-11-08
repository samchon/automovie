import { AutoMovieLoftChain, AutoMovieLoftRelief, type IAutoMovieLoftChain, type IAutoMovieLoftRelief } from "@automovie/engine";

import type { AutoMovieHumanHeadMass } from "../generation/head/AutoMovieHumanHeadMass";
import { AutoMovieHumanHeadJawRelief } from "../generation/head/AutoMovieHumanHeadJawRelief";
import { AutoMovieHumanHeadMassCurves } from "../generation/head/AutoMovieHumanHeadMassCurves";
import { NodeArmDraw } from "./NodeArmDraw";

type V3 = [number, number, number];

/**
 * The head renderer's line trace (verification step 4): for a line seen on
 * the clay at a height, the chain's layers there with their spacing, the
 * outlines' and fullness laws' jets and the reliefs' heights, and the chain
 * shaded by its curvature along the station, so the line is named by the
 * curves that make it before anything changes.
 */
export namespace NodeHeadTrace {
  /** One chain layer near a traced height. */
  export interface ILayer {
    /** Layer index in the chain. */
    k: number;

    /** Head-frame station, mm. */
    y: number;

    /** Spacing to the next layer, mm. */
    spacing: number;

    /** Anterior outline's value and station derivatives. */
    anterior: [number, number, number];

    /** Lateral outline's value and station derivatives. */
    lateral: [number, number, number];

    /** Posterior outline's value and station derivatives. */
    posterior: [number, number, number];

    /** Fullness laws' values with central-difference derivatives (0.5 mm). */
    fullness: { anterior: [number, number, number]; posterior: [number, number, number] };

    /** The reliefs' summed height at three phases, mm. */
    relief: { phase: number; height: number }[];
  }

  /** Every chain layer within 8 mm of each traced height (head-frame stations; `shift` the chain's station of FH). */
  export function layers(chain: IAutoMovieLoftChain, curves: AutoMovieHumanHeadMass.IOutput, shift: number, heights: readonly number[]): { y: number; layers: ILayer[] }[] {
    const M: typeof AutoMovieHumanHeadMassCurves = AutoMovieHumanHeadMassCurves;
    const jet: (f: (s: number) => number, s: number) => [number, number, number] = (f: (s: number) => number, s: number): [number, number, number] => [f(s), f(s + 0.5) - f(s - 0.5), (f(s + 0.5) - 2 * f(s) + f(s - 0.5)) / 0.25];
    return heights.map((y: number): { y: number; layers: ILayer[] } => ({
      y,
      layers: chain.layers.flatMap((layer: IAutoMovieLoftChain.ILayer, k: number): ILayer[] => {
        const s: number = layer.y - shift;
        if (Math.abs(s - y) > 8) return [];
        return [
          {
            k,
            y: s,
            spacing: k + 1 < chain.layers.length ? chain.layers[k + 1]!.y - layer.y : NaN,
            anterior: M.value(curves.outlines.anterior, s, curves.length),
            lateral: M.value(curves.outlines.lateral, s, curves.length),
            posterior: M.value(curves.outlines.posterior, s, curves.length),
            fullness: {
              anterior: jet((x: number): number => M.fullness(curves.fullness.anterior, x), s),
              posterior: jet((x: number): number => M.fullness(curves.fullness.posterior, x), s),
            },
            relief: [0.5, 1, 1.5].map((phase: number): { phase: number; height: number } => ({ phase, height: (chain.reliefs ?? []).reduce((sum: number, r: IAutoMovieLoftRelief): number => sum + AutoMovieLoftRelief.height(r, layer.y, phase)[0], 0) })),
          },
        ];
      }),
    }));
  }

  /**
   * The actual chain shaded by its curvature along the station: at each point
   * of rings 1 mm apart, the second difference projected on the outward
   * normal, per mm. Blue concave (bending inward along the station), red
   * convex, white flat, saturated at 0.05 /mm.
   */
  export function curvature(v: NodeArmDraw.IView, chain: IAutoMovieLoftChain): void {
    const phases: number[] = Array.from({ length: 128 }, (_: unknown, k: number): number => (2 * Math.PI * k) / 128);
    const a: number = chain.layers[0]!.y;
    const z: number = chain.layers[chain.layers.length - 1]!.y;
    const n: number = Math.max(2, Math.ceil(z - a));
    const ys: number[] = Array.from({ length: n + 1 }, (_: unknown, k: number): number => a + ((z - a) * k) / n);
    const rows: V3[][] = ys.map((y: number): V3[] => AutoMovieLoftChain.ring(chain, y, phases));
    const quads: { q: V3[]; colour: string; depth: number }[] = [];
    for (let i: number = 1; i + 1 < rows.length; ++i) {
      const h: number = (ys[i + 1]! - ys[i - 1]!) / 2;
      const axis: V3 = AutoMovieLoftChain.axis(chain, ys[i]!) as V3;
      for (let k: number = 0; k < phases.length; ++k) {
        const k1: number = (k + 1) % phases.length;
        const k0: number = (k + phases.length - 1) % phases.length;
        const p: V3 = rows[i]![k]!;
        let normal: V3 = NodeArmDraw.unit(NodeArmDraw.cross(NodeArmDraw.sub(rows[i]![k1]!, rows[i]![k0]!), NodeArmDraw.sub(rows[i + 1]![k]!, rows[i - 1]![k]!)));
        if (NodeArmDraw.dot(normal, NodeArmDraw.sub(p, axis)) < 0) normal = NodeArmDraw.scale(normal, -1);
        const second: V3 = NodeArmDraw.add(NodeArmDraw.sub(rows[i + 1]![k]!, NodeArmDraw.scale(p, 2)), rows[i - 1]![k]!);
        const t: number = Math.max(-1, Math.min(1, -NodeArmDraw.dot(second, normal) / (h * h) / 0.05));
        const colour: string = t >= 0 ? `rgb(255,${Math.round(255 * (1 - t))},${Math.round(255 * (1 - t))})` : `rgb(${Math.round(255 * (1 + t))},${Math.round(255 * (1 + t))},255)`;
        const q: V3[] = [p, rows[i]![k1]!, rows[i + 1]![k1]!, rows[i + 1]![k]!];
        quads.push({ q, colour, depth: NodeArmDraw.dot(NodeArmDraw.add(NodeArmDraw.add(q[0]!, q[1]!), NodeArmDraw.add(q[2]!, q[3]!)), v.forward) });
      }
    }
    quads.sort((x: { depth: number }, y: { depth: number }): number => y.depth - x.depth);
    for (const { q, colour } of quads) {
      v.g.fillStyle = colour;
      v.g.strokeStyle = colour;
      v.g.lineWidth = 0.6;
      v.g.beginPath();
      q.forEach((p: V3, m: number): void => {
        const [x, y]: [number, number] = v.project(p);
        if (m === 0) v.g.moveTo(x, y);
        else v.g.lineTo(x, y);
      });
      v.g.closePath();
      v.g.fill();
      v.g.stroke();
    }
  }

  /**
   * The phase ripple of the chain's curvature along the station at one
   * height (the face's vertical streaks, 2026-11-08): at 720 phases, the
   * second difference of 1 mm rings on the radial direction from the chain's
   * axis; its residual from a 15 degree moving mean; the residual's root mean
   * square; and the lag of its first autocorrelation peak, the streaks'
   * period in degrees. The period names the source: 360 / order for the
   * sections' control net, the relief nets' phase spacing, or the ring
   * samples.
   */
  export function ripple(chain: IAutoMovieLoftChain, y: number): { y: number; rms: number; period: number | null; mean: number } {
    const n: number = 720;
    const axis: V3 = AutoMovieLoftChain.axis(chain, y) as V3;
    const phases: number[] = Array.from({ length: n }, (_: unknown, k: number): number => (2 * Math.PI * k) / n);
    const rows: V3[][] = [y - 1, y, y + 1].map((s: number): V3[] => AutoMovieLoftChain.ring(chain, s, phases) as V3[]);
    const kappa: number[] = phases.map((_: number, k: number): number => {
      const p: V3 = rows[1]![k]!;
      const radial: V3 = NodeArmDraw.unit([p[0] - axis[0], 0, p[2] - axis[2]]);
      return NodeArmDraw.dot(NodeArmDraw.add(NodeArmDraw.sub(rows[2]![k]!, NodeArmDraw.scale(p, 2)), rows[0]![k]!), radial);
    });
    const w: number = 30;
    const residual: number[] = kappa.map((v: number, k: number): number => {
      let sum: number = 0;
      for (let j: number = -w; j <= w; ++j) sum += kappa[(k + j + n) % n]!;
      return v - sum / (2 * w + 1);
    });
    const rms: number = Math.sqrt(residual.reduce((m: number, v: number): number => m + v * v, 0) / n);
    const correlation: (lag: number) => number = (lag: number): number => residual.reduce((m: number, v: number, k: number): number => m + v * residual[(k + lag) % n]!, 0);
    let period: number | null = null;
    for (let lag: number = 2; lag < 90; ++lag)
      if (correlation(lag) > correlation(lag - 1) && correlation(lag) >= correlation(lag + 1) && correlation(lag) > 0) {
        period = lag / 2;
        break;
      }
    return { y, rms, period, mean: kappa.reduce((m: number, v: number): number => m + v, 0) / n };
  }

  /**
   * The height the jaw relief's step behind the ramus removes, at heights
   * from the gonion to FH: the reliefs' summed height at the base point
   * (the chain without reliefs) whose forward place is the step's top, the
   * ramus line plus the roll (`AutoMovieHumanHeadJawRelief`), on the +v side.
   * `me` is the menton in the head frame, `shift` the chain's station of FH.
   */
  export function jawStep(chain: IAutoMovieLoftChain, shift: number, me: V3): { y: number; ramus: number; top: number; height: number }[] {
    const J: typeof AutoMovieHumanHeadJawRelief = AutoMovieHumanHeadJawRelief;
    const goY: number = me[1] + me[0] * Math.tan(AutoMovieHumanHeadMassCurves.FMA);
    const back: number = 1 / Math.tan(J.GONIAL - AutoMovieHumanHeadMassCurves.FMA);
    const base: IAutoMovieLoftChain = { ...chain, reliefs: [] };
    const out: { y: number; ramus: number; top: number; height: number }[] = [];
    for (let y: number = goY; y < 0; y += (0 - goY) / 6) {
      const ramus: number = (y - goY) * back;
      const top: number = ramus + J.ROLL;
      let best: number = 0;
      let gap: number = Infinity;
      for (let k: number = 1; k < 180; ++k) {
        const phi: number = (Math.PI * k) / 180;
        const p: number[] = AutoMovieLoftChain.point(base, y + shift, phi);
        if (!(p[2]! > 0)) continue;
        if (Math.abs(p[0]! - top) < gap) {
          gap = Math.abs(p[0]! - top);
          best = phi;
        }
      }
      const height: number = (chain.reliefs ?? []).reduce((sum: number, r: IAutoMovieLoftRelief): number => sum + AutoMovieLoftRelief.height(r, y + shift, best)[0], 0);
      out.push({ y, ramus, top, height });
    }
    return out;
  }
}
