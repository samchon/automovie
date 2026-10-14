import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type {
  IAutoMovieDiagnostic,
  IAutoMovieDerivedArtifactSource,
  IAutoMovieLibraryBuildContext,
} from "@automovie/interface";
import {
  autoMovieLibraryContributionDiagnostics,
  collectLibrarySourceRegistrations,
  resolveAutoMovieSourceOwnerBinding,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import { createHash } from "node:crypto";

/**
 * Exact branch, document and anchor supplied by the registration fixture, without authenticating a physical owner or retaining a runtime resource.
 *
 * @author Samchon
 */
interface IOwner {
  branch: string;
  document: string;
  anchor: string;
}

const SOURCE: string = "src/libraries/lantern.ts";
const SOURCE_DIGEST: string = `sha256:${"0".repeat(64)}`;
const ARTIFACT: string = "automovie/derived/lantern-contribution.json";
const NOTES: string = "automovie/derived/lantern-notes.txt";
const SETTINGS: IOwner = {
  branch: "productionSources",
  document: "docs/settings/delivery.md",
  anchor: "delivery",
};
const MODELS: IOwner = {
  branch: "models",
  document: "docs/models/lantern.md",
  anchor: "lantern",
};

const address: (owner: IOwner) => string = (owner: IOwner): string => `${owner.document}#${owner.anchor}`;

const artifact: (text: string) => IAutoMovieDerivedArtifactSource = (text: string): IAutoMovieDerivedArtifactSource => ({
  digest: `sha256:${createHash("sha256").update(Buffer.from(text, "utf8")).digest("hex")}`,
  encoding: "utf8",
  content: text,
});

const binding: (owner: IOwner, exportName: string) => IAutoMovieProductionEvidenceSourceOwnerBinding = (
  owner: IOwner,
  exportName: string,
): IAutoMovieProductionEvidenceSourceOwnerBinding => ({
  branch: owner.branch,
  stage: "source",
  enforced: true,
  relationship: "lineage",
  sourcePath: SOURCE,
  exportName,
  symbolKind: "property",
  sourceDigest: SOURCE_DIGEST,
  targetPath: owner.document,
  targetAnchor: owner.anchor,
});

const collect: (owner: IOwner, exports: Record<string, unknown>, derivedArtifacts: Record<string, IAutoMovieDerivedArtifactSource>) => ReturnType<typeof collectLibrarySourceRegistrations> = (
  owner: IOwner,
  exports: Record<string, unknown>,
  derivedArtifacts: Record<string, IAutoMovieDerivedArtifactSource>,
): ReturnType<typeof collectLibrarySourceRegistrations> =>
  collectLibrarySourceRegistrations({
    path: SOURCE,
    load: (): Record<string, unknown> => exports,
    context: (design: string): IAutoMovieLibraryBuildContext | null =>
      design === address(owner)
        ? {
            production: "plaza",
            branch: owner.branch,
            design: owner.document,
            anchor: owner.anchor,
            derivedArtifacts,
          }
        : null,
    admit: (exportName: string, design: string): { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string; } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null; } =>
      resolveAutoMovieSourceOwnerBinding({
        bindings: [binding(owner, exportName)],
        branch: owner.branch,
        sourcePath: SOURCE,
        exportName,
        owner: design,
        sourceDigest: SOURCE_DIGEST,
        requireReviewed: false,
      }),
  });

const derivedOwner: (owner: IOwner) => { lantern: { design: string; derivedArtifact: string; }; } = (owner: IOwner): { lantern: { design: string; derivedArtifact: string; }; } => ({
  lantern: { design: address(owner), derivedArtifact: ARTIFACT },
});

