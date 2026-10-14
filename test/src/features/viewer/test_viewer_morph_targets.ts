import type {
  IAutoMovieMesh,
  IAutoMovieMeshMorphTarget,
  IAutoMovieModel,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  applyExpression,
  applyPose,
  buildGeometry,
  buildModel,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";
import { joint, makePose } from "../internal/fixtures";
import { nclose } from "../internal/predicates";

/**
 * A mesh's morph targets become named relative morph attributes, expressions drive them by name, and applyPose writes pose-driven weights beside the bone rotations. The unit observes built geometry, dictionaries and influences, not GPU pixels.
 *
 * Scenarios:
 * 1. buildGeometry uploads relative position deltas named after their targets, with zero normal deltas for a target without normals when another has them; a geometry whose targets all lack normals carries no normal morphs, and a mesh without targets carries none.
 * 2. buildModel's mesh lists both targets in its morph dictionary at rest weight zero.
 * 3. applyExpression writes the expression channel's weight to the target of that name and leaves the driven target alone.
 * 4. applyPose writes the driven target's curve weight for the pose's spine flexion, updates it for a later pose, and leaves the expression target alone.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds geometry and models through the viewer and applies expressions and poses through its public functions, reading attributes, the morph dictionary and influences; catches absolute instead of relative targets, unnamed attributes, misaligned normal morphs, an expression overwriting a driven target and a pose that never writes its corrective.
 * @evidence contracts/testing.md#independent-expectations Delta values are the authored ones, the expected driven weight is the authored curve (0 to 1 over 0 to 90 degrees) at the posed angle, and the expression weight is the authored blendshape weight.
 * @evidence contracts/testing.md#distinguishing-cases Targets with and without normals, a geometry with none, driven and expression-addressed targets under both a pose and an expression, and two successive poses. Admission and the engine's weight arithmetic belong to the validation and kinematics tests.
 * @evidence contracts/testing.md#execution-ownership A portable unit over CPU-side Three objects and a synthetic internal fixture; it starts no browser, GPU or process.
 */
export function test_viewer_morph_targets(): void {
  const model: IAutoMovieModel = createSkinnedTubeModel("dual-quaternion");
  const mesh: IAutoMovieMesh = (
    model.parts[0]!.geometry as { type: "mesh"; mesh: IAutoMovieMesh }
  ).mesh;
  const count: number = mesh.positions.length;
  const open: number[] = new Array<number>(count).fill(0.25);
  const bulge: number[] = new Array<number>(count).fill(-0.5);
  const bulgeNormals: number[] = new Array<number>(count).fill(0.125);
  const targets: IAutoMovieMeshMorphTarget[] = [
    { name: "jawOpen", positions: open, normals: null },
    {
      name: "bend-bulge",
      positions: bulge,
      normals: bulgeNormals,
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
  mesh.targets = targets;

  // 1. geometry
  const geometry: THREE.BufferGeometry = buildGeometry({ type: "mesh", mesh });
  const position: THREE.BufferAttribute[] =
    geometry.morphAttributes.position as THREE.BufferAttribute[];
  const normal: THREE.BufferAttribute[] =
    geometry.morphAttributes.normal as THREE.BufferAttribute[];
  TestValidator.equals(
    "targets upload as named relative deltas with aligned normal morphs",
    [
      geometry.morphTargetsRelative,
      position.map((a: THREE.BufferAttribute): string => a.name),
      position[0]!.getX(5),
      position[1]!.getZ(9),
      normal.map((a: THREE.BufferAttribute): string => a.name),
      normal[0]!.getY(3),
      normal[1]!.getY(3),
    ],
    [true, ["jawOpen", "bend-bulge"], 0.25, -0.5, ["jawOpen", "bend-bulge"], 0, 0.125],
  );
  const normalLess: THREE.BufferGeometry = buildGeometry({
    type: "mesh",
    mesh: { ...mesh, targets: [{ ...targets[0]! }] },
  });
  const bare: THREE.BufferGeometry = buildGeometry({
    type: "mesh",
    mesh: { ...mesh, targets: undefined },
  });
  TestValidator.equals(
    "normal morphs exist only when a target has normals, morphs only with targets",
    [
      normalLess.morphAttributes.position?.length,
      normalLess.morphAttributes.normal,
      bare.morphAttributes.position,
    ],
    [1, undefined, undefined],
  );

  // 2. dictionary
  const built: IAutoMovieModelObject = buildModel(model);
  const tube: THREE.Mesh = built.parts.get("tube") as THREE.Mesh;
  const dictionary: { [key: string]: number } = tube.morphTargetDictionary!;
  const influences: number[] = tube.morphTargetInfluences!;
  TestValidator.equals(
    "the built mesh names both targets at weight zero",
    [dictionary["jawOpen"], dictionary["bend-bulge"], [...influences]],
    [0, 1, [0, 0]],
  );

  // 3. expression
  influences[1] = 0.3;
  applyExpression(built, {
    preset: "neutral",
    intensity: 0,
    blendshapes: [{ channel: "jawOpen", weight: 0.6 }],
  });
  TestValidator.equals(
    "an expression drives its channel's target and leaves the driven one",
    [influences[0], influences[1]],
    [0.6, 0.3],
  );

  // 4. pose
  applyPose(built, makePose([joint("spine", { flexion: 45 })]), model.skeleton!);
  TestValidator.predicate(
    "a pose writes its driven weight",
    nclose(influences[1]!, 0.5) && influences[0] === 0.6,
  );
  applyPose(built, makePose([joint("spine", { flexion: 90 })]), model.skeleton!);
  TestValidator.predicate(
    "a later pose updates the driven weight",
    nclose(influences[1]!, 1) && influences[0] === 0.6,
  );
  applyPose(built, makePose([]), model.skeleton!);
  TestValidator.predicate(
    "a neutral pose returns the driven weight to the curve at zero",
    nclose(influences[1]!, 0),
  );
}
