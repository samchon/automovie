import { gesture } from "../everyday/gesture";
import { rest } from "../everyday/rest";
import { HumanActionRow } from "../law/HumanActionRow";
import { flinch } from "../reaction/flinch";
import { touch } from "../touch/touch";

/**
 * Handling a firearm as rows of shipped actions, a first pass: where the
 * hands go, without the weapon as the effector, the sight line or recoil.
 * The composition gives the target. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (HumanActionRow), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanFirearm {
  /** Reach for a holster at the right hip. */
  export const reachHolster = HumanActionRow.of("reachHolster", touch, {
    target: { kind: "self", region: "hipRight" },
    with: "palm",
    kind: "hold",
    side: "right",
    hold: 0.3,
  });

  /** Level the weapon at a target and hold the aim two seconds (provisional). */
  export const takeAim = HumanActionRow.of("takeAim", gesture, {
    kind: "point",
    side: "right",
    hold: 2,
  });

  /** Low ready: both hands together in front. */
  export const lowReady = HumanActionRow.of("lowReady", rest, {
    left: "claspedFront",
    right: "claspedFront",
  });

  /** The jolt of a shot through the shooter: a slight flinch (intensity 0.3, provisional). */
  export const recoil = HumanActionRow.of("recoil", flinch, { intensity: 0.3 });

  /** Hands up at gunpoint. */
  export const surrender = HumanActionRow.of("surrender", gesture, {
    kind: "cheer",
    hold: 2,
  });
}
