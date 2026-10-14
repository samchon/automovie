import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import type { IAutoMovieProductionContentInput } from "@automovie/production";
import { TestValidator } from "@nestia/e2e";
import path from "node:path";

import { loadSourceModule } from "../internal/loadSourceModule";
import {
  type ISourceStatusEvaluation,
  productionModule,
  textDigest,
} from "./sourceStatusFixtures";

const { evaluateAutoMovieProductionSource } = loadSourceModule<{
  evaluateAutoMovieProductionSource(props: {
    project: object;
    builder: {
      lintSource(): {
        output: IAutoMovieBuildProjectOutput;
        documents: ReadonlyArray<{ path: string; content: string | null }>;
        revisionBound: boolean;
      };
    };
    moduleCache: Readonly<Record<string, unknown>>;
  }): ISourceStatusEvaluation;
}>(productionModule("evaluateAutoMovieProductionSource.ts"));

const ROOT: string = path.join(path.parse(process.cwd()).root, "workspace", "harbor");

const outputOf: () => IAutoMovieBuildProjectOutput = (): IAutoMovieBuildProjectOutput => ({
  success: true,
  revision: 11,
  builder: { version: "unit", inputFingerprint: textDigest("harbor input") },
  diagnostics: [],
  materialized: [],
});

const CONTENT: IAutoMovieProductionContentInput[] = [
  {
    path: "src/shots/opening.ts",
    source: true,
    render: false,
    bytes: Buffer.from("export const opening = 1;\n", "utf8"),
  },
  {
    path: "scripts/capture.ts",
    source: false,
    render: true,
    bytes: Buffer.from("export {};\n", "utf8"),
  },
];

const MODULE_CACHE: Readonly<Record<string, unknown>> = {
  [path.join(ROOT, "src", "shots", "opening.ts")]: {},
  [path.join(ROOT, "src", "helpers", "zeta.ts")]: {},
  [path.join(ROOT, "lint.config.ts")]: {},
  [path.join(ROOT, "scripts", "capture.ts")]: {},
  [path.join(ROOT, "node_modules", "@automovie", "engine", "src", "index.ts")]:
    {},
  [path.join(path.parse(ROOT).root, "tools", "ttsx", "index.js")]: {},
};

/**
 * One gate run records exactly what its answer rests on.
 *
 * The builder reports every author-owned document its validation read, and the
 * run keeps the digest of each text in read order, so the same document read
 * twice with different text stays visible as two digests. The builder also says
 * whether the answer read the project revision, and that fact is carried as is.
 * The project modules loaded after the run are the closure it executed, and any
 * of them the fingerprinted content inventory does not cover is named, because
 * nothing a later check recomputes would see an edit to it.
 *
 * Scenarios:
 *
 * 1. Documents are recorded in read order, including a repeated read with
 *    changed text and an absent document, the gate's output object is returned
 *    as is, and a revision-bound answer stays revision-bound.
 * 2. A helper and the lint configuration the run executed outside the content
 *    inventory are named in path order, while a covered shot module and capture
 *    script, an installed package and a module outside the project are not.
 * 3. An unreadable content inventory names every executed project module, and an
 *    answer that did not read the revision stays unbound.
 * 4. A gate exception propagates as the same error before the inventory is
 *    read.
 *
 * @evidence contracts/testing.md#behavioral-verification Runs the actual private source evaluator with an explicit builder result and loader cache, comparing ordered document digests, output identity, revision dependence and sorted undeclared module names; a thrown gate must propagate identically before any inventory read.
 * @evidence contracts/testing.md#independent-expectations Expected module paths, null absence and booleans are literal; expected text digests use Node crypto through the shared fixture helper independently of the production digest wrapper.
 * @evidence contracts/testing.md#distinguishing-cases Preserves repeated changed documents and an absent document, declared source/render modules versus undeclared helper/config, installed/external modules, failed inventory and a gate exception, with bound and unbound revision answers.
 * @evidence contracts/testing.md#execution-ownership The synchronous named test loads the maintained evaluator through the existing require hook and supplies resident builder/project capabilities and cache keys. It does not execute those modules or prove a live loader's closure, native builder behavior or later retention safety.
 */
