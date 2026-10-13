import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
  IAutoMovieAnalysisSolver,
  IAutoMovieEnvironmentInstant,
} from "@automovie/interface";

import { IAutoMovieEnvelopeAssembly } from "./IAutoMovieEnvelopeAssembly";
import { IAutoMovieEnvelopeBridge } from "./IAutoMovieEnvelopeBridge";
import { IAutoMovieEnvelopeLayer } from "./IAutoMovieEnvelopeLayer";
import { IAutoMovieEnvelopeRequest } from "./IAutoMovieEnvelopeRequest";
import { autoMovieAnalysisMetric } from "./autoMovieAnalysisMetric";
import { autoMovieAnalysisSettingsTargets } from "./autoMovieAnalysisSettingsTargets";
import { autoMovieDewPoint } from "./autoMovieDewPoint";
import { resolveAutoMovieEnvelopeRequest } from "./resolveAutoMovieEnvelopeRequest";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";

/** One assembly solved for transmittance and interior surface temperature. */
interface ISolvedAssembly {
  assembly: IAutoMovieEnvelopeAssembly;
  transmittance: number;
  temperatureFactor: number;
  surface: number;
}

/** One assembly's interior surface margin over the indoor dew point. */
interface IAssemblyMargin {
  assembly: IAutoMovieEnvelopeAssembly;
  margin: number;
}

/**
 * Solve one envelope for heat and for surface condensation, as two runs.
 *
 * Two runs rather than one because heat and moisture are two domains a report
 * rolls up separately: a wall may be warm enough and still wet, and one merged
 * verdict would let either fact hide the other. Both read the same inputs and
 * carry the same settings digest, so they are provably about the same
 * envelope.
 *
 * The governing model is the one-dimensional steady-state network, stated
 * exactly:
 *
 * - `R = Rsi + sum(t / lambda) + Rse`, and `U = 1 / R`;
 * - The interior surface sits at `Tsi = Ti - U * Rsi * (Ti - Te)`, so the
 *   temperature factor `fRsi = (Tsi - Te) / (Ti - Te)` reduces exactly to
 *   `1 - U*Rsi` and needs no temperatures at all;
 * - Fabric loss is `sum(U * A) * dT` and linear bridges add `sum(psi * L) * dT`;
 * - The dew point comes from `autoMovieDewPoint`, the Magnus form, and surface
 *   condensation is `Tsi <= Td`.
 *
 * What it does not do, it says. Condensation inside the build-up, which needs
 * vapour diffusion, and solar gain through glazing each appear as an
 * `unsupported` metric with the exact reason, because an envelope study that
 * quietly omitted them would read as a complete answer. Transient storage is
 * excluded by the steady-state model itself, which the solver's model text
 * states.
 *
 * Without an exterior boundary condition there is no answer at all, and both
 * runs come back `not-run` naming the missing input rather than assuming a
 * temperature nobody declared.
 *
 * The Magnus coefficients are fitted over roughly -45 to 60 degC, and an indoor
 * temperature outside that range is not refused. Throws on a malformed request
 * (see {@link IAutoMovieEnvelopeRequest}).
 *
 * @evidence contracts/common.md#principled-implementation Solves the one-dimensional steady-state series resistance network per assembly, derives interior surface temperature and temperature factor from it, adds psi-times-length bridges to the fabric loss, and judges condensation against the Magnus dew point from `autoMovieDewPoint`, whose fitted temperature range is not enforced.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the solve and both runs' metrics; request checking and instant resolution live in `resolveAutoMovieEnvelopeRequest`, the dew point in `autoMovieDewPoint`, and metric building, target warnings and sealing are shared analysis helpers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No exterior temperature, humidity or material value is substituted: missing inputs give `not-run` runs or gaps, interstitial condensation and solar gain are `unsupported` metrics, and reverse heat flow is reported as a warning rather than corrected.
 * @evidence contracts/common.md#meaningful-documentation The documentation states why there are two runs, the network equations and the dew-point source, the unsupported exclusions, the `not-run` case, the unenforced fitted range and the throwing inputs.
 * @evidence contracts/performance.md#efficient-algorithms Linear in assemblies A (at most 4096), their layers and bridges, plus metrics times targets for target lookup; the A bound keeps the spread `Math.min` and `Math.max` calls within engine argument limits.
 * @evidence contracts/performance.md#reuse-equivalent-work Solves each assembly once for both runs' metrics and samples, computes one dew point for every margin, builds one settings string for both seals, and collects the unknown-target warnings once and copies them into both runs, since both runs report against the same union of keys.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates per-call arrays proportional to A and keeps none of them after returning the two runs, which own their metrics, samples and warnings.
 * @author Samchon
 */
