import {
  IAutoMovieConstraintViolation,
  IAutoMovieEnvironmentInstant,
  IAutoMovieValidation,
} from "@automovie/interface";

import { IAutoMovieEnvelopeRequest } from "./IAutoMovieEnvelopeRequest";
import { assertAutoMovieAnalysisTargets } from "./assertAutoMovieAnalysisTargets";
import { autoMovieEnvironmentInstant } from "./autoMovieEnvironmentInstant";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./constants/AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { validateAutoMovieEnvironmentContext } from "./validateAutoMovieEnvironmentContext";

/**
 * Refuse an envelope request no honest study can be made from, and resolve the
 * instant it names.
 *
 * The refused inputs are those {@link IAutoMovieEnvelopeRequest} lists, checked
 * in field order: header strings, the context, the instant, the indoor air,
 * the assemblies with their films, area, position and layers, the bridges, and
 * the targets. The first one throws an `Error` naming it. Ids must be unique
 * within their own list, and a bridge must run along a declared assembly.
 *
 * @param request Envelope study to check.
 * @returns The context's own instant record, or `null` when the request names
 *   none.
 *
 * @evidence contracts/common.md#principled-implementation One ordered pass checks every bound the request contract states, uses `Set`s for id uniqueness and for the bridge-to-assembly reference, and delegates the context and targets to their shared validators; finite and strictly positive films, areas, thicknesses and conductivities keep every resistance and the transmittance finite and positive.
 * @evidence contracts/common.md#clear-and-simple-design The request check lives beside the analyzer it serves and returns the instant it had to look up, so the analyzer neither repeats the lookup nor asserts it non-null.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No study, assembly or fixture is special-cased; the only constant is `AUTOMOVIE_ANALYSIS_MAX_SAMPLES`, which bounds assemblies because each yields one sample, and nothing is clamped or defaulted.
 * @evidence contracts/common.md#meaningful-documentation The documentation states where the refused inputs are listed, their check order, the per-list uniqueness and the bridge reference rule, and what the returned instant is.
 * @evidence contracts/performance.md#efficient-algorithms Linear in the context, assemblies A with their layers, bridges B and targets, with hashed uniqueness and reference checks instead of pairwise scans.
 * @evidence contracts/performance.md#reuse-equivalent-work The instant lookup is done once here and handed to the analyzer, which uses it for both the settings text and the exterior temperature.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The assembly, layer and bridge id sets are call-local and grow with A, the largest assembly's layers and B; the returned instant is a reference into the caller's context.
 * @author Samchon
 */
export const resolveAutoMovieEnvelopeRequest = (
  request: IAutoMovieEnvelopeRequest,
): IAutoMovieEnvironmentInstant | null => {
  for (const [label, value] of [
    ["id", request.id],
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`an envelope study must state a non-blank ${label}`);
  const validated: IAutoMovieValidation = validateAutoMovieEnvironmentContext({
    context: request.context,
  });
  if (validated.success === false) {
    const first: IAutoMovieConstraintViolation = validated.violations[0]!;
    throw new Error(
      `envelope study "${request.id}" reads an invalid environment context at ${first.path}: ${first.expected}`,
    );
  }
  const instant: IAutoMovieEnvironmentInstant | null =
    request.instant === null
      ? null
      : autoMovieEnvironmentInstant(request.context, request.instant);
  if (request.instant !== null && instant === null)
    throw new Error(
      `envelope study "${request.id}" names instant "${request.instant}", which the environment context does not declare`,
    );
  if (!Number.isFinite(request.indoor.airTemperature))
    throw new Error(
      `indoor air temperature must be finite, but was ${request.indoor.airTemperature}`,
    );
  if (
    !Number.isFinite(request.indoor.relativeHumidity) ||
    request.indoor.relativeHumidity < 0 ||
    request.indoor.relativeHumidity > 1
  )
    throw new Error(
      `indoor relative humidity must be a fraction within [0, 1], but was ${request.indoor.relativeHumidity}`,
    );
  if (request.assemblies.length === 0)
    throw new Error("an envelope study needs at least one assembly");
  if (request.assemblies.length > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
    throw new Error(
      `an envelope study carries one sample per assembly and may not exceed ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES}, but had ${request.assemblies.length}`,
    );
  const assemblies: Set<string> = new Set<string>();
  for (const assembly of request.assemblies) {
    if (assembly.id.trim().length === 0)
      throw new Error("every envelope assembly must carry a non-blank id");
    if (assemblies.has(assembly.id))
      throw new Error(`envelope assembly "${assembly.id}" is declared twice`);
    assemblies.add(assembly.id);
    if (assembly.boundary.trim().length === 0)
      throw new Error(
        `envelope assembly "${assembly.id}" must name the boundary it realizes`,
      );
    for (const key of ["interiorFilm", "exteriorFilm", "area"] as const)
      if (!Number.isFinite(assembly[key]) || assembly[key] <= 0)
        throw new Error(
          `envelope assembly "${assembly.id}" ${key} must be a finite number above zero, but was ${assembly[key]}`,
        );
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(assembly.position[axis]))
        throw new Error(
          `envelope assembly "${assembly.id}" position ${axis} must be finite, but was ${assembly.position[axis]}`,
        );
    if (assembly.layers.length === 0)
      throw new Error(
        `envelope assembly "${assembly.id}" must declare at least one layer`,
      );
    const layers: Set<string> = new Set<string>();
    for (const layer of assembly.layers) {
      if (layer.id.trim().length === 0)
        throw new Error(
          `every layer of envelope assembly "${assembly.id}" must carry a non-blank id`,
        );
      if (layers.has(layer.id))
        throw new Error(
          `layer "${layer.id}" of envelope assembly "${assembly.id}" is declared twice`,
        );
      layers.add(layer.id);
      for (const key of ["thickness", "conductivity"] as const)
        if (!Number.isFinite(layer[key]) || layer[key] <= 0)
          throw new Error(
            `layer "${layer.id}" ${key} must be a finite number above zero, but was ${layer[key]}`,
          );
    }
  }
  const bridges: Set<string> = new Set<string>();
  for (const bridge of request.bridges) {
    if (bridge.id.trim().length === 0)
      throw new Error("every thermal bridge must carry a non-blank id");
    if (bridges.has(bridge.id))
      throw new Error(`thermal bridge "${bridge.id}" is declared twice`);
    bridges.add(bridge.id);
    if (!assemblies.has(bridge.assembly))
      throw new Error(
        `thermal bridge "${bridge.id}" runs along assembly "${bridge.assembly}", which the study does not declare`,
      );
    if (
      !Number.isFinite(bridge.linearTransmittance) ||
      bridge.linearTransmittance < 0
    )
      throw new Error(
        `thermal bridge "${bridge.id}" linear transmittance must be a finite number at or above zero, but was ${bridge.linearTransmittance}`,
      );
    if (!Number.isFinite(bridge.length) || bridge.length <= 0)
      throw new Error(
        `thermal bridge "${bridge.id}" length must be a finite number above zero, but was ${bridge.length}`,
      );
  }
  assertAutoMovieAnalysisTargets(request.targets);
  return instant;
};