/**
 * Derived library contributions reach duplicate-aware JSON ingress, with ingress, schema and branch refusals attributed to the selected artifact; conflicting contribution forms remain source refusals.
 *
 * A declarative owner selects a precomputed contribution instead of returning one, so a host parser that keeps the last of two same-named members would turn an ambiguous artifact into an accepted one, and a schema or branch refusal that told the author to fix a returned value would send them to a source file that returned nothing. An executed owner is the twin: its value never passes through JSON admission, a plain text artifact reaches it verbatim, and its refusals keep pointing at its own source.
 *
 * Scenarios:
 *
 * 1. A derived owner whose artifact repeats `models` registers nothing and is
 *    refused once at the artifact path by the ingress's duplicate stage; the
 *    same owner over unique members registers the exact contribution.
 * 2. An executed owner registers the same contribution and reads a text
 *    artifact whose content only looks like JSON with duplicate members,
 *    unparsed.
 * 3. Declaring `build` beside `derivedArtifact` is refused at the source path,
 *    because the choice of form is the source's mistake.
 * 4. A schema-invalid derived contribution is refused at the artifact path with
 *    a generator correction, while the same invalid value returned by `build` is
 *    refused at the source path with the returned-value correction.
 * 5. A branch rule refusal for a models owner passes the contract's message
 *    through unchanged at the source path for an executed owner, and at the
 *    artifact path with the generator correction appended for a derived one.
 *
 * @evidence contracts/testing.md#behavioral-verification Collects derived and executed library contributions and asserts registrations and attributed refusals, catching duplicate-key admission or advice aimed at the wrong source or artifact.
 * @evidence contracts/testing.md#independent-expectations Literal contribution shapes, refusal codes and source versus artifact paths derive from duplicate-aware ingress and branch contracts; the branch-message comparison uses the same rule helper and does not independently prove its wording.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts duplicate and unique JSON, verbatim text for executed owners, conflicting contribution forms, malformed schema and branch refusal under both forms; broader module-evaluation failures belong to the registration-refusal test.
 * @evidence contracts/testing.md#execution-ownership This named portable unit entry owns all collector callbacks over resident exports and artifacts and starts no generated consumer, process or production host.
 */
