import type * as THREE from "three";

import { AutoMovieThreeKind } from "../AutoMovieThreeKind.js";

/**
 * Read a geometry attribute that owns its own array, as positions, normals,
 * colours and skin channels this package builds or updates do.
 *
 * @param geometry The geometry holding the attribute.
 * @param name The attribute's name.
 * @returns The attribute.
 * @throws {Error} When the geometry has no such attribute, or it reads an
 *   interleaved buffer it does not own.
 */
export function readAutoMovieBufferAttribute(
  geometry: THREE.BufferGeometry,
  name: string,
): THREE.BufferAttribute {
  const attribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    geometry.getAttribute(name);
  if (
    attribute === undefined ||
    !AutoMovieThreeKind.isBufferAttribute(attribute)
  )
    throw new Error(
      `Geometry attribute "${name}" must be a buffer attribute owning its array`,
    );
  return attribute;
}
