import { validateBuiltEnvironment, validateDesignLineage, validateModel, validatePropPlacements } from "@automovie/engine";
import { IAutoMovieDiagnostic, IAutoMovieModel, IAutoMovieProductionShotProgram, IAutoMovieShotBuildContext, type IAutoMovieBuiltEnvironment, type IAutoMovieDesignLineage, type IAutoMoviePropSpec, type IAutoMovieStageSetPiece, type IAutoMovieValidation } from "@automovie/interface";
import { canonicalAutoMovieJsonBytes, digestAutoMovieBytes } from "./contentIdentity";
import { buildingBoundDiagnostics } from "./productionEnvironmentValidation";
import type { IAutoMovieSourceContentFinding } from "./IAutoMovieSourceContentFinding";
import { autoMovieSourceContentDiagnostic } from "./autoMovieSourceContentDiagnostic";
import { autoMovieSourceContentFinding } from "./autoMovieSourceContentFinding";
import { autoMovieValidationFindings } from "./autoMovieValidationFindings";
import { createAutoMovieSourceRuntimeModelRegistry } from "./createAutoMovieSourceRuntimeModelRegistry";
import type { IProductionShotSourceRuntime } from "./IProductionShotSourceRuntime";

/**
 * Validate and register shot-owned models, building references, lineages and staged content against the builder's exact own-key registry. Generated models and explicitly cited sealed imported appearances follow distinct admission rules.
 *
 * @evidence contracts/common.md#principled-implementation Canonical byte digests distinguish duplicate authored ids; builder-key and contained-id sets refuse shadowing. Imported closures are compared with registered bytes. Model validation failures become blocking source-content messages, while lineage, building-bound and placement findings use their classification adapters.
 * @evidence contracts/common.md#clear-and-simple-design One mutable registry serves model admission, building-reference resolution and staged availability, then its portable record and values feed motion and actor consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Imported appearances require an explicit registered reference. Some reference/content errors coexist with registered models, so assembly must refuse error-bearing results. Model validator warnings are currently omitted, and its failure kinds are flattened into blocking source-content messages; other domain findings retain adapter classifications.
 * @evidence contracts/common.md#meaningful-documentation Documents borrowed builder models, generated-versus-imported rules, first authored digest semantics, accumulated errors/warnings and the caller's responsibility to refuse error-bearing output.
 * @evidence contracts/performance.md#efficient-algorithms Every authored model occurrence is canonically encoded; duplicate ids return after digest comparison, and first non-shadowing ids reach model validation. Registry projections allocate model arrays, building-bound passes rescan their domain populations and reference fallback can scan model ids. Geometry, canonical bytes and domain work remain included.
 * @evidence contracts/performance.md#reuse-equivalent-work The authored-id digest map and exact registry are shared for this shot only. A duplicate id does not repeat full validation, while fresh mutable program/model contents are rechecked on another call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The registry retains builder references and accepted authored models for the returned shot attempt; arrays and findings grow with supplied content without a fixed cap. No file, GPU object or task is acquired, and caller ownership ends retention.
 */
