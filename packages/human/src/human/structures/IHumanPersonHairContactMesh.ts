import type { IHumanFaceHairContactLayout } from "../../face/anatomy/hair/IHumanFaceHairContactLayout";

/**
 * One actual ribbon or terminal-shaft mesh in the person's shared metre frame.
 *
 * @author Samchon
 */
export interface IHumanPersonHairContactMesh {
  /** Flat XYZ vertices after head placement, before body contact. */
  readonly positions: readonly number[];

  /** Oriented triangle indices into the same vertex population. */
  readonly indices: readonly number[];

  /**
   * Geometry-owned actual station membership and this part's requested gap.
   * Omission retains the legacy ribbon-only interpretation; a terminal shaft
   * must carry its producer's layout instead of being interpreted as pairs.
   */
  readonly layout?: IHumanFaceHairContactLayout;
}
