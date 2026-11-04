import type { AutoMovieHumanSkinChart } from "./AutoMovieHumanSkinChart";

/** The skin chart layout: every chart moved rigidly onto one sheet. */
export namespace AutoMovieHumanSkinChartPack {
  /** One chart's pieces and coordinate bounding box. */
  export interface IBox {
    /** The chart's pieces. */
    chart: AutoMovieHumanSkinChart.IOutput[];

    /** Lower corner of the coordinates in mm. */
    lo: [number, number];

    /** Extent of the coordinates in mm. */
    size: [number, number];
  }

  /** Gap between packed charts in mm, so filtered marks never bleed across. */
  export const GUTTER: number = 12;

  /**
   * Shelf-pack the charts into one layout starting at the origin, so no two
   * charts share coordinates and a single image can address the whole skin.
   * Charts are placed tallest first, left to right, on shelves about as wide as
   * the square root of their total area; each chart moves rigidly.
   *
   * @param charts Pieces of each chart, coordinates updated in place
   */
  export function pack(charts: AutoMovieHumanSkinChart.IOutput[][]): void {
    const boxes: IBox[] = charts.map(
      (chart: AutoMovieHumanSkinChart.IOutput[]): IBox => {
        const lo: [number, number] = [Infinity, Infinity];
        const hi: [number, number] = [-Infinity, -Infinity];
        for (const piece of chart)
          for (let i: number = 0; i < piece.uvs.length; i += 2)
            for (let c: number = 0; c < 2; ++c) {
              lo[c] = Math.min(lo[c]!, piece.uvs[i + c]!);
              hi[c] = Math.max(hi[c]!, piece.uvs[i + c]!);
            }
        return { chart, lo, size: [hi[0] - lo[0], hi[1] - lo[1]] };
      },
    );
    const area: number = boxes.reduce(
      (s: number, b: IBox): number =>
        s + (b.size[0] + GUTTER) * (b.size[1] + GUTTER),
      0,
    );
    const width: number = Math.max(
      1.1 * Math.sqrt(area),
      ...boxes.map((b: IBox): number => b.size[0] + GUTTER),
    );
    boxes.sort((a: IBox, b: IBox): number => b.size[1] - a.size[1]);
    let x: number = GUTTER;
    let y: number = GUTTER;
    let shelf: number = 0;
    for (const box of boxes) {
      if (x + box.size[0] + GUTTER > width) {
        x = GUTTER;
        y += shelf + GUTTER;
        shelf = 0;
      }
      const du: number = x - box.lo[0];
      const dv: number = y - box.lo[1];
      for (const piece of box.chart)
        for (let i: number = 0; i < piece.uvs.length; i += 2) {
          piece.uvs[i] = piece.uvs[i]! + du;
          piece.uvs[i + 1] = piece.uvs[i + 1]! + dv;
        }
      x += box.size[0] + GUTTER;
      shelf = Math.max(shelf, box.size[1]);
    }
  }
}
