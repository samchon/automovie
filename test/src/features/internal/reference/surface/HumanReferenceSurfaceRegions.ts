import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceFloor } from "./HumanReferenceSurfaceFloor";

/**
 * Per-region statistics of the signed deviation of a reference's skin. They
 * are information, not a verdict: only the patches beyond a limit fail.
 */
export namespace HumanReferenceSurfaceRegions {
  /** The readings of one reference, from which regions are summarised. */
  export interface IReadings {
    /** Region names. */
    names: string[];

    /** Region index per vertex, into `names`. */
    region: Int32Array;

    /** Signed deviation per vertex, mm; NaN on a vertex that is not skin. */
    deviation: Float64Array;

    /** Area per vertex, mm squared. */
    area: Float64Array;

    /** Whether each vertex was read by the nearest distance. */
    fallback: Uint8Array;

    /** Flag code per vertex; nonzero is beyond its limit. */
    flag: Uint8Array;

    /** Whether each vertex is skin; only skin vertices are summarised. */
    skin: Uint8Array;

    /** Limit per vertex, mm. */
    limit: Float64Array;
  }

  /**
   * Summarises every region that holds skin vertices.
   *
   * @param readings The reference's readings.
   * @returns One record per region, in name order.
   */
  export function statistics(readings: IReadings): HumanReferenceSurface.IRegion[] {
    const { names, region, deviation, area, fallback, flag, skin, limit }: IReadings = readings;
    const by: Map<number, number[]> = new Map();

    for (let v: number = 0; v < region.length; v++) {
      if (skin[v] === 0) continue;

      const list: number[] | undefined = by.get(region[v]!);
      if (list === undefined) by.set(region[v]!, [v]);
      else list.push(v);
    }

    return [...by.entries()]
      .map(([r, list]: [number, number[]]): HumanReferenceSurface.IRegion => {
        let A: number = 0;
        let S: number = 0;
        let M: number = 0;
        let F: number = 0;
        let X: number = 0;

        for (const v of list) {
          A += area[v]!;
          S += area[v]! * deviation[v]! ** 2;
          M += area[v]! * deviation[v]!;
          F += fallback[v]!;
          if (flag[v] !== 0) X++;
        }

        const sorted: number[] = list
          .map((v: number): number => Math.abs(deviation[v]!))
          .sort((a: number, b: number): number => a - b);
        const limits: number[] = list.map((v: number): number => limit[v]!).sort((a: number, b: number): number => a - b);

        return {
          limit: limits[Math.floor(limits.length / 2)]!,
          floor: HumanReferenceSurfaceFloor.floor(names[r]!),
          region: names[r]!,
          vertices: list.length,
          area: A,
          rms: Math.sqrt(S / A),
          p95: sorted[Math.min(sorted.length - 1, Math.floor(0.95 * sorted.length))]!,
          max: sorted[sorted.length - 1]!,
          mean: M / A,
          fallback: F,
          exceeding: X,
        };
      })
      .sort((a: HumanReferenceSurface.IRegion, b: HumanReferenceSurface.IRegion): number =>
        a.region.localeCompare(b.region),
      );
  }
}
