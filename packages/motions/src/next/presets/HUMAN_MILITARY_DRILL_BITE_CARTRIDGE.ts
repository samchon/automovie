import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The bite cartridge preset: the end of the cartridge brought to the mouth. The
 * `biteCartridge` row of `HumanMusketDrill` reads it, so the row and the preset
 * share one value.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the members the preset fixes with their values and which row reads it.
 * @evidence contracts/development/design.md#principled-representation The law's own members as one `IAutoMovieMotionHumanMilitaryDrill.IBiteCartridgePreset`, so the row fits the body as the law does.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Re-exported as `AutoMovieMotionHumanMilitaryDrill.BITE_CARTRIDGE`; the row reads it.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts None: the row and the preset share one value instead of two copies.
 */
export const HUMAN_MILITARY_DRILL_BITE_CARTRIDGE: IAutoMovieMotionHumanMilitaryDrill.IBiteCartridgePreset =
  { target: { kind: "self", region: "mouth" }, point: "end" };
