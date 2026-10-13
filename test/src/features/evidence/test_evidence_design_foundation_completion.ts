import {
  type IAutoMovieEvidenceConfigProps,
  createBlankAutoMovieProductionEvidence,
  selectAutoMovieCompletedDesignFoundations,
  validateAutoMovieProductionStages,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/predicates";

/**
 *
 * A layer completes at `evidence`, so a child opens and a foundation pays its
 * units from that stage without any review fingerprint.
 *
 * Scenarios:
 * 1. A source branch opens over its design at evidence and stays closed over a
 *    draft or disabled design.
 * 2. A design layer completes only over completed or disabled foundations,
 *    while a draft layer may sit over a draft foundation.
 * 3. The mutually founded motions and systems complete together, never one
 *    ahead of the other.
 * 4. The optional later review stage still counts as complete for the parent
 *    and foundation gates.
 * 5. Completed foundations are selected in declared order; draft and disabled
 *    foundations and a host without foundations select none.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls `validateAutoMovieProductionStages` on library stage maps built from `createBlankAutoMovieProductionEvidence`, expecting acceptance or a named refusal, and `selectAutoMovieCompletedDesignFoundations` for materials, instances and settings hosts; it catches a source branch opened over a draft or disabled design, a design completed over an active draft foundation, motions completed ahead of the systems they co-found, the later `review` stage treated as incomplete, a disabled or draft foundation charged to its host, and foundations returned out of declared order.
 * @evidence contracts/testing.md#independent-expectations Accept and refuse outcomes restate the documented rule that a layer completes at `evidence` and a child or host may advance only over completed or disabled parents; the foundation lists restate the declared design ladder, materials over models and spaces and instances over maps, models, spaces and materials; refusals are matched by their full gate sentence, while accepted calls are asserted only by not throwing.
 * @evidence contracts/testing.md#distinguishing-cases Positive source and design over completed, disabled and reviewed foundations, and draft over draft; negatives for a source over draft and disabled designs, a design over a draft foundation and motions ahead of systems; selection with all, one, none and a disabled foundation and a host with no foundation; per-layer contract files belong to `test_evidence_authored_contract_applicability`, and film reset stages to `test_evidence_film_reset_checkpoint`.
 */
export const test_evidence_design_foundation_completion = (): void => {
  const blank = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const library: IAutoMovieEvidenceConfigProps = {
    ...blank,
    kind: "library",
    settings: "evidence",
    spaces: "evidence",
    models: "evidence",
  };

  validateAutoMovieProductionStages({ ...library, modelSources: "draft" });
  for (const models of ["disabled", "draft"] as const)
    TestValidator.predicate(
      `a source waits for a ${models} design to reach evidence`,
      throwsError(
        () =>
          validateAutoMovieProductionStages({
            ...library,
            models,
            modelSources: "draft",
          }),
        "modelSources cannot enter draft before models reaches evidence",
      ),
    );

  validateAutoMovieProductionStages({ ...library, materials: "evidence" });
  validateAutoMovieProductionStages({
    ...library,
    models: "disabled",
    materials: "evidence",
  });
  validateAutoMovieProductionStages({
    ...library,
    models: "draft",
    materials: "draft",
  });
  TestValidator.predicate(
    "a design waits for its active foundation",
    throwsError(
      () =>
        validateAutoMovieProductionStages({
          ...library,
          models: "draft",
          materials: "evidence",
        }),
      "materials cannot enter evidence before models reaches evidence",
    ),
  );

  const founded: IAutoMovieEvidenceConfigProps = {
    ...library,
    materials: "evidence",
    instances: "evidence",
  };
  validateAutoMovieProductionStages({
    ...founded,
    motions: "evidence",
    systems: "evidence",
  });
  validateAutoMovieProductionStages({
    ...founded,
    motions: "draft",
    systems: "draft",
  });
  TestValidator.predicate(
    "motions cannot complete ahead of systems",
    throwsError(
      () =>
        validateAutoMovieProductionStages({
          ...founded,
          motions: "evidence",
          systems: "draft",
        }),
      "motions cannot enter evidence before systems reaches evidence",
    ),
  );

  validateAutoMovieProductionStages({
    ...library,
    models: "review",
    modelSources: "draft",
  });
  validateAutoMovieProductionStages({
    ...library,
    materials: "review",
  });

  TestValidator.equals(
    "completed foundations in declared order",
    selectAutoMovieCompletedDesignFoundations(
      { ...library, materials: "draft" },
      "materials",
    ),
    ["models", "spaces"],
  );
  TestValidator.equals(
    "a draft foundation contributes nothing yet",
    selectAutoMovieCompletedDesignFoundations(
      { ...library, models: "draft" },
      "materials",
    ),
    ["spaces"],
  );
  TestValidator.equals(
    "review counts as complete and disabled contributes nothing",
    selectAutoMovieCompletedDesignFoundations(
      { ...library, models: "review", spaces: "disabled" },
      "materials",
    ),
    ["models"],
  );
  TestValidator.equals(
    "instances read completed maps, models, spaces, and materials",
    selectAutoMovieCompletedDesignFoundations(
      { ...library, maps: "evidence", materials: "draft" },
      "instances",
    ),
    ["maps", "models", "spaces"],
  );
  TestValidator.equals(
    "settings has no design foundation",
    selectAutoMovieCompletedDesignFoundations(library, "settings"),
    [],
  );
};
