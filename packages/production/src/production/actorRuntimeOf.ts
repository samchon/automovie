import { IAutoMovieActorContext } from "@automovie/engine";
import { IAutoMovieDiagnostic, IAutoMovieModel, IAutoMovieProductionShotProgram, IAutoMovieShotBuildContext, IAutoMovieVector3, type IAutoMovieActionCall, type IAutoMovieGait, type IAutoMovieMotion, type IAutoMovieProfile, type IAutoMovieShotActorProgram, type IAutoMovieSkeleton, type IAutoMovieStageActor, type IAutoMovieStageCamera, type IAutoMovieStageSetPiece } from "@automovie/interface";
import { createAutoMovieSourceRuntimeModelRegistry } from "./createAutoMovieSourceRuntimeModelRegistry";
import type { IProductionShotActorRuntime } from "./IProductionShotActorRuntime";

/**
 * Bind thin-program actor nodes to staged placements and articulated runtime models, then check gait names, clip identities and selected enact references. Defaults retain the current beat-derived target and null source path.
 *
 * @evidence contracts/common.md#principled-implementation Exact actor/clip maps detect duplicate ids; model resolution follows exact registered key then contained model id. Finite positive speed, finite non-negative eye height and non-null rigs precede actor-context creation.
 * @evidence contracts/common.md#clear-and-simple-design Actor, model and node maps feed the engine synthesizer/compiler, while returned source diagnostics let assembly distinguish refusal from advice without discarding findings.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing rigs, placements, models or clips are not invented. Duplicate gait errors can coexist with a bound actor; assembly must inspect error categories before compiling the returned runtime.
 * @evidence contracts/common.md#meaningful-documentation States metres and degrees from staged/actor contracts, selected-final-or-draft action semantics, target/path defaults, map ownership and error-bearing result limitations.
 * @evidence contracts/performance.md#efficient-algorithms Stage actors are indexed and later projected into node positions; actor programs, clips and selected actions each have their own pass. Model-id fallback can scan the registry per actor, and gait collection scans each selected model's profiles. Duplicate node projections retain Map's existing last-entry semantics.
 * @evidence contracts/performance.md#reuse-equivalent-work One registry and clip-id index serve all actors and enact actions in this call. Runtime records are rebuilt for each program/model snapshot because placements, rigs and measured actor facts may differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned maps borrow rigs, gaits, placements and model records under caller ownership; temporary indices expire after construction. No native resource or task is acquired and map sizes have no local fixed cap.
 */
