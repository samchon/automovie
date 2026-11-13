import { HumanActionRow } from "../law/HumanActionRow";
import { handspring } from "../sport/handspring";
import { highJump } from "../sport/highJump";
import { poleVault } from "../sport/poleVault";
import { roundOff } from "../sport/roundOff";
import { vault } from "../sport/vault";

/**
 * The airborne acrobatics and jumps of gymnastics and athletics under their
 * names (#3377), each a row of the law that plans it: a round-off and a
 * handspring that roll over the hands, a vault over a prop's top, the
 * Fosbury flop over a bar and a vault on a pole. The composition gives what
 * the law leaves open: the prop vaulted over, the bar's height and the
 * landing place, the pole the hand holds.
 *
 * The laws own the physics a row inherits: each phase turns the body about
 * one axis, flights are ballistic in the centre of mass with their times
 * from the take-off speed, and a turn in the air is its kept rate times the
 * flight time. The multi-axis case (a twisting salto, a round-off's
 * overlapping twist) is #3416.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is a row of, what the composition gives, whose physics a row inherits and the follow-up.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), so it is data over a law that fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per named figure; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or fixes a length in metres.
 */
export namespace HumanGymnastics {
  /** A round-off leading with the left hand, landing on both feet facing back. */
  export const roundOffLeft = HumanActionRow.of("roundOffLeft", roundOff, {
    lead: "left",
  });

  /** A round-off leading with the right hand. */
  export const roundOffRight = HumanActionRow.of("roundOffRight", roundOff, {
    lead: "right",
  });

  /** A front handspring on the floor, lunging on the left leg; the composition may lead with the right. */
  export const frontHandspring = HumanActionRow.of(
    "frontHandspring",
    handspring,
    {},
  );

  /** A handspring vault: the hands on the top of the prop the composition names as `on`. */
  export const handspringVault = HumanActionRow.of(
    "handspringVault",
    vault,
    {},
  );

  /** A Fosbury flop over the bar the composition sets, onto its landing place. */
  export const fosburyFlop = HumanActionRow.of("fosburyFlop", highJump, {});

  /** A vault on the pole the hand holds, out of a run. */
  export const vaultOnPole = HumanActionRow.of("vaultOnPole", poleVault, {});
}
