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
   * Share of the arm's reach a hook or uppercut lands at: the elbow held at
   * about ninety degrees (coaching of both punches), so the shoulder to
   * glove chord over two near-equal segments is the reach over root two.
   */
  export const BENT_SHARE: number = Math.SQRT1_2;

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
    // The struck surface's distance ahead of the receiver's stance origin
    // in his guard, so the range is measured between the bodies.
    const depth: number = receiver.front[spec.level];
    // The weapon's root joint ahead of the attacker's stance origin once the
    // strike's turn has brought its side to the line: the stance turn carries
    // the lead shoulder or hip forward, and a rear strike's drive turns the
    // rear one through to the same place.
    const shoulder: number = attacker.shoulderHalfWidth * Math.sin(StanceShape.TURN);
    const hip: number = attacker.hipHalfWidth * Math.sin(StanceShape.TURN);
    switch (spec.family) {
      case "punch":
        // A straight lands nearly extended; a hook or uppercut keeps the
        // elbow at about ninety degrees, so the glove stands the chord of two
        // equal arm segments from the shoulder.
        return (
          shoulder +
          (spec.line === "straight" ? REACH_SHARE : BENT_SHARE) *
            attacker.armReach +
          attacker.gloveRadius +
          depth
        );
      case "round-kick":
        // The shin lands with its lower part; the descending kick's instep
        // comes down from the turnover's raised knee, so its range is that
        // geometry's horizontal run to the head's centre line.
        return spec.line === "descending"
          ? TurnoverShape.range(attacker, receiver) +
              receiver.front.head -
              receiver.headRadius
          : hip +
              run(
                REACH_SHARE *
                  (attacker.thigh +
                    (spec.level === "head" ? 1 : StrikeShape.SHIN_SHARE) *
                      attacker.shank),
                height(receiver, spec.level) -
                  ((spec.level === "head"
                    ? TurnoverShape.hip(attacker)
                    : attacker.hip) -
                    StanceShape.sink(attacker)),
              ) +
              depth;
      case "push-kick":
        return (
          hip +
          REACH_SHARE * (attacker.thigh + attacker.shank) +
          attacker.foot / 2 +
          depth
        );
      case "knee":
        // The knee rises from the hip onto the region, so its floor run is
        // the thigh less that rise.
        return (
          hip +
          run(
            attacker.thigh,
            height(receiver, spec.level) -
              (attacker.hip - StanceShape.sink(attacker)),
          ) +
          depth
        );
      case "feint":
        throw new Error("A feint performs another technique");
    }
  }

  /**
   * The floor run of a limb reaching a point above or below its root: the
   * reach's horizontal leg over the rise, none when the rise exceeds it.
   *
   * @param reach The limb's reach from its root, metres.
   * @param rise The point's height over the root, metres.
   * @returns Metres.
   */
  export function run(reach: number, rise: number): number {
    return Math.sqrt(Math.max(0, reach * reach - rise * rise));
  }

  /**
   * Height of a struck level in the receiver's guard: the head's centre, the
   * ribs a third of the way down from the shoulders to the hips, the thigh
   * halfway down it. A round kick's shin reaches it from the kicking hip, so
   * its floor run is the leg's reach less this rise.
   *
   * @param receiver The receiver's measure.
   * @param level The struck level.
   * @returns Metres above the floor.
   */
  function height(
    receiver: IFighterMeasure,
    level: KickboxingTechnique.Level,
  ): number {
    const sink: number = StanceShape.sink(receiver);
    return level === "head"
      ? receiver.head - sink
      : level === "body"
        ? receiver.shoulder - (receiver.shoulder - receiver.hip) / 3 - sink
        : receiver.hip - receiver.thigh / 2 - sink;
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
