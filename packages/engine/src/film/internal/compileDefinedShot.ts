import {
  type IAutoMovieAuthoringDiagnostic,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  type IAutoMovieBlockedBeat,
  type IAutoMovieCompileDefinedShot,
  type IAutoMovieCompiledDefinedShot,
  IAutoMovieConstraintViolation,
  IAutoMovieDiagnostic,
  IAutoMovieMotion,
  type IAutoMoviePerformedShot,
  type IAutoMovieRealizeShotContract,
  type IAutoMovieResolveBeatProps,
  IAutoMovieSceneNode,
  IAutoMovieShotProgram,
  IAutoMovieShotSourceOutput,
  IAutoMovieStage,
  IAutoMovieStageActor,
  type IAutoMovieStagedSet,
} from "@automovie/interface";

import { blockBeat } from "./blockBeat";
import { performShot } from "./performShot";
import { realizeShotContract } from "./realizeShotContract";
import { resolveBeatEnd } from "./resolveBeatEnd";
import { resolveBeatOpening } from "./resolveBeatOpening";
import { stageScene } from "./stageScene";
import { validateShotPhysicsAdvice } from "./validateShotPhysicsAdvice";
import { validateShotProgramContract } from "./validateShotProgramContract";

/**
 * Compile one {@link defineShot} registration into shot source, continuity and a
 * contract realization, or into the diagnostics of the first phase that
 * failed.
 *
 * The phases run in order: one synchronous `build` call with `context`, the
 * program held to its registration, the runtime's physics advice, staging,
 * blocking against `runtime.previous`, restaging at the resumed placements,
 * performance, contract realization, and continuity sampling. The builder
 * supplies ordinary code; the engine owns referential integrity, blocking
 * coherence, verb composition, range-of-motion and artifact validation, and
 * continuity. A throw from the builder becomes `builder-failed`, and a throw
 * from any other phase becomes `pipeline-failed` named after the phase that was
 * running, so this boundary never throws.
 *
 * When `runtime.previous` is supplied, each actor it names opens at that beat's
 * position, facing, mount and pose, and the opening snapshot keeps its gait
 * phase, root velocity, foot plants and mount. The runtime's foot plants for a
 * node the performance replanted are replaced by the new ones.
 */
