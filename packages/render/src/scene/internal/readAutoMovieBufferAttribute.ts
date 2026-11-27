import type * as THREE from "three";

import { AutoMovieRenderThreeKind } from "../AutoMovieRenderThreeKind.js";

/*
 * Read a geometry attribute that owns its own array, as positions, normals,
 * colours and skin channels this package builds or updates do.
 * Parameter geometry: The geometry holding the attribute.
 * Parameter name: The attribute's name.
 * Returns: The attribute.
 * When the geometry has no such attribute, or it reads an
 * interleaved buffer it does not own.
 */
export function readAutoMovieBufferAttribute(
  geometry: THREE.BufferGeometry,
  name: string,
): THREE.BufferAttribute {
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute(name);
  if (
    attribute === undefined ||
    !AutoMovieRenderThreeKind.isBufferAttribute(attribute)
  )
    throw new Error(
      `Geometry attribute "${name}" must be a buffer attribute owning its array`,
    );
  return attribute;
}
