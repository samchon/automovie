import { AutoMovieViewLoft, type IAutoMovieLoftChain, type IAutoMovieViewPart } from "@automovie/engine";

import { AutoMovieHumanTrunkViewCurves } from "./AutoMovieHumanTrunkViewCurves";

type Knot = AutoMovieHumanTrunkViewCurves.IKnot;

/**
 * S00's loft constructor: its view curves become one `IAutoMovieViewPart`
 * lofted by the engine's view-to-section operator (`AutoMovieViewLoft`,
 * classic conic lofting) over the view curves' section planes
 * (`AutoMovieHumanTrunkNeckTurn`: level below the neck with the station the
 * world height, chart u = +X anterior, v = +Z right; turning over the neck to
 * the oblique neck-base plane). The front pair of the part is the chart's u
 * extremes, the anterior and posterior midlines; its side pair the v
 * extremes, the right and left lateral outlines. Both ends are open: the
 * crotch section both legs continue from and the neck-base end the neck
 * continues from. The mounds (breasts, buttocks) are
 * composed into the same chain as engine reliefs, not as separate operands.
 *
 * Every outline knot passes its solved jet to the engine in the outline's
 * normalized source parameter: the part has no pole, so the engine reads its
 * outlines in the station, and the jets per mm times the whole station span
 * of the knots are what `AutoMovieViewHermite` reads; the engine's quintics
 * are then the same curves the composed source and the drawn specs evaluate.
 * The fullness owner is the shoulder law with the four quarters' departures
 * (the front quarters' supraclavicular bridge).
 */
export namespace AutoMovieHumanTrunkViewLoft {
  /** The lofted part. */
  export interface IOutput {
    /** The view part handed to the engine. */
    part: IAutoMovieViewPart;

    /** The engine's loft of the wall. */
    loft: AutoMovieViewLoft.IResult;

    /** The wall chain with the mounds composed as its reliefs, or null when the loft failed. */
    chain: IAutoMovieLoftChain | null;
  }

  /** Build and loft S00. */
  export function create(curves: AutoMovieHumanTrunkViewCurves.IOutput, options: { order: number; samples: number; gap: number }): IOutput {
    const outline: (knots: Knot[], sign: 1 | -1) => IAutoMovieViewPart.IOutline = (knots: Knot[], sign: 1 | -1): IAutoMovieViewPart.IOutline => {
      const span: number = knots[knots.length - 1]!.q - knots[0]!.q;
      return {
        knots: knots.map((k: Knot): IAutoMovieViewPart.IKnot => ({ site: k.site, station: k.y, value: sign * k.jet.value, jet: { first: sign * k.jet.first * span, second: sign * k.jet.second * span * span } })),
      };
    };
    const front: IAutoMovieViewPart.IPair = { positive: outline(curves.outlines.anterior, 1), negative: outline(curves.outlines.posterior, 1) };
    const side: IAutoMovieViewPart.IPair = { positive: outline(curves.outlines.lateral, 1), negative: outline(curves.outlines.lateral, -1) };
    const shoulder: IAutoMovieViewPart.IOutline = outline(curves.fullness, 1);
    const departures: IAutoMovieViewPart.IQuarters<IAutoMovieViewPart.IOutline> = [outline(curves.departures[0], 1), outline(curves.departures[1], 1), outline(curves.departures[2], 1), outline(curves.departures[3], 1)];

    // Layers: every knot station, each run between them cut into equal steps no wider than the gap.
    const keys: number[] = [];
    for (const s of [...Object.values(curves.outlines).flat(), ...curves.fullness, ...curves.departures[0]].map((k: Knot): number => k.y).sort((a: number, b: number): number => a - b))
      if (keys.length === 0 || s - keys[keys.length - 1]! > 1e-6) keys.push(s);
    const stations: number[] = [keys[0]!];
    for (let i: number = 0; i + 1 < keys.length; ++i) {
      const n: number = Math.max(1, Math.ceil((keys[i + 1]! - keys[i]!) / options.gap));
      for (let j: number = 1; j <= n; ++j) stations.push(j === n ? keys[i + 1]! : keys[i]! + ((keys[i + 1]! - keys[i]!) * j) / n);
    }
    const part: IAutoMovieViewPart = {
      name: "trunk",
      axis: curves.axis.turn.axis,
      stations,
      front,
      side,
      fullness: { kind: "shoulder", shoulder, departures },
      order: options.order,
      samples: options.samples,
    };
    const loft: AutoMovieViewLoft.IResult = AutoMovieViewLoft.create(part);
    return { part, loft, chain: loft.chain === null ? null : { ...loft.chain, reliefs: curves.source.reliefs } };
  }
}
