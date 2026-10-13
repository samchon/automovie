import {applyRenderMode,collectAutoMovieOwnedResources,restoreAutoMovieRenderModeState,EDGE_SHELL_NAME,POSE_OVERLAY_NAME} from "@automovie/viewer";
import { releaseHumanPreviewGroup } from "@automovie/viewer/human/common/releaseHumanPreviewGroup";
import { disposeHumanPreview } from "@automovie/viewer/human/common/disposeHumanPreview";
import {TestValidator} from "@nestia/e2e";
import * as THREE from "three";
import { createHumanViewerCache } from "@automovie/viewer/human/inspection/createHumanViewerCache";
import { createHumanObservation } from "@automovie/viewer/human/common/observation/createHumanObservation";

const caught=(operation:()=>void):unknown=>{try{operation();return undefined;}catch(error){return error;}};

/**
 * A failed resource listener cannot retain a structural override or skip its
 * neighboring scene state. Real materials and their disposal events exercise
 * the failure, without claiming fake renderer pixels as visual evidence.
 *
 * Scenarios:
 * 1. Empty and successful restoration sets finish without altering error state.
 * 2. Primary, single, multiple and nested errors retain every independent
 *    failure while all later operations still execute.
 * 3. Depth, normal, mask and outline dispose failures still restore original
 *    materials, fog, environment, background and non-mesh visibility.
 * 4. Pose geometry disposal failure removes the overlay and restores original
 *    mesh visibility and scene state; repeated ended restores are idempotent.
 * 5. A generic subtree shares geometry and standard/custom shadow materials;
 *    each distinct owner is attempted once despite disposal listeners failing.
 *    Cached textures remain borrowed, while decoded subtree textures retire.
 * 6. A generic resident cache keeps pending/failed array bytes, independently
 *    completes replacement and eviction, and preserves existing recency and
 *    oversize policy with explicit error settlement.
 * 7. A generic box observation restores borrowed display state synchronously,
 *    independently retires six owned pass materials, preserves original
 *    failures and shares its actual completion under repeat and reentry.
 * 8. Showing a previously hidden mutable box succeeds; a frozen box's refused
 *    visibility restoration remains owned and observable during final close.
 */
