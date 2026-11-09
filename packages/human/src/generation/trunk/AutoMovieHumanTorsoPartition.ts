import {
  AutoMovieConstructionViews,
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import { AutoMovieHumanConstructionView } from "../limb/AutoMovieHumanConstructionView";
import type { AutoMovieHumanSiteViewPart } from "../limb/AutoMovieHumanSiteViewPart";

/** Exact AP source subdivision before the shared regular neck changes its local decomposition. */
export namespace AutoMovieHumanTorsoPartition {
  /**
   * Put the AP radii and world-X origin on the union of their original knots.
   *
   * The engine's original parameter values and first two parameter derivatives reproduce each old polynomial on every subinterval. This is subdivision, without sampled fitting or a new interpolator. Changing the canonical neck afterwards acts on the same final interval in both summands of world anterior/posterior. It does not itself certify an anatomical shape or monotonicity.
   */
  export function create(
    definition: AutoMovieHumanSiteViewPart.IDefinition,
  ): AutoMovieHumanSiteViewPart.IDefinition {
    const part: IAutoMovieViewPart | null = definition.part;
    const view: AutoMovieHumanSiteViewPart.IDefinition["view"] =
      definition.view;
    if (part === null || view === null) return definition;
    if (view.axis.type !== "parallel")
      throw new Error(
        "S00 common AP partition requires its actual parallel axis",
      );
    const origin: IAutoMovieViewPart.IOutline = AutoMovieViewOutline.scale(
      view.axis.origin.x,
      1000,
      1000,
    );
    const knots: IAutoMovieViewPart.IKnot[] = [
      ...origin.knots,
      ...part.front.positive.knots,
      ...part.front.negative.knots,
    ];
    const sites: Map<number, string> = new Map();
    for (const knot of knots) sites.set(knot.station, knot.site);
    const stations: number[] = [...sites.keys()].sort(
      (a: number, b: number): number => a - b,
    );
    const ends: AutoMovieViewOutline.IEnds = {};
    if (part.pole === "bottom" || part.pole === "both")
      ends.bottom = part.stations[0]!;
    if (part.pole === "top" || part.pole === "both")
      ends.top = part.stations.at(-1)!;
    const axis: typeof view.axis = {
      ...view.axis,
      origin: {
        ...view.axis.origin,
        x: AutoMovieHumanConstructionView.length(
          subdivide(origin, {}, stations, sites),
        ),
      },
    };
    const frame: ReturnType<typeof AutoMovieConstructionViews.frame> =
      AutoMovieConstructionViews.frame(axis);
    if (typeof frame === "string") throw new Error(frame);
    const aligned: IAutoMovieViewPart = {
      ...part,
      axis: frame,
      front: {
        positive: subdivide(part.front.positive, ends, stations, sites),
        negative: subdivide(part.front.negative, ends, stations, sites),
      },
    };
    return {
      ...definition,
      part: aligned,
      view: AutoMovieHumanConstructionView.of(aligned, axis),
    };
  }
}

/** Copy the actual original polynomial and its source clock at every exact partition station. */
function subdivide(
  outline: IAutoMovieViewPart.IOutline,
  ends: AutoMovieViewOutline.IEnds,
  stations: readonly number[],
  sites: ReadonlyMap<number, string>,
): IAutoMovieViewPart.IOutline {
  const source: ReturnType<typeof AutoMovieViewOutline.create> =
    AutoMovieViewOutline.create(outline, ends);
  if ("detail" in source) throw new Error(source.detail);
  const span: number =
    AutoMovieViewParameter.at(source.parameter, source.domain[1]) -
    AutoMovieViewParameter.at(source.parameter, source.domain[0]);
  if (!(Number.isFinite(span) && span > 0))
    throw new Error(
      "S00 source subdivision needs a positive finite source clock",
    );
  return {
    ...outline,
    parameter: source.parameter,
    knots: stations.map((station: number): IAutoMovieViewPart.IKnot => {
      const reading: ReturnType<typeof AutoMovieViewOutline.at> =
        AutoMovieViewOutline.at(source, station);
      if (typeof reading === "string") throw new Error(reading);
      return {
        site: sites.get(station)!,
        station,
        value: reading.value,
        jet: {
          first: reading.parameterJet[0] * span,
          second: reading.parameterJet[1] * span * span,
        },
      };
    }),
  };
}
