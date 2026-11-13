import { approach } from "../everyday/approach";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * Travel relative to another person, each a row of `approach`: the
 * composition gives the person as the target. Register the ones a film
 * uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanPursuit {
  /** Come up behind a person at the social distance, as a follower closes the gap. */
  export const follow = HumanActionRow.of("follow", approach, {
    side: "behind",
    at: "social",
  });

  /** Come to a person's left side at the personal distance, as an escort takes station. */
  export const escort = HumanActionRow.of("escort", approach, {
    side: "left",
    at: "personal",
  });

  /** Close on a person fast, to arm's length, as a chase ends. */
  export const chase = HumanActionRow.of("chase", approach, {
    pace: "fast",
    at: "handing",
  });

  /** Step up face to face, as a confrontation begins. */
  export const confront = HumanActionRow.of("confront", approach, {
    side: "front",
    at: "faceToFace",
  });
}
