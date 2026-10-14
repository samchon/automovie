import { namedFacts, throwsError as refused } from "../internal/predicates";
import type { IAutoMovieProductionSoundEvidence } from "@automovie/interface";
import { probeProductionMedia } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

/**
 * Sound evidence retains the complete current schema and exact declared identity after strict UTF-8 JSON decoding.
 *
 * Scenarios:
 *
 * 1. Preserve a complete version-2 record.
 * 2. Refuse malformed UTF-8, obsolete incomplete records and empty records.
 *
 * @evidence contracts/testing.md#behavioral-verification Probes actual audio-mix JSON bytes and compares the complete admitted version-two sound record; each invalid payload must throw an Error containing its parse or schema refusal fragment.
 * @evidence contracts/testing.md#independent-expectations The complete authored record and literal refusal fragments form the oracle. Exact scalar equality checks JSON identity preservation, not approximate acoustic measurement or independent PCM analysis.
 * @evidence contracts/testing.md#distinguishing-cases A complete current record contrasts with a truncated UTF-8 sequence, an obsolete incomplete version-one record and an empty object, distinguishing strict decoding from schema admission.
 * @evidence contracts/testing.md#execution-ownership This synchronous named unit uses in-memory buffers and the production probe plus transformed schema validator; it does not encode audio, inspect sibling audio bytes or establish current plan/provenance truth.
 */
export function test_production_sound_evidence_probe(): void {
  const soundEvidenceValue: IAutoMovieProductionSoundEvidence = {
    version: 2,
    plan: {
      version: 1,
      inputFingerprint: `sha256:${"1".repeat(64)}`,
      fps: 24,
      frameRate: { numerator: 24, denominator: 1 },
      totalFrames: 24,
      sampleRate: 48_000,
      channels: 2,
      events: [],
      cues: [],
      dialogue: [],
    },
    analysis: {
      version: 1,
      sampleRate: 48_000,
      sampleFrames: 48_000,
      runtimeSeconds: 1,
      integratedLoudness: null,
      samplePeak: 0,
      clippingSamples: 0,
      longestSilenceSeconds: 1,
      eventAlignment: [],
    },
    tts: [],
    audio: {
      path: "audio.mp4",
      mediaType: "audio/mp4",
      bytes: 128,
      digest: `sha256:${"2".repeat(64)}`,
    },
    measurement: {
      source: "pre-encode-pcm",
      algorithm: "automovie-production-sound-analysis-v1",
    },
  };
  const soundEvidence: Uint8Array = Buffer.from(JSON.stringify(soundEvidenceValue));
  TestValidator.equals(
    "sound evidence preserves the complete current version-2 identity",
    probeProductionMedia({
      kind: "audio-mix",
      mediaType: "application/json",
      bytes: soundEvidence,
    }),
    { kind: "sound-evidence", evidence: soundEvidenceValue },
  );
  TestValidator.equals(
    "sound evidence must be UTF-8 JSON in the complete current schema",
    namedFacts([
      [
        "refusedProbeProductionMediaKind",
        (): boolean =>
          refused(
            (): ReturnType<typeof probeProductionMedia> =>
              probeProductionMedia({
                kind: "audio-mix",
                mediaType: "application/json",
                bytes: Buffer.from([0xc3]),
              }),
            "UTF-8 JSON",
          ),
      ],
      [
        "refusedProbeProductionMediaKind2",
        (): boolean =>
          refused(
            (): ReturnType<typeof probeProductionMedia> =>
              probeProductionMedia({
                kind: "audio-mix",
                mediaType: "application/json",
                bytes: Buffer.from(
                  JSON.stringify({
                    version: 1,
                    plan: { events: [{}] },
                    analysis: { clippingSamples: 0, eventAlignment: [] },
                    tts: [],
                  }),
                ),
              }),
            "complete version-2",
          ),
      ],
      [
        "refusedProbeProductionMediaKind3",
        (): boolean =>
          refused(
            (): ReturnType<typeof probeProductionMedia> =>
              probeProductionMedia({
                kind: "audio-mix",
                mediaType: "application/json",
                bytes: Buffer.from("{}"),
              }),
            "complete version-2",
          ),
      ],
    ]),
    {
      refusedProbeProductionMediaKind: true,
      refusedProbeProductionMediaKind2: true,
      refusedProbeProductionMediaKind3: true,
    },
  );

}
