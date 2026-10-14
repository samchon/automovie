import {
  type IAutoMovieRenderBudgetAssessment,
  assessAutoMovieRenderBudget,
  autoMovieRenderBudgetEvidence,
  autoMovieRenderBudgetRefusal,
  autoMovieRenderTargetRendererOfGraphics,
  autoMovieRenderTargetSettingsOfShot,
  selectAutoMovieRenderBudget,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";

import {
  GRAPHICS_FIXTURE,
  RENDER_BUDGET_ASSETS,
  compiledShotFixture,
  renderBudgetFixture,
  sceneEnvironmentFixture,
} from "../internal/renderBudgetFixtures";
import { BOX_TRIANGLES } from "../internal/renderFixtures";
import { renderShadowTargetFixture } from "../internal/renderShadowTargetFixture";

/**
 * Budget helpers aggregate one verdict per tier without treating an
 * unmeasured cost as a cleared one. This unit invokes no render job or publisher.
 *
 * Evidence preserves every incomplete and not-run measurement. Over-limit
 * evidence and required texture storage without a safe bound produce refusal
 * text; another concern's incomplete measurement keeps its owning contract's status.
 *
 * Scenarios:
 *
 * 1. Tier lookup selects its exact budget, ignores the others, and
 *    resolves a duplicated tier to its first declaration.
 * 2. A production declaring no budget at all, and one declaring budgets for other
 *    tiers only, both mark report metrics `unbudgeted` with the declared tiers named.
 * 3. Five staged boxes measured against a triangle limit they fit inside give a
 *    `within` assessment; the same shot one triangle under its own cost goes `over` and names
 *    the owner to edit.
 * 4. Withholding decoded upload facts of a bound asset makes the tier
 *    incomplete and formats a diagnostic for unknown required resident storage.
 * 5. The worst outcome wins: `over` beats `not-run` beats `incomplete` beats
 *    `within`, whichever order the shots arrive in, and a document over no
 *    shots at all is `not-run` rather than a verdict over an empty set.
 * 6. The evidence digest is a property of the verdicts, not of shot order, and
 *    changes when a verdict does.
 * 7. An over verdict carrying no finding still refuses and still names the shot,
 *    rather than dropping the only thing an operator could act on.
 * 8. A comma inside one tier cannot fingerprint the same as two distinct tiers.
 *
 * @evidence contracts/testing.md#behavioral-verification The test calls shot-budget assessment, evidence aggregation and refusal formatting; exact status, owner, numeric cost and diagnostic checks reject false clearance, incorrect severity and missing recoveries.
 * @evidence contracts/testing.md#independent-expectations Five boxes with twelve triangles each and one shadow redraw determine the peak independently; explicit severity order, empty-population policy and distinct one-tier versus two-tier populations determine the remaining verdict and digest expectations. This test does not independently verify the content-hash algorithm.
 * @evidence contracts/testing.md#distinguishing-cases Exact and one-triangle-lower limits, missing texture facts, missing renderer reports, empty shots, tier lookup, reordered verdicts and delimiter-bearing tier names distinguish admission from nearby failures; texture-specific allocation tests own decoded upload and sharing details.
 * @evidence contracts/testing.md#execution-ownership The discoverable unit function invokes deterministic package functions with in-memory compiled artifacts and injected texture facts; it starts no renderer, browser, encoder or process and registers no hidden cases.
 */
export function test_render_budget_preflight_evidence(): void {
  const review: ReturnType<typeof renderBudgetFixture> = renderBudgetFixture({
    tier: "review",
    limits: { triangles: 1_000 },
  });
  const delivery: ReturnType<typeof renderBudgetFixture> = renderBudgetFixture({
    tier: "delivery",
    limits: { triangles: 10 },
  });
  const shadow: ReturnType<typeof renderBudgetFixture> = renderBudgetFixture({
    tier: "review",
    limits: { triangles: 1 },
  });
  TestValidator.equals(
    "a job targets its own tier and resolves a duplicate to the first",
    {
      review: selectAutoMovieRenderBudget([review, delivery], "review")?.limits,
      delivery: selectAutoMovieRenderBudget([review, delivery], "delivery")
        ?.limits,
      absent: selectAutoMovieRenderBudget([review, delivery], "proxy"),
      undeclared: selectAutoMovieRenderBudget(undefined, "review"),
      duplicated: selectAutoMovieRenderBudget([review, shadow], "review")
        ?.limits,
    },
    {
      review: { triangles: 1_000 },
      delivery: { triangles: 10 },
      absent: null,
      undeclared: null,
      duplicated: { triangles: 1_000 },
    },
  );

  const assess: (props: {
    budget: Parameters<typeof assessAutoMovieRenderBudget>[0]["budget"];
    shot?: string;
    textures?: boolean;
  }) => IAutoMovieRenderBudgetAssessment = (props: {
    budget: Parameters<typeof assessAutoMovieRenderBudget>[0]["budget"];
    shot?: string;
    textures?: boolean;
  }): IAutoMovieRenderBudgetAssessment => {
    const compiled: ReturnType<typeof compiledShotFixture> =
      compiledShotFixture();
    compiled.scene = {
      ...compiled.scene,
      environment: sceneEnvironmentFixture(),
    };
    return assessAutoMovieRenderBudget({
      textureResidency: {
        owner: "current",
        residents: [],
        dfgRetained: false,
        pmremRetained: null,
        renderTargets: [renderShadowTargetFixture()],
      },
      compiled,
      shot: props.shot ?? "opening",
      budget: props.budget,
      renderer: autoMovieRenderTargetRendererOfGraphics(GRAPHICS_FIXTURE),
      settings: autoMovieRenderTargetSettingsOfShot({
        compiled,
        width: 1280,
        height: 720,
        pixelRatio: 1,
        delivery: "none",
      }),
      assets: RENDER_BUDGET_ASSETS,
      textures: props.textures
        ? [
            {
              format: "rgba8" as const,
              asset: "textures/stone.png",
              width: 512,
              height: 512,
              mipmapped: true,
            },
          ]
        : undefined,
    });
  };

  // Five staged boxes of twelve triangles each. That is what the shot stages,
  // and it is deliberately not the number a limit is compared against: the
  // budget is a conservative one-frame peak, and the spec keeps `passes` and
  // the per-frame peak as dimensions of that bound rather than counting the
  // beauty pass alone. The fixture lights one shadow caster, and a shadow map
  // re-submits every opaque draw as its own depth pass, so the peak frame
  // draws this geometry twice.
  const staged: number = 5 * BOX_TRIANGLES;
  const peak: number = staged * 2;
  const cleared: IAutoMovieRenderBudgetAssessment = assess({
    budget: renderBudgetFixture({
      tier: "review",
      limits: { triangles: peak },
    }),
    textures: true,
  });
  // One triangle under the peak, which is the smallest input that must fail.
  const exceeded: IAutoMovieRenderBudgetAssessment = assess({
    budget: renderBudgetFixture({
      tier: "review",
      limits: { triangles: peak - 1 },
    }),
    textures: true,
  });
  const triangles: (
    assessment: IAutoMovieRenderBudgetAssessment,
  ) => NonNullable<
    IAutoMovieRenderBudgetAssessment["report"]
  >["findings"][number] = (
    assessment: IAutoMovieRenderBudgetAssessment,
  ): NonNullable<
    IAutoMovieRenderBudgetAssessment["report"]
  >["findings"][number] =>
    assessment.report!.findings.find(
      (
        finding: NonNullable<
          IAutoMovieRenderBudgetAssessment["report"]
        >["findings"][number],
      ): boolean => finding.metric === "triangles",
    )!;
  TestValidator.equals(
    "a limit the shot fits inside clears it, and one triangle less does not",
    {
      cleared: {
        status: cleared.status,
        finding: triangles(cleared).status,
        measured: triangles(cleared).measured,
        excess: triangles(cleared).excess,
      },
      exceeded: {
        status: exceeded.status,
        finding: triangles(exceeded).status,
        measured: triangles(exceeded).measured,
        excess: triangles(exceeded).excess,
        owner: triangles(exceeded).contributors[0]?.owner,
      },
    },
    {
      cleared: {
        status: "within",
        finding: "within",
        measured: peak,
        excess: 0,
      },
      exceeded: {
        status: "over",
        finding: "over",
        measured: peak,
        excess: 1,
        // The depth pass is charged to the light that induced it and stays in
        // the peak, but its cost is by construction the sum of every staged
        // box, so ranking it would make the first line of every refusal the
        // same name. The ranking is over the staged nodes instead, and five
        // boxes of equal cost are decided on the owner id.
        owner: "node:lantern",
      },
    },
  );

  const unmeasured: IAutoMovieRenderBudgetAssessment = assess({
    budget: renderBudgetFixture({
      tier: "review",
      limits: { triangles: peak },
    }),
  });
  TestValidator.equals(
    "an unmeasured texture cost is incomplete and refuses unsafe admission",
    {
      status: unmeasured.status,
      textureBytes: unmeasured.report!.findings.find(
        (
          finding: NonNullable<
            IAutoMovieRenderBudgetAssessment["report"]
          >["findings"][number],
        ): boolean => finding.metric === "textureBytes",
      )!.status,
      refusal: autoMovieRenderBudgetRefusal(
        autoMovieRenderBudgetEvidence({
          tier: "review",
          budgets: [review],
          assessments: [unmeasured],
        }),
      )?.includes("resident texture"),
    },
    { status: "incomplete", textureBytes: "not-run", refusal: true },
  );

  const shot: (
    name: string,
    status: IAutoMovieRenderBudgetAssessment["status"],
  ) => IAutoMovieRenderBudgetAssessment = (
    name: string,
    status: IAutoMovieRenderBudgetAssessment["status"],
  ): IAutoMovieRenderBudgetAssessment => ({
    ...(status === "not-run"
      ? { ...cleared, report: null, target: null }
      : cleared),
    shot: name,
    status,
    reason: status === "not-run" ? "no graphics identity" : null,
  });
  const worst: (
    statuses: readonly IAutoMovieRenderBudgetAssessment["status"][],
  ) => IAutoMovieRenderBudgetAssessment["status"] = (
    statuses: readonly IAutoMovieRenderBudgetAssessment["status"][],
  ): IAutoMovieRenderBudgetAssessment["status"] =>
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [review, delivery],
      assessments: statuses.map(
        (
          status: IAutoMovieRenderBudgetAssessment["status"],
          index: number,
        ): IAutoMovieRenderBudgetAssessment => shot(`shot-${index}`, status),
      ),
    }).status;
  TestValidator.equals(
    "the worst outcome any shot produced is the tier's outcome",
    {
      clean: worst(["within", "within"]),
      incomplete: worst(["within", "incomplete"]),
      unrun: worst(["incomplete", "not-run"]),
      over: worst(["not-run", "over", "within"]),
      reversed: worst(["over", "not-run"]),
      empty: worst([]),
    },
    {
      clean: "within",
      incomplete: "incomplete",
      unrun: "not-run",
      over: "over",
      reversed: "over",
      // A document over no shots measured nothing, and a verdict over an empty
      // set is the cheapest way a report ends up clearing what it never read.
      empty: "not-run",
    },
  );

  const evidence: (
    order: readonly IAutoMovieRenderBudgetAssessment[],
  ) => ReturnType<typeof autoMovieRenderBudgetEvidence> = (
    order: readonly IAutoMovieRenderBudgetAssessment[],
  ): ReturnType<typeof autoMovieRenderBudgetEvidence> =>
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [review, delivery, shadow],
      assessments: order,
    });
  const declared: ReturnType<typeof evidence> = evidence([
    shot("b", "within"),
    shot("a", "within"),
  ]);
  const reversed: ReturnType<typeof evidence> = evidence([
    shot("a", "within"),
    shot("b", "within"),
  ]);
  const changed: ReturnType<typeof evidence> = evidence([
    shot("b", "within"),
    shot("a", "not-run"),
  ]);
  TestValidator.equals(
    "the digest is a property of the verdicts, never of shot order",
    {
      stable: declared.digest === reversed.digest,
      changes: declared.digest !== changed.digest,
      ordered: declared.shots.map(
        (entry: IAutoMovieRenderBudgetAssessment): string => entry.shot,
      ),
      tiers: declared.declaredTiers,
      budgeted: declared.budgeted,
      protocol: declared.protocol,
      version: declared.version,
    },
    {
      stable: true,
      changes: true,
      ordered: ["a", "b"],
      tiers: ["delivery", "review"],
      budgeted: true,
      protocol: "automovie.render-budget-evidence.v1",
      version: 1,
    },
  );

  const oneTier: ReturnType<typeof autoMovieRenderBudgetEvidence> =
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [renderBudgetFixture({ tier: "a,b", limits: {} })],
      assessments: [],
    });
  const twoTiers: ReturnType<typeof autoMovieRenderBudgetEvidence> =
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [
        renderBudgetFixture({ tier: "a", limits: {} }),
        renderBudgetFixture({ tier: "b", limits: {} }),
      ],
      assessments: [],
    });
  TestValidator.notEquals(
    "tier delimiters cannot alias a distinct declaration population",
    oneTier.digest,
    twoTiers.digest,
  );

  const unbudgeted: ReturnType<typeof autoMovieRenderBudgetEvidence> =
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [delivery],
      assessments: [assess({ budget: null, textures: true })],
    });
  const undeclared: ReturnType<typeof autoMovieRenderBudgetEvidence> =
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: undefined,
      assessments: [assess({ budget: null, textures: true })],
    });
  TestValidator.equals(
    "a tier nobody budgeted is reported as such, with the declared tiers named",
    {
      budgeted: unbudgeted.budgeted,
      tiers: unbudgeted.declaredTiers,
      tier: unbudgeted.shots[0]!.report!.tier,
      triangles: unbudgeted.shots[0]!.report!.findings.find(
        (
          finding: NonNullable<
            IAutoMovieRenderBudgetAssessment["report"]
          >["findings"][number],
        ): boolean => finding.metric === "triangles",
      )!.status,
      status: unbudgeted.status,
      // A production that declared nothing at all is not the same record as one
      // that budgeted other tiers, and the evidence has to tell them apart.
      undeclaredTiers: undeclared.declaredTiers,
      undeclaredBudgeted: undeclared.budgeted,
    },
    {
      budgeted: false,
      tiers: ["delivery"],
      tier: "unbudgeted",
      triangles: "unbudgeted",
      status: "within",
      undeclaredTiers: [],
      undeclaredBudgeted: false,
    },
  );

  const refusal: string | null = autoMovieRenderBudgetRefusal(
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [review],
      assessments: [exceeded],
    }),
  );
  TestValidator.equals(
    "an over-budget tier refuses and names the shot, the excess and the owner",
    {
      refused: refusal !== null,
      shot: refusal?.includes("opening"),
      tier: refusal?.includes('Render tier "review"'),
      owner: refusal?.includes(
        `the largest owner is "node:lantern" at ${BOX_TRIANGLES}, edited at scene.nodes["lantern"]`,
      ),
      // The aggregate pass is still stated as a pass beside the light that
      // induced it, so the numbers add up and the one edit that halves the
      // frame is not hidden by being outside the owner-cost ranking.
      pass: refusal?.includes(
        `a further ${staged} of that total is frame passes redrawing the opaque owners, the largest "light:sun" at ${staged}`,
      ),
      excess: refusal?.includes(`${peak} against a limit of ${peak - 1}`),
    },
    {
      refused: true,
      shot: true,
      tier: true,
      owner: true,
      pass: true,
      excess: true,
    },
  );

  const findingless: string | null = autoMovieRenderBudgetRefusal(
    autoMovieRenderBudgetEvidence({
      tier: "review",
      budgets: [review],
      assessments: [{ ...shot("silent", "over"), report: null }],
    }),
  );
  TestValidator.equals(
    "an over verdict carrying no finding still names the shot it refuses for",
    {
      refused: findingless !== null,
      shot: findingless?.includes("silent"),
      recovery: findingless?.includes("recorded no over-limit finding"),
    },
    { refused: true, shot: true, recovery: true },
  );
}
