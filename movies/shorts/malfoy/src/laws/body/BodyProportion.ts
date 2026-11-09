import type { IBodyMeasure } from "./IBodyMeasure";

/**
 * Body lengths from stature by the conventional segment proportions of
 * Drillis and Contini (1966) as Winter's *Biomechanics and Motor Control of
 * Human Movement* tabulates them (hip 0.530, shoulder 0.818, ankle 0.039,
 * head centre 0.936 of stature; shoulder breadth 0.259, hip breadth 0.191;
 * shoulder to wrist 0.335 plus hand centre 0.054; foot 0.152), a production
 * convention applied to the settings' statures so every law sees the same
 * lengths in tests and in the film. The breadths are measured to the body's
 * outer surface, so the joint centres the laws need lie a production-chosen
 * 2 cm inside each half-breadth. The Human figure fits these goals by
 * limb fitting, so its own skeleton may differ by centimetres.
 *
 * ```ts
 * BodyProportion.measure(1.63).hip; // 0.864 m
 * ```
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the convention, its ratios and their source.
 * @evidence contracts/development/design.md#principled-representation Metres as fractions of stature in metres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function serving every body.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No person is named.
 */
export namespace BodyProportion {
  /**
   * The measures of a body of a stature.
   *
   * @param stature Metres.
   * @returns The measures.
   * @evidence contracts/development/common.md#meaningful-documentation States the unit.
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies stature by the tabulated segment fractions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every ratio is the convention's, none tuned.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant time.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Nothing is shared.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Nothing is retained.
   * @evidence contracts/development/behaviors.md#studied-laws The segment proportion convention stated above.
   * @evidence contracts/development/behaviors.md#relational-goals Reads no position.
   * @evidence contracts/development/behaviors.md#deterministic-evaluation Pure.
   */
  export function measure(stature: number): IBodyMeasure {
    if (!(stature > 0)) throw new Error(`Invalid stature ${stature}`);
    return Object.freeze({
      stature,
      hip: 0.53 * stature,
      hipHalfWidth: (0.191 * stature) / 2 - 0.02,
      shoulder: 0.818 * stature,
      shoulderHalfWidth: (0.259 * stature) / 2 - 0.02,
      head: 0.936 * stature,
      armReach: (0.335 + 0.054) * stature,
      legLength: (0.53 - 0.039) * stature,
      ankle: 0.039 * stature,
      foot: 0.152 * stature,
    });
  }
}
