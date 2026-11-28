/*
 * Solve every placed action of a performance once, each after what it reads: a
 * depth-first topological order of the performance's dependencies (Tarjan 1976,
 * "Edge-disjoint spanning trees and depth-first search", Acta Informatica
 * 6:171, the depth-first finishing order of a directed acyclic graph). The
 * dependencies are the reads themselves: while an action is solved, a read of a
 * person's displayed pose or posture at a film second
 * (`IAutoMovieMotionHumanSegment.IPerson.ready`) first solves that person's
 * actions entered by then whose prepared geometry is needed at that second.
 * The full walk also solves actions a prior observation could read without
 * preparation. A read that returns to an action being solved (a cycle of reads, two
 * people facing each other) reads it as it stands, the back edge a depth-first
 * order leaves; each action is solved exactly once.
 * Parameter people: The performance's people.
 * Parameter actions: The actions of a person to solve, in film order.
 * Parameter solve: Solve one action.
 * Parameter needed: An action's preparation demand at a film second. When
 * absent, all entered actions are eligible during nested reads.
 */
export function prepareHumanPerformanceOrder<
  Person extends prepareHumanPerformanceOrder.IPerson,
  Action extends prepareHumanPerformanceOrder.IAction,
>(
  people: Iterable<Person>,
  actions: (person: Person) => readonly Action[],
  solve: (person: Person, action: Action) => void,
  needed?: (action: Action, seconds: number) => boolean,
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
  const indexes: Map<Person, IPending> = new Map();
  const visit = (person: Person, index: number): void => {
    const action: Action = lists.get(person)![index]!;
    indexes.get(person)?.discard(index);
    if (visited.has(action)) return;
    visited.add(action);
    solve(person, action);
  };
  for (const person of all)
    person.ready = (seconds: number): void => {
      let pending: IPending | undefined = indexes.get(person);
      if (pending === undefined) {
        pending = indexPending(lists.get(person)!, visited);
        indexes.set(person, pending);
      }
      const limit: number = seconds + 1e-9;
      const candidates: readonly Action[] = lists.get(person)!;
      let from: number = 0;
      let index: number | undefined;
      while ((index = pending.first(limit, from)) !== undefined) {
        from = index + 1;
        // A waiting action stays pending. A nested observation at a later
        // second can still need it before this observation returns.
        if (needed?.(candidates[index]!, seconds) !== false)
          visit(person, index);
      }
    };
  try {
    for (const person of all)
      for (let index: number = 0; index < lists.get(person)!.length; ++index)
        visit(person, index);
  } finally {
    for (const person of all) delete person.ready;
  }
}

/*
 * What prepareHumanPerformanceOrder reads of people and actions.
 */
export namespace prepareHumanPerformanceOrder {
  /*
   * A person whose reads the order hooks
   * (`IAutoMovieMotionHumanSegment.IPerson.ready`).
   */
  export interface IPerson {
    /*
     * Solve the person's actions shown at a film second before it is read; set
     * only while the order runs.
     */
    ready?: (seconds: number) => void;
  }

  /*
   * An action placed at a film second.
   */
  export interface IAction {
    /*
     * Film second it becomes active.
     */
    entryTime: number;
  }
}

/* A pending action index for one person's fixed placement list. */
interface IPending {
  first(limit: number, from: number): number | undefined;
  discard(index: number): void;
}

/*
 * A tree of minimum entry seconds finds the first eligible pending action in
 * placement order, even if overlays enter out of order. Solves remove a leaf
 * before visiting dependencies, so nested reads share the same pending work.
 * The index borrows the action list once and stores only entry seconds.
 */
function indexPending<Action extends prepareHumanPerformanceOrder.IAction>(
  actions: readonly Action[],
  visited: ReadonlySet<Action>,
): IPending {
  const width: number = 2 ** Math.ceil(Math.log2(Math.max(1, actions.length)));
  const tree: Float64Array = new Float64Array(2 * width).fill(NaN);
  for (let index: number = 0; index < actions.length; ++index)
    if (!visited.has(actions[index]!))
      tree[width + index] = actions[index]!.entryTime;
  for (let node: number = width - 1; node > 0; --node)
    tree[node] = firstEntry(tree[2 * node]!, tree[2 * node + 1]!);
  return {
    first(limit: number, from: number): number | undefined {
      if (!(tree[1]! <= limit) || from >= width) return undefined;
      let node: number = width + from;
      // Skip ineligible subtrees in the suffix beginning at `from`.
      while (!(tree[node]! <= limit)) {
        while (node % 2 === 1) node = Math.floor(node / 2);
        if (node < 2) return undefined;
        ++node;
      }
      while (node < width) {
        const left: number = 2 * node;
        node = tree[left]! <= limit ? left : left + 1;
      }
      return node - width;
    },
    discard(index: number): void {
      let node: number = width + index;
      if (Number.isNaN(tree[node]!)) return;
      tree[node] = NaN;
      while (node > 1) {
        node = Math.floor(node / 2);
        const seconds: number = firstEntry(
          tree[2 * node]!,
          tree[2 * node + 1]!,
        );
        if (Object.is(tree[node], seconds)) return;
        tree[node] = seconds;
      }
    },
  };
}

/* An empty subtree uses NaN so a real infinite second stays eligible. */
function firstEntry(left: number, right: number): number {
  if (Number.isNaN(left)) return right;
  if (Number.isNaN(right)) return left;
  return Math.min(left, right);
}
