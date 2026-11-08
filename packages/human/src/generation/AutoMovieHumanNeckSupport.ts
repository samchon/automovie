import {
  AutoMovieViewOutline,
  AutoMovieViewParameter,
  type IAutoMovieViewPart,
} from "@automovie/engine";

import type { AutoMovieHumanHeadNeckCurves } from "./head/AutoMovieHumanHeadNeckCurves";

/** Additional explicitly authored lower support for a common neck field; every already-owned polynomial remains unchanged. */
export namespace AutoMovieHumanNeckSupport {
  /** Original functions plus the constant-radius/affine-origin lower source spans. */
  export interface IOutput {
    /** Same radius on the complete original domain, with a new constant lower span. */
    radius: IAutoMovieViewPart.IOutline;
    /** Same centre on its complete original domain, with an affine lower span. */
    centre: IAutoMovieViewPart.IOutline;
  }

  /**
   * Author extra support only where the original lower radius is flat and origin is affine.
   *
   * This is a declared new constant/straight source interval, not extrapolated Taylor geometry across an unknown curved field. All original values and parameter two-jets are copied in the unchanged original coordinate and re-normalized to the enlarged source span. Public neck courses and original functions stay inside their retained domain.
   */
  export function create(
    controls: AutoMovieHumanHeadNeckCurves.IOutput,
    lower: number,
  ): IOutput {
    if (!Number.isFinite(lower))
      throw new Error("Neck support requires a finite anatomical lower datum");
    if (lower >= controls.radius.knots[0]!.station)
      return { radius: controls.radius, centre: controls.centre };
    const radius: AutoMovieViewOutline.IOutline = prepare(controls.radius);
    const centre: AutoMovieViewOutline.IOutline = prepare(controls.centre);
    const a: AutoMovieViewOutline.IReading = read(radius, radius.domain[0]);
    const b: AutoMovieViewOutline.IReading = read(centre, centre.domain[0]);
    if (
      a.parameterJet[0] !== 0 ||
      a.parameterJet[1] !== 0 ||
      centre.parameter !== undefined ||
      b.stationJet === null ||
      b.stationJet[1] !== 0
    )
      throw new Error(
        "Neck lower support requires its actual flat radius and physical affine origin, not a substituted missing jet",
      );
    return {
      radius: extend(controls.radius, radius, lower, a.value, 0, 0),
      centre: extend(
        controls.centre,
        centre,
        lower,
        b.value + b.stationJet[0] * (lower - b.station),
        b.stationJet[0],
        0,
      ),
    };
  }
}

/** Reproduce every existing scalar span from actual original parameter jets and add the explicitly declared lower primitive. */
function extend(
  input: IAutoMovieViewPart.IOutline,
  source: AutoMovieViewOutline.IOutline,
  lower: number,
  value: number,
  first: number,
  second: number,
): IAutoMovieViewPart.IOutline {
  const span: number =
    AutoMovieViewParameter.at(source.parameter, source.domain[1]) -
    AutoMovieViewParameter.at(source.parameter, lower);
  if (!(Number.isFinite(span) && span > 0))
    throw new Error("Extended neck support has no finite source span");
  return {
    ...input,
    parameter: source.parameter,
    knots: [
      {
        site: "collar.support.lower",
        station: lower,
        value,
        jet: { first: first * span, second: second * span * span },
      },
      ...source.knots.map(
        (knot: IAutoMovieViewPart.IKnot): IAutoMovieViewPart.IKnot => {
          const original: AutoMovieViewOutline.IReading = read(
            source,
            knot.station,
          );
          return {
            ...knot,
            value: original.value,
            jet: {
              first: original.parameterJet[0] * span,
              second: original.parameterJet[1] * span * span,
            },
          };
        },
      ),
    ],
  };
}

/** Preserve original scalar admission and its failure. */
function prepare(
  input: IAutoMovieViewPart.IOutline,
): AutoMovieViewOutline.IOutline {
  const source: ReturnType<typeof AutoMovieViewOutline.create> =
    AutoMovieViewOutline.create(input);
  if ("detail" in source) throw new Error(source.detail);
  return source;
}

/** Read the actual source without replacing absent derivatives. */
function read(
  source: AutoMovieViewOutline.IOutline,
  station: number,
): AutoMovieViewOutline.IReading {
  const result: ReturnType<typeof AutoMovieViewOutline.at> =
    AutoMovieViewOutline.at(source, station);
  if (typeof result === "string") throw new Error(result);
  return result;
}
