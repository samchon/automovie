import type {
  IAutoMovieRepaintExecutionPolicy,
  IAutoMovieRepaintGeneratorAdoption,
  IAutoMovieRepaintGeneratorProvenance,
  IAutoMovieRepaintRequestEvidence,
  IAutoMovieRepaintRuntimeIdentity,
} from "@automovie/interface";
import {
  canonicalAutoMovieRepaintGeneratorAdoption,
  canonicalAutoMovieRepaintGeneratorProvenance,
  canonicalAutoMovieRepaintRuntimeIdentity,
  productionRepaintOutputPath,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { assertRepaintGeneratorSourceIdentities } from "../internal/assertRepaintGeneratorSourceIdentities";

const digest: (value: string) => string = (value: string): string => `sha256:${value}`;

const adoption: () => IAutoMovieRepaintGeneratorAdoption = (): IAutoMovieRepaintGeneratorAdoption => ({
  runtimeIdentity: {
    protocolVersion: "automovie.repaint-runtime.v1",
    provider: "reviewed-local-host",
    model: "studio/repaint-model",
    version: "sha256:model-revision",
    execution: "local",
  },
  generatorProvenance: {
    source: "https://models.example/studio/repaint-model",
    license: "license-records/repaint-model.md",
    termsCheckedAt: "2026-08-28",
    cost: "local compute; no per-request provider fee",
    consumer: {
      kind: "repaint",
      reason: "the reviewed final delivery requires an appearance rendition",
    },
  },
});

const messageOf: (operation: () => unknown) => string | null = (operation: () => unknown): string | null => {
  try {
    operation();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
};

/**
 * Repaint generator adoption is strict identity, not incidental metadata.
 *
 * Scenarios:
 *
 * 1. Runtime, reviewed provenance, and their complete adoption canonicalize
 *    independently and without depending on authored key order.
 * 2. Hidden fields, credentials, malformed identities, padded required text,
 *    and a consumer from another generation lane are all refused.
 * 3. Every generator-provenance change creates a distinct content-addressed
 *    rendition path, while an unchanged request retains the same path.
 * 4. Public repaint receipt v3 requires both reviewed provenance and the
 *    deterministic-source authority boundary.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs actual identity canonicalizers, output/request/source/address composers and structural-control selection; compares insertion-order equivalence, every authored refusing variant, path sensitivity and exact control groups, with receipt-v3 static negative assignments and JSON preservation.
 * @evidence contracts/testing.md#independent-expectations Literal refusal-presence booleans and control inventories define the oracle; equality and single-field metamorphic path comparisons use actual composers on distinct authored inputs and do not supply independent hash vectors or validate synthetic digest spellings.
 * @evidence contracts/testing.md#distinguishing-cases Preserves null/array/hidden/malformed records, credential locators and foreign consumer kind, five provenance changes and each existing request/output variant, plus incomplete mask exclusion and required receipt fields; optional descriptive dates are not validated by these cases or the provenance owner.
 * @evidence contracts/testing.md#execution-ownership The named synchronous unit awaits no external work and invokes its canonical case helper in original order. The partial source manifest and synthetic identities test metadata composition only; no generator installation, license truth, resident bundle/media validation or receipt schema admission is claimed, and static negative assignments require later compilation.
 */
export function test_production_repaint_generator_identity(): void {
  const selected: IAutoMovieRepaintGeneratorAdoption = adoption();
  const reordered: IAutoMovieRepaintGeneratorAdoption = {
    generatorProvenance: {
      consumer: {
        reason: selected.generatorProvenance.consumer.reason,
        kind: "repaint",
      },
      cost: selected.generatorProvenance.cost,
      termsCheckedAt: selected.generatorProvenance.termsCheckedAt,
      license: selected.generatorProvenance.license,
      source: selected.generatorProvenance.source,
    },
    runtimeIdentity: {
      execution: "local",
      version: selected.runtimeIdentity.version,
      model: selected.runtimeIdentity.model,
      provider: selected.runtimeIdentity.provider,
      protocolVersion: "automovie.repaint-runtime.v1",
    },
  } as IAutoMovieRepaintGeneratorAdoption;
  TestValidator.equals(
    "repaint adoption canonicalization is stable across exact key order",
    {
      runtime: canonicalAutoMovieRepaintRuntimeIdentity(
        selected.runtimeIdentity,
      ),
      provenance: canonicalAutoMovieRepaintGeneratorProvenance(
        selected.generatorProvenance,
      ),
      adoption: canonicalAutoMovieRepaintGeneratorAdoption(selected),
    },
    {
      runtime: canonicalAutoMovieRepaintRuntimeIdentity(
        reordered.runtimeIdentity,
      ),
      provenance: canonicalAutoMovieRepaintGeneratorProvenance(
        reordered.generatorProvenance,
      ),
      adoption: canonicalAutoMovieRepaintGeneratorAdoption(reordered),
    },
  );

  const malformedRuntime: unknown[] = [
    null,
    [],
    { ...selected.runtimeIdentity, apiKey: "must-not-enter-identity" },
    { ...selected.runtimeIdentity, protocolVersion: "repaint-v2" },
    { ...selected.runtimeIdentity, provider: "" },
    { ...selected.runtimeIdentity, provider: " padded " },
    { ...selected.runtimeIdentity, model: "" },
    { ...selected.runtimeIdentity, version: "" },
    { ...selected.runtimeIdentity, execution: "cloud" },
  ];
  const provenance: IAutoMovieRepaintGeneratorProvenance = selected.generatorProvenance;
  const malformedProvenance: unknown[] = [
    null,
    [],
    { ...provenance, credential: "must-not-enter-provenance" },
    {
      ...provenance,
      source: "https://user:secret@models.example/repaint-model",
    },
    {
      ...provenance,
      license: "https://license-user:secret@licenses.example/repaint",
    },
    { ...provenance, cost: "" },
    { ...provenance, consumer: null },
    { ...provenance, consumer: { kind: "dialogue-synthesis", reason: "x" } },
    { ...provenance, consumer: { kind: "repaint", reason: " padded " } },
    {
      ...provenance,
      consumer: { ...provenance.consumer, credential: "forbidden" },
    },
  ];
  const malformedAdoption: unknown[] = [
    null,
    [],
    { ...selected, credential: "forbidden" },
    { runtimeIdentity: selected.runtimeIdentity },
    {
      ...selected,
      runtimeIdentity: { ...selected.runtimeIdentity, provider: "" },
    },
  ];
  TestValidator.predicate(
    "repaint runtime rejects every malformed or hidden identity field",
    malformedRuntime.every(
      (value: unknown): boolean =>
        messageOf((): string =>
          canonicalAutoMovieRepaintRuntimeIdentity(
            value as IAutoMovieRepaintRuntimeIdentity,
          ),
        ) !== null,
    ),
  );
  TestValidator.predicate(
    "repaint provenance rejects every malformed or hidden adoption field",
    malformedProvenance.every(
      (value: unknown): boolean =>
        messageOf((): string =>
          canonicalAutoMovieRepaintGeneratorProvenance(
            value as IAutoMovieRepaintGeneratorProvenance,
          ),
        ) !== null,
    ),
  );
  TestValidator.predicate(
    "repaint adoption rejects an incomplete, extended, or invalid pair",
    malformedAdoption.every(
      (value: unknown): boolean =>
        messageOf((): string =>
          canonicalAutoMovieRepaintGeneratorAdoption(
            value as IAutoMovieRepaintGeneratorAdoption,
          ),
        ) !== null,
    ),
  );

  const executionPolicy: IAutoMovieRepaintExecutionPolicy = {
    maximumAttempts: 2,
    attemptTimeoutMs: 1_000,
    maximumElapsedMs: 10_000,
    maximumCostUnits: 5,
    backoffMs: [100],
    retryableFailures: ["transport"],
  };
  const evidence: IAutoMovieRepaintRequestEvidence = {
    prompt: "docs/prompts/opening.md#repaint",
    continuity: "docs/continuity/film-v1.md#opening",
    settings: "docs/settings/visual.md#delivery",
    design: "docs/design/cast.md#lead",
    screenplayOrBrief: "docs/screenplays/opening.md#shot",
    shot: "scripts/shots/opening.ts#opening",
  };
  const outputRequest: Parameters<typeof productionRepaintOutputPath>[0] = {
    shot: "opening",
    sourceRenderFingerprint: digest("source"),
    attemptId: "attempt-1",
    adapterIdentity: canonicalAutoMovieRepaintRuntimeIdentity(
      selected.runtimeIdentity,
    ),
    generatorProvenance: selected.generatorProvenance,
    parameters: {
      prompt: "the reviewed quiet architectural finish",
      negativePrompt: "unowned subject, geometry change",
      seed: 41,
      strength: 0.35,
      controls: { scheduler: "fixed", guidance: 7.5 },
    },
    executionPolicy,
    evidence,
    references: [
      {
        role: "style" as const,
        path: "assets/style.png",
        digest: digest("style"),
      },
    ],
    outputDigest: digest("output"),
  };
  const originalPath: string = productionRepaintOutputPath(outputRequest);
  const provenanceVariants: IAutoMovieRepaintGeneratorProvenance[] = [
    { ...provenance, source: `${provenance.source}/mirror` },
    { ...provenance, license: `${provenance.license}#amended` },
    { ...provenance, termsCheckedAt: "2026-08-29" },
    { ...provenance, cost: `${provenance.cost}; reserved GPU` },
    {
      ...provenance,
      consumer: { ...provenance.consumer, reason: "another reviewed reason" },
    },
  ];
  TestValidator.equals(
    "unchanged repaint request retains one cache identity",
    productionRepaintOutputPath({ ...outputRequest }),
    originalPath,
  );
  TestValidator.predicate(
    "every generator-provenance field participates in repaint cache identity",
    provenanceVariants.every(
      (generatorProvenance: IAutoMovieRepaintGeneratorProvenance): boolean =>
        productionRepaintOutputPath({
          ...outputRequest,
          generatorProvenance,
        }) !== originalPath,
    ),
  );
  const requestVariants: Parameters<typeof productionRepaintOutputPath>[0][] = [
    {
      ...outputRequest,
      adapterIdentity: canonicalAutoMovieRepaintRuntimeIdentity({
        ...selected.runtimeIdentity,
        model: "studio/another-model",
      }),
    },
    {
      ...outputRequest,
      parameters: { ...outputRequest.parameters, prompt: "another prompt" },
    },
    {
      ...outputRequest,
      parameters: {
        ...outputRequest.parameters,
        negativePrompt: "another ban",
      },
    },
    {
      ...outputRequest,
      parameters: { ...outputRequest.parameters, seed: 42 },
    },
    {
      ...outputRequest,
      parameters: { ...outputRequest.parameters, strength: 0.36 },
    },
    {
      ...outputRequest,
      parameters: {
        ...outputRequest.parameters,
        controls: { ...outputRequest.parameters.controls, guidance: 8 },
      },
    },
    {
      ...outputRequest,
      references: [
        {
          ...outputRequest.references[0]!,
          path: "assets/another-style.png",
        },
      ],
    },
    {
      ...outputRequest,
      references: [
        {
          ...outputRequest.references[0]!,
          role: "material" as const,
        },
      ],
    },
    {
      ...outputRequest,
      references: [
        {
          ...outputRequest.references[0]!,
          digest: digest("another-style"),
        },
      ],
    },
    {
      ...outputRequest,
      executionPolicy: {
        ...executionPolicy,
        maximumAttempts: 3,
        backoffMs: [100, 200],
      },
    },
    {
      ...outputRequest,
      executionPolicy: { ...executionPolicy, attemptTimeoutMs: 900 },
    },
    {
      ...outputRequest,
      executionPolicy: { ...executionPolicy, maximumElapsedMs: 11_000 },
    },
    {
      ...outputRequest,
      executionPolicy: { ...executionPolicy, maximumCostUnits: 6 },
    },
    {
      ...outputRequest,
      executionPolicy: { ...executionPolicy, backoffMs: [101] },
    },
    {
      ...outputRequest,
      executionPolicy: {
        ...executionPolicy,
        retryableFailures: [
          "timeout",
        ] as IAutoMovieRepaintExecutionPolicy["retryableFailures"],
      },
    },
    {
      ...outputRequest,
      evidence: { ...evidence, prompt: `${evidence.prompt}:revised` },
    },
    {
      ...outputRequest,
      evidence: { ...evidence, continuity: null },
    },
    {
      ...outputRequest,
      evidence: { ...evidence, settings: `${evidence.settings}:revised` },
    },
    {
      ...outputRequest,
      evidence: { ...evidence, design: `${evidence.design}:revised` },
    },
    {
      ...outputRequest,
      evidence: {
        ...evidence,
        screenplayOrBrief: `${evidence.screenplayOrBrief}:revised`,
      },
    },
    {
      ...outputRequest,
      evidence: { ...evidence, shot: `${evidence.shot}:revised` },
    },
    { ...outputRequest, attemptId: "attempt-2" },
    { ...outputRequest, shot: "closing" },
    { ...outputRequest, sourceRenderFingerprint: digest("another-source") },
    { ...outputRequest, outputDigest: digest("another-output") },
  ];
  TestValidator.predicate(
    "every reviewed request and output identity field changes the rendition path",
    requestVariants.every(
      (variant: Parameters<typeof productionRepaintOutputPath>[0]): boolean => productionRepaintOutputPath(variant) !== originalPath,
    ),
  );

  assertRepaintGeneratorSourceIdentities(outputRequest, provenance, originalPath, digest);
}
