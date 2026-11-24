import { createBed } from "@automovie/archetypes";
import { preparePhysicalGeometry } from "@automovie/engine";
import type {
  IAutoMovieInspectionDiagnostics as Diagnostic,
  IAutoMoviePreparePhysicalGeometry as Geometry,
  IAutoMovieSweptCapsuleCollision as Sweep,
} from "@automovie/interface";
import {
  AutoMovieCollisionSource,
  buildModel,
  buildSceneSoftProps,
  invalidateAutoMovieSkinnedPose,
  observeAutoMovieSceneCollision,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { capSkinnedTubeModel } from "../internal/capSkinnedTubeModel";
import { createSkinnedTubeModel } from "../internal/createSkinnedTubeModel";

type ILayer = Parameters<
  typeof observeAutoMovieSceneCollision
>[0]["layers"][number];

/**
 * Read every drawn object kind of an ordinary placed scene as collision
 * evidence, without any source-supplied parts.
 *
 * 1. A closed cylinder sunk into a stock box, and a bent skinned arm inside a
 *    closed sphere, are confirmed by a drawn vertex inside the other solid. An
 *    open floor plane is unsupported with its reason, and a required layer
 *    makes that row required. One actor's bent closed arm through another
 *    actor's closed arm is confirmed the same way. A thin slab through a
 *    coarse cylinder and a thin rod through a sphere, which leave no vertex
 *    inside the other solid, are confirmed by a drawn edge.
 * 2. Formation members drawn as instances are named by their generator slots.
 *    Members overlapping each other are skipped as one managed formation, a
 *    member inside a barrier is confirmed, and a zero-scale member is absent.
 * 3. A cord tube drawn through a beam is confirmed on its solver segments,
 *    while a parallel cord beside the beam is proven clear.
 * 4. A motion cell takes its allowed depth from the layer's named window: no
 *    window confirms the crossing, a covering window permits it, and a window
 *    that ends inside the cell defers it.
 * 5. A box poking into a 33,153-vertex sphere on a required layer is deferred
 *    under the scaffold's interactive viewer budget and checked, with the same
 *    placed sample, under the unlimited capture and delivery budget.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names each drawn object kind and the evidence it is expected to yield.
 * @evidence contracts/development/testing.md#behavioral-verification Places real Three scenes, the generated soft-prop projection and stock skin, then asserts the public observer's findings and coverage.
 * @evidence contracts/development/testing.md#independent-expectations Depths follow from the authored extents: the cylinder sinks 0.25 m into the crate, the arm bends one metre into a 0.75 m sphere, the striker's distal rings cross the guard's 0.2 m radius axis, slot 12 sits at the barrier centre and the rope passes through the beam centre while its twin is 0.5 m away.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates confirmed, excluded, absent, clear, unsupported, required and deferred outcomes across closed, open, instanced, cord and interval inputs.
 * @evidence contracts/development/testing.md#execution-ownership test_render_placed_scene_collision_sources owns in-memory scenes and the geometry query, with no browser or renderer.
 */
export async function test_render_placed_scene_collision_sources(): Promise<void> {
  const geometry: Geometry.IQueries = await preparePhysicalGeometry();
  const limits = {
    comparisons: 100_000,
    posedVertices: 100_000,
    surfaceTriangles: 10_000_000,
    sweptCells: 64,
  };
  const observe = (
    root: THREE.Scene,
    layer: Partial<ILayer> = {},
  ): Pick<Diagnostic, "findings" | "coverage"> => {
    root.updateMatrixWorld(true);
    return observeAutoMovieSceneCollision({
      time: { filmSeconds: 0 },
      layers: [{ id: "main", root, localSeconds: 0, ...layer }],
      geometry,
      limits,
    });
  };
  const confirmed = (result: Pick<Diagnostic, "findings">): string[] =>
    result.findings
      .filter(({ confidence }) => confidence === "confirmed")
      .map(({ paths }) => paths.join("|"))
      .sort(compareText);
  const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();

  // 1. Closed props, a skin and an open floor.
  const props: THREE.Scene = new THREE.Scene();
  const crate: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    material,
  );
  crate.name = "crate";
  const post: THREE.Mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 1, 16),
    material,
  );
  post.name = "post";
  post.position.set(0, 0.75, 0);
  const floor: THREE.Mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(4, 4),
    material,
  );
  floor.name = "floor";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.5;
  const boulder: THREE.Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.75, 24, 16),
    material,
  );
  boulder.name = "boulder";
  const arm = buildModel(createSkinnedTubeModel("linear"));
  arm.object.name = "actor";
  arm.parts.get("tube")!.name = "arm";
  props.add(crate, post, floor, boulder, arm.object);
  boulder.position.set(5, 1, 0);
  arm.object.position.set(5.8, 0, 0);
  const hinge: THREE.Object3D = arm.bones.get("spine")!;
  hinge.rotation.z = Math.PI / 2;
  invalidateAutoMovieSkinnedPose(arm.object);
  const placed = observe(props, { required: true });
  TestValidator.equals(
    "closed props and a skin are confirmed by drawn vertices",
    confirmed(placed).filter((pair) => pair !== "crate|floor"),
    ["actor/arm|boulder", "crate|post"],
  );
  TestValidator.equals(
    "an open floor is unsupported and inherits the required layer",
    placed.coverage.find(
      ({ key }) => key === JSON.stringify(["main", "part", "floor"]),
    ),
    {
      check: "collision",
      key: JSON.stringify(["main", "part", "floor"]),
      required: true,
      status: "unsupported",
      reason: "open-surface",
    },
  );

  // Crossings that leave no vertex inside the other solid: a thin slab through
  // a coarse cylinder, and a thin rod through a sphere beside its pole.
  const slices: THREE.Scene = new THREE.Scene();
  const drum: THREE.Mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.3, 1, 8),
    material,
  );
  drum.name = "drum";
  const slab: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(2, 0.05, 2),
    material,
  );
  slab.name = "slab";
  const ball: THREE.Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 16, 8),
    material,
  );
  ball.name = "ball";
  ball.position.x = 5;
  const rod: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 4, 0.02),
    material,
  );
  rod.name = "rod";
  rod.position.set(5.03, 0, 0.03);
  slices.add(drum, slab, ball, rod);
  TestValidator.equals(
    "edges confirm crossings that leave no vertex inside",
    confirmed(observe(slices)),
    ["ball|rod", "drum|slab"],
  );

  // A built rigid model owns its internal pairs until one of its parts moves.
  const bedroom: THREE.Scene = new THREE.Scene();
  const bed = buildModel(createBed({ kind: "single", id: "bed" }, 4));
  bed.object.name = "bed";
  bedroom.add(bed.object);
  const internal = (result: Pick<Diagnostic, "coverage">): string[] =>
    result.coverage
      .filter(({ key }) => {
        const parts: string[] = JSON.parse(key);
        return (
          parts[1] === "frame" &&
          parts[2]!.startsWith("bed/") &&
          parts[3]!.startsWith("bed/")
        );
      })
      .map(({ key }) => key);
  const built = observe(bedroom);
  TestValidator.predicate(
    "an unmoved built bed is one rigid assembly",
    internal(built).length === 0 &&
      built.coverage.some(
        ({ key, status }) =>
          key === JSON.stringify(["main", "group", "rigid-assembly", "bed"]) &&
          status === "excluded",
      ),
  );
  bed.parts.get("headboard")!.position.y -= 0.3;
  TestValidator.predicate(
    "a moved part returns the bed's own pairs to the check",
    internal(observe(bedroom)).length !== 0,
  );

  // One actor's bent arm through another actor's upright arm.
  const duel: THREE.Scene = new THREE.Scene();
  const upright = buildModel(
    capSkinnedTubeModel(createSkinnedTubeModel("linear")),
  );
  const striker = buildModel(
    capSkinnedTubeModel(createSkinnedTubeModel("linear")),
  );
  upright.object.name = "guard";
  striker.object.name = "striker";
  upright.parts.get("tube")!.name = "arm";
  striker.parts.get("tube")!.name = "arm";
  striker.object.position.set(0.8, 0, 0);
  striker.bones.get("spine")!.rotation.z = Math.PI / 2;
  invalidateAutoMovieSkinnedPose(striker.object);
  duel.add(upright.object, striker.object);
  TestValidator.equals(
    "one actor's arm through another actor's arm is confirmed",
    confirmed(observe(duel)),
    ["guard/arm|striker/arm"],
  );

  // 2. Formation members by generator slot.
  const line: THREE.Scene = new THREE.Scene();
  const members: THREE.InstancedMesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.4, 1.8, 0.3),
    material,
    4,
  );
  members.name = "line:0:near";
  AutoMovieCollisionSource.bindInstances(members, {
    id: "formation:line",
    group: { id: "line", kind: "managed-formation" },
    region: "0",
    slots: [10, 11, 12, 13],
  });
  const place = (index: number, x: number, scale: number = 1): void => {
    members.setMatrixAt(
      index,
      new THREE.Matrix4().compose(
        new THREE.Vector3(x, 0.9, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(scale, scale, scale),
      ),
    );
  };
  place(0, 0);
  place(1, 0.2);
  place(2, 3);
  place(3, 3, 0);
  const barrier: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.5, 2),
    material,
  );
  barrier.name = "barrier";
  barrier.position.set(3, 0.9, 0);
  line.add(members, barrier);
  const formation = observe(line);
  TestValidator.equals(
    "only the slot inside the barrier is confirmed",
    confirmed(formation),
    ["barrier|formation:line/slot/12"],
  );
  TestValidator.predicate(
    "overlapping members of one formation are excluded and the withdrawn slot is absent",
    formation.coverage.some(
      ({ key, status }) =>
        key ===
          JSON.stringify(["main", "group", "managed-formation", "line"]) &&
        status === "excluded",
    ) &&
      !formation.coverage.some(({ key }) => key.includes("slot/13")) &&
      !formation.findings.some(({ paths }) =>
        paths.join("|").includes("slot/10|"),
      ),
  );

  // 3. A drawn cord through a beam and its parallel twin beside it.
  const rigging: THREE.Scene = new THREE.Scene();
  const beam: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    material,
  );
  beam.name = "beam";
  beam.position.set(0, 1, 0);
  rigging.add(beam);
  const soft = buildSceneSoftProps(rigging);
  const cord = (subject: string, z: number) => ({
    subject,
    status: "solved" as const,
    cordRadius: 0.01,
    surface: {
      domain: subject,
      step: 0,
      bounds: null,
      mesh: {
        positions: [-1, 1, z, 0, 1, z, 1, 1, z],
        normals: null,
        uvs: null,
        indices: null,
        skin: null,
      },
    },
  });
  soft.update([cord("rope", 0), cord("twin", 0.5)]);
  const ropes = observe(rigging);
  TestValidator.equals(
    "the cord through the beam is confirmed on both crossing segments",
    confirmed(ropes),
    ["beam|soft:rope/segment/0", "beam|soft:rope/segment/1"],
  );
  TestValidator.predicate(
    "the parallel cord is clear and its segments are one deformable body",
    !ropes.findings.some(({ paths }) => paths.join("|").includes("twin")) &&
      ropes.coverage.some(
        ({ key, status }) =>
          key ===
            JSON.stringify(["main", "group", "deformable-body", "soft:twin"]) &&
          status === "excluded",
      ),
  );
  soft.dispose();

  // 4. One named allowance governs the motion cell as it governs frames.
  const span = (x0: number, x1: number, z: number): Sweep.ISpan => ({
    a0: { x: x0, y: 0, z },
    b0: { x: x0, y: 1, z },
    a1: { x: x1, y: 0, z },
    b1: { x: x1, y: 1, z },
    radius: 0.01,
    basis: "displayed",
  });
  const cell = {
    paths: ["blade", "string"] as const,
    filmOffset: 0,
    props: {
      first: span(-1, 1, 0),
      second: span(0, 0, 0.005),
      startSeconds: 0,
      endSeconds: 1,
      maxIntervals: 64,
    },
  };
  const empty: THREE.Scene = new THREE.Scene();
  const allowed = (start: number, end: number) => [
    {
      first: "string",
      second: "blade",
      startSeconds: start,
      endSeconds: end,
      maxPenetration: 1,
    },
  ];
  const outcome = (allowances?: ReturnType<typeof allowed>) => {
    const result = observe(empty, {
      sweeps: [cell],
      ...(allowances === undefined ? {} : { allowances }),
    });
    const row = result.coverage.find(({ key }) => key.includes("sweep"));
    return {
      found: result.findings.map(
        ({ code, confidence }) => `${code}:${confidence}`,
      ),
      status: row?.status,
      reason: row?.status === "checked" ? null : row?.reason,
    };
  };
  TestValidator.equals("an undeclared crossing between frames", outcome(), {
    found: ["swept-penetration:confirmed"],
    status: "checked",
    reason: null,
  });
  TestValidator.equals(
    "a window covering the cell permits it",
    outcome(allowed(0, 2)),
    {
      found: [],
      status: "checked",
      reason: null,
    },
  );
  TestValidator.equals(
    "a window ending inside the cell defers it",
    outcome(allowed(0, 0.5)),
    { found: [], status: "deferred", reason: "allowance-boundary-inside-cell" },
  );

  // 5. The interactive budget defers a required pair that a settled budget confirms.
  const dense: THREE.Scene = new THREE.Scene();
  const globe: THREE.Mesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 256, 128),
    material,
  );
  globe.name = "globe";
  const corner: THREE.Mesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.4, 0.4, 0.4),
    material,
  );
  corner.name = "corner";
  corner.position.x = 0.5;
  dense.add(globe, corner);
  dense.updateMatrixWorld(true);
  const pair: string = JSON.stringify(["main", "frame", "corner", "globe"]);
  const budgeted = (budget: typeof limits): Diagnostic.ICoverage | undefined =>
    observeAutoMovieSceneCollision({
      time: { filmSeconds: 0 },
      layers: [{ id: "main", root: dense, localSeconds: 0, required: true }],
      geometry,
      limits: budget,
    }).coverage.find(({ key }) => key === pair);
  TestValidator.equals(
    "the scaffold's viewer budget defers the required dense pair",
    budgeted({
      comparisons: 12_000,
      posedVertices: 16_384,
      surfaceTriangles: 400_000,
      sweptCells: 256,
    }),
    {
      check: "collision",
      key: pair,
      required: true,
      status: "deferred",
      reason: "surface-witness-limit",
    },
  );
  TestValidator.equals(
    "the settled capture and delivery budget checks the same sample",
    budgeted({
      comparisons: Number.MAX_SAFE_INTEGER,
      posedVertices: Number.MAX_SAFE_INTEGER,
      surfaceTriangles: Number.MAX_SAFE_INTEGER,
      sweptCells: Number.MAX_SAFE_INTEGER,
    }),
    { check: "collision", key: pair, required: true, status: "checked" },
  );

  for (const object of [
    crate,
    post,
    floor,
    boulder,
    barrier,
    beam,
    globe,
    corner,
  ])
    object.geometry.dispose();
  members.geometry.dispose();
  members.dispose();
  material.dispose();
}

/** Order paths by code unit, independent of locale. */
function compareText(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
