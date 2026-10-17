import { Bone } from "./Bone.ts";
import { V3 } from "./V3.ts";

/**
 * Private source mesh with explicit rest and optional diagnostic pose matrices.
 *
 * @evidence contracts/common.md#principled-implementation A structural Mesh declaration exposes its documented geometric or observation quantities without runtime conversion.
 * @evidence contracts/common.md#clear-and-simple-design This file owns only the named data boundary; computation remains in its explicit producers and consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The declaration is erased and contains no specimen-specific geometry or executable fallback.
 * @evidence contracts/common.md#meaningful-documentation Describes the quantity, private-data boundary or physical frame needed to interpret its members.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This erased data declaration chooses no runtime algorithm, cache or resource lifetime.
 *
 * @author Samchon
 */
export interface Mesh {
  /** Source positions in the admitted common Cartesian frame and length units. */
  vertices: V3[];
  /** Oriented source triangle vertex addresses; these remain private comparison data. */
  triangles: [number, number, number][];
  /** Per-vertex bone-index/weight pairs when supplied; source normalization needs separate qualification. */
  weights?: [number, number][][];
  /** Source rig channels in their declared array order. */
  bones: Bone[];
  /** Name lookup onto the same source channels without anatomical relabeling. */
  boneByName: Map<string, Bone>;
  /** Row-major global affine matrices in the same frame and units as the vertices. */
  restM: number[][][];
  /** Optional row-major diagnostic global matrices, indexed in the same bone order. */
  posedM?: number[][][];
}
