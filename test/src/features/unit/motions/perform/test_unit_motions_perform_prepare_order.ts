import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { prepareHumanPerformanceOrder } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { syntheticHumanPerson } from "../../../internal/synthetic/syntheticHumanPerson";
import { syntheticHumanSegment } from "../../../internal/synthetic/syntheticHumanSegment";

/**
 * `prepareHumanPerformanceOrder` solves every action once, each after what it
 * reads: a read of a person at a second while an action is solved
 * (`IPerson.ready`) first solves that person's actions entered by then, the
 * depth-first topological order (Tarjan 1976); a read back into an action being
 * solved reads it as it stands.
 *
 * Ann's first action reads Bob at 2 s, Bob's first reads Ann at 0 s back. Bob's
 * actions enter at 0, 1.5 and 3 s.
 *
 * Scenarios:
 *
 * 1. The order: Ann's first, then Bob's two entered by 2 s, Bob's first reading
 *    Ann back without solving her first again, then Ann's second and Bob's
 *    third.
 * 2. Every action is solved exactly once.
 * 3. No person keeps a ready hook after the preparation.
 */
export function test_unit_motions_perform_prepare_order(): void {
  const segment = (
    id: string,
    index: number,
    entryTime: number,
  ): IAutoMovieMotionHumanSegment =>
    syntheticHumanSegment({
      id,
      index,
      entryTime,
      end: entryTime + 1.5,
      duration: 1.5,
    });
  const ann: IAutoMovieMotionHumanSegment.IPerson = syntheticHumanPerson(
    "ann",
    [segment("a1", 0, 0), segment("a2", 1, 1.5)],
  );
  const bob: IAutoMovieMotionHumanSegment.IPerson = syntheticHumanPerson(
    "bob",
    [segment("b1", 0, 0), segment("b2", 1, 1.5), segment("b3", 2, 3)],
  );
  const self: IAutoMovieMotionHumanPerformanceState = {
    people: new Map([
      ["ann", ann],
      ["bob", bob],
    ]),
  } as never;
  const solved: string[] = [];
  prepareHumanPerformanceOrder(
    self,
    (
      person: IAutoMovieMotionHumanSegment.IPerson,
    ): readonly IAutoMovieMotionHumanSegment[] => person.segments,
    (
      _person: IAutoMovieMotionHumanSegment.IPerson,
      action: IAutoMovieMotionHumanSegment,
    ): void => {
      solved.push(action.id);
      if (action.id === "a1") bob.ready!(2);
      if (action.id === "b1") ann.ready!(0);
    },
  );

  // 1 and 2. The depth-first order, each action once.
  TestValidator.equals("each action after what it reads", solved, [
    "a1",
    "b1",
    "b2",
    "a2",
    "b3",
  ]);

  // 3. No hook outlives the preparation.
  TestValidator.predicate(
    "the ready hooks are removed",
    ann.ready === undefined && bob.ready === undefined,
  );
}
