import { IAutoMovieMesh } from "@automovie/interface";

/**
 * An independent interior before metric model packing. Its producer transfers
 * newly owned mesh buffers in the shared head frame, retaining native indices
 * and normals valid for those positions. Changing positions invalidates derived
 * normals; this descriptor does not declare fixed/free tissue or closed-skin
 * seam aliases. Explicit interior attachments retain their own native pairs.
 *
 * @author Samchon
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Carries a component-owned anatomical interior and its finish before model construction.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Keeps native interior geometry in head millimetres until the single metric model boundary.
 */
export interface IPortraitInterior {
  /** Stable model-part identity, retained when the mesh is finally packed. */
  id: string;

  /** Existing palette identity; preparation does not create a material. */
  material: string;

  /** Fresh, placed head-space mesh in millimetres, with its native connectivity. */
  mesh: IAutoMovieMesh;

  /**
   * Component-owned directed cycles, such as a crown's cervical cap boundary.
   * Names are unique within this interior. Each cycle contains distinct native
   * vertices, omits its repeated closing vertex and follows actual mesh edges.
   * A cycle may have faces on both sides; it need not be a free boundary.
   */
  loops?: readonly { name: string; vertices: readonly number[] }[];

  /**
   * Exact native vertex identity shared with skin (part=null) or another named
   * interior. Equal XYZ alone never declares a join. The head admits these
   * resident pairs before packing; their coordinates must already agree in mm.
   * Fixed/free mechanics and closed-skin aliases have separate owners.
   */
  attachments?: readonly {
    vertex: number;
    target: { part: string | null; vertex: number };
  }[];
}
