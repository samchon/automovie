import {
  createAutoMovieProductionObligationClaim,
  createAutoMovieProductionPrincipleClaim,
  createBlankAutoMovieProductionEvidence,
  validateAutoMovieEvidenceAccounts,
  validateAutoMoviePopulationAccountHosts,
} from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";

/**
 * Admission depends on declared ownership and supplied physical facts, never
 * on a file's presence alone or an operating-system fixture.
 *
 * Scenarios:
 *
 * 1. Obligations admit relevant authored owners and optional aggregate accounts.
 * 2. Missing or empty targets, undeclared account files,
 *    cross-layer paths, and duplicate targets/accounts fail at their identity.
 * 3. Draft and pilot audits retain declaration without demanding physical
 *    accounts; disabled layers refuse retained accounts.
 * 4. The production account validator combines shared and local owners, admits a valid
 *    local extension, and refuses shared/local or special-owner collisions.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls validateAutoMoviePopulationAccountHosts and validateAutoMovieEvidenceAccounts with authored declarations and injected H2 reads, checking optional aggregate admission, ownership and duplicate refusals, retained shared targets and inactive reads. This catches accounts admitted merely by residence or local extensions that overwrite shared owners.
 * @evidence contracts/testing.md#independent-expectations Literal account/target addresses and resident lists determine ownership; undefined and zero H2 counts denote missing and empty obligations. The optional aggregate is not read, while declared local/common targets are observed and the film story-subject target appears once. These reader facts do not prove native Markdown coverage.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the four numbered groups with one and two accounts, optional aggregate absence, different target counts, four unowned residents, duplicate path/target/reserved collisions, disabled residue, inactive claims, blank and draft graphs, pilot audits and active or disabled shared-name collisions.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_local_account_admission entry owns all cases through product-declared resident/readH2Count inputs; callbacks supply scalar observations without replacing filesystem methods, installing a production, compiling native code or starting an evaluator host.
 */
