import { IAutoMovieLegacyImportPlan } from "@automovie/interface";
import {
  AutoMovieLegacyImportPlanError,
  assertAutoMovieLegacyImportPlan,
  fingerprintAutoMovieLegacyImportPlan,
  isAutoMovieLegacyImportPlan,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";

const plan: () => IAutoMovieLegacyImportPlan = (): IAutoMovieLegacyImportPlan => {
  const value: IAutoMovieLegacyImportPlan = {
    version: 1,
    fingerprint: "sha256:pending",
    legacyRevision: 0,
    inventory: [
      {
        path: "assets/missing.bin",
        bytes: 0,
        digest: null,
        kind: "asset",
      },
      {
        path: "automovie.json",
        bytes: 2,
        digest:
          "sha256:44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a",
        kind: "project",
      },
    ],
    rollbackBaseline: [
      {
        path: "src",
        existed: true,
        directories: ["src/nested"],
        files: [
          {
            path: "src/file.ts",
            bytes: 0,
            digest:
              "sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            kind: "project",
          },
        ],
      },
      { path: "generated", existed: false, directories: [], files: [] },
      { path: "renders", existed: false, directories: [], files: [] },
    ],
    productionDraft: {
      id: "legacy",
      title: "Legacy",
      logline: "A recovered production.",
      targetRuntimeSeconds: 1,
      visualDelivery: "deterministic",
      frameFormat: {
        width: 1280,
        height: 720,
        fps: 24,
        colorSpace: "srgb",
      },
      artDirection: {
        style: "primitive-3d",
        palette: ["#808080"],
        silhouettePriority: "Preserve the recovered silhouette.",
        scaleGrammar: "Preserve the recovered scale.",
      },
      deliverables: [],
    },
    shotContractDrafts: [],
    sourceTodos: [],
    diagnostics: [],
  };
  value.fingerprint = fingerprintAutoMovieLegacyImportPlan(value);
  return value;
};

const clone: () => IAutoMovieLegacyImportPlan = (): IAutoMovieLegacyImportPlan => structuredClone(plan());

const rejected: (mutate: (value: IAutoMovieLegacyImportPlan) => void) => boolean = (
  mutate: (value: IAutoMovieLegacyImportPlan) => void,
): boolean => {
  const value: IAutoMovieLegacyImportPlan = clone();
  mutate(value);
  try {
    assertAutoMovieLegacyImportPlan(value);
    return false;
  } catch (error) {
    return error instanceof AutoMovieLegacyImportPlanError;
  }
};

const refingerprint: (value: IAutoMovieLegacyImportPlan) => void = (value: IAutoMovieLegacyImportPlan): void => {
  value.fingerprint = fingerprintAutoMovieLegacyImportPlan(value);
};

/**
 * Apply and reopen share complete legacy-plan semantic admission.
 *
 * Scenarios:
 *
 * 1. The current plan is admitted by assertion and predicate with original object identity.
 * 2. Negative/fractional/unsafe revision and stale semantic content refuse.
 * 3. Schema version/extra/missing fields and inventory/baseline path, ordering, digest and presence refinements refuse even after refingerprinting.
 * 4. A changed title with freshly recomputed complete identity is admitted.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls actual asserting/boolean legacy-plan admission on a current plan and every mutated neighbor, requiring exact admitted object identity or typed refusal. Refingerprinting invalid plans isolates semantic validation from stale-fingerprint refusal.
 * @evidence contracts/testing.md#independent-expectations Literal safe-integer revision rules, src/generated/renders baseline order, nonnegative byte counts, digest spelling, relative-path and case-fold collision constraints determine each boolean expectation. The canonical fingerprint producer creates fixture identities, so this tests validation/staleness and not independent canonical hash bytes or live inventory authentication.
 * @evidence contracts/testing.md#distinguishing-cases Retains valid revision zero, negative/fractional/unsafe revisions, stale/recomputed title twins, version/extra/missing schema fields, baseline presence/count/order, invalid inventory bytes/digests/path/order, case-fold duplicate paths and file/directory collisions. Real migration apply/rollback and on-disk byte confirmation belong to legacy import integration tests.
 * @evidence contracts/testing.md#execution-ownership The named test_production_legacy_import_plan_admission owns all four portable synchronous mutation groups and its private typed arrangement/assertion helpers. No inventory path is opened, migration applied or filesystem state changed.
 */
export function test_production_legacy_import_plan_admission(): void {
  const current: IAutoMovieLegacyImportPlan = plan();
  const missingFingerprint: Partial<IAutoMovieLegacyImportPlan> = clone();
  delete missingFingerprint.fingerprint;
  TestValidator.equals(
    "the current exact plan is admitted by assertion and predicate",
    [
      assertAutoMovieLegacyImportPlan(current) === current,
      isAutoMovieLegacyImportPlan(current),
    ],
    [true, true],
  );
  TestValidator.equals(
    "revision boundaries and stale content are refused",
    [
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.legacyRevision = -1;
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.legacyRevision = 0.5;
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.legacyRevision = Number.MAX_SAFE_INTEGER + 1;
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.productionDraft.title = "changed";
      }),
    ],
    [true, true, true, true],
  );
  TestValidator.equals(
    "schema and runtime-only refinements remain part of one decision",
    [
      isAutoMovieLegacyImportPlan({ ...clone(), version: 2 }),
      isAutoMovieLegacyImportPlan({ ...clone(), extra: true }),
      isAutoMovieLegacyImportPlan(missingFingerprint),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.rollbackBaseline[0]!.path = "generated";
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.rollbackBaseline[0]!.existed = false;
        value.rollbackBaseline[0]!.directories.push("src/nested");
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.inventory[1]!.bytes = -1;
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.inventory[1]!.digest = null;
        value.inventory[1]!.bytes = 0;
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.inventory[1]!.digest = "sha256:not-a-digest";
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.inventory[1]!.path = "C:automovie.json";
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.inventory.reverse();
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        const first: IAutoMovieLegacyImportPlan["inventory"][number] = { ...value.inventory[1]!, path: "A.json" };
        value.inventory = [first, { ...first, path: "a.json" }];
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.rollbackBaseline[0]!.files[0]!.path = "src/nested";
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.rollbackBaseline[0]!.files[0]!.path = "src/NESTED";
        refingerprint(value);
      }),
      rejected((value: IAutoMovieLegacyImportPlan): void => {
        value.rollbackBaseline = value.rollbackBaseline.slice(0, 2);
        refingerprint(value);
      }),
    ],
    [
      false,
      false,
      false,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ],
  );
  const changed: IAutoMovieLegacyImportPlan = clone();
  changed.productionDraft.title = "Re-derived";
  refingerprint(changed);
  TestValidator.predicate(
    "a changed plan is admitted only with its recomputed complete identity",
    isAutoMovieLegacyImportPlan(changed),
  );
}
