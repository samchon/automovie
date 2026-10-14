import { createAutoMovieStandaloneEvidenceConfig } from "@automovie/evidence";
import { TestValidator } from "@nestia/e2e";
import type {
  ITtscEvidenceGraphConfig,
  ITtscEvidenceGraphReference,
} from "@ttsc/evidence";
import type { TtscLintSeverity } from "@ttsc/lint";
import type { EvidenceSeverity, IEvidenceConfig, IEvidenceReference } from "@wrtnlabs/evidence";
import path from "node:path";

/**
 * Standalone evaluation preserves compiler evidence meaning across severity syntax.
 *
 * Scenarios:
 *
 * 1. Inherited, named, numeric, and alias severities retain their diagnostic level.
 * 2. Independent reference policies and ordered populations survive a frozen input.
 * 3. Explicit TypeScript files are admitted; compiler-only package populations and
 *    absent file selectors are refused before standalone evaluation can omit them.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls createAutoMovieStandaloneEvidenceConfig and checks severity conversion on claims and references, absolute roots, ordered selectors, mixed reference policies, original graph preservation and refusals for compiler-only populations or invalid roots. These checks detect standalone evaluation silently selecting a different population or diagnostic level.
 * @evidence contracts/testing.md#independent-expectations Literal named levels correspond to numeric 0/1/2 and warn aliases under the two evaluator contracts; independently resolved project paths and unchanged authored fields determine roots and policies. The test observes conversion records and refusal fragments rather than running either evaluator.
 * @evidence contracts/testing.md#distinguishing-cases Includes inherited, named, numeric and alias severities, Markdown/TypeScript/Swagger/Prisma references, frozen claim-array input, explicit source files, package-only and absent file populations, blank and drive-relative roots, and an empty graph; native file selection is outside this adapter unit.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_evidence_standalone_config entry owns every portable adapter call and its literal policies, using path resolution without filesystem access, installed consumers, native artifacts or a running evaluator host.
 */
export function test_evidence_standalone_config(): void {
  const levels: (TtscLintSeverity | undefined)[] = [
    undefined,
    "off",
    "warning",
    "error",
    0,
    1,
    2,
    "warn",
  ];
  const graph: ITtscEvidenceGraphConfig = {
    claims: levels.map((severity: TtscLintSeverity | undefined): ITtscEvidenceGraphConfig["claims"][number] => ({
      type: "markdown",
      files: ["authored/**/*.md", "!authored/index.md"],
      symbol: "h2",
      severity,
      reference: {
        type: "markdown",
        root: "docs",
        files: ["rules.md"],
        severity,
        checklist: true,
        noEvidenceExclude: true,
      },
    })),
  };
  graph.claims[0]!.root = "authored";
  const before: string = JSON.stringify(graph);
  Object.freeze(graph.claims);
  const projected: IEvidenceConfig = createAutoMovieStandaloneEvidenceConfig(
    graph,
    "/production",
  );
  TestValidator.equals(
    "compiler project root is preserved",
    projected.claims[0]!.root,
    path.resolve("/production", "authored"),
  );
  const firstReference: IEvidenceReference | IEvidenceReference[] = projected.claims[0]!.reference;
  TestValidator.predicate(
    "reference root is preserved",
    !Array.isArray(firstReference) &&
      firstReference.root === path.resolve("/production", "docs"),
  );
  const expected: (EvidenceSeverity | undefined)[] = [
    undefined,
    "off",
    "warning",
    "error",
    "off",
    "warning",
    "error",
    "warning",
  ];
  TestValidator.equals(
    "claim severity semantics",
    projected.claims.map((claim: IEvidenceConfig["claims"][number]): EvidenceSeverity | undefined => claim.severity),
    expected,
  );
  TestValidator.equals(
    "reference severity semantics",
    projected.claims.map((claim: IEvidenceConfig["claims"][number]): EvidenceSeverity | undefined =>
      Array.isArray(claim.reference) ? undefined : claim.reference.severity,
    ),
    expected,
  );
  TestValidator.equals("declaration unchanged", JSON.stringify(graph), before);
  TestValidator.equals("ordered selectors", projected.claims[0]!.files, [
    "authored/**/*.md",
    "!authored/index.md",
  ]);
  const references: ITtscEvidenceGraphReference[] = [
    {
      type: "typescript",
      files: ["src/**/*.ts"],
      symbol: "function",
      uniqueEvidence: true,
    },
    { type: "swagger", file: "openapi.yaml", noEvidenceExclude: true },
    { type: "prisma", files: ["schema.prisma"], symbol: "model" },
  ] satisfies ITtscEvidenceGraphReference[];
  const mixed: ITtscEvidenceGraphConfig = {
    claims: [
      { type: "typescript", files: ["src/**/*.ts"], reference: references },
    ],
  };
  TestValidator.equals(
    "reference kinds and policies",
    createAutoMovieStandaloneEvidenceConfig(mixed, "/production").claims[0]!
      .reference,
    references.map((reference: ITtscEvidenceGraphReference): ITtscEvidenceGraphReference & { root: string } => ({
      ...reference,
      root: path.resolve("/production"),
    })),
  );
  for (const reference of [
    { type: "typescript" as const, package: "api" },
    { type: "typescript" as const },
  ]) {
    let refusal: string = "";
    try {
      createAutoMovieStandaloneEvidenceConfig(
        { claims: [{ type: "markdown", files: ["docs/**/*.md"], reference }] },
        "/production",
      );
    } catch (error) {
      refusal = error instanceof Error ? error.message : String(error);
    }
    TestValidator.predicate(
      "compiler-only input refused",
      refusal.includes("explicit root/files"),
    );
  }
  for (const invalidRoot of ["", "   ", "C:relative", "C:"])
    TestValidator.error("native invalid roots remain refused", (): IEvidenceConfig =>
      createAutoMovieStandaloneEvidenceConfig(
        {
          claims: [
            {
              type: "markdown",
              root: invalidRoot,
              files: ["docs/**/*.md"],
              reference: { type: "markdown", files: ["rules.md"] },
            },
          ],
        },
        "/production",
      ),
    );
  TestValidator.equals(
    "empty input is preserved for native validation",
    createAutoMovieStandaloneEvidenceConfig({ claims: [] }, "/production")
      .claims,
    [],
  );
}
