import type { IAutoMovieAnalysisRun, IAutoMovieVector3 } from "@automovie/interface";
import type { IAutoMovieEnvelopeAssembly } from "../../../../packages/engine/src/analysis/IAutoMovieEnvelopeAssembly";
import type { IAutoMovieEnvelopeRequest } from "../../../../packages/engine/src/analysis/IAutoMovieEnvelopeRequest";
import type { IAutoMovieSpaceAirRequest } from "../../../../packages/engine/src/analysis/IAutoMovieSpaceAirRequest";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "../../../../packages/engine/src/analysis/constants/AUTOMOVIE_ANALYSIS_MAX_SAMPLES";
import { autoMovieDewPoint } from "../../../../packages/engine/src/analysis/autoMovieDewPoint";
import { TestValidator } from "@nestia/e2e";
import { analysisContext } from "./analysisFixtures";
import { namedFacts, nclose, throwsError } from "./predicates";
import type { IAutoMovieEnvelopeLayer } from "../../../../packages/engine/src/analysis/IAutoMovieEnvelopeLayer";

/** Execute the next ordered assertions of test_analysis_envelope_hygrothermal.
 *
 * Scenarios:
 * 1. every malformed study is refused at its own message.
 *
 * The declared request requires nonblank identities, known context instants, finite positive areas/conductivity/volume, nonnegative flow/generation and bounded samples. Authored single-field mutations determine message fragments. Direct dew-point input failures follow finite temperature and humidity in (0,1], without validating arbitrary unknown containers.
 * Empty/excess/duplicate/blank assemblies and layers, missing boundary, invalid films/area/conductivity/position, blank/duplicate/unresolved bridges, invalid bridge transmittance/length, malformed context/instant and duplicate targets are refused. Ventilation has blank-id, volume, flow, occupancy, generation and outdoor-concentration twins; direct dew point distinguishes zero humidity, nonfinite temperature and saturated air. Earlier parts own thermal and air arithmetic.
 */
export function assertAnalysisEnvelopeHygrothermalPart3(wall: IAutoMovieEnvelopeAssembly, study: (overrides?: Partial<IAutoMovieEnvelopeRequest>) => { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; }, air: (overrides?: Partial<IAutoMovieSpaceAirRequest>) => IAutoMovieAnalysisRun): void {


  TestValidator.equals(
    "every malformed study is refused at its own message",
    namedFacts([
      [
        "blank envelope id",
        (): boolean => throwsError((): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ id: "" }), "non-blank id"),
      ],
      [
        "invalid context",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({
                context: analysisContext({
                  units: "foot" as unknown as "meter",
                }),
              }),
            "invalid environment context",
          ),
      ],
      [
        "unknown instant",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ instant: "dawn" }),
            "which the environment context does not declare",
          ),
      ],
      [
        "non-finite indoor temperature",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({
                indoor: { airTemperature: Number.NaN, relativeHumidity: 0.5 },
              }),
            "indoor air temperature must be finite",
          ),
      ],
      [
        "out of range indoor humidity",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ assemblies: [], bridges: [] }),
            "at least one assembly",
          ),
      ],
      [
        "too many assemblies",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({
                assemblies: Array.from(
                  { length: AUTOMOVIE_ANALYSIS_MAX_SAMPLES + 1 },
                  (_: unknown, index: number): { id: string; boundary: string; layers: readonly IAutoMovieEnvelopeLayer[]; interiorFilm: number; exteriorFilm: number; area: number; position: IAutoMovieVector3; } => ({ ...wall, id: `wall-${index}` }),
                ),
                bridges: [],
              }),
            "may not exceed 4096",
          ),
      ],
      [
        "blank assembly id",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ assemblies: [{ ...wall, id: " " }], bridges: [] }),
            "assembly must carry a non-blank id",
          ),
      ],
      [
        "duplicated assembly",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ assemblies: [wall, wall], bridges: [] }),
            'envelope assembly "wall" is declared twice',
          ),
      ],
      [
        "assembly without a boundary",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({ assemblies: [{ ...wall, boundary: "" }], bridges: [] }),
            "must name the boundary it realizes",
          ),
      ],
      [
        "non-positive film resistance",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ assemblies: [{ ...wall, area: -1 }], bridges: [] }),
            "area must be a finite number above zero",
          ),
      ],
      [
        "non-finite assembly position",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({
                assemblies: [
                  { ...wall, position: { x: 0, y: 0, z: Number.NaN } },
                ],
                bridges: [],
              }),
            "position z must be finite",
          ),
      ],
      [
        "no layer",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } => study({ assemblies: [{ ...wall, layers: [] }], bridges: [] }),
            "must declare at least one layer",
          ),
      ],
      [
        "blank layer id",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({
                assemblies: [
                  {
                    ...wall,
                    layers: [{ id: "", thickness: 0.1, conductivity: 1 }],
                  },
                ],
                bridges: [],
              }),
            "must carry a non-blank id",
          ),
      ],
      [
        "duplicated layer",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
        "blank bridge id",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
              study({
                bridges: [
                  {
                    id: "",
                    assembly: "wall",
                    linearTransmittance: 0.1,
                    length: 1,
                  },
                ],
              }),
            "thermal bridge must carry a non-blank id",
          ),
      ],
      [
        "duplicated bridge",
        (): boolean =>
          throwsError(
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
            (): { thermal: IAutoMovieAnalysisRun; moisture: IAutoMovieAnalysisRun; } =>
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
        (): boolean => throwsError((): IAutoMovieAnalysisRun => air({ subject: " " }), "non-blank subject"),
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
        "negative outdoor concentration",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => air({ outdoorCarbonDioxide: Number.NaN }),
            "outdoorCarbonDioxide must be a finite number at or above zero",
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
        "a dew point of impossible air",
        (): boolean =>
          throwsError(
            (): number => autoMovieDewPoint(Number.NaN, 0.5),
            "finite air temperature",
          ),
      ],
      [
        "a dew point of saturated air",
        (): boolean => nclose(autoMovieDewPoint(20, 1), 20, 1e-9),
      ],
    ]),
    {
      "blank envelope id": true,
      "invalid context": true,
      "unknown instant": true,
      "non-finite indoor temperature": true,
      "out of range indoor humidity": true,
      "no assembly": true,
      "too many assemblies": true,
      "blank assembly id": true,
      "duplicated assembly": true,
      "assembly without a boundary": true,
      "non-positive film resistance": true,
      "non-positive area": true,
      "non-finite assembly position": true,
      "no layer": true,
      "blank layer id": true,
      "duplicated layer": true,
      "non-positive conductivity": true,
      "blank bridge id": true,
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
      "negative outdoor concentration": true,
      "duplicated ventilation target": true,
      "a dew point of air with none": true,
      "a dew point of impossible air": true,
      "a dew point of saturated air": true,
    },
  );
}
