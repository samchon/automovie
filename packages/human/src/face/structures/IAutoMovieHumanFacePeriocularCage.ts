import type { IAutoMovieHumanFacePeriocularMedialBed } from "./IAutoMovieHumanFacePeriocularMedialBed";
import type { IAutoMovieHumanFacePeriocularStation } from "./IAutoMovieHumanFacePeriocularStation";
import type { IAutoMovieHumanFacePeriocularTarsalExtent } from "./IAutoMovieHumanFacePeriocularTarsalExtent";
import type { IAutoMovieHumanFacePeriocularAttachmentCharts } from "./IAutoMovieHumanFacePeriocularAttachmentCharts";
import type { IAutoMovieHumanFacePeriocularDisplacementPatch } from "./IAutoMovieHumanFacePeriocularDisplacementPatch";

/**
 * Shared licensed skin cage for coarse lid sections and attached tissue shells.
 * Each vertex follows the host's existing shape endpoints, pose refinement and
 * contact exactly; no second target or globe rotation acts on the cage. Source
 * publishing owns correspondence and row orientation. Tissue role assignments
 * remain authored conventions until independently qualified.
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
