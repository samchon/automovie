import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IAutoMovieHumanFaceBasis } from "../../structures/IAutoMovieHumanFaceBasis";
import type { IHumanFaceOralAssembly } from "./IHumanFaceOralAssembly";

/** Actual geometry inputs for tooth-presence-independent oral passage.
 *
 * @author Samchon
 */
export interface IHumanFaceOralPassageProps {
  /** Source contact ports, tongue connectivity and unchanged geometric tolerance. */
  basis: IAutoMovieHumanFaceBasis;
  /** Same present-crown query geometry used by the contact owner. */
  assembly: IHumanFaceOralAssembly;
  /** Shape-only source reference, with independent tongue performance omitted. */
  reference: ReadonlyMap<string, readonly number[]>;
  /** Actual final contact-corrected source arrays; absent teeth are not read. */
  positions: ReadonlyMap<string, readonly number[]>;
  /** Source jaw-axis-derived unit opening direction. */
  up: IAutoMovieVector3;
  /** Source jaw-axis-derived unit anterior direction. */
  forward: IAutoMovieVector3;
}
