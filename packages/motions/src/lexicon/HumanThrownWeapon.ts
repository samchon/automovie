import { HumanActionRow } from "../law/HumanActionRow";
import { throwObject } from "../throwing/throwObject";

/**
 * Thrown weapons (#3490) as rows of `throwObject`, each throwing the held
 * prop the composition names (`prop`), which rides the hand to the release
 * and then flies (#3479):
 *
 * - `throwJavelin` and `throwSpear`: overarm, the shaft along its velocity,
 *   released at the middle of the release angles Campos, Brizuela and Ramón
 *   (2004) measured in elite men at the 1999 World Championships (27.7 to
 *   40.1 degrees), 33.9 degrees; a soldier's lower speed follows from the
 *   range equation to the target. The athletes' run-up stays with #3377.
 * - `throwKnife`: overarm; the knife's spin, whose rate turns it a whole
 *   number of half turns to the target, is the composition's attitude until
 *   the act chooses the stand-off.
 * - `throwGrenade`, `hurlStone` and `hurlBottle`: overarm at the style's
 *   angle, the body tumbling as it was released.
 * - `sling` and `castAtlatl`: overarm; the implement that lengthens the arm
 *   is not modelled yet (#3490's `implement`), so they throw from the hand.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each row's style, angle and attitude with the source, and what is not modelled.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface #3490's rows; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; the one fixed angle is the middle of a read band.
 */
export namespace HumanThrownWeapon {
  /** The middle of the elite javelin release angles, degrees (Campos, Brizuela and Ramón 2004: 27.7 to 40.1). */
  export const JAVELIN: number = (27.7 + 40.1) / 2;

  /** Throw a javelin overarm, its shaft along its flight. */
  export const throwJavelin = HumanActionRow.of("throwJavelin", throwObject, {
    style: "overarm",
    angle: JAVELIN,
    attitude: { kind: "velocity" },
  });

  /** Throw a spear overarm, its shaft along its flight. */
  export const throwSpear = HumanActionRow.of("throwSpear", throwObject, {
    style: "overarm",
    angle: JAVELIN,
    attitude: { kind: "velocity" },
  });

  /** Throw a knife overarm. */
  export const throwKnife = HumanActionRow.of("throwKnife", throwObject, {
    style: "overarm",
  });

  /** Lob a grenade overarm. */
  export const throwGrenade = HumanActionRow.of("throwGrenade", throwObject, {
    style: "overarm",
  });

  /** Hurl a stone overarm. */
  export const hurlStone = HumanActionRow.of("hurlStone", throwObject, {
    style: "overarm",
  });

  /** Hurl a bottle overarm. */
  export const hurlBottle = HumanActionRow.of("hurlBottle", throwObject, {
    style: "overarm",
  });

  /** Sling a stone. */
  export const sling = HumanActionRow.of("sling", throwObject, {
    style: "overarm",
  });

  /** Cast a dart with an atlatl. */
  export const castAtlatl = HumanActionRow.of("castAtlatl", throwObject, {
    style: "overarm",
  });
}
