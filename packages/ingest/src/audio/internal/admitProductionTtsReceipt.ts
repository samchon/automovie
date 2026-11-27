import { AutoMovieEngineCanonicalJson, AutoMovieEngineRenderTarget, AutoMovieEnginePicture } from "@automovie/engine";
import type {
  IAutoMovieAdmitProductionTtsReceipt,
  IAutoMovieDecodedProductionAudioAsset,
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionTtsReceipt,
} from "@automovie/interface";

import { decodeProductionAudioAsset } from "./decodeProductionAudioAsset";
import { resampleProductionAudio } from "./resampleProductionAudio";

/*
 * Admit one generated line's receipt against its line and its bytes, and decode
 * the line at the requested rate.
 *
 * The receipt is parsed as UTF-8 JSON and must be a version 7 receipt whose
 * required fields carry their declared types. It is refused, naming the field,
 * when its `line` or `text` differs from the line; when the WAVE file is not
 * mono 32-bit IEEE float at `sourceSampleRate`; when `sourceSamples` differs
 * from the file's sample count; when `pcmDigest` differs from the SHA-256 of
 * the file's samples as little-endian Float32 bytes; when a phoneme chunk is
 * empty, leaves `[0, sourceSamples]`, or overlaps or precedes the previous
 * chunk; and when `cacheKey` differs from the digest recomputed from `text`,
 * `model`, `modelRevision`, `conditioning` and `inferenceArguments`. Refusals
 * throw `Dialogue receipt "<path>" [<field>] <message>`; WAVE container
 * refusals keep the decoder's own form.
 *
 * Ingest owns this admission because it reads external media bytes, and engine,
 * which ingest depends on, cannot call it.
 * Parameter props: The line, its WAVE and receipt bytes with their paths, and the
 * output rate.
 * Returns: The admitted receipt and the line's samples at `props.sampleRate`.
 */
export function admitProductionTtsReceipt(
  props: IAutoMovieAdmitProductionTtsReceipt.IProps,
): IAutoMovieAdmitProductionTtsReceipt.IResult {
  function fail(field: string, message: string): never {
    throw new Error(
      `Dialogue receipt "${props.receiptPath}" [${field}] ${message}`,
    );
  }
  const receipt: IAutoMovieProductionTtsReceipt = parseReceipt(
    props.receipt,
    fail,
  );
  if (receipt.line !== props.line.id)
    fail(
      "line",
      `belongs to line "${receipt.line}", not to line "${props.line.id}".`,
    );
  if (receipt.text !== props.line.text)
    fail(
      "text",
      `records the text ${JSON.stringify(receipt.text)}, but line "${props.line.id}" says ${JSON.stringify(props.line.text)}.`,
    );

  // The file is decoded at its own rate, so the samples read are its bytes.
  const native: IAutoMovieDecodedProductionAudioAsset =
    decodeProductionAudioAsset({
      path: props.pcmPath,
      bytes: props.pcm,
      sampleRate: receipt.sourceSampleRate,
    });
  if (
    native.sourceFormat.encoding !== "float-f32le" ||
    native.sourceChannels !== 1 ||
    native.sourceSampleRate !== receipt.sourceSampleRate
  )
    fail(
      "sourceSampleRate",
      `requires "${props.pcmPath}" to be mono 32-bit float at ${receipt.sourceSampleRate} Hz, but it is ${native.sourceChannels}-channel ${native.sourceFormat.encoding} at ${native.sourceSampleRate} Hz.`,
    );
  if (native.sourceFrames !== receipt.sourceSamples)
    fail(
      "sourceSamples",
      `records ${receipt.sourceSamples} samples, but "${props.pcmPath}" holds ${native.sourceFrames}.`,
    );
  const bytes: Uint8Array = new Uint8Array(native.samples.length * 4);
  const view: DataView = new DataView(bytes.buffer);
  native.samples.forEach((sample: number, index: number): void =>
    view.setFloat32(index * 4, sample, true),
  );
  const digest: string = AutoMovieEnginePicture.digestAutoMovieBytes(bytes);
  if (digest !== receipt.pcmDigest)
    fail(
      "pcmDigest",
      `records ${receipt.pcmDigest}, but the samples of "${props.pcmPath}" digest to ${digest}.`,
    );

  let previousEnd: number = 0;
  receipt.phonemeChunks?.forEach(
    (chunk: IAutoMovieProductionPhonemeChunk, index: number): void => {
      if (
        Number.isSafeInteger(chunk.startSample) === false ||
        Number.isSafeInteger(chunk.endSample) === false ||
        chunk.startSample < previousEnd ||
        chunk.endSample <= chunk.startSample ||
        chunk.endSample > receipt.sourceSamples ||
        chunk.phonemes.trim().length === 0
      )
        fail(
          `phonemeChunks[${index}]`,
          `spans samples ${chunk.startSample} to ${chunk.endSample} with phonemes ${JSON.stringify(chunk.phonemes)}; a chunk carries phonemes over a nonempty interval inside [0, ${receipt.sourceSamples}] that starts at or after the previous chunk's end ${previousEnd}.`,
        );
      previousEnd = chunk.endSample;
    },
  );

  const cacheKey: string = AutoMovieEngineRenderTarget.autoMovieRenderDigest(
    AutoMovieEngineCanonicalJson.canonicalize([
      receipt.text,
      receipt.model,
      receipt.modelRevision,
      receipt.conditioning,
      receipt.inferenceArguments,
    ]),
  );
  if (cacheKey !== receipt.cacheKey)
    fail(
      "cacheKey",
      `records ${receipt.cacheKey}, but its request recomputes to ${cacheKey}.`,
    );

  const resampling: boolean = receipt.sourceSampleRate !== props.sampleRate;
  return {
    receipt,
    audio: {
      ...native,
      processing: {
        ...native.processing,
        kind: resampling ? "resample" : "copy",
        outputSampleRate: props.sampleRate,
      },
      samples: resampling
        ? resampleProductionAudio(
            native.samples,
            receipt.sourceSampleRate,
            props.sampleRate,
          )
        : native.samples,
    },
  };
}

