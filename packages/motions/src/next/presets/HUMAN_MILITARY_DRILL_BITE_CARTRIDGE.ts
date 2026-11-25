import type { IAutoMovieMotionHumanMilitaryDrill } from "@automovie/interface";

/**
 * The bite cartridge preset: the end of the cartridge brought to the mouth. The
 * `biteCartridge` row of `HumanMusketDrill` reads it, so the row and the preset
 * share one value.
 */
export const HUMAN_MILITARY_DRILL_BITE_CARTRIDGE: IAutoMovieMotionHumanMilitaryDrill.IBiteCartridgePreset =
  { target: { kind: "self", region: "mouth" }, point: "end" };
