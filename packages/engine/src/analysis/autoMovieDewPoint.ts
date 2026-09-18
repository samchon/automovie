import { IAutoMovieAnalysisMetric, IAutoMovieAnalysisMetricGap, IAutoMovieAnalysisWarning, IAutoMovieEnvironmentInstant } from "@automovie/interface";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { assertAutoMovieAnalysisTargets } from "./assertAutoMovieAnalysisTargets";
import { autoMovieAnalysisMetric } from "./autoMovieAnalysisMetric";
import { autoMovieEnvironmentInstant } from "./autoMovieEnvironmentInstant";
import { validateAutoMovieEnvironmentContext } from "./validateAutoMovieEnvironmentContext";
import { IAutoMovieEnvelopeRequest } from "./IAutoMovieEnvelopeRequest";
import { IAutoMovieSpaceAirRequest } from "./IAutoMovieSpaceAirRequest";

/**
 * Dew point of moist air by the Magnus form.
 *
 * `gamma = ln(RH) + a*T/(b+T)`, `Td = b*gamma/(a - gamma)`. Exported because it
 * is the one place this project turns humidity into a temperature, and a second
 * copy would be a second answer.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `autoMovieDewPoint` turns declared air temperature and relative humidity into the comparison temperature used for condensation evidence.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The function evaluates the single Magnus-form moisture boundary shared by envelope risk calculations.
 */
export const autoMovieDewPoint = (
  temperature: number,
  relativeHumidity: number,
): number => {
  if (!Number.isFinite(temperature))
    throw new Error(
      `a dew point needs a finite air temperature, but was ${temperature}`,
    );
  if (
    !Number.isFinite(relativeHumidity) ||
    relativeHumidity <= 0 ||
    relativeHumidity > 1
  )
    throw new Error(
      `a dew point needs a relative humidity within (0, 1], but was ${relativeHumidity}`,
    );
  return magnusDewPoint(temperature, relativeHumidity);
};

const magnusDewPoint = (
  temperature: number,
  relativeHumidity: number,
): number => {
  const gamma =
    Math.log(relativeHumidity) +
    (MAGNUS_A * temperature) / (MAGNUS_B + temperature);
  return (MAGNUS_B * gamma) / (MAGNUS_A - gamma);
};

/** The exterior air temperature an instant supplies, or null. */
const exteriorTemperature = (
  instant: IAutoMovieEnvironmentInstant | null,
): number | null => (instant === null ? null : instant.outdoorAirTemperature);

/** One envelope metric, resolved against the request's declared targets. */
const metric = (
  request: IAutoMovieEnvelopeRequest,
  warnings: IAutoMovieAnalysisWarning[],
  props: {
    key: string;
    unit: string;
    value: number | null;
    gap?: IAutoMovieAnalysisMetricGap;
    status?: "unsupported" | "not-run";
  },
): IAutoMovieAnalysisMetric =>
  autoMovieAnalysisMetric({
    key: props.key,
    unit: props.unit,
    value: props.value,
    targets: request.targets,
    warnings,
    gap: props.gap,
    status: props.status,
  });

const validateEnvelopeRequest = (request: IAutoMovieEnvelopeRequest): void => {
  for (const [label, value] of [
    ["id", request.id],
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`an envelope study must state a non-blank ${label}`);
  const validated = validateAutoMovieEnvironmentContext({
    context: request.context,
  });
  if (validated.success === false) {
    const first = validated.violations[0]!;
    throw new Error(
      `envelope study "${request.id}" reads an invalid environment context at ${first.path}: ${first.expected}`,
    );
  }
  if (
    request.instant !== null &&
    autoMovieEnvironmentInstant(request.context, request.instant) === null
  )
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
  const assemblies = new Set<string>();
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
    const layers = new Set<string>();
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
  const bridges = new Set<string>();
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
};

const validateAirRequest = (request: IAutoMovieSpaceAirRequest): void => {
  for (const [label, value] of [
    ["id", request.id],
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`a ventilation study must state a non-blank ${label}`);
  if (!Number.isFinite(request.volume) || request.volume <= 0)
    throw new Error(
      `a ventilated space volume must be a finite number above zero, but was ${request.volume}`,
    );
  if (
    request.supplyFlow !== null &&
    (!Number.isFinite(request.supplyFlow) || request.supplyFlow < 0)
  )
    throw new Error(
      `a supply flow must be null or a finite number at or above zero, but was ${request.supplyFlow}`,
    );
  if (!Number.isSafeInteger(request.occupants) || request.occupants < 0)
    throw new Error(
      `an occupancy must be a whole number at or above zero, but was ${request.occupants}`,
    );
  for (const key of ["occupantCarbonDioxide", "outdoorCarbonDioxide"] as const)
    if (!Number.isFinite(request[key]) || request[key] < 0)
      throw new Error(
        `${key} must be a finite number at or above zero, but was ${request[key]}`,
      );
  assertAutoMovieAnalysisTargets(request.targets);
};

/** The canonical settings text one envelope study is digested against. */
const envelopeSettings = (
  request: IAutoMovieEnvelopeRequest,
  instant: IAutoMovieEnvironmentInstant | null,
): string =>
  JSON.stringify({
    context: request.context.id,
    instant,
    indoor: request.indoor,
    assemblies: request.assemblies.map((assembly) => ({
      id: assembly.id,
      boundary: assembly.boundary,
      layers: assembly.layers.map((layer) => ({
        id: layer.id,
        thickness: layer.thickness,
        conductivity: layer.conductivity,
      })),
      interiorFilm: assembly.interiorFilm,
      exteriorFilm: assembly.exteriorFilm,
      area: assembly.area,
      position: assembly.position,
    })),
    bridges: request.bridges.map((bridge) => ({
      id: bridge.id,
      assembly: bridge.assembly,
      linearTransmittance: bridge.linearTransmittance,
      length: bridge.length,
    })),
    targets: request.targets.map((target) => ({
      key: target.key,
      unit: target.unit,
      value: target.value,
      comparison: target.comparison,
    })),
  });

/**
 * Magnus coefficients for saturation vapour pressure over water, as published
 * by Sonntag: `a` is dimensionless and `b` is in degrees Celsius.
 *
 * They are constants of the equation, not a material table: every dew point
 * anyone computes from air temperature and relative humidity uses these two
 * numbers, so they are capability rather than content.
 */
const MAGNUS_A = 17.62;

const MAGNUS_B = 243.12;
