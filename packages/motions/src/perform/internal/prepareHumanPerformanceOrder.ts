/**
 * Solve every placed action of a performance once, each after what it reads: a
 * depth-first topological order of the performance's dependencies (Tarjan 1976,
 * "Edge-disjoint spanning trees and depth-first search", Acta Informatica
 * 6:171, the depth-first finishing order of a directed acyclic graph). The
 * dependencies are the reads themselves: while an action is solved, a read of a
 * person's displayed pose or posture at a film second
 * (`IAutoMovieMotionHumanSegment.IPerson.ready`) first solves that person's
 * actions entered by then, so an action is solved only after every action it
 * reads. A read that returns to an action being solved (a cycle of reads, two
 * people facing each other) reads it as it stands, the back edge a depth-first
 * order leaves; each action is solved exactly once.
 *
 * @param people The performance's people.
 * @param actions The actions of a person to solve, in film order.
 * @param solve Solve one action.
 */
export function prepareHumanPerformanceOrder<
  Person extends prepareHumanPerformanceOrder.IPerson,
  Action extends prepareHumanPerformanceOrder.IAction,
>(
  people: Iterable<Person>,
  actions: (person: Person) => readonly Action[],
  solve: (person: Person, action: Action) => void,
): void {
  const all: readonly Person[] = [...people];
  const lists: Map<Person, readonly Action[]> = new Map(
    all.map((person: Person): [Person, readonly Action[]] => [
      person,
      actions(person),
    ]),
  );

  // Visited actions: entered when their solve starts, so a read returning to
  // one being solved does not solve it again.
  const visited: Set<Action> = new Set();
  const visit = (person: Person, action: Action): void => {
    if (visited.has(action)) return;
    visited.add(action);
    solve(person, action);
  };
  for (const person of all)
    person.ready = (seconds: number): void => {
      for (const action of lists.get(person)!)
        if (action.entryTime <= seconds + 1e-9) visit(person, action);
    };
  try {
    for (const person of all)
      for (const action of lists.get(person)!) visit(person, action);
  } finally {
    for (const person of all) delete person.ready;
  }
}

/** What {@link prepareHumanPerformanceOrder} reads of people and actions. */
export namespace prepareHumanPerformanceOrder {
  /**
   * A person whose reads the order hooks
   * (`IAutoMovieMotionHumanSegment.IPerson.ready`).
   */
  export interface IPerson {
    /**
     * Solve the person's actions shown at a film second before it is read; set
     * only while the order runs.
     */
    ready?: (seconds: number) => void;
  }

  /** An action placed at a film second. */
  export interface IAction {
    /** Film second it becomes active. */
    entryTime: number;
  }
}
