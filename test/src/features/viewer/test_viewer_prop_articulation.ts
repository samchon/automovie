import {
  compareCodeUnits,
  placementChildNode,
  sceneToNodes,
} from "@automovie/engine";
import type {
  IAutoMovieNode,
  IAutoMoviePropSpec,
  IAutoMovieScene,
  IAutoMovieSceneNode,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  applyObjectMotions,
  buildModel,
  buildPropArticulation,
  buildScene,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { namedFacts, throwsError, vclose } from "../internal/predicates";

const IDENTITY: {
  translation: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number; w: number };
  scale: { x: number; y: number; z: number };
} = {
  translation: { x: 0, y: 0, z: 0 },
  rotation: { x: 0, y: 0, z: 0, w: 1 },
  scale: { x: 1, y: 1, z: 1 },
};

/** One articulation joint, optionally driving one part of the prop's model. */
const joint: (
  id: string,
  parent: string | null,
  mesh: string | null,
  x?: number,
) => IAutoMovieNode = (
  id: string,
  parent: string | null,
  mesh: string | null,
  x: number = 0,
): IAutoMovieNode => ({
  id,
  name: null,
  parent,
  kind: "group",
  transform: { ...IDENTITY, translation: { x, y: 0, z: 0 } },
  mesh,
  camera: null,
  light: null,
  skin: null,
});

/** A two-box gate: a post that never moves, a leaf hung on one hinge. */
const gateSpec: (nodes?: IAutoMovieNode[]) => IAutoMoviePropSpec = (
  nodes: IAutoMovieNode[] = [
    joint("hinge", null, "leaf", -0.5),
    joint("cap", "hinge", null),
  ],
): IAutoMoviePropSpec => ({
  node: "gate",
  model: {
    id: "gate",
    name: null,
    origin: "generated",
    skeleton: null,
    affordances: [],
    materials: [],
    parts: [
      {
        id: "post",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 0.1, height: 2, depth: 0.1 },
        },
        material: null,
        attachedBone: null,
        transform: { ...IDENTITY, translation: { x: -0.6, y: 1, z: 0 } },
      },
      {
        id: "leaf",
        name: null,
        geometry: {
          type: "primitive",
          shape: { type: "box", width: 1, height: 2, depth: 0.05 },
        },
        material: null,
        attachedBone: null,
        // The model-local leaf center is half a width to the right of its hinge.
        transform: { ...IDENTITY, translation: { x: 0, y: 1, z: 0 } },
      },
    ],
    asset: null,
    body: null,
  },
  articulation: {
    nodes,
    profile: {
      id: "gate-hinge",
      name: "hinge",
      drivers: [] as [],
      limits: [],
    },
    binding: {
      profile: "gate-hinge",
      boneMap: {},
    },
  },
});

/** The staged scene the gate stands in, at `x` metres along +X. */
const sceneOf: (x?: number) => IAutoMovieScene = (
  x: number = 2,
): IAutoMovieScene => ({
  id: "hall",
  name: null,
  nodes: [
    {
      id: "frontGate",
      model: "gate",
      transform: { ...IDENTITY, translation: { x, y: 0, z: 0 } },
      motion: null,
      pose: null,
    },
  ],
  cameras: [],
  lights: [],
});

/** Build the scene, then its prop articulation, and hand both back. */
const build: (
  spec: IAutoMoviePropSpec,
  scene?: IAutoMovieScene,
) => {
  root: THREE.Scene;
  articulation: ReturnType<typeof buildPropArticulation>;
} = (
  spec: IAutoMoviePropSpec,
  scene: IAutoMovieScene = sceneOf(),
): {
  root: THREE.Scene;
  articulation: ReturnType<typeof buildPropArticulation>;
} => {
  const model: IAutoMovieModelObject = buildModel(spec.model);
  const root: THREE.Scene<THREE.Object3DEventMap> = buildScene(
    scene,
    (): IAutoMovieModelObject => model,
  ).scene;
  return {
    root,
    articulation: buildPropArticulation({
      scene,
      props: [spec],
      nodeObjects: new Map(
        scene.nodes.map(
          (
            node: IAutoMovieSceneNode,
          ): [string, THREE.Object3D<THREE.Object3DEventMap>] => [
            node.id,
            root.getObjectByName(node.id)!,
          ],
        ),
      ),
      modelObjects: new Map(
        scene.nodes.map(
          (node: IAutoMovieSceneNode): [string, IAutoMovieModelObject] => [
            node.id,
            model,
          ],
        ),
      ),
    }),
  };
};

