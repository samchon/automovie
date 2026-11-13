import { handToFace } from "../daily/handToFace";
import { gesture } from "../everyday/gesture";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";

/**
 * Emblems: gestures with a fixed meaning, each a row of a shipped action.
 * Register the ones a film uses (`HumanPerformance.IInput.laws`,
 * `HumanChain.extend`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanEmblem {
  /** The military hand salute (US Army TC 3-21.5): the forefinger's end at the right brow, the hand in line with the forearm, the upper arm level. */
  export const salute = HumanActionRow.of("salute", touch, {
    target: { kind: "self", region: "templeRight" },
    with: "forefinger",
    kind: "hold",
    side: "right",
    elbow: "level",
  });

  /** Hush: the forefinger upright across the lips, its middle on them and the palm turned to the other side, so the thumb's side of the finger meets the mouth and the wrist stays near straight (provisional: the hold, the fifth of a hand the tip stands above the lips, and the twentieth of a hand, the finger's half thickness, its axis stands off them). */
  export const hush = HumanActionRow.of("hush", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "indexTip",
        shape: "point",
        tool: { fingers: -0.2, thumb: 0.05 },
        facing: "thumb",
        along: "fingers",
      },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      head: 0,
      at: "atLips",
    },
  });

  /** Palms together ahead of the chest, as a prayer or a greeting (wai, gassho): the gesture's held meeting of the two palms. */
  export const palmsTogether = HumanActionRow.of("palmsTogether", gesture, {
    kind: "palmsTogether",
  });

  /** A hand on the heart: the right palm on the left chest. */
  export const handOnHeart = HumanActionRow.of("handOnHeart", touch, {
    target: { kind: "self", region: "chestLeft" },
    with: "palm",
    kind: "hold",
    side: "right",
  });

  /** A blown kiss: the fingertips to the lips, then away (provisional: the outward throw is the retraction). The hand leans half way between upright and level, the fingers pointing up and back at the mouth with the palm toward the chin, so the forearm comes from below. */
  export const blownKiss = HumanActionRow.of("blownKiss", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "indexTip",
        shape: "flat",
        facing: { fingers: 1, palm: 1 },
        along: { fingers: 1, palm: -1 },
      },
      kind: "tap",
      count: 1,
      hold: 0.2,
      tangent: "up",
      head: 0,
      at: "atLips",
    },
  });

  /** A facepalm: the palm over the face, the head bowed into it (15 degrees, provisional). */
  export const facepalm = HumanActionRow.of("facepalm", handToFace, {
    task: {
      region: "face",
      effector: { surface: "palm", shape: "flat" },
      kind: "hold",
      count: 1,
      hold: 1.2,
      tangent: "up",
      head: 15,
      at: "atFace",
    },
  });

  /** Both hands raised in surrender. */
  export const handsUp = HumanActionRow.of("handsUp", gesture, {
    kind: "cheer",
  });

  /** A stop sign: the palm held out. */
  export const halt = HumanActionRow.of("halt", gesture, { kind: "stopPalm" });

  /** A summons: the beckoning hand. */
  export const comeHere = HumanActionRow.of("comeHere", gesture, {
    kind: "beckon",
  });

  /** "I do not know": the shrug with the palms turned up. */
  export const dontKnow = HumanActionRow.of("dontKnow", gesture, {
    kind: "shrug",
  });

  /** A thumbs up: the fist held out before the shoulder, turned a quarter in its palm's plane so the straight thumb stands up. */
  export const thumbsUp = HumanActionRow.of("thumbsUp", gesture, {
    kind: "stopPalm",
    shape: "thumbUp",
    turn: 90,
  });

  /** A thumbs down: the fist ahead of the shoulder with the forearm turned over and the elbow raised outward, the straight thumb pointing down. */
  export const thumbsDown = HumanActionRow.of("thumbsDown", gesture, {
    kind: "thumbsDown",
    shape: "thumbUp",
  });

  /** The OK sign: the forefinger and thumb in a ring, held out (first pass, provisional attitude). */
  export const okSign = HumanActionRow.of("okSign", gesture, {
    kind: "stopPalm",
    shape: "ok",
  });

  /** The V sign: forefinger and middle finger spread, held out (first pass, provisional attitude). */
  export const victorySign = HumanActionRow.of("victorySign", gesture, {
    kind: "stopPalm",
    shape: "victory",
  });

  /** Crossed fingers, held out (first pass, provisional attitude). */
  export const crossedFingers = HumanActionRow.of("crossedFingers", gesture, {
    kind: "stopPalm",
    shape: "crossed",
  });

  /** Counting one on the fingers, from the forefinger on (one convention; cultures differ). */
  export const countOne = HumanActionRow.of("countOne", gesture, {
    kind: "stopPalm",
    shape: "count1",
  });

  /** Counting two on the fingers. */
  export const countTwo = HumanActionRow.of("countTwo", gesture, {
    kind: "stopPalm",
    shape: "count2",
  });

  /** Counting three on the fingers. */
  export const countThree = HumanActionRow.of("countThree", gesture, {
    kind: "stopPalm",
    shape: "count3",
  });

  /** Counting four on the fingers. */
  export const countFour = HumanActionRow.of("countFour", gesture, {
    kind: "stopPalm",
    shape: "count4",
  });

  /** Counting five on the fingers: the open hand. */
  export const countFive = HumanActionRow.of("countFive", gesture, {
    kind: "stopPalm",
    shape: "count5",
  });

  /** A shaken fist: the raised fist swung from side to side (first pass on the wave's stroke, provisional). */
  export const shakeFist = HumanActionRow.of("shakeFist", gesture, {
    kind: "wave",
    shape: "thumbUp",
  });

  /** The hand set for a finger snap: the middle fingertip on the thumb's, held out (first pass: the snap's release is not moved). */
  export const fingerSnap = HumanActionRow.of("fingerSnap", gesture, {
    kind: "stopPalm",
    shape: "snap",
  });

  /** Air quotes: both hands raised with two fingers hooked (first pass on the raised hands of a cheer; the fingers do not flex twice yet). */
  export const airQuotes = HumanActionRow.of("airQuotes", gesture, {
    kind: "cheer",
    shape: "quotes",
  });

  /** A hand over the mouth, as at a gasp or a yawn. */
  export const coverMouth = HumanActionRow.of("coverMouth", touch, {
    target: { kind: "self", region: "mouth" },
    with: "palm",
    kind: "hold",
    side: "right",
  });

  /** Both hands over the ears. */
  export const coverEars = HumanActionRow.of("coverEars", touch, {
    target: { kind: "self", region: "earRight" },
    other: { kind: "self", region: "earLeft" },
    with: "palm",
    kind: "hold",
    side: "right",
  });
}
