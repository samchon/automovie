import { AutoMovieEngineCurve } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieBicubicAtlasTessellation64,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";

/**
 * Raw bicubic tessellation refuses structurally invalid registry addresses
 * before its first chunk. A patch with a nonfinite coefficient reports a local
 * arithmetic omission and leaves independent finite charts available.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes coefficient registry address admission, first-chunk timing and patch-local arithmetic omission.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real plan, canonical boundary preparation and public iterator. It sums valid and arithmetic-failure triangle indices by patch through completion and asks each malformed stream for its first chunk.
 * @evidence contracts/development/testing.md#independent-expectations Two affine four-by-four coefficient grids each need one unsplit cell and emit two triangles. A fractional ordinal cannot address any registry slot. An invalid address or publication flag must throw before any chunk can be committed.
 */
export function test_engine_geometry_bicubic_address_admission(): void {
  const engine = AutoMovieEngineCurve;
  const ids = Array.from({ length: 16 }, (_, index) => index);
  const plane = ids.map(
    (id): AutoMovieVector3Tuple => [id % 4, 0, Math.floor(id / 4)],
  );
  const input: IAutoMovieBicubicAtlasTessellation64.Input = {
    topologyDomain: "direct-address-admission",
    controlsMm: [...plane, ...plane],
    patches: [
      { id: "first", controlIds: ids },
      { id: "independent", controlIds: ids.map((id) => id + 16) },
    ],
    toleranceMm: 0.01,
    maxCells: 2,
    maxVerticesPerChunk: 4,
  };
  const sides = [
    [0, 1, 2, 3],
    [3, 7, 11, 15],
    [12, 13, 14, 15],
    [0, 4, 8, 12],
  ] as const;
  const corners = [
    [0, 0, 0],
    [1, 0, 3],
    [1, 1, 15],
    [0, 1, 12],
  ] as const;
  const summarize = (value: IAutoMovieBicubicAtlasTessellation64.Input) => {
    const stream = engine.tessellateBicubicAtlas64(value);
    const indicesByPatch = new Map<string, number>();
    let next = stream.next();
    while (!next.done) {
      const { patch, indices } = next.value;
      indicesByPatch.set(
        patch,
        (indicesByPatch.get(patch) ?? 0) + indices.length,
      );
      next = stream.next();
    }
    return {
      indexCounts: value.patches.map(({ id }) => indicesByPatch.get(id) ?? 0),
      summary: next.value,
    };
  };
  TestValidator.equals(
    "one affine cell per patch",
    engine
      .bicubicAtlasPlan64(input, sides, corners)
      .plans.map((plan) => plan.cells.length),
    [1, 1],
  );
  TestValidator.equals(
    "two triangles per affine patch",
    summarize(input).indexCounts,
    [6, 6],
  );
  const invalidAddress: IAutoMovieBicubicAtlasTessellation64.Input = {
    ...input,
    patches: [
      { id: "first", controlIds: [0.5, ...ids.slice(1)] },
      input.patches[1]!,
    ],
  };
  TestValidator.predicate(
    "fractional patch address terminates before yield",
    throwsError(
      () => engine.tessellateBicubicAtlas64(invalidAddress).next(),
      "safe integer in the declared registry",
    ),
  );
  const authority = { id: "edge", controlIds: [0, 1, 2, 3] } as const;
  const bound: IAutoMovieBicubicAtlasTessellation64.Input = {
    ...input,
    boundaryAuthorities: [authority],
    boundaryBindings: [
      {
        patch: "first",
        side: 0,
        authority: "edge",
        start: 0,
        end: 1,
        normalFan: "face",
      },
    ],
  };
  TestValidator.equals(
    "exact canonical boundary identity",
    engine.prepareBicubicAtlasBoundary64(bound, sides).bindings.size,
    1,
  );
  const invalidAuthority: IAutoMovieBicubicAtlasTessellation64.Input = {
    ...bound,
    boundaryAuthorities: [{ ...authority, controlIds: [0.5, 1, 2, 3] }],
  };
  TestValidator.predicate(
    "fractional boundary owner address refuses directly",
    throwsError(
      () => engine.prepareBicubicAtlasBoundary64(invalidAuthority, sides),
      "four valid controls",
    ),
  );
  TestValidator.predicate(
    "fractional boundary owner address terminates before yield",
    throwsError(
      () => engine.tessellateBicubicAtlas64(invalidAuthority).next(),
      "four valid controls",
    ),
  );
  for (const member of [
    "retainTriangleParameters",
    "retainPatchCoefficients",
  ] as const)
    TestValidator.predicate(
      "invalid publication flag terminates before yield",
      throwsError(
        () =>
          engine
            .tessellateBicubicAtlas64({
              ...input,
              [member]: "yes" as unknown as boolean,
            })
            .next(),
        "retention flags must be boolean",
      ),
    );
  const arithmetic = summarize({
    ...input,
    controlsMm: [[NaN, 0, 0], ...input.controlsMm.slice(1)],
  });
  TestValidator.equals(
    "local failure leaves the independent chunk",
    arithmetic.indexCounts,
    [0, 6],
  );
  TestValidator.predicate(
    "local arithmetic diagnostic",
    arithmetic.summary.diagnostics.some((message) =>
      message.includes("first: arithmetic-unprocessed"),
    ),
  );
}
