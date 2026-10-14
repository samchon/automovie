import type { ISourceBuildResult } from "./ISourceBuildResult";
import type { IProductionShotSourceRuntime } from "./IProductionShotSourceRuntime";
import type { IProductionExternalMotionConversionDraft } from "./IProductionExternalMotionConversionDraft";
import type { IProductionShotActorRuntime } from "./IProductionShotActorRuntime";
import { compileDefinedShot, createAutoMovieSourceOracle, defineShot, inheritProductionLighting, makeActorSynthesizer, type IAutoMovieActionSynthesizer, type IAutoMovieAuthoringDiagnostic, type IAutoMovieCompiledDefinedShot } from "@automovie/engine";
import { IAutoMovieDiagnostic, IAutoMovieProductionShotProgram, type IAutoMovieActionCall, type IAutoMovieBeatEndState, type IAutoMovieDefinedShot, type IAutoMovieGait, type IAutoMovieLight, type IAutoMovieMotion, type IAutoMovieScene, type IAutoMovieSkeleton } from "@automovie/interface";
import typia from "typia";
import { boundFolds } from "./productionEnvironmentValidation";
import { resolveExternalMotionClips } from "./resolveExternalMotionClips";
import { actorRuntimeOf, contractOfRegistration, sourceRuntimeOf } from "./productionShotRuntime";
import { buildSourceExport } from "./buildSourceExport";
import type { IProductionShotAssemblyProps } from "./IProductionShotAssemblyProps";
import type { IProductionShotAssemblyResult } from "./IProductionShotAssemblyResult";

/**
 * Execute the admitted synchronous shot registration, bind authored models and adopted clips, compile performance with prior hard-cut state, then attach production lighting and authored artifact channels. Authored execution uses ordinary Node, not a sandbox.
 *
 * @evidence contracts/common.md#principled-implementation A cloned build context and source oracle feed exact registration/schema admission. Runtime and adoption error categories refuse before compilation; successful engine output carries its measured closing state and source advice.
 * @evidence contracts/common.md#clear-and-simple-design The assembly owner coordinates existing source execution, model/actor admission, external-motion resolution and engine compilation. Materialization, realization and publication remain with the outer production pipeline.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Warnings do not suppress usable shots, missing stage or runtime facts are not fabricated, and authored determinism remains a required premise rather than something ordinary Node loading proves. The engine compiler translates phase exceptions to findings; context cloning, runtime validation and lighting failures outside the source-execution boundary still propagate.
 * @evidence contracts/common.md#meaningful-documentation States Node execution limits, context isolation, compiler-owned clearance, previous-pose ownership, error-versus-warning admission and lighting/artifact transfer without claiming pixel proof. The existing compiler-failure return carries program, adoption and compiler findings; source/runtime advice from earlier successful admission is omitted on that branch.
 * @evidence contracts/performance.md#efficient-algorithms Work includes full context cloning, arbitrary authored code, model/building validation, adoption conversion, actor/clip indexing, engine performance compilation and output clones. Local maps scan clips once; geometry/motion costs and building-domain scans remain part of total work, with no local timeout or byte bound.
 * @evidence contracts/performance.md#reuse-equivalent-work One clip map and one reference synthesizer serve engine callbacks, and each admitted source runtime feeds adoption and actor binding. Contexts/results are not shared across different shots or previous states because authored effects and contract inputs differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Borrowed inputs are not disposed; cloned context, temporary registries and compiled data last for the attempt, with output, closing and conversion drafts transferred to the caller. No independent host is started, but arbitrary authored Node effects have no cleanup facility at this boundary.
 */
