import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";

/**
 * One actual ribbon or terminal-shaft mesh in the person's shared metre frame.
 *
 * @evidence contracts/common.md#principled-implementation Placed hair vertices and their oriented triangles share the person's metre frame; optional geometry-owned layouts distinguish terminal shafts from legacy paired ribbons.
 * @evidence contracts/common.md#clear-and-simple-design Contact receives actual mesh topology and station layout without depending on the whole face model or hair document.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The legacy ribbon interpretation is explicit when layout is omitted; terminal shafts require their producer's layout instead of an inferred pair workaround.
 * @evidence contracts/common.md#meaningful-documentation Documentation states pre-contact placement, oriented indices and the optional layout's station membership and requested gap.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The hair operand chooses no collision query or station traversal; the person contact stage owns both.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Read-only topology and layout are per-part operands; this declaration shares no contact query across requests.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Contact meshes borrow positions and triangles without acquiring a signed-mesh query or mutable output array.
 *
 * @author Samchon
 */
export interface IHumanPersonHairContactMesh {
  /** Flat XYZ vertices after head placement, before body contact. */
  readonly positions: readonly number[];

  /** Oriented triangle indices into the same vertex population. */
  readonly indices: readonly number[];

  /**
   * Geometry-owned actual station membership and this part's requested gap. Omission retains the legacy ribbon-only interpretation; a terminal shaft must carry its producer's layout instead of being interpreted as pairs.
   */
  readonly layout?: IHumanFaceHairContactLayout;
}
