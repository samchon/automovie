import type { HumanAnatomy } from "./HumanAnatomy";

type V3 = HumanAnatomy.V3;

/**
 * A finding: one reading of one layer beyond its limit, addressed by person,
 * chain, layer and phase so a failure reads like "trunk layer 12, front-left,
 * radius +12 mm outside".
 */
export namespace HumanLayerFinding {
  /** One reading of one layer beyond its limit. */
  export interface IFinding {
    /** Person. */
    person: string;

    /** Chain. */
    chain: string;

    /** Layer index. */
    layer: number;

    /** What was read. */
    reading: string;

    /** Phase interval of the chain's own phase, degrees; null for a whole-section reading. */
    phase: [number, number] | null;

    /** Way the finding faces from the section's centroid. */
    bearing: string;

    /** Signed value, mm, mm² or degrees. */
    value: number;

    /** Limit, same unit. */
    limit: number;

    /** Mean over the run, same unit; the value again for a whole-section reading. */
    mean: number;

    /** Unit of value, limit and mean. */
    unit: string;

    /** World point of the worst sample, mm. */
    at: V3;

    /** Further detail. */
    detail: string;
  }

  /** A finding before it is addressed: the reading without its person, chain and layer. */
  export type Reading = Omit<IFinding, "person" | "chain" | "layer">;

  /** One finding as a line. */
  export function describe(f: IFinding): string {
    const digits: number = f.unit === "mm²" ? 0 : 1;
    const sign: (x: number) => string = (x: number): string => `${x >= 0 ? "+" : ""}${x.toFixed(digits)}`;
    const phase: string = f.phase === null ? "whole section" : `phase ${f.phase[0].toFixed(0)}..${f.phase[1].toFixed(0)} deg`;
    const at: string = f.at.map((c: number): string => c.toFixed(0)).join(", ");

    return (
      `${f.person} ${f.chain}/${f.layer} ${phase}, ${f.bearing}: ${f.reading} ${sign(f.value)} ${f.unit} ` +
      `(limit ${f.limit.toFixed(digits)}, mean ${sign(f.mean)}) at (${at}); ${f.detail}`
    );
  }
}
