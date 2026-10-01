import type {
  IAutoMovieHumanBodyGluteusMaximusAttachments,
  IAutoMovieHumanBodyGluteusMediusAttachments,
  IAutoMovieHumanBodyGluteusMinimusAttachments,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";
import typia from "typia";

/**
 * An attachment relation keeps one anatomical side even when its generic
 * side parameter admits either side. Named origins and insertions cannot
 * silently choose independent sides within one record.
 *
 * Scenarios:
 * 1. Complete left and right records for each gluteal muscle are admitted.
 * 2. Each union-side record refuses a left origin with a right insertion.
 * 3. A maximus record also refuses origins from both sides; the shared sacrum
 *    remains a valid origin with one side's insertion.
 */
export const test_human_body_gluteal_attachment_side_correlation = (): void => {
  for (const side of ["left", "right"])
    TestValidator.equals(
      `whole ${side} attachments are admitted`,
      [
        typia.is<IAutoMovieHumanBodyGluteusMaximusAttachments<"left" | "right">>({
          origins: [{ structure: side + "CoxalBone", site: "posteriorIlium" }],
          insertions: [{ structure: side + "Femur", site: "glutealTuberosity" }],
        }),
        typia.is<IAutoMovieHumanBodyGluteusMediusAttachments<"left" | "right">>({
          origins: [{ structure: side + "CoxalBone", site: "iliumBetweenGlutealLines" }],
          insertions: [{ structure: side + "Femur", site: "greaterTrochanterLateralFacet" }],
        }),
        typia.is<IAutoMovieHumanBodyGluteusMinimusAttachments<"left" | "right">>({
          origins: [{ structure: side + "CoxalBone", site: "iliumBetweenAnteriorAndInferiorGlutealLines" }],
          insertions: [{ structure: side + "Femur", site: "greaterTrochanterAnteriorFacet" }],
        }),
      ],
      [true, true, true],
    );
  const mixed = [
    typia.is<IAutoMovieHumanBodyGluteusMaximusAttachments<"left" | "right">>({
      origins: [{ structure: "leftCoxalBone", site: "posteriorIlium" }],
      insertions: [{ structure: "rightFemur", site: "glutealTuberosity" }],
    }),
    typia.is<IAutoMovieHumanBodyGluteusMediusAttachments<"left" | "right">>({
      origins: [{ structure: "leftCoxalBone", site: "iliumBetweenGlutealLines" }],
      insertions: [{ structure: "rightFemur", site: "greaterTrochanterLateralFacet" }],
    }),
    typia.is<IAutoMovieHumanBodyGluteusMinimusAttachments<"left" | "right">>({
      origins: [{ structure: "leftCoxalBone", site: "iliumBetweenAnteriorAndInferiorGlutealLines" }],
      insertions: [{ structure: "rightFemur", site: "greaterTrochanterAnteriorFacet" }],
    }),
    typia.is<IAutoMovieHumanBodyGluteusMaximusAttachments<"left" | "right">>({
      origins: [
        { structure: "leftCoxalBone", site: "posteriorIlium" },
        { structure: "rightSacrotuberousLigament", site: "pelvicAttachment" },
      ],
      insertions: [{ structure: "leftFemur", site: "glutealTuberosity" }],
    }),
  ];
  TestValidator.equals("union-side records cannot mix origin and insertion sides", mixed, [false, false, false, false]);
  TestValidator.predicate(
    "the shared sacrum remains an origin",
    typia.is<IAutoMovieHumanBodyGluteusMaximusAttachments<"left" | "right">>({
      origins: [{ structure: "sacrum", site: "dorsalSurface" }],
      insertions: [{ structure: "rightFemur", site: "glutealTuberosity" }],
    }),
  );
};
