import type {
  AutoMovieAnalysisDomain,
  IAutoMovieAnalysisMetric,
  IAutoMovieAnalysisRun,
  IAutoMovieAnalysisSample,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieAcousticRequest } from "../../../../packages/engine/src/analysis/IAutoMovieAcousticRequest";
import { analyzeAutoMovieAcoustics } from "../../../../packages/engine/src/analysis/analyzeAutoMovieAcoustics";
import { AUTOMOVIE_SABINE_CONSTANT } from "../../../../packages/engine/src/analysis/constants/AUTOMOVIE_SABINE_CONSTANT";
import { namedFacts, nclose } from "./predicates";

/** Execute the next ordered assertions of test_analysis_room_acoustics.
 *
 * Scenarios:
 * 1. the declared room reports Sabine, the room constant and the composite loss.
 * 2. the receiver reads the direct field plus the diffuse field exactly.
 * 3. no source and no receiver gap the level metrics for their own reasons.
 * 4. a perfectly absorbent and a perfectly reflective room each gap every diffuse-field result.
 * 5. a room that absorbs almost everything still has a reverberation time.
 * 6. a source whose power underflows to no energy leaves a gap, not minus infinity.
 *
 * The declared Sabine model gives absorption 100*0.5=50m2, T60=0.161*100/50=0.322s and room constant 100m2. Area-weighted transmission of the authored 30/10dB partitions gives 20dB, while the authored source/receiver yields 80+10log10(0.06+0.04)=70dB. These diffuse-room approximations and tolerances do not certify measured acoustics or STI.
 * Working room/receiver contrasts with missing sources/receivers, absorption endpoints 0 and 1, near-perfect absorption and finite power whose linear energy underflows. Part2 owns overflow, target/warning distinctions and partition absence; Part3 owns malformed request fields.
 */
