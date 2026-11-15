import { ArchetypeUnits, ArchetypeBand, type IArchetypeBand } from "../core";
import type { createBoat } from "./createBoat";

/** Fixed-seat rowboats read at their designers' pages. */
const ROWBOAT: string =
  "the Selway-Fisher 14 ft Thames skiff (14 ft x 4 ft 2 in, depth 1 ft 6 in, 85 lb; https://selway-fisher.com/Rowskiffs.htm), the Duckworks 15 ft 6 in Whitehall skiff (beam 4 ft 5.5 in, depth 1 ft 6.5 in, draft 7 in, 95 lb; https://duckworks.com/15-6-whitehall-skiff) and the Glen-L 17 ft Whitehall (16 ft 11 in x 4 ft 6 in, depth amidships 1 ft 10 in, 350 lb; https://www.glen-l.com/17-Whitehall-traditional-rowing-craft/products/190/)";

/** A dory skiff's draft. */
const DORY: string =
  "the Echo Bay dory skiff, draft 5 in (https://clint-chase.squarespace.com/echo-bay-dory-skiff-row)";

/** Oars read at their maker's page. */
const OARS: string =
  "Fyne Boat Kits standard oars, blades 112 x 540 mm to 115 x 600 mm (https://fyneboatkits.co.uk/accessories/oars/oars-standard)";

/** Tandem canoes read at their makers' pages. */
const CANOE: string =
  "the Nova Craft Prospector 16 (16 ft, 36 in, centre depth 15 in, ends 23 in, 44 to 64 lb; https://novacraft.com/?p=3460), the Old Town Discovery 169 (16 ft 9 in, 37 in, 15 in, bow 23 in, 91 lb; https://kayaksandpaddles.co.uk/canoes/old-town-discovery-169), and the Wenonah Spirit II (17 ft, gunwale 35 in, centre depth 14 in, bow 22 in, 36.5 to 58 lb; https://wenonah.com/products/spirit-ii) and Minnesota II (18 ft 6 in, gunwale 33.5 in, centre depth 13.5 in, bow 20.5 in; https://wenonah.com/products/minnesota-ii)";

/** A Navy pulling boat for a landing party. */
const LAUNCH: string =
  "the Peake boat, Woolwich Dockyard: 30 ft extreme, 8 ft 9 in beam, 3 ft 6 in deep, five thwarts 28 in apart and 7 in below the gunwale, ten oars double-banked, 38 cwt (A. A. Ackerman, 'Navy Boats', USNI Proceedings, June 1890; https://www.usni.org/magazines/proceedings/1890/june/navy-boats)";

/**
 * The band of each free dimension of a boat, by kind, with the source it was read at; `createBoat.BANDS` is this table.
 */
export const BOAT_BANDS: Readonly<
  Record<
    createBoat.Kind,
    Readonly<Partial<Record<createBoat.Dimension, IArchetypeBand>>>
  >
> = {
  rowboat: {
    length: ArchetypeBand.metres(168 * ArchetypeUnits.INCH, 203 * ArchetypeUnits.INCH, ROWBOAT),
    beam: ArchetypeBand.metres(50 * ArchetypeUnits.INCH, 54 * ArchetypeUnits.INCH, ROWBOAT),
    depth: ArchetypeBand.metres(18 * ArchetypeUnits.INCH, 22 * ArchetypeUnits.INCH, ROWBOAT),
    draft: ArchetypeBand.metres(5 * ArchetypeUnits.INCH, 7 * ArchetypeUnits.INCH, `${DORY}; ${ROWBOAT}`),
    bladeLength: ArchetypeBand.metres(0.54, 0.6, OARS),
    bladeWidth: ArchetypeBand.metres(0.112, 0.115, OARS),
    mass: ArchetypeBand.of("kg", 85 * ArchetypeUnits.POUND, 350 * ArchetypeUnits.POUND, ROWBOAT),
  },
  canoe: {
    length: ArchetypeBand.metres(192 * ArchetypeUnits.INCH, 222 * ArchetypeUnits.INCH, CANOE),
    beam: ArchetypeBand.metres(33.5 * ArchetypeUnits.INCH, 37 * ArchetypeUnits.INCH, CANOE),
    depth: ArchetypeBand.metres(13.5 * ArchetypeUnits.INCH, 15 * ArchetypeUnits.INCH, CANOE),
    endHeight: ArchetypeBand.metres(20.5 * ArchetypeUnits.INCH, 23 * ArchetypeUnits.INCH, CANOE),
    seatHeight: ArchetypeBand.metres(
      7 * ArchetypeUnits.INCH,
      9 * ArchetypeUnits.INCH,
      "Clipper Canoes, seats 7 to 9 in off the hull bottom (https://www.clippercanoes.com/pages/canoe-design)",
    ),
    mass: ArchetypeBand.of("kg", 36.5 * ArchetypeUnits.POUND, 91 * ArchetypeUnits.POUND, CANOE),
  },
  launch: {
    length: ArchetypeBand.metres(360 * ArchetypeUnits.INCH, 360 * ArchetypeUnits.INCH, LAUNCH),
    beam: ArchetypeBand.metres(105 * ArchetypeUnits.INCH, 105 * ArchetypeUnits.INCH, LAUNCH),
    depth: ArchetypeBand.metres(42 * ArchetypeUnits.INCH, 42 * ArchetypeUnits.INCH, LAUNCH),
    mass: ArchetypeBand.of(
      "kg",
      (38 * 112) * ArchetypeUnits.POUND,
      (38 * 112) * ArchetypeUnits.POUND,
      `${LAUNCH}; a hundredweight is 112 lb`,
    ),
  },
};