/** World position of the named object, as a plain vector. */
const worldOf: (root: THREE.Object3D, name: string) => THREE.Vector3 = (
  root: THREE.Object3D,
  name: string,
): THREE.Vector3 => {
  root.updateMatrixWorld(true);
  return root.getObjectByName(name)!.getWorldPosition(new THREE.Vector3());
};

/**
 * A prop's declared joints become native groups, and each claimed model part moves beneath its joint.
 *
 * The unit compares lowered joint identities and real CPU-side hierarchy/transforms after construction, object-motion application and restore. It does not establish a complete production shot host, joint-range admission or rendered articulation.
 *
 * Scenarios:
 *
 * 1. Constructed joint names match sceneToNodes lowering.
 * 2. The claimed leaf moves beneath the hinge, the unclaimed post retains its parent and placement composes with the joint's local offset.
 * 3. A quarter turn through applyObjectMotions moves the leaf around the unchanged hinge pivot.
 * 4. Restore reinstates the declared joint transforms; this directly tests restoration rather than a host's backward-seek scheduling.
 * 5. Missing parts, placement groups, models and declared joint parents refuse.
 * 6. Unclaimed placements, rigid props and repeated registration create no extra articulation.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds existing generic gate articulation, applies a keyed joint turn and restores it, observing object names, parents and world positions; catches a missing joint projection, reparenting that changes placement and a stale rest pose.
 * @evidence contracts/testing.md#independent-expectations A half-metre hinge offset and quarter-turn geometry define literal leaf/pivot positions; Engine-lowered names pin canonical identity but do not independently establish Engine lowering. No assertion observes a rendered door or profile-driver evaluation.
 * @evidence contracts/testing.md#distinguishing-cases Covers claimed/unclaimed parts, turn/restoration, missing part/host/parent refusals and rigid/unclaimed/repeated registrations; partial setup rollback and authored profile drivers remain documented producer limitations.
 * @evidence contracts/testing.md#execution-ownership This named portable unit calls maintained Engine/Viewer source with the existing two-box record and CPU-side Three graph, acquiring no renderer, browser, worker, process or new production asset.
 */
