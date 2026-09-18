import { IAutoMovieAnalysisMetric, IAutoMovieAnalysisMetricGap, IAutoMovieAnalysisRun, IAutoMovieAnalysisSample, IAutoMovieAnalysisWarning } from "@automovie/interface";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";
import { autoMovieEnvironmentInstant } from "./autoMovieEnvironmentInstant";
import { IAutoMovieEnvelopeRequest } from "./IAutoMovieEnvelopeRequest";

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
 *   temperature factor `fRsi = (Tsi - Te) / (Ti - Te)` reduces exactly to `1 -
 *   U
 *
 *   - Rsi` and needs no temperatures at all;
 * - Fabric loss is `sum(U * A) * dT` and linear bridges add `sum(psi * L) * dT`;
 * - The dew point comes from the Magnus form, `gamma = ln(RH) + a*T/(b+T)` and
 *   `Td = b*gamma/(a - gamma)`, and surface condensation is `Tsi <= Td`.
 *
 * What it does not do, it says. Transient storage, vapour diffusion through the
 * build-up and solar gain through glazing each appear as an `unsupported`
 * metric with the exact reason, because an envelope study that quietly omitted
 * them would read as a complete answer.
 *
 * Without an exterior boundary condition there is no answer at all, and both
 * runs come back `not-run` naming the missing input rather than assuming a
 * temperature nobody declared.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `analyzeAutoMovieEnvelope` computes steady fabric and bridge loads plus surface condensation risk, and names transient, vapour, and solar claims it does not solve.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The solver validates the resolved envelope network, evaluates resistance and Magnus equations, and seals separate thermal and moisture results over identical settings.
 * @author Samchon
 */
export const analyzeAutoMovieEnvelope = (props: {
  request: IAutoMovieEnvelopeRequest;
}): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun } => {
  const request = props.request;
  validateEnvelopeRequest(request);
  // Resolved before the settings text, because the request validator already
  // refused an instant the context does not declare; a second lookup would add
  // an unreachable fallback nobody can test.
  const instant =
    request.instant === null
      ? null
      : autoMovieEnvironmentInstant(request.context, request.instant)!;
  const settings = envelopeSettings(request, instant);
  const solver = {
    id: "automovie.envelope.steady-state-1d",
    version: "1",
    model:
      "1D steady-state resistance network U=1/(Rsi+sum(t/lambda)+Rse), surface Tsi=Ti-U*Rsi*(Ti-Te), Magnus dew point; transient storage, vapour diffusion and solar gain excluded",
  };
  const exterior = exteriorTemperature(instant);
  if (exterior === null) {
    const missing =
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

  const indoor = request.indoor.airTemperature;
  const delta = indoor - exterior;
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

  const solved = request.assemblies.map((assembly) => {
    const resistance =
      assembly.interiorFilm +
      assembly.layers.reduce(
        (sum, layer) => sum + layer.thickness / layer.conductivity,
        0,
      ) +
      assembly.exteriorFilm;
    const transmittance = 1 / resistance;
    return {
      assembly,
      transmittance,
      temperatureFactor: 1 - transmittance * assembly.interiorFilm,
      surface: indoor - transmittance * assembly.interiorFilm * delta,
    };
  });
  const area = solved.reduce((sum, entry) => sum + entry.assembly.area, 0);
  const fabric = solved.reduce(
    (sum, entry) => sum + entry.transmittance * entry.assembly.area,
    0,
  );
  const bridge = request.bridges.reduce(
    (sum, entry) => sum + entry.linearTransmittance * entry.length,
    0,
  );
  const heatLoss = (fabric + bridge) * delta;
  const bridgeLoss = bridge * delta;

  const thermalMetrics: IAutoMovieAnalysisMetric[] = [
    metric(request, thermalWarnings, {
      key: "envelope.thermalTransmittance.areaWeighted",
      unit: "W/(m2*K)",
      value: fabric / area,
    }),
    metric(request, thermalWarnings, {
      key: "envelope.thermalTransmittance.max",
      unit: "W/(m2*K)",
      value: Math.max(...solved.map((entry) => entry.transmittance)),
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
      value: Math.min(...solved.map((entry) => entry.temperatureFactor)),
    }),
    metric(request, thermalWarnings, {
      key: "envelope.surfaceTemperature",
      unit: "degC",
      value:
        solved.reduce(
          (sum, entry) => sum + entry.surface * entry.assembly.area,
          0,
        ) / area,
    }),
    metric(request, thermalWarnings, {
      key: "envelope.surfaceTemperature.min",
      unit: "degC",
      value: Math.min(...solved.map((entry) => entry.surface)),
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
  const thermalSamples: IAutoMovieAnalysisSample[] = solved.map((entry) => ({
    id: entry.assembly.id,
    key: "envelope.surfaceTemperature",
    position: entry.assembly.position,
    value: entry.surface,
  }));

  const humidity = request.indoor.relativeHumidity;
  const dewPoint = humidity === 0 ? null : magnusDewPoint(indoor, humidity);
  const noDewPoint: IAutoMovieAnalysisMetricGap = {
    reason:
      "the indoor air declares 0 relative humidity, which has no dew point at any temperature",
    remedy:
      "declare the indoor relative humidity the space is actually conditioned to",
  };
  const margins =
    dewPoint === null
      ? null
      : solved.map((entry) => ({
          assembly: entry.assembly,
          margin: entry.surface - dewPoint,
        }));
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
              (sum, entry) => sum + entry.margin * entry.assembly.area,
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
          : Math.min(...margins.map((entry) => entry.margin)),
      gap: margins === null ? noDewPoint : undefined,
    }),
    metric(request, moistureWarnings, {
      key: "envelope.condensationRisk",
      unit: "count",
      value:
        margins === null
          ? null
          : margins.filter((entry) => entry.margin <= 0).length,
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
      : margins.map((entry) => ({
          id: entry.assembly.id,
          key: "envelope.condensationMargin",
          position: entry.assembly.position,
          value: entry.margin,
        }));

  // Checked against both runs at once. Heat and moisture are two domains of one
  // study, so a dew-point target is not "unmatched" merely because the thermal
  // run has no such metric, and the observation belongs to whichever run a
  // reader happens to open.
  const reported = [...thermalMetrics, ...moistureMetrics].map(
    (entry) => entry.key,
  );
  for (const sink of [thermalWarnings, moistureWarnings])
    warnAutoMovieAnalysisTargetKeys({
      targets: request.targets,
      keys: reported,
      warnings: sink,
    });

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
