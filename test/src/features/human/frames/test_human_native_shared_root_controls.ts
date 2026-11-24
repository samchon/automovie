import { nclose } from "../../internal/predicates";
import {
  AutoMovieHumanNativeFanControls as Fan,
  AutoMovieHumanNativeRootLaw as Root,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanNativeRoot,
} from "@automovie/interface";

/**
 * Shared root control response, preserved address residual and independent web depth.
 *
 * Scenarios:
 * 1. Clock zero stays held while another complete wall control moves in either sign; both original port targets follow that same response.
 * 2. Independent depth/breadth affine controls retain their literal calipers and zero-input controls without world-coordinate cancellation.
 * 3. Native-address increments preserve the original relief residual, a small signed edit and the original phase branch across pi.
 * 4. A web's along coordinate follows its own original/current chord ratio while depth stays held.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the root control and fan profile owners and collects every failure.
 * @evidence contracts/development/testing.md#independent-expectations Literal vector additions, diagonal scales, two-to-one chord arithmetic and original address increments supply expectations without evaluating the implementation twice.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes positive and negative wall edits, unchanged controls, a wrapped phase and invalid ratios and chords.
 * @evidence contracts/development/testing.md#execution-ownership Uses synthetic vectors and profile knots in a synchronous CPU test.
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the target controls, millimetre along and depth coordinates, and radian phase.
 */
export function test_human_native_shared_root_controls(): void {
  const failures: string[] = [];
  const basis: IAutoMovieHumanNativeRoot.ITargets["basis"] = {
    origin: [0, 0, 0],
    u: [1, 0, 0],
    v: [0, 0, 1],
  };
  const close = (
    what: string,
    actual: readonly number[],
    expected: readonly number[],
  ): void => {
    if (
      actual.length !== expected.length ||
      actual.some(
        (value: number, k: number): boolean =>
          !nclose(value, expected[k]!, 1e-12),
      )
    )
      failures.push(
        what +
          ": " +
          JSON.stringify(actual) +
          " expected " +
          JSON.stringify(expected),
      );
  };
  for (const sign of [-1, 1]) {
    const actual: IAutoMovieHumanNativeRoot.ICurves = Root.targets({
      parent: [
        [0, 0, 0],
        [0, 2, 0],
      ],
      child: [
        [1, 0, 0],
        [1, 2, 0],
      ],
      wall: [
        [0, 0, 0],
        [0, 2, 3 * sign],
      ],
      basis,
      scale: [1, 1],
    });
    close("complete parent wall carry", actual.parent[1]!, [0, 2, 3 * sign]);
    close("complete child wall carry", actual.child[1]!, [1, 2, 3 * sign]);
  }
  const anisotropic: IAutoMovieHumanNativeRoot.ICurves = Root.targets({
    parent: [
      [4, 0, 0],
      [4, 2, 1],
    ],
    child: [
      [5, 0, 0],
      [5, 2, 1],
    ],
    wall: [
      [5, 0, 0],
      [5, 2, 4],
    ],
    basis,
    scale: [2, 3],
  });
  close("independent affine parent", anisotropic.parent[1]!, [5, 2, 6]);
  close("independent affine child", anisotropic.child[1]!, [7, 2, 6]);
  const huge: AutoMovieVector3Tuple = [1e20, 2, 3];
  close(
    "zero delta preserves actual controls",
    Root.targets({
      parent: [huge],
      child: [huge],
      wall: [huge],
      basis,
      scale: [1, 1],
    }).child[0]!,
    huge,
  );
  close(
    "zero address increment retains original relief residual",
    Root.address([2, 1], [2.25, 1.125], [2.25, 1.125]),
    [2, 1],
  );
  for (const sign of [-1, 1])
    close(
      "small signed native increment",
      Root.address([2, 1], [2.25 + sign * 0.01, 1.125], [2.25, 1.125]),
      [2 + sign * 0.01, 1],
    );
  close(
    "original phase branch",
    Root.address(
      [3, Math.PI - 0.01],
      [3, -Math.PI + 0.01],
      [3, Math.PI - 0.01],
    ),
    [3, Math.PI + 0.01],
  );
  const web: [number, number][] = Fan.profile(
    [
      [0, 0],
      [2, 4],
      [4, 0],
    ],
    4,
    2,
  );
  close("normalized web along with independent depth", web[1]!, [1, 4]);
  close("unchanged web endpoint", Fan.profile([[4, 3]], 4, 4)[0]!, [4, 3]);
  for (const invalid of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    let refused: boolean = false;
    try {
      Fan.profile([[1, 2]], 4, invalid);
    } catch {
      refused = true;
    }
    if (!refused) failures.push("invalid fan chord accepted " + invalid);
    refused = false;
    try {
      Root.targets({
        parent: [[0, 0, 0]],
        child: [[1, 0, 0]],
        wall: [[0, 0, 0]],
        basis,
        scale: [invalid, 1],
      });
    } catch {
      refused = true;
    }
    if (!refused) failures.push("invalid root scale accepted " + invalid);
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
