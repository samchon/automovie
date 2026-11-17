import type { IAutoMovieMotionHumanActionLaw, IAutoMovieMotionHumanLexiconParams } from "@automovie/interface";

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
 * A row is written for the right hand: the region of a side it fixes
 * (`hipRight`) is read on the acting hand's own side (`mirror`), so the same
 * row puts the left hand on the left hip.
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
  export const waveHand: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["waveHand"]> = HumanActionRow.of("waveHand", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0.25, up: 0.55, forward: 0.15 },
    swing: { out: 0.1, up: 0, forward: 0 },
    cycles: 3,
    facing: { fingers: "up", palm: "forward" },
  });

  /** A raised hand: the open hand visits a place above the shoulder, palm forward, and holds it. */
  export const raiseHandHigh: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["raiseHandHigh"]> = HumanActionRow.of("raiseHandHigh", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0.1, up: 0.9, forward: 0.1 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  });

  /** A stop sign: the open hand held out ahead at shoulder height, palm forward. */
  export const stopHand: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["stopHand"]> = HumanActionRow.of("stopHand", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0, up: 0, forward: 0.8 },
    facing: { fingers: "up", palm: "forward" },
    hold: "long",
  });

  /** A point: the forefinger's tip visits a place on the target's line, the hand pointing. */
  export const pointAt: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["pointAt"]> = HumanActionRow.of("pointAt", armPhrase, {
    phrase: "visit",
    surface: "indexTip",
    shape: "point",
    hold: "beat",
  });

  /** A tap: the fingertips visit the target with no hold. */
  export const tapOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["tapOn"]> = HumanActionRow.of("tapOn", armPhrase, {
    phrase: "visit",
    surface: "indexTip",
    shape: "flat",
    hold: "none",
  });

  /** A press: the palm visits the target and holds. */
  export const pressOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["pressOn"]> = HumanActionRow.of("pressOn", armPhrase, {
    phrase: "visit",
    surface: "palm",
    shape: "flat",
    hold: "long",
  });

  /** A rub: the palm oscillates across the target. */
  export const rubOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["rubOn"]> = HumanActionRow.of("rubOn", armPhrase, {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0.05, up: 0, forward: 0 },
    cycles: 3,
  });

  /** A stroke: the palm draws down along the target. */
  export const strokeDown: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["strokeDown"]> = HumanActionRow.of("strokeDown", armPhrase, {
    phrase: "stroke",
    surface: "palm",
    shape: "flat",
    from: { out: 0, up: 0.1, forward: 0 },
  });

  /** Hand on the hip: the palm visits the near hip and stays. */
  export const handOnHip: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handOnHip"]> = HumanActionRow.of("handOnHip", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    surface: "palm",
    shape: "flat",
    hold: "long",
  });

  /** Chin in hand: the fist visits the chin and stays. */
  export const chinOnFist: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["chinOnFist"]> = HumanActionRow.of("chinOnFist", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "chin" },
    surface: "fist",
    shape: "fist",
    hold: "long",
  });

  /** Wiping the mouth: the back of the hand draws across the lips. */
  export const wipeMouthAcross: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["wipeMouthAcross"]> = HumanActionRow.of(
    "wipeMouthAcross",
    armPhrase,
    {
      phrase: "stroke",
      target: { kind: "self", region: "mouth" },
      surface: "handBack",
      shape: "relaxed",
      from: { out: 0.08, up: 0, forward: 0 },
    },
  );

  /** Wiping a surface: the flat palm oscillates across the target. */
  export const wipeAcross: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["wipeAcross"]> = HumanActionRow.of("wipeAcross", armPhrase, {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0.15, up: 0, forward: 0 },
    cycles: 4,
  });

  /** Hammering: the fist that holds the hammer strikes down and back on the target, up and down. */
  export const hammerStrokes: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["hammerStrokes"]> = HumanActionRow.of("hammerStrokes", armPhrase, {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0.15, forward: 0 },
    cycles: 4,
  });

  /** Sawing: the fist that holds the saw draws forward and back over the target. */
  export const sawStrokes: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["sawStrokes"]> = HumanActionRow.of("sawStrokes", armPhrase, {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0, up: 0, forward: 0.2 },
    cycles: 4,
  });

  /** Stirring: the fist that holds the spoon circles out and in over the pot. */
  export const stirStrokes: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["stirStrokes"]> = HumanActionRow.of("stirStrokes", armPhrase, {
    phrase: "oscillate",
    surface: "grip",
    shape: "fist",
    swing: { out: 0.05, up: 0, forward: 0.05 },
    cycles: 4,
  });

  /** Putting on a hat: the hand that holds it visits the crown and stays a beat. */
  export const hatOnHead: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["hatOnHead"]> = HumanActionRow.of("hatOnHead", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  });

  /** Palms up: the open hand held out ahead at waist height, palm up. */
  export const palmUp: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["palmUp"]> = HumanActionRow.of("palmUp", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    offset: { out: 0, up: 0.1, forward: 0.4 },
    facing: { fingers: "forward", palm: "up" },
    hold: "beat",
  });

  /** Pushing up one's glasses: the forefinger's tip visits the bridge of the nose. */
  export const glassesUp: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["glassesUp"]> = HumanActionRow.of("glassesUp", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "noseBridge" },
    surface: "indexTip",
    shape: "point",
    hold: "none",
  });

  /** Scratching the head: the forefinger's tip oscillates on the crown. */
  export const headScratch: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["headScratch"]> = HumanActionRow.of("headScratch", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "crown" },
    surface: "indexTip",
    shape: "relaxed",
    swing: { out: 0, up: 0, forward: 0.03 },
    cycles: 4,
  });

  /** A hand to the cheek: the palm visits the cheek and stays a beat. */
  export const cheekInHand: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["cheekInHand"]> = HumanActionRow.of("cheekInHand", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "cheekRight" },
    mirror: true,
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  });

  /** A hand in the pocket: the fingertips visit the front pocket and stay. */
  export const handInPocket: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handInPocket"]> = HumanActionRow.of("handInPocket", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "pocketFrontRight" },
    mirror: true,
    surface: "indexTip",
    shape: "relaxed",
    hold: "long",
  });

  /** A hand behind the head: the palm visits the back of the head and stays. */
  export const handBehindHead: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handBehindHead"]> = HumanActionRow.of("handBehindHead", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "headBack" },
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  });

  /** A phone to the ear: the hand that holds it visits the ear and stays. */
  export const phoneToEar: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["phoneToEar"]> = HumanActionRow.of("phoneToEar", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "earRight" },
    mirror: true,
    surface: "grip",
    shape: "fist",
    hold: "long",
  });

  /** Brushing the teeth: the hand that holds the brush oscillates before the mouth. */
  export const teethBrushing: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["teethBrushing"]> = HumanActionRow.of("teethBrushing", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    swing: { out: 0.04, up: 0, forward: 0 },
    cycles: 6,
  });

  /** Combing: the hand that holds the comb draws it back over the crown. */
  export const hairCombing: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["hairCombing"]> = HumanActionRow.of("hairCombing", armPhrase, {
    phrase: "stroke",
    target: { kind: "self", region: "crown" },
    surface: "grip",
    shape: "fist",
    from: { out: 0, up: 0, forward: 0.1 },
  });

  /** Clapping: both palms meet ahead of the chest and part, out and in. */
  export const clapHands: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["clapHands"]> = HumanActionRow.of("clapHands", armPhrase, {
    phrase: "oscillate",
    side: "both",
    target: { kind: "self", region: "sternum" },
    offset: { out: 0, up: 0, forward: 0.35 },
    swing: { out: 0.08, up: 0, forward: 0 },
    cycles: 3,
    facing: { fingers: "up", palm: "in" },
  });

  /** Rubbing the hands: both palms together ahead of the chest, sliding up and down. */
  export const rubPalms: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["rubPalms"]> = HumanActionRow.of("rubPalms", armPhrase, {
    phrase: "oscillate",
    side: "both",
    target: { kind: "self", region: "sternum" },
    offset: { out: 0, up: -0.1, forward: 0.3 },
    swing: { out: 0, up: 0.04, forward: 0 },
    cycles: 4,
    facing: { fingers: "up", palm: "in" },
  });

  /** Hands clasped in front: both palms meet before the abdomen and stay. */
  export const handsTogetherFront: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handsTogetherFront"]> = HumanActionRow.of(
    "handsTogetherFront",
    armPhrase,
    {
      phrase: "visit",
      side: "both",
      target: { kind: "self", region: "abdomen" },
      offset: { out: 0, up: 0, forward: 0.15 },
      facing: { fingers: "forward", palm: "in" },
      hold: "long",
    },
  );

  /** A cheer: both open hands visit places above and beside the head, palms forward, for a beat. */
  export const cheerHands: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["cheerHands"]> = HumanActionRow.of("cheerHands", armPhrase, {
    phrase: "visit",
    side: "both",
    target: { kind: "self", region: "crown" },
    offset: { out: 0.3, up: 0.25, forward: 0.05 },
    facing: { fingers: "up", palm: "forward" },
    hold: "beat",
  });

  /** A beckon: the open hand held out ahead, palm up, draws in toward the chest and out again. */
  export const beckonHand: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["beckonHand"]> = HumanActionRow.of("beckonHand", armPhrase, {
    phrase: "oscillate",
    target: { kind: "self", region: "shoulderRight" },
    mirror: true,
    offset: { out: 0, up: -0.2, forward: 0.5 },
    swing: { out: 0, up: 0, forward: 0.08 },
    cycles: 3,
    facing: { fingers: "forward", palm: "up" },
  });

  /** Folding the arms: each hand visits the far arm before the chest, the forearms folded, and stays (the phrase that reaches `HumanStance.armsCrossed`, which holds the rest itself). */
  export const foldArms: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["foldArms"]> = HumanActionRow.of("foldArms", armPhrase, {
    phrase: "visit",
    side: "both",
    target: { kind: "self", region: "solarPlexus" },
    offset: { out: -0.25, up: 0.05, forward: 0.12 },
    shape: "relaxed",
    facing: { fingers: "in", palm: "back" },
    hold: "long",
  });

  /** Hands clasped behind: both palms meet behind the lower back and stay. */
  export const handsClaspedBehind: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["handsClaspedBehind"]> = HumanActionRow.of(
    "handsClaspedBehind",
    armPhrase,
    {
      phrase: "visit",
      side: "both",
      target: { kind: "self", region: "lowerBack" },
      offset: { out: 0, up: -0.05, forward: -0.08 },
      facing: { fingers: "down", palm: "in" },
      hold: "long",
    },
  );

  /** An arm at rest at the side: the relaxed hand visits a place beside the thigh, palm in, and stays. */
  export const armAtSide: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["armAtSide"]> = HumanActionRow.of("armAtSide", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "hipRight" },
    mirror: true,
    offset: { out: 0.12, up: -0.1, forward: 0 },
    shape: "relaxed",
    facing: { fingers: "down", palm: "in" },
    hold: "long",
  });

  /** A pat: the flat palm bounces on the target, up and down. */
  export const patOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["patOn"]> = HumanActionRow.of("patOn", armPhrase, {
    phrase: "oscillate",
    surface: "palm",
    shape: "flat",
    swing: { out: 0, up: 0.05, forward: 0 },
    cycles: 3,
  });

  /** A squeeze: the hand closes on the target and holds. */
  export const squeezeOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["squeezeOn"]> = HumanActionRow.of("squeezeOn", armPhrase, {
    phrase: "visit",
    surface: "grip",
    shape: "fist",
    hold: "long",
  });

  /** A hold: the relaxed palm rests on the target and stays. */
  export const holdOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["holdOn"]> = HumanActionRow.of("holdOn", armPhrase, {
    phrase: "visit",
    surface: "palm",
    shape: "relaxed",
    hold: "long",
  });

  /** Drinking: the hand that holds a vessel brings its lip to the mouth and holds it there; the vessel is named as `held`. */
  export const drinkFrom: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["drinkFrom"]> = HumanActionRow.of("drinkFrom", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    point: "lip",
    hold: "long",
  });

  /** Eating: the hand that holds a utensil brings the point it names (a fork's `face`) to the mouth for a beat; the utensil is named as `held`. */
  export const eatWith: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["eatWith"]> = HumanActionRow.of("eatWith", armPhrase, {
    phrase: "visit",
    target: { kind: "self", region: "mouth" },
    surface: "grip",
    shape: "fist",
    hold: "beat",
  });

  /** A scratch: the fingertips oscillate in short strokes on the target. */
  export const scratchOn: IAutoMovieMotionHumanActionLaw<IAutoMovieMotionHumanLexiconParams["upperPhrase"]["scratchOn"]> = HumanActionRow.of("scratchOn", armPhrase, {
    phrase: "oscillate",
    surface: "indexTip",
    shape: "relaxed",
    swing: { out: 0, up: 0.02, forward: 0 },
    cycles: 5,
  });
}
