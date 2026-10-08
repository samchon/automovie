import type { IAutoMovieMeshSeparationAttachment } from "@automovie/engine";

import type { IHumanFaceHairContactStation } from "./IHumanFaceHairContactStation";

/**
 * Ordered actual geometry stations and their immutable native root registration.
 *
 * @evidence contracts/common.md#principled-implementation The emitting curve retains the original root triangle, barycentric weights and complete source support beside its stations.
 * @evidence contracts/common.md#clear-and-simple-design One ordered strand record preserves root-to-tip membership for assembly.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Head triangle ordinals are not interpreted as Body query addresses.
 * @evidence contracts/common.md#meaningful-documentation Separates native attachment identity and generated station ordinals.
 * @evidence contracts/modeling.md#shared-boundaries The same source root identifies the stationary attachment of the emitted strand.
 * @author Samchon
 */
export interface IHumanFaceHairContactCurve {
  /** Native source triangle, ordered barycentric weights and complete incident support. */
  attachment: IAutoMovieMeshSeparationAttachment;

  /** Root-to-tip station membership emitted by the representation owner. */
  stations: readonly IHumanFaceHairContactStation[];
}
