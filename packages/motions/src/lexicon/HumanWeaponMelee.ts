import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";
import { HumanSword } from "./HumanSword";
import { HumanSwordThrust } from "./HumanSwordThrust";

/**
 * One-handed melee weapons and the firearm's reload under film names, each
 * a row of a blade law or of the touch. The composition gives the weapon
 * the hand holds (`blade`; a club's striking contact is `tip: "strike"`,
 * fixed here) and the target; with neither, the row is a shadow stroke of
 * the empty hand. The receiver's part is its own row (`HumanStageFight`).
 *
 * First pass: a blow is the arm's stroke with the advance the cut offers; a
 * body does not stop it. The reload brings the support hand's palm to the
 * place the composition names (the pistol's `magazine` contact); no magazine
 * is exchanged.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped or registered law (`HumanActionRow`).
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per act of #3348's melee list and the reload; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own.
 */
export namespace HumanWeaponMelee {
  /** A club or a bat swung level at a person or a thing. */
  export const clubSwing = HumanActionRow.of("clubSwing", HumanSword.cut, {
    from: "forehand",
    tip: "strike",
  });

  /** A club or a baton brought down from overhead. */
  export const clubStrike = HumanActionRow.of("clubStrike", HumanSword.cut, {
    from: "above",
    tip: "strike",
  });

  /** A knife slashed across from the knife hand's side. */
  export const knifeSlash = HumanActionRow.of("knifeSlash", HumanSword.cut, {
    from: "forehand",
  });

  /** A knife slashed back across from the off side. */
  export const knifeBackslash = HumanActionRow.of(
    "knifeBackslash",
    HumanSword.cut,
    { from: "backhand" },
  );

  /** A knife driven forward, the point first, with the least advance that reaches. */
  export const knifeStab = HumanActionRow.of(
    "knifeStab",
    HumanSwordThrust.thrust,
    {},
  );

  /** A knife held point down (taken by its `reverseGrip`) and driven down from overhead. */
  export const stabOverhand = HumanActionRow.of(
    "stabOverhand",
    HumanSword.cut,
    { from: "above" },
  );

  /** A reload: the support hand's palm pressed once to the magazine well the composition names. */
  export const reload = HumanActionRow.of("reloadFirearm", touch, {
    with: "palm",
    kind: "press",
    count: 1,
    side: "left",
  });
}
