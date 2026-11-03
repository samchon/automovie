import { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanHeadMadeCut } from "./HumanHeadMadeCut";
import { HumanHeadPiece } from "./HumanHeadPiece";
import type { HumanHeadSurfaceRows } from "./HumanHeadSurfaceRows";

/**
 * The red and green proof of one family of head surface rows on f1's
 * landmarks: every row passes on the made ellipsoid head, and the rows whose
 * site names the defect's region fail, each with a finite value, once a defect
 * of known size is laid on that ellipsoid.
 */
export namespace HumanHeadSurfaceProof {
  /** A family of rows over a cut. */
  export type Family = (piece: HumanHeadPiece.IPiece, cut: HumanHeadSurfaceRows.Cut) => HumanAnatomyAudit.IRow[];

  /**
   * The proof's failures, empty when it holds.
   *
   * @param family The rows.
   * @param defect The defect to lay on the ellipsoid, from the piece and the ellipsoid's own centre depth.
   * @param match A text every row the defect must turn red carries in its site.
   * @param least How many such rows at least must turn red.
   */
  export function failures(
    family: Family,
    defect: (piece: HumanHeadPiece.IPiece) => HumanHeadMadeCut.Change,
    match: string,
    least: number,
  ): string[] {
    const piece: HumanHeadPiece.IPiece = HumanHeadPiece.get("f1");
    const correct: HumanHeadSurfaceRows.Cut = HumanHeadMadeCut.ellipsoid(piece);
    const out: string[] = family(piece, correct)
      .filter((r: HumanAnatomyAudit.IRow): boolean => !HumanAnatomyAudit.passes(r))
      .map((r: HumanAnatomyAudit.IRow): string => `made ellipsoid must pass: ${r.site}: ${r.value.toFixed(2)} ${r.unit}`);
    const red: HumanAnatomyAudit.IRow[] = family(piece, HumanHeadMadeCut.deform(correct, defect(piece))).filter(
      (r: HumanAnatomyAudit.IRow): boolean => r.site.includes(match) && Number.isFinite(r.value) && !HumanAnatomyAudit.passes(r),
    );
    if (red.length < least) out.push(`made defect must turn at least ${least} "${match}" rows red with a finite value: ${red.length} did`);
    return out;
  }
}