export function assertAnalysisRoomAcousticsPart1(): {
  study: (
    overrides?: Partial<IAutoMovieAcousticRequest>,
  ) => IAutoMovieAnalysisRun;
  metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[];
  statusOf: (run: IAutoMovieAnalysisRun, key: string) => string;
} {
  const request: (
    overrides?: Partial<IAutoMovieAcousticRequest>,
  ) => IAutoMovieAcousticRequest = (
    overrides: Partial<IAutoMovieAcousticRequest> = {},
  ): IAutoMovieAcousticRequest => ({
    id: "hall-acoustics",
    subject: "space:hall",
    inputRevision: "r7",
    volume: 100,
    surfaces: [{ id: "boundaries", area: 100, absorption: 0.5 }],
    partitions: [
      { id: "wall", area: 10, transmissionLoss: 30 },
      { id: "door", area: 1, transmissionLoss: 10 },
    ],
    sources: [
      {
        id: "fan",
        position: { x: 0, y: 0, z: 0 },
        soundPower: 80,
        directivity: 0.24 * Math.PI,
      },
    ],
    receivers: [{ id: "desk", position: { x: 1, y: 0, z: 0 } }],
    targets: [],
    ...overrides,
  });
  const study: (
    overrides?: Partial<IAutoMovieAcousticRequest>,
  ) => IAutoMovieAnalysisRun = (
    overrides: Partial<IAutoMovieAcousticRequest> = {},
  ): IAutoMovieAnalysisRun =>
    analyzeAutoMovieAcoustics({ request: request(overrides) });
  const metrics: (run: IAutoMovieAnalysisRun) => IAutoMovieAnalysisMetric[] = (
    run: IAutoMovieAnalysisRun,
  ): IAutoMovieAnalysisMetric[] =>
    run.outcome.status === "solved" ? run.outcome.metrics : [];
  const of: (run: IAutoMovieAnalysisRun, key: string) => number | null = (
    run: IAutoMovieAnalysisRun,
    key: string,
  ): number | null =>
    metrics(run).find(
      (metric: IAutoMovieAnalysisMetric): boolean => metric.key === key,
    )?.value ?? null;
  const statusOf: (run: IAutoMovieAnalysisRun, key: string) => string = (
    run: IAutoMovieAnalysisRun,
    key: string,
  ): string =>
    metrics(run).find(
      (metric: IAutoMovieAnalysisMetric): boolean => metric.key === key,
    )?.status ?? "absent";

  const hall: IAutoMovieAnalysisRun = study();
  TestValidator.predicate(
    "the declared room reports Sabine, the room constant and the composite loss",
    ((): boolean => {
      const observed: {
        domain: AutoMovieAnalysisDomain;
        sabine: number;
        absorption: number | null;
        reverberation: number | null;
        constant: number | null;
        transmission: number | null;
        speech: string;
        fields: string[][];
      } = {
        domain: hall.domain,
        sabine: AUTOMOVIE_SABINE_CONSTANT,
        absorption: of(hall, "room.absorptionArea"),
        reverberation: of(hall, "room.reverberationTime"),
        constant: of(hall, "room.constant"),
        transmission: of(hall, "partition.compositeTransmissionLoss"),
        speech: statusOf(hall, "room.speechTransmissionIndex"),
        fields:
          hall.outcome.status === "solved"
            ? hall.outcome.samples.map(
                (sample: IAutoMovieAnalysisSample): string[] => [
                  sample.id,
                  sample.key,
                ],
              )
            : [],
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 8 &&
        Object.hasOwn(observed, "domain") &&
        observed["domain"] === "acoustic" &&
        Object.hasOwn(observed, "sabine") &&
        typeof observed["sabine"] === "number" &&
        nclose(observed["sabine"], 0.161) &&
        Object.hasOwn(observed, "absorption") &&
        typeof observed["absorption"] === "number" &&
        nclose(observed["absorption"], 50) &&
        Object.hasOwn(observed, "reverberation") &&
        typeof observed["reverberation"] === "number" &&
        nclose(observed["reverberation"], 0.322) &&
        Object.hasOwn(observed, "constant") &&
        typeof observed["constant"] === "number" &&
        nclose(observed["constant"], 100) &&
        Object.hasOwn(observed, "transmission") &&
        typeof observed["transmission"] === "number" &&
        nclose(observed["transmission"], 20) &&
        Object.hasOwn(observed, "speech") &&
        observed["speech"] === "unsupported" &&
        Object.hasOwn(observed, "fields") &&
        Array.isArray(observed["fields"]) &&
        observed["fields"].length === 1 &&
        Array.isArray(observed["fields"][0]!) &&
        observed["fields"][0]!.length === 2 &&
        observed["fields"][0]![0] === "desk" &&
        observed["fields"][0]![1] === "room.soundPressureLevel"
      );
    })(),
  );
  TestValidator.equals(
    "the receiver reads the direct field plus the diffuse field exactly",
    namedFacts([
      [
        "level",
        (): boolean =>
          nclose(of(hall, "room.soundPressureLevel") ?? Number.NaN, 70, 1e-9),
      ],
      [
        "max",
        (): boolean =>
          nclose(
            of(hall, "room.soundPressureLevel.max") ?? Number.NaN,
            70,
            1e-9,
          ),
      ],
      [
        "sample",
        (): boolean =>
          nclose(
            hall.outcome.status === "solved"
              ? (hall.outcome.samples[0]?.value ?? Number.NaN)
              : Number.NaN,
            70,
            1e-9,
          ),
      ],
    ]),
    { level: true, max: true, sample: true },
  );

  const silent: IAutoMovieAnalysisRun = study({ sources: [] });
  const unheard: IAutoMovieAnalysisRun = study({ receivers: [] });
  TestValidator.predicate(
    "no source and no receiver gap the level metrics for their own reasons",
    ((): boolean => {
      const observed: {
        silent: (string | number | boolean | undefined)[];
        unheard: (string | number | boolean | undefined)[];
      } = {
        silent: [
          statusOf(silent, "room.soundPressureLevel"),
          metrics(silent)
            .find(
              (metric: IAutoMovieAnalysisMetric): boolean =>
                metric.key === "room.soundPressureLevel",
            )
            ?.gap?.reason.includes("no noise source"),
          silent.outcome.status === "solved"
            ? silent.outcome.samples.length
            : -1,
        ],
        unheard: [
          statusOf(unheard, "room.soundPressureLevel.max"),
          metrics(unheard)
            .find(
              (metric: IAutoMovieAnalysisMetric): boolean =>
                metric.key === "room.soundPressureLevel.max",
            )
            ?.gap?.reason.includes("no receiver"),
          unheard.outcome.status === "solved"
            ? unheard.outcome.samples.length
            : -1,
        ],
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 2 &&
        Object.hasOwn(observed, "silent") &&
        Array.isArray(observed["silent"]) &&
        observed["silent"].length === 3 &&
        observed["silent"][0] === "not-run" &&
        observed["silent"][1] === true &&
        typeof observed["silent"][2]! === "number" &&
        nclose(observed["silent"][2]!, 0) &&
        Object.hasOwn(observed, "unheard") &&
        Array.isArray(observed["unheard"]) &&
        observed["unheard"].length === 3 &&
        observed["unheard"][0] === "not-run" &&
        observed["unheard"][1] === true &&
        typeof observed["unheard"][2]! === "number" &&
        nclose(observed["unheard"][2]!, 0)
      );
    })(),
  );

  const anechoic: IAutoMovieAnalysisRun = study({
    surfaces: [{ id: "boundaries", area: 100, absorption: 1 }],
  });
  const reflective: IAutoMovieAnalysisRun = study({
    surfaces: [{ id: "boundaries", area: 100, absorption: 0 }],
  });
  const reasonOf: (
    run: IAutoMovieAnalysisRun,
    key: string,
    phrase: string,
  ) => boolean = (
    run: IAutoMovieAnalysisRun,
    key: string,
    phrase: string,
  ): boolean =>
    metrics(run)
      .find((metric: IAutoMovieAnalysisMetric): boolean => metric.key === key)
      ?.gap?.reason.includes(phrase) ?? false;
  TestValidator.predicate(
    "a perfectly absorbent and a perfectly reflective room each gap every diffuse-field result",
    ((): boolean => {
      const observed: {
        anechoic: (string | number | boolean | null)[];
        reflective: (string | number | boolean | null)[];
      } = {
        anechoic: [
          of(anechoic, "room.absorptionArea"),
          statusOf(anechoic, "room.reverberationTime"),
          reasonOf(anechoic, "room.reverberationTime", "absorbs completely"),
          statusOf(anechoic, "room.constant"),
          reasonOf(anechoic, "room.constant", "absorbs completely"),
          statusOf(anechoic, "room.soundPressureLevel"),
        ],
        reflective: [
          of(reflective, "room.absorptionArea"),
          statusOf(reflective, "room.reverberationTime"),
          reasonOf(reflective, "room.reverberationTime", "absorbs anything"),
          statusOf(reflective, "room.constant"),
          reasonOf(reflective, "room.constant", "absorbs anything"),
          statusOf(reflective, "room.soundPressureLevel"),
        ],
      };
      return (
        typeof observed === "object" &&
        observed !== null &&
        observed !== undefined &&
        Object.keys(observed).length === 2 &&
        Object.hasOwn(observed, "anechoic") &&
        Array.isArray(observed["anechoic"]) &&
        observed["anechoic"].length === 6 &&
        typeof observed["anechoic"][0]! === "number" &&
        nclose(observed["anechoic"][0]!, 100) &&
        observed["anechoic"][1] === "not-run" &&
        observed["anechoic"][2] === true &&
        observed["anechoic"][3] === "not-run" &&
        observed["anechoic"][4] === true &&
        observed["anechoic"][5] === "not-run" &&
        Object.hasOwn(observed, "reflective") &&
        Array.isArray(observed["reflective"]) &&
        observed["reflective"].length === 6 &&
        typeof observed["reflective"][0]! === "number" &&
        nclose(observed["reflective"][0]!, 0) &&
        observed["reflective"][1] === "not-run" &&
        observed["reflective"][2] === true &&
        observed["reflective"][3] === "not-run" &&
        observed["reflective"][4] === true &&
        observed["reflective"][5] === "not-run"
      );
    })(),
  );
  // The twin one property away from the anechoic room: absorbing almost
  // everything still leaves a diffuse field, so the decay time is reported. The
  // gap above is keyed on a room that has no diffuse field at all, never on
  // absorption merely being high.
  const nearlyDead: IAutoMovieAnalysisRun = study({
    surfaces: [{ id: "boundaries", area: 100, absorption: 0.99 }],
  });
  TestValidator.equals(
    "a room that absorbs almost everything still has a reverberation time",
    namedFacts([
      [
        "reported",
        (): boolean =>
          statusOf(nearlyDead, "room.reverberationTime") === "untargeted",
      ],
      [
        "decay",
        (): boolean =>
          nclose(
            of(nearlyDead, "room.reverberationTime") ?? Number.NaN,
            (0.161 * 100) / 99,
            1e-12,
          ),
      ],
      [
        "constant",
        (): boolean =>
          nclose(of(nearlyDead, "room.constant") ?? Number.NaN, 9900, 1e-9),
      ],
    ]),
    { reported: true, decay: true, constant: true },
  );

  const mute: IAutoMovieAnalysisRun = study({
    sources: [
      {
        id: "fan",
        position: { x: 0, y: 0, z: 0 },
        soundPower: -4000,
        directivity: 1,
      },
    ],
  });
  TestValidator.equals(
    "a source whose power underflows to no energy leaves a gap, not minus infinity",
    {
      level: statusOf(mute, "room.soundPressureLevel"),
      max: statusOf(mute, "room.soundPressureLevel.max"),
      reason: metrics(mute)
        .find(
          (metric: IAutoMovieAnalysisMetric): boolean =>
            metric.key === "room.soundPressureLevel",
        )
        ?.gap?.reason.includes("no acoustic energy at all"),
      samples: mute.outcome.status === "solved" ? mute.outcome.samples : null,
    },
    { level: "not-run", max: "not-run", reason: true, samples: [] },
  );
  return { study, metrics, statusOf };
}
