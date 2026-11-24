import {
  type IAutoMovieAnalysisWorkplane,
  IAutoMovieConstraintViolation,
  type IAutoMovieDaylightRequest,
  IAutoMovieEnvironmentInstant,
  type IAutoMovieResolveDaylightRequest,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { assertAutoMovieAnalysisSolids } from "./assertAutoMovieAnalysisSolids";
import { assertAutoMovieAnalysisTargets } from "./assertAutoMovieAnalysisTargets";
import { autoMovieEnvironmentInstant } from "./autoMovieEnvironmentInstant";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./constants/AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { validateAutoMovieEnvironmentContext } from "./validateAutoMovieEnvironmentContext";

/** Directions this short or shorter are degenerate. */
const EPSILON: number = 1e-12;

/**
 * Refuse a daylight request no honest study can be made from, and resolve the
 * instant and the workplane frame it names.
 *
 * Authoring mistakes throw rather than becoming an `unsupported` run: an
 * unsupported run is a true statement about the host's capability, and using it
 * for a degenerate grid would turn a bug report into a capability claim. The
 * refused inputs are those {@link IAutoMovieDaylightRequest} lists, checked in
 * field order, and the first one throws an `Error` naming it.
 *
 * The returned axes are the normalized workplane axes, and the normal is their
 * normalized right-handed cross product, the face the study measures. The
 * instant is the context's own record, or `null` when the request names none.
 *
 * @param request Daylight or artificial-light study to check.
 * @returns The resolved instant and the unit frame of the workplane.
 */
export const resolveAutoMovieDaylightRequest: (
  request: IAutoMovieDaylightRequest,
) => IAutoMovieResolveDaylightRequest.IResult = (
  request: IAutoMovieDaylightRequest,
): IAutoMovieResolveDaylightRequest.IResult => {
  for (const [label, value] of [
    ["subject", request.subject],
    ["input revision", request.inputRevision],
    ["sky model", request.sky],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`a daylight study must state a non-blank ${label}`);
  const validated: IAutoMovieValidation = validateAutoMovieEnvironmentContext({
    context: request.context,
  });
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `daylight study "${request.id}" reads an invalid environment context at ${first.path}: ${first.expected}`,
    );
  }
  const instant: IAutoMovieEnvironmentInstant | null =
    request.instant === null
      ? null
      : autoMovieEnvironmentInstant(request.context, request.instant);
  if (request.instant !== null && instant === null)
    throw new Error(
      `daylight study "${request.id}" names instant "${request.instant}", which the environment context does not declare`,
    );
  const workplane: IAutoMovieAnalysisWorkplane = request.workplane;
  for (const axis of ["sizeU", "sizeV"] as const)
    if (workplane[axis] <= 0)
      throw new Error(
        `workplane ${axis} must be a finite number above zero, but was ${workplane[axis]}`,
      );
  for (const axis of ["countU", "countV"] as const)
    if (workplane[axis] < 1)
      throw new Error(
        `workplane ${axis} must be a whole number at or above one, but was ${workplane[axis]}`,
      );
  const cells: number = workplane.countU * workplane.countV;
  if (cells > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
    throw new Error(
      `a workplane grid of ${cells} cells exceeds the ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES}-sample bound one run may carry; measure a coarser grid or split the plane`,
    );
  for (const key of ["axisU", "axisV"] as const) {
    const length: number = Vector3.length(workplane[key]);
    if (length <= EPSILON)
      throw new Error(
        `workplane ${key} must be a finite non-zero in-plane direction`,
      );
  }
  const axisU: IAutoMovieVector3 = Vector3.normalize(workplane.axisU);
  const axisV: IAutoMovieVector3 = Vector3.normalize(workplane.axisV);
  const normal: IAutoMovieVector3 = Vector3.cross(axisU, axisV);
  if (Vector3.length(normal) <= EPSILON)
    throw new Error(
      "a workplane needs two non-parallel in-plane axes to have a normal",
    );
  if (
    request.diffuseSamples < 1
  )
    throw new Error(
      `a daylight study needs a positive whole sky sample count, but was ${request.diffuseSamples}`,
    );
  const luminaires: Set<string> = new Set<string>();
  for (const luminaire of request.luminaires) {
    if (luminaires.has(luminaire.id))
      throw new Error(`luminaire id "${luminaire.id}" is declared twice`);
    luminaires.add(luminaire.id);
    if (luminaire.intensity < 0)
      throw new Error(
        `luminaire "${luminaire.id}" intensity must be a finite number at or above zero, but was ${luminaire.intensity}`,
      );
  }
  assertAutoMovieAnalysisSolids(request.shades, "shading solid");
  assertAutoMovieAnalysisTargets(request.targets);
  return { instant, normal: Vector3.normalize(normal), axisU, axisV };
};
