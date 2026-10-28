import * as THREE from "three";

import type { IHumanViewerPage } from "./IHumanViewerPage";

/** Part id prefix the generator gives every construction part. */
const CONSTRUCTION: string = "human.construction.";

/** Part id prefixes of the skin intervals a click can name. */
const SKIN: readonly string[] = ["human.skin.", "human.cavity."];

/**
 * Find the curves a click at a normalized device coordinate toggles.
 *
 * Tubes are a few pixels wide, so rays are cast at offsets of up to six
 * pixels in rings of growing radius and the first ring with a curve hit wins:
 * that curve alone. In `overlay` a section counts only when it is not behind
 * the skin (within one centimetre of the first visible skin hit); axes, drawn
 * through the skin, always count. When no curve lies in any ring and the
 * pointer's first visible surface hit in `overlay` is a skin interval
 * `human.skin.<chain>/<k>` (or its `human.cavity.` pocket), the click names
 * the curves that shape it, as the inspection round traces a ripple: the
 * sections `<chain>/<k>` and `<chain>/<k+1>` that exist, `<chain>/trim` when
 * one of them does not (a strip, the interval beyond its rooted section), and
 * `<chain>/axis`.
 *
 * @param parts The built model's parts by id.
 * @param pass Displayed pass; the surface pass picks nothing.
 * @param camera Camera the coordinate belongs to.
 * @param pointer Pointer position in normalized device coordinates.
 * @param pixel Size of one pixel in normalized device units, per axis.
 * @returns The curve ids, or null when nothing is near.
 *
 * @evidence contracts/common.md#principled-implementation Raycasts the displayed (possibly thickened) curve meshes and the visible surface with the same see-through rule the styling uses, then maps a skin interval to its shaping curves by the lofting rule resolveHumanCurves applies, so a click picks what is drawn there.
 * @evidence contracts/common.md#clear-and-simple-design A pure function of the built parts and the view; HumanViewerModel calls it and the layout toggles the returned ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No curve id is guessed: only ids the model has are returned, hidden parts are never hit, and a miss returns null.
 * @evidence contracts/common.md#meaningful-documentation States the tolerance rings, the occlusion rule and the skin-interval rule.
 * @evidence contracts/performance.md#efficient-algorithms At most 25 rays against the construction and, in overlay, the surface, each testing bounding spheres before triangles, plus one ray for the skin fallback.
 * @evidence contracts/performance.md#reuse-equivalent-work One raycaster and one owner map serve every ray of the click.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing after the call.
 */
export function pickHumanCurves(
  parts: ReadonlyMap<string, THREE.Object3D>,
  pass: IHumanViewerPage.Pass,
  camera: THREE.Camera,
  pointer: THREE.Vector2,
  pixel: THREE.Vector2,
): string[] | null {
  if (pass === "surface") return null;
  const owners: Map<THREE.Object3D, string> = new Map();
  const construction: THREE.Object3D[] = [];
  const surface: THREE.Object3D[] = [];
  for (const [id, object] of parts) {
    if (id.startsWith(CONSTRUCTION)) construction.push(object);
    else surface.push(object);
    object.traverse((node: THREE.Object3D): void => {
      owners.set(node, id);
    });
  }
  const curve: (node: THREE.Object3D) => string = (
    node: THREE.Object3D,
  ): string => owners.get(node)!.slice(CONSTRUCTION.length);

  // The first visible surface hit along a ray.
  const ray: THREE.Raycaster = new THREE.Raycaster();
  const skin: () => THREE.Intersection | undefined = ():
    | THREE.Intersection
    | undefined => ray.intersectObjects(surface, true).find(shown);
  for (let radius: number = 0; radius <= 6; radius += 2)
    for (let step: number = 0; step < (radius === 0 ? 1 : 8); ++step) {
      const angle: number = (step / 8) * Math.PI * 2;
      ray.setFromCamera(
        new THREE.Vector2(
          pointer.x + Math.cos(angle) * radius * pixel.x,
          pointer.y + Math.sin(angle) * radius * pixel.y,
        ),
        camera,
      );
      const depth: number =
        pass === "overlay" ? (skin()?.distance ?? Infinity) : Infinity;
      const hit: THREE.Intersection | undefined = ray
        .intersectObjects(construction, true)
        .find(
          (candidate: THREE.Intersection): boolean =>
            shown(candidate) &&
            (candidate.distance < depth + 0.01 ||
              curve(candidate.object).endsWith("/axis")),
        );
      if (hit !== undefined) return [curve(hit.object)];
    }
  if (pass !== "overlay") return null;

  // No curve near: the curves shaping the skin interval under the pointer.
  ray.setFromCamera(pointer, camera);
  const under: THREE.Intersection | undefined = skin();
  const id: string | undefined =
    under === undefined ? undefined : owners.get(under.object);
  const prefix: string | undefined = SKIN.find(
    (p: string): boolean => id?.startsWith(p) === true,
  );
  if (id === undefined || prefix === undefined) return null;
  const interval: string = id.slice(prefix.length);
  const slash: number = interval.lastIndexOf("/");
  const chain: string = interval.slice(0, slash);
  const k: string = interval.slice(slash + 1);
  if (!/^-?\d+$/.test(k)) return null;
  const has: (name: string) => boolean = (name: string): boolean =>
    parts.has(CONSTRUCTION + name);
  const sections: string[] = [Number(k), Number(k) + 1]
    .map((j: number): string => chain + "/" + j)
    .filter(has);
  const picked: string[] = [
    ...sections,
    ...(sections.length < 2 && has(chain + "/trim") ? [chain + "/trim"] : []),
    ...(has(chain + "/axis") ? [chain + "/axis"] : []),
  ];
  return picked.length === 0 ? null : picked;
}

/** Whether an intersected object and all its ancestors are visible. */
function shown(hit: THREE.Intersection): boolean {
  for (
    let node: THREE.Object3D | null = hit.object;
    node !== null;
    node = node.parent
  )
    if (!node.visible) return false;
  return true;
}
