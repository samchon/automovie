import type { IHumanFaceDynamicCollider } from "../../basis/IHumanFaceDynamicCollider";
import type { IAutoMovieHumanFaceOralCrownSupport } from "../../structures/IAutoMovieHumanFaceOralCrownSupport";
import type { IHumanFaceOralPart } from "./IHumanFaceOralPart";

/** Shared generated oral surfaces and their original resident replacement.
 *
 * @author Samchon
 */
export interface IHumanFaceOralAssembly {
  /** Source-generation domain for generated physical points. */
  generation: string;
  /** Native dental fingerprint domain, independent of skin partition IDs. */
  dentalNativeSha256: string;
  /** Source render/query owner replaced by this complete dental assembly. */
  dentalSurface: string;
  /** All original dental vertices whose resident render geometry is replaced. */
  replacedDentalVertices: ReadonlySet<number>;
  /** Exact generated parts; the finish owner must not regenerate their points. */
  parts: IHumanFaceOralPart[];
  /** Free edges still longer than cervical spacing or joining two unsampled cervical ports, counted once; the connected builder's oral-sampling admission refuses a nonzero residual. */
  liningUnresolvedEdges?: number;
  /** Dental vertices whose crown geometry is intentionally absent. */
  absentDentalVertices: ReadonlySet<number>;
  /** Exact closed source crowns and two complete arch sheets in common rest/performed states. */
  colliders?: readonly IHumanFaceDynamicCollider[];
  /** Actual present crowns only, with source numerical closures and stable incidence. */
  dentalColliders?: readonly IHumanFaceDynamicCollider[];
  /** Permanent ISO identity of each entry of `dentalColliders`, in the same order, so a relation can name the crown it reads. */
  dentalColliderIds?: readonly IAutoMovieHumanFaceOralCrownSupport["id"][];
}
