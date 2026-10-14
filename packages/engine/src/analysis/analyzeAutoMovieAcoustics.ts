import {
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisMetricGap,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
  IAutoMovieAnalysisWarning,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { IAutoMovieAcousticPartition } from "./IAutoMovieAcousticPartition";
import { IAutoMovieAcousticReceiver } from "./IAutoMovieAcousticReceiver";
import { IAutoMovieAcousticRequest } from "./IAutoMovieAcousticRequest";
import { IAutoMovieAcousticSource } from "./IAutoMovieAcousticSource";
import { IAutoMovieAcousticSurface } from "./IAutoMovieAcousticSurface";
import { assertAutoMovieAnalysisTargets } from "./assertAutoMovieAnalysisTargets";
import { autoMovieAnalysisMetric } from "./autoMovieAnalysisMetric";
import { autoMovieAnalysisSettingsTargets } from "./autoMovieAnalysisSettingsTargets";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "./constants/AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { AUTOMOVIE_SABINE_CONSTANT } from "./constants/AUTOMOVIE_SABINE_CONSTANT";
import { sealAutoMovieAnalysisRun } from "./sealAutoMovieAnalysisRun";
import { warnAutoMovieAnalysisTargetKeys } from "./warnAutoMovieAnalysisTargetKeys";

/** Distances this short or shorter are the same point. */
const EPSILON: number = 1e-12;

/**
 * Solve one room for reverberation, equipment noise and partition performance.
 *
 * Three closed forms, each stated so a reader can check the arithmetic:
 *
 * - The Sabine absorption `A = sum(S * alpha)` and `T60 = 0.161 * V / A`;
 * - The room constant `R = A / (1 - alpha_mean)`, and at each receiver `Lp = 10 *
 *   log10(sum over sources of 10^(Lw/10) * (Q / (4*pi*r^2) + 4/R))`, the direct
 *   field plus the diffuse field;
 * - The composite transmission loss `R_c = -10 * log10(sum(tau * S) / sum(S))`
 *   with `tau = 10^(-R/10)`, which is why one weak panel dominates a strong
 *   wall.
 *
 * The exclusions are stated as loudly as the results. A single broadband
 * absorption coefficient cannot produce a speech transmission index, which
 * needs a modulation transfer function over an impulse response, so that metric
 * is `unsupported` rather than estimated.
 *
 * The reverberation time, the room constant and the receiver level are all
 * statements about a diffuse field, so all three gap wherever there is none: a
 * room that absorbs nothing rings forever, and a room that absorbs everything
 * never rings at all. Neither extreme is reported as a number. The second is
 * the one worth naming, because Sabine does not diverge there but keeps
 * returning `0.161 * V / A`, a positive decay time for an anechoic chamber,
 * which is the arithmetic of the model rather than a property of the room.
 *
 * A receiver whose energy underflows to zero or overflows to infinity in
 * double precision has no level, so the level metrics gap with a reason naming
 * which bound was crossed.
 *
 * Throws on a malformed request (see {@link IAutoMovieAcousticRequest}), on a
 * receiver within `1e-12` m of a source, and when the sealed run would fail
 * validation; otherwise the run is always `solved`, with one sound-pressure
 * sample per receiver when a level exists.
 *
 * @evidence contracts/common.md#principled-implementation Evaluates Sabine reverberation, the room constant with a direct-plus-diffuse receiver level, and tau-weighted composite transmission loss in closed form; each diffuse-field result assumes a diffuse field, so the zero- and full-absorption extremes become gaps, and a negative sound reduction index, which would let a partition transmit more energy than reaches it, is refused.
 * @evidence contracts/common.md#clear-and-simple-design One function owns the solve and the metric list with private helpers for the per-receiver direct field and the request check; the receiver level is split as the direct term per receiver plus one shared diffuse term, the same sum regrouped so the room-wide part is computed once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The named 0.161 coefficient selects the Sabine model; the 1e-12-metre coincidence floor is the engine's numerical policy around the inverse-square singularity. Infinite receiver levels become explicit underflow/overflow gaps, while other nonfinite arithmetic can still throw through metric admission; no room, source or receiver id is special-cased.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the three closed forms, the unsupported speech index and why, the diffuse-field gaps and why Sabine's anechoic answer is withheld, the energy-range gaps, every throwing condition and when samples exist.
 * @evidence contracts/performance.md#efficient-algorithms Cost is O(R·S) for R receivers (at most 4096) and S sources, paid once: each source's power `10^(Lw/10)` is computed once instead of per receiver, and the receiver-source distance pass both refuses coincidence and accumulates the direct field; other work is linear in surfaces, partitions and metrics times targets.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one study the absorption area and room constant serve the reverberation, room-constant and level metrics, the summed source power serves every receiver's diffuse term, and the receiver levels serve the mean, the maximum and the samples; nothing is shared across studies.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates per-call arrays of S powers and R direct terms and levels, bounded by the receiver limit and the declared sources, and keeps none of them after returning the sealed run, which owns its samples.
 * @author Samchon
 */
export const analyzeAutoMovieAcoustics: (props: { request: IAutoMovieAcousticRequest; }) => IAutoMovieAnalysisRun = (props: {
  /** Study to solve; validated in full before any arithmetic. */
  request: IAutoMovieAcousticRequest;
}): IAutoMovieAnalysisRun => {
  const request: IAutoMovieAcousticRequest = props.request;
  validateAcousticRequest(request);
  const powers: number[] = request.sources.map(
    (source: IAutoMovieAcousticSource): number =>
      Math.pow(10, source.soundPower / 10),
  );
  // Computed for every receiver even when no level will be reported, because
  // the same pass refuses a receiver standing on a source.
  const direct: number[] = request.receivers.map(
    (receiver: IAutoMovieAcousticReceiver): number =>
      directField(request.sources, powers, receiver),
  );
  const warnings: IAutoMovieAnalysisWarning[] = [];
  const area: number = request.surfaces.reduce(
    (sum: number, surface: IAutoMovieAcousticSurface): number =>
      sum + surface.area,
    0,
  );
  const absorption: number = request.surfaces.reduce(
    (sum: number, surface: IAutoMovieAcousticSurface): number =>
      sum + surface.area * surface.absorption,
    0,
  );
  const meanAbsorption: number = absorption / area;
  // A room that absorbs nothing and a room that absorbs everything both leave
  // the diffuse field without a value: one is unbounded, the other does not
  // exist. Either way the honest answer is a gap and not a number.
  const roomConstant: number | null =
    absorption === 0 || meanAbsorption === 1
      ? null
      : absorption / (1 - meanAbsorption);
  const deadRoom: IAutoMovieAnalysisMetricGap = {
    reason:
      "every surface of the room absorbs completely, so it has no diffuse field and no reverberation to measure",
    remedy:
      "declare the reflective surfaces the room actually has, or treat the space as a free field",
  };
  const liveRoom: IAutoMovieAnalysisMetricGap = {
    reason:
      "no surface of the room absorbs anything, so the reverberation time and the diffuse-field room constant are both unbounded rather than large",
    remedy:
      "declare the absorption of at least one surface, or read the room as perfectly reflective by intent",
  };
  const noDiffuseField: IAutoMovieAnalysisMetricGap =
    absorption === 0 ? liveRoom : deadRoom;

  const diffuse: number | null =
    roomConstant === null
      ? null
      : (powers.reduce((sum: number, power: number): number => sum + power, 0) *
          4) /
        roomConstant;
  const levels: number[] | null =
    diffuse === null || request.sources.length === 0
      ? null
      : direct.map((field: number): number => 10 * Math.log10(field + diffuse));
  const noField: IAutoMovieAnalysisMetricGap =
    request.sources.length === 0
      ? {
          reason:
            "the room declares no noise source, so there is no equipment sound pressure level to report",
          remedy:
            "declare the sound power of the plant serving this space, or stop requesting an equipment noise metric",
        }
      : noDiffuseField;
  const noReceiver: IAutoMovieAnalysisMetricGap = {
    reason:
      "the room declares no receiver, so no sound pressure level was evaluated anywhere",
    remedy: "declare at least one listening position inside the space",
  };
  // A decibel is a ratio, and the ratio of nothing has no logarithm. A source
  // whose declared power underflows to zero energy leaves a receiver with no
  // level at all, which is a gap and not the very large negative number the
  // arithmetic would otherwise hand back; a power that overflows is the same
  // fault at the other end of the range.
  const silent: boolean =
    levels !== null &&
    levels.some((level: number): boolean => level === -Infinity);
  const deafening: boolean =
    levels !== null &&
    levels.some((level: number): boolean => level === Infinity);
  const audible: number[] | null =
    levels === null || levels.length === 0 || silent || deafening
      ? null
      : levels;
  const levelGap: IAutoMovieAnalysisMetricGap | undefined =
    levels === null
      ? noField
      : levels.length === 0
        ? noReceiver
        : silent
          ? {
              reason:
                "a receiver reads no acoustic energy at all, so its sound pressure level is not a number; every declared source is silent to the limits of double precision",
              remedy:
                "declare the sound power the plant serving this space actually radiates",
            }
          : deafening
            ? {
                reason:
                  "a receiver's acoustic energy exceeds the range of double precision, so its sound pressure level is not a number",
                remedy:
                  "declare the sound power the plant serving this space actually radiates",
              }
            : undefined;

  const transmissionArea: number = request.partitions.reduce(
    (sum: number, partition: IAutoMovieAcousticPartition): number =>
      sum + partition.area,
    0,
  );
  const transmittance: number | null =
    request.partitions.length === 0
      ? null
      : request.partitions.reduce(
          (sum: number, partition: IAutoMovieAcousticPartition): number =>
            sum +
            partition.area * Math.pow(10, -partition.transmissionLoss / 10),
          0,
        ) / transmissionArea;

  const metric: (entry: { key: string; unit: string; value: number | null; gap?: IAutoMovieAnalysisMetricGap; status?: "unsupported" | "not-run"; }) => IAutoMovieAnalysisMetric = (entry: {
    key: string;
    unit: string;
    value: number | null;
    gap?: IAutoMovieAnalysisMetricGap;
    status?: "unsupported" | "not-run";
  }): IAutoMovieAnalysisMetric =>
    autoMovieAnalysisMetric({
      key: entry.key,
      unit: entry.unit,
      value: entry.value,
      targets: request.targets,
      warnings,
      gap: entry.gap,
      status: entry.status,
    });

  const metrics: IAutoMovieAnalysisMetric[] = [
    metric({ key: "room.absorptionArea", unit: "m2sab", value: absorption }),
    metric({
      key: "room.reverberationTime",
      unit: "s",
      // Sabine's decay is a statement about a diffuse field, so it is reported
      // exactly where one exists and nowhere else. A room that absorbs nothing
      // never stops ringing; a room that absorbs everything never rings at all,
      // and there the equation still hands back 0.161*V/A, a positive decay
      // time for an anechoic chamber. That number is an artefact of the model
      // rather than a property of the room, and reporting it beside a gap that
      // says the room has no reverberation would make one run answer its own
      // question twice.
      value:
        roomConstant === null
          ? null
          : (AUTOMOVIE_SABINE_CONSTANT * request.volume) / absorption,
      gap: roomConstant === null ? noDiffuseField : undefined,
    }),
    metric({
      key: "room.constant",
      unit: "m2",
      value: roomConstant,
      gap: roomConstant === null ? noDiffuseField : undefined,
    }),
    metric({
      key: "room.soundPressureLevel",
      unit: "dB",
      value:
        audible === null
          ? null
          : 10 *
            Math.log10(
              audible.reduce(
                (sum: number, level: number): number =>
                  sum + Math.pow(10, level / 10),
                0,
              ) / audible.length,
            ),
      gap: levelGap,
    }),
    metric({
      key: "room.soundPressureLevel.max",
      unit: "dB",
      value: audible === null ? null : Math.max(...audible),
      gap: levelGap,
    }),
    metric({
      key: "partition.compositeTransmissionLoss",
      unit: "dB",
      value:
        transmittance === null || transmittance === 0
          ? null
          : -10 * Math.log10(transmittance),
      gap:
        transmittance === null
          ? {
              reason:
                "the study declares no partition, so there is no composite transmission loss to compute",
              remedy:
                "declare the partitions enclosing the space and the sound reduction index of each",
            }
          : transmittance === 0
            ? {
                reason:
                  "every declared partition transmits nothing at all, so the composite loss is unbounded rather than large",
                remedy:
                  "declare the finite sound reduction index each partition actually achieves",
              }
            : undefined,
    }),
    metric({
      key: "room.speechTransmissionIndex",
      unit: "ratio",
      value: null,
      gap: {
        reason:
          "a speech transmission index needs a modulation transfer function over an impulse response, and this host computes a broadband Sabine estimate only",
        remedy:
          "bind a room impulse-response adapter and record its result as its own run",
      },
      status: "unsupported",
    }),
  ];
  warnAutoMovieAnalysisTargetKeys({
    targets: request.targets,
    keys: metrics.map((entry: IAutoMovieAnalysisMetric): string => entry.key),
    warnings,
  });
  const samples: IAutoMovieAnalysisSample[] =
    audible === null
      ? []
      : request.receivers.map(
          (
            receiver: IAutoMovieAcousticReceiver,
            index: number,
          ): IAutoMovieAnalysisSample => ({
            id: receiver.id,
            key: "room.soundPressureLevel",
            position: receiver.position,
            value: audible[index]!,
          }),
        );

  return sealAutoMovieAnalysisRun({
    id: request.id,
    domain: "acoustic",
    subject: request.subject,
    inputRevision: request.inputRevision,
    solver: {
      id: "automovie.acoustic.sabine-diffuse-field",
      version: "1",
      model:
        "Sabine A=sum(S*alpha), T60=0.161V/A, room constant R=A/(1-alpha_mean), Lp=10log10(sum 10^(Lw/10)*(Q/(4 pi r^2)+4/R)), composite tau-weighted transmission loss; no impulse response, so speech intelligibility is unsupported",
    },
    settings: acousticSettings(request),
    outcome: { status: "solved", metrics, samples, warnings },
  });
};

/**
 * Sum precomputed source power times directivity over 4*pi*r^2 at one receiver, refusing distances at or below 1e-12 metres. Typed admitted positions and matching source/power order are premises; intermediate overflow or underflow is not repaired.
 *
 * One source scan reuses the study's powers and retains only a scalar accumulator; the caller owns the borrowed lists and handles nonfinite derived levels.
 */
const directField: (sources: readonly IAutoMovieAcousticSource[], powers: readonly number[], receiver: IAutoMovieAcousticReceiver) => number = (
  sources: readonly IAutoMovieAcousticSource[],
  powers: readonly number[],
  receiver: IAutoMovieAcousticReceiver,
): number => {
  let energy: number = 0;
  sources.forEach((source: IAutoMovieAcousticSource, index: number): void => {
    const distance: number = Vector3.length(
      Vector3.subtract(receiver.position, source.position),
    );
    if (distance <= EPSILON)
      throw new Error(
        `acoustic receiver "${receiver.id}" sits on source "${source.id}", where the inverse square law has no value`,
      );
    energy +=
      (powers[index]! * source.directivity) /
      (4 * Math.PI * distance * distance);
  });
  return energy;
};

/**
 * Check headers, positive volume/surface areas, absorption fractions, nonnegative transmission loss, finite source fields and receiver positions; per-list ids are unique and receiver count is capped. Throws the first defect without modifying inputs; nested typed shape is assumed and derived energy is unchecked.
 *
 * Linear member/target scans use per-list id sets, released on return or throw; no validation result persists across studies.
 */
const validateAcousticRequest: (request: IAutoMovieAcousticRequest) => void = (request: IAutoMovieAcousticRequest): void => {
  for (const [label, value] of [
    ["id", request.id],
    ["subject", request.subject],
    ["input revision", request.inputRevision],
  ] as const)
    if (value.trim().length === 0)
      throw new Error(`an acoustic study must state a non-blank ${label}`);
  if (!Number.isFinite(request.volume) || request.volume <= 0)
    throw new Error(
      `a room volume must be a finite number above zero, but was ${request.volume}`,
    );
  if (request.surfaces.length === 0)
    throw new Error("an acoustic study needs at least one absorbing surface");
  const surfaces: Set<string> = new Set<string>();
  for (const surface of request.surfaces) {
    if (surface.id.trim().length === 0)
      throw new Error("every acoustic surface must carry a non-blank id");
    if (surfaces.has(surface.id))
      throw new Error(`acoustic surface "${surface.id}" is declared twice`);
    surfaces.add(surface.id);
    if (!Number.isFinite(surface.area) || surface.area <= 0)
      throw new Error(
        `acoustic surface "${surface.id}" area must be a finite number above zero, but was ${surface.area}`,
      );
    if (
      !Number.isFinite(surface.absorption) ||
      surface.absorption < 0 ||
      surface.absorption > 1
    )
      throw new Error(
        `acoustic surface "${surface.id}" absorption must be a fraction within [0, 1], but was ${surface.absorption}`,
      );
  }
  const partitions: Set<string> = new Set<string>();
  for (const partition of request.partitions) {
    if (partition.id.trim().length === 0)
      throw new Error("every acoustic partition must carry a non-blank id");
    if (partitions.has(partition.id))
      throw new Error(`acoustic partition "${partition.id}" is declared twice`);
    partitions.add(partition.id);
    if (!Number.isFinite(partition.area) || partition.area <= 0)
      throw new Error(
        `acoustic partition "${partition.id}" area must be a finite number above zero, but was ${partition.area}`,
      );
    if (!Number.isFinite(partition.transmissionLoss))
      throw new Error(
        `acoustic partition "${partition.id}" transmission loss must be finite, but was ${partition.transmissionLoss}`,
      );
    if (partition.transmissionLoss < 0)
      throw new Error(
        `acoustic partition "${partition.id}" transmission loss must be at or above zero, because a partition cannot transmit more energy than reaches it, but was ${partition.transmissionLoss}`,
      );
  }
  const sources: Set<string> = new Set<string>();
  for (const source of request.sources) {
    if (source.id.trim().length === 0)
      throw new Error("every acoustic source must carry a non-blank id");
    if (sources.has(source.id))
      throw new Error(`acoustic source "${source.id}" is declared twice`);
    sources.add(source.id);
    if (!Number.isFinite(source.soundPower))
      throw new Error(
        `acoustic source "${source.id}" sound power must be finite, but was ${source.soundPower}`,
      );
    if (!Number.isFinite(source.directivity) || source.directivity <= 0)
      throw new Error(
        `acoustic source "${source.id}" directivity must be a finite number above zero, but was ${source.directivity}`,
      );
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(source.position[axis]))
        throw new Error(
          `acoustic source "${source.id}" position ${axis} must be finite, but was ${source.position[axis]}`,
        );
  }
  if (request.receivers.length > AUTOMOVIE_ANALYSIS_MAX_SAMPLES)
    throw new Error(
      `an acoustic study carries one sample per receiver and may not exceed ${AUTOMOVIE_ANALYSIS_MAX_SAMPLES}, but had ${request.receivers.length}`,
    );
  const receivers: Set<string> = new Set<string>();
  for (const receiver of request.receivers) {
    if (receiver.id.trim().length === 0)
      throw new Error("every acoustic receiver must carry a non-blank id");
    if (receivers.has(receiver.id))
      throw new Error(`acoustic receiver "${receiver.id}" is declared twice`);
    receivers.add(receiver.id);
    for (const axis of ["x", "y", "z"] as const)
      if (!Number.isFinite(receiver.position[axis]))
        throw new Error(
          `acoustic receiver "${receiver.id}" position ${axis} must be finite, but was ${receiver.position[axis]}`,
        );
  }
  assertAutoMovieAnalysisTargets(request.targets);
};

