import { AutoMovieArchetypeWheelchair } from "@automovie/archetypes";
import type { IAutoMovieMotionHumanBody } from "@automovie/interface";

import { everydayTake } from "./everydayTake";

/**
 * A wheelchair fitted to its rider: of the kind's read models, the one with
 * the narrowest seat that still holds the seated hips (both hip joints'
 * spread and each thigh's radius) with a hand's breadth to spare, so the
 * rims lie as near the shoulders as the hips allow. The widest model when
 * none fits.
 *
 * @param body The rider.
 * @param kind The chair's kind.
 * @param seed The draw's seed.
 * @returns The chair.
 */
export function catalogueWheelchair(
  body: IAutoMovieMotionHumanBody,
  kind: AutoMovieArchetypeWheelchair.Kind,
  seed: number,
): ReturnType<typeof AutoMovieArchetypeWheelchair.create> {
  const hips: number =
    2 * (body.measure.hipHalfWidth + body.measure.thighRadius) +
    everydayTake.BREADTH * body.measure.hand;
  let best: catalogueWheelchair.IFit | undefined;
  let widest: catalogueWheelchair.IFit | undefined;
  for (const [name, figures] of Object.entries(AutoMovieArchetypeWheelchair.MODELS[kind])) {
    const fit: catalogueWheelchair.IFit = {
      model: name as AutoMovieArchetypeWheelchair.Model,
      width: figures.seatWidth ?? 0,
    };
    if (widest === undefined || fit.width > widest.width) widest = fit;
    if (fit.width >= hips && (best === undefined || fit.width < best.width))
      best = fit;
  }
  return AutoMovieArchetypeWheelchair.create({ kind, model: (best ?? widest)!.model }, seed);
}

/**
 * The record of {@link catalogueWheelchair}.
 */
export namespace catalogueWheelchair {
  /** A model and its seat's width. */
  export interface IFit {
    /** The model's name. */
    model: AutoMovieArchetypeWheelchair.Model;

    /** Its seat's width, metres. */
    width: number;
  }
}
