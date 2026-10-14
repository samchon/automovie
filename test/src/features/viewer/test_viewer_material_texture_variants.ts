import type * as ThreeTypes from "three";
import { type AutoMovieBuiltinTexturePurpose, type IAutoMovieRenderTextureSource, measureAutoMovieRenderTextureClosure } from "@automovie/engine";
import { readAutoMovieMaterialTextureSources } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";

/**
 * Normal slots expose each Texture wrapper's upload-key metadata. The Engine closure adjudicates source sharing, while reobserving a wrapper replaces its previous state. Public object facts bound reachable storage but do not measure native uploads.
 *
 * Scenarios:
 *
 * 1. Wrappers sharing a Source contribute one 64-byte extent until color spaces or samplers differ; restoring equal keys restores one extent.
 * 2. Reobservation updates the same wrapper's state and stable owner; an independent Source stays separate despite equal upload keys.
 * 3. Removed use retains context facts; explicit host-supplied release rows prune the wrapper rather than claiming an automatic native disposal observer.
 *
 * @evidence contracts/testing.md#behavioral-verification Observes real Texture wrappers through material slots and measures the resulting Engine closure, catching premature wrapper merging, stale upload keys and an observer that loses unchanged owner identities.
 * @evidence contracts/testing.md#independent-expectations A 4-by-4 RGBA8 source has 64 bytes; equal Source and upload keys share that extent, while different keys or independent Source objects retain separate rows. Host-supplied pruning is explicit and does not prove an automatic native disposal observer.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts clone versus independent source, color-space and wrapping changes, recovered equivalence, removed use, explicit released-wrapper pruning and empty context facts; shader lookup construction belongs to the texture-facts test.
 * @evidence contracts/testing.md#execution-ownership This portable asynchronous entry uses existing Viewer/Engine source with actual in-memory Three wrappers, material slots and explicit host rows; it disposes those objects and starts no browser, GPU or process.
 */
export async function test_viewer_material_texture_variants(): Promise<void> {
  const THREE: typeof ThreeTypes = await import("three");
  const original: ThreeTypes.DataTexture = new THREE.DataTexture(new Uint8Array(4 * 4 * 4), 4, 4);
  const clone: ThreeTypes.DataTexture = original.clone();
  const independent: ThreeTypes.DataTexture = new THREE.DataTexture(new Uint8Array(4 * 4 * 4), 4, 4);
  const geometry: ThreeTypes.BoxGeometry = new THREE.BoxGeometry();
  const makeMaterial: (texture: InstanceType<typeof ThreeTypes.Texture>) => ThreeTypes.MeshStandardMaterial = (texture: InstanceType<typeof THREE.Texture>): ThreeTypes.MeshStandardMaterial => {
    const material: ThreeTypes.MeshStandardMaterial = new THREE.MeshStandardMaterial({ normalMap: texture });
    material.userData.autoMovieOverlayFlatNormal = texture;
    return material;
  };
  const a: ThreeTypes.MeshStandardMaterial = makeMaterial(original);
  const b: ThreeTypes.MeshStandardMaterial = makeMaterial(clone);
  const c: ThreeTypes.MeshStandardMaterial = makeMaterial(independent);
  const scene: ThreeTypes.Scene<ThreeTypes.Object3DEventMap> = new THREE.Scene();
  const meshA: ThreeTypes.Mesh<ThreeTypes.BoxGeometry, ThreeTypes.MeshStandardMaterial, ThreeTypes.Object3DEventMap> = new THREE.Mesh(geometry, a);
  const meshB: ThreeTypes.Mesh<ThreeTypes.BoxGeometry, ThreeTypes.MeshStandardMaterial, ThreeTypes.Object3DEventMap> = new THREE.Mesh(geometry, b);
  const meshC: ThreeTypes.Mesh<ThreeTypes.BoxGeometry, ThreeTypes.MeshStandardMaterial, ThreeTypes.Object3DEventMap> = new THREE.Mesh(geometry, c);
  scene.add(meshA, meshB);
  const read: (retained?: ReturnType<typeof readAutoMovieMaterialTextureSources>) => { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] = (retained: ReturnType<typeof readAutoMovieMaterialTextureSources> = []): { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] =>
    readAutoMovieMaterialTextureSources({ scope: "shot", scene,
      renderer: { extensions: { has: (): boolean => false } }, retained });
  const cost: (rows: ReturnType<typeof readAutoMovieMaterialTextureSources>) => ReturnType<typeof measureAutoMovieRenderTextureClosure>[number][] = (rows: ReturnType<typeof readAutoMovieMaterialTextureSources>): ReturnType<typeof measureAutoMovieRenderTextureClosure>[number][] =>
    measureAutoMovieRenderTextureClosure({ materials: [], sources: [], environment: null,
      residency: { owner: "shot", residents: [], dfgRetained: false, pmremRetained: null,
        runtimeTextures: rows } });
  const bytes: (rows: ReturnType<typeof readAutoMovieMaterialTextureSources>) => (number | null)[] = (rows: ReturnType<typeof readAutoMovieMaterialTextureSources>): (number | null)[] =>
    cost(rows).map((row: ReturnType<typeof measureAutoMovieRenderTextureClosure>[number]): number | null => row.bytes);
  TestValidator.predicate("real clone shares Source but has its own wrapper", original.source === clone.source && original !== clone);
  let rows: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }[] = read();
  TestValidator.equals("wrapper facts do not merge prematurely", rows.length, 2);
  TestValidator.equals("equal Source and upload keys share one measured extent", bytes(rows), [4 * 4 * 4]);
  const stableOwners: string[] = rows.map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): string => row.owner);
  clone.colorSpace = THREE.SRGBColorSpace;
  rows = read(rows);
  TestValidator.equals("colour-space keys split the shared Source", bytes(rows), [64, 64]);
  TestValidator.equals("state replacement preserves wrapper owners", rows.map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): string => row.owner), stableOwners);
  clone.colorSpace = THREE.NoColorSpace;
  clone.wrapS = THREE.RepeatWrapping;
  rows = read(rows);
  TestValidator.equals("native sampler keys split the shared Source", bytes(rows), [64, 64]);
  clone.wrapS = THREE.ClampToEdgeWrapping;
  rows = read(rows);
  TestValidator.equals("equivalent keys recover sharing", bytes(rows), [64]);
  scene.remove(meshA);
  rows = read(rows);
  TestValidator.equals("removed use retains its wrapper without a live label", rows.map((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): readonly string[] | undefined => row.residents), [[], ["shot"]]);
  original.dispose();
  rows = read(rows.filter((row: { owner: string; texture: Omit<IAutoMovieRenderTextureSource, "asset">; purpose?: AutoMovieBuiltinTexturePurpose; residents?: readonly string[]; }): boolean => row.owner !== stableOwners[0]));
  clone.colorSpace = THREE.LinearSRGBColorSpace;
  rows = read(rows);
  TestValidator.equals("single surviving wrapper changes key without retaining a released key", [rows.length, bytes(rows)], [1, [64]]);
  scene.add(meshC);
  rows = read(rows);
  TestValidator.equals("independent Sources contribute separate measured extents", bytes(rows), [64, 64]);
  scene.clear();
  clone.dispose(); independent.dispose();
  TestValidator.equals("empty host-supplied retained rows produce an empty closure", cost(read()), []);
  geometry.dispose(); a.dispose(); b.dispose(); c.dispose();
}
