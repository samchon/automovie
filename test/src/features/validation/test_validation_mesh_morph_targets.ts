import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieMesh,
  IAutoMovieMeshMorphTarget,
  IAutoMovieModel,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";
import { hasViolation } from "../internal/predicates";

/**
 * Model admission checks a mesh's morph targets for buffer length, finiteness, unique nonempty names and well-formed drivers, and refuses a driven target under a name expressions write.
 *
 * Scenarios:
 * 1. A tube with an undriven target, a driven target and a target without normals is admitted; an undriven target may take an ARKit name.
 * 2. Position and normal buffers of the wrong length, and a nonfinite delta, are refused at their paths.
 * 3. An empty name and a duplicated name are refused.
 * 4. A driver naming a bone outside the skeleton, an unknown axis, an empty curve, a nonfinite point and a non-increasing source are refused.
 * 5. A driven target named after an ARKit channel, in any case, or a preset is refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs validateModel over whole models and reads success and violation paths; catches admitted malformed buffers, names and drivers, and an expression-named driven target that the viewer would overwrite every frame.
 * @evidence contracts/testing.md#independent-expectations Lengths follow the glTF rule of one delta triple per vertex, curve rules follow IAutoMovieDrivenCurve's contract, and the name rule follows the documented expression vocabulary; expectations are read from those contracts, not from the validator.
 * @evidence contracts/testing.md#distinguishing-cases Valid driven, undriven and normal-less targets beside each malformed field, an undriven ARKit name beside a driven one in another case, and a preset name. Weight resolution and rendering belong to the kinematics and viewer tests.
 * @evidence contracts/testing.md#execution-ownership A portable engine unit over a synthetic internal fixture; it starts no browser, GPU or process.
 */
export function test_validation_mesh_morph_targets(): void {
  const vertexCount: number = 16 * 17;
  const deltas: number[] = new Array<number>(vertexCount * 3).fill(0.01);
  const valid: () => IAutoMovieMeshMorphTarget[] =
    (): IAutoMovieMeshMorphTarget[] => [
      { name: "jawOpen", positions: [...deltas], normals: [...deltas] },
      {
        name: "bend-bulge",
        positions: [...deltas],
        normals: null,
        driver: {
          bone: "spine",
          axis: "flexion",
          curve: {
            points: [
              { source: 0, output: 0 },
              { source: 90, output: 1 },
            ],
          },
        },
      },
    ];
  const modelWith: (
    edit: (targets: IAutoMovieMeshMorphTarget[]) => void,
  ) => IAutoMovieModel = (
    edit: (targets: IAutoMovieMeshMorphTarget[]) => void,
  ): IAutoMovieModel => {
    const model: IAutoMovieModel = createSkinnedTubeModel();
    const mesh: IAutoMovieMesh = (
      model.parts[0]!.geometry as { type: "mesh"; mesh: IAutoMovieMesh }
    ).mesh;
    mesh.targets = valid();
    edit(mesh.targets);
    return model;
  };
  const refused: (
    title: string,
    edit: (targets: IAutoMovieMeshMorphTarget[]) => void,
    kind: "type" | "range",
    path: string,
  ) => void = (
    title: string,
    edit: (targets: IAutoMovieMeshMorphTarget[]) => void,
    kind: "type" | "range",
    path: string,
  ): void =>
    TestValidator.predicate(
      title,
      hasViolation(validateModel({ model: modelWith(edit) }), kind, path),
    );

  // 1. valid targets
  TestValidator.equals(
    "driven, undriven and normal-less targets are admitted",
    validateModel({ model: modelWith((): void => {}) }).success,
    true,
  );

  // 2. buffers
  refused(
    "short position deltas are refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[0]!.positions.pop();
    },
    "type",
    "targets[0].positions",
  );
  refused(
    "short normal deltas are refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[0]!.normals = [0, 0, 1];
    },
    "type",
    "targets[0].normals",
  );
  refused(
    "a nonfinite delta is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.positions[7] = Number.NaN;
    },
    "range",
    "targets[1].positions[7]",
  );

  // 3. names
  refused(
    "an empty name is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[0]!.name = "";
    },
    "type",
    "targets[0].name",
  );
  refused(
    "a duplicated name is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.name = "jawOpen";
      t[1]!.driver = null;
    },
    "type",
    "targets[1].name",
  );

  // 4. drivers
  refused(
    "a driver bone outside the skeleton is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.driver!.bone = "leftHand";
    },
    "type",
    "targets[1].driver.bone",
  );
  refused(
    "an unknown driver axis is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      (t[1]!.driver as { axis: string }).axis = "roll";
    },
    "type",
    "targets[1].driver.axis",
  );
  refused(
    "an empty curve is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.driver!.curve.points = [];
    },
    "type",
    "targets[1].driver.curve.points",
  );
  refused(
    "a nonfinite curve output is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.driver!.curve.points[1]!.output = Number.POSITIVE_INFINITY;
    },
    "range",
    "targets[1].driver.curve.points[1].output",
  );
  refused(
    "a non-increasing curve source is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.driver!.curve.points[1]!.source = 0;
    },
    "range",
    "targets[1].driver.curve.points[1].source",
  );

  // 5. expression names
  refused(
    "a driven target named after an ARKit channel in another case is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[0]!.name = "open";
      t[1]!.name = "JAWOPEN";
    },
    "type",
    "targets[1].name",
  );
  refused(
    "a driven target named after a preset is refused",
    (t: IAutoMovieMeshMorphTarget[]): void => {
      t[1]!.name = "blink";
    },
    "type",
    "targets[1].name",
  );
}
