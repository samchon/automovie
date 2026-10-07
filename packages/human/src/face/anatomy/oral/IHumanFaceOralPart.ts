import type { IAutoMovieMesh } from "@automovie/interface";

/** One shared head-frame oral surface before its single rigid jaw owner acts.
 *
 * @author Samchon
 */
export interface IHumanFaceOralPart {
  /** Stable generated member identity, independent of the source material. */
  id: string;
  /** Enamel retains source UV artwork; other roles share source gingival pigment. */
  materialRole: "enamel" | "gingiva" | "palate" | "floor" | "wall";
  /** Existing rigid source owner, or already performed final soft-wall coordinates. */
  owner: "head" | "jaw" | "performed";
  /** Actual source-frame mesh consumed by drawing and contact. */
  mesh: IAutoMovieMesh;
  /** Stable shared identities, including native cervical aliases. */
  physicalPoints: string[];
}
