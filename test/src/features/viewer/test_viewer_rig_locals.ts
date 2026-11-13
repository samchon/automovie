import type {
  AutoMovieHumanoidBone,
  IAutoMovieModel,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  type IAutoMovieRigLocalTransform,
  applyAutoMovieRigLocals,
  buildModel,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Complete local translation and rotation reach the displayed rig and skin.
 *
 * Scenarios:
 *
 * 1. Both skin methods display a translated child, opposed quarter-turn bone
 * rotations and a quarter-turn root under an ancestor moved since last update.
 * 2. Vertex queries and populated bounds follow the new pose without a host
 * matrix update, and neutral restoration returns the skin to its rest shape.
 * 3. Missing and extra slots, nonfinite bone/root components, nonunit and
 * zero quaternions refuse before any root, bone, matrix or bound changes.
 * 4. Empty nonrigged maps apply root placement, and a negative unit
 * quaternion remains valid without normalization or sign canonicalization.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real viewer skins, primes vertex/bound caches, applies complete locals and reads world bone matrices, skinned vertices and bounds; catches lost folded-parent translation, stale matrix/bind inverse or skin caches, partial invalid writes and rejected empty rigs.
 * @evidence contracts/development/testing.md#independent-expectations A fully spine-weighted terminal vertex starts at (0.2,2,0); inverse bind subtracts (0,1,0), opposing bone z quarter-turns plus the authored child translation place it at (0.2,1.5,0), and root y quarter-turn plus root/ancestor translations give (2,4.5,-0.2). Neutral expectation is its literal rest coordinate plus the ancestor. These closed-form rigid endpoints apply to both linear and dual-quaternion blends without a second skin solver.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers both blend methods, populated and invalidated bounds, changed ancestors, manual bone matrices, root/bone translation and rotation, neutral restoration, empty maps, missing/extra slots, NaN/infinity, malformed tuples, zero/nonunit rotations and equivalent negative quaternion sign; semantic joint evaluation remains the engine's tests.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable portable CPU unit uses maintained Viewer APIs and the shared synthetic tube fixture, without a browser, GPU, process, Human generation or production installation.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: Both skin methods display a translated child, opposed quarter-turn bone).
 */
export function test_viewer_rig_locals(): void {
  const defects: string[] = [];
  const check: (label: string, value: boolean) => void = (
    label: string,
    value: boolean,
  ): void => {
    if (!value) defects.push(label);
  };
  const identity: IAutoMovieRigLocalTransform = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  };
  const half: number = Math.SQRT1_2;
  const root: IAutoMovieRigLocalTransform = {
    translation: [0, 3, 0],
    rotation: [0, half, 0, half],
  };
  const locals: ReadonlyMap<
    AutoMovieHumanoidBone,
    IAutoMovieRigLocalTransform
  > = new Map<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>([
    ["hips", { translation: [1, 0, 0], rotation: [0, 0, half, half] }],
    ["spine", { translation: [0.5, 1, 0], rotation: [0, 0, -half, half] }],
  ]);
  const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform> =
    new Map<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>([
      ["hips", identity],
      ["spine", { ...identity, translation: [0, 1, 0] }],
    ]);

  for (const method of ["linear", "dual-quaternion"] as const) {
    const source: IAutoMovieModel = createSkinnedTubeModel(method);
    const target: IAutoMovieModelObject = buildModel(source);
    const mesh: THREE.SkinnedMesh = target.parts.get(
      "tube",
    ) as THREE.SkinnedMesh;
    const ancestor: THREE.Group = new THREE.Group();
    ancestor.add(target.object);
    ancestor.updateMatrixWorld(true);
    mesh.getVertexPosition(256, new THREE.Vector3());
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();

    // A manual bone matrix still follows the public adapter's explicit write.
    target.bones.get("spine")!.matrixAutoUpdate = false;
    target.object.scale.set(2, 3, 4);
    target.bones.get("hips")!.scale.set(2, 3, 4);
    ancestor.position.set(2, 0, 0);
    applyAutoMovieRigLocals(target, locals, root);
    const endpoint: THREE.Vector3 = mesh
      .getVertexPosition(256, new THREE.Vector3())
      .applyMatrix4(mesh.matrixWorld);
    const child: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
      target.bones.get("spine")!.matrixWorld,
    );
    check(
      `${method}: translated child world`,
      child.distanceTo(new THREE.Vector3(2, 3.5, 0)) < 1e-6,
    );
    check(
      `${method}: displayed endpoint`,
      endpoint.distanceTo(new THREE.Vector3(2, 4.5, -0.2)) < 1e-6,
    );
    check(
      `${method}: unit rig scale`,
      target.object.scale.equals(new THREE.Vector3(1, 1, 1)) &&
        target.bones.get("hips")!.scale.equals(new THREE.Vector3(1, 1, 1)),
    );
    const bounds: THREE.Box3 = new THREE.Box3().setFromObject(mesh);
    check(
      `${method}: refreshed bounds contain endpoint`,
      bounds.containsPoint(endpoint),
    );
    applyAutoMovieRigLocals(target, rest, identity);
    const restored: THREE.Vector3 = mesh
      .getVertexPosition(256, new THREE.Vector3())
      .applyMatrix4(mesh.matrixWorld);
    check(
      `${method}: rest restored`,
      restored.distanceTo(new THREE.Vector3(2.2, 2, 0)) < 1e-6,
    );

    // All invalid inputs are checked against the same fully populated state.
    mesh.computeBoundingBox();
    mesh.computeBoundingSphere();
    const box: THREE.Box3 = mesh.boundingBox;
    const sphere: THREE.Sphere = mesh.boundingSphere;
    const unchanged: number[] = transformState(target);
    const invalid: [
      string,
      ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieRigLocalTransform>,
      IAutoMovieRigLocalTransform,
    ][] = [
      ["missing", new Map([["hips", identity]]), root],
      ["extra", new Map([...rest, ["head", identity]]), root],
      [
        "wrong slot",
        new Map([
          ["hips", identity],
          ["head", identity],
        ]),
        root,
      ],
      [
        "nonfinite bone",
        new Map([
          ...rest,
          ["spine", { ...identity, translation: [0, NaN, 0] }],
        ]),
        root,
      ],
      ["nonfinite root", rest, { ...root, translation: [0, Infinity, 0] }],
      ["nonfinite quaternion", rest, { ...root, rotation: [0, 0, NaN, 1] }],
      [
        "short translation",
        rest,
        {
          ...root,
          translation: [0, 0],
        } as unknown as IAutoMovieRigLocalTransform,
      ],
      [
        "long quaternion",
        rest,
        {
          ...root,
          rotation: [0, 0, 0, 1, 0],
        } as unknown as IAutoMovieRigLocalTransform,
      ],
      [
        "nonunit",
        new Map([...rest, ["spine", { ...identity, rotation: [0, 0, 0, 2] }]]),
        root,
      ],
      ["zero", rest, { ...root, rotation: [0, 0, 0, 0] }],
    ];
    for (const [label, map, placement] of invalid) {
      check(
        `${method}: refuses ${label}`,
        throwsError((): void =>
          applyAutoMovieRigLocals(target, map, placement),
        ),
      );
      check(
        `${method}: ${label} preserves graph`,
        transformState(target).every((value: number, i: number): boolean =>
          nclose(value, unchanged[i]!, 0),
        ) &&
          mesh.boundingBox === box &&
          mesh.boundingSphere === sphere,
      );
    }
  }

  const empty: IAutoMovieModelObject = {
    object: new THREE.Group(),
    bones: new Map(),
    parts: new Map(),
  };
  applyAutoMovieRigLocals(empty, new Map(), {
    translation: [1, 2, 3],
    rotation: [0, 0, 0, -1],
  });
  check(
    "empty rig root and quaternion sign",
    nclose(empty.object.matrixWorld.elements[12]!, 1, 0) &&
      nclose(empty.object.matrixWorld.elements[13]!, 2, 0) &&
      nclose(empty.object.matrixWorld.elements[14]!, 3, 0) &&
      nclose(empty.object.quaternion.w, -1, 0),
  );
  TestValidator.equals("complete rig locals and atomic admission", defects, []);
}

/** Capture the observable local/world graph state for atomic-refusal checks. */
function transformState(target: IAutoMovieModelObject): number[] {
  return [target.object, ...target.bones.values()].flatMap(
    (object: THREE.Object3D): number[] => [
      ...object.position.toArray(),
      ...object.quaternion.toArray(),
      ...object.scale.toArray(),
      ...object.matrix.elements,
      ...object.matrixWorld.elements,
    ],
  );
}
