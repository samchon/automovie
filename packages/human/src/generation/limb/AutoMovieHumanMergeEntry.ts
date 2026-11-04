import type { AutoMovieHumanLoftContract } from "../../lofting/AutoMovieHumanLoftContract";
import { AutoMovieHumanSolidBlendChain } from "../../lofting/AutoMovieHumanSolidBlendChain";
import type { AutoMovieHumanSolidJoin } from "../../lofting/AutoMovieHumanSolidJoin";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "../IAutoMovieHumanBodyCalibration";

/**
 * A join published for the skin: its blend chain (`AutoMovieHumanSolidBlendChain.of`)
 * and the calibration's merge entry that tells the solid tessellation which
 * host and part faces it trims and where (`IAutoMovieHumanBodyCalibration.IMerge`),
 * the rails, the host's direction past its rail (`across`) and the part's
 * kept side (`sigma`) copied from the blend, so host, blend and part share
 * one vertex per column along both rails.
 *
 * The blend's columns are a multiple of four of at least eight; the rows
 * between its rails stand no wider apart than the part's own row spacing. The host and part chains are named, not
 * held: the tessellation finds them in `calibration.chains`, so they must
 * carry jets (a view-lofted chain does; an older chain through
 * `AutoMovieHumanSolidChain.framed`) and no event may name them.
 */
export namespace AutoMovieHumanMergeEntry {
  /** A published join. */
  export interface IEntry {
    /** The blend chain, for `calibration.chains`. */
    chain: IAutoMovieHumanLoftChain;

    /** The merge entry, for `calibration.merges`. */
    merge: IAutoMovieHumanBodyCalibration.IMerge;
  }

  /**
   * Publish a join.
   *
   * @param name The blend chain's name, such as `blend.breast.left`.
   * @param host The host chain's name.
   * @param part The part chain's name.
   * @param join The join.
   * @param columns Blend columns, a multiple of 4 of at least 8.
   * @param gap Widest spacing between the blend's rows, mm: the rows are the fewest that keep it, at least 1.
   * @param diff Whether the join is a diff.
   * @param diagnostics The list a failure is recorded in.
   * @returns The entry, or null when a rail fails at a column.
   */
  export function of(
    name: string,
    host: string,
    part: string,
    join: AutoMovieHumanSolidJoin.IJoin,
    columns: number,
    gap: number,
    diff: boolean,
    diagnostics: AutoMovieHumanLoftContract.IDiagnostic[],
  ): IEntry | null {
    const blend: AutoMovieHumanSolidBlendChain.IBlend | null = AutoMovieHumanSolidBlendChain.of(name, join, columns);
    if (blend === null) {
      diagnostics.push({ producer: `merge.${name}`, level: 6, contract: "blend", detail: `a rail fails at one of ${columns} columns of ${part} on ${host}` });
      return null;
    }
    return {
      chain: blend.chain,
      merge: {
        blend: blend.chain.name,
        host,
        part,
        length: blend.length,
        hostLoop: blend.host,
        partLoop: blend.part,
        across: blend.across,
        partAcross: blend.partAcross,
        sigma: blend.sigma,
        rows: Math.max(1, Math.ceil(blend.length / gap - 1e-9)),
        ...(diff ? { diff: true } : {}),
      },
    };
  }
}
