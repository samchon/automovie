import { AutoMovieEngineRandom, AutoMovieEngineSound, autoMovieRenderDigest, AutoMovieEngineCanonicalJson, digestAutoMovieBytes, utf8Bytes } from "@automovie/engine";

import { AutoMovieIngestAudio } from "@automovie/ingest";
import type {
  IAutoMovieFilmSound,
  IAutoMovieMixFilmSound,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderedProductionSound,
} from "@automovie/interface";

import { admitAutoMovieFilmDialogue } from "./admitAutoMovieFilmDialogue.js";
import { encodeAutoMovieWavPcm16 } from "./encodeAutoMovieWavPcm16.js";

/** The mixer's fixed rate; every adopted file is decoded to it. */
const SAMPLE_RATE: IAutoMovieProductionSoundPlan["sampleRate"] = 48_000;

/**
 * Mix a film's sound list into the soundtrack its delivery encodes.
 *
 * Every line's WAVE file and receipt and every cue's asset are read through
 * `read`, so render opens no file itself. `admitAutoMovieFilmDialogue` admits
 * each line against its receipt, decodes it at 48 kHz and places it over its
 * speech span; ingest decodes each cue's asset at 48 kHz. The sound plan takes
 * the film's clock, the lines over their spans and each cue as listed, carries
 * the room-tone beds, and engine's `AutoMovieEngineSound.renderProductionSound` mixes it, generating
 * the beds and levelling each line to the dialogue target of `loudness` (EBU R
 * 128 without one). Engine's `AutoMovieEngineSound.masterProductionSound` brings the mix to the
 * integrated target under the true-peak ceiling and refuses it when it misses
 * the tolerance. The master is encoded as a 48 kHz stereo 16-bit WAVE file, so
 * the same list and bytes give the same soundtrack bytes.
 *
 * It refuses, before reading any file, a line id or cue id that repeats; it
 * refuses a file `read` cannot supply, naming the path, so a wrong path never
 * plays a stand-in; and it passes on every refusal of admission, decoding,
 * planning and mixing, including a speech span past the film's last frame.
 *
 * @param props The sound list, the film clock and the file reader.
 * @returns The WAVE bytes and digest, the plan, the master's analysis and each
 *   admitted line.
 */
export async function mixAutoMovieFilmSound(
  props: IAutoMovieMixFilmSound.IProps,
): Promise<IAutoMovieMixFilmSound.IResult> {
  const { sound }: IAutoMovieMixFilmSound.IProps = props;
  assertUnique(
    "cue",
    sound.cues.map((cue: IAutoMovieFilmSound.ICue): string => cue.id),
  );
  const read: (path: string) => Promise<Uint8Array> = async (
    path: string,
  ): Promise<Uint8Array> => {
    try {
      return await props.read(path);
    } catch (cause) {
      throw new Error(`Film sound cannot read "${path}".`, { cause });
    }
  };

  // Lines: admitted against their receipts, decoded at the mix rate and
  // placed over their speech spans.
  const lines: IAutoMovieMixFilmSound.ILine[] =
    await admitAutoMovieFilmDialogue(props);

  // Cues: each distinct asset read and decoded once, and digested for the
  // plan's identity.
  const assets: Map<string, Float32Array> = new Map();
  const assetDigests: Record<string, string> = {};
  for (const cue of sound.cues) {
    if (assets.has(cue.asset)) continue;
    const bytes: Uint8Array = await read(cue.asset);
    assetDigests[cue.asset] = digestAutoMovieBytes(bytes);
    assets.set(
      cue.asset,
      AutoMovieIngestAudio.decodeAsset({
        path: cue.asset,
        bytes,
        sampleRate: SAMPLE_RATE,
      }).samples,
    );
  }

  const fingerprint: string = autoMovieRenderDigest(
    AutoMovieEngineCanonicalJson.canonicalize({
      sound,
      lines: lines.map(
        (entry: IAutoMovieMixFilmSound.ILine): string =>
          entry.receipt.pcmDigest,
      ),
      assets: assetDigests,
    }),
  );
  const clock: Pick<
    IAutoMovieProductionSoundPlan,
    "fps" | "frameRate" | "sampleRate"
  > = {
    fps: props.frameRate.numerator / props.frameRate.denominator,
    frameRate: props.frameRate,
    sampleRate: SAMPLE_RATE,
  };
  const dialogue: IAutoMovieProductionSoundPlan["dialogue"] = lines.map(
    (
      entry: IAutoMovieMixFilmSound.ILine,
    ): IAutoMovieProductionSoundPlan["dialogue"][number] => entry.line,
  );
  const plan: IAutoMovieProductionSoundPlan = {
    version: 1,
    inputFingerprint: fingerprint,
    ...clock,
    totalFrames: props.totalFrames,
    sampleRate: SAMPLE_RATE,
    channels: 2,
    ...(sound.scoreDucking === undefined
      ? {}
      : { scoreDucking: { ...sound.scoreDucking } }),
    events: [],
    cues: sound.cues.map(
      (
        cue: IAutoMovieFilmSound.ICue,
      ): IAutoMovieProductionSoundPlan["cues"][number] => ({
        ...cue,
        seed: Number.parseInt(
          AutoMovieEngineRandom.hashFnv1a64(utf8Bytes(`${fingerprint}|cue|${cue.id}`)).slice(
            8,
          ),
          16,
        ),
      }),
    ),
    dialogue,
    ...(sound.roomTone === undefined
      ? {}
      : {
          roomTone: sound.roomTone.map(
            (
              bed: NonNullable<IAutoMovieFilmSound["roomTone"]>[number],
            ): NonNullable<IAutoMovieFilmSound["roomTone"]>[number] => ({
              ...bed,
            }),
          ),
        }),
  };

  // The mix levels each line to the dialogue target; the master stage then
  // meets the integrated target under the true-peak ceiling.
  const rendered: IAutoMovieRenderedProductionSound = AutoMovieEngineSound.masterProductionSound({
    plan,
    rendered: AutoMovieEngineSound.renderProductionSound({
      plan,
      dialogue: new Map(
        lines.map(
          (entry: IAutoMovieMixFilmSound.ILine): [string, Float32Array] => [
            entry.receipt.line,
            entry.samples,
          ],
        ),
      ),
      assets,
      ...(props.loudness === undefined ? {} : { loudness: props.loudness }),
    }),
  });
  const frames: number = rendered.pcm.length / 2;
  const left: Float32Array = new Float32Array(frames);
  const right: Float32Array = new Float32Array(frames);
  for (let frame: number = 0; frame < frames; ++frame) {
    left[frame] = rendered.pcm[frame * 2]!;
    right[frame] = rendered.pcm[frame * 2 + 1]!;
  }
  const wav: Uint8Array = encodeAutoMovieWavPcm16(left, right, SAMPLE_RATE);
  return {
    wav,
    sha256: digestAutoMovieBytes(wav),
    plan,
    analysis: rendered.analysis,
    loudness: rendered.loudness,
    lines,
  };
}

/** Refuse an id that repeats, because the report and ducking key on it. */
const assertUnique: (kind: string, ids: readonly string[]) => void = (
  kind: string,
  ids: readonly string[],
): void => {
  const seen: Set<string> = new Set();
  for (const id of ids) {
    if (seen.has(id))
      throw new Error(`Film sound declares ${kind} id "${id}" more than once.`);
    seen.add(id);
  }
};
