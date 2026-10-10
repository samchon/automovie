import type { IAutoMovieMeshSeparationAttachment } from "@automovie/engine";

import type { IHumanFaceHairContactStation } from "./IHumanFaceHairContactStation";

/**
 * Ordered actual geometry stations and their immutable native root registration.
 *
 * @author Samchon
 */
export interface IHumanFaceHairContactCurve {
  /** Native source triangle, ordered barycentric weights and complete incident support. */
  attachment: IAutoMovieMeshSeparationAttachment;

  /** Root-to-tip station membership emitted by the representation owner. */
  stations: readonly IHumanFaceHairContactStation[];
}
