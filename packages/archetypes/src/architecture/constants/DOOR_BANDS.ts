import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { ADA_RANGES } from "./ADA_RANGES";
import type { AutoMovieArchetypeDoor } from "../AutoMovieArchetypeDoor";
import { DoorBandsData } from "./internal/DoorBandsData";

/*
 * The band of each free dimension of a door, by hardware and for a sliding
 * door, with the source it was read at; `AutoMovieArchetypeDoor.BANDS` is this table.
 */
export const DOOR_BANDS: Readonly<
  Record<
    AutoMovieArchetypeDoor.Hardware | "sliding",
    Readonly<Partial<Record<AutoMovieArchetypeDoor.Dimension, IAutoMovieArchetypeBand>>>
  >
> = {
  lever: {
    ...DoorBandsData.LEAF,
    swing: DoorBandsData.SWING,
    hardwareHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      ADA_RANGES.hardware.source,
    ),
    latchTurn: AutoMovieArchetypeBand.of(
      "degrees",
      45,
      78,
      "Hampton Products, PPR Levers Degree of Motion: a lever turns 45 to 78 degrees to draw the latch (https://hampton-products.zendesk.com/hc/en-us/articles/360052645693-PPR-Levers-Degree-of-Motion)",
    ),
  },
  knob: {
    ...DoorBandsData.LEAF,
    swing: DoorBandsData.SWING,
    hardwareHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      ADA_RANGES.hardware.source,
    ),
    grip: AutoMovieArchetypeBand.metres(
      (2 + 1 / 8) * AutoMovieArchetypeUnits.INCH,
      (2 + 1 / 4) * AutoMovieArchetypeUnits.INCH,
      "door knob diameters of 2-1/8 and 2-1/4 in, retailer listings seen only in search results",
      true,
    ),
    projection: AutoMovieArchetypeBand.metres(
      0.06,
      0.07,
      "door knob projection, not read at a source",
      true,
    ),
    latchTurn: AutoMovieArchetypeBand.of(
      "degrees",
      45,
      78,
      "no knob rotation was found; the lever's 45 to 78 degrees (Hampton Products, https://hampton-products.zendesk.com/hc/en-us/articles/360052645693-PPR-Levers-Degree-of-Motion) applied to the same latch",
      true,
    ),
  },
  plate: {
    ...DoorBandsData.LEAF,
    swing: DoorBandsData.SWING,
    backset: AutoMovieArchetypeBand.metres(
      0.1,
      0.15,
      "push plate and pull bar set in from the latch edge, not read at a source",
      true,
    ),
  },
  sliding: {
    ...DoorBandsData.LEAF,
    hardwareHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      ADA_RANGES.hardware.source,
    ),
  },
};
