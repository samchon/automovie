import type { BoutAnswer } from "./BoutAnswer";
import { BoutTechnique } from "./BoutTechnique";

/**
 * One fighter's limb availability while an exchange is performed. Attacks and
 * answers occupy limbs for the windows their registered specs and computed
 * outcomes declare; the composition rules below decide the earliest legal
 * moment for the next move:
 *
 * - a limb carries one window at a time;
 * - a leg action shares its window with no other own action;
 * - a strike launches only after the previous own strike has landed;
 * - no attack launches while the fighter is still answering or stunned.
 */
export class BoutTimeline {
  /** Second at which each limb is free. */
  private readonly limbs: Record<string, number>;
  /** End of the last own window of any limb. */
  private all: number;
  /** End of the last own leg window or leg answer. */
  private legs: number;
  /** Earliest launch after the previous own strike has landed. */
  private launch: number;
  /** End of the last answer or stun owed to an incoming strike. */
  private engaged: number;

  /** All limbs free from `origin`. */
  public constructor(origin: number) {
    this.limbs = { "left-arm": origin, "right-arm": origin, "left-leg": origin, "right-leg": origin };
    this.all = origin;
    this.legs = origin;
    this.launch = origin;
    this.engaged = origin;
  }

  /** Earliest legal launch of `spec` no sooner than `after`. */
  public attackable(spec: BoutTechnique.ISpec, after: number): number {
    return Math.max(
      after,
      this.launch,
      this.engaged,
      this.legs,
      spec.limb === "leg" ? this.all : this.limbs[`${spec.side}-arm`]!,
    );
  }

  /** Occupy the attack window launched at `start` with the varied `recovery`; returns the contact second. */
  public attack(spec: BoutTechnique.ISpec, start: number, recovery: number): number {
    const contact: number = start + spec.windup;
    const end: number = contact + BoutTechnique.HOLD + recovery;
    this.occupy(`${spec.side}-${spec.limb}`, end, spec.limb === "leg");
    this.launch = contact + BoutTechnique.HOLD;
    return contact;
  }

  /** Second at which the answer's limb on `side` is free; evasions need no limb. */
  public free(answer: BoutAnswer.ISpec, side: BoutTechnique.Side, origin: number): number {
    if (!answer.limb) return origin;
    return answer.limb === "leg" ? Math.max(this.legs, this.limbs[`${side}-leg`]!) : this.limbs[`${side}-arm`]!;
  }

  /** Occupy the answer's limb and the fighter until `end`. */
  public answer(answer: BoutAnswer.ISpec, side: BoutTechnique.Side, end: number): void {
    if (answer.limb) this.occupy(`${side}-${answer.limb}`, end, answer.limb === "leg");
    this.engaged = Math.max(this.engaged, end);
  }

  /** Plant both feet for one supported step after every own window. */
  public settle(after: number, seconds: number): void {
    const start: number = Math.max(after, this.all, this.engaged);
    this.occupy("left-leg", start + seconds, true);
    this.occupy("right-leg", start + seconds, true);
    this.launch = Math.max(this.launch, start + seconds);
  }

  /** Last second this fighter is occupied. */
  public end(): number {
    return Math.max(this.all, this.engaged);
  }

  /** Extend one limb window. */
  private occupy(key: string, end: number, leg: boolean): void {
    this.limbs[key] = Math.max(this.limbs[key]!, end);
    this.all = Math.max(this.all, end);
    if (leg) this.legs = Math.max(this.legs, end);
  }
}