export const analyzeAutoMovieEnvelope = (props: {
  /** Study to solve; validated in full before any arithmetic. */
  request: IAutoMovieEnvelopeRequest;
}): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun } => {
  const request: IAutoMovieEnvelopeRequest = props.request;
  const instant: IAutoMovieEnvironmentInstant | null =
    resolveAutoMovieEnvelopeRequest(request);
  const settings: string = envelopeSettings(request, instant);
  const solver: IAutoMovieAnalysisSolver = {
    id: "automovie.envelope.steady-state-1d",
    version: "1",
    model:
      "1D steady-state resistance network U=1/(Rsi+sum(t/lambda)+Rse), surface Tsi=Ti-U*Rsi*(Ti-Te), Magnus dew point; transient storage, vapour diffusion and solar gain excluded",
  };
  const exterior: number | null =
    instant === null ? null : instant.outdoorAirTemperature;
  if (exterior === null) {
    const missing: { reason: string; remedy: string } =
      instant === null
        ? {
            reason:
              "the study names no environmental instant, so no exterior air temperature was supplied",
            remedy:
              "name an instant of the environment context that declares an outdoor air temperature",
          }
        : {
            reason: `instant "${instant.id}" declares no outdoor air temperature, so the exterior boundary condition is missing`,
            remedy: `declare outdoorAirTemperature on instant "${instant.id}", or name an instant that does`,
          };
    return {
      thermal: sealAutoMovieAnalysisRun({
        id: `${request.id}.thermal`,
        domain: "thermal",
        subject: request.subject,
        inputRevision: request.inputRevision,
        solver,
        settings,
        outcome: { status: "not-run", ...missing },
      }),
      moisture: sealAutoMovieAnalysisRun({
        id: `${request.id}.moisture`,
        domain: "moisture",
        subject: request.subject,
        inputRevision: request.inputRevision,
        solver,
        settings,
        outcome: { status: "not-run", ...missing },
      }),
    };
  }

  const indoor: number = request.indoor.airTemperature;
  const delta: number = indoor - exterior;
  // One shared observation about the inputs, then a separate sink per run: a
  // target stated in the wrong unit for a moisture metric is a fact about the
  // moisture run, and carrying it on the thermal run would tell a reader the
  // heat result had a problem it does not have.
  const shared: IAutoMovieAnalysisWarning[] = [];
  if (delta <= 0)
    shared.push({
      code: "reverse-heat-flow",
      // `Tsi = Ti - U*Rsi*(Ti - Te)` and `U*Rsi < 1`, so the interior face sits
      // between the two air temperatures: it is never colder than the indoor
      // air once the outdoor air is at or above it. Saying it is the *warm*
      // side would be a claim the equal-temperature case contradicts, and this
      // warning exists to keep a reader from misreading the margin.
      detail: `indoor air at ${indoor} degC is not warmer than outdoor air at ${exterior} degC, so the interior surface is no colder than the indoor air; the surface condensation criterion is reported but is not the governing risk`,
      subject: null,
    });
  const thermalWarnings: IAutoMovieAnalysisWarning[] = [...shared];
  const moistureWarnings: IAutoMovieAnalysisWarning[] = [...shared];

  const solved: ISolvedAssembly[] = request.assemblies.map(
    (assembly: IAutoMovieEnvelopeAssembly): ISolvedAssembly => {
      const resistance: number =
        assembly.interiorFilm +
        assembly.layers.reduce(
          (sum: number, layer: IAutoMovieEnvelopeLayer): number =>
            sum + layer.thickness / layer.conductivity,
          0,
        ) +
        assembly.exteriorFilm;
      const transmittance: number = 1 / resistance;
      return {
        assembly,
        transmittance,
        temperatureFactor: 1 - transmittance * assembly.interiorFilm,
        surface: indoor - transmittance * assembly.interiorFilm * delta,
      };
    },
  );
  const area: number = solved.reduce(
    (sum: number, entry: ISolvedAssembly): number => sum + entry.assembly.area,
    0,
  );
  const fabric: number = solved.reduce(
    (sum: number, entry: ISolvedAssembly): number =>
      sum + entry.transmittance * entry.assembly.area,
    0,
  );
  const bridge: number = request.bridges.reduce(
    (sum: number, entry: IAutoMovieEnvelopeBridge): number =>
      sum + entry.linearTransmittance * entry.length,
    0,
  );
  const heatLoss: number = (fabric + bridge) * delta;
  const bridgeLoss: number = bridge * delta;

  const thermalMetrics: IAutoMovieAnalysisMetric[] = [
    metric(request, thermalWarnings, {
      key: "envelope.thermalTransmittance.areaWeighted",
      unit: "W/(m2*K)",
      value: fabric / area,
    }),
    metric(request, thermalWarnings, {
      key: "envelope.thermalTransmittance.max",
      unit: "W/(m2*K)",
      value: Math.max(
        ...solved.map((entry: ISolvedAssembly): number => entry.transmittance),
      ),
    }),
    metric(request, thermalWarnings, {
      key: "envelope.heatLoss",
      unit: "W",
      value: heatLoss,
    }),
    metric(request, thermalWarnings, {
      key: "envelope.thermalBridgeShare",
      unit: "ratio",
      value: heatLoss === 0 ? null : bridgeLoss / heatLoss,
      gap:
        heatLoss === 0
          ? {
              // Stated as the measured fact rather than as its usual cause. The
              // usual cause is equal air temperatures, but the share is
              // undefined whenever the loss is zero, and a reason that named
              // only the temperatures would be a sentence the artifact itself
              // could contradict.
              reason: `the envelope carries no heat flow at all with indoor air at ${indoor} degC against outdoor air at ${exterior} degC, so there is nothing to apportion between fabric and bridges`,
              remedy:
                "analyse an instant whose outdoor air temperature differs from the indoor air temperature",
            }
          : undefined,
    }),
    metric(request, thermalWarnings, {
      key: "envelope.temperatureFactor.min",
      unit: "ratio",
      value: Math.min(
        ...solved.map(
          (entry: ISolvedAssembly): number => entry.temperatureFactor,
        ),
      ),
    }),
    metric(request, thermalWarnings, {
      key: "envelope.surfaceTemperature",
      unit: "degC",
      value:
        solved.reduce(
          (sum: number, entry: ISolvedAssembly): number =>
            sum + entry.surface * entry.assembly.area,
          0,
        ) / area,
    }),
    metric(request, thermalWarnings, {
      key: "envelope.surfaceTemperature.min",
      unit: "degC",
      value: Math.min(
        ...solved.map((entry: ISolvedAssembly): number => entry.surface),
      ),
    }),
    metric(request, thermalWarnings, {
      key: "envelope.solarHeatGain",
      unit: "W",
      value: null,
      gap: {
        reason:
          "this solver reads no glazing g-value and no solar incidence, so heat gained through the envelope by sunlight is not computed",
        remedy:
          "bind a solar-gain adapter and record its result as its own run, or read this envelope as a conduction-only study",
      },
      status: "unsupported",
    }),
  ];
  const thermalSamples: IAutoMovieAnalysisSample[] = solved.map(
    (entry: ISolvedAssembly): IAutoMovieAnalysisSample => ({
      id: entry.assembly.id,
      key: "envelope.surfaceTemperature",
      position: entry.assembly.position,
      value: entry.surface,
    }),
  );

  const humidity: number = request.indoor.relativeHumidity;
  const dewPoint: number | null =
    humidity === 0 ? null : autoMovieDewPoint(indoor, humidity);
  const noDewPoint: IAutoMovieAnalysisMetricGap = {
    reason:
      "the indoor air declares 0 relative humidity, which has no dew point at any temperature",
    remedy:
      "declare the indoor relative humidity the space is actually conditioned to",
  };
  const margins: IAssemblyMargin[] | null =
    dewPoint === null
      ? null
      : solved.map(
          (entry: ISolvedAssembly): IAssemblyMargin => ({
            assembly: entry.assembly,
            margin: entry.surface - dewPoint,
          }),
        );
  const moistureMetrics: IAutoMovieAnalysisMetric[] = [
    metric(request, moistureWarnings, {
      key: "space.dewPoint",
      unit: "degC",
      value: dewPoint,
      gap: dewPoint === null ? noDewPoint : undefined,
    }),
    metric(request, moistureWarnings, {
      key: "envelope.condensationMargin",
      unit: "K",
      value:
        margins === null
          ? null
          : margins.reduce(
              (sum: number, entry: IAssemblyMargin): number =>
                sum + entry.margin * entry.assembly.area,
              0,
            ) / area,
      gap: margins === null ? noDewPoint : undefined,
    }),
    metric(request, moistureWarnings, {
      key: "envelope.condensationMargin.min",
      unit: "K",
      value:
        margins === null
          ? null
          : Math.min(
              ...margins.map((entry: IAssemblyMargin): number => entry.margin),
            ),
      gap: margins === null ? noDewPoint : undefined,
    }),
    metric(request, moistureWarnings, {
      key: "envelope.condensationRisk",
      unit: "count",
      value:
        margins === null
          ? null
          : margins.filter(
              (entry: IAssemblyMargin): boolean => entry.margin <= 0,
            ).length,
      gap: margins === null ? noDewPoint : undefined,
    }),
    metric(request, moistureWarnings, {
      key: "envelope.interstitialCondensation",
      unit: "count",
      value: null,
      gap: {
        reason:
          "this solver reads no vapour resistivity, so condensation inside the build-up is not computed; only the interior surface is judged",
        remedy:
          "bind a vapour-diffusion adapter and record its result as its own run",
      },
      status: "unsupported",
    }),
  ];
  const moistureSamples: IAutoMovieAnalysisSample[] =
    margins === null
      ? []
      : margins.map(
          (entry: IAssemblyMargin): IAutoMovieAnalysisSample => ({
            id: entry.assembly.id,
            key: "envelope.condensationMargin",
            position: entry.assembly.position,
            value: entry.margin,
          }),
        );

  // Checked against both runs at once. Heat and moisture are two domains of one
  // study, so a dew-point target is not "unmatched" merely because the thermal
  // run has no such metric, and the observation belongs to whichever run a
  // reader happens to open.
  const unknown: IAutoMovieAnalysisWarning[] = [];
  warnAutoMovieAnalysisTargetKeys({
    targets: request.targets,
    keys: [...thermalMetrics, ...moistureMetrics].map(
      (entry: IAutoMovieAnalysisMetric): string => entry.key,
    ),
    warnings: unknown,
  });
  thermalWarnings.push(...unknown);
  moistureWarnings.push(...unknown);

  return {
    thermal: sealAutoMovieAnalysisRun({
      id: `${request.id}.thermal`,
      domain: "thermal",
      subject: request.subject,
      inputRevision: request.inputRevision,
      solver,
      settings,
      outcome: {
        status: "solved",
        metrics: thermalMetrics,
        samples: thermalSamples,
        warnings: thermalWarnings,
      },
    }),
    moisture: sealAutoMovieAnalysisRun({
      id: `${request.id}.moisture`,
      domain: "moisture",
      subject: request.subject,
      inputRevision: request.inputRevision,
      solver,
      settings,
      outcome: {
        status: "solved",
        metrics: moistureMetrics,
        samples: moistureSamples,
        warnings: moistureWarnings,
      },
    }),
  };
};

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

