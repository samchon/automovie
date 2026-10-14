import {
  IAutoMovieExpression,
  IAutoMovieModel,
  IAutoMoviePose,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  type IAutoMovieViewerFrame,
  AutoMoviePlayer,
  IAutoMovieViewerSnapshotRenderer,
  applyExpression,
  buildModel,
  captureViewerSnapshot,
  createImportedModelObject,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import {
  IDENTITY_TRANSFORM,
  createModel,
  createSkeleton,
  keyframe,
  makeMotion,
} from "../internal/fixtures";
import { namedFacts, nclose, throwsError } from "../internal/predicates";

/**
 * Existing generic model cases bind skinned parts, preserve rigid-attachment precedence and deliver pose/expression/runtime updates through one player timestamp. The snapshot case observes a supplied render callback before its supplied canvas encoder; no GPU renderer or new Human driver is acquired.
 *
 * Scenarios:
 *
 * 1. A skin creates a SkinnedMesh with skinIndex/skinWeight attributes bound to the requested bones.
 * 2. attachedBone takes precedence over a skin payload; a missing skin joint refuses.
 * 3. Expression application drives morph dictionaries and imported sinks, with explicit ARKit channels overriding preset expansion.
 * 4. Player update delivers pose, expression and imported-runtime callbacks on one timestamp; wrapper-root application preserves the caller's baked Group transform and null-root restores the staged base.
 * 5. Snapshot requests render once before encoding and returns the supplied canvas metadata.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the existing skinned/rigid generic asset, applies morph/sink expressions and Player frames, then invokes the public snapshot adapter; catches wrong skin binding, overwritten imported-root state, stale null roots and canvas encoding requested before drawing.
 * @evidence contracts/testing.md#independent-expectations Literal bone names, authored expression overrides, metre translations, preserved baked yaw and elapsed timestamp differences define expectations. The existing snapshot port records request order and supplied metadata only, without proving a native image, VRM loader or rendered pixels.
 * @evidence contracts/testing.md#distinguishing-cases Covers skinned versus rigid precedence, missing joints, preset/explicit/non-expression channels, synchronized frame hooks, Group wrapping, rooted-to-null motion and snapshot ordering; broad imported-file admission and actual browser capture belong elsewhere.
 * @evidence contracts/testing.md#execution-ownership This named asynchronous unit uses its existing generic fixture builders, actual CPU-side Three objects and the already declared structural snapshot port; it imports maintained source and starts no browser, GPU, native process or new Human test driver.
 *
 * @author Samchon
 */
export async function test_viewer_production_asset_runtime(): Promise<void> {
  const model: IAutoMovieModel = createProductionAssetModel();
  const built: IAutoMovieModelObject = buildModel(model);
  const skinned: THREE.SkinnedMesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap>[] = collectSkinnedMeshes(built.object);
  TestValidator.equals("one skinned mesh", skinned.length, 1);
  TestValidator.equals(
    "skinned joints",
    skinned[0]!.skeleton.bones.map((b: THREE.Bone<THREE.Object3DEventMap>): string => b.name),
    ["hips", "leftUpperArm"],
  );
  TestValidator.equals(
    "skin index item size",
    skinned[0]!.geometry.getAttribute("skinIndex").itemSize,
    4,
  );
  TestValidator.equals(
    "skin weight item size",
    skinned[0]!.geometry.getAttribute("skinWeight").itemSize,
    4,
  );

  const rigid: THREE.Object3D<THREE.Object3DEventMap> | undefined = built.object.getObjectByName("rigid-with-skin");
  TestValidator.equals("rigid parent", rigid?.parent?.name, "leftHand");
  TestValidator.predicate(
    "missing skin bone rejects",
    throwsError(
      (): IAutoMovieModelObject =>
        buildModel(
          createProductionAssetModel({
            joints: ["hips", "rightFoot"],
          }),
        ),
      ["skin references missing bone", "rightFoot"],
    ),
  );

  const morph: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.Material<THREE.MaterialEventMap> | THREE.Material<THREE.MaterialEventMap>[], THREE.Object3DEventMap> = createMorphMesh();
  const importedBone: THREE.Object3D<THREE.Object3DEventMap> = new THREE.Object3D();
  const importedRoot: THREE.Group<THREE.Object3DEventMap> = new THREE.Group();
  // The caller's baked π yaw must survive pose-root application (#1047).
  importedRoot.rotateY(Math.PI);
  importedRoot.add(importedBone, morph);
  const expressionValues: Map<string, number> = new Map<string, number>();
  const frames: Array<{ seconds: number; deltaSeconds: number }> = [];
  const imported: IAutoMovieModelObject = createImportedModelObject({
    object: importedRoot,
    bones: { hips: importedBone },
    expressionTargets: [
      {
        setExpressionValue: (name: string, weight: number): Map<string, number> =>
          expressionValues.set(name, weight),
      },
    ],
    afterAutoMovieFrame: ({ seconds, deltaSeconds }: IAutoMovieViewerFrame): number =>
      frames.push({ seconds, deltaSeconds }),
  });
  const happy: IAutoMovieExpression = expression("happy", 0.7, [
    { channel: "mouthSmileLeft", weight: 0.2 },
  ]);
  applyExpression(imported, happy);
  TestValidator.predicate("preset morph", nclose(morph.morphTargetInfluences![0]!, 0.7, 0));
  TestValidator.predicate(
    "explicit channel override",
    nclose(morph.morphTargetInfluences![1]!, 0.2, 0),
  );
  TestValidator.predicate(
    "preset expansion channel",
    nclose(morph.morphTargetInfluences![2]!, 0.7, 0),
  );
  TestValidator.predicate(
    "non-expression morph preserved",
    nclose(morph.morphTargetInfluences![3]!, 0.4, 0),
  );
  TestValidator.predicate("sink preset", nclose(expressionValues.get("happy") ?? Number.NaN, 0.7, 0));
  TestValidator.predicate(
    "sink override",
    nclose(expressionValues.get("mouthSmileLeft") ?? Number.NaN, 0.2, 0),
  );
  TestValidator.predicate("sink reset", nclose(expressionValues.get("angry") ?? Number.NaN, 0, 0));

  const skeleton: IAutoMovieSkeleton = singleBoneSkeleton();
  const pose: IAutoMoviePose = {
    skeleton: skeleton.id,
    root: {
      ...IDENTITY_TRANSFORM,
      translation: { x: 1.25, y: 0.5, z: -0.25 },
    },
    joints: [],
  };
  const player: AutoMoviePlayer = new AutoMoviePlayer(
    imported,
    skeleton,
    makeMotion(
      [keyframe(0, pose, "linear", happy), keyframe(1, pose, "linear", happy)],
      1,
    ),
  );
  player.update(0.25);
  player.update(0.5);
  TestValidator.equals(
    "root transform applied",
    namedFacts([
      ["ncloseImportedObject", (): boolean => nclose(imported.object.position.x, 1.25)],
      ["ncloseImportedObject2", (): boolean => nclose(imported.object.position.y, 0.5)],
      [
        "ncloseImportedObject3",
        (): boolean => nclose(imported.object.position.z, -0.25),
      ],
    ]),
    {
      ncloseImportedObject: true,
      ncloseImportedObject2: true,
      ncloseImportedObject3: true,
    },
  );
  // The pose root lands on the Viewer wrapper while the caller's baked Group yaw survives beneath it (#1047).
  TestValidator.equals(
    "an imported Group is wrapped, its baked transform preserved",
    namedFacts([
      ["importedObjectImportedRoot", (): boolean => imported.object !== importedRoot],
      ["ncloseMathAbs", (): boolean => nclose(Math.abs(importedRoot.quaternion.y), 1)],
      [
        "ncloseImportedRootQuaternion",
        (): boolean => nclose(importedRoot.quaternion.w, 0),
      ],
      ["ncloseImportedRootPosition", (): boolean => nclose(importedRoot.position.x, 0)],
    ]),
    {
      importedObjectImportedRoot: true,
      ncloseMathAbs: true,
      ncloseImportedRootQuaternion: true,
      ncloseImportedRootPosition: true,
    },
  );
  TestValidator.equals("frame hook count", frames.length, 2);
  TestValidator.predicate("first frame time", nclose(frames[0]!.seconds, 0.25, 0));
  TestValidator.predicate("first frame delta", nclose(frames[0]!.deltaSeconds, 0, 0));
  TestValidator.predicate("second frame delta", nclose(frames[1]!.deltaSeconds, 0.25, 0));
  const lastExpression: IAutoMovieExpression | null = player.lastExpression;
  TestValidator.predicate("last expression", lastExpression !== null &&
    lastExpression.preset === happy.preset && nclose(lastExpression.intensity, happy.intensity, 0) &&
    lastExpression.blendshapes?.length === happy.blendshapes!.length &&
    lastExpression.blendshapes.every((blendshape: NonNullable<IAutoMovieExpression["blendshapes"]>[number], index: number): boolean =>
      blendshape.channel === happy.blendshapes![index]!.channel && nclose(blendshape.weight, happy.blendshapes![index]!.weight, 0)));

  // A null pose root returns the wrapper to its staged base rather than retaining the previous rooted destination (#1046).
  player.setMotion(
    makeMotion(
      [
        keyframe(0, { skeleton: skeleton.id, root: null, joints: [] }),
        keyframe(1, { skeleton: skeleton.id, root: null, joints: [] }),
      ],
      1,
    ),
  );
  player.update(0.75);
  TestValidator.equals(
    "a null root resets to the staged base, not the last rooted pose",
    namedFacts([
      ["ncloseImportedObject", (): boolean => nclose(imported.object.position.x, 0)],
      ["ncloseImportedObject2", (): boolean => nclose(imported.object.position.y, 0)],
      ["ncloseImportedObject3", (): boolean => nclose(imported.object.position.z, 0)],
    ]),
    {
      ncloseImportedObject: true,
      ncloseImportedObject2: true,
      ncloseImportedObject3: true,
    },
  );

  let renders: number = 0;
  const snapshotSequence: string[] = [];
  const renderer: IAutoMovieViewerSnapshotRenderer = {
    render: (): void => {
      snapshotSequence.push("render");
      renders += 1;
    },
    domElement: {
      width: 32,
      height: 18,
      toDataURL: (mimeType: string | undefined, quality: number | undefined): string => {
        snapshotSequence.push("encode");
        return `${mimeType}:${quality}`;
      },
    },
  };
  const snapshot: ReturnType<typeof captureViewerSnapshot> = captureViewerSnapshot(
    renderer,
    new THREE.Scene(),
    new THREE.PerspectiveCamera(),
    { mimeType: "image/jpeg", quality: 0.8 },
  );
  TestValidator.equals("snapshot render count", renders, 1);
  TestValidator.equals("snapshot draws before requesting canvas encoding", snapshotSequence, ["render", "encode"]);
  TestValidator.equals("snapshot payload", snapshot, {
    width: 32,
    height: 18,
    mimeType: "image/jpeg",
    dataUrl: "image/jpeg:0.8",
  });
}

const collectSkinnedMeshes: (root: THREE.Object3D) => THREE.SkinnedMesh[] = (root: THREE.Object3D): THREE.SkinnedMesh[] => {
  const out: THREE.SkinnedMesh[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (object instanceof THREE.SkinnedMesh) out.push(object);
  });
  return out;
};

