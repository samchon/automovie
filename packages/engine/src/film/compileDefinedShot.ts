import {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieConstraintViolation,
  IAutoMovieDefinedShot,
  IAutoMovieDiagnostic,
  IAutoMovieMotion,
  IAutoMovieSceneNode,
  IAutoMovieShotProgram,
  IAutoMovieShotSourceOutput,
  IAutoMovieStage,
  IAutoMovieStageActor,
} from "@automovie/interface";

import { IAutoMovieAuthoringDiagnostic } from "./IAutoMovieAuthoringDiagnostic";
import { IAutoMovieBlockedBeat } from "./IAutoMovieBlockedBeat";
import { IAutoMovieCompiledDefinedShot } from "./IAutoMovieCompiledDefinedShot";
import { IAutoMoviePerformedShot } from "./IAutoMoviePerformedShot";
import { IAutoMovieShotRuntime } from "./IAutoMovieShotRuntime";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { IResolveBeatProps } from "./IResolveBeatProps";
import { blockBeat } from "./blockBeat";
import { performShot } from "./performShot";
import { realizeShotContract } from "./realizeShotContract";
import { resolveBeatEnd } from "./resolveBeatEnd";
import { resolveBeatOpening } from "./resolveBeatOpening";
import { stageScene } from "./stageScene";
import { validateShotPhysicsAdvice } from "./validateShotPhysicsAdvice";
import { validateShotProgramContract } from "./validateShotProgramContract";

/** Prior beat state per actor node, read once for every resume step. */
type IPriorActors = ReadonlyMap<string, IAutoMovieBeatEndActorState>;

/**
 * Compile one {@link defineShot} registration into shot source, continuity and
 * a contract realization, or into the diagnostics of the first phase that
 * failed.
 *
 * The phases run in order: registration ids, one synchronous `build` call with
 * `context`, the program held to its registration, the runtime's physics
 * advice, staging, blocking against `runtime.previous`, restaging at the
 * resumed placements, performance, contract realization, and continuity
 * sampling. The builder supplies ordinary code; the engine owns referential
 * integrity, blocking coherence, verb composition, range-of-motion and
 * artifact validation, and continuity. A throw from the builder becomes
 * `builder-failed`, and a throw from any other phase becomes `pipeline-failed`
 * named after the phase that was running, so this boundary never throws.
 *
 * When `runtime.previous` is supplied, each actor it names opens at that
 * beat's position, facing, mount and pose, and the opening snapshot keeps its
 * gait phase, root velocity, foot plants and mount. The runtime's foot plants
 * for a node the performance replanted are replaced by the new ones.
 *
 * @evidence contracts/common.md#principled-implementation A fixed phase sequence in which each phase consumes only artifacts the previous one accepted, returning the first failing phase's diagnostics; resuming restages the program with the prior actors' translation, `atan2(x, z)` facing in degrees (the `facingDeg` convention `stageScene` reads, 0 facing +Z) and mount, because blocking must judge the authored stage before the prior state can be applied.
 * @evidence contracts/common.md#clear-and-simple-design Sequences phases and owns only the resume merges; program and advice rules live in `validateShotProgramContract` and `validateShotPhysicsAdvice`, and staging, blocking, performance, realization and continuity sampling stay with their own functions, so this file decides order and diagnostic translation alone.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no shot, scene or fixture; the contract handed to realization takes the registration's id and a synthetic `<defineShot:id>` source because a direct compilation has no module path, and a realization failure tells the author to fix output rather than echo it into the contract.
 * @evidence contracts/common.md#meaningful-documentation States the phase order, the single builder call, which diagnostic each kind of throw becomes, and exactly which prior-beat facts open the stage, the scene and the opening snapshot, and how runtime plants merge.
 * @evidence contracts/performance.md#efficient-algorithms Dominated by the phases it calls, performance and realization above all; its own work is linear merges over actors, scene nodes and plant runs, with one prior-actor map and one replanted-node set, while the second `stageScene` call runs only when a previous beat is supplied.
 * @evidence contracts/performance.md#reuse-equivalent-work Within one call each phase's accepted artifact is handed forward rather than recomputed, the prior-actor map is built once for all three resume merges, and one continuity input feeds both the opening and the closing snapshot; across calls nothing is reused, because the builder is author code whose result the engine cannot prove equal for the same context.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Holds phase artifacts only for the call; the success value owns the staged scene, motions, shot, continuity and realization plus deep clones of the event samples and advice, so no runtime capability or caller object is retained, and every exit path releases the rest.
 */