/*
 * Parse the receipt bytes and check the type of every field admission reads or
 * the receipt requires.
 */
function parseReceipt(
  bytes: Uint8Array,
  fail: (field: string, message: string) => never,
): IAutoMovieProductionTtsReceipt {
  let value: unknown;
  try {
    value = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch (cause) {
    return fail(
      "json",
      `is not UTF-8 JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
    );
  }
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return fail("json", "is not a JSON object.");
  const record: Record<string, unknown> = value as Record<string, unknown>;
  if (record.version !== 7)
    fail(
      "version",
      `is version ${JSON.stringify(record.version)}; only version 7 receipts are admitted, and an older receipt lacks the text and inference arguments its line needs, so record the line again.`,
    );
  for (const field of [
    "line",
    "text",
    "cacheKey",
    "model",
    "modelRevision",
    "generatedAt",
    "pcmDigest",
  ])
    if (typeof record[field] !== "string" || record[field] === "")
      fail(field, "must be a nonempty string.");
  for (const field of ["sourceSampleRate", "sourceSamples"]) {
    const count: unknown = record[field];
    if (typeof count !== "number" || !Number.isSafeInteger(count) || count <= 0)
      fail(field, "must be a positive safe integer.");
  }
  const conditioning: unknown = record.conditioning;
  const mode: unknown =
    typeof conditioning === "object" && conditioning !== null
      ? (conditioning as Record<string, unknown>).mode
      : undefined;
  const voice: unknown =
    mode === "voice"
      ? (conditioning as Record<string, unknown>).voice
      : mode === "reference-audio"
        ? (conditioning as Record<string, unknown>).referenceDigest
        : undefined;
  if (typeof voice !== "string" || voice === "")
    fail(
      "conditioning",
      'must be { mode: "voice", voice } or { mode: "reference-audio", referenceDigest } with a nonempty string.',
    );
  const argumentsRecord: unknown = record.inferenceArguments;
  if (
    typeof argumentsRecord !== "object" ||
    argumentsRecord === null ||
    Array.isArray(argumentsRecord) ||
    Object.values(argumentsRecord).some(
      (argument: unknown): boolean =>
        typeof argument !== "string" &&
        typeof argument !== "boolean" &&
        (typeof argument !== "number" || Number.isFinite(argument) === false),
    )
  )
    fail(
      "inferenceArguments",
      "must be an object of string, finite number and boolean values.",
    );
  if (
    typeof record.generatorProvenance !== "object" ||
    record.generatorProvenance === null
  )
    fail("generatorProvenance", "must be an object.");
  if (Array.isArray(record.runtimeAssets) === false)
    fail("runtimeAssets", "must be an array.");
  if (
    record.phonemeChunks !== undefined &&
    (Array.isArray(record.phonemeChunks) === false ||
      record.phonemeChunks.some(
        (chunk: unknown): boolean =>
          typeof chunk !== "object" ||
          chunk === null ||
          typeof (chunk as Record<string, unknown>).phonemes !== "string",
      ))
  )
    fail(
      "phonemeChunks",
      "must be an array of { phonemes, startSample, endSample } records.",
    );
  const aligner: unknown = record.aligner;
  if (
    aligner !== undefined &&
    (typeof aligner !== "object" ||
      aligner === null ||
      typeof (aligner as Record<string, unknown>).model !== "string" ||
      typeof (aligner as Record<string, unknown>).revision !== "string")
  )
    fail("aligner", "must be { model, revision } with string values.");

  // Every field read above has its declared type, so the record is the receipt.
  return record as unknown as IAutoMovieProductionTtsReceipt;
}
