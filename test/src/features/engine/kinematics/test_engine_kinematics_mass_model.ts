import { AutoMovieEngineKinematics, AutoMovieEngineText } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBody, IAutoMoviePose, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";

/**
 * A body's segmental mass model and its prepared snapshot: `fromRig` builds the
 * model from a prepared rig, `mean` is the mass-weighted mean of per-segment
 * points, and `AutoMovieEngineKinematics.prepareAutoMovieMassModel` answers the centre, the posed parts,
 * the composite inertia and the interval momentum exactly as the direct readers
 * do; `AutoMovieEngineKinematics.applyAutoMovieMomentumTensor` is T v.
 *
 * Fixture: the average adult body; poses A (left shoulder flexed 40) and B
 * (also the right hip flexed 30), resolved with the body's own rig.
 *
 * Scenarios:
 *
 * 1. `fromRig` on the body's rig matches the model from the skeleton: same mass,
 *    segment points within 1e-12.
 * 2. `mean` with segment i read at (i, 0, 0) gives x = sum m_i i / M.
 * 3. The prepared bones are the segments' bones; its centre and posed centre equal
 *    `AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace`, its inertia
 *    `AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia` and its momentum over 0.1 s
 *    `AutoMovieEngineKinematics.resolveAutoMovieMomentum`, all exactly.
 * 4. `apply` of [[1,2,3],[4,5,6],[7,8,9]] to (1, 0, -1) is (-2, -2, -2).
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers mass setup from a rig, weighted segment readings, prepared and direct operations, and tensor application.
 * @evidence contracts/development/testing.md#behavioral-verification Builds the stock model and two resolved poses, then exercises the direct and prepared mass, centre, part, inertia and momentum readers. It releases prepared model storage.
 * @evidence contracts/development/testing.md#independent-expectations The profile supplies segment masses for an independently accumulated index-weighted mean. Multiplying the written tensor by (1, 0, -1) gives (-2, -2, -2). Prepared and direct agreement is a separate consistency check.
 */
export async function test_engine_kinematics_mass_model(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const model: IAutoMovieResolveCenterOfMass.IModel =
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
  const posed = (
    pose: IAutoMoviePose,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    new Map(
      AutoMovieEngineKinematics.resolvePose(pose, body.skeleton).map(
        (
          b: IAutoMovieResolvedBone,
        ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [b.bone, b],
      ),
    );
  const A = posed({
    skeleton: body.skeleton.id,
    root: null,
    joints: [
      { bone: "leftUpperArm", flexion: 40, abduction: null, twist: null },
    ],
  });
  const B = posed({
    skeleton: body.skeleton.id,
    root: null,
    joints: [
      { bone: "leftUpperArm", flexion: 40, abduction: null, twist: null },
      { bone: "rightUpperLeg", flexion: 30, abduction: null, twist: null },
    ],
  });

  // 1.
  const fromRig: IAutoMovieResolveCenterOfMass.IModel =
    AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassFromRig(body.poseResolution, body.profile);
  TestValidator.predicate(
    "from rig",
    fromRig.mass === model.mass &&
      fromRig.segments.length === model.segments.length &&
      fromRig.segments.every((s, i: number): boolean => {
        const t = model.segments[i]!;
        return (
          s.bone === t.bone &&
          Math.hypot(
            s.point.x - t.point.x,
            s.point.y - t.point.y,
            s.point.z - t.point.z,
          ) <= 1e-12
        );
      }),
  );

  // 2.
  const weighted: number =
    model.segments.reduce(
      (sum: number, s, i: number): number => sum + s.mass * i,
      0,
    ) / model.mass;
  const mean: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassMean(
    model,
    (_s, i: number) => ({ x: i, y: 0, z: 0 }),
  );
  TestValidator.predicate(
    "mean",
    Math.abs(mean.x - weighted) <= 1e-12 && mean.y === 0 && mean.z === 0,
  );

  // 3.
  const prepared = AutoMovieEngineKinematics.prepareAutoMovieMassModel(model);
  try {
    TestValidator.equals(
      "bones",
      [...AutoMovieEngineKinematics.prepareAutoMovieMassModelBones(prepared)].sort(
        AutoMovieEngineText.compareCodeUnits,
      ),
      [...new Set(model.segments.map((s) => s.bone))].sort(
        AutoMovieEngineText.compareCodeUnits,
      ),
    );
    const centre: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(
      model,
      A,
    );
    TestValidator.equals(
      "place",
      AutoMovieEngineKinematics.prepareAutoMovieMassModelPlace(prepared, A),
      centre,
    );
    const before = AutoMovieEngineKinematics.prepareAutoMovieMassModelPose(prepared, A);
    TestValidator.equals("posed centre", before.centre, centre);
    TestValidator.equals(
      "inertia",
      AutoMovieEngineKinematics.prepareAutoMovieMassModelInertia(prepared, before),
      AutoMovieEngineKinematics.resolveAutoMovieMomentumInertia(model, A),
    );
    const after = AutoMovieEngineKinematics.prepareAutoMovieMassModelPose(prepared, B);
    TestValidator.equals(
      "momentum",
      AutoMovieEngineKinematics.prepareAutoMovieMassModelBetween(prepared, before, after, 0.1),
      AutoMovieEngineKinematics.resolveAutoMovieMomentum(model, A, B, 0.1),
    );
  } finally {
    AutoMovieEngineKinematics.releaseAutoMovieMassModel(prepared);
  }

  // 4.
  TestValidator.equals(
    "apply",
    AutoMovieEngineKinematics.applyAutoMovieMomentumTensor(
      [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9],
      ],
      { x: 1, y: 0, z: -1 },
    ),
    { x: -2, y: -2, z: -2 },
  );
}
