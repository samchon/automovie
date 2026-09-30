import { IAutoMovieMesh } from "@automovie/interface";

/**
 * An independent interior before metric model packing. Its producer transfers
 * newly owned mesh buffers in the shared head frame, retaining native indices
 * and normals valid for those positions. Changing positions invalidates derived
 * normals; this descriptor does not declare fixed/free tissue or closed-skin
 * seam aliases. Explicit interior attachments retain their own native pairs.
 *
 * @evidence contracts/common.md#principled-implementation An interior is a stable part id, a palette material, a fresh head-space mesh and optional named loops and exact vertex attachments, so joins are declared and admitted (assertPortraitInteriorBindings) instead of discovered from coincident coordinates.
 * @evidence contracts/common.md#clear-and-simple-design Five members, three of them optional declarations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts IPortraitInterior carries no behaviour, special case or compensating path; it is a declaration.
 * @evidence contracts/common.md#meaningful-documentation States buffer ownership, that changing positions invalidates normals, the loop and attachment rules and what the descriptor does not declare.
 * @evidence contracts/modeling.md#part-identity-and-grouping One interior is one part with its own model-part identity, produced by its component and never merged with another.
 * @evidence contracts/modeling.md#shared-boundaries Attachments name resident vertex pairs of skin or another interior and loops name directed cycles; the head admits them together before packing, so both sides of a join come from one declaration.
 * @evidence contracts/modeling.md#spatial-conventions Head-space millimetres until model packing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source IPortraitInterior carries no anatomical value, range, proportion, landmark or tissue behaviour.
 * @evidenceExclude contracts/anatomy.md#permitted-range IPortraitInterior admits, bounds and combines no anatomical value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority IPortraitInterior defines no input through which a caller shapes a human form.
 * @evidenceExclude contracts/modeling.md#parameter-channels IPortraitInterior defines and consumes no parameter channel of a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry IPortraitInterior emits no primitive.
 * @evidenceExclude contracts/modeling.md#rendered-observation IPortraitInterior owns no part, group or joint that a viewer displays; the parts built with it are observed by their owners.
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
