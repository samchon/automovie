import {
  AutoMovieArchetypeBand,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../../core";
import { ADA_RANGES } from "./ADA_RANGES";
import type { AutoMovieArchetypeDoor } from "../AutoMovieArchetypeDoor";

/** The accessibility standard's door clauses. */
const ADA: string =
  "2010 ADA Standards (https://www.access-board.gov/ada/chapter/ch04/)";

/** The bands every door shares. */
const LEAF: Readonly<
  Partial<Record<AutoMovieArchetypeDoor.Dimension, IAutoMovieArchetypeBand>>
> = {
  force: AutoMovieArchetypeBand.of(
    "N",
    11,
    22.2,
    `${ADA} 404.2.9, interior hinged and sliding doors open with at most 5 lbf (22.2 N); the lower end is half of it, an estimate`,
    true,
  ),
  mass: AutoMovieArchetypeBand.of(
    "kg",
    25,
    45,
    AutoMovieArchetypeBand.TYPICAL_MASS,
    true,
  ),
};

/** The bands of a hinged door's swing. */
const SWING: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
  "degrees",
  90,
  90,
  `${ADA} 404.2.3 measures the clear width with the door open 90 degrees; no greater opening was found at a source`,
  true,
);

/**
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
    ...LEAF,
    swing: SWING,
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
    ...LEAF,
    swing: SWING,
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
    ...LEAF,
    swing: SWING,
    backset: AutoMovieArchetypeBand.metres(
      0.1,
      0.15,
      "push plate and pull bar set in from the latch edge, not read at a source",
      true,
    ),
  },
  sliding: {
    ...LEAF,
    hardwareHeight: AutoMovieArchetypeBand.metres(
      ADA_RANGES.hardware.low,
      ADA_RANGES.hardware.high,
      ADA_RANGES.hardware.source,
    ),
  },
};
