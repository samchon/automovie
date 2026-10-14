import type { IAutoMovieProductionEvidenceSourceOwnerBinding } from "@automovie/evidence";
import type {
  IAutoMovieDiagnostic,
  IAutoMovieLibraryBuildContext,
} from "@automovie/interface";
import {
  buildLibrarySource,
  collectLibrarySourceRegistrations,
  resolveAutoMovieSourceOwnerBinding,
} from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

const SOURCE: string = "src/libraries/lantern.ts";
const SOURCE_DIGEST: string = `sha256:${"0".repeat(64)}`;
const DOCUMENT: string = "docs/settings/delivery.md";
const DESIGN: string = `${DOCUMENT}#delivery`;
const EMPTY: { environments: never[]; models: never[]; } = { environments: [], models: [] };

/** Throw an authored value that is not an Error, as a library module may. */
const thrown: (value: unknown) => never = (value: unknown): never => {
  throw value;
};

const context: (design: string) => IAutoMovieLibraryBuildContext | null = (design: string): IAutoMovieLibraryBuildContext | null =>
  design === DESIGN
    ? {
        production: "plaza",
        branch: "productionSources",
        design: DOCUMENT,
        anchor: "delivery",
        derivedArtifacts: {},
      }
    : null;

const binding: (exportName: string) => IAutoMovieProductionEvidenceSourceOwnerBinding = (
  exportName: string,
): IAutoMovieProductionEvidenceSourceOwnerBinding => ({
  branch: "productionSources",
  stage: "source",
  enforced: true,
  relationship: "lineage",
  sourcePath: SOURCE,
  exportName,
  symbolKind: "property",
  sourceDigest: SOURCE_DIGEST,
  targetPath: DOCUMENT,
  targetAnchor: "delivery",
});

const admitWith: (bound: readonly string[]) => (exportName: string, design: string) => { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string; } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null; } =
  (bound: readonly string[]): (exportName: string, design: string) => { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string; } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null; } => (exportName: string, design: string): { success: false; binding: null; reason: "missing" | "ambiguous" | "owner" | "digest" | "review"; message: string; } | { success: true; binding: IAutoMovieProductionEvidenceSourceOwnerBinding; reason: null; message: null; } =>
    resolveAutoMovieSourceOwnerBinding({
      bindings: bound.map(binding),
      branch: "productionSources",
      sourcePath: SOURCE,
      exportName,
      owner: design,
      sourceDigest: SOURCE_DIGEST,
      requireReviewed: false,
    });

const collect: (load: () => Readonly<Record<string, unknown>>, bound: readonly string[]) => ReturnType<typeof collectLibrarySourceRegistrations> = (
  load: () => Readonly<Record<string, unknown>>,
  bound: readonly string[],
): ReturnType<typeof collectLibrarySourceRegistrations> =>
  collectLibrarySourceRegistrations({
    path: SOURCE,
    load,
    context,
    admit: admitWith(bound),
  });

const shape: (result: ReturnType<typeof collect>) => { registered: string[]; refused: (string | null)[][]; } = (result: ReturnType<typeof collect>): { registered: string[]; refused: (string | null)[][]; } => ({
  registered: result.registrations.map((registration: ReturnType<typeof collect>["registrations"][number]): string => registration.export),
  refused: result.diagnostics.map((diagnostic: IAutoMovieDiagnostic): (string | null)[] => [
    diagnostic.code,
    diagnostic.target,
    diagnostic.path,
  ]),
});

const failures: (result: ReturnType<typeof collect>) => string[] = (result: ReturnType<typeof collect>): string[] =>
  result.diagnostics
    .filter((diagnostic: IAutoMovieDiagnostic): boolean => diagnostic.code === "source-execution-failed")
    .map((diagnostic: IAutoMovieDiagnostic): string => diagnostic.message);

