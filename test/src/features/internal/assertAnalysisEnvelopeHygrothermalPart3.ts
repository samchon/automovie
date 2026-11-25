import {
  AUTOMOVIE_ANALYSIS_MAX_SAMPLES,
  autoMovieDewPoint,
} from "@automovie/engine";
import type {
  IAutoMovieAnalysisRun,
  IAutoMovieEnvelopeAssembly,
  IAutoMovieEnvelopeLayer,
  IAutoMovieEnvelopeRequest,
  IAutoMovieSpaceAirRequest,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { namedFacts, nclose, throwsError } from "./predicates";

/**
 * Execute the next ordered assertions of test_analysis_envelope_hygrothermal.
 *
 * Scenarios:
 *
 * 1. Every malformed study is refused at its own message.
 *
 * The declared request requires nonblank boundaries and subjects, known context
 * instants, positive areas/conductivity/volume, nonnegative flow/generation and
 * bounded samples. Authored single-field mutations determine message fragments.
 * Direct dew-point input failures follow humidity in (0,1], without validating
 * arbitrary unknown containers. Empty/excess/duplicate assemblies and layers,
 * missing boundary, invalid films/area/conductivity, duplicate/unresolved
 * bridges, invalid bridge transmittance/length, unknown instant and duplicate
 * targets are refused. Ventilation has blank-subject, volume, flow, occupancy
 * and generation twins; direct dew point distinguishes zero humidity and
 * saturated air. Earlier parts own thermal and air arithmetic.
 */
export function assertAnalysisEnvelopeHygrothermalPart3(
  wall: IAutoMovieEnvelopeAssembly,
  study: (overrides?: Partial<IAutoMovieEnvelopeRequest>) => {
    thermal: IAutoMovieAnalysisRun;
    moisture: IAutoMovieAnalysisRun;
  },
  air: (
    overrides?: Partial<IAutoMovieSpaceAirRequest>,
  ) => IAutoMovieAnalysisRun,
): void {
  TestValidator.equals(
    "every malformed study is refused at its own message",
    namedFacts([
      [
        "unknown instant",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } => study({ instant: "dawn" }),
            "which the environment context does not declare",
          ),
      ],
      [
        "out of range indoor humidity",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                indoor: { airTemperature: 20, relativeHumidity: 1.2 },
              }),
            "indoor relative humidity must be a fraction",
          ),
      ],
      [
        "no assembly",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } => study({ assemblies: [], bridges: [] }),
            "at least one assembly",
          ),
      ],
      [
        "too many assemblies",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                assemblies: Array.from(
                  { length: AUTOMOVIE_ANALYSIS_MAX_SAMPLES + 1 },
                  (
                    _: unknown,
                    index: number,
                  ): {
                    id: string;
                    boundary: string;
                    layers: readonly IAutoMovieEnvelopeLayer[];
                    interiorFilm: number;
                    exteriorFilm: number;
                    area: number;
                    position: IAutoMovieVector3;
                  } => ({ ...wall, id: `wall-${index}` }),
                ),
                bridges: [],
              }),
            "may not exceed 4096",
          ),
      ],
      [
        "duplicated assembly",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } => study({ assemblies: [wall, wall], bridges: [] }),
            'envelope assembly "wall" is declared twice',
          ),
      ],
      [
        "non-positive film resistance",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                assemblies: [{ ...wall, interiorFilm: 0 }],
                bridges: [],
              }),
            "interiorFilm must be a finite number above zero",
          ),
      ],
      [
        "non-positive area",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } => study({ assemblies: [{ ...wall, area: -1 }], bridges: [] }),
            "area must be a finite number above zero",
          ),
      ],
      [
        "no layer",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } => study({ assemblies: [{ ...wall, layers: [] }], bridges: [] }),
            "must declare at least one layer",
          ),
      ],
      [
        "duplicated layer",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                assemblies: [
                  {
                    ...wall,
                    layers: [
                      { id: "core", thickness: 0.1, conductivity: 1 },
                      { id: "core", thickness: 0.1, conductivity: 1 },
                    ],
                  },
                ],
                bridges: [],
              }),
            "is declared twice",
          ),
      ],
      [
        "non-positive conductivity",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                assemblies: [
                  {
                    ...wall,
                    layers: [{ id: "core", thickness: 0.1, conductivity: 0 }],
                  },
                ],
                bridges: [],
              }),
            "conductivity must be a finite number above zero",
          ),
      ],
      [
        "duplicated bridge",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                bridges: [
                  {
                    id: "b",
                    assembly: "wall",
                    linearTransmittance: 0.1,
                    length: 1,
                  },
                  {
                    id: "b",
                    assembly: "wall",
                    linearTransmittance: 0.1,
                    length: 1,
                  },
                ],
              }),
            'thermal bridge "b" is declared twice',
          ),
      ],
      [
        "bridge on nothing",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                bridges: [
                  {
                    id: "b",
                    assembly: "roof",
                    linearTransmittance: 0.1,
                    length: 1,
                  },
                ],
              }),
            "which the study does not declare",
          ),
      ],
      [
        "negative bridge transmittance",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                bridges: [
                  {
                    id: "b",
                    assembly: "wall",
                    linearTransmittance: -1,
                    length: 1,
                  },
                ],
              }),
            "linear transmittance must be a finite number at or above zero",
          ),
      ],
      [
        "non-positive bridge length",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                bridges: [
                  {
                    id: "b",
                    assembly: "wall",
                    linearTransmittance: 0.1,
                    length: 0,
                  },
                ],
              }),
            "length must be a finite number above zero",
          ),
      ],
      [
        "duplicated envelope target",
        (): boolean =>
          throwsError(
            (): {
              thermal: IAutoMovieAnalysisRun;
              moisture: IAutoMovieAnalysisRun;
            } =>
              study({
                targets: [
                  {
                    key: "envelope.heatLoss",
                    unit: "W",
                    value: 1,
                    comparison: "at-most",
                  },
                  {
                    key: "envelope.heatLoss",
                    unit: "W",
                    value: 2,
                    comparison: "at-most",
                  },
                ],
              }),
            "declared more than once",
          ),
      ],
      [
        "blank ventilation id",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => air({ subject: " " }),
            "non-blank subject",
          ),
      ],
      [
        "non-positive volume",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => air({ volume: 0 }),
            "space volume must be a finite number above zero",
          ),
      ],
      [
        "negative supply flow",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => air({ supplyFlow: -1 }),
            "supply flow must be null or a finite number",
          ),
      ],
      [
        "fractional occupancy",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => air({ occupants: 1.5 }),
            "occupancy must be a whole number",
          ),
      ],
      [
        "negative generation",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => air({ occupantCarbonDioxide: -1 }),
            "occupantCarbonDioxide must be a finite number at or above zero",
          ),
      ],
      [
        "duplicated ventilation target",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              air({
                targets: [
                  {
                    key: "space.airChangeRate",
                    unit: "1/h",
                    value: 1,
                    comparison: "at-least",
                  },
                  {
                    key: "space.airChangeRate",
                    unit: "1/h",
                    value: 2,
                    comparison: "at-least",
                  },
                ],
              }),
            "declared more than once",
          ),
      ],
      [
        "a dew point of air with none",
        (): boolean =>
          throwsError(
            (): number => autoMovieDewPoint(20, 0),
            "relative humidity within (0, 1]",
          ),
      ],
      [
        "a dew point of saturated air",
        (): boolean => nclose(autoMovieDewPoint(20, 1), 20, 1e-9),
      ],
    ]),
    {
      "unknown instant": true,
      "out of range indoor humidity": true,
      "no assembly": true,
      "too many assemblies": true,
      "duplicated assembly": true,
      "non-positive film resistance": true,
      "non-positive area": true,
      "no layer": true,
      "duplicated layer": true,
      "non-positive conductivity": true,
      "duplicated bridge": true,
      "bridge on nothing": true,
      "negative bridge transmittance": true,
      "non-positive bridge length": true,
      "duplicated envelope target": true,
      "blank ventilation id": true,
      "non-positive volume": true,
      "negative supply flow": true,
      "fractional occupancy": true,
      "negative generation": true,
      "duplicated ventilation target": true,
      "a dew point of air with none": true,
      "a dew point of saturated air": true,
    },
  );
}
