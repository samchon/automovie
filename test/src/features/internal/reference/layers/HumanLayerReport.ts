import type { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanLayerFinding } from "../../HumanLayerFinding";

/** A point in space, mm. */
type V3 = HumanAnatomy.V3;

/**
 * What a reference comparison found at every layer of one person: the
 * findings, and for information beside them each layer's readings and, when a
 * layer was not compared, why not.
 */
export namespace HumanLayerReport {
  /** One layer's comparison, information beside the findings. */
  export interface ILayer {
    /** Person. */
    person: string;

    /** Chain. */
    chain: string;

    /** Layer index. */
    layer: number;

    /** Whether the layer was compared, and why not. */
    status: "compared" | "pole" | "open" | "missing" | "topology";

    /** Why the layer was not compared. */
    reason: string;

    /** Generated minus reference perimeter, mm. */
    girth: number;

    /** Generated minus reference taut-tape girth, mm. */
    taut: number;

    /** Generated minus reference area, mm². */
    area: number;

    /** Centroid shift, mm. */
    centroid: number;

    /** Centroid shift as a world vector, generated minus reference, mm. */
    shift: V3;

    /** Generated over reference perimeter. */
    ratio: number;

    /** The limits the layer's readings were held to. */
    limits: { girth: number; taut: number; area: number; centroid: number; fold: number; radius: [number, number] };

    /** Generated minus reference excess turning, degrees. */
    fold: number;

    /** Signed in-plane deviations of the generated samples, mm. */
    radial: number[];

    /** Generated samples whose reference counterpart is cut too obliquely to read in plane. */
    oblique: number;
  }

  /** A person's comparison with its reference. */
  export interface IReport {
    /** Person. */
    person: string;

    /** Every layer. */
    layers: ILayer[];

    /** Every finding. */
    findings: HumanLayerFinding.IFinding[];
  }

  /**
   * A layer before it is compared: every reading unread, ready to be filled.
   *
   * @param person Person.
   * @param chain Chain name.
   * @param layer Layer index.
   */
  export function blank(person: string, chain: string, layer: number): ILayer {
    return {
      person,
      chain,
      layer,
      status: "compared",
      reason: "",
      girth: NaN,
      taut: NaN,
      area: NaN,
      centroid: NaN,
      shift: [NaN, NaN, NaN],
      ratio: NaN,
      limits: { girth: NaN, taut: NaN, area: NaN, centroid: NaN, fold: NaN, radius: [NaN, NaN] },
      fold: NaN,
      radial: [],
      oblique: 0,
    };
  }

  /**
   * Per-chain statistics of a report, information only.
   *
   * @param report A person's comparison.
   * @returns One line per chain.
   */
  export function summarize(report: IReport): string[] {
    const by: Map<string, ILayer[]> = new Map();
    const lines: string[] = [];

    for (const l of report.layers) {
      const list: ILayer[] = by.get(l.chain) ?? [];

      list.push(l);
      by.set(l.chain, list);
    }

    for (const [chain, list] of by) {
      const compared: ILayer[] = list.filter((l: ILayer): boolean => l.status === "compared");
      const radial: number[] = compared.flatMap((l: ILayer): number[] => l.radial);
      const sorted: number[] = radial.map(Math.abs).sort((a: number, b: number): number => a - b);
      const rms: number = Math.sqrt(radial.reduce((s: number, x: number): number => s + x * x, 0) / Math.max(1, radial.length));
      const girths: number[] = compared.map((l: ILayer): number => l.girth);
      const girthRms: number = Math.sqrt(girths.reduce((s: number, x: number): number => s + x * x, 0) / Math.max(1, girths.length));
      const skipped: string[] = [...new Set(list.filter((l: ILayer): boolean => l.status !== "compared").map((l: ILayer): string => l.status))];
      let fold: number = 0;

      for (const l of compared) fold = Math.max(fold, l.fold);

      lines.push(
        `${report.person} ${chain}: ${compared.length}/${list.length} layers compared${skipped.length > 0 ? ` (others ${skipped.join(", ")})` : ""}; ` +
          `radius RMS ${rms.toFixed(1)} mm, p95 ${(sorted[Math.floor(0.95 * (sorted.length - 1))] ?? NaN).toFixed(1)} mm; ` +
          `girth RMS ${girthRms.toFixed(1)} mm; largest fold excess ${fold.toFixed(1)} deg`,
      );
    }

    return lines;
  }
}
