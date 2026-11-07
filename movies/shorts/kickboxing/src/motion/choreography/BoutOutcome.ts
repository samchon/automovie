import { BoutAnswer } from "./BoutAnswer";
import type { BoutGeometry } from "./BoutGeometry";
import { BoutTechnique } from "./BoutTechnique";

/**
 * Outcome of a strike against an answer, decided by rule first and audited by
 * geometry second, as fighting and action games resolve contact.
 *
 * The rule reads only intent and timing: whether the receiver's read matches
 * the real strike's target and side, whether his answer family can meet that
 * target and line, and how much of the answer is set at contact. A fully set
 * answer works (blocked, deflected, checked or missed), at least half set it
 * glances, otherwise the strike lands clean. A misread or an answer that
 * cannot meet the line lets the strike land clean whatever the timing. A feint
 * has no contact: the receiver bites when he started before it returned.
 *
 * Geometry never flips the class. {@link realizable} only proves that the
 * class can be staged with the figures' extents (a guard broad enough to cover
 * the weapon, an evasion long enough to clear it) and yields the contact
 * domain inside the target region where it can.
 */
export namespace BoutOutcome {
  /** Computed result consumed by reactions, sound, receipts, effects and scoring. */
  export type Class = "clean" | "glancing" | "blocked" | "deflected" | "checked" | "missed" | "bit" | "ignored";

  /** Fraction of an answer set by contact from which the strike glances instead of landing clean: half the weapon patch covered or cleared. */
  export const GLANCE: number = 0.5;

  /**
   * What the receiver visibly performs for a computed class. A landed or
   * glancing strike shows the hit response; a worked answer shows its own
   * family; a bitten feint shows the answer he started without any contact;
   * an ignored feint shows nothing.
   */
  export type Presentation = Exclude<BoutAnswer.Family, "none"> | "hit" | "none";

  /** Visible answer for a computed class; motion, contact, reaction and sound modules consume this instead of per-row labels. */
  export function presentation(intent: BoutAnswer.IIntent, outcome: Class): Presentation {
    if (outcome === "clean" || outcome === "glancing") return "hit";
    if (outcome === "ignored" || intent.family === "none") return "none";
    return intent.family;
  }

  /** Whether the class leaves a physical contact between weapon and receiver. */
  export function touches(outcome: Class): boolean {
    return outcome !== "missed" && outcome !== "bit" && outcome !== "ignored";
  }

  /** Whether the answer relates to the real strike at all. */
  export function applies(technique: BoutTechnique.Name, intent: BoutAnswer.IIntent): boolean {
    const spec: BoutTechnique.ISpec = BoutTechnique.get(technique);
    const read: BoutTechnique.ISpec = BoutTechnique.get(intent.reads ?? technique);
    const answer: BoutAnswer.ISpec = BoutAnswer.get(intent.family);
    return (
      read.target === spec.target &&
      read.side === spec.side &&
      answer.targets.includes(spec.target) &&
      answer.lines.includes(spec.line)
    );
  }

  /** The class a fully set answer earns against a strike it applies to. */
  export function worked(intent: BoutAnswer.IIntent): Class {
    const answer: BoutAnswer.ISpec = BoutAnswer.get(intent.family);
    if (answer.evasion) return "missed";
    return answer.family === "check" ? "checked" : answer.family === "parry" ? "deflected" : "blocked";
  }

  /** Rule: the class from the intent, the answer's set fraction at contact and, for feints, whether it started before the feint returned. */
  export function decide(technique: BoutTechnique.Name, intent: BoutAnswer.IIntent, progress: number, reacted: boolean): Class {
    const spec: BoutTechnique.ISpec = BoutTechnique.get(technique);
    if (!spec.contact) return reacted && intent.family !== "none" ? "bit" : "ignored";
    if (!applies(technique, intent)) return "clean";
    if (progress >= 1) return worked(intent);
    return progress >= GLANCE ? "glancing" : "clean";
  }

  /** Interval of the answer's set fraction at contact that produces `required` for a contact strike, or null when no timing can. Feints are decided by `reacted` instead. */
  export function progressFor(technique: BoutTechnique.Name, intent: BoutAnswer.IIntent, required: Class): readonly [number, number] | null {
    if (!applies(technique, intent)) return required === "clean" ? [0, 1] : null;
    if (required === worked(intent)) return [1, 1];
    if (required === "glancing") return [GLANCE, 1 - Number.EPSILON];
    if (required === "clean") return [0, GLANCE - Number.EPSILON];
    return null;
  }

  /**
   * Geometric audit of a class: the interval of weapon-patch centres across
   * the target region that can stage it, metres from the region centre, or
   * null when the extents cannot. A worked evasion keeps the patch toward the
   * edge the head clears first; a worked guard needs a breadth that spans the
   * weapon; every other class can land anywhere the patch fits the region.
   */
  export function realizable(
    technique: BoutTechnique.Name,
    intent: BoutAnswer.IIntent,
    required: Class,
    extents: BoutGeometry.IExtents,
  ): readonly [number, number] | null {
    const spec: BoutTechnique.ISpec = BoutTechnique.get(technique);
    const answer: BoutAnswer.ISpec = BoutAnswer.get(intent.family);
    const region: number = spec.feature ? extents.feature[spec.feature] : extents.region[spec.target];
    const weapon: number = extents.surface[spec.surface];
    const half: number = Math.max(0, (region - weapon) / 2);
    if (!spec.contact || !applies(technique, intent) || required !== worked(intent)) return [-half, half];
    if (answer.guard) return extents.guard[answer.guard] >= weapon ? [-half, half] : null;

    // The head moves by the evasion's reach toward +, so the patch must end
    // below the region's moved lower edge.
    const highest: number = -region / 2 + extents.evasion[answer.evasion!] - weapon / 2;
    return highest >= -half ? [-half, Math.min(half, highest)] : null;
  }
}
