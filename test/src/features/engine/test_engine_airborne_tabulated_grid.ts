import { Quaternion, integrateAirborneRotation } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieIntegrateAirborneRotation,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * Verify positive inertia and increasing, turn-limited sample times through the
 * public tabulated history.
 *
 * Scenarios:
 *
 * 1. At the midpoint of the first interval with transverse moments 1, 1, 9, the
 *    interpolated principal moments stay positive.
 * 2. The sampled turns of a quadratic angle trajectory meet the requested bound,
 *    including the faster part near the span's end.
 * 3. A count beyond the packed table, a grid with duplicate floating-point
 *    seconds, and a turn beyond table capacity are rejected.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the public query, physical setup and timestamp and capacity failures.
 * @evidence contracts/development/testing.md#behavioral-verification Queries the midpoint tensor, observes actual shape samples and calls the same public history with impossible grids.
 * @evidence contracts/development/testing.md#independent-expectations Unit total central moments and opposite offsets give transverse inertia 1 + 2 r². The expected turns are differences of the prescribed angle t², with no shortest-arc wrap on this span.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers a positive interpolated tensor, meaningful finite turn refinement and three unrepresentable grids. The ordinary uniform-grid test checks the smooth off-knot solution.
 * @evidence contracts/development/testing.md#execution-ownership A discoverable unit test using in-memory shape callbacks and the production history.
 */
export function test_engine_airborne_tabulated_grid(): void {
  const model: IAutoMovieResolveCenterOfMass.IModel = {
    mass: 2,
    segments: (["hips", "head"] as const).map(
      (
        bone: AutoMovieHumanoidBone,
      ): IAutoMovieResolveCenterOfMass.ISegment => ({
        bone,
        mass: 1,
        point: { x: 0, y: 0, z: 0 },
        inertia: { x: 0.5, y: 0.5, z: 0.5 },
        axes: Quaternion.identity(),
      }),
    ),
  };
  const pose: IPose = (
    radius: number,
    radians: number,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      { x: 1, y: 0, z: 0 },
      (radians * 180) / Math.PI,
    );
    return new Map(
      model.segments.map(
        (
          part: IAutoMovieResolveCenterOfMass.ISegment,
          i: number,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
          part.bone,
          {
            bone: part.bone,
            localRotation: rotation,
            worldRotation: rotation,
            worldPosition: { x: i === 0 ? -radius : radius, y: 0, z: 0 },
          },
        ],
      ),
    );
  };
  const midpoint: IAutoMovieIntegrateAirborneRotation.IInstant =
    integrateAirborneRotation.tabulated(
      model,
      (t: number) => pose(t === 2 ? 2 : 0, 0),
      {
        from: 0,
        to: 2,
        step: 1,
      },
    )(0.5);
  TestValidator.predicate("positive transverse moments", () =>
    Object.values(midpoint.inertia.moments).every(
      (moment: number): boolean => moment > 0,
    ),
  );

  const seen: number[] = [];
  const rotating: (t: number) => ReturnType<IPose> = (
    t: number,
  ): ReturnType<typeof pose> => {
    seen.push(t);
    return pose(0, t * t);
  };
  const grid: Required<
    Parameters<typeof integrateAirborneRotation.tabulated>[2]
  > = {
    from: 0,
    to: 1,
    step: 0.25,
    turn: 0.15,
  };
  integrateAirborneRotation.tabulated(model, rotating, grid)(0.5);
  seen.sort((a: number, b: number): number => a - b);
  TestValidator.predicate(
    "adjacent sampled turns",
    () =>
      seen.length > 5 &&
      seen[0] === 0 &&
      seen[seen.length - 1] === 1 &&
      seen.slice(1).every((time: number, i: number): boolean => {
        const previous: number = seen[i]!;
        return (
          time > previous && time * time - previous * previous <= grid.turn
        );
      }),
  );

  TestValidator.error("too many uniform knots", () => {
    integrateAirborneRotation.tabulated(model, rotating, {
      ...grid,
      step: Number.MIN_VALUE,
    })(0.5);
  });
  TestValidator.error("indistinguishable seconds", () => {
    integrateAirborneRotation.tabulated(model, rotating, {
      from: 1,
      to: 1 + Number.EPSILON,
      step: Number.EPSILON / 4,
    })(1);
  });
  TestValidator.error("too many knots for requested turn", () => {
    integrateAirborneRotation.tabulated(model, rotating, {
      ...grid,
      turn: Number.MIN_VALUE,
    })(0.5);
  });
}

/**
 * The owned two-part pose at the prescribed radius in metres and angle in
 * radians.
 */
type IPose = (
  radius: number,
  radians: number,
) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