export function test_evidence_local_account_admission(): void {
  const entry: Parameters<typeof validateAutoMoviePopulationAccountHosts>[0]["accounts"][number] = {
    layer: "models",
    stage: "evidence" as const,
    account: "accounts/models/local.md",
    target: "docs/contracts/local.md",
    enabled: true,
  };
  const props: Parameters<typeof validateAutoMoviePopulationAccountHosts>[0] = {
    accounts: [entry],
    residents: [entry.account],
    supplemental: [],
    readH2Count: (_file: string): number | undefined => 2,
  };
  validateAutoMoviePopulationAccountHosts(props);
  validateAutoMoviePopulationAccountHosts({ ...props, readH2Count: (): number => 1 });
  validateAutoMoviePopulationAccountHosts({
    ...props,
    accounts: [
      entry,
      {
        ...entry,
        account: "accounts/models/other.md",
        target: "docs/contracts/other.md",
      },
    ],
    residents: [entry.account, "accounts/models/other.md"],
  });
  for (const counts of [{}, { [entry.target]: 0 }])
    TestValidator.error("missing or empty obligation target", (): void =>
      validateAutoMoviePopulationAccountHosts({
        ...props,
        readH2Count: (file: string): number | undefined => (counts as Record<string, number>)[file],
      }),
    );
  validateAutoMoviePopulationAccountHosts({
    ...props,
    residents: [],
    readH2Count: (file: string): number | undefined => (file === entry.target ? 2 : undefined),
  });
  validateAutoMoviePopulationAccountHosts({
    ...props,
    readH2Count: (file: string): number => (file === entry.target ? 3 : 1),
  });
  for (const resident of [
    "accounts/models/undeclared.md",
    "accounts/spaces/local.md",
    "accounts/unknown/local.md",
    "accounts/local.md",
  ])
    TestValidator.error("undeclared physical account", (): void =>
      validateAutoMoviePopulationAccountHosts({
        ...props,
        residents: [resident],
      }),
    );
  TestValidator.error("duplicate file", (): void =>
    validateAutoMoviePopulationAccountHosts({
      ...props,
      accounts: [entry, entry],
    }),
  );
  TestValidator.error("duplicate target", (): void =>
    validateAutoMoviePopulationAccountHosts({
      ...props,
      accounts: [entry, { ...entry, account: "accounts/models/second.md" }],
    }),
  );
  TestValidator.error("reserved collision", (): void =>
    validateAutoMoviePopulationAccountHosts({
      ...props,
      supplemental: [{ file: entry.account, stage: "evidence" }],
    }),
  );
  TestValidator.error("disabled residue", (): void =>
    validateAutoMoviePopulationAccountHosts({
      ...props,
      accounts: [{ ...entry, enabled: false, stage: "disabled" }],
    }),
  );
  for (const stage of ["draft", "review"] as const)
    validateAutoMoviePopulationAccountHosts({
      ...props,
      accounts: [{ ...entry, enabled: false, stage }],
      residents: [],
      readH2Count: (): never => {
        throw new Error("An inactive claim must not demand a file.");
      },
    });
  validateAutoMoviePopulationAccountHosts({
    accounts: [],
    residents: [],
    supplemental: [],
    readH2Count: (): undefined => undefined,
  });
  const blank: ReturnType<typeof createBlankAutoMovieProductionEvidence> = createBlankAutoMovieProductionEvidence(
    "/production",
    "english",
  );
  const local: ReturnType<typeof createAutoMovieProductionObligationClaim> = createAutoMovieProductionObligationClaim({
    name: "local model duty",
    account: entry.account,
    document: "contracts/local.md",
    layer: "models",
    stage: "evidence",
    populationScope: blank.populationScope,
  });
  const graph: typeof blank = {
    ...blank,
    kind: "library" as const,
    settings: "review" as const,
    models: "evidence" as const,
    claims: [
      local,
      createAutoMovieProductionPrincipleClaim({
        name: "principle",
        document: "contracts/principles.md",
        files: ["models/**/*.md"],
        symbol: "h2",
        layer: "models",
        stage: "evidence",
        populationScope: blank.populationScope,
      }),
      {
        type: "markdown" as const,
        files: ["models/**/*.md"],
        symbol: "h2" as const,
        reference: {
          type: "markdown" as const,
          files: ["contracts/native.md"],
          symbol: "h2" as const,
        },
      },
    ],
  };
  const read: string[] = [];
  validateAutoMovieEvidenceAccounts(graph, {
    residents: [entry.account],
    readH2Count: (file: string): number => {
      read.push(file);
      return 1;
    },
  });
  TestValidator.equals(
    "factory leaves aggregate owner optional",
    read.includes("docs/" + entry.account),
    false,
  );
  TestValidator.predicate(
    "factory reads local target",
    read.includes(entry.target),
  );
  TestValidator.predicate(
    "factory retains common target",
    read.includes("docs/obligations/core/common.md"),
  );
  validateAutoMovieEvidenceAccounts(
    { ...blank, claims: undefined },
    {
      residents: [],
      readH2Count: (): never => {
        throw new Error("Blank project has no active account.");
      },
    },
  );
  const filmReads: string[] = [];
  validateAutoMovieEvidenceAccounts(
    { ...graph, kind: "film" },
    {
      residents: ["accounts/settings/story-subjects.md"],
      readH2Count: (file: string): number => {
        filmReads.push(file);
        return 1;
      },
    },
  );
  TestValidator.equals(
    "film subject target is declared once",
    filmReads.filter((file: string): boolean => file === "docs/obligations/story/subjects.md")
      .length,
    1,
  );
  validateAutoMovieEvidenceAccounts(
    { ...blank, models: "draft", claims: [] },
    {
      residents: ["accounts/models/core-common.md"],
      readH2Count: (): never => {
        throw new Error("Draft accounts are not enforced.");
      },
    },
  );
  const pilot: typeof graph = {
    ...graph,
    populationScope: { mode: "first-pilot" as const },
    claims: [
      createAutoMovieProductionObligationClaim({
        name: "pilot audit",
        account: entry.account,
        document: "contracts/local.md",
        layer: "models",
        stage: "evidence",
        populationScope: { mode: "first-pilot" },
        inapplicable: true,
      }),
    ],
  };
  validateAutoMovieEvidenceAccounts(pilot, {
    residents: [],
    readH2Count: (file: string): number | undefined =>
      file === entry.target || file === "docs/" + entry.account ? undefined : 1,
  });
  const collision: ReturnType<typeof createAutoMovieProductionObligationClaim> = createAutoMovieProductionObligationClaim({
    name: "collision",
    account: "accounts/models/core-common.md",
    document: "contracts/local.md",
    layer: "models",
    stage: "evidence",
    populationScope: blank.populationScope,
  });
  TestValidator.error("factory shared/local collision", (): void =>
    validateAutoMovieEvidenceAccounts(
      { ...graph, claims: [collision] },
      { residents: [], readH2Count: (): number => 1 },
    ),
  );
  TestValidator.error("factory rejects undeclared account", (): void =>
    validateAutoMovieEvidenceAccounts(
      { ...graph, claims: [] },
      { residents: [entry.account], readH2Count: (): number => 1 },
    ),
  );
  const disabledCollision: ReturnType<typeof createAutoMovieProductionObligationClaim> = createAutoMovieProductionObligationClaim({
    name: "reserved even before activation",
    account: "accounts/models/core-common.md",
    document: "contracts/local.md",
    layer: "models",
    stage: "disabled",
    populationScope: blank.populationScope,
  });
  TestValidator.error("disabled shared name stays reserved", (): void =>
    validateAutoMovieEvidenceAccounts(
      { ...blank, claims: [disabledCollision] },
      { residents: [], readH2Count: (): undefined => undefined },
    ),
  );
}
