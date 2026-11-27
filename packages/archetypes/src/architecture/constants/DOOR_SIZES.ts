import { AutoMovieArchetypeUnits } from "../../core";
import type { AutoMovieArchetypeDoor } from "../AutoMovieArchetypeDoor";

/** One read size's figures, metres. */
type Figures = Readonly<Partial<Record<AutoMovieArchetypeDoor.Dimension, number>>>;

/**
 * A cylindrical lock's backsets, the Schlage ND's, which a lever and a knob
 * share and a sliding door's pull is set at.
 */
const BACKSETS: Readonly<Record<AutoMovieArchetypeDoor.Backset, Figures>> = {
  "2-3/8in": { backset: (2 + 3 / 8) * AutoMovieArchetypeUnits.INCH },
  "2-3/4in": { backset: (2 + 3 / 4) * AutoMovieArchetypeUnits.INCH },
};

/**
 * The door sizes read, metres, each a standard's or a maker's closed list: the
 * leaf's width and height from ANSI/SDI A250.8-2017
 * (https://steeldoor.org/wp-content/uploads/2020/02/A250_8-1.pdf) Table 1's
 * nominal sizes (2 ft 10 in and 3 ft 0 in, the widths whose clear opening meets
 * the 32 in of ADA 404.2.3; 6 ft 8 in and 7 ft 0 in), its thickness from its
 * section 1.4 (1-3/8 and 1-3/4 in), a cylindrical lock's backset from the
 * Schlage ND Series data sheet
 * (https://allegion.ca/content/dam/allegion-us-2/web-files/schlage/information-documents/Schlage_ND_Series_Data_Sheet_106486.pdf)
 * (2-3/8 or 2-3/4 in), applied to a sliding door's pull, and each Schlage ND
 * lever style's length and projection from its cut sheet
 * (https://cdn.shopify.com/s/files/1/0610/8813/7372/files/Schlage_ND_Series_Cut_Sheet.pdf?v=1717757895).
 */
export const DOOR_SIZES: Readonly<{
  width: Readonly<Record<AutoMovieArchetypeDoor.Width, Figures>>;
  height: Readonly<Record<AutoMovieArchetypeDoor.Height, Figures>>;
  thickness: Readonly<Record<AutoMovieArchetypeDoor.Thickness, Figures>>;
  backset: Readonly<
    Partial<
      Record<
        AutoMovieArchetypeDoor.Hardware | "sliding",
        Readonly<Record<AutoMovieArchetypeDoor.Backset, Figures>>
      >
    >
  >;
  lever: Readonly<
    Partial<
      Record<
        AutoMovieArchetypeDoor.Hardware | "sliding",
        Readonly<Record<AutoMovieArchetypeDoor.Lever, Figures>>
      >
    >
  >;
}> = {
  width: {
    "2ft10in": {
      width:
        2 * AutoMovieArchetypeUnits.FOOT + 10 * AutoMovieArchetypeUnits.INCH,
    },
    "3ft0in": { width: 3 * AutoMovieArchetypeUnits.FOOT },
  },
  height: {
    "6ft8in": {
      height:
        6 * AutoMovieArchetypeUnits.FOOT + 8 * AutoMovieArchetypeUnits.INCH,
    },
    "7ft0in": { height: 7 * AutoMovieArchetypeUnits.FOOT },
  },
  thickness: {
    "1-3/8in": { thickness: (1 + 3 / 8) * AutoMovieArchetypeUnits.INCH },
    "1-3/4in": { thickness: (1 + 3 / 4) * AutoMovieArchetypeUnits.INCH },
  },
  backset: { lever: BACKSETS, knob: BACKSETS, sliding: BACKSETS },
  lever: {
    lever: {
      ATH: {
        grip: (4 + 9 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 5 / 16) * AutoMovieArchetypeUnits.INCH,
      },
      BRK: {
        grip: (4 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 1 / 16) * AutoMovieArchetypeUnits.INCH,
      },
      BRW: {
        grip: (4 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 1 / 16) * AutoMovieArchetypeUnits.INCH,
      },
      LAT: {
        grip: (4 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 1 / 8) * AutoMovieArchetypeUnits.INCH,
      },
      LON: {
        grip: (4 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 1 / 8) * AutoMovieArchetypeUnits.INCH,
      },
      OME: {
        grip: (5 + 1 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 5 / 16) * AutoMovieArchetypeUnits.INCH,
      },
      RHO: {
        grip: (4 + 9 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: (2 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
      },
      SPA: {
        grip: (4 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: (3 + 1 / 2) * AutoMovieArchetypeUnits.INCH,
      },
      TLR: {
        grip: (4 + 15 / 16) * AutoMovieArchetypeUnits.INCH,
        projection: 3 * AutoMovieArchetypeUnits.INCH,
      },
    },
  },
};
