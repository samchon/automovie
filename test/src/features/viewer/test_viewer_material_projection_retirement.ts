import { addMaterialShaderPatch, AutoMovieTextureCache, buildGeometry, buildMaterial, buildModel, type IMaterialOverlayShading } from "@automovie/viewer";
import { createHumanObservationAlbedoPass } from "@automovie/viewer/human/common/observation/createHumanObservationAlbedoPass";
import { createHumanObservationAlbedoMaterial } from "@automovie/viewer/human/common/observation/createHumanObservationAlbedoMaterial";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";
import path from "node:path";
import { loadSourceModule } from "../internal/loadSourceModule";
import { boxModel, material as materialDefinition } from "../internal/renderFixtures";

const { constructAutoMovieOwnedResources } = loadSourceModule<{
  constructAutoMovieOwnedResources: <Value>(
    construct: (own: <Resource extends { dispose(): void }>(resource: Resource) => Resource) => Value,
  ) => Value;
}>(path.resolve(__dirname, "../../../../packages/viewer/src/constructAutoMovieOwnedResources.ts"));

/**
 * A generic box's temporary unlit projection owns only its replacement materials.
 * Source assignments restore independently, failed retirement stays visible and
 * a reentrant close cannot publish a new replacement after withdrawal.
 * Public material events count attempts, not physical GPU allocations.
 *
 * Scenarios:
 * 1. Scalar, array, empty and duplicate populations reuse actual replacements;
 *    departed and cleared replacements retire once while sources remain borrowed.
 * 2. A failed first disposal still restores every source and attempts its healthy
 *    neighbour; clear, settlement and close retain the original error without retry.
 * 3. Reentrant application refuses during retirement; reentrant close shares its
 *    completion and prevents a pending population from being published.
 * 4. A frozen owned box rejects assignment through native TypeError while other
 *    source restorations and every replacement retirement still run.
 * 5. Supported material families preserve source state. Unsupported shader hooks,
 *    missing overlay records and frozen setup state refuse without replacing the
 *    source's userData or claiming that a public dispose proves native release.
 * 6. Producer initialization registers actual geometry, material and skeleton
 *    before a later failure; rollback attempts distinct resources independently
 *    and successful transfer leaves their lifetime with the caller.
 */
