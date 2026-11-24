/** One published clear floor figure in metres, with the clause that sets it. */
interface IClearance {
  /** Reach out from the piece's face. */
  depth: number;

  /** Length along the face, or null where the kit spans the face it serves. */
  width: number | null;

  /** The clause, quoted with its address. */
  source: string;
}

/**
 * The clear floor figures the room kits reserve, each with its source:
 *
 * - `clearFloor`: 2010 ADA Standards 305.3, a clear floor space 30 in (760 mm) by
 *   48 in (1220 mm), its 1220 mm depth reached by a forward approach (305.5);
 * - `bedSide`: 2010 ADA Standards 806.2.3, a 305 clear floor space on both sides
 *   of a bed for a parallel approach, so 760 mm out from each long side and
 *   1220 mm along it;
 * - `workAisle` and `sharedWorkAisle`: the NKBA Kitchen Planning Guidelines' work
 *   aisle (Guideline 6), at least 42 in (1067 mm) for one cook and 48 in (1219
 *   mm) for more than one, measured from the counter frontage, tall cabinets
 *   and appliances alike, spanning the run it serves.
 *
 * The kits use these as a coarse layout rule for a film set, not as an
 * accessibility or building-code compliance claim, as `furnishRoom` does for
 * its aisle.
 */
export const ROOM_CLEARANCES: Readonly<
  Record<"clearFloor" | "bedSide" | "workAisle" | "sharedWorkAisle", IClearance>
> = {
  clearFloor: {
    depth: 1.22,
    width: 0.76,
    source:
      "2010 ADA Standards 305.3, clear floor space 30 inches (760 mm) minimum by 48 inches (1220 mm) minimum, and 305.5, forward approach (https://www.access-board.gov/ada/chapter/ch03/)",
  },
  bedSide: {
    depth: 0.76,
    width: 1.22,
    source:
      "2010 ADA Standards 806.2.3, a clear floor space complying with 305 on both sides of a bed, positioned for parallel approach to the side of the bed (https://www.access-board.gov/ada/chapter/ch08/)",
  },
  workAisle: {
    depth: 1.067,
    width: null,
    source:
      "NKBA Kitchen Planning Guidelines, Guideline 6, work aisle at least 42 inches (1067 mm) wide for one cook, measured between the counter frontage, tall cabinets and/or appliances (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf)",
  },
  sharedWorkAisle: {
    depth: 1.219,
    width: null,
    source:
      "NKBA Kitchen Planning Guidelines, Guideline 6, work aisle at least 48 inches (1219 mm) wide for more than one cook, measured between the counter frontage, tall cabinets and/or appliances (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf)",
  },
};
