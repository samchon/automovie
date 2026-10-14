import type { IAutoMovieMaterial, IAutoMovieModel } from "@automovie/interface";
import { addMaterialShaderPatch, AutoMovieTextureCache, buildGeometry, buildMaterial, buildModel, type IAutoMovieModelObject, type IMaterialOverlayShading } from "@automovie/viewer";
import { createHumanObservationAlbedoPass } from "../../../../packages/viewer/src/human/common/observation/createHumanObservationAlbedoPass";
import { createHumanObservationAlbedoMaterial } from "../../../../packages/viewer/src/human/common/observation/createHumanObservationAlbedoMaterial";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import { constructAutoMovieOwnedResources } from "../../../../packages/viewer/src/constructAutoMovieOwnedResources";
import { boxModel, material as materialDefinition } from "../internal/renderFixtures";

/**
 * A generic box's temporary unlit projection owns its replacement materials, restores borrowed assignments independently and retains failed retirement. Reentrant close prevents publishing a new replacement after withdrawal. Public material events count attempts, not physical GPU allocations.
 *
 * Scenarios:
 * 1. Scalar, array, empty and duplicate populations reuse replacements; departed/cleared replacements retire once and sources remain borrowed.
 * 2. A first disposal failure still restores other sources and attempts its healthy neighbour; clear, settlement and close retain the original error without retry.
 * 3. Reentrant application refuses during retirement; reentrant close shares completion and withdraws pending publication.
 * 4. Frozen assignment throws the native TypeError while other restorations and replacement retirement still run.
 * 5. Supported materials preserve source state; unsupported hooks, missing overlay records and frozen setup refuse without replacing source userData.
 * 6. Producer initialization registers geometry, material and skeleton before a later failure; rollback attempts distinct resources independently and successful transfer leaves their lifetime with the caller.
 *
 * @evidence contracts/testing.md#behavioral-verification Exercises the existing generic-mesh albedo owner and actual material/model producers with real dispose listeners, frozen native fields and supported public shader registration; catches lost borrowed assignments, skipped independent retirement, repeated failed disposal and partial producer rollback.
 * @evidence contracts/testing.md#independent-expectations Original source identities, one event per distinct owned replacement and initialization-before-cleanup cause order are independent observations; actual SDK assignment failures supply refusal causes. Disposal events count public attempts and do not establish physical GPU release.
 * @evidence contracts/testing.md#distinguishing-cases Preserves scalar/array/empty/duplicate populations, departure, clear/repeat/failure/reentry, frozen setup and restoration, supported material families, unsupported shader metadata, partial producer acquisition, transfer and cache-copy failure; no new Human figure or lifecycle driver is introduced.
 * @evidence contracts/testing.md#execution-ownership The existing asynchronous unit imports maintained source directly, uses the pre-existing generic Three mesh/observation seam and owns its local resources; it launches no native renderer, browser, worker or process and registers no dynamic tests.
 */
