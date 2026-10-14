import {
  autoMovieRenderDigest,
  compareAutoMovieRenderIds,
} from "@automovie/engine";
import { IAutoMovieRenderBudget } from "@automovie/interface";

import { IAutoMovieRenderBudgetAssessment } from "./IAutoMovieRenderBudgetAssessment";
import { IAutoMovieRenderBudgetEvidence } from "./IAutoMovieRenderBudgetEvidence";
import { selectAutoMovieRenderBudget } from "./selectAutoMovieRenderBudget";

const STATUS_ORDER: Readonly<
  Record<IAutoMovieRenderBudgetAssessment["status"], number>
> = { within: 0, incomplete: 1, "not-run": 2, over: 3 };

/**
 * Fold caller-supplied assessments into one tier's budget-evidence value. This reducer writes no publication and verifies no report provenance or rendered population.
 *
 * The digest covers the protocol, tier, declared tier list, aggregate status and ordered shot tuples of id, status, report digest and target digest. It does not serialize the complete report or target into this hash, but their supplied digests participate in identity; equivalent tuples produce the same content address.
 *
 * `budgets` is the production's whole declaration, read for `declaredTiers` and for whether this tier was budgeted at all. The assessments must already have been made against {@link selectAutoMovieRenderBudget}'s answer for the same tier; hand them a different budget and `budgeted` describes the declaration while every finding describes something else. The caller supplies one assessment per shot id; sorting alone does not validate that denominator.
 *
 * @evidence contracts/common.md#principled-implementation Sorted shot verdicts and deduplicated sorted declared tiers determine the worst status; structured JSON encoding distinguishes arbitrary string field contents before hashing, avoiding delimiter aliases.
 * @evidence contracts/common.md#clear-and-simple-design This reducer owns the tier-level envelope while selectAutoMovieRenderBudget owns tier lookup and individual assessments own measurement. Current callers are tests and internal budget helpers; no automatic production publication or render-job gate is wired here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts An empty shot set reports not-run, and incomplete or over verdicts retain their own status; no absent report is interpreted as clearance.
 * @evidence contracts/common.md#meaningful-documentation The comment lists the exact digest denominator and caller obligations for selected-budget assessment and unique shot ids; evidence members define ordering, severity and the empty-population outcome.
 * @evidence contracts/performance.md#efficient-algorithms For S assessments and B budgets, sorting costs O(S log S+B log B), reduction and serialization are linear, and retained output holds S assessment references and B tier strings.
 * @evidence contracts/performance.md#reuse-equivalent-work Existing assessment reports and targets are referenced rather than recomputed; canonical ordering permits callers to reuse byte-identical evidence for equivalent verdict inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The output retains the sorted assessment array and tier list; sorting copies the input array and opens no file, encoder or renderer resource.
 */
export const autoMovieRenderBudgetEvidence: (props: {
  tier: string;
  budgets: readonly IAutoMovieRenderBudget[] | undefined;
  assessments: readonly IAutoMovieRenderBudgetAssessment[];
}) => IAutoMovieRenderBudgetEvidence = (props: {
  /** Quality tier the job targeted. */
  tier: string;
  /** Budgets the production declares. */
  budgets: readonly IAutoMovieRenderBudget[] | undefined;
  /** One assessment per shot; order is normalized here. */
  assessments: readonly IAutoMovieRenderBudgetAssessment[];
}): IAutoMovieRenderBudgetEvidence => {
  const shots: IAutoMovieRenderBudgetAssessment[] = [...props.assessments].sort(
    (
      left: IAutoMovieRenderBudgetAssessment,
      right: IAutoMovieRenderBudgetAssessment,
    ): number => compareAutoMovieRenderIds(left.shot, right.shot),
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
