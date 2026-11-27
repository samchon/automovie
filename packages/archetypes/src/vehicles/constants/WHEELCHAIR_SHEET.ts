import type { AutoMovieArchetypeWheelchair } from "../AutoMovieArchetypeWheelchair";

/*
 * The maker's sheet `createWheelchair`'s models are read at, row by row, kept
 * apart from the producer so each file stays within its size.
 */
export namespace WHEELCHAIR_SHEET {
  /*
   * The sheet the models are read at.
   */
  export const SOURCE: string =
    "Karma Medical 2025 global manual wheelchair specification, pp. 66-67 (https://www.karmamedical.com/wp-content/uploads/2021/05/2025-Karma-Medical-Global-Manual-Wheelchair-Specification.pdf)";

  /*
   * One series' row of the sheet on one wheel size: the figures every seat
   * width shares, millimetres and degrees, and by seat width its overall width
   * and total mass; a 14-inch Ergo row is printed for 6-inch and 7-inch
   * casters, its front-edge height, overall height and masses paired 6-inch
   * first.
   */
  export interface IRow {
    /*
     * The series' name, the start of each model's name.
     */
    series: string;

    /*
     * The caster's size, inches.
     */
    caster: number;

    /*
     * The seat's depth, millimetres.
     */
    depth: number;

    /*
     * The seat's front edge above the floor, millimetres.
     */
    edge: number;

    /*
     * The back's height, millimetres.
     */
    back: number;

    /*
     * The back's angle, degrees.
     */
    angle: number;

    /*
     * The armrest's height, millimetres.
     */
    arm: number;

    /*
     * The footrest to seat distance, its least and greatest, millimetres.
     */
    foot: readonly [number, number];

    /*
     * The overall length with the legrest, its least and greatest, millimetres;
     * equal ends where the row gives one length.
     */
    length: readonly [number, number];

    /*
     * The overall height, millimetres.
     */
    height: number;

    /*
     * By seat width, millimetres: the seat width, the overall width and the
     * total mass in kilograms.
     */
    widths: readonly (readonly [number, number, number])[];
  }

  /*
   * The sheet's rows, pp. 66-67: seat width, overall width and total mass by
   * width. The S-Ergo 125's wide rows (seats of 440 and 500 mm) are printed
   * again under the S-Ergo 115 on p. 68, so the sheet contradicts itself on
   * which model has them; they are left out and the conflict recorded.
   */
  export const ROWS: Readonly<Record<AutoMovieArchetypeWheelchair.Kind, readonly IRow[]>> =
    {
      selfPropelled: [
        {
          series: "ergo3",
          caster: 7,
          depth: 435,
          edge: 485,
          back: 435,
          angle: 20,
          arm: 220,
          foot: [385, 460],
          length: [1010, 1030],
          height: 935,
          widths: [
            [410, 595, 14.0],
            [460, 645, 14.3],
            [510, 695, 14.6],
          ],
        },
        {
          series: "ergo2",
          caster: 7,
          depth: 435,
          edge: 485,
          back: 435,
          angle: 20,
          arm: 220,
          foot: [385, 460],
          length: [1010, 1030],
          height: 935,
          widths: [
            [410, 595, 13.7],
            [460, 645, 14.0],
            [510, 695, 14.3],
          ],
        },
        {
          series: "sErgo125",
          caster: 7,
          depth: 430,
          edge: 495,
          back: 430,
          angle: 12,
          arm: 230,
          foot: [335, 415],
          length: [1000, 1000],
          height: 910,
          widths: [
            [400, 580, 14.6],
            [450, 630, 14.8],
            [500, 680, 15.0],
          ],
        },
        {
          series: "sErgo115",
          caster: 7,
          depth: 420,
          edge: 495,
          back: 430,
          angle: 12,
          arm: 220,
          foot: [355, 430],
          length: [1000, 1000],
          height: 910,
          widths: [
            [400, 580, 13.6],
            [450, 630, 13.8],
            [500, 680, 14.0],
          ],
        },
      ],
      transport: [
        {
          series: "ergo3",
          caster: 6,
          depth: 435,
          edge: 435,
          back: 435,
          angle: 20,
          arm: 220,
          foot: [385, 460],
          length: [1010, 1030],
          height: 885,
          widths: [
            [410, 575, 12.1],
            [460, 625, 12.4],
            [510, 675, 12.7],
          ],
        },
        {
          series: "ergo3",
          caster: 7,
          depth: 435,
          edge: 485,
          back: 435,
          angle: 20,
          arm: 220,
          foot: [385, 460],
          length: [1010, 1030],
          height: 935,
          widths: [
            [410, 575, 12.5],
            [460, 625, 12.8],
            [510, 675, 13.1],
          ],
        },
        {
          series: "ergo2",
          caster: 6,
          depth: 435,
          edge: 435,
          back: 435,
          angle: 20,
          arm: 220,
          foot: [385, 460],
          length: [1010, 1030],
          height: 885,
          widths: [
            [410, 575, 11.8],
            [460, 625, 12.1],
            [510, 675, 12.4],
          ],
        },
        {
          series: "ergo2",
          caster: 7,
          depth: 435,
          edge: 485,
          back: 435,
          angle: 20,
          arm: 220,
          foot: [385, 460],
          length: [1010, 1030],
          height: 935,
          widths: [
            [410, 575, 12.2],
            [460, 625, 12.5],
            [510, 675, 12.8],
          ],
        },
        {
          series: "sErgo125",
          caster: 7,
          depth: 430,
          edge: 500,
          back: 430,
          angle: 12,
          arm: 230,
          foot: [335, 415],
          length: [1010, 1010],
          height: 905,
          widths: [
            [400, 575, 12.9],
            [450, 625, 13.1],
            [500, 675, 13.3],
          ],
        },
        {
          series: "sErgo115",
          caster: 7,
          depth: 430,
          edge: 500,
          back: 430,
          angle: 12,
          arm: 220,
          foot: [355, 430],
          length: [1010, 1010],
          height: 905,
          widths: [
            [400, 575, 11.9],
            [450, 625, 12.1],
            [500, 675, 12.3],
          ],
        },
      ],
    };
}
