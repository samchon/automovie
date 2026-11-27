import { AutoMovieEngineRenderTarget } from "@automovie/engine";
import type {
  IAutoMovieRenderBudget,
  IAutoMovieRenderBudgetAssessment,
  IAutoMovieRenderBudgetEvidence,
  IAutoMovieRenderBudgetEvidenceProps,
} from "@automovie/interface";

import { selectRenderBudget } from "./selectRenderBudget";

/*
 * Fold caller-supplied assessments into one tier's budget-evidence value. This
 * reducer writes no publication and verifies no report provenance or rendered
 * population.
 *
 * The digest covers the protocol, tier, declared tier list, aggregate status
 * and ordered shot tuples of id, status, report digest and target digest. It
 * does not serialize the complete report or target into this hash, but their
 * supplied digests participate in identity; equivalent tuples produce the same
 * content address.
 *
 * `budgets` is the production's whole declaration, read for `declaredTiers` and
 * for whether this tier was budgeted at all. The assessments must already have
 * been made against selectRenderBudget's answer for the same
 * tier; hand them a different budget and `budgeted` describes the declaration
 * while every finding describes something else. The caller supplies one
 * assessment per shot id; sorting alone does not validate that denominator.
 */
export const renderBudgetEvidence: (
  props: IAutoMovieRenderBudgetEvidenceProps,
) => IAutoMovieRenderBudgetEvidence = (
  props: IAutoMovieRenderBudgetEvidenceProps,
): IAutoMovieRenderBudgetEvidence => {
  const shots: IAutoMovieRenderBudgetAssessment[] = [...props.assessments].sort(
    (
      left: IAutoMovieRenderBudgetAssessment,
      right: IAutoMovieRenderBudgetAssessment,
    ): number => AutoMovieEngineRenderTarget.compareAutoMovieRenderIds(left.shot, right.shot),
  );
  const status: IAutoMovieRenderBudgetAssessment["status"] =
    shots.length === 0
      ? "not-run"
      : shots.reduce<IAutoMovieRenderBudgetAssessment["status"]>(
          (
            worst: IAutoMovieRenderBudgetAssessment["status"],
            shot: IAutoMovieRenderBudgetAssessment,
          ): IAutoMovieRenderBudgetAssessment["status"] =>
            STATUS_ORDER[shot.status] > STATUS_ORDER[worst]
              ? shot.status
              : worst,
          "within",
        );
  const declaredTiers: string[] = [
    ...new Set(
      (props.budgets ?? []).map(
        (budget: IAutoMovieRenderBudget): string => budget.tier,
      ),
    ),
  ].sort(AutoMovieEngineRenderTarget.compareAutoMovieRenderIds);
  return {
    version: 1,
    protocol: "automovie.render-budget-evidence.v1",
    tier: props.tier,
    declaredTiers,
    budgeted: selectRenderBudget(props.budgets, props.tier) !== null,
    status,
    shots,
    digest: AutoMovieEngineRenderTarget.autoMovieRenderDigest(
      JSON.stringify({
        protocol: "automovie.render-budget-evidence.v1",
        tier: props.tier,
        declaredTiers,
        status,
        shots: shots.map(
          (
            shot: IAutoMovieRenderBudgetAssessment,
          ): [
            string,
            IAutoMovieRenderBudgetAssessment["status"],
            string | null,
            string | null,
          ] => [
            shot.shot,
            shot.status,
            shot.report?.digest ?? null,
            shot.target?.digest ?? null,
          ],
        ),
      }),
    ),
  };
};

const STATUS_ORDER: Readonly<
  Record<IAutoMovieRenderBudgetAssessment["status"], number>
> = { within: 0, incomplete: 1, "not-run": 2, over: 3 };
