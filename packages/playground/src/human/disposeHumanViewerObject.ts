import type * as THREE from "three";

/** Release geometry and materials owned by one removed viewer object tree.
 * Meshes, lines, line segments and points participate. Shared resources are
 * released once; page-owned temporary materials are retained explicitly.
 * A substituted mesh also owns its saved actual surface material. Textures
 * retain the existing texture-cache owner and are not released here.
 *
 * @evidence contracts/common.md#principled-implementation Collects actual mesh, line and point geometry and both displayed and saved surface materials by object identity before release.
 * @evidence contracts/common.md#clear-and-simple-design Tree resources are released here; retained page materials and cache-owned textures keep their existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No native dispose method is replaced and no resource is invented from metadata.
 * @evidence contracts/common.md#meaningful-documentation Names supported drawable types, shared-resource deduplication and texture ownership.
 * @evidence contracts/performance.md#efficient-algorithms One traversal plus two Sets takes time and space proportional to resources in the removed tree.
 * @evidence contracts/performance.md#reuse-equivalent-work Identity Sets ensure shared geometry and materials in this tree are disposed once.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Every collected resource is attempted; failures aggregate after the full release pass.

 */
export function disposeHumanViewerObject(
  root: THREE.Object3D,
  retainedMaterials: ReadonlySet<THREE.Material> = new Set(),
): void {
  const geometries: Set<THREE.BufferGeometry> = new Set();
  const materials: Set<THREE.Material> = new Set();
  const collect: (value: unknown) => void = (value: unknown): void => {
    for (const entry of Array.isArray(value) ? value : [value]) {
      const material: THREE.Material | null =
        entry !== null &&
        typeof entry === "object" &&
        (entry as THREE.Material).isMaterial === true
          ? (entry as THREE.Material)
          : null;
      if (material !== null && !retainedMaterials.has(material))
        materials.add(material);
    }
  };
  root.traverse((node: THREE.Object3D): void => {
    const drawable: THREE.Mesh | THREE.Line | THREE.Points = node as
      | THREE.Mesh
      | THREE.Line
      | THREE.Points;
    if (
      !(node as THREE.Mesh).isMesh &&
      !(node as THREE.Line).isLine &&
      !(node as THREE.Points).isPoints
    )
      return;
    geometries.add(drawable.geometry);
    collect(drawable.material);
    collect(node.userData.surfaceMaterial);
  });
  const failures: unknown[] = [];
  for (const resource of [...geometries, ...materials]) {
    try {
      resource.dispose();
    } catch (cause) {
      failures.push(cause);
    }
  }
  if (failures.length !== 0)
    throw new AggregateError(failures, "Viewer object cleanup failed.");
}
