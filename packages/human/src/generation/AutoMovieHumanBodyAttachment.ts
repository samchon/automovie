import { AutoMovieHumanLoftChain } from "../lofting/AutoMovieHumanLoftChain";
import type { AutoMovieHumanLoftFrame } from "../lofting/AutoMovieHumanLoftFrame";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import { AutoMovieHumanBodyWarpPoint as P } from "./AutoMovieHumanBodyWarpPoint";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/** One-time attachment binding and the differential of that same plane chart. */
export namespace AutoMovieHumanBodyAttachment {
  /** A resolved numerical branch, retained for every direction at this point. */
  export interface IChart {
    /** Source local chain station, mm. */
    station: number;
    /** Plane normal, used as a covector in the implicit chart equation. */
    normal: P.V;
    /** n dot origin' minus n' dot (point-origin). */
    denominator: number;
  }

  /**
   * Bind once; never run an independent inverse for every Fourier direction.
   * Horizontal chains have s=worldY exactly. Framed chains retain the existing
   * 1-mm numerical discovery resolution, include both exact end planes and
   * all principal planes, and accept only one observed regular crossing.
   * This is not a global injectivity proof: unresolved/multiple branches are
   * diagnosed without a nearest-cell fallback or a whole-figure exception.
   */
  export function bind(
    chain: IAutoMovieHumanLoftChain,
    p: readonly [number, number, number],
    name: string,
    diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[],
  ): IChart | undefined {
    const lo: number = chain.layers[0]!.y;
    const hi: number = chain.layers[chain.layers.length - 1]!.y;
    if (chain.layers.every(
      (layer: IAutoMovieHumanLoftChain.ILayer): boolean => layer.frame === undefined,
    )) {
      if (p[1] >= lo && p[1] <= hi)
        return { station: p[1], normal: [0, 1, 0], denominator: 1 };
      return unresolved(name, diagnostics, "Point is outside its horizontal chart.");
    }
    const planes: number[] = [lo];
    for (let i: number = 1; i < chain.layers.length; i++) {
      const a: number = chain.layers[i - 1]!.y;
      const b: number = chain.layers[i]!.y;
      const count: number = Math.max(1, Math.ceil(b - a));
      for (let k: number = 1; k <= count; k++)
        planes.push(k === count ? b : a + ((b - a) * k) / count);
    }
    const roots: number[] = [];
    const distance: (s: number) => number = (s: number): number => {
      const f: AutoMovieHumanLoftFrame.IFrame = AutoMovieHumanLoftChain.frame(chain, s);
      return P.dot(P.cross(f.v, f.u), P.sub(p, f.origin));
    };
    let a: number = planes[0]!;
    let da: number = distance(a);
    if (da === 0) roots.push(a);
    for (let i: number = 1; i < planes.length; i++) {
      const b: number = planes[i]!;
      const db: number = distance(b);
      if (!Number.isFinite(da) || !Number.isFinite(db))
        return unresolved(name, diagnostics, "Attachment plane distance is non-finite.");
      if (db === 0) roots.push(b);
      else if (da !== 0 && Math.sign(da) !== Math.sign(db)) {
        let left: number = a;
        let right: number = b;
        let dl: number = da;
        while (true) {
          const mid: number = left / 2 + right / 2;
          if (mid === left || mid === right) break;
          const dm: number = distance(mid);
          if (!Number.isFinite(dm))
            return unresolved(name, diagnostics, "Attachment inverse distance overflows.");
          if (dm === 0) { left = mid; right = mid; break; }
          if (Math.sign(dm) === Math.sign(dl)) { left = mid; dl = dm; }
          else right = mid;
        }
        roots.push(left / 2 + right / 2);
      }
      a = b;
      da = db;
    }
    if (roots.length !== 1)
      return unresolved(
        name, diagnostics,
        "Attachment has " + roots.length +
        " observed crossings; no branch or nearest cell is selected.",
      );
    const station: number = roots[0]!;
    const f: AutoMovieHumanLoftFrame.IFrame =
      AutoMovieHumanLoftChain.frame(chain, station);
    const d: AutoMovieHumanLoftFrame.IFrame =
      AutoMovieHumanLoftChain.frameDerivative(chain, station);
    const normal: P.V = P.cross(f.v, f.u);
    const normalRate: P.V = P.add(P.cross(d.v, f.u), P.cross(f.v, d.u));
    const denominator: number =
      P.dot(normal, d.origin) - P.dot(normalRate, P.sub(p, f.origin));
    if (!Number.isFinite(denominator) || denominator === 0)
      return unresolved(name, diagnostics, "Attachment chart is not regular.");
    return { station, normal, denominator };
  }

  /** ds(dp) of the already-bound implicit plane chart; no inverse search. */
  export function rate(chart: IChart, pointRate: readonly number[]): number {
    return P.dot(chart.normal, pointRate) / chart.denominator;
  }

  /** Preserve the existing feature and expose an unresolved attachment. */
  function unresolved(
    name: string,
    diagnostics: IAutoMovieHumanBodyCalibration.IDeformationDiagnostic[],
    detail: string,
  ): undefined {
    diagnostics.push({ name, status: "unresolved", detail });
    return undefined;
  }
}
