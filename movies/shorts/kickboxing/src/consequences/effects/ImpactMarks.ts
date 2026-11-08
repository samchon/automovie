import type { ContactReceipts } from "../../interactions/kickboxing/ContactReceipts";
import { KickboxingTechnique } from "../../laws/kickboxing/KickboxingTechnique";

/**
 * Reddened skin left by landed blows: each measured landed contact adds a
 * mark to the struck region that stays for the rest of the bout, rising
 * over a moment after the blow. Blocked, parried and checked contacts and
 * blows the geometry did not realize leave nothing.
 *
 * ```ts
 * ImpactMarks.at(receipts, "b", 151); // { "jaw-neck-left": 1, "thigh-left": 0.8, ... }
 * ```
 *
 * @evidence docs/body/settings/cast/fighter-a.md#marks Each clean blow leaves the struck skin reddened for the rest of the bout.
 * @evidence docs/body/settings/cast/fighter-b.md#marks The same for B.
 */
export namespace ImpactMarks {
  /** Seconds a mark takes to rise after the blow: one hand recovery's worth, a visible flush rather than a cut (film choice). */
  const RISE: number = 0.35;

  /** Mark added by one landed blow, by level: kicks and the finish mark more than punches (film choice). */
  const STRENGTH: Readonly<Record<KickboxingTechnique.Level, number>> = {
    head: 0.45,
    body: 0.4,
    leg: 0.5,
  };

  /**
   * Marks on a fighter at a second.
   *
   * @param receipts The measured contacts.
   * @param subject The fighter's id.
   * @param seconds Film seconds.
   * @returns Redness by region, in [0, 1].
   */
  export function at(
    receipts: readonly ContactReceipts.IReceipt[],
    subject: string,
    seconds: number,
  ): Record<string, number> {
    const marks: Record<string, number> = {};
    for (const r of receipts) {
      if (
        r.receiver !== subject ||
        r.outcome !== "landed" ||
        !r.contact ||
        r.seconds > seconds
      )
        continue;
      const spec: KickboxingTechnique.ISpec =
        KickboxingTechnique.table[r.technique];
      const strength: number =
        spec.disguise !== undefined ? 1 : STRENGTH[spec.level];
      const rise: number = Math.min(1, (seconds - r.seconds) / RISE);
      marks[r.region] = Math.min(1, (marks[r.region] ?? 0) + strength * rise);
    }
    return marks;
  }
}
