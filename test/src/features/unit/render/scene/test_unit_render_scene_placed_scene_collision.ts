import { createBed } from "@automovie/archetypes";
import { preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieModel,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  buildModel,
  invalidateAutoMovieSkinnedPose,
  observeAutoMovieSceneCollision,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { createSkinnedTubeModel } from "../../../internal/createSkinnedTubeModel";

/**
 * Observe default ordinary geometry and one actually articulated displayed
 * surface from the already placed scene.
 *
 * 1. Ordinary unregistered boxes under a common scene group first separate,
 *    then overlap. Truncating a source's draw range withdraws closed authority.
 * 2. The generated single bed's actual base receives a stock joint-skinned
 *    surface only during its hand-keyframed bend. The reported surface point
 *    must lie inside the authored original bed dimensions. With no vertex
 *    budget the arm stays in the broad phase and the pair is deferred.
 */
export async function test_unit_render_scene_placed_scene_collision(): Promise<void> {
  const geometry: Geometry.IQueries = await preparePhysicalGeometry();
  const observe = (
    root: THREE.Scene,
    seconds: number,
    posedVertices: number = 1000,
  ): Pick<Diagnostic, "findings" | "coverage"> => {
    root.updateMatrixWorld(true);
    return observeAutoMovieSceneCollision({
      time: { filmSeconds: seconds },
      layers: [{ id: "main", root, localSeconds: seconds }],
      geometry,
      limits: {
        comparisons: 12000,
        posedVertices,
        surfaceTriangles: 1_000_000,
        sweptCells: 0,
      },
    });
  };

  const manual: THREE.Scene = new THREE.Scene();
  const grouping: THREE.Group = new THREE.Group();
  grouping.name = "manually-nested";
  const left: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  const right: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial(),
  );
  left.name = "left";
  right.name = "right";
  manual.add(grouping);
  grouping.add(left, right);
  right.position.x = 2;
  TestValidator.equals("separated boxes", observe(manual, 0).findings, []);
  right.position.x = 0.75;
  TestValidator.equals(
    "overlapping boxes under a plain group",
    observe(manual, 1).findings.map(({ confidence, paths }) => ({
      confidence,
      paths,
    })),
    [
      {
        confidence: "confirmed",
        paths: ["manually-nested/left", "manually-nested/right"],
      },
    ],
  );
  right.geometry.setDrawRange(0, 33);
  const partial = observe(manual, 2);
  TestValidator.predicate(
    "a partially drawn shell certifies nothing",
    partial.findings.length === 0 &&
      partial.coverage.some(({ status }) => status === "unsupported"),
  );

  const scene: THREE.Scene = new THREE.Scene();
  const bed: IAutoMovieModel = createBed({ kind: "single", id: "bed" }, 4);
  const bedView: IAutoMovieModelObject = buildModel(bed);
  const armView: IAutoMovieModelObject = buildModel(
    createSkinnedTubeModel("linear"),
  );
  bedView.object.name = "bed";
  armView.object.name = "actor";
  armView.parts.get("tube")!.name = "arm";
  scene.add(bedView.object, armView.object);
  const base: THREE.Object3D = bedView.parts.get("base")!;
  base.name = "base";
  const bedGeometry = bed.parts.find((part) => part.id === "base")?.geometry;
  if (bedGeometry?.type !== "primitive" || bedGeometry.shape.type !== "box")
    throw new Error("The stock bed fixture needs its source base box");
  const { width, height, depth } = bedGeometry.shape;
  const center: THREE.Vector3 = base.getWorldPosition(new THREE.Vector3());
  armView.object.position.set(
    center.x + width / 2 + 0.35,
    center.y - 1,
    center.z,
  );
  const hinge: THREE.Object3D = armView.bones.get("spine")!;
  const pair = (finding: Diagnostic.IFinding): boolean =>
    finding.paths.join("|") === "actor/arm|bed/base" &&
    finding.confidence === "confirmed";

  TestValidator.predicate(
    "the straight arm stays clear of the bed",
    !observe(scene, 0).findings.some(pair),
  );
  hinge.rotation.z = Math.PI / 2;
  invalidateAutoMovieSkinnedPose(armView.object);
  const bent = observe(scene, 1);
  const witness: Diagnostic.IWitness | undefined =
    bent.findings.find(pair)?.witness;
  TestValidator.predicate(
    "the bent arm's drawn witness lies inside the authored bed base",
    witness?.point !== undefined &&
      Math.abs(witness.point.x - center.x) < width / 2 &&
      Math.abs(witness.point.y - center.y) < height / 2 &&
      Math.abs(witness.point.z - center.z) < depth / 2,
  );

  const limited = observe(scene, 1, 0);
  TestValidator.equals(
    "an exhausted vertex budget defers the candidate pair without dropping the arm",
    {
      confirmed: limited.findings.some(pair),
      row: limited.coverage.find(
        ({ key }) =>
          key === JSON.stringify(["main", "frame", "actor/arm", "bed/base"]),
      ),
    },
    {
      confirmed: false,
      row: {
        check: "collision",
        key: JSON.stringify(["main", "frame", "actor/arm", "bed/base"]),
        required: false,
        status: "deferred",
        reason: "surface-witness-limit",
      },
    },
  );
  hinge.rotation.z = 0;
  invalidateAutoMovieSkinnedPose(armView.object);
  TestValidator.predicate(
    "straightening the arm clears it again",
    !observe(scene, 2).findings.some(pair),
  );

  for (const mesh of [left, right]) {
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  }
  const resources: Set<{ dispose(): void }> = new Set();
  scene.traverse((object: THREE.Object3D): void => {
    if (!(object instanceof THREE.Mesh)) return;
    resources.add(object.geometry);
    for (const material of Array.isArray(object.material)
      ? object.material
      : [object.material])
      resources.add(material);
    if (object instanceof THREE.SkinnedMesh) resources.add(object.skeleton);
  });
  for (const resource of resources) resource.dispose();
}
