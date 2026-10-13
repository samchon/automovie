import type { IHumanExactFractionJson } from "../../common/measure/IHumanExactFractionJson";
import type { IAutoMovieHumanFaceAttachmentChart } from "./IAutoMovieHumanFaceAttachmentChart";
import type { IAutoMovieHumanFaceAttachmentPoint } from "./IAutoMovieHumanFaceAttachmentPoint";

/** Continuous source-authored interior contact trajectory on native facets.
 * Material coordinates locate the source; the actual performed interpolation
 * owns metres, along and height. Persisted exact weights retain correspondence
 * while represented weights use the canonical engine interpolation unchanged.
 *
 * @evidence contracts/common.md#principled-implementation Exact reduced source weights and canonical parent identities preserve material correspondence; the reader converts each weight once and calls the engine's original parent-order interpolation on performed points.
 * @evidence contracts/common.md#clear-and-simple-design Chart seats, represented coefficients, exact provenance, optional native vertices and ordered stops have distinct ownership rather than being collapsed into fabricated resident vertices.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The margin reader checks same-layout points, exact unit weight sums, represented equality, source identities and native-vertex claims; registration still does not establish performed contact or a biological trajectory.
 * @evidence contracts/common.md#meaningful-documentation Source coordinates and exact provenance are separate from performed metric interpolation, including null native vertices for interior seats.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This record performs no exact-fraction decoding or interpolation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Immutable source identities are data, not a performed-point memoization mechanism here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Caller-owned point/provenance arrays create no skin query or contact resources.
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
