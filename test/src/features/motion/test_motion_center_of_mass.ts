import {
  type IAutoMovieResolvedBone,
  resolveAutoMovieCenterOfMass,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePhysicalProfile,
  IAutoMoviePose,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * The whole-body centre of mass is the mass-weighted mean of the segments'
 * centres riding their bones, the extrapolated centre is Hof's `x + v / ω0`,
 * and the margin of stability is the signed distance to the support hull.
 *
 * The body is abstract geometry, not a figure: a 2 kg segment centred on a
 * root bone at (0, 1, 0) and a 1 kg segment centred 0.2 m below a child joint
 * 0.1 m to its +X.
 *
 * Scenarios:
 * 1. At rest the centre is (0.1/3, 2.8/3, 0), the weighted mean by hand.
 * 2. Metamorphic: translating the root by (1, 0, 2) translates the centre by
 *    the same; turning the root 90° about +Y turns the centre about the
 *    origin the same way. A pose's root translation is added to the rest
 *    root's, so a zero translation keeps the rest height.
 * 3. The extrapolated centre of (0, 1, 0) moving at 1 m/s along +X with a
 *    1 m pendulum lies 1 / sqrt(9.81) m ahead.
 * 4. The margin from a 0.2 m square's centre is +0.1 m, from 0.3 m outside
 *    its +X edge's middle -0.2 m, and from a two-point support it is minus
 *    the distance to the segment.
 * 5. An empty support, a non-positive pendulum length and a segment on a
 *    missing bone throw.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public owner on posed bones; a wrong weighting, a frame error or a sign flip fails.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is computed by hand from the definitions (weighted mean, Hof 2005), and the root transforms are metamorphic relations.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers rest, translation, rotation, inside and outside margins, a degenerate support and every refusal.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain geometry; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_center_of_mass(): void {
  const bone = (
    b: AutoMovieHumanoidBone,
    parent: AutoMovieHumanoidBone | null,
    t: IAutoMovieVector3,
  ): IAutoMovieBone => ({
    bone: b,
    parent,
    rest: {
      translation: t,
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    },
    constraint: null,
  });
  const skeleton: IAutoMovieSkeleton = {
    id: "pair",
    bones: [
      bone("hips", null, { x: 0, y: 1, z: 0 }),
      bone("leftUpperLeg", "hips", { x: 0.1, y: 0, z: 0 }),
    ],
  };
  const segment = (
    b: AutoMovieHumanoidBone,
    at: IAutoMovieVector3,
    mass: number,
    com: IAutoMovieVector3,
  ): IAutoMoviePhysicalProfile.ISegment => ({
    bone: b,
    neutral: { position: at, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    mass,
    centerOfMass: com,
    inertia: { x: 0.01, y: 0.01, z: 0.01 },
    inertiaRotation: { x: 0, y: 0, z: 0, w: 1 },
    shapes: [],
  });
  const profile = (
    segments: IAutoMoviePhysicalProfile.ISegment[],
  ): IAutoMoviePhysicalProfile => ({
    id: "pair",
    mass: segments.reduce((s, x) => s + x.mass, 0),
    centerOfMass: { x: 0, y: 0, z: 0 },
    segments,
    joints: [],
    collisionExclusions: [],
    materials: [],
    provenance: "test",
  });
  const model = resolveAutoMovieCenterOfMass(
    skeleton,
    profile([
      segment("hips", { x: 0, y: 1, z: 0 }, 2, { x: 0, y: 0, z: 0 }),
      segment("leftUpperLeg", { x: 0.1, y: 1, z: 0 }, 1, {
        x: 0,
        y: -0.2,
        z: 0,
      }),
    ]),
  );
  const posed = (
    root: IAutoMoviePose["root"],
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      resolvePose({ skeleton: "pair", root, joints: [] }, skeleton, {}, {}).map(
        (r) => [r.bone, r],
      ),
    );
  const near = (
    title: string,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): void =>
    TestValidator.predicate(
      `${title}: ${JSON.stringify(a)} against ${JSON.stringify(b)}`,
      Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) < 1e-9,
    );

  // 1. Rest.
  const rest: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    posed(null),
  );
  near("rest centre", rest, { x: 0.1 / 3, y: 2.8 / 3, z: 0 });
  TestValidator.equals("total mass", model.mass, 3);

  // 2. Metamorphic root transforms.
  const moved: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    posed({
      translation: { x: 1, y: 0, z: 2 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
    }),
  );
  near("translated centre", moved, { x: rest.x + 1, y: rest.y, z: rest.z + 2 });
  const s: number = Math.SQRT1_2;
  const turned: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    model,
    posed({
      translation: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: s, z: 0, w: s },
      scale: { x: 1, y: 1, z: 1 },
    }),
  );
  near("turned centre", turned, { x: 0, y: rest.y, z: -rest.x });

  // 3. Extrapolated centre.
  near(
    "extrapolated centre",
    resolveAutoMovieCenterOfMass.extrapolate(
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
      1,
    ),
    { x: 1 / Math.sqrt(9.81), y: 1, z: 0 },
  );

  // 4. Margins.
  const square: IAutoMovieVector3[] = [
    { x: -0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: -0.1 },
    { x: 0.1, y: 0, z: 0.1 },
    { x: -0.1, y: 0, z: 0.1 },
  ];
  TestValidator.predicate(
    "margin inside",
    Math.abs(
      resolveAutoMovieCenterOfMass.margin({ x: 0, y: 1, z: 0 }, square) - 0.1,
    ) < 1e-12,
  );
  TestValidator.predicate(
    "margin outside",
    Math.abs(
      resolveAutoMovieCenterOfMass.margin({ x: 0.3, y: 1, z: 0 }, square) + 0.2,
    ) < 1e-12,
  );
  TestValidator.predicate(
    "margin of a two-point support",
    Math.abs(
      resolveAutoMovieCenterOfMass.margin({ x: 0, y: 0, z: 0.05 }, [
        square[0]!,
        square[1]!,
      ]) + 0.15,
    ) < 1e-12,
  );

  // 5. Refusals.
  TestValidator.error("empty support", () =>
    resolveAutoMovieCenterOfMass.margin({ x: 0, y: 0, z: 0 }, []),
  );
  TestValidator.error("non-positive length", () =>
    resolveAutoMovieCenterOfMass.extrapolate(
      { x: 0, y: 1, z: 0 },
      { x: 1, y: 0, z: 0 },
      0,
    ),
  );
  TestValidator.error("segment on a missing bone", () =>
    resolveAutoMovieCenterOfMass(
      skeleton,
      profile([
        segment("chest", { x: 0, y: 1, z: 0 }, 1, { x: 0, y: 0, z: 0 }),
      ]),
    ),
  );
}
