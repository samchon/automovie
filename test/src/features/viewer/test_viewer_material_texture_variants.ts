import { measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { readAutoMovieMaterialTextureSources } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Actual normal slots preserve each Texture wrapper's native upload key.
 * Source sharing is adjudicated by the memory closure, while reobserving a
 * wrapper replaces its previous state rather than inventing a retained upload.
 * These are public object facts and reachable bounds, without a fake GL host.
 *
 * Scenarios:
 *
 * 1. Two real wrappers of one Source share 64 bytes until their color spaces or
 *    samplers differ; restoring both keys recovers one allocation.
 * 2. Reobserving the same wrapper updates its state and stable owner, while an
 *    independent Source remains separate even with equal upload parameters.
 * 3. Removed material use retains context facts; host-observed disposal prunes
 *    its wrapper and cannot leave its old state as a claimed resident variant.
 */
export const test_viewer_material_texture_variants = async (): Promise<void> => {
  const THREE = await import("three");
  const original = new THREE.DataTexture(new Uint8Array(4 * 4 * 4), 4, 4);
  const clone = original.clone();
  const independent = new THREE.DataTexture(new Uint8Array(4 * 4 * 4), 4, 4);
  const geometry = new THREE.BoxGeometry();
  const makeMaterial = (texture: InstanceType<typeof THREE.Texture>) => {
    const material = new THREE.MeshStandardMaterial({ normalMap: texture });
    material.userData.autoMovieOverlayFlatNormal = texture;
    return material;
  };
  const a = makeMaterial(original);
  const b = makeMaterial(clone);
  const c = makeMaterial(independent);
  const scene = new THREE.Scene();
  const meshA = new THREE.Mesh(geometry, a);
  const meshB = new THREE.Mesh(geometry, b);
  const meshC = new THREE.Mesh(geometry, c);
  scene.add(meshA, meshB);
  const read = (retained: ReturnType<typeof readAutoMovieMaterialTextureSources> = []) =>
    readAutoMovieMaterialTextureSources({ scope: "shot", scene,
      renderer: { extensions: { has: () => false } }, retained });
  const cost = (rows: ReturnType<typeof readAutoMovieMaterialTextureSources>) =>
    measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
      residency: { owner: "shot", residents: [], dfgRetained: false, pmremRetained: null,
        runtimeTextures: rows } });
  const bytes = (rows: ReturnType<typeof readAutoMovieMaterialTextureSources>) =>
    cost(rows).map((row) => row.bytes);
  TestValidator.predicate("real clone shares Source but has its own wrapper", original.source === clone.source && original !== clone);
  let rows = read();
  TestValidator.equals("wrapper facts do not merge prematurely", rows.length, 2);
  TestValidator.equals("equivalent native uploads share storage", bytes(rows), [4 * 4 * 4]);
  const stableOwners = rows.map((row) => row.owner);
  clone.colorSpace = THREE.SRGBColorSpace;
  rows = read(rows);
  TestValidator.equals("colour-space keys split the shared Source", bytes(rows), [64, 64]);
  TestValidator.equals("state replacement preserves wrapper owners", rows.map((row) => row.owner), stableOwners);
  clone.colorSpace = THREE.NoColorSpace;
  clone.wrapS = THREE.RepeatWrapping;
  rows = read(rows);
  TestValidator.equals("native sampler keys split the shared Source", bytes(rows), [64, 64]);
  clone.wrapS = THREE.ClampToEdgeWrapping;
  rows = read(rows);
  TestValidator.equals("equivalent keys recover sharing", bytes(rows), [64]);
  scene.remove(meshA);
  rows = read(rows);
  TestValidator.equals("removed use retains its wrapper without a live label", rows.map((row) => row.residents), [[], ["shot"]]);
  original.dispose();
  rows = read(rows.filter((row) => row.owner !== stableOwners[0]));
  clone.colorSpace = THREE.LinearSRGBColorSpace;
  rows = read(rows);
  TestValidator.equals("single surviving wrapper changes key without retaining a released key", [rows.length, bytes(rows)], [1, [64]]);
  scene.add(meshC);
  rows = read(rows);
  TestValidator.equals("independent Sources retain independent allocation", bytes(rows), [64, 64]);
  scene.clear();
  clone.dispose(); independent.dispose();
  TestValidator.equals("host context release clears all retained allocations", cost(read()), []);
  geometry.dispose(); a.dispose(); b.dispose(); c.dispose();
};
