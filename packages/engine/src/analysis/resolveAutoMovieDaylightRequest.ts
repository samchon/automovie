import {
  IAutoMovieConstraintViolation,
  IAutoMovieEnvironmentInstant,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieAnalysisWorkplane } from "./IAutoMovieAnalysisWorkplane";
import { IAutoMovieDaylightRequest } from "./IAutoMovieDaylightRequest";
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
 *
 * @evidence contracts/common.md#principled-implementation Checks every field the request contract bounds in one ordered pass, delegates the context, shades and targets to their shared validators, and derives the measured face as the normalized cross product of the normalized axes, refusing a cross product of `1e-12` or less because parallel axes span no plane.
 * @evidence contracts/common.md#clear-and-simple-design The request check lives beside the analyzer it serves and returns what it already had to compute, the instant it looked up and the frame it normalized, so the analyzer neither looks the instant up again nor asserts it non-null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No study or fixture is special-cased; the only constants are the `1e-12` degeneracy floor and `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, and nothing is clamped or defaulted to let a malformed request through.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why mistakes throw instead of producing an unsupported run, where the refused inputs are listed and their order, and what each returned field is and how it was derived.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the context, luminaires L, shades with their planes, and targets, with hashed id uniqueness; the grid cell count is checked by one product instead of enumerating cells.
 * @evidence contracts/performance.md#reuse-equivalent-work The instant lookup and the frame normalization are done once here and handed to the analyzer, which reuses them for every cell instead of repeating them.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The luminaire id set and the context validation result are call-local; the returned record holds three new vectors and a reference to the context's instant, owned by the caller.
 * @author Samchon
 */
export const resolveAutoMovieDaylightRequest = (
  request: IAutoMovieDaylightRequest,
): {
  /** Instant the study reads, or `null` for an artificial-light-only study. */
  instant: IAutoMovieEnvironmentInstant | null;

  /** Unit normal of the measured face. */
  normal: IAutoMovieVector3;

  /** Unit direction of the workplane's first axis. */
  axisU: IAutoMovieVector3;

  /** Unit direction of the workplane's second axis. */
  axisV: IAutoMovieVector3;
} => {
  for (const [label, value] of [
    ["id", request.id],
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
    if (!Number.isFinite(workplane[axis]) || workplane[axis] <= 0)
      throw new Error(
        `workplane ${axis} must be a finite number above zero, but was ${workplane[axis]}`,
      );
  for (const axis of ["countU", "countV"] as const)
    if (!Number.isSafeInteger(workplane[axis]) || workplane[axis] < 1)
      throw new Error(
        `workplane ${axis} must be a whole number at or above one, but was ${workplane[axis]}`,
      );
  const cells: number = workplane.countU * workplane.countV;
  if (cells > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
    throw new Error(
      `a workplane grid of ${cells} cells exceeds the ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES}-sample bound one run may carry; measure a coarser grid or split the plane`,
    );
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(workplane.origin[axis]))
      throw new Error(
        `workplane origin ${axis} must be finite, but was ${workplane.origin[axis]}`,
      );
  for (const key of ["axisU", "axisV"] as const) {
    const length: number = Vector3.length(workplane[key]);
    if (!Number.isFinite(length) || length <= EPSILON)
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
    !Number.isSafeInteger(request.diffuseSamples) ||
    request.diffuseSamples < 1
  )
    throw new Error(
      `a daylight study needs a positive whole sky sample count, but was ${request.diffuseSamples}`,
    );
  const luminaires: Set<string> = new Set<string>();
  for (const luminaire of request.luminaires) {
    if (luminaire.id.trim().length === 0)
      throw new Error("every luminaire must carry a non-blank id");
    if (luminaires.has(luminaire.id))
      throw new Error(`luminaire id "${luminaire.id}" is declared twice`);
    luminaires.add(luminaire.id);
    if (!Number.isFinite(luminaire.intensity) || luminaire.intensity < 0)
      throw new Error(
        `luminaire "${luminaire.id}" intensity must be a finite number at or above zero, but was ${luminaire.intensity}`,
      );
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(luminaire.position[axis]))
        throw new Error(
          `luminaire "${luminaire.id}" position ${axis} must be finite, but was ${luminaire.position[axis]}`,
        );
  }
  assertAutoMovieAnalysisSolids(request.shades, "shading solid");
  assertAutoMovieAnalysisTargets(request.targets);
  return { instant, normal: Vector3.normalize(normal), axisU, axisV };
};
