import { handToFace } from "../daily/handToFace";
import { HumanActionRow } from "../law/HumanActionRow";
import { touch } from "../touch/touch";

/**
 * Habits: the small things people do with their hands, each a row of a
 * shipped action. Register the ones a film uses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row is, the action it is a row of and what its parameters fix.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped action (`HumanActionRow`), so it is data over a law that already fits the body, refuses and is checked.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The family's rows and nothing else; a production registers the ones it uses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own; values not yet read at a source are marked provisional on the row.
 */
export namespace HumanHabit {
  /** A draw on a cigarette: pinched at the lips for a second (provisional), the head level. */
  export const smoke = HumanActionRow.of("smoke", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.25 },
        facing: "thumb",
        along: "palm",
      },
      kind: "hold",
      count: 1,
      hold: 1,
      tangent: "up",
      head: 0,
      at: "atLips",
    },
  });

  /** A photograph through a camera's viewfinder: both hands bring it to the eye. */
  export const photograph = HumanActionRow.of("photograph", handToFace, {
    task: {
      region: "noseBridge",
      other: "noseBridge",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { palm: 0.3 },
        facing: "palm",
        along: "grasp",
      },
      kind: "hold",
      count: 1,
      hold: 1.5,
      tangent: "up",
      head: 0,
      at: "atEye",
    },
  });

  /** A look at a held screen, as a phone read at the reading distance. */
  export const checkPhone = HumanActionRow.of("checkPhone", handToFace, {
    task: "read",
  });

  /** A look at a wristwatch: the right fingertips at the left wrist, held. */
  export const checkWatch = HumanActionRow.of("checkWatch", touch, {
    target: { kind: "self", region: "wristLeft" },
    with: "fingertips",
    kind: "hold",
    side: "right",
  });

  /** Lipstick or balm drawn across the lips. */
  export const applyLipstick = HumanActionRow.of("applyLipstick", handToFace, {
    task: {
      region: "mouth",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.3 },
        facing: "thumb",
        along: "palm",
      },
      kind: "rub",
      count: 2,
      hold: 0.2,
      tangent: "across",
      head: 0,
      at: "atLips",
    },
  });

  /** A shave: a razor's head rubbed up the jaw. */
  export const shave = HumanActionRow.of("shave", handToFace, {
    task: {
      region: "jawRight",
      effector: {
        surface: "grip",
        shape: "fist",
        tool: { thumb: 0.5 },
        facing: "thumb",
        along: "palm",
      },
      kind: "rub",
      count: 3,
      hold: 0.2,
      tangent: "up",
      head: 0,
      at: "atJaw",
    },
  });

  /** A rub of tired eyes with the fingertips. */
  export const rubEyes = HumanActionRow.of("rubEyes", handToFace, {
    task: {
      region: "noseBridge",
      effector: { surface: "indexTip", shape: "flat" },
      kind: "rub",
      count: 2,
      hold: 0.2,
      tangent: "across",
      head: 10,
      at: "atEyes",
    },
  });

  /** A scratch of the nape. */
  export const scratchNape = HumanActionRow.of("scratchNape", touch, {
    target: { kind: "self", region: "nape" },
    with: "fingertips",
    kind: "scratch",
  });
}
