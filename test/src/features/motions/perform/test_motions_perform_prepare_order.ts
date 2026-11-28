import { TestValidator } from "@nestia/e2e";

import { prepareHumanPerformanceOrder } from "../../../../../packages/motions/src/perform/internal/prepareHumanPerformanceOrder";
import { throwsError } from "../../internal/throwsError";

/** A person of the order: a name, the ready hook and the actions. */
interface IPerson extends prepareHumanPerformanceOrder.IPerson {
  /** The person's name. */
  name: string;

  /** The actions, in film order. */
  actions: readonly IAction[];
}

/** An action of the order: a name and its entry. */
interface IAction extends prepareHumanPerformanceOrder.IAction {
  /** The action's name. */
  name: string;
}

/**
 * `prepareHumanPerformanceOrder` solves every action once, each after what it
 * reads: a read of a person at a second while an action is solved (`ready`)
 * first solves that person's actions entered by then, the depth-first
 * topological order (Tarjan 1976); a read back into an action being solved
 * reads it as it stands.
 *
 * Ann's first action reads Bob at 2 s, Bob's first reads Ann at 0 s back. Bob's
 * actions enter at 0, 1.5 and 3 s.
 *
 * Scenarios:
 *
 * 1. The order: Ann's first, then Bob's two entered by 2 s, Bob's first reading
 *    Ann back without solving her first again, then Ann's second and Bob's
 *    third; every action exactly once.
 * 2. No person keeps a ready hook after success or failure.
 * 3. Repeated ready queries inspect each pending timestamp at most once.
 * 4. An entered action can be read before its moving phase starts. A later nested
 *    read then prepares that same action. The full walk prepares an action even
 *    when no observation reaches its moving phase.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Includes nested ready calls, out-of-order entries, repeated timestamps and throwing solves.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the private preparation owner on synthetic action lists and observes solve order and timestamp reads.
 * @evidence contracts/development/testing.md#independent-expectations Derives the order from placement order and eligibility at 2 s and bounds timestamp reads by the fixed action count.
 */
export function test_motions_perform_prepare_order(): void {
  const action = (name: string, entryTime: number): IAction => ({
    name,
    entryTime,
  });
  const ann: IPerson = {
    name: "ann",
    actions: [action("a1", 0), action("a2", 1.5)],
  };
  const bob: IPerson = {
    name: "bob",
    actions: [action("b1", 0), action("b3", 3), action("b2", 1.5)],
  };
  const solved: string[] = [];
  prepareHumanPerformanceOrder(
    [ann, bob],
    (person: IPerson): readonly IAction[] => person.actions,
    (_person: IPerson, read: IAction): void => {
      solved.push(read.name);
      if (read.name === "a1") bob.ready!(2);
      if (read.name === "b1") ann.ready!(0);
    },
  );

  // 1. The depth-first order, each action once.
  TestValidator.equals("each action after what it reads", solved, [
    "a1",
    "b1",
    "b2",
    "a2",
    "b3",
  ]);

  // 2. No hook outlives the preparation.
  TestValidator.predicate(
    "the ready hooks are removed",
    ann.ready === undefined && bob.ready === undefined,
  );

  TestValidator.predicate(
    "a failed solve releases both hooks",
    throwsError((): void =>
      prepareHumanPerformanceOrder(
        [ann, bob],
        (person) => person.actions,
        (): void => {
          throw new Error("failed solve");
        },
      ),
    ) &&
      ann.ready === undefined &&
      bob.ready === undefined,
  );

  let reads: number = 0;
  let visits: number = 0;
  const partner: IPerson = {
    name: "partner",
    actions: Array.from(
      { length: 80 },
      (_, index): IAction => ({
        name: `action-${index}`,
        get entryTime(): number {
          ++reads;
          return index / 10;
        },
      }),
    ),
  };
  prepareHumanPerformanceOrder(
    [ann, partner],
    (person) => person.actions,
    (person, entry): void => {
      ++visits;
      if (person === ann && entry.name === "a1")
        for (let index: number = 0; index < 50; ++index) partner.ready!(2);
    },
  );
  TestValidator.equals("one solve per action", visits, 82);
  TestValidator.predicate(
    "one timestamp measurement per partner action",
    reads <= 80,
  );

  const demanded: string[] = [];
  prepareHumanPerformanceOrder(
    [ann, bob],
    (person) => person.actions,
    (_person, read): void => {
      demanded.push(read.name);
      if (read.name === "a1") bob.ready!(2);
      if (read.name === "b2") bob.ready!(2.25);
      if (read.name === "b1") ann.ready!(0);
    },
    (read, seconds): boolean =>
      read.name === "b1" ? seconds > 2 : read.name !== "b3",
  );
  TestValidator.equals(
    "an earlier waiting read leaves the later phase and final walk ready",
    demanded,
    ["a1", "b2", "b1", "a2", "b3"],
  );
}
