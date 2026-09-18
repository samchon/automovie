import { IAutoMovieProductionDeliverableFile } from "./IAutoMovieProductionDeliverableFile";
import { IAutoMovieProductionMediaProbe } from "./IAutoMovieProductionMediaProbe";

/**
 * One file record independently derived by the renderer-owned receipt gate.
 *
 * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-missing-artifact-refusal Records the exact byte population needed to refuse incomplete delivery.
 * @evidence specifications/validation-and-diagnostics/partial-artifacts-and-refusal.md#validation-resume-verified-artifacts Supplies independently verified file facts for reuse.
 */
export interface IAutoMovieProductionRenderReceiptFile extends IAutoMovieProductionDeliverableFile {
  /**
   * Deliverable that exclusively owns this path.
   *
   * @evidence requirements/production-design/continuity-change-and-deliverables.md#production-design-deliverable-provenance Preserves ownership of each delivered byte.
   * @evidence specifications/editorial-render-and-delivery/delivery-package-provenance-and-publication.md#spec-delivery-provenance-integrity Joins each receipt row to its deliverable.
   */
  deliverable: string;
  /**
   * Parser-derived media facts.
   *
   * @evidence requirements/rendering/scope-and-artifact-identity.md#rendering-missing-artifact-refusal Requires parser-derived facts, not mere path existence.
   * @evidence specifications/validation-and-diagnostics/partial-artifacts-and-refusal.md#validation-resume-verified-artifacts Supplies facts used to admit verified reuse.
   */
  probe: IAutoMovieProductionMediaProbe;
}