export function test_production_source_evaluation_trace(): void {
  const OUTPUT: IAutoMovieBuildProjectOutput = outputOf();
  let inventoryReads: number = 0;
  const projectOf: (contentInputs: () => IAutoMovieProductionContentInput[]) => { root: string; contentInputs: () => IAutoMovieProductionContentInput[] } = (
    contentInputs: () => IAutoMovieProductionContentInput[],
  ): { root: string; contentInputs: () => IAutoMovieProductionContentInput[] } => ({
    root: ROOT,
    contentInputs: (): IAutoMovieProductionContentInput[] => {
      inventoryReads += 1;
      return contentInputs();
    },
  });
  const builderOf: (revisionBound: boolean) => Parameters<typeof evaluateAutoMovieProductionSource>[0]["builder"] = (revisionBound: boolean): Parameters<typeof evaluateAutoMovieProductionSource>[0]["builder"] => ({
    lintSource: (): ReturnType<Parameters<typeof evaluateAutoMovieProductionSource>[0]["builder"]["lintSource"]> => ({
      output: OUTPUT,
      documents: [
        { path: "docs/screenplays/001-harbor.md", content: "INT. HARBOR" },
        { path: "docs/treatment.md", content: null },
        { path: "docs/screenplays/001-harbor.md", content: "EXT. HARBOR" },
      ],
      revisionBound,
    }),
  });
  const evaluation: ISourceStatusEvaluation = evaluateAutoMovieProductionSource({
    project: projectOf((): IAutoMovieProductionContentInput[] => CONTENT),
    builder: builderOf(true),
    moduleCache: MODULE_CACHE,
  });
  TestValidator.equals(
    "documents are recorded in read order with the text each read saw",
    {
      sameOutput: evaluation.output === OUTPUT,
      documents: evaluation.documents,
      revisionBound: evaluation.revisionBound,
    },
    {
      sameOutput: true,
      documents: [
        {
          path: "docs/screenplays/001-harbor.md",
          digest: textDigest("INT. HARBOR"),
        },
        { path: "docs/treatment.md", digest: null },
        {
          path: "docs/screenplays/001-harbor.md",
          digest: textDigest("EXT. HARBOR"),
        },
      ],
      revisionBound: true,
    },
  );
  TestValidator.equals(
    "executed project modules outside the content inventory are named",
    evaluation.undeclaredModules,
    ["lint.config.ts", "src/helpers/zeta.ts"],
  );

  const unreadable: ISourceStatusEvaluation = evaluateAutoMovieProductionSource({
    project: projectOf((): IAutoMovieProductionContentInput[] => {
      throw new Error("Declared content root escapes the project.");
    }),
    builder: builderOf(false),
    moduleCache: MODULE_CACHE,
  });
  TestValidator.equals(
    "an unreadable inventory names every executed project module",
    {
      undeclaredModules: unreadable.undeclaredModules,
      revisionBound: unreadable.revisionBound,
    },
    {
      undeclaredModules: [
        "lint.config.ts",
        "scripts/capture.ts",
        "src/helpers/zeta.ts",
        "src/shots/opening.ts",
      ],
      revisionBound: false,
    },
  );

  const crash: Error = new Error("shot module threw during evaluation");
  const readsBefore: number = inventoryReads;
  let thrown: unknown;
  try {
    evaluateAutoMovieProductionSource({
      project: projectOf((): IAutoMovieProductionContentInput[] => CONTENT),
      builder: {
        lintSource: (): never => {
          throw crash;
        },
      },
      moduleCache: MODULE_CACHE,
    });
  } catch (error) {
    thrown = error;
  }
  TestValidator.equals(
    "a gate exception propagates before the inventory is read",
    {
      sameError: thrown === crash,
      inventoryReads: inventoryReads - readsBefore,
    },
    { sameError: true, inventoryReads: 0 },
  );
}