export async function test_viewer_material_projection_retirement(): Promise<void> {
  const caught: (operation: () => void) => unknown = (operation: () => void): unknown => {
    try { operation(); return undefined; } catch (error) { return error; }
  };
  const outcome: (completion: Promise<void>) => Promise<unknown> = (completion: Promise<void>): Promise<unknown> => completion
    .then((): undefined => undefined).catch((error: unknown): unknown => error);
  const geometry: THREE.BoxGeometry = new THREE.BoxGeometry();
  const image: THREE.DataTexture = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const firstSource: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ map: image });
  const nextSource: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  let borrowedDisposals: number = 0;
  for (const resource of [geometry, image, firstSource, nextSource])
    resource.addEventListener("dispose", (): void => { borrowedDisposals++; });

  const arraySource: THREE.MeshStandardMaterial[] = [firstSource, nextSource];
  const arrayMesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material[], THREE.Object3DEventMap> = new THREE.Mesh(geometry, arraySource);
  const scalarMesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, firstSource);
  const emptyMesh: THREE.Mesh<THREE.BoxGeometry, never[], THREE.Object3DEventMap> = new THREE.Mesh(geometry, []);
  const healthy: ReturnType<typeof createHumanObservationAlbedoPass> = createHumanObservationAlbedoPass();
  healthy.apply([arrayMesh, scalarMesh, emptyMesh, arrayMesh]);
  const arrayDisplay: THREE.Material[] = arrayMesh.material;
  const scalarDisplay: THREE.Material = scalarMesh.material;
  TestValidator.predicate("array material shape has distinct owned projections",
    arrayDisplay !== arraySource && arrayDisplay.length === 2 && arrayDisplay[0] !== firstSource);
  TestValidator.predicate("scalar projection borrows its actual source image", scalarDisplay instanceof THREE.MeshBasicMaterial && scalarDisplay.map === image);
  TestValidator.equals("empty material population stays empty", emptyMesh.material.length, 0);
  healthy.apply([arrayMesh, scalarMesh, emptyMesh]);
  TestValidator.predicate("same admitted population reuses replacement identity",
    arrayMesh.material === arrayDisplay && scalarMesh.material === scalarDisplay);
  const healthyAttempts: THREE.Material[] = [];
  for (const material of [...arrayDisplay, scalarDisplay])
    material.addEventListener("dispose", (): void => { healthyAttempts.push(material); });
  healthy.apply([scalarMesh, emptyMesh]);
  TestValidator.predicate("departed mesh immediately restores its source array", arrayMesh.material === arraySource);
  TestValidator.equals("only departed array replacements retire", healthyAttempts.length, 2);
  healthy.clear(); healthy.clear();
  TestValidator.predicate("clear restores scalar source identity", scalarMesh.material === firstSource);
  TestValidator.equals("all three unique replacements retire once", healthyAttempts.length, 3);
  const healthyClose: Promise<void> = healthy.close();
  TestValidator.predicate("healthy close memoizes completion", healthy.close() === healthyClose);
  await healthyClose;
  TestValidator.equals("healthy close does not repeat completed material retirement", healthyAttempts.length, 3);

  const failingA: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, firstSource);
  const failingB: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, nextSource);
  const failed: ReturnType<typeof createHumanObservationAlbedoPass> = createHumanObservationAlbedoPass();
  failed.apply([failingA, failingB]);
  const failedDisplay: THREE.Material = failingA.material;
  const neighbourDisplay: THREE.Material = failingB.material;
  const failure: Error = new Error("owned projection retirement");
  const failedAttempts: string[] = [];
  failedDisplay.addEventListener("dispose", (): never => { failedAttempts.push("first"); throw failure; });
  neighbourDisplay.addEventListener("dispose", (): void => { failedAttempts.push("neighbour"); });
  TestValidator.predicate("clear propagates original failed native callback", caught(failed.clear) === failure);
  TestValidator.predicate("failed first release cannot skip borrowed source restoration",
    failingA.material === firstSource && failingB.material === nextSource);
  TestValidator.equals("failure still attempts the neighbouring owned replacement", failedAttempts, ["first", "neighbour"]);
  TestValidator.predicate("repeated clear preserves original uncertainty", caught(failed.clear) === failure);
  TestValidator.predicate("new projection cannot bypass failed ownership", caught((): void => failed.apply([failingA])) === failure);
  TestValidator.predicate("settlement retains exact failed error", await outcome(failed.settleRetirements()) === failure);
  const failedClose: Promise<void> = failed.close();
  TestValidator.predicate("failed close shares completion", failed.close() === failedClose);
  TestValidator.predicate("failed close cannot become successful release", await outcome(failedClose) === failure);
  TestValidator.equals("failed disposal is never retried", failedAttempts, ["first", "neighbour"]);
  TestValidator.predicate("closed projection refuses later application", caught((): void => failed.apply([])) instanceof Error);

  const retiring: ReturnType<typeof createHumanObservationAlbedoPass> = createHumanObservationAlbedoPass();
  const previous: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, firstSource);
  const candidate: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, nextSource);
  retiring.apply([previous]);
  const previousDisplay: THREE.Material = previous.material;
  let duringRefusal: unknown;
  let reentrantClose: Promise<void> | undefined;
  let previousAttempts: number = 0;
  previousDisplay.addEventListener("dispose", (): void => {
    previousAttempts++;
    duringRefusal = caught((): void => retiring.apply([candidate]));
    reentrantClose = retiring.close();
  });
  const stoppedPublication: unknown = caught((): void => retiring.apply([candidate]));
  TestValidator.predicate("application refuses while owned disposal is running",
    duringRefusal instanceof Error && duringRefusal.message.includes("retirement"));
  TestValidator.predicate("reentrant close prevents pending population publication",
    stoppedPublication instanceof Error && stoppedPublication.message.includes("closed"));
  TestValidator.predicate("reentrant close restores every original source",
    previous.material === firstSource && candidate.material === nextSource);
  TestValidator.predicate("reentrant close returns the same owner completion", retiring.close() === reentrantClose);
  await reentrantClose;
  TestValidator.equals("reentrant transition makes one previous release attempt", previousAttempts, 1);

  const frozenPass: ReturnType<typeof createHumanObservationAlbedoPass> = createHumanObservationAlbedoPass();
  const frozenMesh: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, firstSource);
  const mutableNeighbour: THREE.Mesh<THREE.BoxGeometry, THREE.Material, THREE.Object3DEventMap> = new THREE.Mesh(geometry, nextSource);
  frozenPass.apply([frozenMesh, mutableNeighbour]);
  const frozenDisplay: THREE.Material = frozenMesh.material;
  const mutableDisplay: THREE.Material = mutableNeighbour.material;
  let frozenAttempts: number = 0;
  frozenDisplay.addEventListener("dispose", (): void => { frozenAttempts++; });
  mutableDisplay.addEventListener("dispose", (): void => { frozenAttempts++; });
  Object.freeze(frozenMesh);
  const frozenFailure: unknown = caught(frozenPass.clear);
  TestValidator.predicate("native frozen assignment remains its actual TypeError", frozenFailure instanceof TypeError);
  TestValidator.predicate("frozen first mesh cannot block neighbouring source restoration", mutableNeighbour.material === nextSource);
  TestValidator.equals("frozen source withdrawal still attempts both owned resources", frozenAttempts, 2);
  TestValidator.predicate("closed frozen owner reports unresolved borrowed withdrawal", await outcome(frozenPass.close()) instanceof TypeError);
  TestValidator.equals("close does not re-dispose already ended replacements", frozenAttempts, 2);

  for (const source of [new THREE.MeshBasicMaterial(), new THREE.MeshLambertMaterial(),
    new THREE.MeshPhongMaterial(), new THREE.MeshToonMaterial(), new THREE.MeshStandardMaterial()]) {
    const records: Record<string, unknown> = source.userData as Record<string, unknown>;
    const projected: THREE.MeshBasicMaterial = createHumanObservationAlbedoMaterial(source);
    TestValidator.predicate("supported family projection preserves source records", source.userData === records);
    TestValidator.predicate("supported family produces its actual unlit copy", projected instanceof THREE.MeshBasicMaterial);
    projected.dispose(); source.dispose();
  }
  const shaderSource: THREE.ShaderMaterial = new THREE.ShaderMaterial();
  TestValidator.predicate("unsupported shader family refuses before guessing colour",
    caught((): void => { createHumanObservationAlbedoMaterial(shaderSource); }) instanceof Error);
  shaderSource.dispose();
  const unnamedHook: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  unnamedHook.onBeforeCompile = (): undefined => undefined;
  TestValidator.predicate("unnamed public shader hook cannot become an unlit projection",
    caught((): void => { createHumanObservationAlbedoMaterial(unnamedHook); }) instanceof Error);
  unnamedHook.dispose();
  const unknownPatch: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  addMaterialShaderPatch(unknownPatch, { key: "outside-unlit-contract", apply: (): undefined => undefined });
  TestValidator.predicate("unknown named shading modification refuses",
    caught((): void => { createHumanObservationAlbedoMaterial(unknownPatch); }) instanceof Error);
  unknownPatch.dispose();
  const missingOverlay: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  addMaterialShaderPatch(missingOverlay, { key: "automovie-overlays-m", apply: (): undefined => undefined });
  const overlayRecords: Record<string, unknown> = missingOverlay.userData as Record<string, unknown>;
  TestValidator.predicate("missing overlay records refuse during owned setup",
    caught((): void => { createHumanObservationAlbedoMaterial(missingOverlay); }) instanceof Error);
  TestValidator.predicate("failed setup preserves original source record identity", missingOverlay.userData === overlayRecords);
  missingOverlay.dispose();
  const frozenSource: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const frozenRecords: Record<string, unknown> = frozenSource.userData as Record<string, unknown>;
  Object.freeze(frozenSource);
  const frozenSetup: unknown = caught((): void => { createHumanObservationAlbedoMaterial(frozenSource); });
  TestValidator.predicate("failed native copying preserves primary assignment failure",
    frozenSetup instanceof AggregateError && frozenSetup.errors[0] instanceof TypeError);
  TestValidator.predicate("failed native copying cannot replace source records", frozenSource.userData === frozenRecords);
  const overlay: THREE.DataTexture = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const overlaySource: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  addMaterialShaderPatch(overlaySource, { key: "automovie-overlays-m", apply: (): undefined => undefined });
  const overlayInput: IMaterialOverlayShading = { color: overlay, blend: "multiply",
    colorFactor: { r: 1, g: 1, b: 1 }, roughness: null, normal: null, normalScale: 1, strength: 1 };
  overlaySource.userData.overlays = [overlayInput];
  const matrixRecords: Record<string, unknown> = overlaySource.userData as Record<string, unknown>;
  const positiveOverlay: THREE.MeshBasicMaterial = createHumanObservationAlbedoMaterial(overlaySource);
  positiveOverlay.dispose();
  Object.freeze(overlay.matrix.elements);
  TestValidator.predicate("invalid owned overlay matrix reports actual native setup failure",
    caught((): void => { createHumanObservationAlbedoMaterial(overlaySource); }) instanceof TypeError);
  TestValidator.predicate("overlay refusal preserves borrowed source records", overlaySource.userData === matrixRecords);
  overlaySource.dispose(); overlay.dispose();

  const initialization: Error = new Error("owned producer initialization");
  const cleanupFailure: Error = new Error("owned producer rollback");
  const geometryOwned: THREE.BoxGeometry = new THREE.BoxGeometry();
  const materialOwned: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial({ map: image });
  const skeletonOwned: THREE.Skeleton = new THREE.Skeleton([new THREE.Bone()]);
  skeletonOwned.computeBoneTexture();
  const boneTexture: THREE.DataTexture = skeletonOwned.boneTexture!;
  const producerAttempts: string[] = [];
  geometryOwned.addEventListener("dispose", (): never => { producerAttempts.push("geometry"); throw cleanupFailure; });
  materialOwned.addEventListener("dispose", (): void => { producerAttempts.push("material"); });
  boneTexture.addEventListener("dispose", (): void => { producerAttempts.push("skeleton-table"); });
  const rollbackFailure: unknown = caught((): never => constructAutoMovieOwnedResources((own: <Resource extends { dispose(): void; }>(resource: Resource) => Resource): never => {
    own(geometryOwned); own(geometryOwned); own(materialOwned); own(skeletonOwned);
    throw initialization;
  }));
  TestValidator.predicate("producer preserves initialization before independent rollback failures",
    rollbackFailure instanceof AggregateError && rollbackFailure.errors.length === 2 &&
    rollbackFailure.errors[0] === initialization && rollbackFailure.errors[1] === cleanupFailure);
  TestValidator.equals("producer rollback attempts each distinct owned resource once", producerAttempts,
    ["geometry", "material", "skeleton-table"]);
  const transferred: THREE.BoxGeometry = new THREE.BoxGeometry();
  let transferredAttempts: number = 0;
  transferred.addEventListener("dispose", (): void => { transferredAttempts++; });
  TestValidator.predicate("successful producer transfers actual resource identity",
    constructAutoMovieOwnedResources((own: <Resource extends { dispose(): void; }>(resource: Resource) => Resource): THREE.BoxGeometry => own(transferred)) === transferred);
  TestValidator.equals("successful construction does not prematurely retire", transferredAttempts, 0);
  transferred.dispose();
  TestValidator.predicate("failure before any allocation preserves original identity",
    caught((): never => constructAutoMovieOwnedResources((): never => { throw initialization; })) === initialization);

  const original: THREE.DataTexture = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const nativeCopyFailure: Error = new Error("native Texture.copy metadata");
  original.userData = { get record(): void { throw nativeCopyFailure; } };
  const cache: AutoMovieTextureCache = new AutoMovieTextureCache(async (): Promise<THREE.DataTexture> => original);
  await cache.prime(["producer-image"]);
  const textured: IAutoMovieMaterial = materialDefinition("finish", "producer-image");
  const model: IAutoMovieModel = boxModel({ id: "generic-box-producer", materials: [textured] });
  TestValidator.predicate("actual material producer preserves native cache-copy refusal",
    caught((): void => { buildMaterial(textured, cache.resolve); }) === nativeCopyFailure);
  TestValidator.predicate("actual model producer preserves nested native cache-copy refusal",
    caught((): void => { buildModel(model, cache.resolve); }) === nativeCopyFailure);
  original.userData = { record: "ordinary metadata" };
  const repaired: IAutoMovieModelObject = buildModel(model, cache.resolve);
  TestValidator.equals("supported adjacent producer retains its normal part population", repaired.parts.size, model.parts.length);
  const returned: Set<{ dispose(): void; }> = new Set<{ dispose(): void }>();
  repaired.object.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    if (object instanceof THREE.Mesh) {
      returned.add(object.geometry);
      for (const finish of Array.isArray(object.material) ? object.material : [object.material])
        returned.add(finish);
    }
  });
  for (const resource of returned) resource.dispose();
  await cache.dispose();
  const ordinaryGeometry: THREE.BufferGeometry<THREE.NormalBufferAttributes, THREE.BufferGeometryEventMap> = buildGeometry(model.parts[0].geometry);
  TestValidator.predicate("normal geometry producer keeps its actual position attribute", ordinaryGeometry.hasAttribute("position"));
  ordinaryGeometry.dispose();

  TestValidator.equals("temporary owners never dispose borrowed subtree resources", borrowedDisposals, 0);
  geometry.dispose(); image.dispose(); firstSource.dispose(); nextSource.dispose();
}