export const assembleShotSource: (props: IProductionShotAssemblyProps) => IProductionShotAssemblyResult = (
  props: IProductionShotAssemblyProps,
): IProductionShotAssemblyResult => {
  const program: ISourceBuildResult<IAutoMovieProductionShotProgram> = buildSourceExport({
    ...props,
    context: {
      ...structuredClone(props.context),
      // Answered from the compiled runtime the context carries, so a member a
      // source asks for is the member the compiled record regenerates.
      engine: createAutoMovieSourceOracle({
        world: props.context.world,
        formationRuntime: props.context.formationRuntime,
        instanceSetRuntime: props.context.instanceSetRuntime,
      }),
    },
    target: `shot:${props.id}`,
    label: "thin shot program",
    registration: {
      id: props.id,
      contract: contractOfRegistration(props.context.contract),
    },
    validate: (input: unknown) : typia.IValidation<IAutoMovieProductionShotProgram> =>
      typia.validateEquals<IAutoMovieProductionShotProgram>(input),
  });
  if (program.value === null)
    return {
      value: null,
      closing: null,
      conversions: [],
      diagnostics: program.diagnostics,
    };

  const sourceRuntime: IProductionShotSourceRuntime = sourceRuntimeOf({
    program: program.value,
    runtimeModels: props.context.runtimeModels,
    target: `shot:${props.id}`,
    sourcePath: props.path,
  });
  const adoptedMotions: { clips: IAutoMovieMotion[]; conversions: IProductionExternalMotionConversionDraft[]; diagnostics: IAutoMovieDiagnostic[]; } = resolveExternalMotionClips({
    adoptions: props.context.externalMotions,
    program: program.value,
    runtimeModels: sourceRuntime.runtimeModels,
    target: `shot:${props.id}`,
    sourcePath: props.path,
  });
  const shotProgram: IAutoMovieProductionShotProgram = {
    ...program.value,
    clips: [...(program.value.clips ?? []), ...adoptedMotions.clips],
  };
  const runtime: IProductionShotActorRuntime = actorRuntimeOf(
    shotProgram,
    sourceRuntime.runtimeModels,
    `shot:${props.id}`,
    props.path,
  );
  // Severity decides, not count. Both halves used to be counted because both
  // could only produce errors, and the moment one of them learned to warn, a
  // warning would have withheld the compiled shot while explaining nothing: the
  // author would read one advisory sentence and a film that reports the shot as
  // never compiled.
  if (
    sourceRuntime.diagnostics.some(
      (diagnostic: IAutoMovieDiagnostic) : boolean => diagnostic.category === "error",
    ) ||
    adoptedMotions.diagnostics.some(
      (diagnostic: IAutoMovieDiagnostic) : boolean => diagnostic.category === "error",
    ) ||
    runtime.diagnostics.some((diagnostic: IAutoMovieDiagnostic) : boolean => diagnostic.category === "error")
  )
    return {
      value: null,
      closing: null,
      conversions: [],
      diagnostics: [
        ...program.diagnostics,
        ...sourceRuntime.diagnostics,
        ...adoptedMotions.diagnostics,
        ...runtime.diagnostics,
      ],
    };
  const shot: IAutoMovieDefinedShot<unknown> = defineShot(props.id, {
    scene: program.registrationScene!,
    contract: contractOfRegistration(props.context.contract),
    build: () : IAutoMovieProductionShotProgram => shotProgram,
  });
  const clipById: Map<string, IAutoMovieMotion> = new Map(
    (shotProgram.clips ?? []).map((clip: IAutoMovieMotion) : [string, IAutoMovieMotion] => [clip.id, clip]),
  );
  const referenceSynthesizer: IAutoMovieActionSynthesizer = makeActorSynthesizer(
    runtime.actors,
    runtime.nodes,
  );
  const compiled: IAutoMovieCompiledDefinedShot = compileDefinedShot({
    shot,
    context: undefined,
    runtime: {
      synthesize: (action: IAutoMovieActionCall, actor: string, previous: IAutoMovieBeatEndState | null | undefined) : IAutoMovieMotion | null =>
        action.verb === "enact"
          ? (clipById.get(action.clip) ?? null)
          : referenceSynthesizer(action, actor, previous),
      skeleton: (node: string) : IAutoMovieSkeleton | null => runtime.models.get(node)?.skeleton ?? null,
      hasActorContext: (node: string) : boolean => runtime.actors.has(node),
      gaits: (node: string) : string[] | undefined => runtime.actors.get(node)?.gaits.map((gait: IAutoMovieGait) : string => gait.name),
      frameFormat: props.context.frameFormat,
      cameraClearance: props.cameraClearance,
      world: props.context.world,
      formationDesigns: new Map(Object.entries(props.context.formations)),
      formations: Object.values(props.context.formationRuntime),
      // The unit cues the source authored, handed to the performance boundary
      // rather than only attached to the artifact below: a camera framing a
      // formation has to measure it where its cue has moved it.
      formationMotions: shotProgram.formationMotions ?? [],
      // The shot's own light statement, left undefined when the source made
      // none so its compiled artifact keeps the exact bytes it had before this
      // channel existed.
      lightMotions: shotProgram.lightMotions,
      // The shot's own turning things: a building panel on its opening, a
      // prop's leaf on its hinge. Without them the performance boundary has
      // nothing to gate, so a source could author a door swing, pass every
      // validator, and be dropped here without a word.
      objectMotions: shotProgram.objectMotions,
      props: shotProgram.props,
      models: sourceRuntime.models,
      previous: props.previous ?? undefined,
    },
  });
  if (compiled.success === false)
    return {
      value: null,
      closing: null,
      conversions: [],
      diagnostics: [
        ...program.diagnostics,
        ...adoptedMotions.diagnostics,
        ...compiled.diagnostics.map(
          (diagnostic: IAutoMovieAuthoringDiagnostic): IAutoMovieDiagnostic => ({
            code: diagnostic.code,
            category: "error",
            phase: "source",
            target: `shot:${props.id}`,
            path: props.path,
            message: `${diagnostic.fact} ${diagnostic.impact} ${diagnostic.recovery}`,
          }),
        ),
      ],
    };
  // The production's own light, at the story moment this shot is pinned to.
  //
  // A film that runs across a stretch of story states its source once and
  // every shot stands under it, instead of each scene restaging its own light
  // with nothing relating one to the next. The merge is the engine's, by id:
  // a staged light a source names is replaced in place, and a source no scene
  // declares is appended. A production that declares no lighting, or a shot
  // carrying no story pin, gets its staged lights back element by element, so
  // the compiled bytes are unchanged for every film that says nothing.
  //
  // State, not motion: the shot inherits where the light IS at its own story
  // origin. Carrying the source's motion in as well would mean resampling a
  // story-clock curve onto a shot-local one, and a resampling is exact for
  // some interpolations and an approximation for others -- a shot states its
  // own light-over-time through `lightMotions`, which runs on top of this.
  const scene: IAutoMovieScene = compiled.source.scene;
  const inherited: IAutoMovieLight[] = inheritProductionLighting({
    lighting: props.context.lighting ?? null,
    lights: scene.lights,
    pin: props.context.contract.storyTime ?? null,
    seconds: 0,
  });
  return {
    value: {
      ...compiled.source,
      authoredModels: structuredClone(sourceRuntime.authoredModels),
      props: structuredClone(shotProgram.props ?? []),
      builtEnvironments: structuredClone(shotProgram.builtEnvironments ?? []),
      // Every fold a building binds travels with the artifact, because the
      // renderer reads the artifact and nothing else. A record validated at
      // compile and dropped here is a pond the builder approved and the frame
      // does not contain.
      //
      // A fold nobody declared stays absent rather than arriving as an empty
      // array: the artifact is content-addressed, and eleven empty keys would
      // rewrite the digest of every production that has never heard of water.
      ...boundFolds(shotProgram),
      scene: { ...scene, lights: inherited },
      formationMotions: structuredClone(shotProgram.formationMotions ?? []),
      formationSlotMotions: structuredClone(
        shotProgram.formationSlotMotions ?? [],
      ),
      effectCues: structuredClone(shotProgram.effectCues ?? []),
    },
    closing: compiled.continuity.closing,
    conversions: adoptedMotions.conversions,
    // Every source-phase finding travels, including the two lists a shot used to
    // publish only when it failed. Reaching here means neither carried an error,
    // so what they carry is advice, and advice nobody is told about is the same
    // as advice nobody wrote.
    diagnostics: [
      ...program.diagnostics,
      ...sourceRuntime.diagnostics,
      ...adoptedMotions.diagnostics,
      ...runtime.diagnostics,
    ],
  };
};
