import type { IFighterMeasure } from "./IFighterMeasure";
import { KickboxingTechnique } from "./KickboxingTechnique";
import { StanceShape } from "./StanceShape";
import { StrikeShape } from "./StrikeShape";
import { TurnoverShape } from "./TurnoverShape";

/**
 * The stance-origin distance at which a technique reaches its region: the
 * weapon's reach from its root joint in the attacker's frame plus the
 * receiver region's depth toward the attacker, both measured on the bodies.
 * Fighters stand off at outside range; a combination is a range cycle in
 * which each strike's entry brings the body to that strike's own range,
 * and the attacker exits to outside range after the last.
 *
 * ```ts
 * KickboxingRange.cycle(attacker, receiver, ["jab", "cross", "low-kick"]);
 * ```
 *
 * @evidence docs/research/kickboxing/techniques.md#reach Range is measured on the two bodies; every strike enters to its own range and the attacker exits.
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
  export function of(
    attacker: IFighterMeasure,
    receiver: IFighterMeasure,
    technique: KickboxingTechnique.Name,
  ): number {
    const spec: KickboxingTechnique.ISpec = KickboxingTechnique.performed(
      KickboxingTechnique.table[technique],
    );
    // Depth of the struck region in front of the receiver's stance origin.
    const depth: number =
      spec.level === "head"
        ? receiver.headRadius
        : spec.level === "body"
          ? receiver.shoulderHalfWidth / 2
          : receiver.hipHalfWidth;
    switch (spec.family) {
      case "punch":
        return REACH_SHARE * attacker.armReach + attacker.gloveRadius + depth;
      case "round-kick":
        // The shin lands with its lower part; the descending kick's instep
        // comes down from the turnover's raised knee, so its range is that
        // geometry's horizontal run.
        return spec.line === "descending"
          ? TurnoverShape.range(attacker, receiver)
          : REACH_SHARE *
              (attacker.thigh + StrikeShape.SHIN_SHARE * attacker.shank) +
              depth;
      case "push-kick":
        return (
          REACH_SHARE * (attacker.thigh + attacker.shank) +
          attacker.foot / 2 +
          depth
        );
      case "knee":
        return attacker.thigh + depth;
      case "feint":
        throw new Error("A feint performs another technique");
    }
  }

  /**
   * Outside range, where fighters stand off, circle and feint: one ring step
   * beyond the longest kick's range, so no strike lands without its entry.
   *
   * @param attacker The attacker's measure.
   * @param receiver The receiver's measure.
   * @returns Stance-origin distance, metres.
   * @evidence docs/research/kickboxing/techniques.md#reach Outside range is a step beyond the teep's range.
   */
  export function outside(
    attacker: IFighterMeasure,
    receiver: IFighterMeasure,
  ): number {
    return of(attacker, receiver, "teep") + StanceShape.step(attacker);
  }

  /**
   * Clinch range, under which the pair stands chest to chest: the knee's
   * range, the shortest of every technique, at which only the clinch knee
   * lands.
   *
   * @param attacker The attacker's measure.
   * @param receiver The receiver's measure.
   * @returns Stance-origin distance, metres.
   * @evidence docs/research/kickboxing/techniques.md#reach Clinch range is the knee's range; only pressing, the clinch and the finish work inside it.
   */
  export function clinch(
    attacker: IFighterMeasure,
    receiver: IFighterMeasure,
  ): number {
    return of(attacker, receiver, "knee");
  }

  /**
   * The range cycle of a combination: each strike's own entry closes (or
   * opens) to that strike's contact range as the combination progresses, a
   * feint from where its shown technique would land, and after the last
   * strike the attacker exits back to outside range.
   *
   * @param attacker The attacker's measure.
   * @param receiver The receiver's measure.
   * @param techniques Its techniques, feints included.
   * @returns Each strike's contact range and the exit range, metres.
   * @throws When the combination is empty.
   * @evidence docs/research/kickboxing/techniques.md#reach Every strike carries its own entry; the attacker exits after the last.
   */
  export function cycle(
    attacker: IFighterMeasure,
    receiver: IFighterMeasure,
    techniques: readonly KickboxingTechnique.Name[],
  ): { entries: number[]; exit: number } {
    if (techniques.length === 0) throw new Error("A combination has strikes");
    return {
      entries: techniques.map((t) => of(attacker, receiver, t)),
      exit: outside(attacker, receiver),
    };
  }
}