/**
 * One evaluated library module yields its admitted owners and attributes the covered discovery, admission and evaluation refusals to their export or module.
 *
 * The builder cannot know an owner's export name in advance, so the collector discovers owners by shape. A value that is not an object naming a string `design`, or one that names a design with neither `build` nor `derivedArtifact`, is a helper rather than an owner and must stay silent. An owner the authoring declaration does not know, an owner edge the graph did not select, and an asynchronous result are each refused before anything is registered. Evaluation or a build that throws abandons every registration from that module, because a partially evaluated module is not a result, while refusals already recorded stay visible beside the failure.
 *
 * Scenarios:
 *
 * 1. A module mixing two owners with a function, a number, null, an object
 *    without `design`, a non-string `design`, and an inert design object
 *    registers exactly the two owners, in code-unit order of their export
 *    names.
 * 2. A non-string `derivedArtifact` is refused as a selection of `null` at the
 *    source path.
 * 3. An unknown design is `source-registration-mismatch`, an unbound owner edge
 *    is `source-owner-mismatch`, and a Promise result is
 *    `source-export-invalid`, each at its own export target.
 * 4. An explicit empty `contexts` registers the same normalized contribution
 *    as an omitted one.
 * 5. A throwing module evaluation, a build throwing a string, and a build
 *    throwing an object without a message are `source-execution-failed` naming
 *    the module or the export and the thrown value, and discard an earlier
 *    registration while keeping an earlier refusal.
 * 6. `buildLibrarySource` evaluates a real module through Node's loader: this
 *    scenario's own file carries no owner and yields nothing, and a path that
 *    does not exist is refused as a module evaluation failure.
 *
 * @evidence contracts/testing.md#behavioral-verification Collects evaluated exports and checks exact registrations, normalization and per-export refusals, catching helpers registered as owners or partial registrations surviving evaluation failure.
 * @evidence contracts/testing.md#independent-expectations Literal accepted export names, refusal codes and target paths derive from owner shape, graph admission and synchronous contribution requirements; substring checks limit the oracle for full failure wording. The represented thrown Error/string/plain-object values do not cover thrown values whose own string conversion fails.
 * @evidence contracts/testing.md#distinguishing-cases Covers helper shapes, malformed artifact selection, unknown and unbound owners, Promise results, omitted and empty contexts, thrown Error/string/object values, a real module with no owners and an absent module path; derived JSON duplication belongs to its adjacent test.
 * @evidence contracts/testing.md#execution-ownership This named unit entry owns all collector callbacks and an in-process Node module evaluation of its own fixture plus a missing path; it installs no consumer, builds no native artifact and starts no separate host.
 */
