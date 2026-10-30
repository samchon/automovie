import type { IAutoMovieModel, IAutoMovieModelPart } from "@automovie/interface";
import * as THREE from "three";

import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";

/** Attach the optional original rest-skin overlay and register its existing retirement.
 *
 * @evidence contracts/common.md#principled-implementation Dynamically imports the original Human generation/model/texture/resource consumers only for skin=1 and preserves their construction, filtering and cleanup order.
 * @evidence contracts/common.md#clear-and-simple-design The page owns whether skin is requested; this helper owns the optional skin acquisition branch.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the same full generated rest skin and original garment selection without geometry substitution or pose correction.
 * @evidence contracts/common.md#meaningful-documentation The overlay remains in rest pose; its textures and model resources join the page's original disposer list, including failed initialization.
 * @evidence contracts/performance.md#efficient-algorithms Optional generation and texture/model traversal retain their existing costs; no work occurs on the ordinary Mannequin path.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses one generated model and the same shared texture cache for that requested overlay.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Registers texture/model retirement with the borrowed page list; the page owns all-settled cleanup on initialization failure and reports all failures.
 */
export async function attachHumanMannequinSkin(options: {
  query: URLSearchParams;
  params: IAutoMovieHumanParameters;
  scene: THREE.Scene;
  disposers: Array<(() => void) | (() => Promise<void>)>;
}): Promise<void> {
  const { query, params, scene, disposers }: typeof options = options;

  const [
    { AutoMovieHuman },
    { AutoMovieTextureCache },
    { buildModel },
    { materialTextureBindings },
    { collectAutoMovieOwnedResources },
    { createAutoMovieResourceRetirement },
  ]: [
    typeof import("../../../human/src/AutoMovieHuman"),
    typeof import("../../../viewer/src/AutoMovieTextureCache"),
    typeof import("../../../viewer/src/buildModel"),
    typeof import("../../../viewer/src/materialTextureBindings"),
    typeof import("../../../viewer/src/collectAutoMovieOwnedResources"),
    typeof import("../../../viewer/src/createAutoMovieResourceRetirement"),
  ] = await Promise.all([
    import("../../../human/src/AutoMovieHuman"),
    import("../../../viewer/src/AutoMovieTextureCache"),
    import("../../../viewer/src/buildModel"),
    import("../../../viewer/src/materialTextureBindings"),
    import("../../../viewer/src/collectAutoMovieOwnedResources"),
    import("../../../viewer/src/createAutoMovieResourceRetirement"),
  ]);
  const model: IAutoMovieModel = AutoMovieHuman.generate(params).model;
  const textures: InstanceType<typeof AutoMovieTextureCache> =
    new AutoMovieTextureCache(
      (asset: string): Promise<THREE.Texture> =>
        Promise.reject(new Error("Unserved texture asset " + asset)),
    );
  disposers.push((): Promise<void> => textures.dispose());
  await textures.prime(
    model.materials.flatMap(materialTextureBindings),
    model.images ?? [],
  );
  const garment: boolean = query.get("garment") !== "0";
  const skin: ReturnType<typeof buildModel> = buildModel(
    {
      ...model,
      parts: model.parts.filter(
        (p: IAutoMovieModelPart): boolean =>
          !p.id.startsWith("human.construction.") &&
          (garment || !p.id.startsWith("human.garment.")),
      ),
    },
    textures.resolve,
  );
  const skeletons: Set<THREE.Skeleton> = new Set();
  skin.object.traverse((part: THREE.Object3D): void => {
    if (part instanceof THREE.SkinnedMesh) skeletons.add(part.skeleton);
  });
  const closeSkin: () => Promise<void> = createAutoMovieResourceRetirement(
    [...collectAutoMovieOwnedResources(skin.object), ...skeletons].map(
      (resource: { dispose(): void }): (() => void) =>
        (): void =>
          resource.dispose(),
    ),
  );
  disposers.push(async (): Promise<void> => {
    skin.object.removeFromParent();
    await closeSkin();
  });
  skin.object.traverse((o: THREE.Object3D): void => {
    const mesh: THREE.Mesh = o as THREE.Mesh;
    if (mesh.material === undefined) return;
    for (const m of ([] as THREE.Material[]).concat(mesh.material)) {
      m.transparent = true;
      m.opacity = 0.35;
      m.depthWrite = false;
    }
    mesh.renderOrder = 1;
  });
  scene.add(skin.object);
}
