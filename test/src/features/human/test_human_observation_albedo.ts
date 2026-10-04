import { createHumanObservationAlbedoPass } from "@automovie/playground/src/human/common/observation/createHumanObservationAlbedoPass";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Base-colour observation borrows textures while owning only replacement
 * materials. It preserves independent authored colour/alpha and restores
 * caller materials before their disposal, including grouped material arrays.
 *
 * Scenarios:
 * 1. Each supported standard family retains linear RGB, alpha, texture identity,
 *    colour space and vertex colour while omitting all illumination channels.
 * 2. Repeated application reuses replacements; departure and clear dispose
 *    each replacement once without disposing source textures or materials.
 * 3. Unsupported families, custom hooks and active mapped displacement refuse
 *    without partially swapping a supported preceding mesh.
 */
export const test_human_observation_albedo = (): void => {
  const sources = [
    new THREE.MeshBasicMaterial(),
    new THREE.MeshLambertMaterial(),
    new THREE.MeshPhongMaterial(),
    new THREE.MeshToonMaterial(),
    new THREE.MeshStandardMaterial(),
    new THREE.MeshPhysicalMaterial(),
  ];
  const map = new THREE.Texture();
  map.colorSpace = THREE.SRGBColorSpace;
  const alphaMap = new THREE.Texture();
  let sourceDisposals = 0;
  map.addEventListener("dispose", () => {
    ++sourceDisposals;
  });
  for (const [index, source] of sources.entries()) {
    const rgb = index % 2 === 0 ? [0.2, 0.4, 0.8] : [0.8, 0.1, 0.3];
    source.color.setRGB(rgb[0], rgb[1], rgb[2]);
    source.map = map;
    source.alphaMap = alphaMap;
    source.vertexColors = true;
    source.opacity = 0.6;
    source.transparent = true;
    source.alphaTest = 0.35;
    source.alphaHash = true;
    source.alphaToCoverage = true;
    source.side = THREE.BackSide;
    source.depthWrite = false;
    source.addEventListener("dispose", () => {
      ++sourceDisposals;
    });
  }
  const geometry = new THREE.BoxGeometry();
  geometry.addGroup(0, 3, 1);
  const meshes = sources.map((source) => new THREE.Mesh(geometry, source));
  const grouped = new THREE.Mesh(geometry, [sources[0], sources[1]]);
  const originalArray = grouped.material;
  const pass = createHumanObservationAlbedoPass();
  pass.apply([...meshes, grouped, meshes[0]]);
  let disposed = 0;
  const replacements = meshes.map(
    (mesh) => mesh.material as THREE.MeshBasicMaterial,
  );
  for (const [index, replacement] of [
    ...replacements,
    ...(grouped.material as THREE.MeshBasicMaterial[]),
  ].entries()) {
    replacement.addEventListener("dispose", () => {
      ++disposed;
    });
    const rgb = index % 2 === 0 ? [0.2, 0.4, 0.8] : [0.8, 0.1, 0.3];
    TestValidator.predicate(
      "linear RGB survives",
      Math.abs(replacement.color.r - rgb[0]) < 1e-12 &&
        Math.abs(replacement.color.g - rgb[1]) < 1e-12 &&
        Math.abs(replacement.color.b - rgb[2]) < 1e-12,
    );
    TestValidator.predicate(
      "maps, alpha and raster state survive",
      replacement.map === map &&
        replacement.alphaMap === alphaMap &&
        replacement.vertexColors &&
        replacement.transparent &&
        replacement.opacity === 0.6 &&
        replacement.alphaTest === 0.35 &&
        replacement.alphaHash &&
        replacement.alphaToCoverage &&
        replacement.side === THREE.BackSide &&
        !replacement.depthWrite,
    );
    TestValidator.predicate(
      "lighting channels are absent",
      replacement.envMap === null &&
        replacement.lightMap === null &&
        replacement.aoMap === null &&
        !replacement.toneMapped &&
        !replacement.fog,
    );
  }
  TestValidator.equals(
    "texture colour space unchanged",
    map.colorSpace,
    THREE.SRGBColorSpace,
  );
  pass.apply([...meshes, grouped]);
  TestValidator.predicate(
    "unchanged frames reuse replacements",
    meshes.every((mesh, index) => mesh.material === replacements[index]),
  );
  pass.apply([grouped]);
  TestValidator.equals(
    "departed sources restored",
    meshes.map((mesh) => mesh.material),
    sources,
  );
  TestValidator.equals("departed replacements disposed once", disposed, 6);
  pass.clear();
  pass.clear();
  TestValidator.predicate(
    "group material array restored by identity",
    grouped.material === originalArray,
  );
  TestValidator.equals("all replacements disposed once", disposed, 8);
  TestValidator.equals("borrowed resources survive", sourceDisposals, 0);
  TestValidator.predicate(
    "geometry and groups unchanged",
    grouped.geometry === geometry && geometry.groups.length === 7,
  );

  const customCompile = new THREE.MeshStandardMaterial();
  customCompile.onBeforeCompile = () => {};
  const customRender = new THREE.MeshBasicMaterial();
  customRender.onBeforeRender = () => {};
  const displaced = new THREE.MeshStandardMaterial({
    displacementMap: map,
    displacementScale: 1,
  });
  for (const unsupported of [
    new THREE.ShaderMaterial(),
    new THREE.MeshNormalMaterial(),
    new THREE.MeshDepthMaterial(),
    customCompile,
    customRender,
    displaced,
    new THREE.MeshStandardMaterial({
      name: "mapped-source",
      displacementMap: map,
      displacementScale: 1,
    }),
  ]) {
    const first = new THREE.Mesh(geometry, sources[0]);
    const second = new THREE.Mesh(geometry, unsupported);
    let refusal = "";
    try {
      pass.apply([first, second]);
    } catch (error) {
      refusal = (error as Error).message;
    }
    TestValidator.predicate(
      "named refusal",
      refusal.includes("Albedo observation refuses"),
    );
    TestValidator.predicate(
      "transaction has no partial swap",
      first.material === sources[0] && second.material === unsupported,
    );
  }
  const retained = new THREE.Mesh(geometry, sources[0]);
  pass.apply([retained]);
  let errorCleanup = 0;
  (retained.material as THREE.Material).addEventListener("dispose", () => {
    ++errorCleanup;
  });
  try {
    pass.apply([
      retained,
      new THREE.Mesh(geometry, new THREE.ShaderMaterial()),
    ]);
  } catch {}
  TestValidator.predicate(
    "refusal restores prior borrowed source",
    retained.material === sources[0] && errorCleanup === 1,
  );
  displaced.displacementScale = 0;
  const supported = new THREE.Mesh(geometry, displaced);
  pass.apply([supported]);
  pass.clear();
  TestValidator.predicate(
    "zero displacement remains supported",
    supported.material === displaced,
  );
  const empty = new THREE.Mesh(geometry, []);
  const originalEmpty = empty.material;
  pass.apply([empty]);
  pass.clear();
  TestValidator.predicate(
    "empty material arrays retain ownership",
    empty.material === originalEmpty,
  );
};
