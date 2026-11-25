import type {
  IAutoMovieConvexSupportLoft,
  IAutoMovieRealizeConvexSupportLoft,
  IAutoMovieSupportLoftPlan64,
} from "@automovie/interface";

import { emitAutoMovieSupportLoft64 } from "./emitAutoMovieSupportLoft64";
import { planAutoMovieSupportLoft64 } from "./planAutoMovieSupportLoft64";

/**
 * Generate a new open lateral mesh from compact cubic support coefficients.
 * Sections intersect fixed oriented unit half-planes in XZ. Feasible algebraic
 * boundary events preserve changes in active constraints; they are not physical
 * branch or cavity observations. Native binary64 root/incidence classification
 * remains numerical, with explicit refusal for unresolved charts and budgets.
 * Normals come from the same face equations; caps and interior are not emitted.
 * The face chord bound covers interpolation within the numerical partition,
 * separately from uncertified event isolation, boundary roundoff and source
 * fit.
 */
export function realizeAutoMovieConvexSupportLoft(
  input: IAutoMovieRealizeConvexSupportLoft.IInput,
): IAutoMovieRealizeConvexSupportLoft.IResult {
  if (
    !input.loft.spans.length ||
    ![input.maxPlanes, input.maxCells, input.maxVertices].every(
      (n: number): boolean => n > 0,
    ) ||
    input.maxEvents < 0 ||
    input.tolerance <= 0 ||
    input.minimumDirectionSine <= 0 ||
    input.minimumDirectionSine >= 1 ||
    !input.topologyDomain.trim() ||
    input.loft.planes.length < 3 ||
    input.loft.planes.length > input.maxPlanes
  )
    throw new Error(
      "invalid-support-loft: complete fields and finite work budgets required",
    );
  const names: Set<string> = new Set();
  const angles: number[] = [];
  for (const plane of input.loft.planes) {
    if (
      !plane.id.trim() ||
      names.has(plane.id) ||
      Math.abs(Math.hypot(...plane.normal) - 1) > 64 * Number.EPSILON
    )
      throw new Error(
        "invalid-support-plane: unique identities and unit XZ normals required",
      );
    names.add(plane.id);
    angles.push(Math.atan2(plane.normal[1], plane.normal[0]));
  }
  angles.sort((a: number, b: number): number => a - b);
  for (let i: number = 0; i < angles.length; i++)
    if (
      (i + 1 === angles.length ? angles[0] + 2 * Math.PI : angles[i + 1]) -
        angles[i] >=
      Math.PI
    )
      throw new Error(
        "unbounded-support-directions: oriented normals must surround the section",
      );
  for (let i: number = 0; i < input.loft.spans.length; i++) {
    const field: IAutoMovieConvexSupportLoft["spans"][number] =
      input.loft.spans[i];
    const previous: typeof field | undefined = input.loft.spans[i - 1];
    if (
      !(field.interval[0] < field.interval[1]) ||
      (previous !== undefined && previous.interval[1] !== field.interval[0]) ||
      field.offsets.length !== input.loft.planes.length
    )
      throw new Error(
        "invalid-support-span: ordered adjacent intervals and every plane offset required",
      );
    for (let plane: number = 0; plane < field.offsets.length; plane++) {
      const coefficients: number[] = field.offsets[plane];
      if (
        coefficients.length !== 4 ||
        (previous !== undefined &&
          previous.offsets[plane][3] !== coefficients[0])
      )
        throw new Error(
          "invalid-support-coefficients: complete cubic controls and exact shared endpoints required",
        );
    }
  }
  const plan: IAutoMovieSupportLoftPlan64 = planAutoMovieSupportLoft64(input);
  return {
    ...emitAutoMovieSupportLoft64({
      plan,
      topologyDomain: input.topologyDomain,
      maxVertices: input.maxVertices,
    }),
    events: plan.events,
    intervals: plan.spans.reduce(
      (
        sum: number,
        span: IAutoMovieSupportLoftPlan64["spans"][number],
      ): number => sum + span.intervals.length,
      0,
    ),
    faceChordBoundMeters: input.tolerance,
    eventQualification: "binary64-numerical-not-certified",
  };
}
