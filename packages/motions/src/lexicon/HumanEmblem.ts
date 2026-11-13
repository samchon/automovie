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

  /** Hush: the forefinger upright across the lips (the hold is provisional). */
  export const hush = HumanActionRow.of("hush", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "indexTip",
        shape: "point",
        facing: "palm",
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

  /** Palms together at the chest, as a prayer or a greeting (wai, gassho). */
  export const palmsTogether = HumanActionRow.of("palmsTogether", touch, {
    target: { kind: "self", region: "sternum" },
    other: { kind: "self", region: "sternum" },
    with: "palm",
    kind: "hold",
  });

  /** A hand on the heart: the right palm on the left chest. */
  export const handOnHeart = HumanActionRow.of("handOnHeart", touch, {
    target: { kind: "self", region: "chestLeft" },
    with: "palm",
    kind: "hold",
    side: "right",
  });

  /** A blown kiss: the fingertips to the lips, then away (provisional: the outward throw is the retraction). */
  export const blownKiss = HumanActionRow.of("blownKiss", handToFace, {
    task: {
      region: "mouth",
      effector: { surface: "indexTip", shape: "flat" },
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
}
