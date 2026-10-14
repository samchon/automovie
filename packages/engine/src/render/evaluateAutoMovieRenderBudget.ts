import {
  AutoMovieRenderMetric,
  IAutoMovieRenderAnalysisGap,
  IAutoMovieRenderBudget,
  IAutoMovieRenderContributor,
  IAutoMovieRenderFinding,
  IAutoMovieRenderInventory,
  IAutoMovieRenderReport,
  IAutoMovieRenderTarget,
  IAutoMovieSemanticMask,
} from "@automovie/interface";

import { autoMovieRenderDigest } from "./autoMovieRenderDigest";
import { compareAutoMovieRenderIds } from "./compareAutoMovieRenderIds";
import { AUTOMOVIE_RENDER_METRICS } from "./constants/AUTOMOVIE_RENDER_METRICS";
import { AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS } from "./constants/AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS";

/**
 * Check one inventory against one declared budget and produce the bounded
 * report.
 *
 * The report answers for every metric, always, with one of five outcomes. Four
 * of them are not "pass":
 *
 * - `within`: measured, budgeted, at or below the limit;
 * - `over`: measured, budgeted, above the limit, with the dominant owners and the
 *   exact way back;
 * - `unbudgeted`: measured, but the production declared no limit, so nobody
 *   agreed what large means;
 * - `unsupported`: no analysis exists for what the design declares;
 * - `not-run`: the analysis exists but its input was not supplied.
 *
 * The last two make the whole report `incomplete`. That is the point of them:
 * an artifact whose fluid cost was never computed has not been cleared for
 * fluid cost, and a report that said `within` would be the exact false
 * capability claim this evidence exists to prevent.
 *
 * A budget limit that is negative, fractional or non-finite is an authoring
 * mistake and throws, rather than becoming a budget that can never be met.
 *
 * An `over` finding names somewhere the author can actually go. The limit is
 * compared against the inventory's own total, frame passes and all, but the
 * dominant-owner ranking is over the owners that hold their own cost; the
 * passes are counted among the owners the report does not name and stated in
 * the recovery as passes. A ranking that let them compete would put the same
 * name first in every production that lights nothing, and that name is a guide
 * pass no production declares.
 *
 * @author Samchon
 *
 * @evidence contracts/common.md#principled-implementation Evaluate every fixed metric against an admitted nonnegative safe integer limit or explicit gap, preserving within/over/unbudgeted/unsupported/not-run and ranking own costs separately from passes/runtime. Aggregate over takes precedence over incomplete.
 * @evidence contracts/common.md#clear-and-simple-design Metric evaluation owns verdict/recovery, rank owns bounded editable attribution, and the report binds mask/target digests without measuring the scene again.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No unknown metric total is treated as zero or a pass; absent gap explanations become not-run. Pass/runtime costs remain omitted-accounting values rather than dominating editable-owner ranking.
 * @evidence contracts/common.md#meaningful-documentation Docs distinguish all statuses, safe integer limits, positive caller-selected contributor bound and recovery attribution. Explicit-position JSON seals every finding field including contributor source and recovery, plus mask/target identity; finite measured inventory numbers are a premise.
 * @evidence contracts/performance.md#efficient-algorithms For fixed M metrics and O owner rows, each ranking scans O and sorts distinct owners, giving O(M*O log O) work and bounded returned top-K contributors; temporary ranking populations remain proportional to owners.
 * @evidence contracts/performance.md#reuse-equivalent-work Each metric's one rank supplies contributors, omitted totals and pass recovery together; the mutable inventory/budget prevents identity-only report caching.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the report/findings and borrowed target; rank maps/text are call-local, with no retained scene, resource handle or evaluation task.
 */