export function test_production_library_source_registration_refusals(): void {
    // 1. Discovery by shape and deterministic order.
    TestValidator.equals(
      "only design owners with a build or derived form are discovered",
      shape(
        collect(
          (): { zeta: { design: string; build: () => { environments: never[]; models: never[]; }; }; alpha: { design: string; build: () => { environments: never[]; models: never[]; }; }; helper: () => { environments: never[]; models: never[]; }; constant: number; nothing: null; noDesign: { build: () => { environments: never[]; models: never[]; }; }; numericDesign: { design: number; build: () => { environments: never[]; models: never[]; }; }; inert: { design: string; }; } => ({
            zeta: { design: DESIGN, build: (): { environments: never[]; models: never[]; } => EMPTY },
            alpha: { design: DESIGN, build: (): { environments: never[]; models: never[]; } => EMPTY },
            helper: (): { environments: never[]; models: never[]; } => EMPTY,
            constant: 3,
            nothing: null,
            noDesign: { build: (): { environments: never[]; models: never[]; } => EMPTY },
            numericDesign: { design: 4, build: (): { environments: never[]; models: never[]; } => EMPTY },
            inert: { design: DESIGN },
          }),
          ["alpha", "zeta"],
        ),
      ),
      { registered: ["alpha", "zeta"], refused: [] },
    );

    // 2. A non-string derived selection is a null selection.
    const nonString: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
      (): { lantern: { design: string; derivedArtifact: number; }; } => ({ lantern: { design: DESIGN, derivedArtifact: 7 } }),
      ["lantern"],
    );
    TestValidator.equals(
      "a non-string derived selection is refused at the source",
      [
        shape(nonString),
        nonString.diagnostics.every((diagnostic: IAutoMovieDiagnostic): boolean =>
          diagnostic.message.includes("Received null."),
        ),
      ],
      [
        {
          registered: [],
          refused: [
            [
              "source-export-invalid",
              `library-source:${SOURCE}:lantern`,
              SOURCE,
            ],
          ],
        },
        true,
      ],
    );

    // 3. Unknown design, unbound edge, and asynchronous result.
    TestValidator.equals(
      "each admission failure is refused at its export",
      shape(
        collect(
          (): { asynchronous: { design: string; build: () => Promise<{ environments: never[]; models: never[]; }>; }; unbound: { design: string; build: () => { environments: never[]; models: never[]; }; }; unknown: { design: string; build: () => { environments: never[]; models: never[]; }; }; } => ({
            asynchronous: {
              design: DESIGN,
              build: (): Promise<{ environments: never[]; models: never[]; }> => Promise.resolve(EMPTY),
            },
            unbound: { design: DESIGN, build: (): { environments: never[]; models: never[]; } => EMPTY },
            unknown: { design: "docs/settings/other.md#x", build: (): { environments: never[]; models: never[]; } => EMPTY },
          }),
          ["asynchronous", "unknown"],
        ),
      ),
      {
        registered: [],
        refused: [
          [
            "source-export-invalid",
            `library-source:${SOURCE}:asynchronous`,
            SOURCE,
          ],
          ["source-owner-mismatch", `library-source:${SOURCE}:unbound`, SOURCE],
          [
            "source-registration-mismatch",
            `library-source:${SOURCE}:unknown`,
            SOURCE,
          ],
        ],
      },
    );

    // 4. Explicit and omitted contexts normalize alike.
    const normalized: { registrations: { export: string; design: string; contribution: { environments: never[]; models: never[]; contexts: never[]; }; }[]; diagnostics: never[]; } = {
      registrations: [
        {
          export: "lantern",
          design: DESIGN,
          contribution: { environments: [], models: [], contexts: [] },
        },
      ],
      diagnostics: [],
    };
    TestValidator.equals(
      "contexts normalize to one list",
      [
        collect(
          (): { lantern: { design: string; build: () => { contexts: never[]; environments: never[]; models: never[]; }; }; } => ({
            lantern: {
              design: DESIGN,
              build: (): { contexts: never[]; environments: never[]; models: never[]; } => ({ ...EMPTY, contexts: [] }),
            },
          }),
          ["lantern"],
        ),
        collect(
          (): { lantern: { design: string; build: () => { environments: never[]; models: never[]; }; }; } => ({ lantern: { design: DESIGN, build: (): { environments: never[]; models: never[]; } => EMPTY } }),
          ["lantern"],
        ),
      ],
      [normalized, normalized],
    );

    // 5. Evaluation failures abandon registrations and keep refusals.
    const evaluation: ReturnType<typeof collectLibrarySourceRegistrations> = collect((): never => thrown(new Error("module exploded")), []);
    const thrownString: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
      (): { a: { design: string; build: () => { environments: never[]; models: never[]; }; }; b: { design: string; build: () => { environments: never[]; models: never[]; }; }; c: { design: string; build: () => never; }; } => ({
        a: { design: DESIGN, build: (): { environments: never[]; models: never[]; } => EMPTY },
        b: { design: "docs/settings/other.md#x", build: (): { environments: never[]; models: never[]; } => EMPTY },
        c: { design: DESIGN, build: (): never => thrown("string failure") },
      }),
      ["a", "c"],
    );
    const thrownObject: ReturnType<typeof collectLibrarySourceRegistrations> = collect(
      (): { lantern: { design: string; build: () => never; }; } => ({
        lantern: { design: DESIGN, build: (): never => thrown({ reason: 1 }) },
      }),
      ["lantern"],
    );
    TestValidator.equals(
      "a throwing module or build is refused and publishes nothing",
      [shape(evaluation), shape(thrownString), shape(thrownObject)],
      [
        {
          registered: [],
          refused: [
            ["source-execution-failed", `library-source:${SOURCE}`, SOURCE],
          ],
        },
        {
          registered: [],
          refused: [
            [
              "source-registration-mismatch",
              `library-source:${SOURCE}:b`,
              SOURCE,
            ],
            ["source-execution-failed", `library-source:${SOURCE}`, SOURCE],
          ],
        },
        {
          registered: [],
          refused: [
            ["source-execution-failed", `library-source:${SOURCE}`, SOURCE],
          ],
        },
      ],
    );
    TestValidator.predicate(
      "each failure names where evaluation stopped and what was thrown",
      failures(evaluation).every((message: string): boolean =>
        message.startsWith(
          `Library source the module in ${SOURCE} failed while building its contribution: module exploded.`,
        ),
      ) &&
        failures(thrownString).every((message: string): boolean =>
          message.startsWith(
            `Library source export "c" in ${SOURCE} failed while building its contribution: string failure.`,
          ),
        ) &&
        failures(thrownObject).every((message: string): boolean =>
          message.startsWith(
            `Library source export "lantern" in ${SOURCE} failed while building its contribution: [object Object].`,
          ),
        ) &&
        [evaluation, thrownString, thrownObject].every(
          (result: ReturnType<typeof collectLibrarySourceRegistrations>): boolean => failures(result).length === 1,
        ),
    );

    // 6. The real loader boundary.
    const sourceRoot: string = path.resolve(__dirname, "../../..");
    const self: string = path
      .relative(sourceRoot, __filename)
      .split(path.sep)
      .join("/");
    const absent: string = "src/features/production/__absent_library_source__.ts";
    TestValidator.equals(
      "the loader hands a real module's exports to the collector",
      [
        buildLibrarySource({
          path: self,
          source: "",
          sourceRoot,
          context,
          admit: admitWith([]),
        }),
        shape(
          buildLibrarySource({
            path: absent,
            source: "",
            sourceRoot,
            context,
            admit: admitWith([]),
          }),
        ),
      ],
      [
        { registrations: [], diagnostics: [] },
        {
          registered: [],
          refused: [
            ["source-execution-failed", `library-source:${absent}`, absent],
          ],
        },
      ],
    );
  }
