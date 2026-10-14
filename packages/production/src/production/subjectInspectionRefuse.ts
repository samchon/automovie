import type { IAutoMovieProductionServices } from "./IAutoMovieProductionServices";
import { AutoMovieDiagnosticCode, IAutoMovieSubjectReviewTarget } from "@automovie/interface";

import { IAutoMovieInspectSubject } from "./IAutoMovieInspectSubject";

/**
 * Construct an uninspected result while preserving an optional completed prefix and one exact diagnostic.
 *
 * @evidence contracts/common.md#principled-implementation Fresh empty defaults precede the supplied partial fields, then the current terminal diagnostic is written last.
 * @evidence contracts/common.md#clear-and-simple-design Result assembly is separate from the sweep's journal mutation and capture decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Partial fields can replace any default, including inspected or delivery flags; current owning branches pass coherent prefixes without those overrides and this assembler adds no independent admission.
 * @evidence contracts/common.md#meaningful-documentation Owning refusal branches keep inspected false; the broad Partial input can override defaults, while the final render diagnostic identifies the requested shot/subject.
 * @evidence contracts/performance.md#efficient-algorithms Fixed container creation and partial-object spreading add to supplied partial record size without image or file work.
 * @evidence contracts/performance.md#reuse-equivalent-work One assembler serves all refusal branches without caching causes or reconstructing captured views.
 * @evidence contracts/performance.md#bound-retention-and-release-resources New defaults/diagnostic containers are caller-owned while supplied prefix records are borrowed; no host resource is acquired.
 */
export function subjectInspectionRefuse(
  services: IAutoMovieProductionServices,
  input: IAutoMovieInspectSubject.IProps,
  target: IAutoMovieSubjectReviewTarget,
  code: AutoMovieDiagnosticCode,
  message: string,
  partial?: Partial<IAutoMovieInspectSubject>
): IAutoMovieInspectSubject { return ({
      inspected: false,
      productionId: services.project.productionId,
      target,
      revision: null,
      planIdentity: null,
      planRecord: null,
      runtimeIdentity: null,
      subject: null,
      plan: [],
      views: [],
      coverage: null,
      deliveryEvidence: false,
      ...partial,
      diagnostics: [
        {
          code,
          category: "error",
          phase: "render",
          target: `subject:${input.shot}:${input.subject}`,
          path: null,
          message,
        },
      ],
    }); }
