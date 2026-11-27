import type { AutoMovieArchetypeBoard } from "../AutoMovieArchetypeBoard";
import { AutoMovieArchetypeUnits } from "../../core";

export namespace BoardDimensions {
  /*
   * The whiteboard read.
   */
  export const GHENT_M1: string =
    "Ghent M1 Series spec sheet PSS-M1: H x W 24 x 36 7/16, 36 7/16 x 48 15/32, 36 7/16 x 60 15/32, and 48 15/32 high by 48 15/32, 60 15/32, 72 1/2, 87 29/32, 96 17/32, 120 19/32, 144 19/32 or 192 19/32 in wide, a 5/8 in deep frame and a tray projecting 3 1/8 in (https://cdn.shopify.com/s/files/1/0272/6150/1542/files/m1_spec_sheets.pdf)";

  /*
   * The whiteboard's mounting read.
   */
  export const LETHBRIDGE: string =
    'University of Lethbridge design standard: "Classroom whiteboards - base to be mounted 915mm above the floor" (https://ulethbridge.ca/node/9433)';

  /*
   * The chalkboard read.
   */
  export const CLARIDGE: string =
    "Claridge Series 8 sheet V062226: chalkboards in standard sizes (H x W) 2 x 3, 2 x 4, 3 x 4, 4 x 4, 4 x 5, 4 x 6, 4 x 8, 4 x 10, 4 x 12, 4 x 14 and 4 x 16 ft, about 1/2 in thick overall, a 1 in tray (https://claridgeproducts.com/wp-content/uploads/2023/08/Series8-sheet.pdf)";

  /*
   * The notice board read.
   */
  export const GHENT_059: string =
    "Ghent 059 Series drawing PSS-059: cork boards 3 x 5, 4 x 4, 4 x 5, 4 x 6 and 4 x 8 ft (H x W), an 11/16 in deep frame (https://www.mybinding.com/cdn/shop/files/Ghent-Premium-Aluminum-Frame-Cork-Bulletin-Board-spec-sheet.pdf)";

  /*
   * A kind's standard sizes as model records, each its height and width in
   * metres.
   * Parameter names: The kind's sizes, its default first.
   * Returns: Each size's figures, in the given order.
   */
  export function sized(
    names: readonly AutoMovieArchetypeBoard.Size[],
  ): Readonly<
    Partial<
      Record<
        AutoMovieArchetypeBoard.Size,
        Readonly<Partial<Record<AutoMovieArchetypeBoard.Dimension, number>>>
      >
    >
  > {
    return Object.fromEntries(
      names.map((name: AutoMovieArchetypeBoard.Size) => [
        name,
        {
          height: INCHES[name][0] * AutoMovieArchetypeUnits.INCH,
          width: INCHES[name][1] * AutoMovieArchetypeUnits.INCH,
        },
      ]),
    );
  }
}

/*
 * Each standard size read, height and width in inches: Ghent M1's by its own
 * figures, Claridge's and Ghent 059's by their feet.
 */
const INCHES: Readonly<
  Record<AutoMovieArchetypeBoard.Size, readonly [number, number]>
> = {
  "24x36-7/16": [24, 36 + 7 / 16],
  "36-7/16x48-15/32": [36 + 7 / 16, 48 + 15 / 32],
  "36-7/16x60-15/32": [36 + 7 / 16, 60 + 15 / 32],
  "48-15/32x48-15/32": [48 + 15 / 32, 48 + 15 / 32],
  "48-15/32x60-15/32": [48 + 15 / 32, 60 + 15 / 32],
  "48-15/32x72-1/2": [48 + 15 / 32, 72 + 1 / 2],
  "48-15/32x87-29/32": [48 + 15 / 32, 87 + 29 / 32],
  "48-15/32x96-17/32": [48 + 15 / 32, 96 + 17 / 32],
  "48-15/32x120-19/32": [48 + 15 / 32, 120 + 19 / 32],
  "48-15/32x144-19/32": [48 + 15 / 32, 144 + 19 / 32],
  "48-15/32x192-19/32": [48 + 15 / 32, 192 + 19 / 32],
  "2x3ft": [24, 36],
  "2x4ft": [24, 48],
  "3x4ft": [36, 48],
  "3x5ft": [36, 60],
  "4x4ft": [48, 48],
  "4x5ft": [48, 60],
  "4x6ft": [48, 72],
  "4x8ft": [48, 96],
  "4x10ft": [48, 120],
  "4x12ft": [48, 144],
  "4x14ft": [48, 168],
  "4x16ft": [48, 192],
};