export function compileDefinedShot<Context>(props: {
  /** Registered source export, as {@link defineShot} returned it. */
  shot: IAutoMovieDefinedShot<Context>;

  /** Caller-owned data passed to the builder's single call. */
  context: Context;

  /** Host motion, rig, scene and continuity capabilities the phases read. */
  runtime: IAutoMovieShotRuntime;
}): IAutoMovieCompiledDefinedShot {
  let registration: IAutoMovieAuthoringDiagnostic[];
  try {
    registration = validateRegistration(props.shot);
  } catch (error) {
    return {
      success: false,
      diagnostics: [
        {
          code: "pipeline-failed",
          phase: "registration",
          path: "$shot",
          fact: `The registration boundary threw ${errorText(error)}.`,
          impact:
            "No stable shot identity or contract can be selected for compilation.",
          recovery:
            "Pass one defineShot export with a non-blank id, scene and contract beat, then compile that same value again.",
        },
      ],
    };
  }
  if (registration.length !== 0)
    return { success: false, diagnostics: registration };

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
    const measured: ReturnType<typeof realizeShotContract> =
      realizeShotContract({
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
      });
    if (measured.diagnostics.length !== 0)
      return {
        success: false,
        diagnostics: measured.diagnostics.map(
          (diagnostic: IAutoMovieDiagnostic): IAutoMovieAuthoringDiagnostic => ({
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
    const continuityProps: IResolveBeatProps = {
      beat: props.shot.contract.beat,
      scene: staged.scene,
      shot: performed.shot,
      motions,
      mounts: staged.mounts,
      plants: [
        ...(props.runtime.plants ?? []).filter(
          (entry: NonNullable<IResolveBeatProps["plants"]>[number]): boolean =>
            replantedNodes.has(entry.node) === false,
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

/** Keep resumable simulation facts authoritative at the new opening instant. */
function resumeOpeningSnapshot (
  opening: IAutoMovieBeatEndState,
  prior: IPriorActors | null,
): IAutoMovieBeatEndState {
  if (prior === null) return opening;
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
              rootVelocity: structuredClone(state.rootVelocity),
              footPlants: structuredClone(state.footPlants),
              mount: structuredClone(state.mount),
            };
      },
    ),
  };
}

/** Resume root placement, facing, and persistent mounts before staging. */
function resumeStage (
  stage: IAutoMovieStage,
  prior: IPriorActors,
): IAutoMovieStage { return ({
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
}); }

/** Carry prior articulation onto the resumed scene's opening frame. */
function resumePoses (
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

/** Report every blank registration id against its exact field. */
function validateRegistration<Context>(
  shot: IAutoMovieDefinedShot<Context>,
): IAutoMovieAuthoringDiagnostic[] {
  const diagnostics: IAutoMovieAuthoringDiagnostic[] = [];
  for (const [path, value, label] of [
    ["$shot.id", shot.id, "shot id"],
    ["$shot.scene", shot.scene, "scene id"],
    ["$shot.contract.beat", shot.contract.beat, "contract beat id"],
  ] as const)
    if (typeof value !== "string" || value.trim().length === 0)
      diagnostics.push({
        code: "registration-invalid",
        phase: "registration",
        path,
        fact: `The ${label} is blank.`,
        impact:
          "The source export cannot receive a stable registered artifact address.",
        recovery: `Give ${path} one non-blank stable id and keep it identical across source and design references.`,
      });
  return diagnostics;
}

/** Translate one gate's constraint violations into authoring diagnostics. */
function fromViolations (
  phase: "stage" | "blocking" | "performance",
  code: "stage-invalid" | "blocking-invalid" | "performance-invalid",
  violations: readonly IAutoMovieConstraintViolation[],
): IAutoMovieAuthoringDiagnostic[] { return violations.map(
    (violation: IAutoMovieConstraintViolation): IAutoMovieAuthoringDiagnostic => ({
      code,
      phase,
      path: violation.path,
      fact: `${violation.expected}; received ${JSON.stringify(violation.value)}.`,
      impact: `The ${phase} gate cannot emit a trustworthy registered shot while this constraint is unsatisfied.`,
      recovery: `Correct ${violation.path} according to the stated bound, then compile the same registered export again.`,
      violation,
    }),
  ); }

/** Render a thrown value as `Name: message`, or its string form. */
function errorText (error: unknown): string { return error instanceof Error ? `${error.name}: ${error.message}` : String(error); }
