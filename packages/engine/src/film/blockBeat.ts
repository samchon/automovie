import {
  IAutoMovieBeat,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieBlocking,
  IAutoMovieBlockingActor,
  IAutoMovieBlockingCoverage,
  IAutoMovieCamera,
  IAutoMovieSceneNode,
  IAutoMovieScript,
  IAutoMovieTimingAnchor,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { IAutoMovieBlockedBeat } from "./IAutoMovieBlockedBeat";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";
import { validatePerformShotFraming } from "./validatePerformShotFraming";

/**
 * The blocking gate: check one beat's shot plan before any performance is compiled from it, and report every contradiction at once.
 *
 * The checks are coherence, not craft:
 *
 * - the script's beat ids are unique, and the plan's beat is one of them;
 * - the beat duration is finite and positive;
 * - the plan's beat, actor node, coverage camera and node-kind camera target ids are nonblank;
 * - every actor intent belongs to a staged scene node, and its timing anchors lie inside `[0, duration]` in the order listed, because the list order is the causal order ("the loose before the hit");
 * - a node-kind hero camera target names a staged actor, set piece or camera (#1294), and the hero intent names a supported framing and move;
 * - each optional `coverage` camera (#1187) names a staged camera exactly once, checks staged membership for a node-kind target, and states a supported framing and move.
 *
 * When the prior beat's end state is supplied it becomes this beat's initial condition: each carried actor must be a staged scene node listed once, and the state is returned on success as `previous` so later stages resume from it rather than resetting the world at the cut; without it `previous` is null. This gate assumes typed records and does not validate carried pose values, anchor cue identities or non-node target contents; `performShot` owns later target resolution. Violation paths are rooted at `$script`, `$input` for the blocking, and `$previous`.
 *
 * @evidence contracts/common.md#principled-implementation For typed records, validates actor and node-kind target membership against staged ids and compares each finite anchor time with its running predecessor. Shared sets keyed by the closed framing and move unions admit vocabulary; non-node targets and carried pose values are outside this gate's checks.
 * @evidence contracts/common.md#clear-and-simple-design One gate owns the blocking stage's referential and timing coherence and returns the plan untouched; hero and coverage intents use validatePerformShotFraming, the same vocabulary check frame actions consume, while placement membership uses staged ids.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Names no beat, actor or camera and repairs no invalid plan; both hero and coverage vocabulary are refused at blocking time. Acceptance establishes these coherence checks, while non-node target resolution and performance admission remain later gates.
 * @evidence contracts/common.md#meaningful-documentation Lists the checked ids, memberships, vocabulary and anchor order, the prior-state identity checks and returned aliases, the typed-record premise, unchecked target and pose contents, the null case and violation roots.
 * @evidence contracts/performance.md#efficient-algorithms Linear in script beats, staged nodes and cameras, actor anchors, coverage entries and carried actors, with hashed id sets for every membership test.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure gate over one plan; the id sets are built once per call and shared by every check, and nothing is coordinated across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Retains nothing past the call; the success references the caller's plan and end state, and the failure owns one violation per contradiction.
 */
export function blockBeat (
  script: IAutoMovieScript,
  staged: IAutoMovieStagedSet.ISuccess,
  blocking: IAutoMovieBlocking,
  previous?: IAutoMovieBeatEndState,
): IAutoMovieBlockedBeat {
  const out: ViolationCollector = new ViolationCollector();
  const beatIds: Map<string, number> = new Map();
  script.beats.forEach((beat: IAutoMovieBeat, index: number): void => {
    const existing: number | undefined = beatIds.get(beat.id);
    if (existing !== undefined) {
      out.push(
        "type",
        `$script.beats[${index}].id`,
        `script beat id "${beat.id}" is duplicated; first declared at $script.beats[${existing}].id`,
        beat.id,
      );
      return;
    }
    beatIds.set(beat.id, index);
  });

  function validateNonEmptyId (
    id: string,
    path: string,
    label: string,
  ): void {
    if (id.trim().length === 0)
      out.push("type", path, `${label} must be a non-empty id`, id);
  }

  validateNonEmptyId(blocking.beat, "$input.beat", "beat id");
  if (!beatIds.has(blocking.beat))
    out.push(
      "type",
      "$input.beat",
      `beat "${blocking.beat}" must be one of the script's beats`,
      blocking.beat,
    );

  if (!Number.isFinite(blocking.duration) || !(blocking.duration > 0))
    out.push(
      "range",
      "$input.duration",
      `beat duration must be a finite number > 0 seconds, but was ${blocking.duration}`,
      blocking.duration,
    );

  const nodeIds: Set<string> = new Set(
    staged.scene.nodes.map((n: IAutoMovieSceneNode): string => n.id),
  );
  blocking.actors.forEach(
    (intent: IAutoMovieBlockingActor, i: number): void => {
      validateNonEmptyId(
        intent.node,
        `$input.actors[${i}].node`,
        "actor node id",
      );
      if (!nodeIds.has(intent.node))
        out.push(
          "type",
          `$input.actors[${i}].node`,
          `intent must belong to a staged actor, but "${intent.node}" is not placed`,
          intent.node,
        );
      let predecessor: number = -Infinity;
      (intent.anchors ?? []).forEach(
        (anchor: IAutoMovieTimingAnchor, j: number): void => {
          const finite: boolean = Number.isFinite(anchor.t);
          if (!finite || anchor.t < 0 || anchor.t > blocking.duration)
            out.push(
              "range",
              `$input.actors[${i}].anchors[${j}].t`,
              `anchor "${anchor.cue}" must land within [0, ${blocking.duration}] (the beat), but was ${anchor.t}`,
              anchor.t,
            );
          if (finite && anchor.t < predecessor)
            out.push(
              "range",
              `$input.actors[${i}].anchors[${j}].t`,
              `anchor "${anchor.cue}" (t=${anchor.t}) runs before its predecessor (t=${predecessor}): the list order is the causal order`,
              anchor.t,
            );
          if (finite) predecessor = anchor.t;
        },
      );
    },
  );

  // A camera intent may favour any staged placement: an actor, a set piece,
  // or another camera. A plan the performance stage would realize must not be
  // refused one rung earlier (#1294).
  const cameraIds: Set<string> = new Set(
    staged.scene.cameras.map((c: IAutoMovieCamera): string => c.id),
  );
  const placedIds: Set<string> = new Set([...cameraIds, ...nodeIds]);
  validatePerformShotFraming(
    out,
    "$input.camera",
    blocking.camera.framing,
    blocking.camera.move,
  );

  if (blocking.camera.on.kind === "node") {
    if (!placedIds.has(blocking.camera.on.node))
      out.push(
        "type",
        "$input.camera.on.node",
        `the camera must favour something staged (an actor, a set piece, or another camera), but "${blocking.camera.on.node}" is not placed`,
        blocking.camera.on.node,
      );
    validateNonEmptyId(
      blocking.camera.on.node,
      "$input.camera.on.node",
      "camera target node id",
    );
  }

  // Coverage uses the same vocabulary gate as the hero intent and frame actions.
  const covered: Map<string, number> = new Map();
  (blocking.coverage ?? []).forEach(
    (intent: IAutoMovieBlockingCoverage, i: number): void => {
      validateNonEmptyId(
        intent.camera,
        `$input.coverage[${i}].camera`,
        "coverage camera id",
      );
      if (!cameraIds.has(intent.camera))
        out.push(
          "type",
          `$input.coverage[${i}].camera`,
          `a coverage camera must be a staged camera, but "${intent.camera}" is not`,
          intent.camera,
        );
      const first: number | undefined = covered.get(intent.camera);
      if (first !== undefined)
        out.push(
          "type",
          `$input.coverage[${i}].camera`,
          `coverage camera id "${intent.camera}" is duplicated; first declared at $input.coverage[${first}].camera`,
          intent.camera,
        );
      else covered.set(intent.camera, i);
      validatePerformShotFraming(
        out,
        `$input.coverage[${i}]`,
        intent.framing,
        intent.move,
      );
      if (intent.on.kind === "node") {
        if (!placedIds.has(intent.on.node))
          out.push(
            "type",
            `$input.coverage[${i}].on.node`,
            `a coverage camera must favour something staged (an actor, a set piece, or another camera), but "${intent.on.node}" is not placed`,
            intent.on.node,
          );
        validateNonEmptyId(
          intent.on.node,
          `$input.coverage[${i}].on.node`,
          "coverage target node id",
        );
      }
    },
  );

  if (previous !== undefined) {
    const carried: Map<string, number> = new Map();
    previous.actors.forEach(
      (actor: IAutoMovieBeatEndActorState, i: number): void => {
        validateNonEmptyId(
          actor.node,
          `$previous.actors[${i}].node`,
          "previous beat-end actor node id",
        );
        const first: number | undefined = carried.get(actor.node);
        if (first !== undefined)
          out.push(
            "type",
            `$previous.actors[${i}].node`,
            `previous beat-end actor "${actor.node}" is duplicated; first declared at $previous.actors[${first}].node`,
            actor.node,
          );
        else carried.set(actor.node, i);
        if (!nodeIds.has(actor.node))
          out.push(
            "type",
            `$previous.actors[${i}].node`,
            `previous beat-end actor "${actor.node}" is not a staged scene node: a carried state must resume placed actors`,
            actor.node,
          );
      },
    );
  }

  return out.items.length > 0
    ? { success: false, violations: out.items }
    : { success: true, blocking, previous: previous ?? null };
}
