import { measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import type { IAutoMovieTextureReference } from "@automovie/interface";
import { assessAutoMovieRenderBudget, autoMovieRenderBudgetEvidence, autoMovieRenderBudgetRefusal } from "@automovie/render";
import { AutoMovieTextureCache, applySceneEnvironment, buildMaterial, readAutoMovieTextureSource } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { compiledShotFixture } from "../internal/renderBudgetFixtures";
import { boxModel, material, sceneFixture } from "../internal/renderFixtures";
import { AutoMovieResourceRetirementScope } from "../../../../packages/viewer/src/AutoMovieResourceRetirementScope";

/**
 * Exercises cache-issued wrapper input history and its preflight accounting/admission boundary.
 *
 * Scenarios:
 * 1. Fresh source-sharing bindings retain authority and independent byte bounds; controlled copy metadata exposes incomplete or changed copies.
 * 2. Observed original/issued fixed-input or version drift becomes unknown and survives flag restoration, refusing byte/count preflight claims.
 * 3. Dirty binding reapplication and mutations during binding evaluation cannot acknowledge uncontrolled generation/version changes.
 * 4. Exclusive same-capacity environment refresh acknowledges only its successful owned tuple; changed completion, closed ownership and other-wrapper drift remain unknown.
 * 5. Source detachment, including during disposal or environment retirement, retains uncertain release and cannot skip independent owners.
 * 6. Foreign or reversed original/issued ownership refuses; genuinely new Texture/Source objects recover independent admission.
 * 7. Existing retirement scopes preserve registration identity, ordered failures, pending/reentrant settlement and close/admission ordering without claiming GPU completion.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual cache/material/environment/source observation, Engine closure, Render preflight and directly imported retirement scope; observes original causes, authority state and public disposal attempts.
 * @evidence contracts/testing.md#independent-expectations Independent 4x4 texel/mip arithmetic, authored settings, mutation schedules and original identities judge outcomes; the incomplete compiled fixture and supplied graphics strings are consumed facts, not admitted artifacts or queried hardware. Drift cases cross an actual observation boundary; a mutation fully reverted between checks is not detected or proved absent.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts normal binding, fixed/version drift, copy/binding side effects, exclusive environment transitions, detachments, foreign/live/closed ownership and pending/reentrant/failed scope settlement. The neighboring PBR unit owns failed environment-disposal recovery under the existing same-wrapper retry policy; this case adds no terminal environment contract.
 * @evidence contracts/testing.md#execution-ownership The named entry retains the existing supplied loader and retirement callbacks over real CPU Three objects, creates no renderer/new mock/driver and does not equate callback completion with native conversion or GPU release.
 */
export async function test_viewer_texture_cache_allocation_authority(): Promise<void> {
  const make: () => THREE.DataTexture = (): THREE.DataTexture => new THREE.DataTexture(new Uint8Array(64), 4, 4);
  const surface: import("@automovie/interface").IAutoMovieMaterial = material("surface", "image");
  const compiled: import("@automovie/interface").IAutoMovieCompiledShotSource = compiledShotFixture({ models: [boxModel({ id: "box", materials: [surface] })],
    scene: { ...sceneFixture(), lights: [], nodes: [{ ...sceneFixture().nodes[0], model: "box" }] } });
  const inspect: (cache: AutoMovieTextureCache) => import("../../../../packages/render/src/index").IAutoMovieRenderBudgetAssessment = (cache: AutoMovieTextureCache): import("../../../../packages/render/src/index").IAutoMovieRenderBudgetAssessment => assessAutoMovieRenderBudget({ compiled, shot: "owned-cache",
    budget: null, renderer: { api: "webgl2", vendor: "typed-unit", device: "no-gpu-unit" },
    settings: { width: 32, height: 32, pixelRatio: 1, shadows: false, shadowType: "none", toneMapping: "none", exposure: 1 },
    assets: [], textures: cache.describeSources() });
  const refusal: (assessment: ReturnType<(cache: AutoMovieTextureCache) => import("../../../../packages/render/src/index").IAutoMovieRenderBudgetAssessment>) => string | null = (assessment: ReturnType<typeof inspect>): string | null => autoMovieRenderBudgetRefusal(
    autoMovieRenderBudgetEvidence({ tier: "unit", budgets: undefined, assessments: [assessment] }));
  const outcome: (promise: Promise<void>) => Promise<unknown> = (promise: Promise<void>): Promise<unknown> => promise.then((): undefined => undefined).catch((error: unknown): unknown => error);
  const known: (texture: THREE.Texture) => boolean | undefined = (texture: THREE.Texture): boolean | undefined => readAutoMovieTextureSource("image", texture).allocationStateKnown;

  const original: THREE.DataTexture = make();
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => original);
  await cache.prime(["image", "alias"]);
  original.generateMipmaps = true;
  original.needsUpdate = true;
  TestValidator.equals("pre-issue host preparation remains supported", cache.describeSources().map((row: import("@automovie/engine").IAutoMovieRenderTextureSource) : boolean | undefined=> row.allocationStateKnown), [true, true]);
  const first: THREE.MeshPhysicalMaterial = buildMaterial(surface, cache.resolve);
  const reference: IAutoMovieTextureReference = { asset: "alias", texCoord: 1, colorSpace: "linear",
    transform: { offset: { x: 1, y: 2 }, scale: { x: 3, y: 4 }, rotationDeg: 45 },
    sampler: { wrapS: "repeat", wrapT: "mirror", minFilter: "linear", magFilter: "nearest" } };
  const second: THREE.MeshPhysicalMaterial = buildMaterial({ ...material("second"), baseColorTexture: reference }, cache.resolve);
  TestValidator.predicate("actual source sharing survives independent bindings", first.map !== second.map && first.map!.source === second.map!.source);
  TestValidator.equals("normal binding receipts retain original authority", cache.describeSources().map((row: import("@automovie/engine").IAutoMovieRenderTextureSource) : boolean | undefined=> row.allocationStateKnown), [true, true]);
  const rows: import("@automovie/interface").IAutoMovieRenderTextureCost[] = measureAutoMovieRenderTextureClosure({ materials: [surface, { ...material("second"), baseColorTexture: reference }],
    sources: cache.describeSources(), environment: null });
  TestValidator.equals("two normal native variants retain both generated chains", rows.filter((row: import("@automovie/interface").IAutoMovieRenderTextureCost) : boolean=> row.asset !== null).map((row: import("@automovie/interface").IAutoMovieRenderTextureCost) : number | null=> row.bytes), [(16 + 4 + 1) * 4, (16 + 4 + 1) * 4]);
  const supported: import("../../../../packages/render/src/index").IAutoMovieRenderBudgetAssessment = inspect(cache);
  TestValidator.equals("supported first preflight bounds source and lookup", supported.inventory!.totals.textureBytes, (16 + 4 + 1) * 4 + 16 * 16 * 2 * 2);
  original.generateMipmaps = false;
  original.needsUpdate = true;
  TestValidator.equals("issued generation did not follow mutable original", [first.map!.generateMipmaps, second.map!.generateMipmaps], [true, true]);
  const uncertain: import("../../../../packages/render/src/index").IAutoMovieRenderBudgetAssessment = inspect(cache);
  TestValidator.equals("mutable-original witness has no byte or count claim", [uncertain.inventory!.totals.textureBytes, uncertain.inventory!.totals.textures], [null, null]);
  TestValidator.predicate("normal refusal preserves actual shot and asset", refusal(uncertain)!.includes("owned-cache") && refusal(uncertain)!.includes("image"));
  original.generateMipmaps = true;
  original.needsUpdate = true;
  TestValidator.equals("restoring current flags cannot erase history", cache.describeSources().map((row: import("@automovie/engine").IAutoMovieRenderTextureSource) : boolean | undefined=> row.allocationStateKnown), [false, false]);
  TestValidator.predicate("uncertainty reseals target identity", supported.target!.textureDigest !== uncertain.target!.textureDigest);
  await cache.dispose(); first.dispose(); second.dispose();
  TestValidator.equals("closed source and wrapper cannot be fresh resident facts", [known(original), known(first.map!)], [false, false]);

  for (const behavior of ["plain", "mutation", "throw", "mutation-throw"] as const) {
    const source: THREE.DataTexture = make();
    source.generateMipmaps = true;
    source.needsUpdate = true;
    const failure: Error = new Error("native copy userData evaluation");
    source.userData = behavior === "plain" ? { description: "ordinary metadata" } : {
      get receipt(): number {
        if (behavior === "mutation" || behavior === "mutation-throw") source.generateMipmaps = false;
        if (behavior === "throw" || behavior === "mutation-throw") throw failure;
        return 1;
      },
    };
    const owner: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => source);
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
    const mutated: boolean = behavior === "mutation" || behavior === "mutation-throw";
    TestValidator.equals("baseline precedes copy's host metadata evaluation", owner.describeSources()[0].allocationStateKnown, !mutated);
    source.userData = { description: "corrected metadata" };
    source.generateMipmaps = true;
    const next: THREE.Texture<unknown, THREE.TextureEventMap> = owner.resolve("image");
    TestValidator.equals("only an unchanged source recovers a failed copy", known(next), !mutated);
    await owner.dispose();
  }

  const uncopiedSource: THREE.DataTexture = make();
  Object.assign(uncopiedSource, { wrapR: THREE.RepeatWrapping });
  const uncopiedCache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => uncopiedSource);
  await uncopiedCache.prime(["image"]);
  const uncopied: THREE.Texture<unknown, THREE.TextureEventMap> = uncopiedCache.resolve("image");
  TestValidator.equals("native copy cannot certify an input it did not preserve", [known(uncopied), uncopiedCache.describeSources()[0].allocationStateKnown], [false, false]);
  await uncopiedCache.dispose();

  const malformedSource: THREE.DataTexture = make();
  const malformedCache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => malformedSource);
  await malformedCache.prime(["image"]);
  malformedCache.resolve("image");
  const validImage: THREE.DataTextureImageData = malformedSource.image;
  Object.assign(malformedSource, { image: null });
  let extentFailure: unknown;
  try { malformedCache.describeSources(); } catch (error) { extentFailure = error; }
  TestValidator.predicate("invalid extent still observes allocation history first", extentFailure instanceof Error && extentFailure.message.includes("extent"));
  malformedSource.image = validImage;
  TestValidator.equals("restored extent does not erase the earlier observed drift", malformedCache.describeSources()[0].allocationStateKnown, false);
  await malformedCache.dispose();

  const aliasSource: THREE.DataTexture = make();
  const aliasOwner: AutoMovieTextureCache = new AutoMovieTextureCache(async (asset: string) : Promise<THREE.Texture<unknown, THREE.TextureEventMap>>=> asset === "base" ? aliasSource : ownAlias);
  await aliasOwner.prime(["base"]);
  const ownAlias: THREE.Texture = aliasOwner.resolve("base");
  TestValidator.predicate("same-cache issued wrapper cannot become a decoder original",
    await outcome(aliasOwner.prime(["issued-alias"])) instanceof Error);
  TestValidator.equals("reverse-role refusal preserves existing decoder ownership",
    aliasOwner.describeSources().map((row: import("@automovie/engine").IAutoMovieRenderTextureSource) : boolean | undefined=> row.allocationStateKnown), [true]);
  await aliasOwner.dispose();

  const hostImage: THREE.Texture<unknown, THREE.TextureEventMap> = new THREE.Texture();
  hostImage.image = { width: 4, height: 4 };
  const hostCache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.Texture<unknown, THREE.TextureEventMap>> => hostImage);
  await hostCache.prime(["image"]);
  const hostMaterial: THREE.MeshPhysicalMaterial = buildMaterial(surface, hostCache.resolve);
  TestValidator.equals("ordinary decoded extent without a data field retains authority", hostCache.describeSources()[0].allocationStateKnown, true);
  await hostCache.dispose(); hostMaterial.dispose();

  for (const target of ["original", "issued"] as const)
    for (const change of [
      (texture: THREE.Texture): void => { texture.generateMipmaps = true; },
      (texture: THREE.Texture): void => { texture.type = THREE.HalfFloatType; },
      (texture: THREE.Texture): void => { texture.format = THREE.RGFormat; },
      (texture: THREE.Texture): void => { texture.internalFormat = "RGBA16F"; },
      (texture: THREE.Texture): void => { texture.image = { data: new Uint8Array(32), width: 2, height: 4 }; },
      (texture: THREE.Texture): void => { texture.image = { data: new Uint8Array(32), width: 4, height: 2 }; },
      (texture: THREE.Texture): void => { texture.flipY = !texture.flipY; },
      (texture: THREE.Texture): void => { texture.premultiplyAlpha = true; },
      (texture: THREE.Texture): void => { texture.unpackAlignment = 8; },
      (texture: THREE.Texture): void => { texture.anisotropy = 2; },
      (texture: THREE.Texture): void => { texture.mipmaps = []; },
      (texture: THREE.Texture): void => { Object.assign(texture, { mipmaps: null }); },
      (texture: THREE.Texture): void => { texture.needsUpdate = true; },
    ]) {
      const source: THREE.DataTexture = make();
      const owner: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => source);
      await owner.prime(["image"]);
      const issued: THREE.Texture<unknown, THREE.TextureEventMap> = owner.resolve("image");
      const subject: THREE.Texture<unknown, THREE.TextureEventMap> = target === "original" ? source : issued;
      change(subject);
      TestValidator.equals("fixed-input drift cannot certify cache population", owner.describeSources()[0].allocationStateKnown, false);
      if (target === "issued") {
        const rebound: THREE.MeshPhysicalMaterial = buildMaterial(surface, (): THREE.Texture<unknown, THREE.TextureEventMap> => issued);
        TestValidator.equals("ordinary binding completion cannot repair earlier drift", known(issued), false);
        rebound.dispose();
      }
      await owner.dispose();
    }

  for (const change of ["generation", "version", "sampler", "dispose", "original"] as const) {
    const source: THREE.DataTexture = make();
    const owner: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => source);
    await owner.prime(["image"]);
    const issued: THREE.Texture<unknown, THREE.TextureEventMap> = owner.resolve("image");
    const binding: IAutoMovieTextureReference = { asset: "image", texCoord: 0, colorSpace: "srgb",
      get transform(): undefined {
        if (change === "version") issued.needsUpdate = true;
        else if (change === "generation") issued.generateMipmaps = true;
        else if (change === "sampler") issued.wrapS = THREE.RepeatWrapping;
        else if (change === "dispose") issued.dispose();
        else source.needsUpdate = true;
        return undefined;
      } };
    const built: THREE.MeshPhysicalMaterial = buildMaterial({ ...surface, baseColorTexture: binding }, (): THREE.Texture<unknown, THREE.TextureEventMap> => issued);
    TestValidator.equals("a typed binding evaluation cannot mutate fixed or version inputs unnoticed", known(issued), false);
    await owner.dispose(); built.dispose();
  }

  const skySource: THREE.DataTexture = make();
  const skyCache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => skySource);
  await skyCache.prime(["image"]);
  const sky: THREE.Texture<unknown, THREE.TextureEventMap> = skyCache.resolve("image");
  const scene: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  const environment: { image: string; background: null; intensity: number; rotationDeg: number; exposure: number; toneMapping: "none"; shadows: { enabled: boolean; type: "pcf"; }; } = { image: "image", background: null, intensity: 1, rotationDeg: 0, exposure: 1,
    toneMapping: "none" as const, shadows: { enabled: false, type: "pcf" as const } };
  applySceneEnvironment(scene, environment, sky);
  const skyVersion: number = sky.version;
  const neighbor: THREE.Texture<unknown, THREE.TextureEventMap> = skyCache.resolve("image");
  TestValidator.equals("shared Source version from another clone is harmless", [known(sky), sky.version], [true, skyVersion]);
  let skyRetirements: number = 0;
  const retirement: () => void = (): void => { skyRetirements++; };
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
  const stableRetirements: number = skyRetirements;
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("another wrapper's uncertainty does not retire a stable environment", skyRetirements, stableRetirements);
  sky.removeEventListener("dispose", retirement);
  await skyCache.dispose();
  applySceneEnvironment(scene, environment, sky);
  TestValidator.equals("a closed environment wrapper cannot be re-certified", known(sky), false);

  for (const changeCapacity of [false, true]) {
    const source: THREE.DataTexture = make();
    const owner: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => source);
    await owner.prime(["image"]);
    const sky: THREE.Texture<unknown, THREE.TextureEventMap> = owner.resolve("image");
    const mutate: () => void = (): void => { if (changeCapacity) sky.type = THREE.HalfFloatType; else sky.needsUpdate = true; };
    sky.addEventListener("dispose", mutate);
    applySceneEnvironment(new THREE.Scene(), environment, sky);
    TestValidator.equals("changed retirement completion cannot certify a new tuple", known(sky), false);
    sky.removeEventListener("dispose", mutate);
    await owner.dispose();
  }

  for (const target of ["original", "issued", "during-dispose"] as const) {
    const source: THREE.DataTexture = make();
    const owner: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => source);
    await owner.prime(["image"]);
    const issued: THREE.Texture<unknown, THREE.TextureEventMap> = owner.resolve("image");
    const previous: THREE.Texture<unknown, THREE.TextureEventMap> = target === "original" ? source : issued;
    const oldSource: THREE.TextureSource<unknown> = previous.source;
    const detach: () => void = (): void => { previous.source = new THREE.TextureSource({ data: new Uint8Array(64), width: 4, height: 4 }); };
    if (target === "during-dispose") previous.addEventListener("dispose", detach);
    else {
      detach();
      TestValidator.equals("detached identity is uncertified", known(previous), false);
      previous.source = oldSource;
      TestValidator.equals("reverting detached identity cannot erase history", known(previous), false);
    }
    let otherAttempts: number = 0;
    (target === "original" ? issued : source).addEventListener("dispose", (): void => { otherAttempts++; });
    const close: Promise<void> = owner.dispose();
    const error: unknown = await outcome(close);
    TestValidator.predicate("detached-source completion cannot claim certified release", error instanceof Error && error.message.includes("Source was detached"));
    TestValidator.equals("indeterminate source does not skip another release", otherAttempts, 1);
    TestValidator.predicate("repeated close retains indeterminate completion", owner.dispose() === close);
  }

  for (const during of [false, true]) {
    const source: THREE.DataTexture = make();
    const owner: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => source);
    await owner.prime(["image"]);
    const sky: THREE.Texture<unknown, THREE.TextureEventMap> = owner.resolve("image");
    const detach: () => void = (): void => { sky.source = new THREE.TextureSource({ data: new Uint8Array(64), width: 4, height: 4 }); };
    if (during) sky.addEventListener("dispose", detach);
    else detach();
    applySceneEnvironment(new THREE.Scene(), environment, sky);
    TestValidator.equals("environment handoff cannot erase a detached cache source", known(sky), false);
    sky.removeEventListener("dispose", detach);
    TestValidator.predicate("detached environment retains uncertain release", await outcome(owner.dispose()) instanceof Error);
  }

  const protectedSource: THREE.DataTexture = make();
  let protectedDisposals: number = 0;
  protectedSource.addEventListener("dispose", (): void => { protectedDisposals++; });
  const protectedCache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => protectedSource);
  await protectedCache.prime(["image"]);
  const protectedClone: THREE.Texture<unknown, THREE.TextureEventMap> = protectedCache.resolve("image");
  for (const offered of [protectedSource, protectedClone]) {
    const foreign: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.Texture<unknown, THREE.TextureEventMap>> => offered);
    const error: unknown = await outcome(foreign.prime(["foreign"]));
    TestValidator.predicate("another cache refuses an actual owned wrapper", error instanceof Error && error.message.includes("foreign"));
    await foreign.dispose();
  }
  TestValidator.equals("rejected foreign ownership cannot dispose its source", protectedDisposals, 0);
  await protectedCache.dispose();
  const closed: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => protectedSource);
  TestValidator.predicate("a closed wrapper is not a new cache original", await outcome(closed.prime(["closed"])) instanceof Error);
  await closed.dispose();
  const fresh: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => make());
  await fresh.prime(["image"]);
  const freshMaterial: THREE.MeshPhysicalMaterial = buildMaterial(surface, fresh.resolve);
  TestValidator.equals("new Texture and Source recover independent storage", inspect(fresh).inventory!.totals.textureBytes, 4 * 4 * 4 + 16 * 16 * 2 * 2);
  TestValidator.equals("fresh replacement recovers normal admission", refusal(inspect(fresh)), null);
  await fresh.dispose(); freshMaterial.dispose();

  const scope: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  await scope.ready();
  const ownedImage: THREE.DataTexture = make();
  let ownedAttempts: number = 0;
  ownedImage.addEventListener("dispose", (): void => { ownedAttempts++; });
  const retireOwned: () => Promise<void> = (): Promise<void> => { ownedImage.dispose(); return Promise.resolve(); };
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

  const damaged: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  const damagedImage: THREE.DataTexture = make();
  const retirementFailure: Error = new Error("retained native uncertainty");
  let damagedAttempts: number = 0;
  damagedImage.addEventListener("dispose", (): never => { damagedAttempts++; throw retirementFailure; });
  damaged.own(damagedImage, (): Promise<void> => { damagedImage.dispose(); return Promise.resolve(); });
  damaged.release(damagedImage);
  TestValidator.predicate("failed settlement reports original identity", await outcome(damaged.settle()) === retirementFailure);
  TestValidator.predicate("next allocation cannot erase failed native ownership", await outcome(damaged.ready()) === retirementFailure);
  TestValidator.equals("failed settlement never retries public retirement", damagedAttempts, 1);
  const damagedClosing: Promise<void> = damaged.close();
  TestValidator.predicate("failed close is one actual completion", damaged.close() === damagedClosing);
  TestValidator.predicate("close cannot convert uncertainty into success", await outcome(damagedClosing) === retirementFailure);

  const concurrentScope: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  let finishFirst!: () => void;
  const firstPending: Promise<undefined> = new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => { finishFirst = (): void => resolve(undefined); });
  let laterAttempts: number = 0;
  concurrentScope.track((): Promise<undefined> => firstPending);
  const settling: Promise<void> = concurrentScope.settle();
  concurrentScope.track((): Promise<void> => { laterAttempts++; return Promise.resolve(); });
  finishFirst();
  await settling;
  TestValidator.equals("settlement includes owners added while it waited", laterAttempts, 1);
  await concurrentScope.ready();

  const interrupted: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  let finishPreparation!: () => void;
  const preparationRetirement: Promise<undefined> = new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => { finishPreparation = (): void => resolve(undefined); });
  const stagedImage: THREE.DataTexture = make();
  let stagedAttempts: number = 0;
  stagedImage.addEventListener("dispose", (): void => { stagedAttempts++; });
  interrupted.own(stagedImage, async (): Promise<void> => { await preparationRetirement; stagedImage.dispose(); });
  const closing: Promise<void> = interrupted.close();
  TestValidator.predicate("pending close keeps its original completion", interrupted.close() === closing);
  TestValidator.equals("pending owner has not yet disposed its texture", stagedAttempts, 0);
  let refusedClosedOwner: boolean = false;
  try { interrupted.own(make(), (): Promise<void> => Promise.resolve()); } catch { refusedClosedOwner = true; }
  TestValidator.equals("closed owner refuses new resource registration", refusedClosedOwner, true);
  TestValidator.predicate("closed owner refuses next preparation", await outcome(interrupted.ready()) instanceof Error);
  finishPreparation();
  await closing;
  TestValidator.equals("close waits for actual staged resource completion", stagedAttempts, 1);

  const closedDuringAdmission: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  let finishAdmission!: () => void;
  const admissionPending: Promise<undefined> = new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => { finishAdmission = (): void => resolve(undefined); });
  closedDuringAdmission.track((): Promise<undefined> => admissionPending);
  const admission: Promise<void> = closedDuringAdmission.ready();
  const admissionClose: Promise<void> = closedDuringAdmission.close();
  finishAdmission();
  TestValidator.predicate("closure while waiting cannot admit a late cache", await outcome(admission) instanceof Error);
  await admissionClose;

  const reentrantScope: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  const firstOwner: {} = {};
  const nextOwner: {} = {};
  let reentrantLater: number = 0;
  reentrantScope.own(firstOwner, async (): Promise<void> => {
    reentrantScope.own(nextOwner, (): Promise<void> => { reentrantLater++; return Promise.resolve(); });
    reentrantScope.release(nextOwner);
  });
  reentrantScope.release(firstOwner);
  await reentrantScope.settle();
  TestValidator.equals("reentrant owner registration remains inside completion", reentrantLater, 1);

  const emptyAdmissionScope: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  let finishEmptyAdmission!: () => void;
  const addedAfterEmpty: Promise<undefined> = new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => { finishEmptyAdmission = (): void => resolve(undefined); });
  let observeAddedRetirement!: () => void;
  const addedRetirementStarted: Promise<undefined> = new Promise<undefined>((resolve: (value: PromiseLike<undefined> | undefined) => void): void => { observeAddedRetirement = (): void => resolve(undefined); });
  const initiallyEmptyAdmission: Promise<void> = emptyAdmissionScope.ready();
  emptyAdmissionScope.track((): Promise<undefined> => { observeAddedRetirement(); return addedAfterEmpty; });
  let admittedEmpty: boolean = false;
  const admittedObservation: Promise<void> = initiallyEmptyAdmission.then((): void => { admittedEmpty = true; });
  await addedRetirementStarted;
  TestValidator.equals("empty settlement cannot admit over a newly pending retirement", admittedEmpty, false);
  finishEmptyAdmission();
  await admittedObservation;
  TestValidator.equals("empty admission includes the actual new completion", admittedEmpty, true);

  const severalFailures: AutoMovieResourceRetirementScope = new AutoMovieResourceRetirementScope();
  const laterScopeFailure: Error = new Error("later owner failure");
  const failedScopeImage: THREE.DataTexture = make();
  const laterFailedImage: THREE.DataTexture = make();
  const healthyScopeImage: THREE.DataTexture = make();
  const scopeAttempts: string[] = [];
  failedScopeImage.addEventListener("dispose", (): never => { scopeAttempts.push("first"); throw retirementFailure; });
  laterFailedImage.addEventListener("dispose", (): never => { scopeAttempts.push("second"); throw laterScopeFailure; });
  healthyScopeImage.addEventListener("dispose", (): void => { scopeAttempts.push("healthy"); });
  for (const image of [failedScopeImage, laterFailedImage, healthyScopeImage]) {
    severalFailures.own(image, (): Promise<void> => { image.dispose(); return Promise.resolve(); });
    severalFailures.release(image);
  }
  const severalOutcome: unknown = await outcome(severalFailures.settle());
  TestValidator.predicate("scope retains every failed owner in request order",
    severalOutcome instanceof AggregateError && severalOutcome.errors.length === 2 &&
    severalOutcome.errors[0] === retirementFailure && severalOutcome.errors[1] === laterScopeFailure);
  const severalRepeated: unknown = await outcome(severalFailures.ready());
  TestValidator.predicate("later admission preserves the same ordered failure values",
    severalRepeated instanceof AggregateError && severalRepeated.errors[0] === retirementFailure &&
    severalRepeated.errors[1] === laterScopeFailure);
  TestValidator.equals("failed owners never skip their healthy neighbour or retry", scopeAttempts,
    ["first", "second", "healthy"]);
}
