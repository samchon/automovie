import { resolveAutoMovieLensAt } from "@automovie/engine";
import type {
  IAutoMovieCameraIntent,
  IAutoMovieFilmOptics,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * Resolve the lens a frame draws from a shot's intents: which intent is active,
 * when it resolves sharp, and how the focused depth is measured.
 *
 * Scenarios:
 *
 * 1. With intents starting at 0 (f/2.8, focus 3 m ahead) and 2 (f/4, focus 5 m
 *    ahead), second 1 resolves f/2.8 at 3 m and second 2 resolves f/4 at 5 m;
 *    second −0.5, before any start, resolves null.
 * 2. An intent without `fNumber`, and one with `fNumber` but a null focus, resolve
 *    null.
 * 3. The depth is measured along the camera's forward axis from where it stands: a
 *    camera dollied 1 m toward the mark, with a forward of length 3, resolves 2
 *    m; a mark 0.5 m to the side does not change the depth.
 * 4. A mark behind the camera resolves null.
 */
export function test_engine_film_camera_lens_resolve(): void {
  const intent: (
    start: number,
    depth: number | null,
    fNumber?: number,
  ) => IAutoMovieCameraIntent = (
    start: number,
    depth: number | null,
    fNumber?: number,
  ): IAutoMovieCameraIntent => ({
    start,
    framing: "medium",
    move: "static",
    focus: depth === null ? null : { x: 0, y: 0, z: -depth },
    focalLength: null,
    ...(fNumber === undefined ? {} : { fNumber }),
  });
  const at: (
    intents: IAutoMovieCameraIntent[],
    seconds: number,
    z?: number,
  ) => IAutoMovieFilmOptics.ILens | null = (
    intents: IAutoMovieCameraIntent[],
    seconds: number,
    z: number = 0,
  ): IAutoMovieFilmOptics.ILens | null =>
    resolveAutoMovieLensAt({
      intents,
      seconds,
      position: { x: 0, y: 0, z },
      forward: { x: 0, y: 0, z: -3 },
    });
  const close: (
    lens: IAutoMovieFilmOptics.ILens | null,
    fNumber: number,
    depth: number,
  ) => boolean = (
    lens: IAutoMovieFilmOptics.ILens | null,
    fNumber: number,
    depth: number,
  ): boolean =>
    lens !== null &&
    lens.fNumber === fNumber &&
    nclose(lens.focusDistance, depth, 1e-12);

  // 1. The active intent, listed out of order.
  const both: IAutoMovieCameraIntent[] = [intent(2, 5, 4), intent(0, 3, 2.8)];
  TestValidator.equals(
    "the latest started intent is active",
    [close(at(both, 1), 2.8, 3), close(at(both, 2), 4, 5), at(both, -0.5)],
    [true, true, null],
  );

  // 2. Sharp intents.
  TestValidator.equals(
    "no stop or no lens subject resolves sharp",
    [at([intent(0, 3)], 1), at([intent(0, null, 2)], 1)],
    [null, null],
  );

  // 3. Depth along the forward axis from where the camera stands.
  const aside: IAutoMovieCameraIntent = {
    ...intent(0, 3, 2),
    focus: { x: 0.5, y: 0, z: -3 },
  };
  TestValidator.predicate(
    "a dolly shortens the depth and a sideways offset does not change it",
    close(at([intent(0, 3, 2)], 1, -1), 2, 2) && close(at([aside], 1), 2, 3),
  );

  // 4. Behind the camera.
  TestValidator.equals(
    "a mark behind the camera resolves sharp",
    at([intent(0, 3, 2)], 1, -4),
    null,
  );
}
