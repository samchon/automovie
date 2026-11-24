import {
  encodeAutoMovieDrawPixels,
  mixAutoMovieStraightAlpha,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 * Transparent pictures are mixed and reduced in associated alpha, so a
 * transparent pixel's black never darkens a half-covered edge, and opaque
 * pictures mix exactly as before.
 *
 * Scenarios:
 *
 * 1. A dissolve at weight 0.5 of white at alpha 255 with a pixel of alpha 0 gives
 *    white at alpha 127 or 128, not the grey near `(128, 128, 128)` a
 *    straight-colour mix gives.
 * 2. Two pixels of alpha 0 give colour 0 and alpha 0.
 * 3. A fade at its midpoint keeps an opaque pixel's straight colour within one
 *    code value and halves its alpha to 127 or 128.
 * 4. Two opaque pixels mix as straight colour: `(200, 100, 0)` and `(0, 100, 200)`
 *    at 0.5 give `(100, 100, 100)`.
 * 5. A weight outside 0 to 1 is refused.
 * 6. A supersampled 2 by 2 block, two samples of opaque red and two transparent,
 *    reduces to straight red at alpha 128; an opaque block reduces to its plain
 *    mean.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the byte mix the compositor mirrors and the page's supersample reduction on hand-made pixels; a straight-colour mix or average, which darkens the edge, fails.
 * @evidence contracts/development/testing.md#independent-expectations The associated-alpha mix follows Porter and Duff's over-operator algebra: half of white at full coverage is white at half coverage; the opaque mean and the fade's unchanged colour follow by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases Half-covered against empty and opaque pixels, a fade, both weight bounds' outside, and opaque against half-covered blocks; the compositor's GPU shader is observed by capture, not here.
 * @evidence contracts/development/testing.md#execution-ownership A portable unit discovered as `test_draw_alpha_dissolve_blend`; it computes on bytes and starts no renderer.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 6 numbered scenarios it runs, each naming the input and the behavior it pins.
 */
export function test_draw_alpha_dissolve_blend(): void {
  // 1. Half of white over nothing.
  const half: number[] = mixAutoMovieStraightAlpha(
    [255, 255, 255, 255],
    [0, 0, 0, 0],
    0.5,
  );
  TestValidator.predicate(
    "white stays white at half coverage",
    half[0] === 255 &&
      half[1] === 255 &&
      half[2] === 255 &&
      (half[3] === 127 || half[3] === 128),
  );

  // 2. Nothing over nothing.
  TestValidator.equals(
    "two empty pixels stay empty",
    mixAutoMovieStraightAlpha([10, 20, 30, 0], [40, 50, 60, 0], 0.5),
    [0, 0, 0, 0],
  );

  // 3. A fade's midpoint.
  const faded: number[] = mixAutoMovieStraightAlpha(
    [40, 120, 200, 255],
    null,
    0.5,
  );
  TestValidator.predicate(
    "a fade lowers alpha and keeps the colour",
    Math.abs(faded[0]! - 40) <= 1 &&
      Math.abs(faded[1]! - 120) <= 1 &&
      Math.abs(faded[2]! - 200) <= 1 &&
      (faded[3] === 127 || faded[3] === 128),
  );

  // 4. Opaque pixels.
  TestValidator.equals(
    "opaque pixels mix as straight colour",
    mixAutoMovieStraightAlpha([200, 100, 0, 255], [0, 100, 200, 255], 0.5),
    [100, 100, 100, 255],
  );

  // 5. Weight bounds.
  for (const weight of [-0.1, 1.1, Number.NaN])
    TestValidator.predicate(
      `weight ${weight} is refused`,
      throwsError(
        (): unknown => mixAutoMovieStraightAlpha([0, 0, 0, 255], null, weight),
        "outside 0 to 1",
      ),
    );

  // 6. Supersample reduction; rows come bottom-up, so one block is the whole target.
  const decode: (text: string) => number[] = (text: string): number[] =>
    Array.from(atob(text), (character: string): number =>
      character.charCodeAt(0),
    );
  TestValidator.equals(
    "a half-covered block keeps its straight colour",
    decode(
      encodeAutoMovieDrawPixels(
        Uint8Array.from([
          255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 255,
        ]),
        2,
        2,
        2,
      ),
    ),
    [255, 0, 0, 128],
  );
  TestValidator.equals(
    "an opaque block is its plain mean",
    decode(
      encodeAutoMovieDrawPixels(
        Uint8Array.from([
          0, 10, 100, 255, 20, 30, 101, 255, 0, 10, 100, 255, 20, 31, 101, 255,
        ]),
        2,
        2,
        2,
      ),
    ),
    [10, 20, 101, 255],
  );
}
