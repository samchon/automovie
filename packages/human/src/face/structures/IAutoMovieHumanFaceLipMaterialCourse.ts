import type { IHumanExactFractionJson } from "../../common/measure/IHumanExactFractionJson";
import type { IAutoMovieHumanFaceAttachmentChart } from "./IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/** Continuous source-authored interior contact trajectory on native facets.
 * Material coordinates locate the source; the actual performed interpolation
 * owns metres, along and height. Persisted exact weights retain correspondence
 * while represented weights use the canonical engine interpolation unchanged.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceLipMaterialCourse {
  /** Same-generation positive native source disk. */
  chart: IAutoMovieHumanFaceAttachmentChart;

  /** Canonical represented attachment interpolation coefficients. */
  points: IAutoMovieHumanFaceAttachmentPoint[];

  /** Original reduced weights; represented coefficients round once from these. */
  exactWeights: IHumanExactFractionJson[][];

  /** Canonical source-parent/weight identities, independent of coordinates. */
  identities: string[];

  /** Exact original vertex, or null for a facet/edge point. */
  nativeVertices: (number | null)[];

  /** Original stop indices in the ordered point table. */
  stops: number[];
}
