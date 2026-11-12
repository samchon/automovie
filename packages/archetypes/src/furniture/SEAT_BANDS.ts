import { ArchetypeBand, type IArchetypeBand } from "../core";
import type { createSeat } from "./createSeat";

/** A band in metres. */
const band = (
  minimum: number,
  maximum: number,
  source: string,
  provisional?: boolean,
): IArchetypeBand =>
  ArchetypeBand.of("m", minimum, maximum, source, provisional);

/** A provisional mass band in kilograms per place. */
const mass = (minimum: number, maximum: number): IArchetypeBand =>
  ArchetypeBand.of("kg", minimum, maximum, ArchetypeBand.TYPICAL_MASS, true);

/** Seat heights of chairs and lounge chairs reviewed by Blackler et al. 2018. */
const LOUNGE: string =
  "Blackler et al. 2018, Seating in aged care, SAGE Open Medicine: an optimal chair seat height of 430 mm and lounge seat heights of 380 to 457 mm (Christenson 1990) (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957)";

/** Seat depth reviewed by Blackler et al. 2018. */
const DEPTH: string =
  "AS/NZS 4688.1:2000 effective seat depth 380 to 480 mm, as cited by Blackler et al. 2018 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957)";

/** Seat width between a recommended chair width and the office minimum. */
const WIDTH: string =
  "409 mm recommended by Kothiyal and Tettey 2001, as cited by Blackler et al. 2018 (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957), up to the 17.7 in minimum of ANSI/HFES 100-2007 p. 87 (https://uhs.berkeley.edu/sites/default/files/uc_task_chair_requirements_1.pdf)";

/** Back height between the office chair minimum and the bench back support. */
const BACK: string =
  "EN 1335-1:2020 Table 2, backrest at least 360 mm high (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf), up to the 18 in back support of 2010 ADA Standards 903.4 (https://www.access-board.gov/ada/)";

/** Fixed armrest height of an office chair, applied to upholstered arms. */
const ARMS: string =
  "EN 1335-1:2020 Table 2, fixed armrest height above the seat of type B, 225 to 275 mm (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf); Holden and Fernie 1989 give 250 mm (https://pmc.ncbi.nlm.nih.gov/articles/PMC5758957)";

/** A stool's seat diameter, for which no standard was found. */
const STOOL: string = "typical round stool seat, not read at a source";

/**
 * The band of each free dimension of a seat, by kind, with the source it was read at; `createSeat.BANDS` is this table.
 */
export const SEAT_BANDS: Readonly<
  Record<
    createSeat.Kind,
    Readonly<Partial<Record<createSeat.Dimension, IArchetypeBand>>>
  >
> = {
  dining: {
    seatHeight: band(0.43, 0.457, LOUNGE),
    seatDepth: band(0.38, 0.48, DEPTH),
    seatWidth: band(0.409, 0.45, WIDTH),
    backHeight: band(0.36, 0.455, BACK),
    mass: mass(4, 7),
  },
  office: {
    seatHeight: band(
      0.38,
      0.56,
      "ANSI/HFES 100-2007, seat height adjustable within 38 to 56 cm, as summarised by WELL v2 (https://standard.wellcertified.com/v8/node/24535); one setting of the adjustable seat",
    ),
    seatDepth: band(
      0.425,
      0.485,
      "EN 1335-1:2020 Table 2, fixed seat depth of type B, 425 to 485 mm (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf)",
    ),
    seatWidth: band(
      0.45,
      0.51,
      "ANSI/HFES 100-2007 p. 87, seat at least 17.7 in wide, as quoted by the UC task chair checklist (https://uhs.berkeley.edu/sites/default/files/uc_task_chair_requirements_1.pdf), up to EN 1335-1:2020 Table 2's 510 mm clear distance between armrests",
      true,
    ),
    backHeight: band(0.36, 0.455, BACK),
    armHeight: band(
      0.2,
      0.25,
      "EN 1335-1:2020 Table 2, fixed armrest height above the seat of type C, 200 to 250 mm (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf)",
    ),
    mass: mass(10, 20),
  },
  armchair: {
    seatHeight: band(0.38, 0.457, LOUNGE),
    seatDepth: band(0.38, 0.48, DEPTH),
    seatWidth: band(
      0.46,
      0.51,
      "EN 1335-1:2020 Table 2, clear distance between armrests 460 to 510 mm (https://www.bureaustoel.nl/wp-content/uploads/2022/01/NEN-EN-1335-1-april-2020.pdf), applied to an armchair",
      true,
    ),
    backHeight: band(0.36, 0.455, BACK),
    armHeight: band(0.225, 0.275, ARMS),
    mass: mass(15, 30),
  },
  stool: {
    seatHeight: band(0.43, 0.457, LOUNGE, true),
    seatWidth: band(0.3, 0.35, STOOL, true),
    mass: mass(2, 4),
  },
  barStool: {
    seatHeight: band(
      0.762,
      0.813,
      "a seat 10 to 12 in below the 42 in (1067 mm) bar counter of NKBA Kitchen Planning Guideline 9 (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf); the gap is trade convention, not read at a source",
      true,
    ),
    seatWidth: band(0.3, 0.35, STOOL, true),
    footrestDrop: band(
      0.43,
      0.457,
      "the chair seat height of Blackler et al. 2018 taken as the drop from seat to footrest, so the shank hangs as it does on a chair; no footrest standard was found",
      true,
    ),
    mass: mass(4, 8),
  },
  bench: {
    seatHeight: band(
      0.43,
      0.485,
      "2010 ADA Standards 903.5, bench seat 17 to 19 in above the floor (https://www.access-board.gov/ada/)",
    ),
    seatDepth: band(
      0.51,
      0.61,
      "2010 ADA Standards 903.3, bench seat 20 to 24 in deep (https://www.access-board.gov/ada/)",
    ),
    seatWidth: band(
      0.61,
      0.61,
      "NKBA Kitchen Planning Guideline 9, 24 in (610 mm) of width per seated diner (https://kb.nkba.org/uploads/2022/05/Kitchen-Planning-Guidelines.pdf), applied to a bench place",
    ),
    backHeight: band(
      0.455,
      0.455,
      "2010 ADA Standards 903.4, bench back support to 18 in above the seat (https://www.access-board.gov/ada/)",
    ),
    mass: mass(6, 12),
  },
  sofa: {
    seatHeight: band(0.38, 0.457, LOUNGE),
    seatDepth: band(
      0.5,
      0.6,
      "no standard found; the sitting depth left by an 850 mm deep settee (Approved Document M Appendix D, https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/540330/BR_PDF_AD_M1_2015_with_2016_amendments_V3.pdf) after its back",
      true,
    ),
    seatWidth: band(
      0.55,
      0.55,
      "Approved Document M Appendix D, a 3 seat settee is 550 mm longer than a 2 seat one (1850 against 1300 mm) (https://assets.publishing.service.gov.uk/government/uploads/system/uploads/attachment_data/file/540330/BR_PDF_AD_M1_2015_with_2016_amendments_V3.pdf)",
    ),
    backHeight: band(0.36, 0.455, BACK, true),
    armHeight: band(0.225, 0.275, ARMS, true),
    mass: mass(15, 25),
  },
};
