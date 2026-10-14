import { blockBeat, stageScene } from "@automovie/engine";
import {
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  makeBlockingWrite,
  makeScriptWrite,
  makeStagingWrite,
} from "../internal/filmFixtures";
import { IDENTITY_TRANSFORM } from "../internal/fixtures";
import { hasViolation } from "../internal/predicates";

const endActor: (node: string) => IAutoMovieBeatEndActorState = (node: string): IAutoMovieBeatEndActorState => ({
  node,
  transform: IDENTITY_TRANSFORM,
  facing: { x: 0, y: 0, z: 1 },
  pose: null,
  motion: null,
  localTime: 1,
  gaitPhase: null,
  rootVelocity: null,
  footPlants: null,
  mount: null,
});

const endState: (nodes: string[]) => IAutoMovieBeatEndState = (nodes: string[]): IAutoMovieBeatEndState => ({
  beat: "beat-0",
  shot: "shot:beat-0",
  actors: nodes.map(endActor),
});

/**
 * BLOCKING accepts the prior beat's end-state as this beat's initial condition:
 * a valid state is gated for referential integrity and surfaced verbatim so
 * downstream stages resume the world instead of resetting it, while a state
 * that names unstaged or duplicated actors is a contradiction the correction
 * round must see.
 *
 * Scenarios:
 *
 * 1. A prior state whose actors are all staged → success, surfaced as `previous`
 *    verbatim.
 * 2. No prior state supplied (the film's first beat) → success with `previous:
 *    null`.
 * 3. A carried actor that staging never placed → `type` violation on
 *    `$previous.actors[i].node`.
 * 4. The same actor carried twice → duplication violation.
 * 5. An empty carried node id → non-empty-id violation.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls blockBeat with valid, omitted, unplaced, duplicate and blank prior actor states, checking successful state identity or null and located type refusals, catching lost continuity ownership or an invalid carried actor admitted to a staged beat.
 * @evidence contracts/testing.md#independent-expectations The existing stage places knightA and knightB only, so ghost and a blank id are invalid and two knightA entries collide. A valid previous state must be returned by its supplied object identity, while omission means null; no product snapshot generates these expectations.
 * @evidence contracts/testing.md#distinguishing-cases Preserves the five numbered cases: complete valid pair, absent previous state, one unplaced actor, repeated actor and whitespace identity; pose and velocity derivation are owned by resolveBeatEnd tests rather than this referential gate.
 * @evidence contracts/testing.md#execution-ownership The synchronous test_film_block_beat_previous entry owns every literal prior state and direct portable blocking call after one existing staging prerequisite, with no installation, native artifact, process or rendering host.
 */
export function test_film_block_beat_previous(): void {
  const staged: ReturnType<typeof stageScene> = stageScene(makeScriptWrite(), makeStagingWrite());
  if (staged.success !== true) throw new Error("staging must succeed");

  const previous: IAutoMovieBeatEndState = endState(["knightA", "knightB"]);
  const resumed: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite(),
    previous,
  );
  TestValidator.equals("valid prior state passes", resumed.success, true);
  if (resumed.success === true)
    TestValidator.predicate("prior state surfaced by identity", resumed.previous === previous);

  const first: ReturnType<typeof blockBeat> = blockBeat(makeScriptWrite(), staged, makeBlockingWrite());
  TestValidator.equals("first beat passes", first.success, true);
  if (first.success === true)
    TestValidator.equals("first beat has no prior state", first.previous, null);

  const ghost: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite(),
    endState(["knightA", "ghost"]),
  );
  TestValidator.equals("unstaged carried actor fails", ghost.success, false);
  TestValidator.predicate(
    "violation on the unstaged carried actor",
    hasViolation(ghost, "type", "$previous.actors[1].node"),
  );

  const doubled: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite(),
    endState(["knightA", "knightA"]),
  );
  TestValidator.equals(
    "duplicated carried actor fails",
    doubled.success,
    false,
  );
  TestValidator.predicate(
    "violation on the duplicated carried actor",
    hasViolation(doubled, "type", "$previous.actors[1].node"),
  );

  const unnamed: ReturnType<typeof blockBeat> = blockBeat(
    makeScriptWrite(),
    staged,
    makeBlockingWrite(),
    endState([" "]),
  );
  TestValidator.equals("empty carried node id fails", unnamed.success, false);
  TestValidator.predicate(
    "violation on the empty carried node id",
    hasViolation(unnamed, "type", "$previous.actors[0].node"),
  );
}