export const sourceRuntimeOf: (props: {
    /** Shape-admitted synchronous shot output whose generated content is checked. */
    program: IAutoMovieProductionShotProgram;

    /** Borrowed builder model inventory copied into one exact own-key registry. */
    runtimeModels: IAutoMovieShotBuildContext["runtimeModels"];

    /** Existing source diagnostic target, normally shot:<id>. */
    target: string;

    /** Selected authored module path retained in every source finding. */
    sourcePath: string;
}) => IProductionShotSourceRuntime = (props: {
  /** Shape-admitted synchronous shot output whose generated content is checked. */
  program: IAutoMovieProductionShotProgram;

  /** Borrowed builder model inventory copied into one exact own-key registry. */
  runtimeModels: IAutoMovieShotBuildContext["runtimeModels"];

  /** Existing source diagnostic target, normally shot:<id>. */
  target: string;

  /** Selected authored module path retained in every source finding. */
  sourcePath: string;
}): IProductionShotSourceRuntime => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const authoredModels: IAutoMovieModel[] = [];
  const authoredDigests: Map<string, string> = new Map<string, string>();
  const registry: Readonly<{ record: Readonly<Record<string, IAutoMovieModel>>; define: (key: string, model: IAutoMovieModel) => void; has: (key: string) => boolean; get: (key: string) => IAutoMovieModel | undefined; keys: () => string[]; values: () => IAutoMovieModel[]; resolve: (identity: string) => IAutoMovieModel | undefined; }> = createAutoMovieSourceRuntimeModelRegistry(
    props.runtimeModels,
  );
  const runtimeIds: Set<string> = new Set([
    ...registry.keys(),
    ...registry.values().map((model: IAutoMovieModel) : string => model.id),
  ]);

  const report: (message: string) => void = (message: string): void => {
    diagnostics.push({
      code: "source-scene-content-invalid",
      category: "error",
      phase: "source",
      target: props.target,
      path: props.sourcePath,
      message,
    });
  };
  /**
   * Report one finding under the identity and severity its kind decides.
   *
   * Lineage, building-bound and prop-placement findings pass through their classification adapter so physical conflicts, coverage gaps and warnings retain the adapter's category. Model failures use the separate blocking report path; successful model warnings are not collected here.
   */
  const classify: (finding: IAutoMovieSourceContentFinding) => void = (finding: IAutoMovieSourceContentFinding): void => {
    diagnostics.push(
      autoMovieSourceContentDiagnostic({
        finding,
        target: props.target,
        path: props.sourcePath,
      }),
    );
  };
  const acceptModel: (model: IAutoMovieModel, modelPath: string, modelRef?: string | null) => void = (
    model: IAutoMovieModel,
    modelPath: string,
    /** The registered appearance this model borrows, when a prop cites one. */
    modelRef: string | null = null,
  ): void => {
    const digest: string = digestAutoMovieBytes(canonicalAutoMovieJsonBytes(model));
    const existing: string | undefined = authoredDigests.get(model.id);
    if (existing !== undefined) {
      if (existing !== digest)
        report(
          `${modelPath}.id "${model.id}" conflicts with another source-owned model of the same id. Keep one byte-identical generated model per id.`,
        );
      return;
    }
    authoredDigests.set(model.id, digest);
    if (runtimeIds.has(model.id)) {
      report(
        `${modelPath}.id "${model.id}" shadows a builder-owned runtime model. Rename the source model or cite the existing runtime id.`,
      );
      return;
    }
    // A prop that cites a registered appearance is the one case where source
    // may hand back an imported model, and it is only allowed to hand back the
    // one the builder already sealed. Everything the prop means -- its proxy
    // parts, its body, its affordances, its articulation -- stays in the
    // record, so borrowing bytes never buys an escape from the semantics.
    if (modelRef === null) {
      if (model.origin !== "generated")
        report(
          `${modelPath}.origin is "${model.origin}". Shot source may create generated geometry only; register imported asset bytes in the production model registry and cite that runtime id.`,
        );
    } else {
      const registered: IAutoMovieModel | undefined = registry.resolve(modelRef);
      if (registered === undefined)
        report(
          `${modelPath} cites modelRef "${modelRef}", which does not resolve to a builder-owned runtime model. Register the asset or model recipe, or drop the reference.`,
        );
      else if (
        registered.imported === undefined ||
        registered.imported === null
      )
        report(
          `${modelPath} cites modelRef "${modelRef}", which is not a registered external appearance. Register glTF, GLB or VRM bytes for it, or drop the reference.`,
        );
      else if (
        digestAutoMovieBytes(
          canonicalAutoMovieJsonBytes(registered.imported),
        ) !==
        digestAutoMovieBytes(
          canonicalAutoMovieJsonBytes(model.imported ?? null),
        )
      )
        report(
          `${modelPath}.imported is not the closure the builder sealed for "${modelRef}". Restate the registered closure verbatim, or recompile after registering the asset again.`,
        );
      else if (model.asset !== registered.asset)
        report(
          `${modelPath}.asset "${String(model.asset)}" is not the registered appearance "${String(registered.asset)}" of "${modelRef}".`,
        );
    }
    const validation: IAutoMovieValidation = validateModel({ model });
    if (validation.success === false)
      for (const violation of validation.violations)
        report(
          `${modelPath}${violation.path.slice("$input".length)} ${violation.expected}. Correct the source-owned model before compiling the shot.`,
        );
    // A cited appearance is judged by the reference checks rather than by its
    // origin, so it is allowed past here; a source-authored import is not, for
    // the same reason it was refused above.
    if (
      validation.success === false ||
      (modelRef === null && model.origin !== "generated")
    )
      return;
    authoredModels.push(model);
    registry.define(model.id, model);
  };

  (props.program.models ?? []).forEach((model: IAutoMovieModel, index: number) : void =>
    acceptModel(model, `$program.models[${index}]`),
  );
  (props.program.props ?? []).forEach((prop: IAutoMoviePropSpec, index: number) : void =>
    acceptModel(
      prop.model,
      `$program.props[${index}].model`,
      prop.modelRef ?? null,
    ),
  );
  (props.program.builtEnvironments ?? []).forEach((environment: IAutoMovieBuiltEnvironment, index: number) : void => {
    const environmentPath: string = `$program.builtEnvironments[${index}]`;
    const validation: IAutoMovieValidation = validateBuiltEnvironment({ environment });
    if (validation.success === false)
      for (const violation of validation.violations)
        report(
          `${environmentPath}${violation.path.slice("$input".length)} ${violation.expected}. Correct the code-authored building before compiling the shot.`,
        );
    environment.models.forEach((model: IAutoMovieModel, modelIndex: number) : void =>
      acceptModel(model, `${environmentPath}.models[${modelIndex}]`),
    );
    environment.modelReferences.forEach((id: string, referenceIndex: number) : void => {
      if (registry.resolve(id) === undefined)
        report(
          `${environmentPath}.modelReferences[${referenceIndex}] "${id}" does not resolve to a builder-owned runtime model. Register the asset/model recipe or remove the reference.`,
        );
    });
  });

  // Lineage is checked for coherence here, where the shot that authored it is
  // in hand, and bound to published identities later, where the production's
  // assets are. Splitting it that way is what lets a phase cite a texture the
  // shot itself never names.
  (props.program.designLineages ?? []).forEach((lineage: IAutoMovieDesignLineage, index: number) : void => {
    const lineagePath: string = `$program.designLineages[${index}]`;
    for (const violation of autoMovieValidationFindings(
      validateDesignLineage({ lineage }),
    ))
      classify(
        autoMovieSourceContentFinding(
          violation,
          `${lineagePath}${violation.path.slice("$input".length)} ${violation.expected}. Correct the construction phase, alternative or derivation record before compiling the shot.`,
        ),
      );
  });

  for (const finding of buildingBoundDiagnostics(props.program))
    classify(finding);

  for (const violation of autoMovieValidationFindings(
    validatePropPlacements({
      props: props.program.props ?? [],
      set: props.program.stage.set ?? [],
      builtEnvironments: props.program.builtEnvironments ?? [],
    }),
  ))
    classify(
      autoMovieSourceContentFinding(
        violation,
        `${violation.path} ${violation.expected}. Correct the code-authored prop registry or staged placement before compiling the shot.`,
      ),
    );

  const available: Set<string> = new Set([
    ...registry.keys(),
    ...registry.values().map((model: IAutoMovieModel) : string => model.id),
  ]);
  (props.program.stage.set ?? []).forEach((piece: IAutoMovieStageSetPiece, index: number) : void => {
    if (!available.has(piece.model))
      report(
        `$program.stage.set[${index}].model "${piece.model}" is unavailable. Add a generated source model or cite a builder-owned runtime model.`,
      );
  });

  return {
    runtimeModels: registry.record,
    models: registry.values(),
    authoredModels,
    diagnostics,
  };
};
