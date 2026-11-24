import { preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieSceneCollision as Collision,
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
} from "@automovie/interface";
import {
  type IAutoMovieModelObject,
  buildModel,
  invalidateAutoMovieSkinnedPose,
  observeAutoMovieSceneCollision,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { capSkinnedTubeModel } from "../internal/capSkinnedTubeModel";
import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";

/**
 * Resolve exact contact, disjoint geometry inside overlapping bounds,
 * joint-scoped grips and repeated names without leaving coverage open.
 *
 * 1. A crate resting exactly on another crate on a required layer is checked,
 *    and the layer leaves no required row unresolved.
 * 2. Two closed spheres whose bounds overlap while the spheres stay apart are
 *    proven clear by a complete witness search.
 * 3. A grip window scoped to the hand joint permits the cup inside the closed
 *    hand while the forearm stays apart, and a cup reaching the forearm
 *    during the same window is confirmed.
 * 4. Two crates sharing a name keep the same identities and coverage key on
 *    two different frames.
 * 5. A part allowance smaller than the scene defers the required layer with
 *    its reason instead of collecting without bound.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the contact, disjoint, grip and naming cases and their expected coverage.
 * @evidence contracts/development/testing.md#behavioral-verification Places real Three scenes and a built skinned model, then asserts the public observer's findings and coverage.
 * @evidence contracts/development/testing.md#independent-expectations The crates meet at y = 1; the sphere centres are 1.13 m apart against a 1 m radius sum; the tube's spine joint owns y > 1.25 and its hips y < 0.75, so a cup spanning y 1.4 to 1.8 touches only the hand and one spanning y 0.3 to 1.8 reaches the forearm.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates tangent, disjoint, permitted, confirmed and renamed-stable outcomes.
 * @evidence contracts/development/testing.md#execution-ownership test_render_placed_scene_collision_contact owns in-memory scenes and the geometry query, with no browser.
 */
export async function test_render_placed_scene_collision_contact(): Promise<void> {
  const geometry: Geometry.IQueries = await preparePhysicalGeometry();
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const observe = (
    root: THREE.Scene,
    seconds: number,
    layer: { required?: boolean; allowances?: Collision.IAllowance[] } = {},
  ): Pick<Diagnostic, "findings" | "coverage"> => {
    root.updateMatrixWorld(true);
    return observeAutoMovieSceneCollision({
      time: { filmSeconds: seconds },
      layers: [{ id: "main", root, localSeconds: seconds, ...layer }],
      geometry,
      limits: {
        comparisons: 1_000_000,
        posedVertices: 1_000_000,
        surfaceTriangles: 100_000_000,
        sweptCells: 0,
      },
    });
  };
  const box = (name: string, y: number): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      material,
    );
    mesh.name = name;
    mesh.position.y = y;
    return mesh;
  };

  // 1. Exact contact on a required layer.
  const stack: THREE.Scene = new THREE.Scene();
  stack.add(box("lower", 0.5), box("upper", 1.5));
  const stacked = observe(stack, 0, { required: true });
  TestValidator.equals(
    "crates resting on each other are checked without a finding",
    {
      findings: stacked.findings,
      unresolved: stacked.coverage.filter(
        (row: Diagnostic.ICoverage): boolean =>
          row.required &&
          (row.status === "deferred" || row.status === "unsupported"),
      ),
    },
    { findings: [], unresolved: [] },
  );

  // 2. Overlapping bounds around disjoint closed geometry.
  const apart: THREE.Scene = new THREE.Scene();
  for (const [name, x] of [
    ["west", 0],
    ["east", 0.8],
  ] as const) {
    const ball: THREE.Mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 16),
      material,
    );
    ball.name = name;
    ball.position.set(x, x, 0);
    apart.add(ball);
  }
  const disjoint = observe(apart, 0);
  TestValidator.equals(
    "disjoint spheres inside overlapping bounds are proven clear",
    {
      findings: disjoint.findings,
      row: disjoint.coverage.find(
        ({ key }: Diagnostic.ICoverage): boolean =>
          key === JSON.stringify(["main", "frame", "east", "west"]),
      )?.status,
    },
    { findings: [], row: "checked" },
  );

  // 3. A grip scoped to the hand joint.
  const grip: THREE.Scene = new THREE.Scene();
  const arm: IAutoMovieModelObject = buildModel(
    capSkinnedTubeModel(createSkinnedTubeModel("linear")),
  );
  arm.object.name = "actor";
  arm.parts.get("tube")!.name = "arm";
  invalidateAutoMovieSkinnedPose(arm.object);
  const cup: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.4, 0.2),
    material,
  );
  cup.name = "cup";
  cup.position.set(0.15, 1.6, 0);
  grip.add(arm.object, cup);
  const gripWindow: Collision.IAllowance[] = [
    {
      first: "actor/arm",
      second: "cup",
      startSeconds: 0,
      endSeconds: 10,
      maxPenetration: 0.3,
      firstJoints: ["spine"],
    },
  ];
  const held = observe(grip, 1, { allowances: gripWindow });
  TestValidator.equals(
    "a cup inside the gripping hand alone is permitted",
    {
      findings: held.findings,
      row: held.coverage.find(({ key }: Diagnostic.ICoverage): boolean =>
        key.includes("actor/arm"),
      )?.status,
    },
    { findings: [], row: "checked" },
  );
  cup.scale.set(1, 3.75, 1);
  cup.position.y = 1.05;
  const reached = observe(grip, 2, { allowances: gripWindow });
  TestValidator.equals(
    "the same cup reaching the forearm during the grip is confirmed",
    reached.findings.map(
      ({ paths, confidence }: Diagnostic.IFinding): string =>
        `${paths.join("|")}:${confidence}`,
    ),
    ["actor/arm|cup:confirmed"],
  );

  // 4. Repeated names keep their identities from frame to frame.
  const twins: THREE.Scene = new THREE.Scene();
  twins.add(box("crate", 0), box("crate", 0.5));
  const keys = (seconds: number): string[] =>
    observe(twins, seconds).findings.map(
      ({ key }: Diagnostic.IFinding): string => key,
    );
  TestValidator.equals(
    "same-named crates keep one coverage key across frames",
    [keys(0), keys(1)],
    [
      [JSON.stringify(["main", "frame", "crate#0", "crate#1"])],
      [JSON.stringify(["main", "frame", "crate#0", "crate#1"])],
    ],
  );

  // 5. A part allowance defers the layer instead of collecting without bound.
  twins.updateMatrixWorld(true);
  const bounded = observeAutoMovieSceneCollision({
    time: { filmSeconds: 0 },
    layers: [{ id: "main", root: twins, localSeconds: 0, required: true }],
    geometry,
    limits: {
      comparisons: 1_000,
      posedVertices: 1_000,
      surfaceTriangles: 1_000,
      sweptCells: 0,
      parts: 1,
    },
  });
  TestValidator.equals(
    "running out of parts defers the required layer",
    bounded.coverage.find(
      ({ key }: Diagnostic.ICoverage): boolean =>
        key === JSON.stringify(["main", "layer"]),
    ),
    {
      check: "collision",
      key: JSON.stringify(["main", "layer"]),
      required: true,
      status: "deferred",
      reason: "part-limit",
    },
  );

  const resources: Set<{ dispose(): void }> = new Set([material]);
  for (const scene of [stack, apart, grip, twins])
    scene.traverse((object: THREE.Object3D): void => {
      if (object instanceof THREE.Mesh) resources.add(object.geometry);
      if (object instanceof THREE.SkinnedMesh) resources.add(object.skeleton);
    });
  for (const resource of resources) resource.dispose();
}