/**
 * Serialize the study's physical fields and projected targets in fixed list/field order, omitting run header identity. Position records are borrowed into the serialization, so extra fields or custom serialization hooks on them can affect text; this is not arbitrary-object canonicalization.
 *
 * Linear encoded-entry/text work creates temporary mapped records and one returned string, with no cache or retained request after hashing.
 */
const acousticSettings: (request: IAutoMovieAcousticRequest) => string = (request: IAutoMovieAcousticRequest): string =>
  JSON.stringify({
    volume: request.volume,
    surfaces: request.surfaces.map(
      (surface: IAutoMovieAcousticSurface): IAutoMovieAcousticSurface => ({
        id: surface.id,
        area: surface.area,
        absorption: surface.absorption,
      }),
    ),
    partitions: request.partitions.map(
      (partition: IAutoMovieAcousticPartition): IAutoMovieAcousticPartition => ({
        id: partition.id,
        area: partition.area,
        transmissionLoss: partition.transmissionLoss,
      }),
    ),
    sources: request.sources.map(
      (source: IAutoMovieAcousticSource): IAutoMovieAcousticSource => ({
        id: source.id,
        position: source.position,
        soundPower: source.soundPower,
        directivity: source.directivity,
      }),
    ),
    receivers: request.receivers.map(
      (receiver: IAutoMovieAcousticReceiver): IAutoMovieAcousticReceiver => ({
        id: receiver.id,
        position: receiver.position,
      }),
    ),
    targets: autoMovieAnalysisSettingsTargets(request.targets),
  });
