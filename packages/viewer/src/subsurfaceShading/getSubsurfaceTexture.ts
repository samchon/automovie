import * as THREE from "three";
import { AutoMovieEnvironmentTextureOwnership } from "../AutoMovieEnvironmentTextureOwnership.js";
import { subsurfaceTable } from "./subsurfaceTable.js";
import { SUBSURFACE_TEXTURE_SIZE } from "./SUBSURFACE_TEXTURE_SIZE.js";
const { cosines: COSINES, blurs: BLURS }: typeof SUBSURFACE_TEXTURE_SIZE = SUBSURFACE_TEXTURE_SIZE;

let shared: THREE.DataTexture | null = null;
/**
 * Return the module-shared 64-by-32 red half-float subsurface lookup wrapper. Consumers borrow its immutable sampling/content state; module retention has no explicit final disposal boundary.
 *
 * @evidence contracts/common.md#principled-implementation Builds numerical quadrature once, packs each entry through Three toHalfFloat and configures linear/clamped red sampling; material ownership registration prevents reuse as an exclusive environment wrapper.
 * @evidence contracts/common.md#clear-and-simple-design One lazy texture owner publishes the lookup consumed by material uniforms without a per-material table allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses the supported DataTexture interface and real role registration; half-float packing is approximate and sharing does not prove renderer upload or physical native lifetime.
 * @evidence contracts/common.md#meaningful-documentation Documents dimensions, storage representation, immutable borrowing and missing module-retirement protocol.
 * @evidence contracts/performance.md#efficient-algorithms First call incurs table quadrature and O(C*B) half packing; later calls return the same wrapper in constant work, retaining C*B half components.
 * @evidence contracts/performance.md#reuse-equivalent-work Fixed cosine/blur grid and shader sampling make completed lookup data equivalent across materials; mutating the shared wrapper violates this premise and there is no invalidation/rebuild owner.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module strongly retains one wrapper and its 4096-byte Uint16 data array; renderer-specific native uploads may be multiple and are not bounded or retired by this accessor.
 */
export function getSubsurfaceTexture(): THREE.DataTexture {
  if (shared !== null) return shared;
  const table: number[][] = subsurfaceTable();
  const data: Uint16Array = new Uint16Array(COSINES * BLURS);
  table.forEach((row: number[], j: number): void =>
    row.forEach((value: number, i: number): void => {
      data[j * COSINES + i] = THREE.DataUtils.toHalfFloat(value);
    }),
  );
  const texture: THREE.DataTexture = new THREE.DataTexture(
    data,
    COSINES,
    BLURS,
    THREE.RedFormat,
    THREE.HalfFloatType,
  );
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.needsUpdate = true;
  AutoMovieEnvironmentTextureOwnership.material(texture);
  shared = texture;
  return texture;
}
