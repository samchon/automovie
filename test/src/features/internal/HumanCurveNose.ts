import { AutoMovieLoftChain, type IAutoMovieLoftChain } from "@automovie/engine";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import type { IAutoMovieHumanLoftAperture } from "../../../../packages/human/src/lofting/IAutoMovieHumanLoftAperture";
import { HumanCurveRing } from "./HumanCurveRing";
import { HumanCurveConstants } from "./HumanCurveConstants";

type V3 = [number, number, number];
const { faceProfile, uniform }: typeof HumanCurveRing = HumanCurveRing;
const { BASE_ABOVE, BASE_BELOW, BASE_PLACES, BASE_RADIUS, BASE_SAMPLE, BASE_STATURE, LEDGE, LEDGE_ABOVE, LEDGE_BELOW, LEDGE_PLACES, LEDGE_STEP }: typeof HumanCurveConstants = HumanCurveConstants;

/** The rules of the nose's flank and base. */
export namespace HumanCurveNose {
  /**
   * Beside the nose the cheek runs into the lip with no step: a base that goes on
   * past the wing stands off the skin as a ridge, which the sections hold as a
   * sharp rise with height at a fixed distance from the midline.
   */
  export function auditNoseFlank(
    body: IAutoMovieHumanBodyCalibration,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    const nostril: IAutoMovieHumanLoftAperture | undefined = body.apertures.find(
      (a: IAutoMovieHumanLoftAperture): boolean => a.name === "nostril.left",
    );
    if (nostril === undefined) return;
    const step: number = (2 * nostril.order + 1);
    const centre: number = nostril.coefficients[step]!;
    const lateral: number = Math.abs(nostril.coefficients[2 * step]!);
    const chains: IAutoMovieLoftChain[] = body.chains.filter(
      (c: IAutoMovieLoftChain): boolean => /^head\.(lower|middle)$/.test(c.name),
    );

    // The most forward skin of the lower and middle head at a height and a lateral place.
    const front: (y: number, z: number) => number | null = (y: number, z: number): number | null => {
      const chain: IAutoMovieLoftChain | undefined = chains.find(
        (c: IAutoMovieLoftChain): boolean =>
          y >= c.layers[0]!.y && y <= c.layers[c.layers.length - 1]!.y,
      );
      if (chain === undefined) return null;
      const ring: V3[] = AutoMovieLoftChain.ring(chain, y, uniform(1440));
      let best: number | null = null;
      ring.forEach((p: V3, i: number): void => {
        const q: V3 = ring[(i + 1) % ring.length]!;
        if ((p[2] - z) * (q[2] - z) > 0 || p[2] === q[2]) return;
        const x: number = p[0] + ((z - p[2]) * (q[0] - p[0])) / (q[2] - p[2]);
        if (best === null || x > best) best = x;
      });
      return best;
    };
    for (const share of LEDGE_PLACES) {
      const z: number = share * lateral;
      let last: number | null = null;
      for (let y: number = centre - LEDGE_BELOW; y <= centre + LEDGE_ABOVE; y += LEDGE_STEP) {
        const x: number | null = front(y, z);
        if (x !== null && last !== null) {
          const rise: number = Math.abs(x - last) / LEDGE_STEP;
          if (rise > LEDGE)
            report("head", "ledge", `beside the nose at ${share} nostrils out`, rise, LEDGE, [x, y, z]);
        }
        last = x;
      }
    }
  }

  /**
   * The nose's base is a rounded surface: from the lip up to the tip, at every
   * distance across the base, the skin turns from facing down to facing forward
   * over a radius, never at a shelf's edge.
   */
  export function auditNoseBase(
    body: IAutoMovieHumanBodyCalibration,
    report: (r: string, rule: string, w: string, v: number, l: number, p?: readonly number[]) => void,
  ): void {
    const nostril: IAutoMovieHumanLoftAperture | undefined = body.apertures.find(
      (a: IAutoMovieHumanLoftAperture): boolean => a.name === "nostril.left",
    );
    if (nostril === undefined) return;
    const step: number = 2 * nostril.order + 1;
    const y: number = nostril.coefficients[step]!;
    const lateral: number = Math.abs(nostril.coefficients[2 * step]!);
    const k: number = body.stature / BASE_STATURE;
    for (const share of BASE_PLACES) {
      const line: [number, number][] = faceProfile(body, share * lateral, y - BASE_BELOW * k, y + BASE_ABOVE * k);
      const points: [number, number][] = [];
      for (const p of line) {
        const last: [number, number] | undefined = points[points.length - 1];
        if (last === undefined || Math.hypot(p[0] - last[0], p[1] - last[1]) >= BASE_SAMPLE * k) points.push(p);
      }
      for (let i: number = 1; i + 1 < points.length; i++) {
        const a: [number, number] = points[i - 1]!;
        const b: [number, number] = points[i]!;
        const c: [number, number] = points[i + 1]!;
        const d1: [number, number] = [b[0] - a[0], b[1] - a[1]];
        const d2: [number, number] = [c[0] - b[0], c[1] - b[1]];
        const turn: number = Math.atan2(d1[0] * d2[1] - d1[1] * d2[0], d1[0] * d2[0] + d1[1] * d2[1]);
        if (turn >= 0) continue;
        const radius: number = (Math.hypot(...d1) + Math.hypot(...d2)) / 2 / -turn;
        if (radius < BASE_RADIUS * k)
          report("head", "base", `nose base at ${share} nostrils out`, BASE_RADIUS * k / radius, 1, [b[1], b[0], share * lateral]);
      }
    }
  }
}
