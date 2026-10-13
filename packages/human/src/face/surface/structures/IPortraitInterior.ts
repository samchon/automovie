import type { IAutoMovieMesh } from "@automovie/interface";

/**
 * An independent interior before metric model packing. Its producer transfers newly owned mesh buffers in the shared head frame, retaining native indices and normals valid for those positions. Changing positions invalidates derived normals; this descriptor does not declare fixed/free tissue or closed-skin seam aliases. Explicit interior attachments retain their own native pairs.
 *
 * @evidence contracts/common.md#principled-implementation Fresh native millimetre mesh buffers retain explicit directed loops and resident skin/interior attachment pairs until complete cross-part admission and metric packing.
 * @evidence contracts/common.md#clear-and-simple-design Geometry, palette identity and optional declared joins remain with their component producer; the head resolves the complete interior population before packing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal XYZ alone discovers no join, named loops need not be free boundaries, and exact C0 admission does not certify tissue mechanics or a manifold union.
 * @evidence contracts/common.md#meaningful-documentation Members state native units/ownership, stable part/material IDs, loop uniqueness/direction and null-skin versus named-interior addressing.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The descriptor performs no directed-edge scan, attachment comparison or metric packing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Stable interior identity declares no generated-mesh cache; native producers and the head choose actual evaluation paths.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This schema acquires no mesh buffers or palette resources; the producer transfers actual owned interiors to the head build.
 * @author Samchon
 */
export interface IPortraitInterior {
  /** Stable model-part identity, retained when the mesh is finally packed. */
  id: string;

  /** Existing palette identity; preparation does not create a material. */
  material: string;

  /** Fresh, placed head-space mesh in millimetres, with its native connectivity. */
  mesh: IAutoMovieMesh;

  /**
   * Component-owned directed cycles, such as a crown's cervical cap boundary. Names are unique within this interior. Each cycle contains distinct native vertices, omits its repeated closing vertex and follows actual mesh edges. A cycle may have faces on both sides; it need not be a free boundary.
   */
  loops?: readonly { name: string; vertices: readonly number[] }[];

  /**
   * Exact native vertex identity shared with skin (part=null) or another named interior. Equal XYZ alone never declares a join. The head admits these resident pairs before packing; their coordinates must already agree in mm. Fixed/free mechanics and closed-skin aliases have separate owners.
   */
  attachments?: readonly {
    vertex: number;
    target: { part: string | null; vertex: number };
  }[];
}