export function test_production_library_source_derived_registration(): void {
  const empty: { environments: never[]; models: never[]; } = { environments: [], models: [] };
  const registered: { export: string; design: string; contribution: { environments: never[]; models: never[]; contexts: never[]; }; }[] = [
    {
      export: "lantern",
      design: address(SETTINGS),
      contribution: { environments: [], models: [], contexts: [] },
    },
  ];

  // 1. Duplicate members are refused through the shared ingress.
  const duplicate: ReturnType<typeof collectLibrarySourceRegistrations> = collect(SETTINGS, derivedOwner(SETTINGS), {
    [ARTIFACT]: artifact('{"environments":[],"models":[],"models":[]}'),
  });
  TestValidator.equals(
    "a repeated member never reaches contribution validation",
    {
      registrations: duplicate.registrations,
      refusals: duplicate.diagnostics.map((diagnostic: IAutoMovieDiagnostic): { code: IAutoMovieDiagnostic["code"]; path: string | null; duplicateStage: boolean; } => ({
        code: diagnostic.code,
        path: diagnostic.path,
        duplicateStage:
          diagnostic.message.includes("failed duplicate admission") &&
          diagnostic.message.includes('duplicate member "models"'),
      })),
    },
    {
      registrations: [],
      refusals: [
        {
          code: "source-export-invalid",
          path: ARTIFACT,
          duplicateStage: true,
        },
      ],
    },
  );
  TestValidator.equals(
    "unique members register the selected contribution",
    collect(SETTINGS, derivedOwner(SETTINGS), {
      [ARTIFACT]: artifact(JSON.stringify(empty)),
    }),
    { registrations: registered, diagnostics: [] },
  );

  // 2. An executed owner reads a text artifact verbatim.
  const notes: string = '# lantern notes {"a":1,"a":2}\n';
  const observed: { text: string | null } = { text: null };
  const built: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
    SETTINGS,
    {
      lantern: {
        design: address(SETTINGS),
        build: (context: IAutoMovieLibraryBuildContext): { environments: never[]; models: never[]; } => {
          observed.text = context.derivedArtifacts[NOTES]?.content ?? null;
          return empty;
        },
      },
    },
    { [NOTES]: artifact(notes) },
  );
  TestValidator.equals(
    "an executed owner and its plain text input are unchanged",
    { ...built, seen: observed.text },
    { registrations: registered, diagnostics: [], seen: notes },
  );

  // 3. Declaring both forms is the source's mistake.
  const both: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
    SETTINGS,
    {
      lantern: {
        design: address(SETTINGS),
        derivedArtifact: ARTIFACT,
        build: (): { environments: never[]; models: never[]; } => empty,
      },
    },
    { [ARTIFACT]: artifact(JSON.stringify(empty)) },
  );
  TestValidator.equals(
    "both forms are refused at the source",
    both.diagnostics.map((diagnostic: IAutoMovieDiagnostic): (string | null)[] => [diagnostic.code, diagnostic.path]),
    [["source-export-invalid", SOURCE]],
  );

  // 4. Schema refusals name what has to change.
  const invalid: { environments: never[]; models: string; } = { environments: [], models: "lantern" };
  const derivedSchema: ReturnType<typeof collectLibrarySourceRegistrations> = collect(SETTINGS, derivedOwner(SETTINGS), {
    [ARTIFACT]: artifact(JSON.stringify(invalid)),
  });
  const builtSchema: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
    SETTINGS,
    { lantern: { design: address(SETTINGS), build: (): { environments: never[]; models: string; } => invalid } },
    {},
  );
  TestValidator.predicate(
    "a derived schema refusal names the artifact and its generator",
    derivedSchema.registrations.length === 0 &&
      derivedSchema.diagnostics.length !== 0 &&
      derivedSchema.diagnostics.every(
        (diagnostic: IAutoMovieDiagnostic): boolean =>
          diagnostic.path === ARTIFACT &&
          diagnostic.message.includes(
            `generator of derived artifact "${ARTIFACT}"`,
          ) &&
          diagnostic.message.includes("returned library contribution") ===
            false,
      ),
  );
  TestValidator.predicate(
    "an executed schema refusal still names the returned value in its source",
    builtSchema.registrations.length === 0 &&
      builtSchema.diagnostics.length !== 0 &&
      builtSchema.diagnostics.every(
        (diagnostic: IAutoMovieDiagnostic): boolean =>
          diagnostic.path === SOURCE &&
          diagnostic.message.endsWith(
            `Fix the returned library contribution in ${SOURCE}.`,
          ),
      ),
  );

  // 5. Branch rules keep their message and gain the right attribution.
  const rule: string[] = autoMovieLibraryContributionDiagnostics("models", {
    ...empty,
    contexts: [],
  });
  TestValidator.predicate(
    "an empty models contribution violates the models branch rule",
    rule.length !== 0,
  );
  const derivedBranch: ReturnType<typeof collectLibrarySourceRegistrations> = collect(MODELS, derivedOwner(MODELS), {
    [ARTIFACT]: artifact(JSON.stringify(empty)),
  });
  const builtBranch: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
    MODELS,
    { lantern: { design: address(MODELS), build: (): { environments: never[]; models: never[]; } => empty } },
    {},
  );
  TestValidator.equals(
    "an executed owner receives the branch rule unchanged at its source",
    builtBranch.diagnostics.map((diagnostic: IAutoMovieDiagnostic): (string | null)[] => [
      diagnostic.path,
      diagnostic.message,
    ]),
    rule.map((message: string): string[] => [SOURCE, message]),
  );
  TestValidator.equals(
    "a derived owner receives the branch rule at its artifact with the generator correction",
    derivedBranch.diagnostics.map((diagnostic: IAutoMovieDiagnostic, index: number): (string | boolean | null)[] => [
      diagnostic.path,
      diagnostic.message.startsWith(`${rule[index]} `),
      diagnostic.message.includes(
        `generator of derived artifact "${ARTIFACT}"`,
      ) && diagnostic.message.includes("generation command"),
    ]),
    rule.map((): (string | boolean)[] => [ARTIFACT, true, true]),
  );
  TestValidator.equals(
    "branch refusals register nothing",
    [derivedBranch.registrations, builtBranch.registrations],
    [[], []],
  );
}