export const evaluateAutoMovieRenderBudget: (props: {
  inventory: IAutoMovieRenderInventory;
  budget: IAutoMovieRenderBudget | null;
  mask: IAutoMovieSemanticMask;
  target: IAutoMovieRenderTarget;
  maxContributors?: number;
}) => IAutoMovieRenderReport = (props: {
  /** Measured cost of the artifact. */
  inventory: IAutoMovieRenderInventory;
  /** Declared limits, or `null` for a production that declares none. */
  budget: IAutoMovieRenderBudget | null;
  /** Semantic palette the owners in this report are addressable in. */
  mask: IAutoMovieSemanticMask;
  /** Renderer, settings and assets the measurement is bound to. */
  target: IAutoMovieRenderTarget;
  /** Dominant-owner bound; defaults to the exported maximum. */
  maxContributors?: number;
}): IAutoMovieRenderReport => {
  const {
    inventory,
    budget,
    mask,
    target,
  }: {
    inventory: IAutoMovieRenderInventory;
    budget: IAutoMovieRenderBudget | null;
    mask: IAutoMovieSemanticMask;
    target: IAutoMovieRenderTarget;
    maxContributors?: number;
  } = props;
  const limit: number =
    props.maxContributors ?? AUTOMOVIE_RENDER_REPORT_MAX_CONTRIBUTORS;
  if (!Number.isSafeInteger(limit) || limit < 1)
    throw new Error(
      `render report contributor bound must be a positive safe integer, but was ${limit}`,
    );
  for (const [metric, value] of Object.entries(budget?.limits ?? {}))
    if (!Number.isSafeInteger(value) || value < 0)
      throw new Error(
        `render budget limit for "${metric}" must be a safe integer at or above zero, but was ${value}`,
      );

  const gaps: Map<AutoMovieRenderMetric, IAutoMovieRenderAnalysisGap> = new Map(
    inventory.gaps.map(
      (
        gap: IAutoMovieRenderAnalysisGap,
      ): [AutoMovieRenderMetric, IAutoMovieRenderAnalysisGap] => [
        gap.metric,
        gap,
      ],
    ),
  );
  const findings: IAutoMovieRenderFinding[] = AUTOMOVIE_RENDER_METRICS.map(
    (
      metric:
        | "triangles"
        | "vertices"
        | "drawCalls"
        | "materials"
        | "textures"
        | "textureBytes"
        | "geometryBytes"
        | "lights"
        | "shadowMaps"
        | "nodes"
        | "instanceSets"
        | "instanceSlots"
        | "instanceChunks"
        | "fluidCells"
        | "fluidParticles",
    ): IAutoMovieRenderFinding =>
      evaluate({ metric, inventory, budget, gap: gaps.get(metric), limit }),
  );
  const status: "within" | "over" | "incomplete" = findings.some(
    (finding: IAutoMovieRenderFinding): boolean => finding.status === "over",
  )
    ? "over"
    : findings.some(
          (finding: IAutoMovieRenderFinding): boolean =>
            finding.status === "unsupported" || finding.status === "not-run",
        )
      ? "incomplete"
      : "within";
  return {
    version: 1,
    protocol: "automovie.render-report.v1",
    tier: budget === null ? "unbudgeted" : budget.tier,
    status,
    findings,
    mask: mask.digest,
    target,
    digest: autoMovieRenderDigest(
      JSON.stringify([
        "automovie.render-report.v1",
        budget === null ? "unbudgeted" : budget.tier,
        status,
        findings.map((finding: IAutoMovieRenderFinding): unknown[] => [
          finding.metric,
          finding.status,
          finding.measured,
          finding.limit,
          finding.excess,
          finding.contributors.map(
            (
              contributor: IAutoMovieRenderContributor,
            ): [string, string, number] => [
              contributor.owner,
              contributor.source,
              contributor.cost,
            ],
          ),
          finding.omittedContributors,
          finding.omittedCost,
          finding.recovery,
        ]),
        mask.digest,
        target.digest,
      ]),
    ),
  };
};

const evaluate: (props: {
  metric: AutoMovieRenderMetric;
  inventory: IAutoMovieRenderInventory;
  budget: IAutoMovieRenderBudget | null;
  gap: IAutoMovieRenderInventory["gaps"][number] | undefined;
  limit: number;
}) => IAutoMovieRenderFinding = (props: {
  metric: AutoMovieRenderMetric;
  inventory: IAutoMovieRenderInventory;
  budget: IAutoMovieRenderBudget | null;
  gap: IAutoMovieRenderInventory["gaps"][number] | undefined;
  limit: number;
}): IAutoMovieRenderFinding => {
  const {
    metric,
    inventory,
    budget,
    gap,
  }: {
    metric: AutoMovieRenderMetric;
    inventory: IAutoMovieRenderInventory;
    budget: IAutoMovieRenderBudget | null;
    gap: IAutoMovieRenderInventory["gaps"][number] | undefined;
    limit: number;
  } = props;
  const measured: number | null = inventory.totals[metric];
  const declared: number | null = budget?.limits[metric] ?? null;
  const {
    passes,
    ...ranked
  }: {
    contributors: IAutoMovieRenderContributor[];
    omittedContributors: number;
    omittedCost: number;
    passes: { cost: number; dominant: IAutoMovieRenderContributor } | null;
  } = rank(inventory, metric, props.limit);

  if (gap !== undefined)
    return {
      metric,
      status: gap.status,
      measured: null,
      limit: declared,
      excess: 0,
      ...ranked,
      recovery: `${gap.reason}; ${gap.remedy}`,
    };
  if (measured === null)
    // An unmeasured metric with no gap beside it would be an evidence hole
    // nobody declared, so it is reported as one rather than assumed to be zero.
    return {
      metric,
      status: "not-run",
      measured: null,
      limit: declared,
      excess: 0,
      ...ranked,
      recovery: `the inventory reported no value for "${metric}" and declared no reason; measure it or record the gap`,
    };
  if (declared === null)
    return {
      metric,
      status: "unbudgeted",
      measured,
      limit: null,
      excess: 0,
      ...ranked,
      recovery: null,
    };
  if (measured <= declared)
    return {
      metric,
      status: "within",
      measured,
      limit: declared,
      excess: 0,
      ...ranked,
      recovery: null,
    };
  const dominant: IAutoMovieRenderContributor = ranked.contributors[0];
  // What the frame passes add is stated beside the owners rather than among
  // them. Without it the listed costs come up short of the measurement for no
  // reason a reader can see, and the one shadow caster doubling the frame,
  // often the cheapest edit on the page, would go unmentioned once it stopped
  // being ranked as an owner.
  const passed: string =
    passes === null
      ? ""
      : `; a further ${passes.cost} of that total is frame passes redrawing the opaque owners, the largest "${passes.dominant.owner}" at ${passes.dominant.cost}`;
  return {
    metric,
    status: "over",
    measured,
    limit: declared,
    excess: measured - declared,
    ...ranked,
    recovery:
      dominant === undefined
        ? `"${metric}" measures ${measured} against a limit of ${declared}; the inventory attributed none of it to an editable owner, so raise the limit deliberately or reduce the whole scene${passed}`
        : `"${metric}" measures ${measured} against a limit of ${declared}, ${measured - declared} over; the largest owner is "${dominant.owner}" at ${dominant.cost}, edited at ${dominant.source}${passed}`,
  };
};

