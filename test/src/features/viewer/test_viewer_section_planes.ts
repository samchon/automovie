import {
  IAutoMovieSectionPlane,
  autoMovieSectionPlanesKeepPoint,
} from "@automovie/engine";
import { applyAutoMovieSectionPlanes } from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { nclose } from "../internal/predicates";

/** A horizontal cut at y = 3 removing everything above it. */
const CEILING: IAutoMovieSectionPlane = {
  point: { x: 0, y: 3, z: 0 },
  normal: { x: 0, y: 2, z: 0 },
};

/** A vertical cut at x = 0 removing everything west of it. */
const WEST_WALL: IAutoMovieSectionPlane = {
  point: { x: 0, y: 0, z: 0 },
  normal: { x: -1, y: 0, z: 0 },
};

const scene: () => {
  root: THREE.Scene;
  single: THREE.MeshStandardMaterial;
  multi: THREE.MeshStandardMaterial[];
} = (): {
  root: THREE.Scene;
  single: THREE.MeshStandardMaterial;
  multi: THREE.MeshStandardMaterial[];
} => {
  const root: THREE.Scene<THREE.Object3DEventMap> = new THREE.Scene();
  const single: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial();
  const multi: THREE.MeshStandardMaterial[] = [
    new THREE.MeshStandardMaterial(),
    new THREE.MeshStandardMaterial(),
  ];
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), single));
  root.add(new THREE.Mesh(new THREE.BoxGeometry(), multi));
  // A material-less child must be skipped during clipping assignment.
  root.add(new THREE.Group());
  return { root, single, multi };
};

const materialsOf: (root: THREE.Object3D) => THREE.Material[] = (
  root: THREE.Object3D,
): THREE.Material[] => {
  const found: THREE.Material[] = [];
  root.traverse((object: THREE.Object3D<THREE.Object3DEventMap>): void => {
    const holder: { material?: THREE.Material | THREE.Material[] } = object as {
      material?: THREE.Material | THREE.Material[];
    };
    if (holder.material === undefined) return;
    for (const material of Array.isArray(holder.material)
      ? holder.material
      : [holder.material])
      found.push(material);
  });
  return found;
};

/**
 * Section planes install native clipping state whose signed half-space agrees with the Engine's numerical point predicate.
 *
 * The declaration points toward the removed half-space, while the native plane retains its positive side. Negating the normal must preserve below/on/above membership, including the boundary's zero signed distance. This unit observes CPU-side planes and material version changes, without a raster oracle.
 *
 * With the removed half above y=3, the expected plane has normal (0,-1,0), constant 3 and signed distance 3-y. These literal geometric values are independent of the plane builder.
 *
 * Scenarios:
 *
 * 1. One plane enables local clipping and shares its plane array across scalar and array materials with clipIntersection false; a material-less child is skipped.
 * 2. The normalized negated normal and signed distance agree with Engine membership below, above and on the cut.
 * 3. A non-unit declared normal yields the same normalized plane.
 * 4. A changed plane count advances material version, while the same count leaves it unchanged. Version is observed rather than the write-only needsUpdate setter; actual native program compilation is not counted.
 * 5. Two planes preserve declaration order and advance version for the changed count.
 * 6. An empty declaration clears material planes to null and disables local clipping; pixel equality with an earlier frame is not asserted.
 *
 * @evidence contracts/testing.md#behavioral-verification Applies and releases actual section planes on scalar/array native material populations and reads plane signs, identity and version counters; catches reversed halfspaces, skipped material slots and recompilation requested for value-only movement.
 * @evidence contracts/testing.md#independent-expectations Hand geometry gives ceiling distance 3-y and the negated west normal; Engine keep-point is the canonical boundary reference. Plane-count changes define version increments, while CPU signs/version counters do not prove GPU fragment precision or pixel equality.
 * @evidence contracts/testing.md#distinguishing-cases Covers below/on/above boundaries, nonunit normal, material-less child, scalar/array materials, unchanged/changed count and empty release; arbitrary prior clipping policy and native capture are outside this owner.
 * @evidence contracts/testing.md#execution-ownership This named portable unit invokes maintained Engine/Viewer source with real CPU-side planes/materials and a supplied clipping flag, acquiring no renderer, browser, GPU or process.
 */