const createProductionAssetModel: (options?: { joints: ["hips", "leftUpperArm"] | ["hips", "rightFoot"]; }) => IAutoMovieModel = (options?: {
  joints: ["hips", "leftUpperArm"] | ["hips", "rightFoot"];
}): IAutoMovieModel => {
  const skin: { joints: ["hips", "leftUpperArm"] | ["hips", "rightFoot"]; boneIndices: number[]; weights: number[]; } = {
    joints: options?.joints ?? ["hips", "leftUpperArm"],
    boneIndices: [0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0],
    weights: [1, 0, 0, 0, 1, 0, 0, 0, 0.25, 0.75, 0, 0],
  };
  return {
    ...createModel(createSkeleton()),
    origin: "imported",
    asset: "asset:gltf",
    parts: [
      {
        id: "skinned",
        name: "skinned",
        geometry: {
          type: "mesh",
          mesh: {
            positions: [0, 0, 0, 0, 1, 0, 1, 0, 0],
            normals: null,
            uvs: null,
            indices: [0, 1, 2],
            skin,
          },
        },
        material: null,
        attachedBone: null,
        transform: null,
      },
      {
        id: "rigid-with-skin",
        name: "rigid-with-skin",
        geometry: {
          type: "mesh",
          mesh: {
            positions: [0, 0, 0, 0, 0.25, 0, 0.25, 0, 0],
            normals: null,
            uvs: null,
            indices: [0, 1, 2],
            skin,
          },
        },
        material: null,
        attachedBone: "leftHand",
        transform: null,
      },
    ],
  };
};

const createMorphMesh: () => THREE.Mesh = (): THREE.Mesh => {
  const geometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([0, 0, 0, 0, 1, 0, 1, 0, 0], 3),
  );
  const mesh: THREE.Mesh<THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap>, THREE.MeshBasicMaterial, THREE.Object3DEventMap> = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial());
  mesh.morphTargetDictionary = {
    happy: 0,
    mouthSmileLeft: 1,
    mouthSmileRight: 2,
    bodyWide: 3,
  };
  mesh.morphTargetInfluences = [0, 0, 0, 0.4];
  return mesh;
};

const expression: (preset: IAutoMovieExpression["preset"], intensity: number, blendshapes?: IAutoMovieExpression["blendshapes"]) => IAutoMovieExpression = (
  preset: IAutoMovieExpression["preset"],
  intensity: number,
  blendshapes: IAutoMovieExpression["blendshapes"] = null,
): IAutoMovieExpression => ({ preset, intensity, blendshapes });

const singleBoneSkeleton: () => IAutoMovieSkeleton = (): IAutoMovieSkeleton => ({
  id: "runtime",
  bones: [
    {
      bone: "hips",
      parent: null,
      rest: IDENTITY_TRANSFORM,
      constraint: null,
    },
  ],
});
