import { nclose, throwsError as refused } from "../internal/predicates";
import type { IAutoMovieProductionMediaProbe } from "@automovie/interface";
import { probeProductionMedia } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { productionWebVtt } from "../internal/productionMedia/productionWebVtt";

const summarizeWebVtt = (probe: IAutoMovieProductionMediaProbe) => {
  TestValidator.predicate("the arranged caption input produces WebVTT",probe.kind === "webvtt");
  const caption = probe as Extract<IAutoMovieProductionMediaProbe,{kind:"webvtt"}>;
  return {
    kind: caption.kind,
    cueCount: caption.cueCount,
    firstCueSeconds: caption.firstCueSeconds,
    lastCueSeconds: caption.lastCueSeconds,
  };
};

/** Compare counts exactly and seconds numerically without loosening precision. */
const assertWebVtt = (
  title: string,
  actual: ReturnType<typeof summarizeWebVtt>,
  expected: ReturnType<typeof summarizeWebVtt>,
): void => {
  TestValidator.equals(title,{kind:actual.kind,cueCount:actual.cueCount},
    {kind:expected.kind,cueCount:expected.cueCount});
  TestValidator.predicate(title+" has exact cue seconds",
    nclose(actual.firstCueSeconds,expected.firstCueSeconds,0) &&
    nclose(actual.lastCueSeconds,expected.lastCueSeconds,0));
};

/**
 * Caption evidence follows the admitted WebVTT grammar, cue payload and deterministic millisecond ordering.
 *
 * Scenarios:
 *
 * 1. Read explicit cues and legal metadata, identifiers, Unicode settings and payload whitespace.
 * 2. Refuse invalid header/type/UTF-8, malformed timing, empty or unordered cues and missing separators.
 */
export const test_production_webvtt_probe = (): void => {
  const vtt = productionWebVtt();
  assertWebVtt(
    "the WebVTT probe counts observable cues",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: vtt,
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 2,
      firstCueSeconds: 0,
      lastCueSeconds: 0.1,
    },
  );
  assertWebVtt(
    "WebVTT metadata blocks are ignored before observable cues are counted",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from(
          "WEBVTT\n\nNOTE production metadata\nnot a cue\n\n00:00:00.000 --> 00:00:00.100\nVisible.\n",
        ),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 1,
      firstCueSeconds: 0,
      lastCueSeconds: 0.1,
    },
  );
  TestValidator.predicate(
    "captions cannot relabel WebVTT bytes",
    refused(
      () =>
        probeProductionMedia({
          kind: "captions",
          mediaType: "text/plain",
          bytes: vtt,
        }),
      "require text/vtt",
    ),
  );
  TestValidator.predicate(
    "caption bytes require a WebVTT header",
    refused(
      () =>
        probeProductionMedia({
          kind: "captions",
          mediaType: "text/vtt",
          bytes: Buffer.from("00:00:00.000 --> 00:00:00.100\nNo header.\n"),
        }),
      "valid WebVTT header",
    ),
  );
  const invalidWebVttCases = [
    {
      bytes: "WEBVTT\n\n",
      message: "no timed cue",
    },
    {
      bytes:
        "WEBVTT\n\n00:00.000 --> 00:00.250\nValid.\n\nStray untimed payload.\n",
      message: "neither a timed cue",
    },
    {
      bytes: "WEBVTT\n\n00:00:00 --> 00:00:00.100\nMalformed.\n",
      message: "malformed",
    },
    {
      bytes: "WEBVTT\n\n00:00.000\u2028-->\u202900:00.250\nMalformed.\n",
      message: "malformed",
    },
    {
      bytes: "WEBVTT\n\n00:00.000 --> 00:00.250 --> invalid\nMalformed.\n",
      message: "malformed",
    },
    {
      bytes: "WEBVTT\n\n00:00:00.100 --> 00:00:00.100\nZero.\n",
      message: "must end after",
    },
    {
      bytes: "WEBVTT\n\n00:00:00.000 --> 00:00:00.100\n\n",
      message: "no non-empty payload",
    },
    {
      bytes:
        "WEBVTT\n\n00:00.000 --> 00:00.250\nFirst.\n00:00.250 --> 00:00.500\nSecond.\n",
      message: "without a blank separator",
    },
    {
      bytes:
        "WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nLater.\n\n00:00.500 --> 00:00.750\nEarlier.\n",
      message: "starts before",
    },
  ];
  TestValidator.predicate(
    "WebVTT cues must be non-empty, syntactically valid, positive and ordered",
    invalidWebVttCases.every((item) =>
      refused(
        () =>
          probeProductionMedia({
            kind: "captions",
            mediaType: "text/vtt",
            bytes: Buffer.from(item.bytes),
          }),
        item.message,
      ),
    ),
  );
  TestValidator.predicate(
    "WebVTT bytes must be valid UTF-8",
    refused(
      () =>
        probeProductionMedia({
          kind: "captions",
          mediaType: "text/vtt",
          bytes: Buffer.concat([
            Buffer.from("WEBVTT\n\n00:00.000 --> 00:00.250\nInvalid byte: "),
            Buffer.from([0xc3]),
            Buffer.from("\n"),
          ]),
        }),
      "valid UTF-8",
    ),
  );
  assertWebVtt(
    "WebVTT accepts the standard timestamp form without an hour field",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from(
          "WEBVTT\n\n00:00.000 --> 00:00.250\nShort timestamp.\n",
        ),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 1,
      firstCueSeconds: 0,
      lastCueSeconds: 0.25,
    },
  );
  assertWebVtt(
    "WebVTT accepts one cue identifier before observable payload",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from(
          "WEBVTT\n\nopening-line\n00:00.000 --> 00:00.250\nSignal.\n",
        ),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 1,
      firstCueSeconds: 0,
      lastCueSeconds: 0.25,
    },
  );
  assertWebVtt(
    "WebVTT settings preserve legal Unicode line-separator characters",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from(
          "WEBVTT\n\n00:00.000 --> 00:00.250 region:zone\u2028\u2029\nSignal.\n",
        ),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 1,
      firstCueSeconds: 0,
      lastCueSeconds: 0.25,
    },
  );
  assertWebVtt(
    "WebVTT preserves whitespace-only payload lines inside one cue",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from(
          "WEBVTT\n\n00:00.000 --> 00:00.250\nFirst.\n \nSecond.\n",
        ),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 1,
      firstCueSeconds: 0,
      lastCueSeconds: 0.25,
    },
  );
  assertWebVtt(
    "WebVTT metadata tokens remain legal timed cue identifiers",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from(
          "WEBVTT\n\nNOTE\n00:00.000 --> 00:00.100\nFirst.\n\nSTYLE intro\n00:00.100 --> 00:00.200\nSecond.\n\nREGION intro\n00:00.200 --> 00:00.300\nThird.\n",
        ),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 3,
      firstCueSeconds: 0,
      lastCueSeconds: 0.3,
    },
  );
  assertWebVtt(
    "WebVTT treats a whitespace-only separator as a cue boundary",
    summarizeWebVtt(
      probeProductionMedia({
        kind: "captions",
        mediaType: "text/vtt",
        bytes: Buffer.from("WEBVTT\n \n00:00.000 --> 00:00.250\nSignal.\n"),
      }),
    ),
    {
      kind: "webvtt",
      cueCount: 1,
      firstCueSeconds: 0,
      lastCueSeconds: 0.25,
    },
  );


};
