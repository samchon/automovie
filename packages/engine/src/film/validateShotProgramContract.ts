import {
  IAutoMovieDefinedShot,
  IAutoMovieShotActorProgram,
  IAutoMovieShotEventContract,
  IAutoMovieShotProgram,
  IAutoMovieStageActor,
} from "@automovie/interface";

import { IAutoMovieAuthoringDiagnostic } from "./IAutoMovieAuthoringDiagnostic";

/** One returned event sample: a contract event id and its claimed time. */
type IEventSample = IAutoMovieShotProgram["eventSamples"][number];

/**
 * Hold a built shot program to its registration before `compileDefinedShot` stages it, returning every `build`-phase `contract-mismatch` diagnostic at once; an empty list means the program may be staged.
 *
 * The staged scene id must equal the registered scene, and blocking and performance must both carry the contract's beat and `durationSeconds` exactly. Each actor program must name a distinct staged actor and a non-blank model, with a finite speed above zero and a finite non-negative eye height; only the first failing fact of an actor is reported. Event samples must cover every contract event exactly once, each finite and inside its inclusive window in shot-local seconds, and may name no undeclared event.
 *
 * @evidence contracts/common.md#principled-implementation Compares registration and program fields by strict equality, so a duration must be the identical number rather than a near value, and checks actors and samples in one indexed pass each with first-index maps; a duplicated sample is reported once and the window check reads the later sample, which is moot because the duplicate already fails the program.
 * @evidence contracts/common.md#clear-and-simple-design Split from `compileDefinedShot` as the single owner of the program-to-registration rules, so the compiler sequences phases and this function decides only whether the builder returned the registered artifact.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Reads only registration and program fields; no beat, scene or event id is special, and a mismatch is reported for the author to correct rather than copied from the registration onto the program.
 * @evidence contracts/common.md#meaningful-documentation States every field equality, the actor and event-sample rules with the window's unit and inclusiveness, that only an actor's first fault is reported, and what an empty result means.
 * @evidence contracts/performance.md#efficient-algorithms Linear in staged actors, actor programs, event samples and contract events: staged actors and declared event ids are read into sets once, so the undeclared-sample check is a lookup rather than a scan of the contract per sample.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure check over one program that coordinates no work across calls or consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains only per-call sets, maps and diagnostics; the caller owns the returned diagnostics, bounded by five field checks plus one per actor, one per sample and one per contract event.
 */
export function validateShotProgramContract<Context>(
  shot: IAutoMovieDefinedShot<Context>,
  program: IAutoMovieShotProgram,
): IAutoMovieAuthoringDiagnostic[] {
  const diagnostics: IAutoMovieAuthoringDiagnostic[] = [];
  function mismatch (
    path: string,
    actual: unknown,
    expected: unknown,
    correction: string,
  ): void {
    if (actual === expected) return;
    diagnostics.push({
      code: "contract-mismatch",
      phase: "build",
      path,
      fact: `${path} is ${JSON.stringify(actual)} but the registration requires ${JSON.stringify(expected)}.`,
      impact:
        "The source program would self-certify a different artifact than the registered contract.",
      recovery: correction,
    });
  }
  mismatch(
    "$program.stage.scene.id",
    program.stage.scene.id,
    shot.scene,
    "Make the staged scene id equal the scene declared by defineShot.",
  );
  mismatch(
    "$program.blocking.beat",
    program.blocking.beat,
    shot.contract.beat,
    "Make blocking.beat equal the registered contract beat.",
  );
  mismatch(
    "$program.performance.beat",
    program.performance.beat,
    shot.contract.beat,
    "Make performance.beat equal the registered contract beat.",
  );
  mismatch(
    "$program.blocking.duration",
    program.blocking.duration,
    shot.contract.durationSeconds,
    "Make blocking.duration equal the registered contract duration.",
  );
  mismatch(
    "$program.performance.duration",
    program.performance.duration,
    shot.contract.durationSeconds,
    "Make performance.duration equal the registered contract duration.",
  );

  const stagedActors: Set<string> = new Set(
    program.stage.actors.map((actor: IAutoMovieStageActor): string => actor.node),
  );
  const actorFacts: Map<string, number> = new Map();
  program.actors.forEach(
    (actor: IAutoMovieShotActorProgram, index: number): void => {
      const path: string = `$program.actors[${index}]`;
      const first: number | undefined = actorFacts.get(actor.node);
      const invalid: string | null =
        actor.node.trim().length === 0
          ? "node is blank"
          : first !== undefined
            ? `node "${actor.node}" duplicates $program.actors[${first}].node`
            : stagedActors.has(actor.node) === false
              ? `node "${actor.node}" is absent from stage.actors`
              : actor.model.trim().length === 0
                ? "model is blank"
                : Number.isFinite(actor.speed) === false || actor.speed <= 0
                  ? `speed is ${JSON.stringify(actor.speed)} instead of finite and above zero`
                  : Number.isFinite(actor.eyeHeight) === false ||
                      actor.eyeHeight < 0
                    ? `eyeHeight is ${JSON.stringify(actor.eyeHeight)} instead of finite and non-negative`
                    : null;
      if (invalid === null) actorFacts.set(actor.node, index);
      else
        diagnostics.push({
          code: "contract-mismatch",
          phase: "build",
          path,
          fact: `${path} ${invalid}.`,
          impact:
            "The host cannot bind this thin actor program to one measured staged runtime.",
          recovery:
            "Use one staged actor node and one non-blank builder model id, then provide finite positive speed and finite non-negative eye height.",
        });
    },
  );

  const samples: Map<string, number> = new Map();
  program.eventSamples.forEach((sample: IEventSample, index: number): void => {
    if (samples.has(sample.id))
      diagnostics.push({
        code: "contract-mismatch",
        phase: "build",
        path: `$program.eventSamples[${index}].id`,
        fact: `Event sample "${sample.id}" is duplicated.`,
        impact:
          "A declared semantic event would have more than one claimed authority time.",
        recovery:
          "Return exactly one independently chosen sample for each registered event id.",
      });
    samples.set(sample.id, sample.time);
  });
  const declared: Set<string> = new Set();
  shot.contract.events.forEach((event: IAutoMovieShotEventContract): void => {
    declared.add(event.id);
    const time: number | undefined = samples.get(event.id);
    if (
      time === undefined ||
      Number.isFinite(time) === false ||
      time < event.window.from ||
      time > event.window.to
    )
      diagnostics.push({
        code: "contract-mismatch",
        phase: "build",
        path: "$program.eventSamples",
        fact:
          time === undefined
            ? `Event "${event.id}" has no sample.`
            : `Event "${event.id}" is sampled at ${time}s outside ${event.window.from}..${event.window.to}s.`,
        impact:
          "The engine cannot independently measure the event inside its authoritative window.",
        recovery: `Return one finite "${event.id}" sample inside its registered event window.`,
      });
  });
  for (const id of samples.keys())
    if (declared.has(id) === false)
      diagnostics.push({
        code: "contract-mismatch",
        phase: "build",
        path: "$program.eventSamples",
        fact: `Event sample "${id}" is not declared by the registered contract.`,
        impact:
          "Source output would invent an event instead of realizing an authoritative requirement.",
        recovery:
          "Remove the sample or add the intended measurable event to defineShot's contract.",
      });
  return diagnostics;
}
