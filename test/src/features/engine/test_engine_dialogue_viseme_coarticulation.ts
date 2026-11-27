import { AutoMovieEngineSound } from "@automovie/engine";
import type {
  IAutoMovieDialogueVisemeTimeline,
  IAutoMovieHumanVisemeWeights,
  IAutoMovieProductionPhonemeChunk,
  IAutoMovieProductionViseme,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Phonemes take equal shares of their chunk, and the coarticulated weights
 * blend neighbouring visemes without jumps.
 *
 * Scenarios:
 *
 * 1. A chunk /ama/ over source samples 0 to 24 000 gives each phoneme 8 000
 *    samples; with a stress mark added the shares stay the same.
 * 2. At 48 kHz and 24 fps the phonemes are four frames each; on the frame centred
 *    on /m/ (frame 6) `PP` outweighs every other viseme.
 * 3. On the frame centred on the first /a/ (frame 2) `aa` outweighs every other
 *    viseme.
 * 4. Two samplings of the same frame give identical weights, and the weights sum
 *    to 1.
 * 5. In a 24 fps line of one-phoneme chunks three frames each, alternating
 *    bilabials, labiodentals and vowels, no weight changes by more than 0.5
 *    between neighbouring frames, from six frames before the line to six
 *    after.
 * 6. The same bound holds in a line where a bilabial meets a labiodental (/mf/ and
 *    /pv/), the pair whose dominances both decay fastest.
 * 7. In /mam/ at three frames a phoneme, `aa` outweighs every other viseme on
 *    frames 4 and 5, the two nearest the vowel's centre, so the bilabials'
 *    strong dominance does not reach far enough to keep the lips shut through
 *    the vowel.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the chunks, rates, frames and the bound each case checks.
 * @evidence contracts/development/testing.md#behavioral-verification Times phonemes with `productionPhonemesToVisemes`, binds them with `joinDialogueVisemes` and samples `sampleDialogueVisemeWeights`. A per-chunk instead of per-phoneme timing, a mouth that ignores the bilabial, or a sampler that snaps between ranges (a step of 1) fails.
 * @evidence contracts/development/testing.md#independent-expectations Shares are 24 000 / 3; frames are samples × 24 / 48 000; the centred frames follow from them; the 0.5 step bound and the dominance ordering are the requirements of #4054, and a vowel showing on its own frames between bilabials is the supervisor's decision on their reach; none is computed by the sampler under test.
 * @evidence contracts/development/testing.md#distinguishing-cases Pairs a stressed and an unstressed chunk, a consonant and a vowel frame, a line that includes the silence on both sides, a bilabial against a labiodental, and a short vowel between bilabials; the IPA table belongs to `test_engine_dialogue_viseme_mpeg4_map` and speaker binding outcomes to `test_engine_dialogue_viseme_join`.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory unit test entered through `test_engine_dialogue_viseme_coarticulation`; it starts no process.
 */
export function test_engine_dialogue_viseme_coarticulation(): void {
  const timeline: (
    chunks: IAutoMovieProductionPhonemeChunk[],
    samples: number,
  ) => IAutoMovieDialogueVisemeTimeline = (
    chunks: IAutoMovieProductionPhonemeChunk[],
    samples: number,
  ): IAutoMovieDialogueVisemeTimeline => {
    const visemes: IAutoMovieProductionViseme[] =
      AutoMovieEngineSound.phonemesToVisemes({
        chunks,
      });
    const joined: ReturnType<typeof AutoMovieEngineSound.joinDialogueVisemes> =
      AutoMovieEngineSound.joinDialogueVisemes({
        line: {
          id: "line",
          text: "line",
          language: "en",
          speaker: "ann",
          startFrame: 0,
          endFrame: Math.ceil((samples * 24) / 48_000),
        },
        bindings: [{ speaker: "ann", actor: "ann-node" }],
        visemes,
        sourceSampleRate: 48_000,
        fps: 24,
      });
    if (joined.timeline === null) throw new Error("the join did not run");
    return joined.timeline;
  };
  const heaviest: (weights: IAutoMovieHumanVisemeWeights) => string = (
    weights: IAutoMovieHumanVisemeWeights,
  ): string =>
    Object.entries(weights).reduce(
      (best: [string, number], entry: [string, number | undefined]) =>
        (entry[1] ?? 0) > best[1] ? [entry[0], entry[1] ?? 0] : best,
      ["", -1],
    )[0];

  const plain: IAutoMovieProductionViseme[] =
    AutoMovieEngineSound.phonemesToVisemes({
      chunks: [{ phonemes: "ama", startSample: 0, endSample: 24_000 }],
    });
  const stressed: IAutoMovieProductionViseme[] =
    AutoMovieEngineSound.phonemesToVisemes({
      chunks: [{ phonemes: "ˈama", startSample: 0, endSample: 24_000 }],
    });
  const shares: (visemes: IAutoMovieProductionViseme[]) => number[][] = (
    visemes: IAutoMovieProductionViseme[],
  ): number[][] =>
    visemes.map((v: IAutoMovieProductionViseme): number[] => [
      v.startSample,
      v.endSample,
    ]);
  TestValidator.equals(
    "each phoneme of /ama/ takes 8 000 samples, stressed or not",
    [shares(plain), shares(stressed)],
    [
      [
        [0, 8_000],
        [8_000, 16_000],
        [16_000, 24_000],
      ],
      [
        [0, 8_000],
        [8_000, 16_000],
        [16_000, 24_000],
      ],
    ],
  );

  const ama: IAutoMovieDialogueVisemeTimeline = timeline(
    [{ phonemes: "ama", startSample: 0, endSample: 24_000 }],
    24_000,
  );
  const sample: (frame: number) => IAutoMovieHumanVisemeWeights = (
    frame: number,
  ): IAutoMovieHumanVisemeWeights =>
    AutoMovieEngineSound.sampleDialogueVisemeWeights({
      timeline: ama,
      frame,
      fps: 24,
    });
  const onM: IAutoMovieHumanVisemeWeights = sample(6);
  const onA: IAutoMovieHumanVisemeWeights = sample(2);
  const total: number = Object.values(onM).reduce(
    (sum: number, w: number | undefined): number => sum + (w ?? 0),
    0,
  );
  TestValidator.predicate(
    "PP leads on /m/, aa leads on /a/, and sampling is pure",
    heaviest(onM) === "PP" &&
      heaviest(onA) === "aa" &&
      JSON.stringify(sample(6)) === JSON.stringify(onM) &&
      Math.abs(total - 1) <= 1e-12,
  );

  // Three frames per phoneme at 24 fps and 48 kHz: 6 000 samples each.
  const symbols: string[] = ["p", "a", "f", "i", "m", "u", "b", "o", "v", "e"];
  const line: IAutoMovieDialogueVisemeTimeline = timeline(
    symbols.map(
      (phonemes: string, index: number): IAutoMovieProductionPhonemeChunk => ({
        phonemes,
        startSample: index * 6_000,
        endSample: (index + 1) * 6_000,
      }),
    ),
    symbols.length * 6_000,
  );
  let largest: number = 0;
  let previous: IAutoMovieHumanVisemeWeights | undefined;
  for (let frame: number = -6; frame <= symbols.length * 3 + 6; ++frame) {
    const current: IAutoMovieHumanVisemeWeights =
      AutoMovieEngineSound.sampleDialogueVisemeWeights({
        timeline: line,
        frame,
        fps: 24,
      });
    if (previous !== undefined)
      for (const key of new Set([
        ...Object.keys(current),
        ...Object.keys(previous),
      ]) as Set<keyof IAutoMovieHumanVisemeWeights>)
        largest = Math.max(
          largest,
          Math.abs((current[key] ?? 0) - (previous[key] ?? 0)),
        );
    previous = current;
  }
  TestValidator.predicate(
    "no weight changes by more than 0.5 between neighbouring frames",
    largest > 0 && largest <= 0.5,
  );

  // A bilabial beside a labiodental is the fastest pair of time constants.
  const clusters: string[] = ["a", "m", "f", "a", "p", "v", "o"];
  const clustered: IAutoMovieDialogueVisemeTimeline = timeline(
    clusters.map(
      (phonemes: string, index: number): IAutoMovieProductionPhonemeChunk => ({
        phonemes,
        startSample: index * 6_000,
        endSample: (index + 1) * 6_000,
      }),
    ),
    clusters.length * 6_000,
  );
  TestValidator.predicate(
    "a bilabial beside a labiodental changes no weight by more than 0.5 per frame",
    largestStep(clustered, -6, clusters.length * 3 + 6) <= 0.5,
  );

  // A three-frame /a/ between two /m/ opens on its own frames.
  const mam: IAutoMovieDialogueVisemeTimeline = timeline(
    [
      { phonemes: "m", startSample: 0, endSample: 6_000 },
      { phonemes: "a", startSample: 6_000, endSample: 12_000 },
      { phonemes: "m", startSample: 12_000, endSample: 18_000 },
    ],
    18_000,
  );
  TestValidator.predicate(
    "aa leads on both frames nearest the vowel's centre between two bilabials",
    [4, 5].every(
      (frame: number): boolean =>
        heaviest(
          AutoMovieEngineSound.sampleDialogueVisemeWeights({
            timeline: mam,
            frame,
            fps: 24,
          }),
        ) === "aa",
    ),
  );
}

/** The largest change of any viseme weight between neighbouring 24 fps frames. */
function largestStep(
  timeline: IAutoMovieDialogueVisemeTimeline,
  from: number,
  to: number,
): number {
  let largest: number = 0;
  let previous: IAutoMovieHumanVisemeWeights | undefined;
  for (let frame: number = from; frame <= to; ++frame) {
    const current: IAutoMovieHumanVisemeWeights =
      AutoMovieEngineSound.sampleDialogueVisemeWeights({
        timeline,
        frame,
        fps: 24,
      });
    if (previous !== undefined)
      for (const key of new Set([
        ...Object.keys(current),
        ...Object.keys(previous),
      ]) as Set<keyof IAutoMovieHumanVisemeWeights>)
        largest = Math.max(
          largest,
          Math.abs((current[key] ?? 0) - (previous[key] ?? 0)),
        );
    previous = current;
  }
  return largest;
}
