import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createDoor } from "./createDoor";

/** The steel door standard's nominal sizes and hardware locations. */
const SDI: string =
  "ANSI/SDI A250.8-2017 (https://steeldoor.org/wp-content/uploads/2020/02/A250_8-1.pdf)";

/** The accessibility standard's door clauses. */
const ADA: string =
  "2010 ADA Standards (https://www.access-board.gov/ada/chapter/ch04/)";

/** A cylindrical lock maker's data and cut sheets. */
const LOCK: string =
  "Schlage ND Series data sheet (https://allegion.ca/content/dam/allegion-us-2/web-files/schlage/information-documents/Schlage_ND_Series_Data_Sheet_106486.pdf) and cut sheet (https://cdn.shopify.com/s/files/1/0610/8813/7372/files/Schlage_ND_Series_Cut_Sheet.pdf?v=1717757895)";

/** The bands every door shares. */
const LEAF: Readonly<Partial<Record<createDoor.Dimension, IArchetypeBand>>> = {
  width: ArchetypeBand.metres(
    0.864,
    0.914,
    `${SDI} Table 1, nominal widths 2 ft 10 in and 3 ft 0 in, the sizes whose clear opening meets the 32 in of ${ADA} 404.2.3`,
  ),
  height: ArchetypeBand.metres(
    2.032,
    2.134,
    `${SDI} Table 1, nominal heights 6 ft 8 in and 7 ft 0 in`,
  ),
  thickness: ArchetypeBand.metres(
    0.0349,
    0.0445,
    `${SDI} section 1.4, 1-3/8 and 1-3/4 in doors`,
  ),
  force: ArchetypeBand.of(
    "N",
    11,
    22.2,
    `${ADA} 404.2.9, interior hinged and sliding doors open with at most 5 lbf (22.2 N); the lower end is half of it, an estimate`,
    true,
  ),
  mass: ArchetypeBand.of("kg", 25, 45, ArchetypeBand.TYPICAL_MASS, true),
};

/** The bands of a hinged door's swing. */
const SWING: IArchetypeBand = ArchetypeBand.of(
  "degrees",
  90,
  90,
  `${ADA} 404.2.3 measures the clear width with the door open 90 degrees; no greater opening was found at a source`,
  true,
);

/**
 * The band of each free dimension of a door, by hardware and for a sliding door, with the source it was read at; `createDoor.BANDS` is this table.
 */
export const DOOR_BANDS: Readonly<
  Record<
    createDoor.Hardware | "sliding",
    Readonly<Partial<Record<createDoor.Dimension, IArchetypeBand>>>
  >
> = {
  lever: {
    ...LEAF,
    swing: SWING,
    hardwareHeight: ArchetypeBand.metres(
      0.865,
      1.22,
      `${ADA} 404.2.7, hardware 34 to 48 in above the floor`,
    ),
    backset: ArchetypeBand.metres(
      0.06,
      0.07,
      `${LOCK}: backset 2-3/8 or 2-3/4 in`,
    ),
    grip: ArchetypeBand.metres(
      0.114,
      0.129,
      `${LOCK}: lever length 4-1/2 to 5-1/16 in`,
    ),
    projection: ArchetypeBand.metres(
      0.075,
      0.084,
      `${LOCK}: lever projection 2-15/16 to 3-5/16 in`,
    ),
    latchTurn: ArchetypeBand.of(
      "degrees",
      45,
      78,
      "Hampton Products, PPR Levers Degree of Motion: a lever turns 45 to 78 degrees to draw the latch (https://hampton-products.zendesk.com/hc/en-us/articles/360052645693-PPR-Levers-Degree-of-Motion)",
    ),
  },
  knob: {
    ...LEAF,
    swing: SWING,
    hardwareHeight: ArchetypeBand.metres(
      0.865,
      1.22,
      `${ADA} 404.2.7, hardware 34 to 48 in above the floor`,
    ),
    backset: ArchetypeBand.metres(
      0.06,
      0.07,
      `${LOCK}: backset 2-3/8 or 2-3/4 in`,
    ),
    grip: ArchetypeBand.metres(
      0.054,
      0.057,
      "door knob diameters of 2-1/8 and 2-1/4 in, retailer listings seen only in search results",
      true,
    ),
    projection: ArchetypeBand.metres(
      0.06,
      0.07,
      "door knob projection, not read at a source",
      true,
    ),
    latchTurn: ArchetypeBand.of(
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
    backset: ArchetypeBand.metres(
      0.1,
      0.15,
      "push plate and pull bar set in from the latch edge, not read at a source",
      true,
    ),
  },
  sliding: {
    ...LEAF,
    hardwareHeight: ArchetypeBand.metres(
      0.865,
      1.22,
      `${ADA} 404.2.7, hardware 34 to 48 in above the floor`,
    ),
    backset: ArchetypeBand.metres(
      0.06,
      0.07,
      `${LOCK}: backset 2-3/8 or 2-3/4 in, applied to a sliding door's pull`,
      true,
    ),
  },
};
