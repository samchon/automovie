import type { IAutoMovieBuildProjectOutput } from "@automovie/interface";
import path from "node:path";

import type { AutoMovieProductionProject } from "./AutoMovieProductionProject";
import type { IAutoMovieProductionSourceEvaluation } from "./IAutoMovieProductionSourceEvaluation";
import type { IAutoMovieProductionSourceGateTrace } from "./IAutoMovieProductionSourceGateTrace";
import type { IAutoMovieProductionContentInput } from "./IAutoMovieProductionContentInput";
import { compareCodeUnits, digestAutoMovieBytes } from "./contentIdentity";
import { listAutoMovieProjectModules } from "./listAutoMovieProjectModules";
import { normalizeSlash } from "./productionBuildDiagnostics";

/**
 * Run the read-only source gate once and record what its answer rests on.
 *
 * The supplied builder reports every author-owned document its validation read; each observation becomes a digest in read order, preserving distinct reads of the same path. The live module cache is inspected after the run. The native builder evicts project modules before evaluation, so current project entries provide its observed loaded closure; a custom loader must supply equivalent live accounting. Entries outside declared content are named because their changes are not covered by that inventory's identity.
 *
 * The builder also reports whether the answer read the project revision into its judgment, allowing retention to require revision equality when that dependency exists. Current camera-clearance reports carry such a dependency; this evaluator forwards the actual trace flag rather than inferring it from report text.
 *
 * The gate's output is returned unchanged, including failures and diagnostics; gate exceptions propagate. Later module accounting or document hashing can also throw instead of returning an evaluation.
 *
 * @evidence contracts/common.md#principled-implementation The actual read-only gate supplies ordered document text/absence and revision dependency; the live completed-run module cache is projected to project-relative ids and compared with declared content, refusing retention when executed dependencies are unaccounted for.
 * @evidence contracts/common.md#clear-and-simple-design This evaluation owner pairs the gate result with actual observed dependencies; snapshot acquisition owns fresh bytes and the retention owner decides whether those facts prove later reuse.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Module-cache presence is dependency accounting, not proof ordinary Node effects are deterministic; failed content enumeration becomes an empty declared set so executed project modules cannot be falsely treated as declared.
 * @evidence contracts/common.md#meaningful-documentation States ordered actual document reads, live post-run loader observations, declared-module comparison and unchanged gate failure/exception propagation.
 * @evidence contracts/performance.md#efficient-algorithms Cost includes the full source gate, scanning loader keys and declared content paths, hashing total observed document UTF-8 bytes and sorting undeclared relative module ids; graph/module/content populations and domain evaluation dominate rather than just the local DTO allocation.
 * @evidence contracts/performance.md#reuse-equivalent-work The gate's actual dependency trace serves later snapshot proof; repeat document observations remain ordered and distinct, while one declared-path set answers all executed-module membership checks in this run.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned output, document digests and undeclared module names transfer to status retention; local sets/arrays scale with loader/content/read populations, and the gate/project readers own handles and authored effects. This projection starts no task.
 */
export function evaluateAutoMovieProductionSource(props: {
  /** Project handle the gate reads. */
  project: AutoMovieProductionProject;

  /** Builder whose read-only source gate this run executes. */
  builder: {
    /**
     * Run the read-only gate at source scope and report the documents its validation read and whether its answer read the project revision.
     */
    lintSource(): IAutoMovieProductionSourceGateTrace & {
      /** The gate's own answer. */
      output: IAutoMovieBuildProjectOutput;
    };
  };

  /** Process module cache, keyed by absolute module id. */
  moduleCache: Readonly<Record<string, unknown>>;
}): IAutoMovieProductionSourceEvaluation {
  const gate: ReturnType<typeof props.builder.lintSource> = props.builder.lintSource();
  const root: string = props.project.root;
  const executed: string[] = listAutoMovieProjectModules({
    root,
    loaded: Object.keys(props.moduleCache),
  }).map((id: string): string => normalizeSlash(path.relative(root, id)));
  let declared: ReadonlySet<string>;
  try {
    declared = new Set(
      props.project.contentInputs().map((input: IAutoMovieProductionContentInput): string => input.path),
    );
  } catch {
    declared = new Set();
  }
  return {
    output: gate.output,
    documents: gate.documents.map((document: IAutoMovieProductionSourceGateTrace["documents"][number]): IAutoMovieProductionSourceEvaluation["documents"][number] => ({
      path: document.path,
      digest:
        document.content === null
          ? null
          : digestAutoMovieBytes(Buffer.from(document.content, "utf8")),
    })),
    undeclaredModules: executed
      .filter((module: string): boolean => declared.has(module) === false)
      .sort(compareCodeUnits),
    revisionBound: gate.revisionBound,
  };
}
