import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanZip,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";

/*
 * Read the independent slider and its opposing working and supporting sites
 * from a fixed pouch with coupled geometry.
 */
export function zipSites(
  p: Pick<IAutoMovieMotionHumanZip, SiteNames>,
  model: Pick<IAutoMovieMotionHumanPropReader["prop"], FixedPouch>,
): zipSites.ISites {
  const sites: readonly IAutoMovieAffordance[] = model.affordances ?? [];
  const site = (id: string): IAutoMovieAffordance | undefined =>
    sites.find((item: IAutoMovieAffordance): boolean => item.id === id);
  const thumb: IAutoMovieAffordance | undefined = site(p.thumb);
  const index: IAutoMovieAffordance | undefined = site(p.index);
  const brace: IAutoMovieAffordance | undefined = site(p.brace);
  const slider: IAutoMovieAffordance | undefined =
    thumb?.rides === undefined ? undefined : site(thumb.rides);
  if (
    model.fixed !== true ||
    model.worn !== undefined ||
    model.motion !== undefined ||
    model.mounted !== undefined ||
    model.soft !== undefined ||
    model.articulate === undefined ||
    thumb?.kind !== "surface" ||
    index?.kind !== "surface" ||
    thumb.id === index.id ||
    thumb.follows !== undefined ||
    index.follows !== undefined ||
    brace?.kind !== "surface" ||
    brace.rides !== undefined ||
    brace.follows !== undefined ||
    slider?.kind !== "slider" ||
    index.rides !== slider.id ||
    slider.rides !== undefined ||
    slider.follows !== undefined ||
    (slider.parts?.length ?? 0) === 0 ||
    !sites.some(
      (item: IAutoMovieAffordance): boolean =>
        item.kind === "hinge" &&
        item.follows?.id === slider.id &&
        (item.parts?.length ?? 0) > 0,
    )
  )
    throw zipSites.refusal(
      p.pouch,
      "a fixed pouch needs an independent tab slider, opposing tab sites, coupled lip geometry and a stationary brace",
    );
  return { thumb, index, brace, slider };
}

/*
 * Admission for a pouch's slider and contact sites.
 */
export namespace zipSites {
  /*
   * The surfaces and independent slider for one closure.
   */
  export interface ISites {
    thumb: IAutoMovieAffordance;
    index: IAutoMovieAffordance;
    brace: IAutoMovieAffordance;
    slider: IAutoMovieAffordance;
  }

  /*
   * Admit the terminal slider state between its two mechanical stops.
   */
  export function admitStop(
    subject: string,
    slider: Pick<IAutoMovieAffordance, "reverse" | "travel">,
    finish: number,
  ): void {
    if (!(finish >= -(slider.reverse ?? 0) && finish <= (slider.travel ?? 0)))
      throw refusal(subject, "the requested travel passes a zipper stop");
  }

  /*
   * Explain why the pouch cannot perform its requested closure.
   */
  export function refusal(subject: string, reason: string): AutoMovieMotionHumanRefusal {
    return new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "pouch",
      value: subject,
      reason,
      fix: "stage a fixed articulated pouch with a tab and brace, and request travel within its stops",
    });
  }
}

/*
 * The opposing tab and its free-standing brace, by site names.
 */
type SiteNames = "pouch" | "thumb" | "index" | "brace";

/*
 * The staged pouch fields that determine its suitability for the closure.
 */
type FixedPouch =
  | "affordances"
  | "fixed"
  | "worn"
  | "motion"
  | "mounted"
  | "soft"
  | "articulate";
