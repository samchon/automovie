import { AutoMovieHumanLoftChain } from "../../lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanViewAxis } from "../../lofting/AutoMovieHumanViewAxis";
import { AutoMovieHumanViewSection } from "../../lofting/AutoMovieHumanViewSection";
import type { IAutoMovieHumanLoftChain } from "../../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanViewPart } from "../../lofting/IAutoMovieHumanViewPart";

/**
 * The neck as a part drawn from its views, the input of the view-to-section
 * operator (`AutoMovieHumanViewLoft`).
 *
 * - Front view: the lateral outlines, through the neck base's half breadth
 *   at the bottom and the neck's half breadth at the neck tape's site.
 * - Side view: the front profile (suprasternale up to the cervical point)
 *   and the back profile (cervicale up to the nape).
 * - Axis: through the middle of the side profiles at every level, carried by
 *   minimal rotation, so the neck's forward lean is its own.
 * - Fullness: the ellipse's shoulder in this first pass; the girth at the
 *   neck tape's site (ISO 8559-1 5.3.2) owns it once the views are the
 *   neck's own laws.
 *
 * The part runs from below the neck base, inside the trunk it is merged onto,
 * to above the head's neck ring, inside the head mass merged onto it; both
 * ends are open. First pass: its views are read off the neck chain the
 * existing neck construction lofts (`AutoMovieHumanNeckConstruction`, its
 * rings scaled to the tapes), at that chain's layers, until the trunk
 * publishes its neck base landmarks (`IAutoMovieHumanTrunkLandmarks.neckBase`)
 * and the neck's own laws replace the prior; compile-only, not wired.
 */
export namespace AutoMovieHumanNeckPart {
  /** Control points per section, a multiple of 4. */
  export const ORDER: number = 32;

  /** Ring samples of the emitted chain. */
  export const SAMPLES: number = 128;

  /** Phases a neck ring is read at for its extremes. */
  const PHASES: number = 256;

  /**
   * The neck as a view part.
   *
   * @param neck The neck chain (`head` in the calibration).
   * @returns The part, chain name `neck`.
   */
  export function of(neck: IAutoMovieHumanLoftChain): IAutoMovieHumanViewPart {
    const layers: readonly IAutoMovieHumanLoftChain.ILayer[] = neck.layers;

    // Each layer's extremes along x and z, read on the chain's own ring.
    const boxes: IBox[] = layers.map((layer: IAutoMovieHumanLoftChain.ILayer): IBox => {
      let front: number = -Infinity;
      let back: number = Infinity;
      let side: number = 0;
      for (let i: number = 0; i < PHASES; i++) {
        const p: [number, number, number] = AutoMovieHumanLoftChain.point(neck, layer.y, (2 * Math.PI * i) / PHASES);
        front = Math.max(front, p[0]);
        back = Math.min(back, p[0]);
        side = Math.max(side, Math.abs(p[2]));
      }
      return { station: layer.y, front, back, side };
    });

    // The axis through the side profiles' middle; the outlines from it.
    const axis: AutoMovieHumanViewAxis.IAxis = AutoMovieHumanViewAxis.minimal(
      boxes.map((b: IBox): AutoMovieHumanViewAxis.IAxisKnot => ({ station: b.station, point: [(b.front + b.back) / 2, b.station, 0] })),
      [1, 0, 0],
      1,
    );
    const knots = (value: (b: IBox) => number): IAutoMovieHumanViewPart.IOutline => ({
      knots: boxes.map((b: IBox, i: number): IAutoMovieHumanViewPart.IKnot => ({
        site: i === 0 ? "neck.base" : i === boxes.length - 1 ? "neck.top" : `neck.layer.${i}`,
        station: b.station,
        value: value(b),
      })),
    });
    const first: IBox = boxes[0]!;
    const last: IBox = boxes[boxes.length - 1]!;
    return {
      name: "neck",
      axis,
      stations: boxes.map((b: IBox): number => b.station),
      front: {
        positive: knots((b: IBox): number => (b.front - b.back) / 2),
        negative: knots((b: IBox): number => -(b.front - b.back) / 2),
      },
      side: {
        positive: knots((b: IBox): number => b.side),
        negative: knots((b: IBox): number => -b.side),
      },
      fullness: {
        kind: "shoulder",
        shoulder: {
          knots: [
            { site: "neck.base", station: first.station, value: AutoMovieHumanViewSection.ELLIPSE },
            { site: "neck.top", station: last.station, value: AutoMovieHumanViewSection.ELLIPSE },
          ],
        },
      },
      order: ORDER,
      samples: SAMPLES,
    };
  }

  /** A layer's extremes. */
  interface IBox {
    /** Station, the layer's height. */
    station: number;

    /** Forward extreme, mm. */
    front: number;

    /** Backward extreme, mm. */
    back: number;

    /** Lateral half breadth, mm. */
    side: number;
  }
}