export const actorRuntimeOf: (program: IAutoMovieProductionShotProgram, runtimeModels: IAutoMovieShotBuildContext["runtimeModels"], target?: string, sourcePath?: string | null) => IProductionShotActorRuntime = (
  program: IAutoMovieProductionShotProgram,
  runtimeModels: IAutoMovieShotBuildContext["runtimeModels"],
  target: string = `shot:${program.blocking.beat}`,
  sourcePath: string | null = null,
): IProductionShotActorRuntime => {
  const diagnostics: IAutoMovieDiagnostic[] = [];
  const actors: Map<string, IAutoMovieActorContext> = new Map<string, IAutoMovieActorContext>();
  const models: Map<string, IAutoMovieModel> = new Map<string, IAutoMovieModel>();
  const modelRegistry: Readonly<{ record: Readonly<Record<string, IAutoMovieModel>>; define: (key: string, model: IAutoMovieModel) => void; has: (key: string) => boolean; get: (key: string) => IAutoMovieModel | undefined; keys: () => string[]; values: () => IAutoMovieModel[]; resolve: (identity: string) => IAutoMovieModel | undefined; }> =
    createAutoMovieSourceRuntimeModelRegistry(runtimeModels);
  const stageActors: Map<string, IAutoMovieStageActor> = new Map(
    program.stage.actors.map((actor: IAutoMovieStageActor) : [string, IAutoMovieStageActor] => [actor.node, actor]),
  );
  program.actors.forEach((actor: IAutoMovieShotActorProgram, index: number) : void => {
    const path: string = `$program.actors[${index}]`;
    const staged: IAutoMovieStageActor | undefined = stageActors.get(actor.node);
    const model: IAutoMovieModel | undefined = modelRegistry.resolve(actor.model);
    const gaitNames: Set<string> = new Set<string>();
    const gaits: IAutoMovieGait[] =
      model?.profiles
        ?.flatMap((profile: IAutoMovieProfile) : IAutoMovieGait[] => profile.gaits ?? [])
        .filter((gait: IAutoMovieGait) : boolean => {
          if (gaitNames.has(gait.name)) {
            diagnostics.push({
              code: "source-actor-runtime-invalid",
              category: "error",
              phase: "source",
              target,
              path: sourcePath,
              message: `${path}.model "${actor.model}" supplies duplicate gait "${gait.name}". Keep each builder-owned gait name unique before rebuilding this shot.`,
            });
            return false;
          }
          gaitNames.add(gait.name);
          return true;
        }) ?? [];
    const fact: string | null = actors.has(actor.node)
      ? `duplicates actor node "${actor.node}"`
      : staged === undefined
        ? `names actor node "${actor.node}" that is absent from stage.actors`
        : model === undefined
          ? `names unavailable runtime model "${actor.model}"`
          : model.skeleton === null
            ? `names rig-less runtime model "${actor.model}"`
            : Number.isFinite(actor.speed) === false || actor.speed <= 0
              ? `sets speed ${JSON.stringify(actor.speed)} instead of a finite value above zero`
              : Number.isFinite(actor.eyeHeight) === false ||
                  actor.eyeHeight < 0
                ? `sets eyeHeight ${JSON.stringify(actor.eyeHeight)} instead of a finite non-negative value`
                : null;
    if (fact !== null) {
      diagnostics.push({
        code: "source-actor-runtime-invalid",
        category: "error",
        phase: "source",
        target,
        path: sourcePath,
        message: `${path} ${fact}. Correct the node/model join or measured actor runtime fact; the builder will not guess a rig, speed, or eye height.`,
      });
      return;
    }
    const boundModel: IAutoMovieModel = model!;
    const boundSkeleton: IAutoMovieSkeleton = boundModel.skeleton!;
    const placement: IAutoMovieStageActor = staged!;
    actors.set(actor.node, {
      skeleton: boundSkeleton.id,
      gaits,
      position: placement.position,
      speed: actor.speed,
      facingDeg: placement.facingDeg,
      eyeHeight: actor.eyeHeight,
      restPose: {
        skeleton: boundSkeleton.id,
        root: null,
        joints: [],
      },
      rig: boundSkeleton,
    });
    models.set(actor.node, boundModel);
  });
  const clips: Map<string, number> = new Map<string, number>();
  (program.clips ?? []).forEach((clip: IAutoMovieMotion, index: number) : void => {
    const first: number | undefined = clips.get(clip.id);
    if (clip.id.trim().length === 0 || first !== undefined)
      diagnostics.push({
        code: "source-clip-invalid",
        category: "error",
        phase: "source",
        target,
        path: sourcePath,
        message:
          first === undefined
            ? `$program.clips[${index}].id is blank. Give every enact clip one stable non-blank id.`
            : `$program.clips[${index}].id duplicates $program.clips[${first}].id "${clip.id}". Keep one authoritative clip per id.`,
      });
    else clips.set(clip.id, index);
  });
  const actions: IAutoMovieActionCall[] = program.performance.revise.final ?? program.performance.draft;
  actions.forEach((action: IAutoMovieActionCall, index: number) : void => {
    if (action.verb === "enact" && clips.has(action.clip) === false)
      diagnostics.push({
        code: "source-clip-invalid",
        category: "error",
        phase: "source",
        target,
        path: sourcePath,
        message: `$program.performance action ${index} enacts absent clip "${action.clip}". Add that exact clip to program.clips or replace enact with a supported thin verb.`,
      });
  });
  const nodes: Map<string, IAutoMovieVector3> = new Map<string, IAutoMovieVector3>([
    ...program.stage.actors.map(
      (actor: IAutoMovieStageActor) : readonly [string, IAutoMovieVector3] => [actor.node, actor.position] as const,
    ),
    ...(program.stage.set ?? []).map(
      (piece: IAutoMovieStageSetPiece) : readonly [string, IAutoMovieVector3] => [piece.node, piece.position] as const,
    ),
    ...program.stage.cameras.map(
      (camera: IAutoMovieStageCamera) : readonly [string, IAutoMovieVector3] => [camera.node, camera.position] as const,
    ),
  ]);
  return { actors, nodes, models, diagnostics };
};
