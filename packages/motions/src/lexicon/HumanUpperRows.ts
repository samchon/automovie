import { armPhrase } from "../everyday/armPhrase";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The upper-body acts re-expressed as rows over the arm's phrases (#3361):
 * each row is `armPhrase` with its phrase, its hand and the shape of its
 * target fixed, so a gesture, a touch, a hand at rest, a hand to the face
 * and a wipe share one plan, one timing and one set of refusals, and each
 * accepts any base, carrier, side and manner the phrase law does. The rows
 * of the older laws (`gesture`, `touch`, `rest`, `handToFace`, `wipe`) stay
 * until these rows pass their verdicts; the target a touch or a wipe needs
 * is left open.
 *
 * Every offset is a share of the arm's length (upper arm, forearm and hand)
 * in the performer's frame, so a row fits any body; the shares are
 * provisional, set from each act's description with no measured source
 * read.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes, what it leaves open, the offsets' unit and their provisional status.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of `armPhrase` (`HumanActionRow`): data over one phrase law built from the vocabulary's arm phrases.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per re-expressed act and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; every place is body-relative.
 */
export namespace HumanUpperRows {
  /** The phrase law itself, for a production that states its own phrase, target and hand. */
  export const phrase = armPhrase;

  /** A wave: the open hand oscillates out and in, raised beside the head, palm forward. */
  export const waveHand = HumanActionRow.of("waveHand", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    offset: { out: 0.25, up: 0.55, forward: 0.15 },
    swing: { out: 0.1, up: 0, forward: 0 },
    cycles: 3,
    facing: { fingers: "up", palm: "forward" },
  });

  /** A raised hand: the open hand visits a place above the shoulder, palm forward, and holds it. */
  export const raiseHandHigh = HumanActionRow.of("raiseHandHigh", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    offset: { out: 0.1, up: 0.9, forward: 0.1 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  });

  /** A stop sign: the open hand held out ahead at shoulder height, palm forward. */
  export const stopHand = HumanActionRow.of("stopHand", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    offset: { out: 0, up: 0, forward: 0.8 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  });

  /** A point: the forefinger's tip visits a place on the target's line, the hand pointing. */
  export const pointAt = HumanActionRow.of("pointAt", armPhrase, {
    phrase: "visit",
    surface: "indexTip",
    shape: "point",
    hold: "beat",
  });

  /** A tap: the fingertips visit the target with no hold. */
  export const tapOn = HumanActionRow.of("tapOn", armPhrase, {
    phrase: "visit",
    surface: "indexTip",
    shape: "flat",
    hold: "none",
  });

  /** A press: the palm visits the target and holds. */
  export const pressOn = HumanActionRow.of("pressOn", armPhrase, {
    phrase: "visit",
    surface: "palm",
    shape: "flat",
    hold: "long",
  });

  /** A rub: the palm oscillates across the target. */
  export const rubOn = HumanActionRow.of("rubOn", armPhrase, {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0.05, up: 0, forward: 0 },
    cycles: 3,
  });

  /** A stroke: the palm draws down along the target. */
  export const strokeDown = HumanActionRow.of("strokeDown", armPhrase, {
    phrase: "stroke",
    surface: "palm",
    shape: "flat",
    from: { out: 0, up: 0.1, forward: 0 },
  });

  /** Hand on the hip: the palm visits the near hip and stays. */
  export const handOnHip = HumanActionRow.of("handOnHip", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    surface: "palm",
    shape: "flat",
    hold: "long",
  });

  /** Chin in hand: the fist visits the chin and stays. */
  export const chinOnFist = HumanActionRow.of("chinOnFist", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "chin" },
    surface: "fist",
    shape: "fist",
    hold: "long",
  });

  /** Wiping the mouth: the back of the hand draws across the lips. */
  export const wipeMouthAcross = HumanActionRow.of("wipeMouthAcross", armPhrase, {
    phrase: "stroke",
    target: { kind: "self", region: "mouth" },
    surface: "handBack",
    shape: "relaxed",
    from: { out: 0.08, up: 0, forward: 0 },
  });

  /** Wiping a surface: the flat palm oscillates across the target. */
  export const wipeAcross = HumanActionRow.of("wipeAcross", armPhrase, {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0.15, up: 0, forward: 0 },
    cycles: 4,
  });
}