export function compileDefinedShot<Context>(
  props: IAutoMovieCompileDefinedShot.IProps<Context>,
): IAutoMovieCompiledDefinedShot {
  let program: IAutoMovieShotProgram;
  try {
    program = props.shot.build(props.context);
  } catch (error) {
    return {
      success: false,
      diagnostics: [
        {
          code: "builder-failed",
          phase: "build",
          path: "$shot.build",
          fact: `The registered builder threw ${errorText(error)}.`,
          impact:
            "No deterministic program exists, so stage and motion validation cannot run.",
          recovery:
            "Correct the named source operation or precondition and return an IAutoMovieShotProgram synchronously.",
        },
      ],
    };
  }

  let phase: IAutoMovieAuthoringDiagnostic["phase"] = "build";
  try {
    const contract: IAutoMovieAuthoringDiagnostic[] =
      validateShotProgramContract(props.shot, program);
    if (contract.length !== 0) return { success: false, diagnostics: contract };

    phase = "stage";
    const advice: IAutoMovieAuthoringDiagnostic[] = validateShotPhysicsAdvice(
      props.runtime.advice ?? [],
    );
    if (advice.length !== 0) return { success: false, diagnostics: advice };

    const authoredStage: IAutoMovieStagedSet = stageScene(
      program.script,
      program.stage,
    );
    if (authoredStage.success === false)
      return {
        success: false,
        diagnostics: fromViolations(
          "stage",
          "stage-invalid",
          authoredStage.violations,
        ),
      };

    phase = "blocking";
    const blocked: IAutoMovieBlockedBeat = blockBeat(
      program.script,
      authoredStage,
      program.blocking,
      props.runtime.previous,
    );
    if (blocked.success === false)
      return {
        success: false,
        diagnostics: fromViolations(
          "blocking",
          "blocking-invalid",
          blocked.violations,
        ),
      };

    phase = "stage";
    const prior: IPriorActors | null =
      blocked.previous === null
        ? null
        : new Map(
            blocked.previous.actors.map(
              (
                actor: IAutoMovieBeatEndActorState,
              ): [string, IAutoMovieBeatEndActorState] => [actor.node, actor],
            ),
          );
    const resumedStage: IAutoMovieStagedSet =
      prior === null
        ? authoredStage
        : stageScene(program.script, resumeStage(program.stage, prior));
    if (resumedStage.success === false)
      return {
        success: false,
        diagnostics: fromViolations(
          "stage",
          "stage-invalid",
          resumedStage.violations,
        ),
      };
    const staged: IAutoMovieStagedSet.ISuccess = resumePoses(
      resumedStage,
      prior,
    );

    phase = "performance";
    const performed: IAutoMoviePerformedShot = performShot({
      script: program.script,
      staged,
      performance: program.performance,
      synthesize: props.runtime.synthesize,
      skeleton: props.runtime.skeleton,
      models: props.runtime.models,
      formations: props.runtime.formations,
      formationMotions: props.runtime.formationMotions,
      lightMotions: props.runtime.lightMotions,
      practicalLights: props.runtime.practicalLights,
      practicalSurfaces: program.practicalSurfaces,
      polygonBodyCues: program.polygonBodyCues,
      objectMotions: props.runtime.objectMotions,
      props: props.runtime.props,
      frameFormat: props.runtime.frameFormat,
      cameraClearance: props.runtime.cameraClearance,
      hasActorContext: props.runtime.hasActorContext,
      jointAxes: props.runtime.jointAxes,
      restFrames: props.runtime.restFrames,
      targetAt: props.runtime.targetAt,
      gaits: props.runtime.gaits,
      blocking: blocked.blocking,
      shotId: props.shot.id,
      previous: blocked.previous,
      surfaceGraphics: program.surfaceGraphics,
      flames: program.flames,
      fonts: props.runtime.fonts,
    });
    if (performed.success === false)
      return {
        success: false,
        diagnostics: fromViolations(
          "performance",
          "performance-invalid",
          performed.violations,
        ),
      };

    const motions: IAutoMovieMotion[] = Object.values(performed.motions);
    const source: IAutoMovieShotSourceOutput = {
      eventSamples: structuredClone(program.eventSamples),
      scene: staged.scene,
      motions,
      shot: performed.shot,
    };
    phase = "contract";
    const measured: IAutoMovieRealizeShotContract.IResult = realizeShotContract(
      {
        contract: {
          ...props.shot.contract,
          id: props.shot.id,
          source: {
            module: `<defineShot:${props.shot.id}>`,
            export: props.shot.id,
          },
        },
        production: null,
        frameFormat: props.runtime.frameFormat,
        world: props.runtime.world ?? null,
        formations: props.runtime.formationDesigns ?? new Map(),
        compiled: {
          ...source,
          models: [...(props.runtime.models ?? [])],
          formations: [...(props.runtime.formations ?? [])],
          // The cues the camera solve read, so the readability grade measures
          // the unit where the camera framed it rather than where it started.
          formationMotions: [...(props.runtime.formationMotions ?? [])],
        },
        skeleton: props.runtime.skeleton,
        collisions: props.runtime.collisions ?? [],
      },
    );
    if (measured.diagnostics.length !== 0)
      return {
        success: false,
        diagnostics: measured.diagnostics.map(
          (
            diagnostic: IAutoMovieDiagnostic,
          ): IAutoMovieAuthoringDiagnostic => ({
            code: "contract-realization-failed",
            phase: "contract",
            path: diagnostic.path ?? "$shot.contract",
            fact: diagnostic.message,
            impact:
              "Independent scene, motion, event, or camera evidence does not realize the registered shot contract.",
            recovery:
              "Correct the authored stage, performance, event sample, or camera named by the fact; do not change contract prose to echo the current output.",
          }),
        ),
      };

    phase = "continuity";
    const replantedNodes: Set<string> = new Set(
      performed.plants.map(
        (entry: IAutoMoviePerformedShot.ISuccess["plants"][number]): string =>
          entry.node,
      ),
    );
    const continuityProps: IAutoMovieResolveBeatProps = {
      beat: props.shot.contract.beat,
      scene: staged.scene,
      shot: performed.shot,
      motions,
      mounts: staged.mounts,
      plants: [
        ...(props.runtime.plants ?? []).filter(
          (
            entry: NonNullable<IAutoMovieResolveBeatProps["plants"]>[number],
          ): boolean => replantedNodes.has(entry.node) === false,
        ),
        ...performed.plants,
      ],
    };
    return {
      success: true,
      source,
      continuity: {
        opening: resumeOpeningSnapshot(
          resolveBeatOpening(continuityProps),
          prior,
          staged.supports,
        ),
        closing: resolveBeatEnd(continuityProps),
      },
      realization: measured.realization,
      advice: structuredClone(props.runtime.advice ?? []),
    };
  } catch (error) {
    return {
      success: false,
      diagnostics: [
        {
          code: "pipeline-failed",
          phase,
          path: `$${phase}`,
          fact: `The ${phase} pipeline threw ${errorText(error)}.`,
          impact:
            "The public authoring boundary cannot publish a partially measured or partially validated shot.",
          recovery:
            "Correct the runtime capability, authored value, or duplicate continuity input named by the fact, then compile the same registered export again.",
        },
      ],
    };
  }
}