export const test_viewer_material_projection_retirement = async (): Promise<void> => {
  const caught = (operation: () => void): unknown => {
    try { operation(); return undefined; } catch (error) { return error; }
  };
  const outcome = (completion: Promise<void>) => completion
    .then(() => undefined).catch((error: unknown) => error);
  const geometry = new THREE.BoxGeometry();
  const image = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const firstSource = new THREE.MeshStandardMaterial({ map: image });
  const nextSource = new THREE.MeshStandardMaterial();
  let borrowedDisposals = 0;
  for (const resource of [geometry, image, firstSource, nextSource])
    resource.addEventListener("dispose", () => { borrowedDisposals++; });

  const arraySource = [firstSource, nextSource];
  const arrayMesh = new THREE.Mesh(geometry, arraySource);
  const scalarMesh = new THREE.Mesh(geometry, firstSource);
  const emptyMesh = new THREE.Mesh(geometry, []);
  const healthy = createHumanObservationAlbedoPass();
  healthy.apply([arrayMesh, scalarMesh, emptyMesh, arrayMesh]);
  const arrayDisplay = arrayMesh.material;
  const scalarDisplay = scalarMesh.material;
  TestValidator.predicate("array material shape has distinct owned projections",
    arrayDisplay !== arraySource && arrayDisplay.length === 2 && arrayDisplay[0] !== firstSource);
  TestValidator.predicate("scalar projection borrows its actual source image", scalarDisplay.map === image);
  TestValidator.equals("empty material population stays empty", emptyMesh.material.length, 0);
  healthy.apply([arrayMesh, scalarMesh, emptyMesh]);
  TestValidator.predicate("same admitted population reuses replacement identity",
    arrayMesh.material === arrayDisplay && scalarMesh.material === scalarDisplay);
  const healthyAttempts: THREE.Material[] = [];
  for (const material of [...arrayDisplay, scalarDisplay])
    material.addEventListener("dispose", () => { healthyAttempts.push(material); });
  healthy.apply([scalarMesh, emptyMesh]);
  TestValidator.predicate("departed mesh immediately restores its source array", arrayMesh.material === arraySource);
  TestValidator.equals("only departed array replacements retire", healthyAttempts.length, 2);
  healthy.clear(); healthy.clear();
  TestValidator.predicate("clear restores scalar source identity", scalarMesh.material === firstSource);
  TestValidator.equals("all three unique replacements retire once", healthyAttempts.length, 3);
  const healthyClose = healthy.close();
  TestValidator.predicate("healthy close memoizes completion", healthy.close() === healthyClose);
  await healthyClose;
  TestValidator.equals("healthy close does not repeat completed material retirement", healthyAttempts.length, 3);

  const failingA = new THREE.Mesh(geometry, firstSource);
  const failingB = new THREE.Mesh(geometry, nextSource);
  const failed = createHumanObservationAlbedoPass();
  failed.apply([failingA, failingB]);
  const failedDisplay = failingA.material;
  const neighbourDisplay = failingB.material;
  const failure = new Error("owned projection retirement");
  const failedAttempts: string[] = [];
  failedDisplay.addEventListener("dispose", () => { failedAttempts.push("first"); throw failure; });
  neighbourDisplay.addEventListener("dispose", () => { failedAttempts.push("neighbour"); });
  TestValidator.predicate("clear propagates original failed native callback", caught(failed.clear) === failure);
  TestValidator.predicate("failed first release cannot skip borrowed source restoration",
    failingA.material === firstSource && failingB.material === nextSource);
  TestValidator.equals("failure still attempts the neighbouring owned replacement", failedAttempts, ["first", "neighbour"]);
  TestValidator.predicate("repeated clear preserves original uncertainty", caught(failed.clear) === failure);
  TestValidator.predicate("new projection cannot bypass failed ownership", caught(() => failed.apply([failingA])) === failure);
  TestValidator.predicate("settlement retains exact failed error", await outcome(failed.settleRetirements()) === failure);
  const failedClose = failed.close();
  TestValidator.predicate("failed close shares completion", failed.close() === failedClose);
  TestValidator.predicate("failed close cannot become successful release", await outcome(failedClose) === failure);
  TestValidator.equals("failed disposal is never retried", failedAttempts, ["first", "neighbour"]);
  TestValidator.predicate("closed projection refuses later application", caught(() => failed.apply([])) instanceof Error);

  const retiring = createHumanObservationAlbedoPass();
  const previous = new THREE.Mesh(geometry, firstSource);
  const candidate = new THREE.Mesh(geometry, nextSource);
  retiring.apply([previous]);
  const previousDisplay = previous.material;
  let duringRefusal: unknown;
  let reentrantClose: Promise<void> | undefined;
  let previousAttempts = 0;
  previousDisplay.addEventListener("dispose", () => {
    previousAttempts++;
    duringRefusal = caught(() => retiring.apply([candidate]));
    reentrantClose = retiring.close();
  });
  const stoppedPublication = caught(() => retiring.apply([candidate]));
  TestValidator.predicate("application refuses while owned disposal is running",
    duringRefusal instanceof Error && duringRefusal.message.includes("retirement"));
  TestValidator.predicate("reentrant close prevents pending population publication",
    stoppedPublication instanceof Error && stoppedPublication.message.includes("closed"));
  TestValidator.predicate("reentrant close restores every original source",
    previous.material === firstSource && candidate.material === nextSource);
  TestValidator.predicate("reentrant close returns the same owner completion", retiring.close() === reentrantClose);
  await reentrantClose;
  TestValidator.equals("reentrant transition makes one previous release attempt", previousAttempts, 1);

  const frozenPass = createHumanObservationAlbedoPass();
  const frozenMesh = new THREE.Mesh(geometry, firstSource);
  const mutableNeighbour = new THREE.Mesh(geometry, nextSource);
  frozenPass.apply([frozenMesh, mutableNeighbour]);
  const frozenDisplay = frozenMesh.material;
  const mutableDisplay = mutableNeighbour.material;
  let frozenAttempts = 0;
  frozenDisplay.addEventListener("dispose", () => { frozenAttempts++; });
  mutableDisplay.addEventListener("dispose", () => { frozenAttempts++; });
  Object.freeze(frozenMesh);
  const frozenFailure = caught(frozenPass.clear);
  TestValidator.predicate("native frozen assignment remains its actual TypeError", frozenFailure instanceof TypeError);
  TestValidator.predicate("frozen first mesh cannot block neighbouring source restoration", mutableNeighbour.material === nextSource);
  TestValidator.equals("frozen source withdrawal still attempts both owned resources", frozenAttempts, 2);
  TestValidator.predicate("closed frozen owner reports unresolved borrowed withdrawal", await outcome(frozenPass.close()) instanceof TypeError);
  TestValidator.equals("close does not re-dispose already ended replacements", frozenAttempts, 2);

  for (const source of [new THREE.MeshBasicMaterial(), new THREE.MeshLambertMaterial(),
    new THREE.MeshPhongMaterial(), new THREE.MeshToonMaterial(), new THREE.MeshStandardMaterial()]) {
    const records = source.userData;
    const projected = createHumanObservationAlbedoMaterial(source);
    TestValidator.predicate("supported family projection preserves source records", source.userData === records);
    TestValidator.predicate("supported family produces its actual unlit copy", projected instanceof THREE.MeshBasicMaterial);
    projected.dispose(); source.dispose();
  }
  const shaderSource = new THREE.ShaderMaterial();
  TestValidator.predicate("unsupported shader family refuses before guessing colour",
    caught(() => { createHumanObservationAlbedoMaterial(shaderSource); }) instanceof Error);
  shaderSource.dispose();
  const unnamedHook = new THREE.MeshStandardMaterial();
  unnamedHook.onBeforeCompile = () => undefined;
  TestValidator.predicate("unnamed public shader hook cannot become an unlit projection",
    caught(() => { createHumanObservationAlbedoMaterial(unnamedHook); }) instanceof Error);
  unnamedHook.dispose();
  const unknownPatch = new THREE.MeshStandardMaterial();
  addMaterialShaderPatch(unknownPatch, { key: "outside-unlit-contract", apply: () => undefined });
  TestValidator.predicate("unknown named shading modification refuses",
    caught(() => { createHumanObservationAlbedoMaterial(unknownPatch); }) instanceof Error);
  unknownPatch.dispose();
  const missingOverlay = new THREE.MeshStandardMaterial();
  addMaterialShaderPatch(missingOverlay, { key: "automovie-overlays-m", apply: () => undefined });
  const overlayRecords = missingOverlay.userData;
  TestValidator.predicate("missing overlay records refuse during owned setup",
    caught(() => { createHumanObservationAlbedoMaterial(missingOverlay); }) instanceof Error);
  TestValidator.predicate("failed setup preserves original source record identity", missingOverlay.userData === overlayRecords);
  missingOverlay.dispose();
  const frozenSource = new THREE.MeshStandardMaterial();
  const frozenRecords = frozenSource.userData;
  Object.freeze(frozenSource);
  const frozenSetup = caught(() => { createHumanObservationAlbedoMaterial(frozenSource); });
  TestValidator.predicate("failed native copying preserves primary assignment failure",
    frozenSetup instanceof AggregateError && frozenSetup.errors[0] instanceof TypeError);
  TestValidator.predicate("failed native copying cannot replace source records", frozenSource.userData === frozenRecords);
  const overlay = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const overlaySource = new THREE.MeshStandardMaterial();
  addMaterialShaderPatch(overlaySource, { key: "automovie-overlays-m", apply: () => undefined });
  const overlayInput: IMaterialOverlayShading = { color: overlay, blend: "multiply",
    colorFactor: { r: 1, g: 1, b: 1 }, roughness: null, normal: null, normalScale: 1, strength: 1 };
  overlaySource.userData.overlays = [overlayInput];
  const matrixRecords = overlaySource.userData;
  const positiveOverlay = createHumanObservationAlbedoMaterial(overlaySource);
  positiveOverlay.dispose();
  Object.freeze(overlay.matrix.elements);
  TestValidator.predicate("invalid owned overlay matrix reports actual native setup failure",
    caught(() => { createHumanObservationAlbedoMaterial(overlaySource); }) instanceof TypeError);
  TestValidator.predicate("overlay refusal preserves borrowed source records", overlaySource.userData === matrixRecords);
  overlaySource.dispose(); overlay.dispose();

  const initialization = new Error("owned producer initialization");
  const cleanupFailure = new Error("owned producer rollback");
  const geometryOwned = new THREE.BoxGeometry();
  const materialOwned = new THREE.MeshStandardMaterial({ map: image });
  const skeletonOwned = new THREE.Skeleton([new THREE.Bone()]);
  skeletonOwned.computeBoneTexture();
  const boneTexture = skeletonOwned.boneTexture!;
  const producerAttempts: string[] = [];
  geometryOwned.addEventListener("dispose", () => { producerAttempts.push("geometry"); throw cleanupFailure; });
  materialOwned.addEventListener("dispose", () => { producerAttempts.push("material"); });
  boneTexture.addEventListener("dispose", () => { producerAttempts.push("skeleton-table"); });
  const rollbackFailure = caught(() => constructAutoMovieOwnedResources((own) => {
    own(geometryOwned); own(geometryOwned); own(materialOwned); own(skeletonOwned);
    throw initialization;
  }));
  TestValidator.predicate("producer preserves initialization before independent rollback failures",
    rollbackFailure instanceof AggregateError && rollbackFailure.errors.length === 2 &&
    rollbackFailure.errors[0] === initialization && rollbackFailure.errors[1] === cleanupFailure);
  TestValidator.equals("producer rollback attempts each distinct owned resource once", producerAttempts,
    ["geometry", "material", "skeleton-table"]);
  const transferred = new THREE.BoxGeometry();
  let transferredAttempts = 0;
  transferred.addEventListener("dispose", () => { transferredAttempts++; });
  TestValidator.predicate("successful producer transfers actual resource identity",
    constructAutoMovieOwnedResources((own) => own(transferred)) === transferred);
  TestValidator.equals("successful construction does not prematurely retire", transferredAttempts, 0);
  transferred.dispose();
  TestValidator.predicate("failure before any allocation preserves original identity",
    caught(() => constructAutoMovieOwnedResources(() => { throw initialization; })) === initialization);

  const original = new THREE.DataTexture(new Uint8Array(4), 1, 1);
  const nativeCopyFailure = new Error("native Texture.copy metadata");
  original.userData = { get record() { throw nativeCopyFailure; } };
  const cache = new AutoMovieTextureCache(async () => original);
  await cache.prime(["producer-image"]);
  const textured = materialDefinition("finish", "producer-image");
  const model = boxModel({ id: "generic-box-producer", materials: [textured] });
  TestValidator.predicate("actual material producer preserves native cache-copy refusal",
    caught(() => { buildMaterial(textured, cache.resolve); }) === nativeCopyFailure);
  TestValidator.predicate("actual model producer preserves nested native cache-copy refusal",
    caught(() => { buildModel(model, cache.resolve); }) === nativeCopyFailure);
  original.userData = { record: "ordinary metadata" };
  const repaired = buildModel(model, cache.resolve);
  TestValidator.equals("supported adjacent producer retains its normal part population", repaired.parts.size, model.parts.length);
  const returned = new Set<{ dispose(): void }>();
  repaired.object.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      returned.add(object.geometry);
      for (const finish of Array.isArray(object.material) ? object.material : [object.material])
        returned.add(finish);
    }
  });
  for (const resource of returned) resource.dispose();
  await cache.dispose();
  const ordinaryGeometry = buildGeometry(model.parts[0].geometry);
  TestValidator.predicate("normal geometry producer keeps its actual position attribute", ordinaryGeometry.hasAttribute("position"));
  ordinaryGeometry.dispose();

  TestValidator.equals("temporary owners never dispose borrowed subtree resources", borrowedDisposals, 0);
  geometry.dispose(); image.dispose(); firstSource.dispose(); nextSource.dispose();
};
