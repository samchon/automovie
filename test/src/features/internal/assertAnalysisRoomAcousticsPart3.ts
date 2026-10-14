import type { IAutoMovieAnalysisRun } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import type { IAutoMovieAcousticRequest } from "@automovie/engine";
import { AUTOMOVIE_ANALYSIS_MAX_SAMPLES } from "@automovie/engine";
import { namedFacts, throwsError } from "./predicates";

/** Execute the next ordered assertions of test_analysis_room_acoustics.
 *
 * Scenarios:
 * 1. every malformed room is refused at its own message.
 *
 * Nonblank unique ids, positive finite volume/areas, absorption in [0,1], nonnegative finite loss, finite source/receiver positions and distinct source-receiver points define request admission. The sample-limit case uses the published bound and the stated 4096 message, while other numeric accuracy belongs to Part1.
 * Blank/duplicate surface, partition, source and receiver ids; zero/negative geometry; invalid absorption/loss/power/positions; empty surfaces; excess receivers; coincident source/receiver; and duplicate target keys are refused beside the earlier valid room. This does not enumerate every possible unknown JSON shape.
 */
export function assertAnalysisRoomAcousticsPart3(
  study: (
    overrides?: Partial<IAutoMovieAcousticRequest>,
  ) => IAutoMovieAnalysisRun,
): void {
  TestValidator.equals(
    "every malformed room is refused at its own message",
    namedFacts([
      [
        "blank revision",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => study({ inputRevision: " " }),
            "non-blank input revision",
          ),
      ],
      [
        "non-positive volume",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => study({ volume: 0 }),
            "room volume must be a finite number above zero",
          ),
      ],
      [
        "no surface",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun => study({ surfaces: [] }),
            "at least one absorbing surface",
          ),
      ],
      [
        "blank surface id",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({ surfaces: [{ id: "", area: 1, absorption: 0.5 }] }),
            "surface must carry a non-blank id",
          ),
      ],
      [
        "duplicated surface",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                surfaces: [
                  { id: "s", area: 1, absorption: 0.5 },
                  { id: "s", area: 1, absorption: 0.5 },
                ],
              }),
            'acoustic surface "s" is declared twice',
          ),
      ],
      [
        "non-positive surface area",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({ surfaces: [{ id: "s", area: 0, absorption: 0.5 }] }),
            "area must be a finite number above zero",
          ),
      ],
      [
        "out of range absorption",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({ surfaces: [{ id: "s", area: 1, absorption: 1.2 }] }),
            "absorption must be a fraction within [0, 1]",
          ),
      ],
      [
        "blank partition id",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                partitions: [{ id: " ", area: 1, transmissionLoss: 30 }],
              }),
            "partition must carry a non-blank id",
          ),
      ],
      [
        "duplicated partition",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                partitions: [
                  { id: "p", area: 1, transmissionLoss: 30 },
                  { id: "p", area: 1, transmissionLoss: 30 },
                ],
              }),
            'acoustic partition "p" is declared twice',
          ),
      ],
      [
        "non-positive partition area",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                partitions: [{ id: "p", area: -1, transmissionLoss: 30 }],
              }),
            "area must be a finite number above zero",
          ),
      ],
      [
        "non-finite transmission loss",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                partitions: [
                  {
                    id: "p",
                    area: 1,
                    transmissionLoss: Number.POSITIVE_INFINITY,
                  },
                ],
              }),
            "transmission loss must be finite",
          ),
      ],
      [
        "negative transmission loss",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                partitions: [{ id: "p", area: 1, transmissionLoss: -3 }],
              }),
            "transmission loss must be at or above zero",
          ),
      ],
      [
        "blank source id",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                sources: [
                  {
                    id: "",
                    position: { x: 0, y: 0, z: 0 },
                    soundPower: 80,
                    directivity: 1,
                  },
                ],
              }),
            "source must carry a non-blank id",
          ),
      ],
      [
        "duplicated source",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                sources: [
                  {
                    id: "s",
                    position: { x: 0, y: 0, z: 0 },
                    soundPower: 80,
                    directivity: 1,
                  },
                  {
                    id: "s",
                    position: { x: 0, y: 0, z: 0 },
                    soundPower: 80,
                    directivity: 1,
                  },
                ],
              }),
            'acoustic source "s" is declared twice',
          ),
      ],
      [
        "non-finite sound power",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                sources: [
                  {
                    id: "s",
                    position: { x: 0, y: 0, z: 0 },
                    soundPower: Number.NaN,
                    directivity: 1,
                  },
                ],
              }),
            "sound power must be finite",
          ),
      ],
      [
        "non-positive directivity",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                sources: [
                  {
                    id: "s",
                    position: { x: 0, y: 0, z: 0 },
                    soundPower: 80,
                    directivity: 0,
                  },
                ],
              }),
            "directivity must be a finite number above zero",
          ),
      ],
      [
        "non-finite source position",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                sources: [
                  {
                    id: "s",
                    position: { x: Number.NaN, y: 0, z: 0 },
                    soundPower: 80,
                    directivity: 1,
                  },
                ],
              }),
            "position x must be finite",
          ),
      ],
      [
        "too many receivers",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                receivers: Array.from(
                  { length: AUTOMOVIE_ANALYSIS_MAX_SAMPLES + 1 },
                  (
                    _: unknown,
                    index: number,
                  ): {
                    id: string;
                    position: { x: number; y: number; z: number };
                  } => ({
                    id: `r${index}`,
                    position: { x: index + 1, y: 0, z: 0 },
                  }),
                ),
              }),
            "may not exceed 4096",
          ),
      ],
      [
        "blank receiver id",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                receivers: [{ id: " ", position: { x: 1, y: 0, z: 0 } }],
              }),
            "receiver must carry a non-blank id",
          ),
      ],
      [
        "duplicated receiver",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                receivers: [
                  { id: "r", position: { x: 1, y: 0, z: 0 } },
                  { id: "r", position: { x: 2, y: 0, z: 0 } },
                ],
              }),
            'acoustic receiver "r" is declared twice',
          ),
      ],
      [
        "non-finite receiver position",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                receivers: [
                  { id: "r", position: { x: 1, y: Number.NaN, z: 0 } },
                ],
              }),
            "position y must be finite",
          ),
      ],
      [
        "a receiver standing on a source",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                receivers: [{ id: "r", position: { x: 0, y: 0, z: 0 } }],
              }),
            "where the inverse square law has no value",
          ),
      ],
      [
        "duplicated target",
        (): boolean =>
          throwsError(
            (): IAutoMovieAnalysisRun =>
              study({
                targets: [
                  {
                    key: "room.reverberationTime",
                    unit: "s",
                    value: 1,
                    comparison: "at-most",
                  },
                  {
                    key: "room.reverberationTime",
                    unit: "s",
                    value: 2,
                    comparison: "at-most",
                  },
                ],
              }),
            "declared more than once",
          ),
      ],
    ]),
    {
      "blank revision": true,
      "non-positive volume": true,
      "no surface": true,
      "blank surface id": true,
      "duplicated surface": true,
      "non-positive surface area": true,
      "out of range absorption": true,
      "blank partition id": true,
      "duplicated partition": true,
      "non-positive partition area": true,
      "non-finite transmission loss": true,
      "negative transmission loss": true,
      "blank source id": true,
      "duplicated source": true,
      "non-finite sound power": true,
      "non-positive directivity": true,
      "non-finite source position": true,
      "too many receivers": true,
      "blank receiver id": true,
      "duplicated receiver": true,
      "non-finite receiver position": true,
      "a receiver standing on a source": true,
      "duplicated target": true,
    },
  );
}
