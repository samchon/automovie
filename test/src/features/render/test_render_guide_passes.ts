import { AutoMovieGuidePass } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { AUTOMOVIE_GUIDE_PASSES, IAutoMovieGuidePassOutput, guidePassFrameName, guidePassFramePattern, isGuidePass, planGuidePassOutputs } from "@automovie/render";





import { throwsError } from "../internal/predicates";

/**
 * Guide passes make one deterministic frame schedule yield several diffusion-conditioning outputs: the beauty pass keeps the plain frame name so a single-pass render stays byte-compatible with every existing plan, and any other pass tags the filename before the extension, so pass outputs coexist in one frame directory and compose unchanged with chunking (#609).
 *
 * Scenarios:
 *
 * 1. The runtime pass list matches the closed union and `isGuidePass` accepts exactly its members.
 * 2. `guidePassFrameName` keeps `beauty` untagged and tags `depth` before the extension; custom extension and padding override the defaults.
 * 3. `guidePassFramePattern` mirrors the naming for ffmpeg input patterns.
 * 4. `planGuidePassOutputs` emits per-pass first/last/pattern paths, folding duplicates while preserving first-occurrence order.
 * 5. An unknown pass name and a non-positive frame count are caller bugs and throw.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises runtime pass admission, naming, encoder patterns and output planning, checking recognized modes, first-occurrence deduplication and explicit unknown-name/count refusal.
 * @evidence contracts/testing.md#independent-expectations The six declared guide modes and fixed five-digit PNG naming convention determine literal outputs independently of the formatter; beauty remains untagged and guide names precede the media extension. No image rendering or encoder pattern expansion occurs.
 * @evidence contracts/testing.md#distinguishing-cases Plain beauty, tagged depth/pose, custom padding/extensions, duplicates, empty requests, unknown modes and zero/fractional counts cover the owned branches; actual capture belongs to the headless adapter tests.
 * @evidence contracts/testing.md#execution-ownership The exported test_render_guide_passes owns its cases. Portable value and filename planning with no capture host or dynamic case registry.
 */
export function test_render_guide_passes(): void {
  TestValidator.equals(
    "closed pass list",
    [...AUTOMOVIE_GUIDE_PASSES],
    ["beauty", "depth", "mask", "normal", "outline", "pose"],
  );
  TestValidator.equals("known pass accepted", isGuidePass("depth"), true);
  TestValidator.equals("unknown pass rejected", isGuidePass("sketch"), false);

  TestValidator.equals(
    "beauty keeps the plain frame name",
    guidePassFrameName(42, "beauty"),
    "frame_00042.png",
  );
  TestValidator.equals(
    "depth tags the name before the extension",
    guidePassFrameName(42, "depth"),
    "frame_00042.depth.png",
  );
  TestValidator.equals(
    "custom extension and padding",
    guidePassFrameName(7, "pose", "webp", 3),
    "frame_007.pose.webp",
  );
  TestValidator.equals(
    "beauty pattern is the plain pattern",
    guidePassFramePattern("beauty"),
    "frame_%05d.png",
  );
  TestValidator.equals(
    "mask pattern is pass-tagged",
    guidePassFramePattern("mask", "webp", 3),
    "frame_%03d.mask.webp",
  );

  const outputs: IAutoMovieGuidePassOutput[] = planGuidePassOutputs({
    frameDir: "frames/shot",
    frameCount: 10,
    passes: ["depth", "beauty", "depth", "pose"],
  });
  TestValidator.equals(
    "duplicates fold, first occurrence wins the order",
    outputs.map(
      (output: IAutoMovieGuidePassOutput): AutoMovieGuidePass => output.pass,
    ),
    ["depth", "beauty", "pose"],
  );
  TestValidator.equals(
    "per-pass first frame",
    outputs[0]!.firstFrame,
    "frames/shot/frame_00000.depth.png",
  );
  TestValidator.equals(
    "per-pass last frame",
    outputs[2]!.lastFrame,
    "frames/shot/frame_00009.pose.png",
  );
  TestValidator.equals(
    "per-pass input pattern",
    outputs[1]!.inputPattern,
    "frames/shot/frame_%05d.png",
  );
  TestValidator.equals(
    "empty pass request plans nothing",
    planGuidePassOutputs({ frameDir: "d", frameCount: 1, passes: [] }),
    [],
  );

  TestValidator.predicate(
    "unknown pass throws",
    throwsError(
      (): IAutoMovieGuidePassOutput[] =>
        planGuidePassOutputs({
          frameDir: "d",
          frameCount: 1,
          passes: ["sketch"],
        }),
      'unknown guide pass "sketch"',
    ),
  );
  TestValidator.predicate(
    "zero frame count throws",
    throwsError(
      (): IAutoMovieGuidePassOutput[] =>
        planGuidePassOutputs({ frameDir: "d", frameCount: 0, passes: [] }),
      "positive integer",
    ),
  );
  TestValidator.predicate(
    "fractional frame count throws",
    throwsError(
      (): IAutoMovieGuidePassOutput[] =>
        planGuidePassOutputs({ frameDir: "d", frameCount: 1.5, passes: [] }),
      "positive integer",
    ),
  );
}
