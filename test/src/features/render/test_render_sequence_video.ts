import {
  IAutoMovieRenderSpec,
  IAutoMovieSequence,
  IAutoMovieShot,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { IAutoMovieSequenceRenderAdapters } from "../../../../packages/render/src/IAutoMovieSequenceRenderAdapters";
import { IAutoMovieSequenceRenderAndSeeResult } from "../../../../packages/render/src/IAutoMovieSequenceRenderAndSeeResult";
import { IAutoMovieSequenceRenderFrame } from "../../../../packages/render/src/IAutoMovieSequenceRenderFrame";
import { renderSequenceAndSee } from "../../../../packages/render/src/renderSequenceAndSee";
import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { namedFacts, nclose } from "../internal/predicates";

const shot: (id: string, duration: number) => IAutoMovieShot = (
  id: string,
  duration: number,
): IAutoMovieShot => ({
  id,
  name: null,
  scene: "scene-duel",
  camera: "cam-main",
  cameraMotion: null,
  performances: [],
  objectMotions: [],
  duration,
});

const SHOTS: IAutoMovieShot[] = [shot("shot:a", 2), shot("shot:b", 3)];

const SEQUENCE: IAutoMovieSequence = {
  id: "seq-duel",
  name: "duel",
  fps: 24,
  shots: [
    { shot: "shot:a", trim: null, transition: null },
    {
      shot: "shot:b",
      trim: { start: 1, duration: 2 },
      transition: { kind: "fade", duration: 0.5 },
    },
  ],
};

const SPEC: IAutoMovieRenderSpec = {
  target: SEQUENCE.id,
  frameFormat: { fps: 4, width: 640, height: 360 },
  toneMapping: "none",
  codec: "h264",
  pixelFormat: "yuv420p",
  crf: 20,
};

/**
 * `renderSequenceAndSee` turns a sequence manifest into host I/O calls: every frame capture receives the live shot local time and blend tail, then encode receives the manifest's ffmpeg args.
 *
 * Scenarios:
 *
 * 1. A two-shot sequence yields capture calls in frame order and returns the adapter-written frame paths.
 * 2. Frames inside the incoming transition expose the outgoing shot tail and incoming alpha to the host adapter.
 * 3. The encode adapter receives exactly the manifest args/output path, and the returned artifact preserves the spec and sequence identity.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs real sequence orchestration through existing supplied capture/encode callbacks, checking sample order, returned paths, transition-local time and artifact metadata.
 * @evidence contracts/testing.md#independent-expectations Two plus two seconds minus a half-second fade gives fourteen frames at four fps; incoming frames six/seven carry times one/1.25 and alpha zero/0.5 by hand. Encoder-argument forwarding is consistency with the returned plan, whose literal option semantics are tested separately.
 * @evidence contracts/testing.md#distinguishing-cases First/last captures, transition entry/mid/past points, callback-returned paths, shallow spec data and encode forwarding retain the original successful orchestration cases; adapter refusal is not exercised here.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_sequence_video owns its cases. Portable async orchestration over existing callback seams; they record values and return authored strings rather than capturing images, writing files or starting an encoder.
 */
export async function test_render_sequence_video(): Promise<void> {
  const captured: Array<{
    index: number;
    shot: string;
    time: number;
    blend: string | null;
    alpha: number | null;
  }> = [];
  const encoded: Array<{ args: string[]; outputPath: string }> = [];
  const adapters: IAutoMovieSequenceRenderAdapters = {
    captureFrame: async (
      frame: IAutoMovieSequenceRenderFrame,
    ): Promise<string> => {
      captured.push({
        index: frame.index,
        shot: frame.shot,
        time: frame.shotTimeSeconds,
        blend: frame.blend?.shot ?? null,
        alpha: frame.blend?.alpha ?? null,
      });
      return `written/frame_${frame.index}.png`;
    },
    encode: async (args: string[], outputPath: string): Promise<string> => {
      encoded.push({ args, outputPath });
      return `encoded:${outputPath}`;
    },
  };

  const result: IAutoMovieSequenceRenderAndSeeResult =
    await renderSequenceAndSee({
      sequence: SEQUENCE,
      shots: SHOTS,
      spec: SPEC,
      frameDir: "frames/seq",
      outputPath: "out/seq.mp4",
      adapters,
    });

  // 1. capture order and returned frame paths
  TestValidator.equals("frame count", result.frameCount, 14);
  TestValidator.equals(
    "capture order",
    captured.map(
      (frame: {
        index: number;
        shot: string;
        time: number;
        blend: string | null;
        alpha: number | null;
      }): number => frame.index,
    ),
    Array.from({ length: 14 }, (_: unknown, i: number): number => i),
  );
  TestValidator.equals(
    "first captured path",
    result.frames[0]!.path,
    "written/frame_0.png",
  );
  TestValidator.equals(
    "last captured path",
    result.frames[13]!.path,
    "written/frame_13.png",
  );

  // 2. transition sample semantics
  TestValidator.equals(
    "entry transition begins at frame 6",
    namedFacts([
      ["capturedShotShot", (): boolean => captured[6]!.shot === "shot:b"],
      ["ncloseCapturedTime", (): boolean => nclose(captured[6]!.time, 1)],
      ["capturedBlendShot", (): boolean => captured[6]!.blend === "shot:a"],
      [
        "ncloseCapturedAlpha",
        (): boolean => nclose(captured[6]!.alpha ?? -1, 0),
      ],
    ]),
    {
      capturedShotShot: true,
      ncloseCapturedTime: true,
      capturedBlendShot: true,
      ncloseCapturedAlpha: true,
    },
  );
  TestValidator.equals(
    "mid transition alpha",
    namedFacts([
      ["capturedShotShot", (): boolean => captured[7]!.shot === "shot:b"],
      ["ncloseCapturedTime", (): boolean => nclose(captured[7]!.time, 1.25)],
      ["capturedBlendShot", (): boolean => captured[7]!.blend === "shot:a"],
      [
        "ncloseCapturedAlpha",
        (): boolean => nclose(captured[7]!.alpha ?? -1, 0.5),
      ],
    ]),
    {
      capturedShotShot: true,
      ncloseCapturedTime: true,
      capturedBlendShot: true,
      ncloseCapturedAlpha: true,
    },
  );
  TestValidator.equals("past transition", captured[8]!.blend, null);

  // 3. encode and artifact metadata
  TestValidator.equals("encoded output", result.output, "encoded:out/seq.mp4");
  TestValidator.predicate(
    "sequence identity",
    filmEffectValuesClose(result.sequence, {
      id: SEQUENCE.id,
      fps: 24,
    }),
  );
  TestValidator.predicate(
    "spec snapshot",
    filmEffectValuesClose(result.spec, SPEC),
  );
  TestValidator.equals(
    "encode output path",
    encoded[0]?.outputPath,
    "out/seq.mp4",
  );
  TestValidator.equals("encode args", encoded[0]?.args, result.plan.ffmpegArgs);
  TestValidator.equals(
    "planned input pattern",
    result.inputPattern,
    "frames/seq/frame_%05d.png",
  );
}
