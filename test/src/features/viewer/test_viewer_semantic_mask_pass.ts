import {
  autoMovieFluidSurfaceNodeName,
  autoMoviePlantingNodeName,
  autoMovieRenderSubjectOfCompiledShot,
  autoMovieSoftBodyNodeName,
  deriveAutoMovieSemanticMask,
} from "@automovie/engine";
import {
  IAutoMovieCompiledShotSource,
  IAutoMovieScene,
} from "@automovie/interface";
import {
  applyRenderMode,
  attachAutoMovieSemanticMask,
  auditAutoMovieSemanticMaskScene,
  autoMovieSemanticMaskOf,
  maskColor,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { flatBasin, waterFeature } from "../internal/fluidFixtures";
import { namedFacts, throwsError } from "../internal/predicates";
import { observeThrownValue } from "../internal/observeThrownValue";
import {
  buildingFixture,
  instanceSetFixture,
  modelsFixture,
  sceneFixture,
} from "../internal/renderFixtures";
import {
  plantingCluster,
  plantingInstallation,
  plantingRecipe,
  softFurnishing,
  softPanel,
} from "../internal/softFixtures";

/**
 * The packaged mask pass joins a supplied semantic palette to real scene mesh
 * identities and reports unresolved roots/unaddressed meshes. CPU material and
 * membership observations are distinct from actual visibility or drawn pixels.
 *
 * Scenarios:
 *
 * 1. A scene handed no palette keeps the index ramp and the handle reports no
 *    semantic result, so nothing claims identity it did not paint.
 * 2. `autoMovieSemanticMaskOf` answers `null` before the attach and the binding
 *    after, which is the only thing that decides which of the two passes runs.
 * 3. A scene handed its palette paints every mesh the colour its own semantic id
 *    earned, an unclaimed mesh the reserved background, and the handle carries
 *    the painted, unaddressed and unresolved counts back to its caller.
 * 4. Restoring the pass returns every material and the background, and restoring
 *    twice is a no-op.
 * 5. A pond, a curtain and a fern bed the shot declared and the scene never built
 *    are named by the audit and by the pass; entries that claim no drawable of
 *    their own, such as a room, an opening or an instanced slot, are never
 *    named.
 * 6. A scene containing every declared drawable reports an empty `unresolved` and
 *    still counts the geometry the palette cannot name, and an instanced set
 *    whose viewer group is missing is named by its own set id.
 * 7. A palette that cannot resolve the scene refuses, and the refusal costs the
 *    scene nothing: fog, image lighting, background and hidden renderables are
 *    all back, because a throw past the pass boundary would leave them
 *    suspended with no handle to undo them.
 * 8. A real override's failed dispose cannot skip neighboring material or
 *    atmosphere restoration; repeat preserves that cause without retry.
 * 9. A frozen mesh that refuses setup still restores the earlier neighbor and
 *    reports its original refusal while independent scene fields recover.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual attach/lookup/audit/packaged mask APIs, checking semantic material colors, manually assembled mesh counts and restored borrowed state; real disposal and frozen-mesh assignment failures exercise independent cleanup and sticky original causes.
 * @evidence contracts/testing.md#independent-expectations The Engine-derived palette is an independent input to the viewer painter, with expected ids/counts from fixture construction and original object identities for restoration; the compiled fixture supplies only converter-consumed fields and is not full artifact validity proof. Material colors/root membership do not certify native pixels, frustum visibility, anatomy or GPU release.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts attached palette and legacy ramp, claimed/unclaimed meshes, complete/missing simulated roots, ownership-only entries, missing instance-set group, too-short positional scene, healthy repeat, actual dispose failure and frozen setup refusal; detailed instanced slot colors belong to test_viewer_semantic_mask.
 * @evidence contracts/testing.md#execution-ownership The named unit entry reaches maintained Engine/viewer APIs with the existing portable fixture builder and CPU-side Three objects/listeners; it starts no browser, renderer, native process or GPU and adds no Human model, driver or dynamic test registration.
 */
export function test_viewer_semantic_mask_pass(): void {
  const design: IAutoMovieScene = sceneFixture();
  const compiled: IAutoMovieCompiledShotSource = {
    scene: design,
    models: modelsFixture(),
    motions: [],
    eventSamples: [],
    formations: [],
    instanceSets: [instanceSetFixture({ id: "windows", count: 2, chunks: 1 })],
    formationMotions: [],
    formationSlotMotions: [],
    effects: [],
    shot: {},
    builtEnvironments: [buildingFixture()],
    fluidDomains: [flatBasin({ columns: 2, rows: 2, depth: 1 })],
    waterFeatures: [waterFeature()],
    softBodyDomains: [softPanel({ columns: 2, rows: 2 })],
    softFurnishings: [softFurnishing()],
    plantingDomains: [plantingRecipe()],
    plantingClusters: [plantingCluster()],
    plantingInstallations: [plantingInstallation()],
  } as unknown as IAutoMovieCompiledShotSource;
  const mask: ReturnType<typeof deriveAutoMovieSemanticMask> = deriveAutoMovieSemanticMask(
    autoMovieRenderSubjectOfCompiledShot({ compiled }),
  );
  const colorOf: (id: string) => string = (id: string): string =>
    mask.entries.find((entry: (typeof mask.entries)[number]) : boolean => entry.id === id)!.color;
  const hex: (mesh: THREE.Mesh) => string = (mesh: THREE.Mesh): string =>
    `#${(mesh.material as THREE.MeshBasicMaterial).color.getHexString().toUpperCase()}`;

  // A scene that draws everything the shot declared: one group per designed
  // node, the instance-set group, and the three simulated drawables no node
  // holds.
  const complete: ReturnType<typeof build> = build(design, { simulated: true });
  const ramp: ReturnType<typeof applyRenderMode> = applyRenderMode(complete.scene, "mask");
  const rampWall: string = hex(complete.meshes.get("tower/hall-wall")!);
  const rampSemantic: ReturnType<typeof applyRenderMode>["semantic"] = ramp.semantic;
  ramp.restore();
  TestValidator.equals(
    "a scene with no palette keeps the index ramp and claims no identity",
    {
      semantic: rampSemantic,
      // The ramp is keyed by top-level child index, and the wall's group is the
      // first child, which is exactly why it can never mean identity.
      wall: rampWall,
    },
    { semantic: null, wall: `#${maskColor(0).getHexString().toUpperCase()}` },
  );

  TestValidator.equals(
    "the attached palette is what decides which mask pass runs",
    namedFacts([
      ["unattached", () : boolean => autoMovieSemanticMaskOf(complete.scene) === null],
      [
        "attached",
        () : boolean => {
          attachAutoMovieSemanticMask(complete.scene, { design, mask });
          return autoMovieSemanticMaskOf(complete.scene)?.mask === mask;
        },
      ],
    ]),
    { unattached: true, attached: true },
  );

  const handle: ReturnType<typeof applyRenderMode> = applyRenderMode(complete.scene, "mask");
  TestValidator.equals(
    "an attached palette paints every drawable the colour its own id earned",
    {
      wall: hex(complete.meshes.get("tower/hall-wall")!),
      door: hex(complete.meshes.get("tower/hall-door-leaf")!),
      prop: hex(complete.meshes.get("lantern")!),
      batch: hex(complete.meshes.get("instance-set:windows")!),
      pond: hex(complete.meshes.get(autoMovieFluidSurfaceNodeName("basin"))!),
      curtain: hex(complete.meshes.get(autoMovieSoftBodyNodeName("panel"))!),
      bed: hex(complete.meshes.get(autoMoviePlantingNodeName("atrium-bed"))!),
      stray: hex(complete.stray),
      semantic: handle.semantic,
    },
    {
      wall: colorOf("element:tower/hall-wall"),
      door: colorOf("element:tower/hall-door-leaf"),
      prop: colorOf("node:lantern"),
      batch: colorOf("instance-set:windows"),
      pond: colorOf("water-body:basin"),
      curtain: colorOf("soft-body:panel"),
      bed: colorOf("planting:atrium-bed"),
      stray: mask.background,
      semantic: {
        // Five staged nodes, the instanced batch, and the three simulated
        // drawables the mask joins by the viewer's own names for them.
        painted: 9,
        unaddressed: 1,
        unresolved: [],
      },
    },
  );

  handle.restore();
  handle.restore();
  TestValidator.equals(
    "restoring the pass returns the scene it borrowed, once",
    namedFacts([
      [
        "materials",
        () : boolean =>
          [...complete.meshes.values()].every(
            (mesh: THREE.Mesh) : boolean => mesh.material === complete.beauty.get(mesh),
          ),
      ],
      [
        "stray material",
        () : boolean => complete.stray.material === complete.strayBeauty,
      ],
      [
        "background",
        () : boolean => (complete.scene.background as THREE.Color).getHex() === 0x123456,
      ],
      ["mode", () : boolean => handle.mode === "mask"],
    ]),
    {
      materials: true,
      "stray material": true,
      background: true,
      mode: true,
    },
  );

  const failureFog: THREE.Fog = new THREE.Fog(0x123456, 1, 10);
  const failureEnvironment: THREE.Texture = new THREE.Texture();
  const failureGrid: THREE.LineSegments = new THREE.LineSegments(new THREE.BufferGeometry());
  complete.scene.fog = failureFog;
  complete.scene.environment = failureEnvironment;
  complete.scene.add(failureGrid);
  const failedRestore: ReturnType<typeof applyRenderMode> = applyRenderMode(complete.scene, "mask");
  const overrides: Set<THREE.Material> = new Set([
    ...[...complete.meshes.values()].map((mesh: THREE.Mesh): THREE.Material => mesh.material as THREE.Material),
    complete.stray.material as THREE.Material,
  ]);
  const attempts: Map<THREE.Material, number> = new Map();
  const firstOverride: THREE.Material = [...overrides][0]!;
  const disposalFailure: Error = new Error("semantic override disposal");
  for (const material of overrides) material.addEventListener("dispose", (): void => {
    attempts.set(material, (attempts.get(material) ?? 0) + 1);
    if (material === firstOverride) throw disposalFailure;
  });
  const firstRestore: ReturnType<typeof observeThrownValue> = observeThrownValue(failedRestore.restore);
  TestValidator.predicate("semantic dispose failure preserves its actual cause", firstRestore.threw && firstRestore.error === disposalFailure);
  TestValidator.predicate("failed semantic close still restores every borrowed source",
    [...complete.meshes.values()].every((mesh: THREE.Mesh): boolean => mesh.material === complete.beauty.get(mesh)) &&
    complete.stray.material === complete.strayBeauty && complete.scene.fog === failureFog &&
    complete.scene.environment === failureEnvironment && failureGrid.visible &&
    (complete.scene.background as THREE.Color).getHex() === 0x123456);
  TestValidator.predicate("all distinct actual overrides retire once despite a failing listener",
    attempts.size === overrides.size && [...attempts.values()].every((count: number): boolean => count === 1));
  const repeatedRestore: ReturnType<typeof observeThrownValue> = observeThrownValue(failedRestore.restore);
  TestValidator.predicate("failed repeat has the same cause and no new disposal",
    repeatedRestore.threw && repeatedRestore.error === disposalFailure && [...attempts.values()].every((count: number): boolean => count === 1));
  const nextPass:ReturnType<typeof observeThrownValue>=observeThrownValue(():ReturnType<typeof applyRenderMode>=>applyRenderMode(complete.scene,"mask"));
  TestValidator.predicate("same-scene reacquisition preserves failed material ownership",nextPass.threw&&nextPass.error===disposalFailure&&[...attempts.values()].every((count:number):boolean=>count===1));
  failureEnvironment.dispose(); failureGrid.geometry.dispose(); complete.scene.remove(failureGrid);

  const setupFailure: ReturnType<typeof build> = build(design, { simulated: true });
  const setupFog: THREE.Fog = new THREE.Fog(0x123456, 1, 10);
  setupFailure.scene.fog = setupFog;
  attachAutoMovieSemanticMask(setupFailure.scene, { design, mask });
  Object.freeze([...setupFailure.meshes.values()][1]!);
  const refusedSetup: ReturnType<typeof observeThrownValue> = observeThrownValue((): ReturnType<typeof applyRenderMode> => applyRenderMode(setupFailure.scene, "mask"));
  TestValidator.predicate("setup keeps its original native assignment refusal before restoration refusals",
    refusedSetup.threw && refusedSetup.error instanceof AggregateError && refusedSetup.error.errors[0] instanceof TypeError);
  TestValidator.predicate("refused setup restores its independent neighbor and atmosphere",
    [...setupFailure.meshes.values()].every((mesh: THREE.Mesh): boolean => mesh.material === setupFailure.beauty.get(mesh)) &&
    setupFailure.scene.fog === setupFog && (setupFailure.scene.background as THREE.Color).getHex() === 0x123456);
  const setupRepeat:ReturnType<typeof observeThrownValue>=observeThrownValue(():ReturnType<typeof applyRenderMode>=>applyRenderMode(setupFailure.scene,"mask"));
  TestValidator.predicate("failed setup rollback keeps the same complete cause",setupRepeat.threw&&setupRepeat.error===refusedSetup.error);

  // The same design with the three simulated drawables never built: the shot
  // still declares them, so the audit reports their missing scene roots.
  const missing: ReturnType<typeof build> = build(design, { simulated: false });
  attachAutoMovieSemanticMask(missing.scene, { design, mask });
  const missingHandle: ReturnType<typeof applyRenderMode> = applyRenderMode(missing.scene, "mask");
  TestValidator.equals(
    "a drawable the shot declared and the scene never built is named",
    {
      audit: auditAutoMovieSemanticMaskScene({
        scene: missing.scene,
        design,
        mask,
      }),
      // The pass reports the same list, so a caller holding only the handle
      // learns it without auditing the scene a second time.
      handle: missingHandle.semantic?.unresolved,
      painted: missingHandle.semantic?.painted,
      // Two paths count the same population, one by painting and one without.
      // A divergence would make the status line describe a different frame
      // than the one the pass produced.
      agree: missingHandle.semantic?.unaddressed,
      // Neither run may name a room, an opening or an instanced slot: those
      // claim no drawable of their own and are reached through `owner`.
      quiet: mask.entries
        .filter(
          (entry: (typeof mask.entries)[number]) : boolean => entry.nodes.length === 0 && entry.kind !== "instance-set",
        )
        .every(
          (entry: (typeof mask.entries)[number]) : boolean =>
            missingHandle.semantic!.unresolved.includes(entry.id) === false,
        ),
    },
    {
      audit: {
        unresolved: [
          "planting:atrium-bed",
          "soft-body:panel",
          "water-body:basin",
        ],
        // The stray mesh, counted without painting anything: the audit reads
        // the same population the pass leaves at the reserved background.
        unaddressed: 1,
      },
      handle: ["planting:atrium-bed", "soft-body:panel", "water-body:basin"],
      painted: 6,
      agree: 1,
      quiet: true,
    },
  );
  missingHandle.restore();

  TestValidator.equals(
    "a scene containing every declared drawable audits clean and still counts unclaimed meshes",
    auditAutoMovieSemanticMaskScene({ scene: complete.scene, design, mask }),
    { unresolved: [], unaddressed: 1 },
  );

  // An instanced set claims no `nodes` of its own and is joined by its entry id,
  // so a missing batch needs its own case rather than riding on the others.
  const setless: ReturnType<typeof build> = build(design, { simulated: true, instanceSet: false });
  TestValidator.equals(
    "an instanced batch the scene never built is named by its set id",
    auditAutoMovieSemanticMaskScene({ scene: setless.scene, design, mask }),
    { unresolved: ["instance-set:windows"], unaddressed: 1 },
  );

  // A palette that cannot resolve the scene refuses, and the refusal must cost
  // nothing: outer pass setup can suspend atmosphere and helpers before mapper
  // admission, while the mapper preflights its roots before its own mutation.
  // A failed setup must restore all state it actually changed.
  const short: THREE.Scene = new THREE.Scene();
  short.background = new THREE.Color(0x123456);
  short.fog = new THREE.FogExp2(0x223344, 0.02);
  short.environment = new THREE.Texture();
  const grid: THREE.LineSegments = new THREE.LineSegments(new THREE.BufferGeometry());
  short.add(grid);
  attachAutoMovieSemanticMask(short, { design, mask });
  TestValidator.equals(
    "a refused palette leaves the scene exactly as it found it",
    namedFacts([
      [
        "refused",
        () : boolean =>
          throwsError(
            (): ReturnType<typeof applyRenderMode> => applyRenderMode(short, "mask"),
            "cannot resolve staged nodes",
          ),
      ],
      ["fog", () : boolean => short.fog !== null],
      ["image lighting", () : boolean => short.environment !== null],
      [
        "background",
        () : boolean => (short.background as THREE.Color).getHex() === 0x123456,
      ],
      ["grid visible", () : boolean => grid.visible],
    ]),
    {
      refused: true,
      fog: true,
      "image lighting": true,
      background: true,
      "grid visible": true,
    },
  );
}

/**
 * Assemble the scene `buildScene` and the compiled shot runtime assemble: one
 * named group per designed node in declaration order, a named group for the
 * compiled instance set, and one named object per simulated drawable.
 */
const build: (design: IAutoMovieScene, props: { simulated: boolean; instanceSet?: boolean }) => {
  scene: THREE.Scene;
  meshes: Map<string, THREE.Mesh>;
  beauty: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  stray: THREE.Mesh;
  strayBeauty: THREE.Material | THREE.Material[];
} = (
  design: IAutoMovieScene,
  props: { simulated: boolean; instanceSet?: boolean },
): {
  scene: THREE.Scene;
  meshes: Map<string, THREE.Mesh>;
  beauty: Map<THREE.Mesh, THREE.Material | THREE.Material[]>;
  stray: THREE.Mesh;
  strayBeauty: THREE.Material | THREE.Material[];
} => {
  const scene: THREE.Scene = new THREE.Scene();
  scene.background = new THREE.Color(0x123456);
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry(1, 1, 1);
  const meshes: Map<string, THREE.Mesh> = new Map<string, THREE.Mesh>();
  const add: (name: string, parent: THREE.Object3D) => THREE.Mesh = (name: string, parent: THREE.Object3D): THREE.Mesh => {
    const mesh: THREE.Mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
    mesh.name = name;
    parent.add(mesh);
    meshes.set(name, mesh);
    return mesh;
  };
  for (const node of design.nodes) {
    const group: THREE.Group = new THREE.Group();
    group.name = node.id;
    scene.add(group);
    add(node.id, group);
  }
  if (props.instanceSet !== false) {
    const setGroup: THREE.Group = new THREE.Group();
    setGroup.name = "instance-set:windows";
    scene.add(setGroup);
    add("instance-set:windows", setGroup);
  }
  if (props.simulated) {
    add(autoMovieFluidSurfaceNodeName("basin"), scene);
    add(autoMovieSoftBodyNodeName("panel"), scene);
    const cluster: THREE.Group = new THREE.Group();
    cluster.name = autoMoviePlantingNodeName("atrium-bed");
    scene.add(cluster);
    add(autoMoviePlantingNodeName("atrium-bed"), cluster);
  }
  // One mesh no entry claims: a segmentation pass paints it the reserved
  // background and counts it rather than leaving a lit surface in the frame.
  const stray: THREE.Mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial());
  scene.add(stray);
  const beauty: Map<THREE.Mesh, THREE.Material | THREE.Material[]> = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  for (const mesh of meshes.values()) beauty.set(mesh, mesh.material);
  return { scene, meshes, beauty, stray, strayBeauty: stray.material };
};