export function test_viewer_section_planes(): void {
  // 1. one plane reaches every material, and only the ones that exist
  const first: {
    root: THREE.Scene;
    single: THREE.MeshStandardMaterial;
    multi: THREE.MeshStandardMaterial[];
  } = scene();
  const renderer: { localClippingEnabled: boolean } = {
    localClippingEnabled: false,
  };
  const built: THREE.Plane[] = applyAutoMovieSectionPlanes({
    renderer,
    root: first.root,
    planes: [CEILING],
  });
  TestValidator.equals(
    "one declared plane switches local clipping on",
    renderer.localClippingEnabled,
    true,
  );
  TestValidator.equals("one declared plane builds one", built.length, 1);
  const materials: THREE.Material<THREE.MaterialEventMap>[] = materialsOf(
    first.root,
  );
  TestValidator.equals(
    "every mesh material in the subtree is reached",
    materials.length,
    3,
  );
  TestValidator.predicate(
    "every material holds that exact plane array, intersecting",
    materials.every(
      (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
        material.clippingPlanes === built &&
        material.clipIntersection === false,
    ),
  );

  // 2. the convention: negated normal, and agreement at the boundary
  const plane: THREE.Plane = built[0]!;
  TestValidator.predicate(
    "the runtime plane carries the negated, unit normal",
    nclose(plane.normal.x, 0) &&
      nclose(plane.normal.y, -1) &&
      nclose(plane.normal.z, 0),
  );
  for (const [label, y] of [
    ["under", 2],
    ["on", 3],
    ["over", 4],
  ] as const)
    TestValidator.equals(
      `renderer and engine agree ${label} the cut`,
      plane.distanceToPoint(new THREE.Vector3(0, y, 0)) >= 0,
      autoMovieSectionPlanesKeepPoint([CEILING], { x: 0, y, z: 0 }),
    );

  // 3. a non-unit declared normal still lands unit, at the same place
  TestValidator.predicate(
    "a length-2 declared normal produces the same unit plane",
    nclose(plane.constant, 3),
  );

  // 4. Material version advances only when the plane count changes.
  TestValidator.predicate(
    "taking a section marks every material for recompile",
    materials.every(
      (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
        material.version === 1,
    ),
  );
  applyAutoMovieSectionPlanes({
    renderer,
    root: first.root,
    planes: [{ ...CEILING, point: { x: 0, y: 1, z: 0 } }],
  });
  TestValidator.predicate(
    "sliding a cut of the same count leaves material versions unchanged",
    materials.every(
      (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
        material.version === 1,
    ),
  );

  // 5. Two planes preserve order and advance material version.
  const pair: THREE.Plane[] = applyAutoMovieSectionPlanes({
    renderer,
    root: first.root,
    planes: [CEILING, WEST_WALL],
  });
  TestValidator.equals("two declared planes build two", pair.length, 2);
  TestValidator.predicate(
    "the second runtime plane is the negated west normal",
    nclose(pair[1]!.normal.x, 1) && nclose(pair[1]!.constant, 0),
  );
  TestValidator.predicate(
    "a changed count marks every material for recompile",
    materials.every(
      (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
        material.version === 2,
    ),
  );

  // 6. releasing the section restores the uncut scene
  const released: THREE.Plane[] = applyAutoMovieSectionPlanes({
    renderer,
    root: first.root,
    planes: [],
  });
  TestValidator.equals("releasing builds no plane", released.length, 0);
  TestValidator.equals(
    "releasing switches local clipping off",
    renderer.localClippingEnabled,
    false,
  );
  TestValidator.predicate(
    "every material is back to no clipping planes",
    materials.every(
      (material: THREE.Material<THREE.MaterialEventMap>): boolean =>
        material.clippingPlanes === null,
    ),
  );
}
