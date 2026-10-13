import { namedFacts, throwsError as refused } from "../internal/predicates";
import { trimProductionAudioPresentation } from "@automovie/render/node";
import { TestValidator } from "@nestia/e2e";
import { createFile } from "mp4box";

/**
 * Audio presentation trimming changes native edit metadata only when all supplied clocks and movie/track records are present and exact.
 *
 * Scenarios:
 *
 * 1. Admit a 312-sample priming trim and refuse duplicate edits.
 * 2. Refuse invalid identities/counts, fractional movie ticks and an absent real track.
 * 3. Remove mvhd from actual owned box data and verify the native missing-header refusal.
 * 4. Refuse a movie duration whose floating-point product rounds onto a
 *    whole number while the exact quotient is fractional.
 */
export const test_production_audio_presentation_trim = (): void => {
  const editFile = createFile();
  editFile.init({ brands: ["isom"], timescale: 48_000, duration: 960 });
  const editTrack = editFile.addTrack({
    type: "Opus",
    hdlr: "soun",
    timescale: 48_000,
    media_duration: 960,
    duration: 960,
  });
  TestValidator.equals(
    "audio presentation edits reject malformed clocks and duplicate edits",
    namedFacts([
      [
        "refusedTrimProductionAudioPresentationFile",
        () =>
          refused(
            () =>
              trimProductionAudioPresentation({
                file: editFile,
                track: 0,
                mediaTimescale: 48_000,
                movieTimescale: 48_000,
                primingSamples: 0,
                presentationSamples: 960,
              }),
            "finite sample counts",
          ),
      ],
      [
        "refusedTrimProductionAudioPresentationFile2",
        () =>
          refused(
            () =>
              trimProductionAudioPresentation({
                file: editFile,
                track: editTrack,
                mediaTimescale: 48_000,
                movieTimescale: 48_000,
                primingSamples: -1,
                presentationSamples: 960,
              }),
            "finite sample counts",
          ),
      ],
      [
        "refusedTrimProductionAudioPresentationFile3",
        () =>
          refused(
            () =>
              trimProductionAudioPresentation({
                file: editFile,
                track: editTrack,
                mediaTimescale: 3,
                movieTimescale: 2,
                primingSamples: 0,
                presentationSamples: 1,
              }),
            "does not land",
          ),
      ],
      [
        "refusedTrimProductionAudioPresentationFile4",
        () =>
          refused(
            () =>
              trimProductionAudioPresentation({
                file: editFile,
                track: editTrack + 1,
                mediaTimescale: 48_000,
                movieTimescale: 48_000,
                primingSamples: 0,
                presentationSamples: 960,
              }),
            "existing track",
          ),
      ],
    ]),
    {
      refusedTrimProductionAudioPresentationFile: true,
      refusedTrimProductionAudioPresentationFile2: true,
      refusedTrimProductionAudioPresentationFile3: true,
      refusedTrimProductionAudioPresentationFile4: true,
    },
  );
  trimProductionAudioPresentation({
    file: editFile,
    track: editTrack,
    mediaTimescale: 48_000,
    movieTimescale: 48_000,
    primingSamples: 312,
    presentationSamples: 960,
  });
  TestValidator.predicate(
    "audio presentation edits cannot be added twice",
    refused(
      () =>
        trimProductionAudioPresentation({
          file: editFile,
          track: editTrack,
          mediaTimescale: 48_000,
          movieTimescale: 48_000,
          primingSamples: 312,
          presentationSamples: 960,
        }),
      "already has",
    ),
  );
  const headerless = createFile();
  headerless.init({ brands: ["isom"], timescale: 48_000, duration: 960 });
  const headerlessTrack = headerless.addTrack({
    type: "Opus",
    hdlr: "soun",
    timescale: 48_000,
    media_duration: 960,
    duration: 960,
  });
  // This is the owned malformed container, not a replacement SDK method.
  // Native getBoxes traverses the writable child inventory of its moov.
  headerless.moov.boxes = headerless.moov.boxes!.filter(
    (box) => box.type !== "mvhd",
  );
  TestValidator.predicate(
    "the malformed container lacks mvhd while its real track still exists",
    headerless.getBox("mvhd") === undefined &&
      headerless.getTrackById(headerlessTrack) !== undefined,
  );
  TestValidator.predicate(
    "audio presentation edits require movie metadata",
    refused(
      () =>
        trimProductionAudioPresentation({
          file: headerless,
          track: headerlessTrack,
          mediaTimescale: 48_000,
          movieTimescale: 48_000,
          primingSamples: 0,
          presentationSamples: 960,
        }),
      "movie header",
    ),
  );

  // 3002399751580331 * 3 is 2^53 + 1, which a double rounds to 2^53, a
  // multiple of 4; the exact product leaves remainder 1 over 4.
  const rounded = createFile();
  rounded.init({ brands: ["isom"], timescale: 3, duration: 1 });
  const roundedTrack = rounded.addTrack({
    type: "Opus",
    hdlr: "soun",
    timescale: 4,
    media_duration: 1,
    duration: 1,
  });
  TestValidator.predicate(
    "a movie duration that is whole only after rounding is refused",
    refused(
      () =>
        trimProductionAudioPresentation({
          file: rounded,
          track: roundedTrack,
          mediaTimescale: 4,
          movieTimescale: 3,
          primingSamples: 0,
          presentationSamples: 3_002_399_751_580_331,
        }),
      "does not land",
    ) && rounded.getTrackById(roundedTrack).edts === undefined,
  );
};