/** Prior beat state per actor node, read once for every resume step. */
type IPriorActors = ReadonlyMap<string, IAutoMovieBeatEndActorState>;

/**
 * Carry the prior facts at the opening, except static pins released by an
 * explicitly suspended support.
 */
function resumeOpeningSnapshot(
  opening: IAutoMovieBeatEndState,
  prior: IPriorActors | null,
  supports: IAutoMovieStagedSet.ISuccess["supports"],
): IAutoMovieBeatEndState {
  if (prior === null) return opening;
  const suspended: Set<string> = new Set(
    (supports ?? []).flatMap(
      (support: NonNullable<typeof supports>[number]): string[] =>
        support.windows[0]!.surfaces.length === 0 ? [support.node] : [],
    ),
  );
  return {
    ...opening,
    actors: opening.actors.map(
      (actor: IAutoMovieBeatEndActorState): IAutoMovieBeatEndActorState => {
        const state: IAutoMovieBeatEndActorState | undefined = prior.get(
          actor.node,
        );
        return state === undefined
          ? actor
          : {
              ...actor,
              gaitPhase: state.gaitPhase,
              gaitPeriod: state.gaitPeriod,
              rootVelocity: structuredClone(state.rootVelocity),
              footPlants: suspended.has(actor.node)
                ? actor.footPlants
                : structuredClone(state.footPlants),
              mount: structuredClone(state.mount),
            };
      },
    ),
  };
}

/** Resume root placement, facing, and persistent mounts before staging. */
function resumeStage(
  stage: IAutoMovieStage,
  prior: IPriorActors,
): IAutoMovieStage {
  return {
    ...stage,
    actors: stage.actors.map(
      (actor: IAutoMovieStageActor): IAutoMovieStageActor => {
        const state: IAutoMovieBeatEndActorState | undefined = prior.get(
          actor.node,
        );
        return state === undefined
          ? actor
          : {
              ...actor,
              position: structuredClone(state.transform.translation),
              facingDeg:
                (Math.atan2(state.facing.x, state.facing.z) * 180) / Math.PI,
              attach:
                state.mount === null ? undefined : structuredClone(state.mount),
            };
      },
    ),
  };
}

/** Carry prior articulation onto the resumed scene's opening frame. */
function resumePoses(
  staged: IAutoMovieStagedSet.ISuccess,
  prior: IPriorActors | null,
): IAutoMovieStagedSet.ISuccess {
  if (prior === null) return staged;
  return {
    ...staged,
    scene: {
      ...staged.scene,
      nodes: staged.scene.nodes.map(
        (node: IAutoMovieSceneNode): IAutoMovieSceneNode => {
          const state: IAutoMovieBeatEndActorState | undefined = prior.get(
            node.id,
          );
          return state === undefined
            ? node
            : { ...node, pose: structuredClone(state.pose) };
        },
      ),
    },
  };
}

/** Translate one gate's constraint violations into authoring diagnostics. */
function fromViolations(
  phase: "stage" | "blocking" | "performance",
  code: "stage-invalid" | "blocking-invalid" | "performance-invalid",
  violations: readonly IAutoMovieConstraintViolation[],
): IAutoMovieAuthoringDiagnostic[] {
  return violations.map(
    (
      violation: IAutoMovieConstraintViolation,
    ): IAutoMovieAuthoringDiagnostic => ({
      code,
      phase,
      path: violation.path,
      fact: `${violation.expected}; received ${JSON.stringify(violation.value)}.`,
      impact: `The ${phase} gate cannot emit a trustworthy registered shot while this constraint is unsatisfied.`,
      recovery: `Correct ${violation.path} according to the stated bound, then compile the same registered export again.`,
      violation,
    }),
  );
}

/** Render a thrown value, falling back when its inspection or coercion throws. */
function errorText(error: unknown): string {
  try {
    return error instanceof Error
      ? `${error.name}: ${error.message}`
      : String(error);
  } catch {
    return "an uninspectable thrown value";
  }
}
