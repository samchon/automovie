import {
  IAutoMovieConstraintViolation,
  type IAutoMovieEnvelopeRequest,
  IAutoMovieEnvironmentInstant,
  IAutoMovieValidation,
} from "@automovie/interface";

import { assertAnalysisTargets } from "./assertAnalysisTargets";
import { environmentInstant } from "./environmentInstant";
import { AutoMovieEngineAnalysisMaxSamples } from "../AutoMovieEngineAnalysisMaxSamples";
import { validateEnvironmentContext } from "./validateEnvironmentContext";

/*
 * Refuse an envelope request no honest study can be made from, and resolve the
 * instant it names.
 *
 * The refused inputs are those IAutoMovieEnvelopeRequest lists, checked
 * in field order: header strings, the context, the instant, the indoor air, the
 * assemblies with their films, area, position and layers, the bridges, and the
 * targets. The first one throws an `Error` naming it. Ids must be unique within
 * their own list, and a bridge must run along a declared assembly.
 * Parameter request: Envelope study to check.
 * Returns: The context's own instant record, or `null` when the request names
 * none.
 */
export function resolveEnvelopeRequest(
  request: IAutoMovieEnvelopeRequest,
): IAutoMovieEnvironmentInstant | null {
  for (const [label, value] of [
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`an envelope study must state a non-blank ${label}`);
  const validated: IAutoMovieValidation = validateEnvironmentContext({
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
      : environmentInstant(request.context, request.instant);
  if (request.instant !== null && instant === null)
    throw new Error(
      `envelope study "${request.id}" names instant "${request.instant}", which the environment context does not declare`,
    );
  if (
    request.indoor.relativeHumidity < 0 ||
    request.indoor.relativeHumidity > 1
  )
    throw new Error(
      `indoor relative humidity must be a fraction within [0, 1], but was ${request.indoor.relativeHumidity}`,
    );
  if (request.assemblies.length === 0)
    throw new Error("an envelope study needs at least one assembly");
  if (request.assemblies.length > AutoMovieEngineAnalysisMaxSamples)
    throw new Error(
      `an envelope study carries one sample per assembly and may not exceed ${AutoMovieEngineAnalysisMaxSamples}, but had ${request.assemblies.length}`,
    );
  const assemblies: Set<string> = new Set<string>();
  for (const assembly of request.assemblies) {
    if (assemblies.has(assembly.id))
      throw new Error(`envelope assembly "${assembly.id}" is declared twice`);
    assemblies.add(assembly.id);
    for (const key of ["interiorFilm", "exteriorFilm", "area"] as const)
      if (assembly[key] <= 0)
        throw new Error(
          `envelope assembly "${assembly.id}" ${key} must be a finite number above zero, but was ${assembly[key]}`,
        );
    if (assembly.layers.length === 0)
      throw new Error(
        `envelope assembly "${assembly.id}" must declare at least one layer`,
      );
    const layers: Set<string> = new Set<string>();
    for (const layer of assembly.layers) {
      if (layers.has(layer.id))
        throw new Error(
          `layer "${layer.id}" of envelope assembly "${assembly.id}" is declared twice`,
        );
      layers.add(layer.id);
      for (const key of ["thickness", "conductivity"] as const)
        if (layer[key] <= 0)
          throw new Error(
            `layer "${layer.id}" ${key} must be a finite number above zero, but was ${layer[key]}`,
          );
    }
  }
  const bridges: Set<string> = new Set<string>();
  for (const bridge of request.bridges) {
    if (bridges.has(bridge.id))
      throw new Error(`thermal bridge "${bridge.id}" is declared twice`);
    bridges.add(bridge.id);
    if (!assemblies.has(bridge.assembly))
      throw new Error(
        `thermal bridge "${bridge.id}" runs along assembly "${bridge.assembly}", which the study does not declare`,
      );
    if (bridge.linearTransmittance < 0)
      throw new Error(
        `thermal bridge "${bridge.id}" linear transmittance must be a finite number at or above zero, but was ${bridge.linearTransmittance}`,
      );
    if (bridge.length <= 0)
      throw new Error(
        `thermal bridge "${bridge.id}" length must be a finite number above zero, but was ${bridge.length}`,
      );
  }
  assertAnalysisTargets(request.targets);
  return instant;
}
