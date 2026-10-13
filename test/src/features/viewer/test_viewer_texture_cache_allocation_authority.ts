import { measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { AutoMovieTextureCache, applySceneEnvironment, buildMaterial, readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import path from "node:path";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";
import { loadSourceModule } from "../internal/loadSourceModule";

const { AutoMovieResourceRetirementScope } = loadSourceModule<{
  AutoMovieResourceRetirementScope: new () => {
    requireOpen: () => void;
    ready: () => Promise<void>;
    own: (resource: object, retire: () => Promise<void>) => void;
    release: (resource: object) => void;
    track: (retire: () => Promise<void>) => void;
    settle: () => Promise<void>;
    close: () => Promise<void>;
  };
}>(path.resolve(__dirname, "../../../../packages/viewer/src/AutoMovieResourceRetirementScope.ts"));

/**
 * A mutable original cannot certify previously issued wrappers. Actual creation
 * tuples and owning completion distinguish supported binding writes from stale
 * fixed inputs; disposal is an attempt, not proof of a detached allocation's end.
 *
 * Scenarios:
 * 1. Fresh preparation, source aliases and ordinary sampler/color/UV binding
 *    writes preserve sharing and independent 64/84-byte image calculations.
 * 2. Original and issued fixed-input/version changes remain unknown after
 *    reversal, and normal preflight refuses both totals with its source identity.
 * 3. Dirty binding reapplication and mutations during typed binding evaluation
 *    cannot acknowledge generation or an unexpected upload-version increment.
 * 4. Same-capacity exclusive environment retirement recovers its own wrapper,
 *    while failed/extra-version/changed-capacity completion remains uncertified.
 * 5. Source detachment, including during disposal, retains indeterminate release;
 *    native listener errors preserve identity and all owned attempts still occur.
 * 6. Another live/closed cache's actual original or issued wrapper cannot be
 *    adopted or disposed; a genuinely fresh replacement recovers admission.
 * 7. A generic retirement scope admits open allocation, observes pending and
 *    reentrant retirement, retains failed ownership and closes once without
 *    certifying a new cache in a damaged or closed owner.
 */
export const test_viewer_texture_cache_allocation_authority = async (): Promise<void> => {
  const make = () => new THREE.DataTexture(new Uint8Array(64), 4, 4);
  const surface = material("surface", "image");
  const compiled = compiledShotFixture({ models: [boxModel({ id: "box", materials: [surface] })],
    scene: { ...sceneFixture(), lights: [], nodes: [{ ...sceneFixture().nodes[0], model: "box" }] } });
  const inspect = (cache: AutoMovieTextureCache) => assessAutoMovieRenderBudget({ compiled, shot: "owned-cache",
    budget: null, renderer: { api: "webgl2", vendor: "typed-unit", device: "no-gpu-unit" },
    settings: { width: 32, height: 32, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: cache.describeSources() });
  const refusal = (assessment: ReturnType<typeof inspect>) => autoMovieRenderBudgetRefusal(
    autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [assessment] }));
  const outcome = (promise: Promise<void>) => promise.then(() => undefined).catch((error: unknown) => error);
  const known = (texture: THREE.Texture) => readAutoMovieTextureSource("image", texture).allocationStateKnown;

  const original = make();
  const cache = new AutoMovieTextureCache(async () => original);
  await cache.prime(["image", "alias"]);
  original.generateMipmaps = true;
  original.needsUpdate = true;
  TestValidator.equals("pre-issue host preparation remains supported", cache.describeSources().map(row => row.allocationStateKnown), [true, true]);
  const first = buildMaterial(surface, cache.resolve);
  const reference: IAutoMovieTextureReference = { asset: "alias", texCoord: 1, colorSpace: "linear",
    transform: { offset: { x: 1, y: 2 }, scale: { x: 3, y: 4 }, rotationDeg: 45 },
    sampler: { wrapS: "repeat", wrapT: "mirror", minFilter: "linear", magFilter: "nearest" } };
  const second = buildMaterial({ ...material("second"), baseColorTexture: reference }, cache.resolve);
  TestValidator.predicate("actual source sharing survives independent bindings", first.map !== second.map && first.map!.source === second.map!.source);
  TestValidator.equals("normal binding receipts retain original authority", cache.describeSources().map(row => row.allocationStateKnown), [true, true]);
  const rows = measureAutoMovieRenderTextureClosure({ materials: [surface, { ...material("second"), baseColorTexture: reference }],
    sources: cache.describeSources(), environment: null });
  TestValidator.equals("two normal native variants retain both generated chains", rows.filter(row => row.asset !== null).map(row => row.bytes), [(16 + 4 + 1) * 4, (16 + 4 + 1) * 4]);
  const supported = inspect(cache);
  TestValidator.equals("supported first preflight bounds source and lookup", supported.inventory!.totals.textureBytes, (16 + 4 + 1) * 4 + 16 * 16 * 2 * 2);
  original.generateMipmaps = false;
  original.needsUpdate = true;
  TestValidator.equals("issued generation did not follow mutable original", [first.map!.generateMipmaps, second.map!.generateMipmaps], [true, true]);
  const uncertain = inspect(cache);
  TestValidator.equals("mutable-original witness has no byte or count claim", [uncertain.inventory!.totals.textureBytes, uncertain.inventory!.totals.textures], [null, null]);
  TestValidator.predicate("normal refusal preserves actual shot and asset", refusal(uncertain)!.includes("owned-cache") && refusal(uncertain)!.includes("image"));
  original.generateMipmaps = true;
  original.needsUpdate = true;
  TestValidator.equals("restoring current flags cannot erase history", cache.describeSources().map(row => row.allocationStateKnown), [false, false]);
  TestValidator.predicate("uncertainty reseals target identity", supported.target!.textureDigest !== uncertain.target!.textureDigest);
  await cache.dispose(); first.dispose(); second.dispose();
  TestValidator.equals("closed source and wrapper cannot be fresh resident facts", [known(original), known(first.map!)], [false, false]);

  for (const behavior of ["plain", "mutation", "throw", "mutation-throw"] as const) {
    const source = make();
    source.generateMipmaps = true;
    source.needsUpdate = true;
    const failure = new Error("native copy userData evaluation");
    source.userData = behavior === "plain" ? { description: "ordinary metadata" } : {
      get receipt() {
        if (behavior === "mutation" || behavior === "mutation-throw") source.generateMipmaps = false;
        if (behavior === "throw" || behavior === "mutation-throw") throw failure;
        return 1;
      },
    };
    const owner = new AutoMovieTextureCache(async () => source);
    await owner.prime(["image"]);
    let issued: THREE.Texture | undefined;
    let caught: unknown;
    try { issued = owner.resolve("image"); } catch (error) { caught = error; }
    if (behavior === "throw" || behavior === "mutation-throw")
      TestValidator.predicate("copy failure retains original userData Error", caught === failure);
    else {
      TestValidator.equals("copy retained the earlier generated policy", issued!.generateMipmaps, true);
      TestValidator.equals("actual copied wrapper obeys its creation receipt", known(issued!), behavior === "plain");
    }
    const mutated = behavior === "mutation" || behavior === "mutation-throw";
    TestValidator.equals("baseline precedes copy's host metadata evaluation", owner.describeSources()[0].allocationStateKnown, !mutated);
    source.userData = { description: "corrected metadata" };
    source.generateMipmaps = true;
    const next = owner.resolve("image");
    TestValidator.equals("only an unchanged source recovers a failed copy", known(next), !mutated);
    await owner.dispose();
  }

  const uncopiedSource = make();
  Object.assign(uncopiedSource, { wrapR: THREE.RepeatWrapping });
  const uncopiedCache = new AutoMovieTextureCache(async () => uncopiedSource);
  await uncopiedCache.prime(["image"]);
  const uncopied = uncopiedCache.resolve("image");
  TestValidator.equals("native copy cannot certify an input it did not preserve", [known(uncopied), uncopiedCache.describeSources()[0].allocationStateKnown], [false, false]);
  await uncopiedCache.dispose();

  const malformedSource = make();
  const malformedCache = new AutoMovieTextureCache(async () => malformedSource);
  await malformedCache.prime(["image"]);
  malformedCache.resolve("image");
  const validImage = malformedSource.image;
  Object.assign(malformedSource, { image: null });
  let extentFailure: unknown;
  try { malformedCache.describeSources(); } catch (error) { extentFailure = error; }
  TestValidator.predicate("invalid extent still observes allocation history first", extentFailure instanceof Error && extentFailure.message.includes("extent"));
  malformedSource.image = validImage;
  TestValidator.equals("restored extent does not erase the earlier observed drift", malformedCache.describeSources()[0].allocationStateKnown, false);
  await malformedCache.dispose();

  const aliasSource = make();
  const aliasOwner: AutoMovieTextureCache = new AutoMovieTextureCache(async asset => asset === "base" ? aliasSource : ownAlias);
  await aliasOwner.prime(["base"]);
  const ownAlias: THREE.Texture = aliasOwner.resolve("base");
  TestValidator.predicate("same-cache issued wrapper cannot become a decoder original",
    await outcome(aliasOwner.prime(["issued-alias"])) instanceof Error);
  TestValidator.equals("reverse-role refusal preserves existing decoder ownership",
    aliasOwner.describeSources().map(row => row.allocationStateKnown), [true]);
  await aliasOwner.dispose();

  const hostImage = new THREE.Texture();
  hostImage.image = { width: 4, height: 4 };
  const hostCache = new AutoMovieTextureCache(async () => hostImage);
  await hostCache.prime(["image"]);
  const hostMaterial = buildMaterial(surface, hostCache.resolve);
  TestValidator.equals("ordinary decoded extent without a data field retains authority", hostCache.describeSources()[0].allocationStateKnown, true);
  await hostCache.dispose(); hostMaterial.dispose();

  for (const target of ["original", "issued"] as const)
    for (const change of [
      (texture: THREE.Texture) => { texture.generateMipmaps = true; },
      (texture: THREE.Texture) => { texture.type = THREE.HalfFloatType; },
      (texture: THREE.Texture) => { texture.format = THREE.RGFormat; },
      (texture: THREE.Texture) => { texture.internalFormat = "RGBA16F"; },
      (texture: THREE.Texture) => { texture.image = { data: new Uint8Array(32), width: 2, height: 4 }; },
      (texture: THREE.Texture) => { texture.image = { data: new Uint8Array(32), width: 4, height: 2 }; },
      (texture: THREE.Texture) => { texture.flipY = !texture.flipY; },
      (texture: THREE.Texture) => { texture.premultiplyAlpha = true; },
      (texture: THREE.Texture) => { texture.unpackAlignment = 8; },
      (texture: THREE.Texture) => { texture.anisotropy = 2; },
      (texture: THREE.Texture) => { texture.mipmaps = []; },
      (texture: THREE.Texture) => { Object.assign(texture, { mipmaps: null }); },
      (texture: THREE.Texture) => { texture.needsUpdate = true; },
    ]) {
      const source = make();
      const owner = new AutoMovieTextureCache(async () => source);
      await owner.prime(["image"]);
      const issued = owner.resolve("image");
      const subject = target === "original" ? source : issued;
      change(subject);
      TestValidator.equals("fixed-input drift cannot certify cache population", owner.describeSources()[0].allocationStateKnown, false);
      if (target === "issued") {
        const rebound = buildMaterial(surface, () => issued);
        TestValidator.equals("ordinary binding completion cannot repair earlier drift", known(issued), false);
        rebound.dispose();
      }
      await owner.dispose();
    }

  for (const change of ["generation", "version", "sampler", "dispose", "original"] as const) {
    const source = make();
    const owner = new AutoMovieTextureCache(async () => source);
    await owner.prime(["image"]);
    const issued = owner.resolve("image");
    const binding: IAutoMovieTextureReference = { asset: "image", texCoord: 0, colorSpace: "srgb",
      get transform() {
        if (change === "version") issued.needsUpdate = true;
        else if (change === "generation") issued.generateMipmaps = true;
        else if (change === "sampler") issued.wrapS = THREE.RepeatWrapping;
        else if (change === "dispose") issued.dispose();
        else source.needsUpdate = true;
        return undefined;
      } };
    const built = buildMaterial({ ...surface, baseColorTexture: binding }, () => issued);
    TestValidator.equals("a typed binding evaluation cannot mutate fixed or version inputs unnoticed", known(issued), false);
    await owner.dispose(); built.dispose();
  }

  const skySource = make();
  const skyCache = new AutoMovieTextureCache(async () => skySource);
  await skyCache.prime(["image"]);
  const sky = skyCache.resolve("image");
  const scene = new THREE.Scene();
  const environment = { image: "image", background: null, intensity: 1, rotationDeg: 0, exposure: 1,
    toneMapping: "none" as const, shadows: { enabled: false, type: "pcf" as const } };
  applySceneEnvironment(scene, environment, sky);
  const skyVersion = sky.version;
  const neighbor = skyCache.resolve("image");
  TestValidator.equals("shared Source version from another clone is harmless", [known(sky), sky.version], [true, skyVersion]);
  let skyRetirements = 0;
  const retirement = () => { skyRetirements++; };
  sky.addEventListener("dispose", retirement);
  sky.generateMipmaps = true;
  TestValidator.equals("changed environment history is observed", known(sky), false);
  sky.generateMipmaps = false;
  TestValidator.equals("restored environment flags cannot erase observed history", known(sky), false);
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("owning retirement recovers the restored tuple", [known(sky), skyRetirements], [true, 1]);
  sky.generateMipmaps = true;
  TestValidator.equals("changed owned environment stays unknown before retirement", known(sky), false);
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("successful exclusive refresh acknowledges only its own tuple", [known(sky), skyCache.describeSources()[0].allocationStateKnown], [true, true]);
  neighbor.generateMipmaps = true;
  TestValidator.equals("another issued drift remains independent", skyCache.describeSources()[0].allocationStateKnown, false);
  sky.generateMipmaps = false;
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("environment refresh cannot repair another issued wrapper", [known(sky), skyCache.describeSources()[0].allocationStateKnown], [true, false]);
  const stableRetirements = skyRetirements;
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("another wrapper's uncertainty does not retire a stable environment", skyRetirements, stableRetirements);
  sky.removeEventListener("dispose", retirement);
  await skyCache.dispose();
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("a closed environment wrapper cannot be re-certified", known(sky), false);

  for (const changeCapacity of [false, true]) {
    const source = make();
    const owner = new AutoMovieTextureCache(async () => source);
    await owner.prime(["image"]);
    const sky = owner.resolve("image");
    const mutate = () => { if (changeCapacity) sky.type = THREE.HalfFloatType; else sky.needsUpdate = true; };
    sky.addEventListener("dispose", mutate);
    applySceneEnvironment(new THREE.Scene(), environment, sky);
    TestValidator.equals("changed retirement completion cannot certify a new tuple", known(sky), false);
    sky.removeEventListener("dispose", mutate);
    await owner.dispose();
  }

  for (const target of ["original", "issued", "during-dispose"] as const) {
    const source = make();
    const owner = new AutoMovieTextureCache(async () => source);
    await owner.prime(["image"]);
    const issued = owner.resolve("image");
    const previous = target === "original" ? source : issued;
    const oldSource = previous.source;
    const detach = () => { previous.source = new THREE.TextureSource({ data: new Uint8Array(64), width: 4, height: 4 }); };
    if (target === "during-dispose") previous.addEventListener("dispose", detach);
    else {
      detach();
      TestValidator.equals("detached identity is uncertified", known(previous), false);
      previous.source = oldSource;
      TestValidator.equals("reverting detached identity cannot erase history", known(previous), false);
    }
    let otherAttempts = 0;
    (target === "original" ? issued : source).addEventListener("dispose", () => { otherAttempts++; });
    const close = owner.dispose();
    const error = await outcome(close);
    TestValidator.predicate("detached-source completion cannot claim certified release", error instanceof Error && error.message.includes("Source was detached"));
    TestValidator.equals("indeterminate source does not skip another release", otherAttempts, 1);
    TestValidator.predicate("repeated close retains indeterminate completion", owner.dispose() === close);
  }

  for (const during of [false, true]) {
    const source = make();
    const owner = new AutoMovieTextureCache(async () => source);
    await owner.prime(["image"]);
    const sky = owner.resolve("image");
    const detach = () => { sky.source = new THREE.TextureSource({ data: new Uint8Array(64), width: 4, height: 4 }); };
    if (during) sky.addEventListener("dispose", detach);
    else detach();
    applySceneEnvironment(new THREE.Scene(), environment, sky);
    TestValidator.equals("environment handoff cannot erase a detached cache source", known(sky), false);
    sky.removeEventListener("dispose", detach);
    TestValidator.predicate("detached environment retains uncertain release", await outcome(owner.dispose()) instanceof Error);
  }

  const protectedSource = make();
  let protectedDisposals = 0;
  protectedSource.addEventListener("dispose", () => { protectedDisposals++; });
  const protectedCache = new AutoMovieTextureCache(async () => protectedSource);
  await protectedCache.prime(["image"]);
  const protectedClone = protectedCache.resolve("image");
  for (const offered of [protectedSource, protectedClone]) {
    const foreign = new AutoMovieTextureCache(async () => offered);
    const error = await outcome(foreign.prime(["foreign"]));
    TestValidator.predicate("another cache refuses an actual owned wrapper", error instanceof Error && error.message.includes("foreign"));
    await foreign.dispose();
  }
  TestValidator.equals("rejected foreign ownership cannot dispose its source", protectedDisposals, 0);
  await protectedCache.dispose();
  const closed = new AutoMovieTextureCache(async () => protectedSource);
  TestValidator.predicate("a closed wrapper is not a new cache original", await outcome(closed.prime(["closed"])) instanceof Error);
  await closed.dispose();
  const fresh = new AutoMovieTextureCache(async () => make());
  await fresh.prime(["image"]);
  const freshMaterial = buildMaterial(surface, fresh.resolve);
  TestValidator.equals("new Texture and Source recover independent storage", inspect(fresh).inventory!.totals.textureBytes, 4 * 4 * 4 + 16 * 16 * 2 * 2);
  TestValidator.equals("fresh replacement recovers normal admission", refusal(inspect(fresh)), null);
  await fresh.dispose(); freshMaterial.dispose();

  const scope = new AutoMovieResourceRetirementScope();
  await scope.ready();
  const ownedImage = make();
  let ownedAttempts = 0;
  ownedImage.addEventListener("dispose", () => { ownedAttempts++; });
  const retireOwned = () => { ownedImage.dispose(); return Promise.resolve(); };
  scope.own(ownedImage, retireOwned);
  let duplicateOwnership: unknown;
  try { scope.own(ownedImage, retireOwned); } catch (error) { duplicateOwnership = error; }
  TestValidator.predicate("duplicate registration cannot replace an existing owner", duplicateOwnership instanceof Error);
  scope.release(ownedImage);
  scope.release(ownedImage);
  scope.track(retireOwned);
  await scope.settle();
  await scope.ready();
  TestValidator.equals("one identity has one actual retirement attempt", ownedAttempts, 1);

  const damaged = new AutoMovieResourceRetirementScope();
  const damagedImage = make();
  const retirementFailure = new Error("retained native uncertainty");
  let damagedAttempts = 0;
  damagedImage.addEventListener("dispose", () => { damagedAttempts++; throw retirementFailure; });
  damaged.own(damagedImage, () => { damagedImage.dispose(); return Promise.resolve(); });
  damaged.release(damagedImage);
  TestValidator.predicate("failed settlement reports original identity", await outcome(damaged.settle()) === retirementFailure);
  TestValidator.predicate("next allocation cannot erase failed native ownership", await outcome(damaged.ready()) === retirementFailure);
  TestValidator.equals("failed settlement never retries public retirement", damagedAttempts, 1);
  const damagedClosing = damaged.close();
  TestValidator.predicate("failed close is one actual completion", damaged.close() === damagedClosing);
  TestValidator.predicate("close cannot convert uncertainty into success", await outcome(damagedClosing) === retirementFailure);

  const concurrentScope = new AutoMovieResourceRetirementScope();
  let finishFirst!: () => void;
  const firstPending = new Promise<undefined>((resolve) => { finishFirst = () => resolve(undefined); });
  let laterAttempts = 0;
  concurrentScope.track(() => firstPending);
  const settling = concurrentScope.settle();
  concurrentScope.track(() => { laterAttempts++; return Promise.resolve(); });
  finishFirst();
  await settling;
  TestValidator.equals("settlement includes owners added while it waited", laterAttempts, 1);
  await concurrentScope.ready();

  const interrupted = new AutoMovieResourceRetirementScope();
  let finishPreparation!: () => void;
  const preparationRetirement = new Promise<undefined>((resolve) => { finishPreparation = () => resolve(undefined); });
  const stagedImage = make();
  let stagedAttempts = 0;
  stagedImage.addEventListener("dispose", () => { stagedAttempts++; });
  interrupted.own(stagedImage, async () => { await preparationRetirement; stagedImage.dispose(); });
  const closing = interrupted.close();
  TestValidator.predicate("pending close keeps its original completion", interrupted.close() === closing);
  TestValidator.equals("pending owner has not yet disposed its texture", stagedAttempts, 0);
  let refusedClosedOwner = false;
  try { interrupted.own(make(), () => Promise.resolve()); } catch { refusedClosedOwner = true; }
  TestValidator.equals("closed owner refuses new resource registration", refusedClosedOwner, true);
  TestValidator.predicate("closed owner refuses next preparation", await outcome(interrupted.ready()) instanceof Error);
  finishPreparation();
  await closing;
  TestValidator.equals("close waits for actual staged resource completion", stagedAttempts, 1);

  const closedDuringAdmission = new AutoMovieResourceRetirementScope();
  let finishAdmission!: () => void;
  const admissionPending = new Promise<undefined>((resolve) => { finishAdmission = () => resolve(undefined); });
  closedDuringAdmission.track(() => admissionPending);
  const admission = closedDuringAdmission.ready();
  const admissionClose = closedDuringAdmission.close();
  finishAdmission();
  TestValidator.predicate("closure while waiting cannot admit a late cache", await outcome(admission) instanceof Error);
  await admissionClose;

  const reentrantScope = new AutoMovieResourceRetirementScope();
  const firstOwner = {};
  const nextOwner = {};
  let reentrantLater = 0;
  reentrantScope.own(firstOwner, async () => {
    reentrantScope.own(nextOwner, () => { reentrantLater++; return Promise.resolve(); });
    reentrantScope.release(nextOwner);
  });
  reentrantScope.release(firstOwner);
  await reentrantScope.settle();
  TestValidator.equals("reentrant owner registration remains inside completion", reentrantLater, 1);

  const emptyAdmissionScope = new AutoMovieResourceRetirementScope();
  let finishEmptyAdmission!: () => void;
  const addedAfterEmpty = new Promise<undefined>((resolve) => { finishEmptyAdmission = () => resolve(undefined); });
  let observeAddedRetirement!: () => void;
  const addedRetirementStarted = new Promise<undefined>((resolve) => { observeAddedRetirement = () => resolve(undefined); });
  const initiallyEmptyAdmission = emptyAdmissionScope.ready();
  emptyAdmissionScope.track(() => { observeAddedRetirement(); return addedAfterEmpty; });
  let admittedEmpty = false;
  const admittedObservation = initiallyEmptyAdmission.then(() => { admittedEmpty = true; });
  await addedRetirementStarted;
  TestValidator.equals("empty settlement cannot admit over a newly pending retirement", admittedEmpty, false);
  finishEmptyAdmission();
  await admittedObservation;
  TestValidator.equals("empty admission includes the actual new completion", admittedEmpty, true);

  const severalFailures = new AutoMovieResourceRetirementScope();
  const laterScopeFailure = new Error("later owner failure");
  const failedScopeImage = make();
  const laterFailedImage = make();
  const healthyScopeImage = make();
  const scopeAttempts: string[] = [];
  failedScopeImage.addEventListener("dispose", () => { scopeAttempts.push("first"); throw retirementFailure; });
  laterFailedImage.addEventListener("dispose", () => { scopeAttempts.push("second"); throw laterScopeFailure; });
  healthyScopeImage.addEventListener("dispose", () => { scopeAttempts.push("healthy"); });
  for (const image of [failedScopeImage, laterFailedImage, healthyScopeImage]) {
    severalFailures.own(image, () => { image.dispose(); return Promise.resolve(); });
    severalFailures.release(image);
  }
  const severalOutcome = await outcome(severalFailures.settle());
  TestValidator.predicate("scope retains every failed owner in request order",
    severalOutcome instanceof AggregateError && severalOutcome.errors.length === 2 &&
    severalOutcome.errors[0] === retirementFailure && severalOutcome.errors[1] === laterScopeFailure);
  const severalRepeated = await outcome(severalFailures.ready());
  TestValidator.predicate("later admission preserves the same ordered failure values",
    severalRepeated instanceof AggregateError && severalRepeated.errors[0] === retirementFailure &&
    severalRepeated.errors[1] === laterScopeFailure);
  TestValidator.equals("failed owners never skip their healthy neighbour or retry", scopeAttempts,
    ["first", "second", "healthy"]);
};
