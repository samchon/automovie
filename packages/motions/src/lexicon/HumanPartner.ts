import { relayPass } from "../handling/relayPass";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Things two people do as partners in sport and dance, each a row of a law
 * whose roles share a stated instant or a meeting. Register the rows a film
 * uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the law it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a law (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the law.
 */
export namespace HumanPartner {
  /** The incoming runner of a relay pass, performed over its run: the baton worn in the hand pushed into the outgoing hand at the stated `at`. The composition gives the partner, `at` and the baton. */
  export const relayIncoming = HumanActionRow.of("relayIncoming", relayPass, {
    role: "incoming",
  });

  /** The outgoing runner of a relay pass, performed over its run: the hand back and open at the stated `at`, the baton worn on it from then. The composition gives the partner, `at` and the baton. */
  export const relayOutgoing = HumanActionRow.of("relayOutgoing", relayPass, {
    role: "outgoing",
  });
}