/**
 * The dominant owners of one metric, what the report leaves unnamed, and what
 * the frame passes add.
 *
 * Sorted by cost descending, then by owner id ascending. The tie-break on the
 * id is what makes the list a property of the production rather than of the
 * order the inventory happened to visit owners in, so two runs of the same
 * design produce the same eight names.
 *
 * Ranking and accounting are two questions and one list cannot answer both. A
 * frame pass redraws the geometry the drawable owners already paid for, so its
 * cost is their sum and it can never lose a cost-descending ranking: leaving it
 * in makes the first line of the table a constant, and for the outline pass it
 * makes that line a name no production declares and no author can open. So the
 * ranking is over `own` rows alone, while passes and shared runtime storage stay in the omitted count
 * and the omitted cost. Nothing is dropped: the contributors plus the omitted
 * cost still add up to everything the inventory attributed, and the totals the
 * report checks against a limit are the inventory's own, untouched.
 *
 * The `instanceSlots` and `fluidCells` rankings never had this problem and do
 * not change: a resident cost is allocated once and reused by every pass, so no
 * pass row exists to outrank the drawable that owns it.
 */
const rank: (
  inventory: IAutoMovieRenderInventory,
  metric: AutoMovieRenderMetric,
  limit: number,
) => {
  contributors: IAutoMovieRenderContributor[];
  omittedContributors: number;
  omittedCost: number;
  passes: { cost: number; dominant: IAutoMovieRenderContributor } | null;
} = (
  inventory: IAutoMovieRenderInventory,
  metric: AutoMovieRenderMetric,
  limit: number,
): {
  contributors: IAutoMovieRenderContributor[];
  omittedContributors: number;
  omittedCost: number;
  passes: { cost: number; dominant: IAutoMovieRenderContributor } | null;
} => {
  const totals: Map<string, IAutoMovieRenderContributor> = new Map<
    string,
    IAutoMovieRenderContributor
  >();
  const passes: Map<string, IAutoMovieRenderContributor> = new Map<
    string,
    IAutoMovieRenderContributor
  >();
  const runtime: Map<string, IAutoMovieRenderContributor> = new Map<
    string,
    IAutoMovieRenderContributor
  >();
  for (const entry of inventory.owners) {
    if (entry.metric !== metric) continue;
    const into: Map<string, IAutoMovieRenderContributor> =
      entry.kind === "pass"
        ? passes
        : entry.kind === "runtime"
          ? runtime
          : totals;
    const current: IAutoMovieRenderContributor | undefined = into.get(
      entry.owner,
    );
    if (current === undefined)
      into.set(entry.owner, {
        owner: entry.owner,
        source: entry.source,
        cost: entry.cost,
      });
    else current.cost += entry.cost;
  }
  const order: (
    left: IAutoMovieRenderContributor,
    right: IAutoMovieRenderContributor,
  ) => number = (
    left: IAutoMovieRenderContributor,
    right: IAutoMovieRenderContributor,
  ): number =>
    right.cost - left.cost ||
    compareAutoMovieRenderIds(left.owner, right.owner);
  const ordered: IAutoMovieRenderContributor[] = [...totals.values()].sort(
    order,
  );
  const orderedPasses: IAutoMovieRenderContributor[] = [
    ...passes.values(),
  ].sort(order);
  const passCost: number = orderedPasses.reduce(
    (sum: number, entry: IAutoMovieRenderContributor): number =>
      sum + entry.cost,
    0,
  );
  const runtimeCost: number = [...runtime.values()].reduce(
    (sum: number, entry: IAutoMovieRenderContributor): number =>
      sum + entry.cost,
    0,
  );
  const omitted: IAutoMovieRenderContributor[] = ordered.slice(limit);
  return {
    contributors: ordered.slice(0, limit),
    omittedContributors: omitted.length + orderedPasses.length + runtime.size,
    omittedCost:
      omitted.reduce(
        (sum: number, entry: IAutoMovieRenderContributor): number =>
          sum + entry.cost,
        0,
      ) +
      passCost +
      runtimeCost,
    // A pass that costs nothing is a pass over an empty frame, and naming it
    // would answer a question nobody asked.
    passes:
      passCost === 0 ? null : { cost: passCost, dominant: orderedPasses[0]! },
  };
};