/** The canonical settings text one envelope study is digested against. */
const envelopeSettings = (
  request: IAutoMovieEnvelopeRequest,
  instant: IAutoMovieEnvironmentInstant | null,
): string =>
  JSON.stringify({
    context: request.context.id,
    instant,
    indoor: {
      airTemperature: request.indoor.airTemperature,
      relativeHumidity: request.indoor.relativeHumidity,
    },
    assemblies: request.assemblies.map(
      (assembly: IAutoMovieEnvelopeAssembly): IAutoMovieEnvelopeAssembly => ({
        id: assembly.id,
        boundary: assembly.boundary,
        layers: assembly.layers.map(
          (layer: IAutoMovieEnvelopeLayer): IAutoMovieEnvelopeLayer => ({
            id: layer.id,
            thickness: layer.thickness,
            conductivity: layer.conductivity,
          }),
        ),
        interiorFilm: assembly.interiorFilm,
        exteriorFilm: assembly.exteriorFilm,
        area: assembly.area,
        position: assembly.position,
      }),
    ),
    bridges: request.bridges.map(
      (bridge: IAutoMovieEnvelopeBridge): IAutoMovieEnvelopeBridge => ({
        id: bridge.id,
        assembly: bridge.assembly,
        linearTransmittance: bridge.linearTransmittance,
        length: bridge.length,
      }),
    ),
    targets: autoMovieAnalysisSettingsTargets(request.targets),
  });