export function test_viewer_prop_articulation(): void {
  const spec: IAutoMoviePropSpec = gateSpec();
  const scene: IAutoMovieScene = sceneOf();
  const {
    root,
    articulation,
  }: {
    root: THREE.Scene;
    articulation: ReturnType<typeof buildPropArticulation>;
  } = build(spec, scene);
  const hinge: string = placementChildNode("frontGate", "hinge");
  TestValidator.equals(
    "the viewer names its joints what the engine lowers them as",
    [...articulation.joints.keys()].sort(compareCodeUnits),
    sceneToNodes({ scene, props: { gate: spec } })
      .map((node: IAutoMovieNode): string => node.id)
      .filter((id: string): boolean => id !== "frontGate")
      .sort(compareCodeUnits),
  );

  TestValidator.equals(
    "the claimed part rides the joint and the unclaimed one does not",
    {
      leaf: root.getObjectByName("leaf")!.parent!.name,
      post: root.getObjectByName("post")!.parent!.name,
    },
    { leaf: hinge, post: spec.model.name ?? spec.model.id },
  );
  TestValidator.equals(
    "the hinge sits at the placement plus its offset, and the leaf has not moved",
    namedFacts([
      [
        "hingePlaced",
        (): boolean => vclose(worldOf(root, hinge), { x: 1.5, y: 0, z: 0 }),
      ],
      [
        "leafHeld",
        (): boolean => vclose(worldOf(root, "leaf"), { x: 2, y: 1, z: 0 }),
      ],
    ]),
    { hingePlaced: true, leafHeld: true },
  );

  const before: THREE.Vector3 = worldOf(root, "leaf");
  applyObjectMotions(
    [
      {
        id: "swing",
        name: null,
        duration: 1,
        loop: false,
        tracks: [
          {
            channel: { kind: "node", node: hinge, path: "rotation" },
            times: [0],
            // 90° about +Y.
            values: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
            interpolation: "linear",
          },
        ],
      },
    ],
    0,
    (node: string): THREE.Object3D<THREE.Object3DEventMap> | undefined =>
      articulation.joints.get(node),
  );
  const after: THREE.Vector3 = worldOf(root, "leaf");
  TestValidator.equals(
    "the turn carries the leaf around the pivot and leaves the pivot alone",
    namedFacts([
      [
        "hingeHeld",
        (): boolean => vclose(worldOf(root, hinge), { x: 1.5, y: 0, z: 0 }),
      ],
      // A quarter turn about +Y moves the half-width +X offset to −Z at the same height.
      ["leafSwung", (): boolean => vclose(after, { x: 1.5, y: 1, z: -0.5 })],
      ["leafMoved", (): boolean => before.distanceTo(after) > 0.5],
    ]),
    { hingeHeld: true, leafSwung: true, leafMoved: true },
  );

  articulation.restore();
  TestValidator.predicate(
    "restore returns the leaf to the placement its prop declares",
    vclose(worldOf(root, "leaf"), { x: 2, y: 1, z: 0 }),
  );

  TestValidator.predicate(
    "a joint naming a part the model does not carry throws",
    throwsError(
      (): {
        root: THREE.Scene;
        articulation: ReturnType<typeof buildPropArticulation>;
      } => build(gateSpec([joint("hinge", null, "sash")])),
      'drives part "sash"',
    ),
  );
  TestValidator.equals(
    "a placement missing either half of its build throws",
    namedFacts([
      [
        "noGroup",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof buildPropArticulation> =>
              buildPropArticulation({
                scene,
                props: [spec],
                nodeObjects: new Map(),
                modelObjects: new Map([["frontGate", buildModel(spec.model)]]),
              }),
            "which the host built no object for",
          ),
      ],
      [
        "noModel",
        (): boolean =>
          throwsError(
            (): ReturnType<typeof buildPropArticulation> =>
              buildPropArticulation({
                scene,
                props: [spec],
                nodeObjects: new Map([["frontGate", new THREE.Group()]]),
                modelObjects: new Map(),
              }),
            "which the host built no object for",
          ),
      ],
    ]),
    { noGroup: true, noModel: true },
  );
  TestValidator.predicate(
    "a joint whose declared parent the prop does not carry throws",
    throwsError(
      (): {
        root: THREE.Scene;
        articulation: ReturnType<typeof buildPropArticulation>;
      } => build(gateSpec([joint("cap", "ghost", null)])),
      'declares parent "ghost"',
    ),
  );

  const rigid: IAutoMoviePropSpec = { ...gateSpec(), articulation: null };
  TestValidator.equals(
    "nothing is built for an unclaimed placement, a rigid prop, or a repeat",
    {
      unclaimed: buildPropArticulation({
        scene,
        props: [],
        nodeObjects: new Map(),
        modelObjects: new Map(),
      }).joints.size,
      rigid: build(rigid).articulation.joints.size,
      repeated: buildPropArticulation({
        scene,
        props: [rigid, spec],
        nodeObjects: new Map(),
        modelObjects: new Map(),
      }).joints.size,
    },
    { unclaimed: 0, rigid: 0, repeated: 0 },
  );
}
