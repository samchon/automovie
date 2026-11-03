import { HumanCurveProfile } from "../curves/HumanCurveProfile";
import type { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import type { HumanArmPieces } from "./HumanArmPieces";

type IRow = HumanAnatomyAudit.IRow;

/**
 * The arm's girth law read alone from one person's inputs (consistency.md
 * section 3.2): the four tapes at their sites, the profile's spans with no
 * wobble, the forearm's belly in its proximal half, the least girth at the
 * wrist, and every pair of tapes in the order the person's inputs give it.
 */
export namespace HumanArmPieceAudit {
  /** Station step of the profile, mm: the catalog's 2 mm. */
  export const STEP: number = 2;

  /** The forearm tape's window, shares of radiale-stylion below the elbow (ISO's relaxed maximum below the elbow). */
  export const BELLY: readonly [number, number] = [0.1, 0.6];

  /** The rows of one arm's law. */
  export function girth(p: HumanArmPieces.IPieces, law: (s: number) => number = p.girth): IRow[] {
    const { SMALL, WRIST_PROXIMAL, WRIST_DISTAL }: typeof HumanAnatomyShared = HumanAnatomyShared;
    const walk: number[] = [];
    for (let s: number = 0; s <= p.stylion + WRIST_DISTAL + 1e-9; s += STEP) walk.push(s);
    const g: number[] = walk.map(law);
    const index: (s: number) => number = (s: number): number => Math.min(walk.length - 1, Math.max(0, Math.round(s / STEP)));
    const bicep: number = index(p.bicep);
    const elbow: number = index(p.elbow);

    // The forearm's belly within its tape's window, the supracondylar least
    // girth between the upper arm's site and the elbow, the least girth past
    // the belly near the wrist.
    const belly: number = HumanCurveProfile.argmax(g, index(p.elbow + BELLY[0] * p.forearm), index(p.elbow + BELLY[1] * p.forearm));
    const supra: number = HumanCurveProfile.argmin(g, bicep, elbow);
    const least: number = HumanCurveProfile.argmin(g, belly, g.length - 1);
    const generated: Record<keyof HumanArmPieces.IPieces["tapes"], number> = { bicep: g[bicep]!, elbow: g[elbow]!, forearm: g[belly]!, wrist: law(p.stylion) };
    const row: (what: string, value: number, low: number, high: number, unit: string) => IRow = (what: string, value: number, low: number, high: number, unit: string): IRow => ({
      person: p.person,
      site: `arm girth law: ${what}`,
      value,
      low,
      high,
      unit,
    });
    const out: IRow[] = [
      row("upper arm site less the bicep tape, mm", generated.bicep - p.tapes.bicep, -SMALL, SMALL, "mm"),
      row("elbow centre less the elbow tape, mm", generated.elbow - p.tapes.elbow, -SMALL, SMALL, "mm"),
      row("forearm belly less the forearm tape, mm", generated.forearm - p.tapes.forearm, -SMALL, SMALL, "mm"),
      row("stylion less the wrist tape, mm", generated.wrist - p.tapes.wrist, -SMALL, SMALL, "mm"),
      row("excess variation from the arm's root to the upper arm site (down), mm", HumanCurveProfile.excess(g.slice(0, bicep + 1)), 0, SMALL, "mm"),
      row("excess variation from the upper arm site to the supracondylar least girth (down), mm", HumanCurveProfile.excess(g.slice(bicep, supra + 1)), 0, SMALL, "mm"),
      row("excess variation from the forearm belly to the least girth at the wrist (down), mm", HumanCurveProfile.excess(g.slice(belly, least + 1)), 0, SMALL, "mm"),
      row("forearm belly, share of radiale-stylion below the elbow", (walk[belly]! - p.elbow) / p.forearm, 0, 0.5, ""),
      row("least girth past the belly, mm from stylion (negative proximal)", walk[least]! - p.stylion, -WRIST_PROXIMAL, WRIST_DISTAL, "mm"),
    ];

    // The order of every pair of tapes follows the inputs wherever they
    // differ by more than both tapes' errors (ORD-0 on the law).
    const names: (keyof HumanArmPieces.IPieces["tapes"])[] = ["bicep", "elbow", "forearm", "wrist"];
    for (let i: number = 0; i < names.length; i++)
      for (let j: number = i + 1; j < names.length; j++) {
        const a: keyof HumanArmPieces.IPieces["tapes"] = names[i]!;
        const b: keyof HumanArmPieces.IPieces["tapes"] = names[j]!;
        const input: number = p.tapes[a] - p.tapes[b];
        if (Math.abs(input) <= 2 * SMALL) continue;
        out.push(row(`${a} less ${b}, signed as the inputs order them, mm`, Math.sign(input) * (generated[a] - generated[b]), 0, Infinity, "mm"));
      }
    return out;
  }
}
