import {
  EDGE_SHELL_NAME,
  POSE_OVERLAY_NAME,
  applyRenderMode,
  collectAutoMovieOwnedResources,
  restoreAutoMovieRenderModeState,
} from "@automovie/viewer";
import { disposeHumanPreview } from "@automovie/viewer/human/common/disposeHumanPreview";
import { createHumanObservation } from "@automovie/viewer/human/common/observation/createHumanObservation";
import { releaseHumanPreviewGroup } from "@automovie/viewer/human/common/releaseHumanPreviewGroup";
import { createHumanViewerCache } from "@automovie/viewer/human/inspection/createHumanViewerCache";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** Local native-box ownership facts returned by the existing observation fixture. */
type ObservationFixture = {
  scene: THREE.Scene;
  root: THREE.Group;
  geometry: THREE.BoxGeometry;
  map: THREE.DataTexture;
  material: THREE.MeshStandardMaterial;
  clay: THREE.MeshStandardMaterial;
  borrowedOverride: THREE.MeshBasicMaterial;
  firstMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  secondMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>;
  observation: ReturnType<typeof createHumanObservation>;
  owned: THREE.Material[];
  hull: THREE.Mesh;
};
/** Portable cache byte facts; no native resident or renderer is represented. */
type CacheValue = { id: string; bytes: number };

const caught: (operation: () => void) => unknown = (
  operation: () => void,
): unknown => {
  try {
    operation();
    return undefined;
  } catch (error) {
    return error;
  }
};

/**
 * A failed resource listener cannot retain a structural override or skip its neighboring scene state. Existing real materials and their disposal events exercise that failure while GPU pixels and physical release remain unobserved.
 *
 * Scenarios:
 * 1. Empty and successful restoration sets finish without altering error state.
 * 2. Primary, single, multiple and nested errors retain every independent failure while all later operations still execute.
 * 3. Depth, normal, mask and outline dispose failures still restore original materials, fog, environment, background and non-mesh visibility.
 * 4. Pose geometry disposal failure removes the overlay and restores original mesh visibility and scene state; repeated failed restores keep their original cause without repeating real disposal events.
 * 5. A generic subtree shares geometry and standard/custom shadow materials; each distinct owner is attempted once despite disposal listeners failing. Cached textures remain borrowed, while decoded subtree textures retire.
 * 6. A generic resident cache keeps pending/failed array bytes, independently completes replacement and eviction, and preserves existing recency and oversize policy with explicit error settlement.
 * 7. A generic box observation restores borrowed display state synchronously, independently retires six owned pass materials, preserves original failures and shares its actual completion under repeat and reentry.
 * 8. Showing a previously hidden mutable box succeeds; a frozen box's refused visibility restoration remains owned and observable during final close.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises independent restoration, actual Three disposal events, source-state restoration, cache retirement and the existing generic-box observation seam. Failed depth/normal/mask/outline/pose restores must retain their original error and attempt each owned disposal only once; neighboring owners and borrowed scene state must still restore.
 * @evidence contracts/testing.md#independent-expectations Original material/scene object identities and independently recorded dispose events define restoration and ownership; manually arranged byte totals and error order define cache expectations. Box resources are actual Three objects without a renderer, so these assertions do not prove hardware pixels, anatomical validity, kernel memory release or physical process shutdown.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty/successful restoration, primary/single/multiple/opaque aggregate failures, four material passes plus pose, shared custom-shadow resources, borrowed versus decoded textures, invalid/exact/oversize cache budgets, delayed/failed/reentrant retirement, repeat/reentrant observation close, departure and mutable/frozen visibility. Shader appearance and actual browser lifecycle remain separate observation obligations.
 * @evidence contracts/testing.md#execution-ownership This named asynchronous unit entry calls production source through existing exports and the existing generic-box observation/cache seams, with real CPU-side Three objects and their own event listeners. It creates no browser, GPU, native process, Human model, new probe or dynamic test registration.
 */
