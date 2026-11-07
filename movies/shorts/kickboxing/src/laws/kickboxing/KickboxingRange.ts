import type { IFighterMeasure } from "./IFighterMeasure";
import { KickboxingTechnique } from "./KickboxingTechnique";
import { StrikeShape } from "./StrikeShape";

/**
 * The stance-origin distance at which a technique reaches its region: the
 * weapon's reach from its root joint in the attacker's frame plus the
 * receiver region's depth toward the attacker, both measured on the bodies.
 * A combination keeps the shortest range its strikes need.
 *
 * ```ts
 * KickboxingRange.combination(attacker, receiver, ["jab", "cross", "low-kick"]);
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#reach Range is measured on the two bodies; a combination keeps the shortest range its strikes need.
 * @evidence docs/research/kickboxing/techniques.md#surfaces Weapons and regions.
 */
export namespace KickboxingRange {
  /**
   * Share of the full limb length used at contact: a punch lands with the
   * elbow still slightly bent and a kick with the knee not locked, read as
   * ninety percent from the IBA straight-punch drawings and the PLOS impact
   * frame.
   */
  export const REACH_SHARE: number = 0.9;

  /**
   * The range of one technique.
   *
   * @param attacker The attacker's measure.
   * @param receiver The receiver's measure.
   * @param technique The technique.
   * @returns Stance-origin distance, metres.
   * @evidence docs/research/kickboxing/techniques.md#reach Weapon reach plus region depth.
   */
  export function of(attacker: IFighterMeasure, receiver: IFighterMeasure, technique: KickboxingTechnique.Name): number {
    const spec: KickboxingTechnique.ISpec = KickboxingTechnique.performed(KickboxingTechnique.table[technique]);
    // Depth of the struck region in front of the receiver's stance origin.
    const depth: number = spec.level === "head" ? receiver.headRadius : spec.level === "body" ? receiver.shoulderHalfWidth / 2 : receiver.hipHalfWidth;
    switch (spec.family) {
      case "punch":
        return REACH_SHARE * attacker.armReach + attacker.gloveRadius + depth;
      case "round-kick":
        return REACH_SHARE * (attacker.thigh + StrikeShape.SHIN_SHARE * attacker.shank) + depth;
      case "push-kick":
        return REACH_SHARE * (attacker.thigh + attacker.shank) + attacker.foot / 2 + depth;
      case "knee":
        return attacker.thigh + depth;
      case "feint":
        throw new Error("A feint performs another technique");
    }
  }

  /**
   * The range of a combination: the shortest its strikes need.
   *
   * @param attacker The attacker's measure.
   * @param receiver The receiver's measure.
   * @param techniques Its techniques.
   * @returns Stance-origin distance, metres.
   * @evidence docs/research/kickboxing/techniques.md#reach The shortest range of the combination.
   */
  export function combination(
    attacker: IFighterMeasure,
    receiver: IFighterMeasure,
    techniques: readonly KickboxingTechnique.Name[],
  ): number {
    if (techniques.length === 0) throw new Error("A combination has strikes");
    return Math.min(...techniques.map((t) => of(attacker, receiver, t)));
  }
}
