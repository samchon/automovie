import type {
  IAutoMovieProductionFrameRate,
  IAutoMovieProductionSoundPlan,
  IAutoMovieRenderProductionSound,
} from "@automovie/interface";

import { resolveProductionFrameRate } from "../film/internal/resolveProductionFrameRate";
import { roundProductionGridTick } from "../film/internal/roundProductionGridTick";
import { assertProductionScoreDucking } from "./assertProductionScoreDucking";

/** Build a music-only sample gain curve for adopted dialogue on the film clock. */
export function productionScoreDuckingEnvelope(
  plan: IAutoMovieProductionSoundPlan,
  dialogue: IAutoMovieRenderProductionSound.IProps["dialogue"],
  sampleFrames: number,
  frameToSample: (frame: number) => number,
): Float32Array | undefined {
  const policy: IAutoMovieProductionSoundPlan["scoreDucking"] =
    plan.scoreDucking;
  assertProductionScoreDucking(policy);
  if (
    policy === undefined ||
    policy.gain === 1 ||
    dialogue === undefined ||
    plan.cues.some(
      (cue: IAutoMovieProductionSoundPlan["cues"][number]): boolean =>
        cue.bus === "music" && cue.gain > 0,
    ) === false
  )
    return undefined;

  const rate: IAutoMovieProductionFrameRate = resolveProductionFrameRate(plan);
  const ticksPerFrameNumerator: bigint =
    BigInt(rate.denominator) * BigInt(plan.sampleRate);
  const ticksPerFrameDenominator: bigint = BigInt(rate.numerator);
  const attackFrames: bigint = BigInt(policy.attackFrames);
  const releaseFrames: bigint = BigInt(policy.releaseFrames);
  const difference: number = 1 - policy.gain;
  let envelope: Float32Array | undefined;
  for (const line of plan.dialogue) {
    if (dialogue.has(line.id) === false) continue;
    const start: number = frameToSample(line.startFrame);
    const end: number = frameToSample(line.endFrame);
    if (start >= end || start >= sampleFrames) continue;
    envelope ??= new Float32Array(sampleFrames).fill(1);
    // Virtual anchors can lie outside the film and the safe sample range.
    const attackStart: bigint = roundProductionGridTick(
      (BigInt(line.startFrame) - attackFrames) * ticksPerFrameNumerator,
      ticksPerFrameDenominator,
    );
    const releaseEnd: bigint = roundProductionGridTick(
      (BigInt(line.endFrame) + releaseFrames) * ticksPerFrameNumerator,
      ticksPerFrameDenominator,
    );
    const attack: number = Number(BigInt(start) - attackStart);
    const release: number = Number(releaseEnd - BigInt(end));
    const first: number = attackStart < 0n ? 0 : Number(attackStart);
    const stop: number =
      releaseEnd > BigInt(sampleFrames) ? sampleFrames : Number(releaseEnd);
    for (let sample: number = first; sample < stop; ++sample) {
      const gain: number =
        sample < start
          ? policy.gain + difference * ((start - sample) / attack)
          : sample >= end
            ? policy.gain + difference * ((sample - end) / release)
            : policy.gain;
      envelope[sample] = Math.min(envelope[sample]!, gain);
    }
  }
  return envelope;
}
