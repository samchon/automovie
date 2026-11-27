import {
  prepareHumanPerformanceOrder
} from "../../../../../packages/motions/src/perform/internal/prepareHumanPerformanceOrder";
import { TestValidator } from "@nestia/e2e";

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
 * 2. No person keeps a ready hook after the preparation.
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
    actions: [action("b1", 0), action("b2", 1.5), action("b3", 3)],
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
}
