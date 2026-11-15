import { armPhrase } from "../everyday/armPhrase";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The upper-body acts re-expressed as rows over the arm's phrases (#3361):
 * each row is `armPhrase` with its phrase, its hand and the shape of its
 * target fixed, so a gesture, a touch, a hand at rest, a hand to the face
 * and a wipe share one plan, one timing and one set of refusals, and each
 * accepts any base, carrier, side and manner the phrase law does. The rows
 * of the older laws (`gesture`, `touch`, `rest`, `handToFace`, `wipe`) stay
 * until these rows pass their verdicts; the target a touch or a wipe needs,
 * and the prop a tool row holds (`held`), are left open.
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

  /** Hammering: the fist that holds the hammer strikes down and back on the target, up and down. */
  export const hammerStrokes = HumanActionRow.of("hammerStrokes", armPhrase, {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0.15, forward: 0 },
    cycles: 4,
  });

  /** Sawing: the fist that holds the saw draws forward and back over the target. */
  export const sawStrokes = HumanActionRow.of("sawStrokes", armPhrase, {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0, forward: 0.2 },
    cycles: 4,
  });

  /** Stirring: the fist that holds the spoon circles out and in over the pot. */
  export const stirStrokes = HumanActionRow.of("stirStrokes", armPhrase, {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0.05, up: 0, forward: 0.05 },
    cycles: 4,
  });

  /** Putting on a hat: the hand that holds it visits the crown and stays a beat. */
  export const hatOnHead = HumanActionRow.of("hatOnHead", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  });

  /** Palms up: the open hand held out ahead at waist height, palm up. */
  export const palmUp = HumanActionRow.of("palmUp", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    offset: { out: 0, up: 0.1, forward: 0.4 },
    facing: { fingers: "forward", palm: "up" },
    hold: "beat",
  });

  /** Pushing up one's glasses: the forefinger's tip visits the bridge of the nose. */
  export const glassesUp = HumanActionRow.of("glassesUp", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "noseBridge" },
    surface: "indexTip",
    shape: "point",
    hold: "none",
  });

  /** Scratching the head: the forefinger's tip oscillates on the crown. */
  export const headScratch = HumanActionRow.of("headScratch", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "crown" },
    surface: "indexTip",
    shape: "relaxed",
    swing: { out: 0, up: 0, forward: 0.03 },
    cycles: 4,
  });

  /** A hand to the cheek: the palm visits the cheek and stays a beat. */
  export const cheekInHand = HumanActionRow.of("cheekInHand", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "cheekRight" },
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  });

  /** A hand in the pocket: the fingertips visit the front pocket and stay. */
  export const handInPocket = HumanActionRow.of("handInPocket", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "pocketFrontRight" },
    surface: "indexTip",
    shape: "relaxed",
    hold: "long",
  });

  /** A hand behind the head: the palm visits the back of the head and stays. */
  export const handBehindHead = HumanActionRow.of("handBehindHead", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "headBack" },
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  });

  /** A phone to the ear: the hand that holds it visits the ear and stays. */
  export const phoneToEar = HumanActionRow.of("phoneToEar", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "earRight" },
    surface: "grip",
    shape: "fist",
    hold: "long",
  });

  /** Brushing the teeth: the hand that holds the brush oscillates before the mouth. */
  export const teethBrushing = HumanActionRow.of("teethBrushing", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    swing: { out: 0.04, up: 0, forward: 0 },
    cycles: 6,
  });

  /** Combing: the hand that holds the comb draws it back over the crown. */
  export const hairCombing = HumanActionRow.of("hairCombing", armPhrase, {
    phrase: "stroke",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    from: { out: 0, up: 0, forward: 0.1 },
  });
}
