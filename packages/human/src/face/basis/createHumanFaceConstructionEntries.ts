import { admitHumanConstruction } from "../../common/basis/admitHumanConstruction";
import type { IAutoMovieHumanFaceBasisBuilder } from "../structures/IAutoMovieHumanFaceBasisBuilder";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceConstructionProgress } from "../structures/IAutoMovieHumanFaceConstructionProgress";
import type { IHumanFaceConstructionStage } from "./IHumanFaceConstructionStage";
import type { IAutoMovieModel as IAutoMovieModelImported } from "@automovie/interface";
import type { IAutoMovieHumanConstructionAdmission as IAutoMovieHumanConstructionAdmissionImported, IHumanConstructionCheck as IHumanConstructionCheckImported, IHumanFaceOralMeasurementRegistration as IHumanFaceOralMeasurementRegistrationImported } from "../../index";
import type { IAutoMovieHumanFacePeriocularMappingReport as IAutoMovieHumanFacePeriocularMappingReportImported } from "../structures/IAutoMovieHumanFacePeriocularMappingReport";
import type { IHumanFaceResidentSourceRegion as IHumanFaceResidentSourceRegionImported } from "./IHumanFaceResidentSourceRegion";
import type { IHumanFaceHairContactLayout as IHumanFaceHairContactLayoutImported } from "../anatomy/hair/IHumanFaceHairContactLayout";
import type { IHumanFaceMaterialAttachment as IHumanFaceMaterialAttachmentImported } from "../structures/IHumanFaceMaterialAttachment";


/**
 * Share one geometry stage between admitted authoring and construction inspection.
 * Both entries execute the same complete original check population. Ordinary
 * authoring throws its first retained cause before success-only publication;
 * construction returns the same geometry and all named refusals as a draft,
 * with every measured relation and part census the checks supply.
 * The optional progress observer reports actual geometry completion, each
 * original condition's completed execution and the final admission verdict.
 * Refused drafts still report their verdict; result publication remains
 * success-only. A thrown stage has no completed-stage event, and observer
 * exceptions propagate without altering any retained admission condition.
 *
 * @evidence contracts/common.md#principled-implementation Both entries evaluate the same supplied stage and original assert population through admitHumanConstruction. Ordinary builds throw a retained refusal before publish; construct returns the draft with all failures/readings and optional source mappings without promoting it to an accepted model.
 * @evidence contracts/common.md#clear-and-simple-design One stage producer separates geometry from the two existing admission/publication policies; shared admission owns check execution and failure collection instead of duplicating physical predicates here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary mode omits report callbacks only, preserving every assert. Construction gathers the original report/census rather than suppressing refusals, and progress or publication exceptions propagate instead of manufacturing success.
 * @evidence contracts/common.md#meaningful-documentation Prose states draft versus admitted behavior, success-only publication, complete check population and progress ordering including stage/observer failure effects.
 * @evidence contracts/performance.md#efficient-algorithms Each request pays one complete stage and one pass through K admission tasks with their actual measurement costs. Ordinary mode allocates K assert descriptors without report work; construct additionally pays the supplied read/census/mapping traversals.
 * @evidence contracts/performance.md#reuse-equivalent-work One current stage value serves its admission and final result; the two entry modes do not share effectful requests merely because documents match. Stage-owned caches remain with the producer, and success-only publish runs once for an accepted ordinary request.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned callable retains its stage and observer; per-request stage/check/admission objects pass to the caller or become collectible on failure. There is no retained request history, viewer task or external resource here.
 */
export function createHumanFaceConstructionEntries(
  stage: (
    document: IAutoMovieHumanFaceBasisDocument,
  ) => IHumanFaceConstructionStage,
  observe?: (progress: IAutoMovieHumanFaceConstructionProgress) => void,
): IAutoMovieHumanFaceBasisBuilder {
  const build: IAutoMovieHumanFaceBasisBuilder = Object.assign(
    (document: IAutoMovieHumanFaceBasisDocument): IAutoMovieModelImported  => {
      const current: IHumanFaceConstructionStage = stage(document);
      observe?.({
        documentId: document.id,
        basis: document.basis,
        phase: "geometry-built",
      });
      // Authoring needs the verdict only; the readings and census belong to
      // construction inspection, which takes them below.
      const admission: IAutoMovieHumanConstructionAdmissionImported = admitHumanConstruction(
        current.checks.map((check: IHumanConstructionCheckImported): { owner: string; assert: () => void; }  => ({
          owner: check.owner,
          assert: check.assert,
        })),
        (owner: string, accepted: boolean): void =>
          observe?.({
            documentId: document.id,
            basis: document.basis,
            phase: "admission-check-finished",
            checkOwner: owner,
            accepted,
          }),
      );
      observe?.({
        documentId: document.id,
        basis: document.basis,
        phase: "admission-finished",
        accepted: admission.accepted,
      });
      if (!admission.accepted) throw new Error(admission.failures[0].cause);
      current.publish();
      return current.value.model;
    },
    {
      construct: (document: IAutoMovieHumanFaceBasisDocument): { periocularMappings?: IAutoMovieHumanFacePeriocularMappingReportImported[]; admission: IAutoMovieHumanConstructionAdmissionImported; reference?: ReadonlyMap<string, readonly number[]> | undefined; oral?: IHumanFaceOralMeasurementRegistrationImported | undefined; sourceRegions: readonly IHumanFaceResidentSourceRegionImported[]; model: IAutoMovieModelImported; hairPartIds: readonly string[]; hairContactLayouts: ReadonlyMap<string, IHumanFaceHairContactLayoutImported>; materialAttachments: ReadonlyMap<string, ReadonlyMap<number, IHumanFaceMaterialAttachmentImported>>; browReplacements: ReadonlyMap<string, ReadonlySet<number>>; }  => {
        const current: IHumanFaceConstructionStage = stage(document);
        observe?.({
          documentId: document.id,
          basis: document.basis,
          phase: "geometry-built",
        });
        const admission: IAutoMovieHumanConstructionAdmissionImported = admitHumanConstruction(
          current.checks,
          (owner: string, accepted: boolean): void =>
            observe?.({
              documentId: document.id,
              basis: document.basis,
              phase: "admission-check-finished",
              checkOwner: owner,
              accepted,
            }),
        );
        observe?.({
          documentId: document.id,
          basis: document.basis,
          phase: "admission-finished",
          accepted: admission.accepted,
        });
        return {
          ...current.value,
          admission,
          ...(current.readMappings === undefined
            ? {}
            : { periocularMappings: current.readMappings() }),
        };
      },
    },
  );
  return build;
}
