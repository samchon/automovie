import type { IAutoMovieHumanFacePeriocularAttachmentCharts } from "./IAutoMovieHumanFacePeriocularAttachmentCharts";
import type { IAutoMovieHumanFacePeriocularDisplacementPatch } from "./IAutoMovieHumanFacePeriocularDisplacementPatch";
import type { IAutoMovieHumanFacePeriocularMedialBed } from "./IAutoMovieHumanFacePeriocularMedialBed";
import type { IAutoMovieHumanFacePeriocularStation } from "./IAutoMovieHumanFacePeriocularStation";
import type { IAutoMovieHumanFacePeriocularTarsalExtent } from "./IAutoMovieHumanFacePeriocularTarsalExtent";

/**
 * Shared licensed skin cage for coarse lid sections and attached tissue shells.
 * Each vertex follows the host's existing shape endpoints, pose refinement and
 * contact exactly; no second target or globe rotation acts on the cage. Source
 * publishing owns correspondence and row orientation. Tissue role assignments
 * remain authored conventions until independently qualified.
 *
 * @evidence contracts/common.md#principled-implementation assertHumanFacePeriocularCage matches each resident station vertex to its canonical source sample and same-generation skin owner; section, seating and tissue consumers reuse those rows rather than another eye target or transform.
 * @evidence contracts/common.md#clear-and-simple-design Closed station rows, upper/lower column halves and optional tarsal/medial/chart/displacement owners separate source topology from independent authored tissue dimensions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching labels alone is insufficient: rows and halves require exact unique correspondence and shared canthi. Native receipts and eligibility roles remain publisher-qualified, and registration does not guarantee performed injectivity, tissue mechanics or clearance.
 * @evidence contracts/common.md#meaningful-documentation Every frame/index domain and optional omission is stated, including source display finish and authored versus observed eligibility.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The cage schema performs no source validation, lid displacement or shell construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Source sample identity enables consumer alias transport but implements no evaluated-pose cache here.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Publisher arrays and nested registrations acquire no skin buffer, Laplacian solver or emitted tissues.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFacePeriocularCage {
  /** Stable source receipt identity, independent of a person's document. */
  sourceId: string;

  /** Must equal the host source partition and periocular generation. */
  generation: string;

  /** Actual runtime coordinates; native conversion belongs to the publisher. */
  frame: "head-metres-y-up-z-anterior";

  /** Skin surface that owns every station and its endpoint transport. */
  surface: string;

  /** Registered host finish used as a coarse display convention, not tissue pigmentation. */
  material: string;

  /** Raw source and cage receipt SHA-256 values. */
  sourceSha256: string[];

  /** Corresponding closed rows, inner to outer, with no repeated seam vertex. */
  stations: IAutoMovieHumanFacePeriocularStation[];

  /** Closed row column at the medial join. */
  medialColumn: number;

  /** Closed row column at the lateral join. */
  lateralColumn: number;

  /** Upper columns, ordered medial to lateral and including both joins. */
  upperColumns: number[];

  /** Lower columns, ordered medial to lateral and including both joins. */
  lowerColumns: number[];

  /** Optional qualified ciliated columns restrict shaft roots to adjacent eligible segments. Omission preserves the anterior row's authored geometric domain and claims no biological eligibility. */
  ciliatedColumns?: number[];

  /** Eligibility qualification must not imply a measured follicle population. */
  ciliatedQualification?: "authoredConvention" | "sourceObserved";

  /** Optional source-authored connective sheet across the margin's exposed opening, outside actual optics. */
  canthalSupport?: "registered-rim-ruled-sheet";

  /** Optional registered far borders of the tarsal plates on the ocular surface. Omission bounds each plate by its skin station. */
  tarsalExtent?: IAutoMovieHumanFacePeriocularTarsalExtent;

  /** Optional registered medial canthal bed. Omission leaves the lid frame owner's authored bed length in force. */
  medialBed?: IAutoMovieHumanFacePeriocularMedialBed;

  /** Source-compiled material disks; omission provides no injective attachment chart. */
  attachmentCharts?: IAutoMovieHumanFacePeriocularAttachmentCharts;

  /** Native movement annulus; omission supplies no continuous source displacement domain. */
  displacementPatch?: IAutoMovieHumanFacePeriocularDisplacementPatch;
}