export const test_viewer_render_mode_restoration=async ():Promise<void>=>{
  const first=new Error("first"),second=new Error("second");let calls=0;
  restoreAutoMovieRenderModeState([]);restoreAutoMovieRenderModeState([()=>{calls++;}]);
  TestValidator.predicate("primary error remains first",caught(()=>restoreAutoMovieRenderModeState([()=>{calls++;}],{error:first}))===first);
  TestValidator.predicate("single restore failure retains identity",caught(()=>restoreAutoMovieRenderModeState([()=>{throw first;},()=>{calls++;}]))===first);
  const aggregate=caught(()=>restoreAutoMovieRenderModeState([()=>{throw new AggregateError([first,second]);},()=>{calls++;}]));
  TestValidator.predicate("nested failures flatten in order",aggregate instanceof AggregateError&&aggregate.errors[0]===first&&aggregate.errors[1]===second);
  TestValidator.equals("all independent operations attempted",calls,4);
  const emptyAggregate=new AggregateError([],"opaque failure");
  TestValidator.predicate("empty aggregate is an opaque failure, not success",caught(()=>restoreAutoMovieRenderModeState([()=>{throw emptyAggregate;}]))===emptyAggregate);
  for(const pass of ["depth","normal","mask","outline"] as const){
    const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(geometry,material);
    const background=new THREE.Color(0x123456),fog=new THREE.Fog(0,1,10),environment=new THREE.Texture(),line=new THREE.LineSegments(new THREE.BufferGeometry());
    scene.background=background;scene.fog=fog;scene.environment=environment;scene.add(mesh,line);
    const mode=applyRenderMode(scene,pass),override=mesh.material as THREE.Material;
    override.addEventListener("dispose",()=>{throw first;});
    const error=caught(()=>mode.restore());TestValidator.predicate("real dispose failure retained",error===first);
    TestValidator.predicate("all scene and material state restored",mesh.material===material&&scene.background===background&&scene.fog===fog&&scene.environment===environment&&line.visible&&scene.getObjectByName(EDGE_SHELL_NAME)===undefined);
    mode.restore();geometry.dispose();material.dispose();environment.dispose();line.geometry.dispose();
  }
  const scene=new THREE.Scene(),geometry=new THREE.BoxGeometry(),material=new THREE.MeshBasicMaterial(),mesh=new THREE.Mesh(geometry,material),bone=new THREE.Bone(),child=new THREE.Bone();bone.add(child);scene.add(mesh,bone);
  const background=new THREE.Color(0x112233);scene.background=background;const pose=applyRenderMode(scene,"pose"),overlay=scene.getObjectByName(POSE_OVERLAY_NAME)!;
  const segment=overlay.children[0] as THREE.Line;segment.geometry.addEventListener("dispose",()=>{throw first;});
  TestValidator.predicate("pose resource failure retained",caught(()=>pose.restore())===first);
  TestValidator.predicate("pose state restored despite disposal",mesh.visible&&scene.background===background&&scene.getObjectByName(POSE_OVERLAY_NAME)===undefined);pose.restore();geometry.dispose();material.dispose();

  const owned = new THREE.Group();
  const sharedGeometry = new THREE.BoxGeometry();
  const image = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const sharedMaterial = new THREE.MeshBasicMaterial({ map: image });
  const shadow = new THREE.MeshDepthMaterial({ map: image });
  const distance = new THREE.MeshDistanceMaterial({ map: image });
  const a = new THREE.Mesh(sharedGeometry, [sharedMaterial, shadow]);
  const b = new THREE.Mesh(sharedGeometry, sharedMaterial);
  a.customDepthMaterial = shadow;
  a.customDistanceMaterial = distance;
  b.customDepthMaterial = shadow;
  owned.add(a, b, new THREE.Object3D());
  const collected = collectAutoMovieOwnedResources(owned);
  TestValidator.equals("shared subtree resources have distinct ownership", collected.length, 4);
  TestValidator.predicate("collector includes each actual custom shadow role",
    collected[0] === sharedGeometry && collected.includes(sharedMaterial) &&
    collected.includes(shadow) && collected.includes(distance));
  const decoded = collectAutoMovieOwnedResources(owned, true);
  TestValidator.equals("all material roles share one owned texture", decoded.length, 5);
  TestValidator.predicate("texture follows geometry and all materials", decoded[4] === image);
  TestValidator.equals("empty subtree has no release attempts", collectAutoMovieOwnedResources(new THREE.Group(), true).length, 0);
  const released: string[] = [];
  const geometryFailure = new Error("owned geometry");
  const shadowFailure = new Error("owned shadow");
  const failGeometry = () => { owned.clear(); throw geometryFailure; };
  const failShadow = () => { throw shadowFailure; };
  sharedGeometry.addEventListener("dispose", () => { released.push("geometry"); });
  shadow.addEventListener("dispose", () => { released.push("shadow"); });
  sharedGeometry.addEventListener("dispose", failGeometry);
  sharedMaterial.addEventListener("dispose", () => { released.push("material"); });
  shadow.addEventListener("dispose", failShadow);
  distance.addEventListener("dispose", () => { released.push("distance"); });
  image.addEventListener("dispose", () => { released.push("image"); });
  const subtreeFailure = caught(() => releaseHumanPreviewGroup(owned));
  TestValidator.predicate("independent subtree errors preserve original order",
    subtreeFailure instanceof AggregateError && subtreeFailure.errors.length === 2 &&
    subtreeFailure.errors[0] === geometryFailure && subtreeFailure.errors[1] === shadowFailure);
  TestValidator.equals("cache-backed group attempts every resource but borrows texture", released,
    ["geometry", "material", "shadow", "distance"]);
  TestValidator.equals("callback mutation cannot drop collected release owners", owned.children.length, 0);
  owned.add(a, b);
  sharedGeometry.removeEventListener("dispose", failGeometry);
  shadow.removeEventListener("dispose", failShadow);
  released.length = 0;
  disposeHumanPreview(owned);
  TestValidator.equals("decoded group owns and retires its unique texture", released,
    ["geometry", "material", "shadow", "distance", "image"]);

  const value = (id: string, bytes: number) => ({ id, bytes });
  const size = (entry: ReturnType<typeof value>) => entry.bytes;
  const retired: string[] = [];
  for (const budget of [0, -1, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.predicate("invalid cache budgets refuse before registration",
      caught(() => createHumanViewerCache(budget, size, () => undefined)) instanceof Error);
  const lru = createHumanViewerCache(10, size, (entry) => { retired.push(entry.id); });
  for (const bytes of [-1, Number.NaN, Number.POSITIVE_INFINITY])
    TestValidator.predicate("invalid resident size cannot replace the valid selection",
      caught(() => lru.set("invalid", value("invalid", bytes))) instanceof Error);
  TestValidator.equals("missing resident remains a cache miss", lru.get("missing"), undefined);
  const firstValue = value("first", 4);
  const secondValue = value("second", 6);
  lru.set("first", firstValue);
  lru.set("second", secondValue);
  TestValidator.equals("exact budget preserves both residents", lru.total(), 10);
  TestValidator.predicate("actual cache hit returns its identity", lru.get("first") === firstValue);
  TestValidator.equals("cache hit moves the resident to newest", lru.keys(), ["second", "first"]);
  lru.set("first", firstValue);
  await lru.settleRetirements();
  TestValidator.equals("same object replacement retires no owner", retired.length, 0);
  lru.set("first", value("replacement", 4));
  TestValidator.equals("unfinished replacement retains its counted arrays", lru.total(), 14);
  await lru.settleRetirements();
  TestValidator.equals("successful replacement removes only completed retirement bytes", [lru.total(), retired], [10, ["first"]]);
  lru.set("zero", value("zero", 0));
  lru.set("oversize", value("oversize", 11));
  TestValidator.equals("oversize resident is selected alone", lru.keys(), ["oversize"]);
  await lru.settleRetirements();
  TestValidator.equals("oversize still has its independent counted size", lru.total(), 11);
  TestValidator.equals("shown oversize cannot evict itself", lru.evictOldest("oversize"), false);
  lru.clear();
  await lru.settleRetirements();
  TestValidator.equals("completed clear has no retained counted arrays", [lru.keys(), lru.total()], [[], 0]);
  TestValidator.equals("empty cache has nothing else to evict", lru.evictOldest("missing"), false);
  lru.set("keep", value("keep", 2));
  lru.set("other", value("other", 3));
  TestValidator.equals("eviction skips the shown entry and selects another", lru.evictOldest("keep"), true);
  await lru.settleRetirements();
  TestValidator.equals("shown selection remains drawn-ready", [lru.keys(), lru.total()], [["keep"], 2]);
  lru.clear();
  await lru.settleRetirements();

  const observed = (completion: Promise<void>) => completion
    .then(() => undefined).catch((error: unknown) => error);
  let finishResident!: () => void;
  const delayedResident = new Promise<undefined>((resolve) => { finishResident = () => resolve(undefined); });
  let nextRetirement = 0;
  let observeNext!: () => void;
  const nextStarted = new Promise<undefined>((resolve) => { observeNext = () => resolve(undefined); });
  const pendingResidents = createHumanViewerCache(10, size, (entry) => {
    if (entry.id === "pending") return delayedResident;
    nextRetirement++;
    observeNext();
  });
  pendingResidents.set("pending", value("pending", 4));
  pendingResidents.set("next", value("next", 6));
  pendingResidents.clear();
  TestValidator.equals("selection withdrawal retains all unfinished arrays", pendingResidents.total(), 10);
  const pendingSettlement = pendingResidents.settleRetirements();
  await nextStarted;
  TestValidator.equals("pending first retirement cannot skip later resident", nextRetirement, 1);
  TestValidator.predicate("pending owner arrays cannot disappear before completion", pendingResidents.total() >= 4);
  finishResident();
  await pendingSettlement;
  TestValidator.equals("delayed actual completion releases its own count", pendingResidents.total(), 0);

  const residentFailure = new Error("resident sync retirement");
  const residentAsyncFailure = new Error("resident async retirement");
  const failedAttempts: string[] = [];
  const failedResidents = createHumanViewerCache(10, size, (entry) => {
    failedAttempts.push(entry.id);
    if (entry.id === "sync") throw residentFailure;
    return Promise.reject(residentAsyncFailure);
  });
  failedResidents.set("sync", value("sync", 4));
  failedResidents.set("async", value("async", 6));
  failedResidents.clear();
  const failedSettlement = await observed(failedResidents.settleRetirements());
  TestValidator.predicate("cache retirement preserves every original ordered failure",
    failedSettlement instanceof AggregateError && failedSettlement.errors.length === 2 &&
    failedSettlement.errors[0] === residentFailure && failedSettlement.errors[1] === residentAsyncFailure);
  TestValidator.equals("failed retirement cannot become freed footprint", [failedResidents.total(), failedAttempts],
    [10, ["sync", "async"]]);
  const repeatedFailure = await observed(failedResidents.settleRetirements());
  TestValidator.predicate("later settlement still names original uncertainty",
    repeatedFailure instanceof AggregateError && repeatedFailure.errors[0] === residentFailure);
  TestValidator.equals("repeated settlement does not reissue failed disposal", failedAttempts.length, 2);

  let firstRetirement!: () => void;
  let observeReentrant!: () => void;
  const reentrantStarted = new Promise<undefined>((resolve) => { observeReentrant = () => resolve(undefined); });
  const reentrantPending = new Promise<undefined>((resolve) => { firstRetirement = () => resolve(undefined); });
  const reentrantCache = createHumanViewerCache(10, size, (entry) => {
    if (entry.id === "before") {
      reentrantCache.set("during", value("during", 3));
      reentrantCache.clear();
      observeReentrant();
      return reentrantPending;
    }
  });
  reentrantCache.set("before", value("before", 2));
  reentrantCache.clear();
  const reentrantSettlement = reentrantCache.settleRetirements();
  await reentrantStarted;
  TestValidator.predicate("reentrant owner remains represented while pending", reentrantCache.total() >= 2);
  firstRetirement();
  await reentrantSettlement;
  TestValidator.equals("settlement includes reentrant added retirement", reentrantCache.total(), 0);

  const makeObservation = () => {
    const scene = new THREE.Scene();
    const root = new THREE.Group();
    const geometry = new THREE.BoxGeometry();
    const map = new THREE.DataTexture(new Uint8Array(4), 1, 1);
    const material = new THREE.MeshStandardMaterial({ map });
    const clay = new THREE.MeshStandardMaterial();
    const borrowedOverride = new THREE.MeshBasicMaterial();
    scene.overrideMaterial = borrowedOverride;
    const firstMesh = new THREE.Mesh(geometry, material);
    const secondMesh = new THREE.Mesh(geometry, material);
    firstMesh.name = "box-a"; secondMesh.name = "box-b";
    root.add(firstMesh, secondMesh); scene.add(root);
    const observation = createHumanObservation({
      scene, camera: new THREE.PerspectiveCamera(), roots: () => [root], clay,
      orbit: { target: new THREE.Vector3(), enableDamping: true,
        minDistance: 0, maxDistance: Infinity, update: () => undefined },
      height: () => 400,
    });
    const owned = (["normal", "depth", "flat", "wire"] as const).map((pass) => {
      observation.hooks.pass(pass);
      return observation.override(false)!;
    });
    observation.hooks.pass("outline"); observation.apply();
    const white = firstMesh.material;
    const hull = firstMesh.children[0] as THREE.Mesh;
    owned.push(white, hull.material as THREE.Material);
    TestValidator.equals("observation exposes six distinct actual pass resources", new Set(owned).size, 6);
    return { scene, root, geometry, map, material, clay, borrowedOverride,
      firstMesh, secondMesh, observation, owned, hull };
  };
  for (const fail of [false, true]) {
    const state = makeObservation();
    const events = new Map<THREE.Material, number>();
    const normalFailure = new Error("owned normal pass retirement");
    const whiteFailure = new Error("owned white pass retirement");
    let borrowedEvents = 0;
    for (const resource of [state.geometry, state.map, state.material, state.clay, state.borrowedOverride])
      resource.addEventListener("dispose", () => { borrowedEvents++; });
    let reentrantClose: Promise<void> | undefined;
    state.owned.forEach((material, index) => material.addEventListener("dispose", () => {
      events.set(material, (events.get(material) ?? 0) + 1);
      if (index === 5) reentrantClose = state.observation.close();
      if (fail && index === 0) throw normalFailure;
      if (fail && index === 4) throw whiteFailure;
    }));
    state.observation.hooks.hide(["box-b"]); state.observation.apply();
    state.scene.overrideMaterial = state.owned[0];
    const completion = state.observation.close();
    TestValidator.predicate("close restores both borrowed material identities before returning",
      state.firstMesh.material === state.material && state.secondMesh.material === state.material);
    TestValidator.predicate("close restores visibility and removes owned hull nodes synchronously",
      state.secondMesh.visible && state.firstMesh.children.length === 0 && state.secondMesh.children.length === 0);
    TestValidator.predicate("close leaves the original scene override borrowed",
      state.scene.overrideMaterial === state.borrowedOverride);
    TestValidator.predicate("repeat close shares completion before settlement", state.observation.close() === completion);
    const completed = await observed(completion);
    if (fail) {
      TestValidator.predicate("every original pass-disposal cause remains ordered",
        completed instanceof AggregateError && completed.errors.length === 2 &&
        completed.errors[0] === normalFailure && completed.errors[1] === whiteFailure);
      const repeated = await observed(state.observation.settleRetirements());
      TestValidator.predicate("settlement retains prior failed pass ownership",
        repeated instanceof AggregateError && repeated.errors[0] === normalFailure);
    } else TestValidator.equals("healthy pass retirement completes", completed, undefined);
    TestValidator.predicate("reentrant disposal sees the same completion", reentrantClose === completion);
    TestValidator.equals("all six actual pass resources attempted once", state.owned.map((material) => events.get(material)), [1, 1, 1, 1, 1, 1]);
    TestValidator.equals("geometry/source-map/clay/source material/override remain borrowed", borrowedEvents, 0);
    for (const operation of [() => state.observation.apply(), () => state.observation.override(false),
      () => state.observation.hooks.look({ position: [0, 0, 1], target: [0, 0, 0], fov: 30 }),
      () => state.observation.hooks.isolate(null), () => state.observation.hooks.hide(null),
      () => state.observation.hooks.pass("beauty")])
      TestValidator.predicate("closed observation refuses new borrowed mutations", caught(operation) instanceof Error);
    state.geometry.dispose(); state.map.dispose(); state.material.dispose();
    state.clay.dispose(); state.borrowedOverride.dispose();
  }

  const withdrawal = makeObservation();
  const removedFailure = new Error("owned hull removal listener");
  withdrawal.hull.addEventListener("removed", () => { throw removedFailure; });
  let withdrawnAttempts = 0;
  for (const material of withdrawal.owned)
    material.addEventListener("dispose", () => { withdrawnAttempts++; });
  withdrawal.observation.hooks.hide(["box-b"]); withdrawal.observation.apply();
  const withdrawnResult = await observed(withdrawal.observation.close());
  TestValidator.predicate("hull withdrawal failure retains its original cause", withdrawnResult === removedFailure);
  TestValidator.predicate("failed withdrawal still restores the neighbouring box", withdrawal.secondMesh.visible && withdrawal.secondMesh.material === withdrawal.material);
  TestValidator.equals("withdrawal failure cannot skip six independent retirements", withdrawnAttempts, 6);
  withdrawal.geometry.dispose(); withdrawal.map.dispose(); withdrawal.material.dispose();
  withdrawal.clay.dispose(); withdrawal.borrowedOverride.dispose();

  const departed = makeObservation();
  const kept = new THREE.Mesh(departed.geometry, departed.material);
  kept.name = "box-kept";
  departed.root.add(kept);
  departed.observation.apply();
  const keptOutline = kept.material;
  const secondHull = departed.secondMesh.children[0] as THREE.Mesh;
  const departureFailure = new Error("departed hull removal");
  departed.hull.addEventListener("removed", () => { throw departureFailure; });
  departed.root.remove(departed.firstMesh, departed.secondMesh);
  TestValidator.predicate("departure reports the original public hull error", caught(departed.observation.apply) === departureFailure);
  const outlinedNeighbourRestored = departed.secondMesh.material === departed.material && secondHull.parent === null;
  TestValidator.predicate("remaining subject keeps its admitted outline", kept.material === keptOutline && kept.children.length === 1);
  const departedClose = await observed(departed.observation.close());
  TestValidator.predicate("ended departed owner restores the remaining source", kept.material === departed.material);
  TestValidator.equals("completed physical hull removal is not retried at close", departedClose, undefined);
  departed.geometry.dispose(); departed.map.dispose(); departed.material.dispose();
  departed.clay.dispose(); departed.borrowedOverride.dispose();

  const hiddenDeparture = makeObservation();
  hiddenDeparture.observation.hooks.pass("beauty");
  hiddenDeparture.observation.hooks.hide(["box-a", "box-b"]);
  hiddenDeparture.observation.apply();
  hiddenDeparture.root.remove(hiddenDeparture.firstMesh, hiddenDeparture.secondMesh);
  Object.freeze(hiddenDeparture.firstMesh);
  const hiddenFailure = caught(hiddenDeparture.observation.apply);
  TestValidator.predicate("native failed visibility assignment is reported", hiddenFailure instanceof TypeError);
  const hiddenNeighbourRestored = hiddenDeparture.secondMesh.visible;
  const hiddenClose = await observed(hiddenDeparture.observation.close());
  TestValidator.predicate("failed borrowed visibility remains explicit at final close", hiddenClose instanceof TypeError);
  hiddenDeparture.geometry.dispose(); hiddenDeparture.map.dispose(); hiddenDeparture.material.dispose();
  hiddenDeparture.clay.dispose(); hiddenDeparture.borrowedOverride.dispose();
  TestValidator.equals("each failed first departure restores its independent neighbour",
    [outlinedNeighbourRestored, hiddenNeighbourRestored], [true, true]);

  for (const fail of [false, true]) {
    const shownAgain = makeObservation();
    shownAgain.observation.hooks.pass("beauty");
    shownAgain.observation.hooks.hide(["box-a"]);
    shownAgain.observation.apply();
    TestValidator.equals("the owned visibility transition starts hidden", shownAgain.firstMesh.visible, false);
    if (fail) Object.freeze(shownAgain.firstMesh);
    shownAgain.observation.hooks.hide(null);
    const visibilityResult = caught(shownAgain.observation.apply);
    const visibilityClose = await observed(shownAgain.observation.close());
    TestValidator.predicate("a refused visibility restoration remains owned at final close",
      fail ? visibilityResult instanceof TypeError && visibilityClose instanceof TypeError
        : visibilityResult === undefined && visibilityClose === undefined && shownAgain.firstMesh.visible);
    shownAgain.geometry.dispose(); shownAgain.map.dispose(); shownAgain.material.dispose();
    shownAgain.clay.dispose(); shownAgain.borrowedOverride.dispose();
  }
};
