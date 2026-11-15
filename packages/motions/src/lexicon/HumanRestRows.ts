import { rest } from "../everyday/rest";
import { HumanActionRow } from "../law/HumanActionRow";

/**
 * The rest places as rows (#3361): both hands of `rest` at one place under a name of its own, the time held left open; a production gives the two hands different places through `rest` itself.
 *
 * Each row writes no motion: its law plans it, so it fits any body, refuses and is checked as the law is, and its draws are keyed by its own name. The rows over the arm's phrases themselves are `HumanUpperRows`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each row fixes and what it leaves open.
 * @evidence contracts/development/design.md#principled-representation Each entry is a row of a shipped law (`HumanActionRow`), data over a law that already fits the body and refuses.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One row per value of the law's closed union and nothing else.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No row writes motion of its own or restates a value of the law.
 */
export namespace HumanRestRows {
  /** `rest` with both hands at `side`. */
  export const restSide = HumanActionRow.of("restSide", rest, { left: "side", right: "side" });

  /** `rest` with both hands at `pocket`. */
  export const restPocket = HumanActionRow.of("restPocket", rest, { left: "pocket", right: "pocket" });

  /** `rest` with both hands at `hip`. */
  export const restHip = HumanActionRow.of("restHip", rest, { left: "hip", right: "hip" });

  /** `rest` with both hands at `crossed`. */
  export const restCrossed = HumanActionRow.of("restCrossed", rest, { left: "crossed", right: "crossed" });

  /** `rest` with both hands at `claspedFront`. */
  export const restClaspedFront = HumanActionRow.of("restClaspedFront", rest, { left: "claspedFront", right: "claspedFront" });

  /** `rest` with both hands at `claspedBehind`. */
  export const restClaspedBehind = HumanActionRow.of("restClaspedBehind", rest, { left: "claspedBehind", right: "claspedBehind" });

  /** `rest` with both hands at `behindHead`. */
  export const restBehindHead = HumanActionRow.of("restBehindHead", rest, { left: "behindHead", right: "behindHead" });

  /** `rest` with both hands at `chinRest`. */
  export const restChinRest = HumanActionRow.of("restChinRest", rest, { left: "chinRest", right: "chinRest" });

  /** `rest` with both hands at `elbowSupport`. */
  export const restElbowSupport = HumanActionRow.of("restElbowSupport", rest, { left: "elbowSupport", right: "elbowSupport" });
}
