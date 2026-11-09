import {
  type IAutoMoviePreparedSurfaceFrame,
  type IAutoMovieSurfaceFrame,
  placeAutoMovieSurfaceFrame,
  prepareAutoMovieSurfaceFrame,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { nclose, vclose } from "../internal/predicates";

/**
 * A rigid three-point surface follows its requested centroid and orientation.
 *
 * Scenarios:
 * 1. A three-metre right triangle rotates from XZ to XY with known coordinates.
 * 2. Skew heading is projected into the normal plane without scaling any edge.
 * 3. Placing at the captured source frame reconstructs the original triangle.
 * 4. Later input and output edits cannot change another placement.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Prepares and places the public surface frame, asserting literal transformed points, centroid, all three independently known edge lengths, source reconstruction and independent repeated outputs. Translation-only placement, anisotropic scaling or retained caller arrays fail these assertions.
 * @evidence contracts/development/testing.md#independent-expectations The authored right triangle has centroid zero and edges 3, 3 and sqrt(18); the right-handed destination basis maps it to the literal XY coordinates independently of the implementation's basis helper. Tight tolerances permit ordinary binary64 rounding.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers destination translation and rotation, nonunit skew directions, source round trip and ownership after mutations; sign choice, tiny nonzero geometry and malformed inputs belong to companion tests.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable synchronous geometry test directly calls portable Engine APIs and owns every case without starting compilers, native hosts, browsers, GPUs or dynamic test registration.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: A three-metre right triangle rotates from XZ to XY with known coordinates.).
 */
export function test_geometry_surface_frame_rigid(): void {
  const source: IAutoMovieVector3[] = [
    { x: -1, y: 0, z: -1 },
    { x: 2, y: 0, z: -1 },
    { x: -1, y: 0, z: 2 },
  ];
  const prepared: IAutoMoviePreparedSurfaceFrame = prepareAutoMovieSurfaceFrame(
    source,
    { x: 0, y: 1, z: 0 },
  );
  const target: IAutoMovieSurfaceFrame = {
    origin: { x: 10, y: 20, z: 30 },
    forward: { x: 0, y: 5, z: 9 },
    normal: { x: 0, y: 0, z: 3 },
  };
  const placed: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(
    prepared,
    target,
  );
  const expected: IAutoMovieVector3[] = [
    { x: 9, y: 19, z: 30 },
    { x: 9, y: 22, z: 30 },
    { x: 12, y: 19, z: 30 },
  ];

  // Literal destination coordinates pin handedness as well as centroid movement.
  for (let i: number = 0; i < 3; i++)
    TestValidator.predicate(
      `placed point ${i}`,
      vclose(placed[i], expected[i]),
    );

  TestValidator.predicate(
    "all pairwise lengths remain the authored right triangle",
    nclose(
      Math.hypot(
        placed[0].x - placed[1].x,
        placed[0].y - placed[1].y,
        placed[0].z - placed[1].z,
      ),
      3,
    ) &&
      nclose(
        Math.hypot(
          placed[0].x - placed[2].x,
          placed[0].y - placed[2].y,
          placed[0].z - placed[2].z,
        ),
        3,
      ) &&
      nclose(
        Math.hypot(
          placed[1].x - placed[2].x,
          placed[1].y - placed[2].y,
          placed[1].z - placed[2].z,
        ),
        Math.sqrt(18),
      ),
  );
  TestValidator.predicate(
    "destination origin is the point centroid",
    vclose(
      {
        x: (placed[0].x + placed[1].x + placed[2].x) / 3,
        y: (placed[0].y + placed[1].y + placed[2].y) / 3,
        z: (placed[0].z + placed[1].z + placed[2].z) / 3,
      },
      target.origin,
    ),
  );

  const restored: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(
    prepared,
    prepared.frame,
  );
  for (let i: number = 0; i < 3; i++)
    TestValidator.predicate(
      `source round trip ${i}`,
      vclose(restored[i], source[i]),
    );

  // Preparation copies coordinates; each placement also owns its returned points.
  source[0].x = 999;
  placed[0].x = -999;
  const repeated: IAutoMovieVector3[] = placeAutoMovieSurfaceFrame(
    prepared,
    target,
  );
  for (let i: number = 0; i < 3; i++)
    TestValidator.predicate(
      `independent repeat ${i}`,
      vclose(repeated[i], expected[i]),
    );
}