export async function test_viewer_render_mode_restoration(): Promise<void> {
  const first: Error = new Error("first"),
    second: Error = new Error("second");
  let calls: number = 0;
  restoreAutoMovieRenderModeState([]);
  restoreAutoMovieRenderModeState([
    (): void => {
      calls++;
    },
  ]);
  TestValidator.predicate(
    "primary error remains first",
    caught((): void =>
      restoreAutoMovieRenderModeState(
        [
          (): void => {
            calls++;
          },
        ],
        { error: first },
      ),
    ) === first,
  );
  TestValidator.predicate(
    "single restore failure retains identity",
    caught((): void =>
      restoreAutoMovieRenderModeState([
        (): void => {
          throw first;
        },
        (): void => {
          calls++;
        },
      ]),
    ) === first,
  );
  const aggregate: unknown = caught((): void =>
    restoreAutoMovieRenderModeState([
      (): void => {
        throw new AggregateError([new AggregateError([first]), second]);
      },
      (): void => {
        calls++;
      },
    ]),
  );
  TestValidator.predicate(
    "nested failures flatten in order",
    aggregate instanceof AggregateError &&
      aggregate.errors[0] === first &&
      aggregate.errors[1] === second,
  );
  TestValidator.equals("all independent operations attempted", calls, 4);
  const emptyAggregate: AggregateError = new AggregateError(
    [],
    "opaque failure",
  );
  TestValidator.predicate(
    "empty aggregate is an opaque failure, not success",
    caught((): void =>
      restoreAutoMovieRenderModeState([
        (): void => {
          throw emptyAggregate;
        },
      ]),
    ) === emptyAggregate,
  );
  for (const pass of ["depth", "normal", "mask", "outline"] as const) {
    const scene: THREE.Scene = new THREE.Scene(),
      geometry: THREE.BoxGeometry = new THREE.BoxGeometry(),
      material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(),
      mesh: THREE.Mesh = new THREE.Mesh(geometry, material);
    const background: THREE.Color = new THREE.Color(0x123456),
      fog: THREE.Fog = new THREE.Fog(0, 1, 10),
      environment: THREE.Texture = new THREE.Texture(),
      line: THREE.LineSegments = new THREE.LineSegments(
        new THREE.BufferGeometry(),
      );
    scene.background = background;
    scene.fog = fog;
    scene.environment = environment;
    scene.add(mesh, line);
    const mode: ReturnType<typeof applyRenderMode> = applyRenderMode(
        scene,
        pass,
      ),
      override: THREE.Material = mesh.material as THREE.Material;
    let attempts: number = 0;
    override.addEventListener("dispose", (): void => {
      ++attempts;
      throw first;
    });
    const error: unknown = caught((): void => mode.restore());
    TestValidator.predicate("real dispose failure retained", error === first);
    TestValidator.predicate(
      "all scene and material state restored",
      mesh.material === material &&
        scene.background === background &&
        scene.fog === fog &&
        scene.environment === environment &&
        line.visible &&
        scene.getObjectByName(EDGE_SHELL_NAME) === undefined,
    );
    TestValidator.predicate(
      "failed repeat keeps original cause without another disposal",
      caught((): void => mode.restore()) === first && attempts === 1,
    );
    TestValidator.predicate(
      "another same-scene pass cannot reacquire over failed material ownership",
      caught(
        (): ReturnType<typeof applyRenderMode> => applyRenderMode(scene, pass),
      ) === first && attempts === 1,
    );
    geometry.dispose();
    material.dispose();
    environment.dispose();
    line.geometry.dispose();
  }
  const scene: THREE.Scene = new THREE.Scene(),
    geometry: THREE.BoxGeometry = new THREE.BoxGeometry(),
    material: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial(),
    mesh: THREE.Mesh = new THREE.Mesh(geometry, material),
    bone: THREE.Bone = new THREE.Bone(),
    child: THREE.Bone = new THREE.Bone();
  bone.add(child);
  scene.add(mesh, bone);
  const background: THREE.Color = new THREE.Color(0x112233);
  scene.background = background;
  const pose: ReturnType<typeof applyRenderMode> = applyRenderMode(
      scene,
      "pose",
    ),
    overlay: THREE.Object3D = scene.getObjectByName(POSE_OVERLAY_NAME)!;
  const segment: THREE.Line = overlay.children[0] as THREE.Line;
  let poseAttempts: number = 0;
  segment.geometry.addEventListener("dispose", (): void => {
    ++poseAttempts;
    throw first;
  });
  TestValidator.predicate(
    "pose resource failure retained",
    caught((): void => pose.restore()) === first,
  );
  TestValidator.predicate(
    "pose state restored despite disposal",
    mesh.visible &&
      scene.background === background &&
      scene.getObjectByName(POSE_OVERLAY_NAME) === undefined,
  );
  TestValidator.predicate(
    "failed pose repeat keeps its cause without reissuing disposal",
    caught((): void => pose.restore()) === first && poseAttempts === 1,
  );
  TestValidator.predicate(
    "failed outer pose owner refuses another same-scene pass",
    caught(
      (): ReturnType<typeof applyRenderMode> => applyRenderMode(scene, "pose"),
    ) === first && poseAttempts === 1,
  );
  geometry.dispose();
  material.dispose();

  const owned: THREE.Group = new THREE.Group();
  const sharedGeometry: THREE.BoxGeometry = new THREE.BoxGeometry();
  const image: THREE.DataTexture = new THREE.DataTexture(
    new Uint8Array(4),
    1,
    1,
  );
  const sharedMaterial: THREE.MeshBasicMaterial = new THREE.MeshBasicMaterial({
    map: image,
  });
  const shadow: THREE.MeshDepthMaterial = new THREE.MeshDepthMaterial({
    map: image,
  });
  const distance: THREE.MeshDistanceMaterial = new THREE.MeshDistanceMaterial({
    map: image,
  });
  const a: THREE.Mesh = new THREE.Mesh(sharedGeometry, [
    sharedMaterial,
    shadow,
  ]);
  const b: THREE.Mesh = new THREE.Mesh(sharedGeometry, sharedMaterial);
  a.customDepthMaterial = shadow;
  a.customDistanceMaterial = distance;
  b.customDepthMaterial = shadow;
  owned.add(a, b, new THREE.Object3D());
  const collected: ReturnType<typeof collectAutoMovieOwnedResources> =
    collectAutoMovieOwnedResources(owned);
  TestValidator.equals(
    "shared subtree resources have distinct ownership",
    collected.length,
    4,
  );
  TestValidator.predicate(
    "collector includes each actual custom shadow role",
    collected[0] === sharedGeometry &&
      collected.includes(sharedMaterial) &&
      collected.includes(shadow) &&
      collected.includes(distance),
  );
  const decoded: ReturnType<typeof collectAutoMovieOwnedResources> =
    collectAutoMovieOwnedResources(owned, true);
  TestValidator.equals(
    "all material roles share one owned texture",
    decoded.length,
    5,
  );
  TestValidator.predicate(
    "texture follows geometry and all materials",
    decoded[4] === image,
  );
  TestValidator.equals(
    "empty subtree has no release attempts",
    collectAutoMovieOwnedResources(new THREE.Group(), true).length,
    0,
  );
  const released: string[] = [];
  const geometryFailure: Error = new Error("owned geometry");
  const shadowFailure: Error = new Error("owned shadow");
  const failGeometry: () => never = (): never => {
    owned.clear();
    throw geometryFailure;
  };
  const failShadow: () => never = (): never => {
    throw shadowFailure;
  };
  sharedGeometry.addEventListener("dispose", (): void => {
    released.push("geometry");
  });
  shadow.addEventListener("dispose", (): void => {
    released.push("shadow");
  });
  sharedGeometry.addEventListener("dispose", failGeometry);
  sharedMaterial.addEventListener("dispose", (): void => {
    released.push("material");
  });
  shadow.addEventListener("dispose", failShadow);
  distance.addEventListener("dispose", (): void => {
    released.push("distance");
  });
  image.addEventListener("dispose", (): void => {
    released.push("image");
  });
  const subtreeFailure: unknown = caught((): void =>
    releaseHumanPreviewGroup(owned),
  );
  TestValidator.predicate(
    "independent subtree errors preserve original order",
    subtreeFailure instanceof AggregateError &&
      subtreeFailure.errors.length === 2 &&
      subtreeFailure.errors[0] === geometryFailure &&
      subtreeFailure.errors[1] === shadowFailure,
  );
  TestValidator.equals(
    "cache-backed group attempts every resource but borrows texture",
    released,
    ["geometry", "material", "shadow", "distance"],
  );
  TestValidator.equals(
    "callback mutation cannot drop collected release owners",
    owned.children.length,
    0,
  );
  owned.add(a, b);
  sharedGeometry.removeEventListener("dispose", failGeometry);
  shadow.removeEventListener("dispose", failShadow);
  released.length = 0;
  disposeHumanPreview(owned);
  TestValidator.equals(
    "decoded group owns and retires its unique texture",
    released,
    ["geometry", "material", "shadow", "distance", "image"],
  );

  const value: (id: string, bytes: number) => CacheValue = (
    id: string,
    bytes: number,
  ): CacheValue => ({ id, bytes });
  const size: (entry: CacheValue) => number = (entry: CacheValue): number =>
    entry.bytes;
  const retired: string[] = [];
  for (const budget of [0, -1, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.predicate(
      "invalid cache budgets refuse before registration",
      caught((): void => {
        createHumanViewerCache(budget, size, (): undefined => undefined);
      }) instanceof Error,
    );
  const lru: ReturnType<typeof createHumanViewerCache<CacheValue>> =
    createHumanViewerCache(10, size, (entry: CacheValue): void => {
      retired.push(entry.id);
    });
  for (const bytes of [-1, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.predicate(
      "invalid resident size cannot replace the valid selection",
      caught((): void => lru.set("invalid", value("invalid", bytes))) instanceof
        Error,
    );
  TestValidator.equals(
    "missing resident remains a cache miss",
    lru.get("missing"),
    undefined,
  );
  const firstValue: CacheValue = value("first", 4);
  const secondValue: CacheValue = value("second", 6);
  lru.set("first", firstValue);
  lru.set("second", secondValue);
  TestValidator.equals(
    "exact budget preserves both residents",
    lru.total(),
    10,
  );
  TestValidator.predicate(
    "actual cache hit returns its identity",
    lru.get("first") === firstValue,
  );
  TestValidator.equals("cache hit moves the resident to newest", lru.keys(), [
    "second",
    "first",
  ]);
  lru.set("first", firstValue);
  await lru.settleRetirements();
  TestValidator.equals(
    "same object replacement retires no owner",
    retired.length,
    0,
  );
  lru.set("first", value("replacement", 4));
  TestValidator.equals(
    "unfinished replacement retains its counted arrays",
    lru.total(),
    14,
  );
  await lru.settleRetirements();
  TestValidator.equals(
    "successful replacement removes only completed retirement bytes",
    [lru.total(), retired],
    [10, ["first"]],
  );
  lru.set("zero", value("zero", 0));
  lru.set("oversize", value("oversize", 11));
  TestValidator.equals("oversize resident is selected alone", lru.keys(), [
    "oversize",
  ]);
  await lru.settleRetirements();
  TestValidator.equals(
    "oversize still has its independent counted size",
    lru.total(),
    11,
  );
  TestValidator.equals(
    "shown oversize cannot evict itself",
    lru.evictOldest("oversize"),
    false,
  );
  lru.clear();
  await lru.settleRetirements();
  TestValidator.equals(
    "completed clear has no retained counted arrays",
    [lru.keys(), lru.total()],
    [[], 0],
  );
  TestValidator.equals(
    "empty cache has nothing else to evict",
    lru.evictOldest("missing"),
    false,
  );
  lru.set("keep", value("keep", 2));
  lru.set("other", value("other", 3));
  TestValidator.equals(
    "eviction skips the shown entry and selects another",
    lru.evictOldest("keep"),
    true,
  );
  await lru.settleRetirements();
  TestValidator.equals(
    "shown selection remains drawn-ready",
    [lru.keys(), lru.total()],
    [["keep"], 2],
  );
  lru.clear();
  await lru.settleRetirements();

  const observed: (completion: Promise<void>) => Promise<unknown> = (
    completion: Promise<void>,
  ): Promise<unknown> =>
    completion
      .then((): undefined => undefined)
      .catch((error: unknown): unknown => error);
  let finishResident!: () => void;
  const delayedResident: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
      finishResident = (): void => resolve(undefined);
    },
  );
  let nextRetirement: number = 0;
  let observeNext!: () => void;
  const nextStarted: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
      observeNext = (): void => resolve(undefined);
    },
  );
  const pendingResidents: ReturnType<
    typeof createHumanViewerCache<CacheValue>
  > = createHumanViewerCache(
    10,
    size,
    (entry: CacheValue): undefined | Promise<undefined> => {
      if (entry.id === "pending") return delayedResident;
      nextRetirement++;
      observeNext();
      return undefined;
    },
  );
  pendingResidents.set("pending", value("pending", 4));
  pendingResidents.set("next", value("next", 6));
  pendingResidents.clear();
  TestValidator.equals(
    "selection withdrawal retains all unfinished arrays",
    pendingResidents.total(),
    10,
  );
  const pendingSettlement: Promise<void> = pendingResidents.settleRetirements();
  await nextStarted;
  TestValidator.equals(
    "pending first retirement cannot skip later resident",
    nextRetirement,
    1,
  );
  TestValidator.predicate(
    "pending owner arrays cannot disappear before completion",
    pendingResidents.total() >= 4,
  );
  finishResident();
  await pendingSettlement;
  TestValidator.equals(
    "delayed actual completion releases its own count",
    pendingResidents.total(),
    0,
  );

  const residentFailure: Error = new Error("resident sync retirement");
  const residentAsyncFailure: Error = new Error("resident async retirement");
  const failedAttempts: string[] = [];
  const failedResidents: ReturnType<typeof createHumanViewerCache<CacheValue>> =
    createHumanViewerCache(
      10,
      size,
      (entry: CacheValue): undefined | Promise<undefined> => {
        failedAttempts.push(entry.id);
        if (entry.id === "sync") throw residentFailure;
        return Promise.reject(residentAsyncFailure);
      },
    );
  failedResidents.set("sync", value("sync", 4));
  failedResidents.set("async", value("async", 6));
  failedResidents.clear();
  const failedSettlement: unknown = await observed(
    failedResidents.settleRetirements(),
  );
  TestValidator.predicate(
    "cache retirement preserves every original ordered failure",
    failedSettlement instanceof AggregateError &&
      failedSettlement.errors.length === 2 &&
      failedSettlement.errors[0] === residentFailure &&
      failedSettlement.errors[1] === residentAsyncFailure,
  );
  TestValidator.equals(
    "failed retirement cannot become freed footprint",
    [failedResidents.total(), failedAttempts],
    [10, ["sync", "async"]],
  );
  const repeatedFailure: unknown = await observed(
    failedResidents.settleRetirements(),
  );
  TestValidator.predicate(
    "later settlement still names original uncertainty",
    repeatedFailure instanceof AggregateError &&
      repeatedFailure.errors[0] === residentFailure,
  );
  TestValidator.equals(
    "repeated settlement does not reissue failed disposal",
    failedAttempts.length,
    2,
  );

  let firstRetirement!: () => void;
  let observeReentrant!: () => void;
  const reentrantStarted: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
      observeReentrant = (): void => resolve(undefined);
    },
  );
  const reentrantPending: Promise<undefined> = new Promise<undefined>(
    (resolve: (value: undefined | PromiseLike<undefined>) => void): void => {
      firstRetirement = (): void => resolve(undefined);
    },
  );
  const reentrantCache: ReturnType<typeof createHumanViewerCache<CacheValue>> =
    createHumanViewerCache(
      10,
      size,
      (entry: CacheValue): undefined | Promise<undefined> => {
        if (entry.id === "before") {
          reentrantCache.set("during", value("during", 3));
          reentrantCache.clear();
          observeReentrant();
          return reentrantPending;
        }
        return undefined;
      },
    );
  reentrantCache.set("before", value("before", 2));
  reentrantCache.clear();
  const reentrantSettlement: Promise<void> = reentrantCache.settleRetirements();
  await reentrantStarted;
  TestValidator.predicate(
    "reentrant owner remains represented while pending",
    reentrantCache.total() >= 2,
  );
  firstRetirement();
  await reentrantSettlement;
  TestValidator.equals(
    "settlement includes reentrant added retirement",
    reentrantCache.total(),
    0,
  );

  const makeObservation: () => ObservationFixture = (): ObservationFixture => {
    const scene: THREE.Scene = new THREE.Scene();
    const root: THREE.Group = new THREE.Group();
    const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
    const map: THREE.DataTexture = new THREE.DataTexture(
      new Uint8Array(4),
      1,
      1,
    );
    const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial(
      { map },
    );
    const clay: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
    const borrowedOverride: THREE.MeshBasicMaterial =
      new THREE.MeshBasicMaterial();
    scene.overrideMaterial = borrowedOverride;
    const firstMesh: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> =
      new THREE.Mesh(geometry, material);
    const secondMesh: THREE.Mesh<
      THREE.BoxGeometry,
      THREE.MeshStandardMaterial
    > = new THREE.Mesh(geometry, material);
    firstMesh.name = "box-a";
    secondMesh.name = "box-b";
    root.add(firstMesh, secondMesh);
    scene.add(root);
    const observation: ReturnType<typeof createHumanObservation> =
      createHumanObservation({
        scene,
        camera: new THREE.PerspectiveCamera(),
        roots: (): THREE.Group[] => [root],
        clay,
        orbit: {
          target: new THREE.Vector3(),
          enableDamping: true,
          minDistance: 0,
          maxDistance: Infinity,
          update: (): undefined => undefined,
        },
        height: (): number => 400,
      });
    const owned: THREE.Material[] = (
      ["normal", "depth", "flat", "wire"] as const
    ).map((pass: "normal" | "depth" | "flat" | "wire"): THREE.Material => {
      observation.hooks.pass(pass);
      return observation.override(false)!;
    });
    observation.hooks.pass("outline");
    observation.apply();
    const white: THREE.Material = firstMesh.material;
    const hull: THREE.Mesh = firstMesh.children[0] as THREE.Mesh;
    owned.push(white, hull.material as THREE.Material);
    TestValidator.equals(
      "observation exposes six distinct actual pass resources",
      new Set(owned).size,
      6,
    );
    return {
      scene,
      root,
      geometry,
      map,
      material,
      clay,
      borrowedOverride,
      firstMesh,
      secondMesh,
      observation,
      owned,
      hull,
    };
  };
  for (const fail of [false, true]) {
    const state: ObservationFixture = makeObservation();
    const events: Map<THREE.Material, number> = new Map<
      THREE.Material,
      number
    >();
    const normalFailure: Error = new Error("owned normal pass retirement");
    const whiteFailure: Error = new Error("owned white pass retirement");
    let borrowedEvents: number = 0;
    for (const resource of [
      state.geometry,
      state.map,
      state.material,
      state.clay,
      state.borrowedOverride,
    ])
      resource.addEventListener("dispose", (): void => {
        borrowedEvents++;
      });
    let reentrantClose: Promise<void> | undefined;
    state.owned.forEach((material: THREE.Material, index: number): void =>
      material.addEventListener("dispose", (): void => {
        events.set(material, (events.get(material) ?? 0) + 1);
        if (index === 5) reentrantClose = state.observation.close();
        if (fail && index === 0) throw normalFailure;
        if (fail && index === 4) throw whiteFailure;
      }),
    );
    state.observation.hooks.hide(["box-b"]);
    state.observation.apply();
    state.scene.overrideMaterial = state.owned[0];
    const completion: Promise<void> = state.observation.close();
    TestValidator.predicate(
      "close restores both borrowed material identities before returning",
      state.firstMesh.material === state.material &&
        state.secondMesh.material === state.material,
    );
    TestValidator.predicate(
      "close restores visibility and removes owned hull nodes synchronously",
      state.secondMesh.visible &&
        state.firstMesh.children.length === 0 &&
        state.secondMesh.children.length === 0,
    );
    TestValidator.predicate(
      "close leaves the original scene override borrowed",
      state.scene.overrideMaterial === state.borrowedOverride,
    );
    TestValidator.predicate(
      "repeat close shares completion before settlement",
      state.observation.close() === completion,
    );
    const completed: unknown = await observed(completion);
    if (fail) {
      TestValidator.predicate(
        "every original pass-disposal cause remains ordered",
        completed instanceof AggregateError &&
          completed.errors.length === 2 &&
          completed.errors[0] === normalFailure &&
          completed.errors[1] === whiteFailure,
      );
      const repeated: unknown = await observed(
        state.observation.settleRetirements(),
      );
      TestValidator.predicate(
        "settlement retains prior failed pass ownership",
        repeated instanceof AggregateError &&
          repeated.errors[0] === normalFailure,
      );
    } else
      TestValidator.equals(
        "healthy pass retirement completes",
        completed,
        undefined,
      );
    TestValidator.predicate(
      "reentrant disposal sees the same completion",
      reentrantClose === completion,
    );
    TestValidator.equals(
      "all six actual pass resources attempted once",
      state.owned.map((material: THREE.Material): number | undefined =>
        events.get(material),
      ),
      [1, 1, 1, 1, 1, 1],
    );
    TestValidator.equals(
      "geometry/source-map/clay/source material/override remain borrowed",
      borrowedEvents,
      0,
    );
    for (const operation of [
      (): void => state.observation.apply(),
      (): void => {
        state.observation.override(false);
      },
      (): void =>
        state.observation.hooks.look({
          position: [0, 0, 1],
          target: [0, 0, 0],
          fov: 30,
        }),
      (): void => {
        state.observation.hooks.isolate(null);
      },
      (): void => {
        state.observation.hooks.hide(null);
      },
      (): void => state.observation.hooks.pass("beauty"),
    ])
      TestValidator.predicate(
        "closed observation refuses new borrowed mutations",
        caught(operation) instanceof Error,
      );
    state.geometry.dispose();
    state.map.dispose();
    state.material.dispose();
    state.clay.dispose();
    state.borrowedOverride.dispose();
  }

  const withdrawal: ObservationFixture = makeObservation();
  const removedFailure: Error = new Error("owned hull removal listener");
  withdrawal.hull.addEventListener("removed", (): void => {
    throw removedFailure;
  });
  let withdrawnAttempts: number = 0;
  for (const material of withdrawal.owned)
    material.addEventListener("dispose", (): void => {
      withdrawnAttempts++;
    });
  withdrawal.observation.hooks.hide(["box-b"]);
  withdrawal.observation.apply();
  const withdrawnResult: unknown = await observed(
    withdrawal.observation.close(),
  );
  TestValidator.predicate(
    "hull withdrawal failure retains its original cause",
    withdrawnResult === removedFailure,
  );
  TestValidator.predicate(
    "failed withdrawal still restores the neighbouring box",
    withdrawal.secondMesh.visible &&
      withdrawal.secondMesh.material === withdrawal.material,
  );
  TestValidator.equals(
    "withdrawal failure cannot skip six independent retirements",
    withdrawnAttempts,
    6,
  );
  withdrawal.geometry.dispose();
  withdrawal.map.dispose();
  withdrawal.material.dispose();
  withdrawal.clay.dispose();
  withdrawal.borrowedOverride.dispose();

  const departed: ObservationFixture = makeObservation();
  const kept: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial> =
    new THREE.Mesh(departed.geometry, departed.material);
  kept.name = "box-kept";
  departed.root.add(kept);
  departed.observation.apply();
  const keptOutline: THREE.Material = kept.material;
  const secondHull: THREE.Mesh = departed.secondMesh.children[0] as THREE.Mesh;
  const departureFailure: Error = new Error("departed hull removal");
  departed.hull.addEventListener("removed", (): void => {
    throw departureFailure;
  });
  departed.root.remove(departed.firstMesh, departed.secondMesh);
  TestValidator.predicate(
    "departure reports the original public hull error",
    caught(departed.observation.apply) === departureFailure,
  );
  const outlinedNeighbourRestored: boolean =
    departed.secondMesh.material === departed.material &&
    secondHull.parent === null;
  TestValidator.predicate(
    "remaining subject keeps its admitted outline",
    kept.material === keptOutline && kept.children.length === 1,
  );
  const departedClose: unknown = await observed(departed.observation.close());
  TestValidator.predicate(
    "ended departed owner restores the remaining source",
    kept.material === departed.material,
  );
  TestValidator.equals(
    "completed scene-graph hull removal is not retried at close",
    departedClose,
    undefined,
  );
  departed.geometry.dispose();
  departed.map.dispose();
  departed.material.dispose();
  departed.clay.dispose();
  departed.borrowedOverride.dispose();

  const hiddenDeparture: ObservationFixture = makeObservation();
  hiddenDeparture.observation.hooks.pass("beauty");
  hiddenDeparture.observation.hooks.hide(["box-a", "box-b"]);
  hiddenDeparture.observation.apply();
  hiddenDeparture.root.remove(
    hiddenDeparture.firstMesh,
    hiddenDeparture.secondMesh,
  );
  Object.freeze(hiddenDeparture.firstMesh);
  const hiddenFailure: unknown = caught(hiddenDeparture.observation.apply);
  TestValidator.predicate(
    "native failed visibility assignment is reported",
    hiddenFailure instanceof TypeError,
  );
  const hiddenNeighbourRestored: boolean = hiddenDeparture.secondMesh.visible;
  const hiddenClose: unknown = await observed(
    hiddenDeparture.observation.close(),
  );
  TestValidator.predicate(
    "failed borrowed visibility remains explicit at final close",
    hiddenClose instanceof TypeError,
  );
  hiddenDeparture.geometry.dispose();
  hiddenDeparture.map.dispose();
  hiddenDeparture.material.dispose();
  hiddenDeparture.clay.dispose();
  hiddenDeparture.borrowedOverride.dispose();
  TestValidator.equals(
    "each failed first departure restores its independent neighbour",
    [outlinedNeighbourRestored, hiddenNeighbourRestored],
    [true, true],
  );

  for (const fail of [false, true]) {
    const shownAgain: ObservationFixture = makeObservation();
    shownAgain.observation.hooks.pass("beauty");
    shownAgain.observation.hooks.hide(["box-a"]);
    shownAgain.observation.apply();
    TestValidator.equals(
      "the owned visibility transition starts hidden",
      shownAgain.firstMesh.visible,
      false,
    );
    if (fail) Object.freeze(shownAgain.firstMesh);
    shownAgain.observation.hooks.hide(null);
    const visibilityResult: unknown = caught(shownAgain.observation.apply);
    const visibilityClose: unknown = await observed(
      shownAgain.observation.close(),
    );
    TestValidator.predicate(
      "a refused visibility restoration remains owned at final close",
      fail
        ? visibilityResult instanceof TypeError &&
            visibilityClose instanceof TypeError
        : visibilityResult === undefined &&
            visibilityClose === undefined &&
            shownAgain.firstMesh.visible,
    );
    shownAgain.geometry.dispose();
    shownAgain.map.dispose();
    shownAgain.material.dispose();
    shownAgain.clay.dispose();
    shownAgain.borrowedOverride.dispose();
  }
}
