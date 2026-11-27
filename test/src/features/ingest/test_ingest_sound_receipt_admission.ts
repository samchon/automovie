import { AutoMovieIngestAudio } from "@automovie/ingest";
import type {
  IAutoMovieAdmitProductionTtsReceipt,
  IAutoMovieProductionTtsReceipt,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createDialogueReceiptFixture } from "../internal/createDialogueReceiptFixture";
import { throwsError } from "../internal/predicates";

/**
 * A generated line's receipt is admitted only against its own line and bytes.
 *
 * Scenarios:
 *
 * 1. A valid version 7 receipt for 2400 samples at 24 kHz is admitted, and its
 *    line decodes to round(2400 × 48000 / 24000) = 4800 samples at 48 kHz.
 * 2. A changed PCM digest, sample count, text, line id, cache key and an
 *    out-of-range phoneme chunk are each refused, naming the field.
 * 3. An overlapping chunk, a version 6 receipt and a stereo file are refused,
 *    naming `phonemeChunks[1]`, `version` and `sourceSampleRate`.
 * 4. A receipt with one-phoneme chunks and an aligner record is admitted.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists each admitted and refused receipt and the field each refusal names.
 * @evidence contracts/development/testing.md#behavioral-verification Runs ingest's `AutoMovieIngestAudio.admitReceipt` on fixture bytes; a check that let any changed field through, or named the wrong field, fails.
 * @evidence contracts/development/testing.md#independent-expectations The fixture digests its bytes and request with Node's SHA-256, so the product's digest is compared against an independent implementation; the decoded length follows the receipt's documented rate rule.
 * @evidence contracts/development/testing.md#distinguishing-cases Each refusal changes one field of an otherwise admitted receipt, and the aligner case admits the adjacent positive form; WAVE container refusals belong to the decoder's tests.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_ingest_sound_receipt_admission`; it starts no process.
 */
export function test_ingest_sound_receipt_admission(): void {
  const samples: Float32Array = Float32Array.from(
    { length: 2400 },
    (_: unknown, index: number): number =>
      0.3 * Math.sin((2 * Math.PI * 220 * index) / 24_000),
  );
  const admit: (
    edit?: (receipt: IAutoMovieProductionTtsReceipt) => void,
    overrides?: Partial<IAutoMovieAdmitProductionTtsReceipt.IProps>,
    chunks?: IAutoMovieProductionTtsReceipt["phonemeChunks"],
  ) => IAutoMovieAdmitProductionTtsReceipt.IResult = (
    edit?: (receipt: IAutoMovieProductionTtsReceipt) => void,
    overrides: Partial<IAutoMovieAdmitProductionTtsReceipt.IProps> = {},
    chunks: IAutoMovieProductionTtsReceipt["phonemeChunks"] = [
      { phonemes: "həˈloʊ", startSample: 0, endSample: 1200 },
      { phonemes: "wɜːld", startSample: 1200, endSample: 2400 },
    ],
  ): IAutoMovieAdmitProductionTtsReceipt.IResult => {
    const fixture: ReturnType<typeof createDialogueReceiptFixture> =
      createDialogueReceiptFixture({
        line: "hello",
        text: "Hello world.",
        samples,
        sampleRate: 24_000,
        phonemeChunks: chunks,
        ...(edit === undefined ? {} : { edit }),
      });
    return AutoMovieIngestAudio.admitReceipt({
      line: { id: "hello", text: "Hello world." },
      pcmPath: "lines/hello.wav",
      pcm: fixture.pcm,
      receiptPath: "lines/hello.json",
      receipt: fixture.receiptBytes,
      sampleRate: 48_000,
      ...overrides,
    });
  };

  const admitted: IAutoMovieAdmitProductionTtsReceipt.IResult = admit();
  TestValidator.predicate(
    "a valid receipt is admitted and decoded at 48 kHz",
    admitted.receipt.line === "hello" &&
      admitted.audio.samples.length === 4800 &&
      admitted.audio.sourceSampleRate === 24_000,
  );

  const refusals: [string, () => unknown, string][] = [
    [
      "digest",
      () =>
        admit(
          (receipt) => void (receipt.pcmDigest = `sha256:${"0".repeat(64)}`),
        ),
      "[pcmDigest]",
    ],
    [
      "sample count",
      () => admit((receipt) => void (receipt.sourceSamples = 2399)),
      "[sourceSamples]",
    ],
    [
      "text",
      () => admit(undefined, { line: { id: "hello", text: "Hello, world." } }),
      "[text]",
    ],
    [
      "line",
      () => admit(undefined, { line: { id: "goodbye", text: "Hello world." } }),
      "[line]",
    ],
    [
      "cache key",
      () =>
        admit((receipt) => void (receipt.inferenceArguments = { speed: 1.1 })),
      "[cacheKey]",
    ],
    [
      "chunk out of range",
      () =>
        admit(undefined, {}, [
          { phonemes: "həˈloʊ", startSample: 0, endSample: 2401 },
        ]),
      "[phonemeChunks[0]]",
    ],
    [
      "overlapping chunk",
      () =>
        admit(undefined, {}, [
          { phonemes: "hə", startSample: 0, endSample: 1300 },
          { phonemes: "loʊ", startSample: 1200, endSample: 2400 },
        ]),
      "[phonemeChunks[1]]",
    ],
    [
      "version 6",
      () =>
        admit((receipt) => void ((receipt as { version: number }).version = 6)),
      "[version]",
    ],
    [
      "stereo",
      () => {
        const stereo: ReturnType<typeof createDialogueReceiptFixture> =
          createDialogueReceiptFixture({
            line: "hello",
            text: "Hello world.",
            samples,
            sampleRate: 24_000,
          });
        const bytes: Uint8Array = stereo.pcm.slice();
        const view: DataView = new DataView(bytes.buffer);
        view.setUint16(22, 2, true);
        view.setUint32(28, 24_000 * 8, true);
        view.setUint16(32, 8, true);
        return AutoMovieIngestAudio.admitReceipt({
          line: { id: "hello", text: "Hello world." },
          pcmPath: "lines/hello.wav",
          pcm: bytes,
          receiptPath: "lines/hello.json",
          receipt: stereo.receiptBytes,
          sampleRate: 48_000,
        });
      },
      "[sourceSampleRate]",
    ],
  ];
  TestValidator.equals(
    "each changed field is refused by name",
    refusals
      .filter(([, run, field]) => throwsError(run, field) === false)
      .map(([label]) => label),
    [],
  );

  const aligned: IAutoMovieAdmitProductionTtsReceipt.IResult = admit(
    (receipt) =>
      void (receipt.aligner = { model: "fixture/aligner", revision: "r1" }),
    {},
    [
      { phonemes: "h", startSample: 0, endSample: 400 },
      { phonemes: "ə", startSample: 400, endSample: 800 },
      { phonemes: "l", startSample: 800, endSample: 1200 },
    ],
  );
  TestValidator.predicate(
    "one-phoneme chunks with an aligner record are admitted",
    aligned.receipt.aligner?.model === "fixture/aligner" &&
      aligned.receipt.phonemeChunks?.length === 3,
  );
}
