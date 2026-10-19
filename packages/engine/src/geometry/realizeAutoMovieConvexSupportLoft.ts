import type { IAutoMovieConvexSupportLoft } from "@automovie/interface";

import type { IAutoMovieSupportLoftPlan64 } from "./IAutoMovieSupportLoftPlan64";
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
 * separately from uncertified event isolation, boundary roundoff and source fit.
 *
 * @evidence contracts/common.md#principled-implementation Admitted complete support fields drive plane-intersection cubic curves, feasible triple-plane events and bounded ruled-face tessellation. Analytic plane gradients own the new normals, and incidence rather than position welding owns shared boundaries.
 * @evidence contracts/common.md#clear-and-simple-design This generic engine producer coordinates field admission, continuous planning and mesh/construction emission; image observation and inverse fitting remain outside engine.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No source images, mesh, normals, dense row lookup, fixed polygon topology or hidden cap enters generation. Nonunit normals, duplicate identities, unbounded directions, incoherent spans and unresolved numerical events refuse without a partial success.
 * @evidence contracts/common.md#meaningful-documentation States metre field/geometry units, convex intersection meaning, boundary event versus physical topology, binary64 limits, open ends, caller budgets and newly generated normal ownership.
 * @evidence contracts/performance.md#efficient-algorithms With P planes, S spans and E events, planning costs O(S P to the fourth + (S+E) P cubed). Emission adds O(C + T P squared) conservatively for C strips and T station-triple visits, where T is O((S+E+1) P cubed). Total retained records are O(S P cubed + (S+E+1) P squared + C), including incidence maps. Plane/event/cell/vertex budgets precede their owning populations.
 * @evidence contracts/performance.md#reuse-equivalent-work The one plan supplies mesh, analytic normal fans, physical correspondence and construction; no camera-dependent refitting or cross-request cache exists.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned mesh, construction and scalar diagnostics transfer after complete generation. All plan/identity scratch expires on return or refusal without file, renderer, task or global state.
 */
export function realizeAutoMovieConvexSupportLoft(input: {
  loft: IAutoMovieConvexSupportLoft;
  topologyDomain: string;
  tolerance: number;
  maxPlanes: number;
  maxEvents: number;
  maxCells: number;
  maxVertices: number;
  minimumDirectionSine: number;
}): ReturnType<typeof emitAutoMovieSupportLoft64> & {
  events: number;
  intervals: number;
  faceChordBoundMeters: number;
  eventQualification: "binary64-numerical-not-certified";
} {
  if (
    !input ||
    !input.loft ||
    !Array.isArray(input.loft.planes) ||
    !Array.isArray(input.loft.spans) ||
    !input.loft.spans.length ||
    ![input.maxPlanes, input.maxCells, input.maxVertices].every(
      (n: number): boolean => Number.isSafeInteger(n) && n > 0,
    ) ||
    !Number.isSafeInteger(input.maxEvents) ||
    input.maxEvents < 0 ||
    !Number.isFinite(input.tolerance) ||
    input.tolerance <= 0 ||
    !Number.isFinite(input.minimumDirectionSine) ||
    input.minimumDirectionSine <= 0 ||
    input.minimumDirectionSine >= 1 ||
    typeof input.topologyDomain !== "string" ||
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
      !plane ||
      typeof plane.id !== "string" ||
      !plane.id.trim() ||
      names.has(plane.id) ||
      !Array.isArray(plane.normal) ||
      plane.normal.length !== 2 ||
      !Number.isFinite(plane.normal[0]) ||
      !Number.isFinite(plane.normal[1]) ||
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
      !field ||
      !Array.isArray(field.interval) ||
      field.interval.length !== 2 ||
      !Number.isFinite(field.interval[0]) ||
      !Number.isFinite(field.interval[1]) ||
      !(field.interval[0] < field.interval[1]) ||
      !Number.isFinite(field.interval[1] - field.interval[0]) ||
      (previous !== undefined && previous.interval[1] !== field.interval[0]) ||
      !Array.isArray(field.offsets) ||
      field.offsets.length !== input.loft.planes.length
    )
      throw new Error(
        "invalid-support-span: ordered adjacent intervals and every plane offset required",
      );
    for (let plane: number = 0; plane < field.offsets.length; plane++) {
      const coefficients: number[] = field.offsets[plane];
      if (
        !Array.isArray(coefficients) ||
        coefficients.length !== 4 ||
        ![0, 1, 2, 3].every((q: number): boolean =>
          Number.isFinite(coefficients[q]),
        ) ||
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
