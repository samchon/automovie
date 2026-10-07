import { admitHumanConstruction } from "../../common/basis/admitHumanConstruction";
import type { IAutoMovieHumanFaceBasisBuilder } from "../structures/IAutoMovieHumanFaceBasisBuilder";
import type { IAutoMovieHumanFaceBasisDocument } from "../structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanFaceConstructionProgress } from "../structures/IAutoMovieHumanFaceConstructionProgress";
import type { IHumanFaceConstructionStage } from "./IHumanFaceConstructionStage";

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
 * @evidence contracts/common.md#principled-implementation Both entries consume one stage and the same admission population without changing a geometry or condition.
 * @evidence contracts/common.md#clear-and-simple-design Geometry ownership stays supplied while this entry owner handles admission and publication timing.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspection preserves every refusal; no skip flag or alternative renderer admits the model.
 * @evidence contracts/common.md#meaningful-documentation States ordinary refusal, complete draft reporting and successful observer isolation.
 */
export function createHumanFaceConstructionEntries(
  stage: (
    document: IAutoMovieHumanFaceBasisDocument,
  ) => IHumanFaceConstructionStage,
  observe?: (progress: IAutoMovieHumanFaceConstructionProgress) => void,
): IAutoMovieHumanFaceBasisBuilder {
  const build: IAutoMovieHumanFaceBasisBuilder = Object.assign(
    (document: IAutoMovieHumanFaceBasisDocument) => {
      const current = stage(document);
      observe?.({
        documentId: document.id,
        basis: document.basis,
        phase: "geometry-built",
      });
      // Authoring needs the verdict only; the readings and census belong to
      // construction inspection, which takes them below.
      const admission = admitHumanConstruction(
        current.checks.map((check) => ({
          owner: check.owner,
          assert: check.assert,
        })),
        (owner, accepted) =>
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
      construct: (document: IAutoMovieHumanFaceBasisDocument) => {
        const current = stage(document);
        observe?.({
          documentId: document.id,
          basis: document.basis,
          phase: "geometry-built",
        });
        const admission = admitHumanConstruction(
          current.checks,
          (owner, accepted) =>
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
