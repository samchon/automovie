import {
  type AutoMovieProductionContractClaim,
  type IAutoMovieEvidenceConfigProps,
  createAutoMovieProductionObligationClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  projectAutoMovieLocalContractClaims,
  validateAutoMovieLocalContractClaims,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import { type ITtscEvidenceGraphClaim, type ITtscEvidenceGraphReference } from "@ttsc/evidence";

import { throwsError } from "../internal/predicates";

/**
 * Local account metadata is a checked declaration, and its manifest keeps
 * contract addresses distinct from the authored population being compared.
 *
 * Scenarios:
 *
 * 1. Positive account and principle bindings preserve exact host, target,
 *    stage, and population scope; native claims without metadata stay native.
 * 2. Pilot-only inapplicable accounts become audits without losing their
 *    denominator, while draft bindings remain visible and unenforced.
 * 3. Wrong type, layer, stage, scope, disposition, activation, target count,
 *    cardinality, host, and denominator are refused before projection.
 * 4. Projection keeps native omitted-selector defaults, but those defaults do not grant binding admission.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls local claim admission and projectAutoMovieLocalContractClaims, checking aggregate eligibility separately from contract targets, per-unit principle symbols, naturalness pass identity, pilot audit separation and draft enforcement. Forged ownership and policy refusals catch detached metadata before it can masquerade as an admitted manifest binding.
 * @evidence contracts/testing.md#independent-expectations Literal docs roots, host and target paths, H2/H3/H4 depths, and declared stage/scope determine projected records; aggregate population omits only the reserved account host, while native omissions mean root dot and no symbols. These expected records do not use another projection helper and do not certify native coverage.
 * @evidence contracts/testing.md#distinguishing-cases Preserves four groups covering bound account/principle/native inputs, final screenplay principles, pilot audits, draft and disabled accounts, mixed references, twenty detached account forms and scalar native defaults refused by admission but retained by projection.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_local_account_projection entry owns every portable constructor, admission and projection call in-process, with no project file reads, installed consumer, native artifact or running evaluator.
 */
export function test_evidence_local_account_projection(): void {
  const blank: IAutoMovieEvidenceConfigProps = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const props: Parameters<typeof createAutoMovieProductionObligationClaim>[0] = {
    name: "local obligation",
    account: "accounts/models/local.md",
    document: "contracts/obligations-models.md",
    layer: "models" as const,
    stage: "review" as const,
    populationScope: blank.populationScope,
  };
  const account: AutoMovieProductionContractClaim = createAutoMovieProductionObligationClaim(props);
  const principle: AutoMovieProductionContractClaim = createAutoMovieProductionPrincipleClaim({
    ...props,
    name: "local principle",
    document: "contracts/principles-models.md",
    files: ["models/**/*.md"],
    symbol: ["h2", "h3", "h4"],
  });
  const native: ITtscEvidenceGraphClaim = {
    name: "native",
    type: "markdown" as const,
    files: ["models/**/*.md"],
    symbol: "h2" as const,
    reference: {
      type: "markdown" as const,
      files: ["contracts/native.md"],
      symbol: "h2" as const,
    },
  };
  const graph: IAutoMovieEvidenceConfigProps = {
    ...blank,
    models: "review",
    claims: [account, principle, native],
  };
  validateAutoMovieLocalContractClaims(graph);
  validateAutoMovieLocalContractClaims({ ...blank, claims: undefined });
  const projected: ReturnType<typeof projectAutoMovieLocalContractClaims> = projectAutoMovieLocalContractClaims(graph.claims!);
  TestValidator.equals(
    "only typed bindings projected",
    projected.localBindings.length,
    2,
  );
  TestValidator.equals("account projection", projected.localBindings[0], {
    claim: props.name,
    layer: "models",
    pass: "construction",
    stage: "review",
    enforced: true,
    populationScope: blank.populationScope,
    relationship: "distributed-coverage",
    host: {
      root: "docs",
      files: [props.account, "models/**/*.md"],
      symbols: ["h2"],
    },
    targets: [{ root: "docs", files: [props.document], symbols: ["h2"] }],
    population: { root: "docs", files: ["models/**/*.md"], symbols: ["h2"] },
  });
  TestValidator.equals(
    "principle host symbols preserved",
    projected.localBindings[1]!.host.symbols,
    ["h2", "h3", "h4"],
  );
  TestValidator.equals(
    "aggregate projection preserves native defaults",
    projectAutoMovieLocalContractClaims([
      { ...account, root: undefined, symbol: undefined },
    ]).localBindings[0]!.population,
    { root: ".", files: ["models/**/*.md"], symbols: [] },
  );
  TestValidator.equals(
    "principle has no compared population",
    projected.localBindings[1]!.population,
    undefined,
  );
  const naturalness: AutoMovieProductionContractClaim = createAutoMovieProductionPrincipleClaim({
    name: "local screenplay naturalness",
    document: "contracts/naturalness-screenplays.md",
    files: ["final/screenplays/*/???-*.md"],
    layer: "screenplays",
    pass: "naturalness",
    stage: "review",
    populationScope: blank.populationScope,
    symbol: ["h2", "h3", "h4"],
  });
  const naturalnessGraph: IAutoMovieEvidenceConfigProps = {
    ...blank,
    naturalness: { screenplays: "review" as const },
    claims: [naturalness],
  };
  validateAutoMovieLocalContractClaims(naturalnessGraph);
  TestValidator.equals(
    "naturalness projection retains its pass",
    projectAutoMovieLocalContractClaims([naturalness]).localBindings[0],
    {
      claim: "local screenplay naturalness",
      layer: "screenplays",
      pass: "naturalness",
      stage: "review",
      enforced: true,
      populationScope: blank.populationScope,
      relationship: "checklist",
      host: {
        root: "docs",
        files: ["final/screenplays/*/???-*.md"],
        symbols: ["h2", "h3", "h4"],
      },
      targets: [
        {
          root: "docs",
          files: ["contracts/naturalness-screenplays.md"],
          symbols: ["h2"],
        },
      ],
    },
  );
  TestValidator.predicate(
    "naturalness obligation refused",
    throwsError((): AutoMovieProductionContractClaim =>
      createAutoMovieProductionObligationClaim({
        ...props,
        layer: "screenplays",
        pass: "naturalness",
      }),
    ),
  );
  TestValidator.predicate(
    "naturalness host restricted to screenplays",
    throwsError((): AutoMovieProductionContractClaim =>
      createAutoMovieProductionPrincipleClaim({
        ...props,
        files: ["final/screenplays/*/???-*.md"],
        layer: "models",
        pass: "naturalness",
        symbol: "h2",
      }),
    ),
  );
  TestValidator.predicate(
    "naturalness stage must match declaration",
    throwsError((): void =>
      validateAutoMovieLocalContractClaims({
        ...naturalnessGraph,
        naturalness: { screenplays: "evidence" },
      }),
    ),
  );
  TestValidator.equals(
    "positive bindings do not create audits",
    projected.localAudits,
    [],
  );
  const scope: IAutoMovieEvidenceConfigProps["populationScope"] = { mode: "first-pilot" as const };
  const audit: AutoMovieProductionContractClaim = createAutoMovieProductionObligationClaim({
    ...props,
    populationScope: scope,
    inapplicable: true,
  });
  validateAutoMovieLocalContractClaims({
    ...graph,
    populationScope: scope,
    claims: [audit],
  });
  const audits: ReturnType<typeof projectAutoMovieLocalContractClaims> = projectAutoMovieLocalContractClaims([audit]);
  TestValidator.equals("pilot audit only", audits.localBindings, []);
  TestValidator.equals(
    "audit retains denominator",
    audits.localAudits[0]!.population?.files,
    ["models/**/*.md"],
  );
  TestValidator.equals(
    "audit does not enforce",
    audits.localAudits[0]!.enforced,
    false,
  );
  const draft: AutoMovieProductionContractClaim = createAutoMovieProductionObligationClaim({
    ...props,
    stage: "draft",
  });
  validateAutoMovieLocalContractClaims({
    ...graph,
    models: "draft",
    claims: [draft],
  });
  const disabled: AutoMovieProductionContractClaim = createAutoMovieProductionObligationClaim({
    ...props,
    stage: "disabled",
  });
  validateAutoMovieLocalContractClaims({ ...blank, claims: [disabled] });
  const mixedReferences: AutoMovieProductionContractClaim = {
    ...principle,
    reference: [
      ...(Array.isArray(principle.reference)
        ? principle.reference
        : [principle.reference]),
      {
        type: "typescript" as const,
        files: ["src/constraints.ts"],
        symbol: "type" as const,
      },
    ],
  };
  TestValidator.predicate(
    "typed principle cannot mix independently configured native references",
    throwsError((): void =>
      validateAutoMovieLocalContractClaims({
        ...graph,
        claims: [mixedReferences],
      }),
    ),
  );
  const { autoMovieBinding: _binding, ...mixedNative }: AutoMovieProductionContractClaim = mixedReferences;
  validateAutoMovieLocalContractClaims({ ...graph, claims: [mixedNative] });
  TestValidator.equals(
    "non-Markdown references do not become local contract targets",
    projectAutoMovieLocalContractClaims([mixedReferences]).localBindings[0]!
      .targets.length,
    1,
  );
  TestValidator.equals(
    "draft remains declared",
    projectAutoMovieLocalContractClaims([draft]).localBindings[0]!.enforced,
    false,
  );
  const references: ITtscEvidenceGraphReference[] = Array.isArray(account.reference)
    ? account.reference
    : [account.reference];
  for (const broken of [
    { ...account, type: "typescript" },
    { ...account, autoMovieBinding: null },
    { ...account, autoMovieBinding: "models" },
    {
      ...account,
      autoMovieBinding: { ...account.autoMovieBinding, layer: "missing" },
    },
    {
      ...account,
      autoMovieBinding: { ...account.autoMovieBinding, stage: "draft" },
    },
    {
      ...account,
      autoMovieBinding: { ...account.autoMovieBinding, populationScope: scope },
    },
    {
      ...account,
      autoMovieBinding: { ...account.autoMovieBinding, disposition: "other" },
    },
    { ...account, disabled: true },
    {
      ...account,
      disabled: true,
      autoMovieBinding: {
        ...account.autoMovieBinding,
        disposition: "inapplicable",
      },
    },
    { ...account, reference: [] },
    { ...account, reference: { type: "typescript", files: ["src/a.ts"] } },
    { ...account, reference: [{ ...references[0], files: [] }] },
    {
      ...account,
      reference: [
        { ...references[0], files: [props.document, "contracts/second.md"] },
      ],
    },
    {
      ...account,
      reference: [{ ...references[0], checklist: true }],
    },
    {
      ...account,
      files: [props.account, "models/one.md"],
    },
    { ...account, files: ["accounts/models/other.md"] },
    { ...account, symbol: "h3" },
    { ...account, root: "." },
    { ...account, name: undefined },
    {
      ...account,
      autoMovieBinding: { ...account.autoMovieBinding, account: undefined },
    },
  ])
    TestValidator.predicate(
      "detached or weakened account",
      throwsError((): void =>
        validateAutoMovieLocalContractClaims({
          ...graph,
          claims: [broken as AutoMovieProductionContractClaim],
        }),
      ),
    );
  const scalar: AutoMovieProductionContractClaim = {
    ...principle,
    name: undefined,
    root: undefined,
    symbol: undefined,
    reference: {
      type: "markdown" as const,
      files: ["contracts/principles-models.md"],
      checklist: true,
      symbol: undefined,
    },
  };
  TestValidator.predicate(
    "projection defaults do not grant binding admission",
    throwsError((): void =>
      validateAutoMovieLocalContractClaims({ ...graph, claims: [scalar] }),
    ),
  );
  TestValidator.equals(
    "native defaults remain explicit in projection",
    projectAutoMovieLocalContractClaims([scalar]).localBindings[0],
    {
      claim: "",
      layer: "models",
      pass: "construction",
      stage: "review",
      enforced: true,
      populationScope: blank.populationScope,
      relationship: "checklist",
      host: { root: ".", files: ["models/**/*.md"], symbols: [] },
      targets: [
        { root: ".", files: ["contracts/principles-models.md"], symbols: [] },
      ],
    },
  );
}
