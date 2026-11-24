import { canonicalizeAutoMovieJson } from "@automovie/engine";
import type {
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionTtsReceipt,
} from "@automovie/interface";
import { createHash } from "node:crypto";

/**
 * A generated line's mono Float32 WAVE bytes and a version 7 receipt that
 * admits against them.
 *
 * The PCM digest is Node's SHA-256 of the WAVE data chunk, so a receipt built
 * here checks the product's digest against an independent implementation. The
 * cache key follows the receipt's documented formula, also hashed by Node.
 * `edit` changes the receipt after its digests are computed, so a test can
 * break one field at a time.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Admission reads these bytes exactly as it reads a production's files.
 * @evidence contracts/development/testing.md#independent-expectations The PCM digest comes from `node:crypto`, not from the product's digest; the WAVE layout follows the RIFF/WAVE format with a 32-bit float `fmt ` chunk.
 * @evidence contracts/development/testing.md#distinguishing-cases The caller chooses the samples, rate, chunks and the field edit that separates an admitted receipt from each refusal.
 * @evidence contracts/development/testing.md#execution-ownership Pure byte construction; the caller owns every byte returned.
 */
export function createDialogueReceiptFixture(props: {
  /** Line id. */
  line: string;
  /** Line text. */
  text: string;
  /** Mono samples at `sampleRate`. */
  samples: Float32Array;
  /** Model-native rate in samples per second. */
  sampleRate: number;
  /** Optional phoneme chunks on the native clock. */
  phonemeChunks?: IAutoMovieProductionPhonemeChunk[];
  /** Optional forced aligner record. */
  aligner?: IAutoMovieProductionTtsReceipt["aligner"];
  /** Optional change applied after the digests are computed. */
  edit?: (receipt: IAutoMovieProductionTtsReceipt) => void;
}): {
  pcm: Uint8Array;
  receipt: IAutoMovieProductionTtsReceipt;
  receiptBytes: Uint8Array;
} {
  const data: Buffer = Buffer.alloc(props.samples.length * 4);
  props.samples.forEach((sample: number, index: number): void => {
    data.writeFloatLE(sample, index * 4);
  });
  const header: Buffer = Buffer.alloc(44);
  header.write("RIFF", 0, "ascii");
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8, "ascii");
  header.write("fmt ", 12, "ascii");
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(3, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(props.sampleRate, 24);
  header.writeUInt32LE(props.sampleRate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(32, 34);
  header.write("data", 36, "ascii");
  header.writeUInt32LE(data.length, 40);
  const pcm: Uint8Array = new Uint8Array(Buffer.concat([header, data]));

  const request: Pick<
    IAutoMovieProductionTtsReceipt,
    "text" | "model" | "modelRevision" | "conditioning" | "inferenceArguments"
  > = {
    text: props.text,
    model: "fixture/speech-model",
    modelRevision: "0123456789abcdef0123456789abcdef01234567",
    conditioning: { mode: "voice", voice: "fixture-voice" } as const,
    inferenceArguments: { speed: 1, seed: 7, normalize: true },
  };
  const receipt: IAutoMovieProductionTtsReceipt = {
    version: 7,
    line: props.line,
    ...request,
    cacheKey: sha256(
      canonicalizeAutoMovieJson([
        request.text,
        request.model,
        request.modelRevision,
        request.conditioning,
        request.inferenceArguments,
      ]),
    ),
    generatorProvenance: {
      cost: "local compute",
      consumer: { kind: "dialogue-synthesis", reason: "test fixture line" },
    },
    generatedAt: "2026-11-23T00:00:00.000Z",
    sourceSampleRate: props.sampleRate,
    sourceSamples: props.samples.length,
    pcmDigest: `sha256:${createHash("sha256").update(data).digest("hex")}`,
    ...(props.phonemeChunks === undefined
      ? {}
      : { phonemeChunks: props.phonemeChunks }),
    ...(props.aligner === undefined ? {} : { aligner: props.aligner }),
    runtimeAssets: [],
  };
  props.edit?.(receipt);
  return {
    pcm,
    receipt,
    receiptBytes: new TextEncoder().encode(JSON.stringify(receipt)),
  };
}

/** Node's SHA-256 of a UTF-8 string in the receipt's `sha256:` form. */
const sha256: (text: string) => string = (text: string): string =>
  `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
