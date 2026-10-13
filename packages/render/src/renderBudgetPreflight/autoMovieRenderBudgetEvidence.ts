import { autoMovieRenderDigest, compareAutoMovieRenderIds } from "@automovie/engine";
import { IAutoMovieRenderBudget } from "@automovie/interface";
import { selectAutoMovieRenderBudget } from "./selectAutoMovieRenderBudget";
import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";
import { IAutoMovieRenderBudgetEvidence } from "./IAutoMovieRenderBudgetEvidence";


const STATUS_ORDER: Readonly<
  Record<IAutoMovieRenderBudgetAssessment["status"], number>
> = { within: 0, incomplete: 1, "not-run": 2, over: 3 };


/**
 * Fold one job's assessments into the evidence document it publishes.
 *
 * The digest covers the verdicts rather than the whole inventory, so
 * republishing the same evidence for an unchanged production lands on the same
 * content address and an immutable evidence store never fights itself.
 *
 * `budgets` is the production's whole declaration, read for `declaredTiers` and
 * for whether this tier was budgeted at all. The assessments must already have
 * been made against {@link selectAutoMovieRenderBudget}'s answer for the same
 * tier; hand them a different budget and `budgeted` describes the declaration
 * while every finding describes something else.
 *
 * @author Samchon
 */
export const autoMovieRenderBudgetEvidence = (props: {
  /** Quality tier the job targeted. */
  tier: string;
  /** Budgets the production declares. */
  budgets: readonly IAutoMovieRenderBudget[] | undefined;
  /** One assessment per shot; order is normalized here. */
  assessments: readonly IAutoMovieRenderBudgetAssessment[];
}): IAutoMovieRenderBudgetEvidence => {
  const shots = [...props.assessments].sort((left, right) =>
    compareAutoMovieRenderIds(left.shot, right.shot),
  );
  const status =
    shots.length === 0
      ? "not-run"
      : shots.reduce<IAutoMovieRenderBudgetAssessment["status"]>(
          (worst, shot) =>
            STATUS_ORDER[shot.status] > STATUS_ORDER[worst]
              ? shot.status
              : worst,
          "within",
        );
  const declaredTiers = [
    ...new Set((props.budgets ?? []).map((budget) => budget.tier)),
  ].sort(compareAutoMovieRenderIds);
  return {
    version: 1,
    protocol: "automovie.render-budget-evidence.v1",
    tier: props.tier,
    declaredTiers,
    budgeted: selectAutoMovieRenderBudget(props.budgets, props.tier) !== null,
    status,
    shots,
    digest: autoMovieRenderDigest(
      [
        "automovie.render-budget-evidence.v1",
        props.tier,
        declaredTiers.join(","),
        status,
        ...shots.map((shot) =>
          [
            shot.shot,
            shot.status,
            shot.report?.digest ?? "no-report",
            shot.target?.digest ?? "no-target",
          ].join("|"),
        ),
      ].join("\n"),
    ),
  };
};
