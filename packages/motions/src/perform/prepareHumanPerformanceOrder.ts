import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";

/**
 * Solve every placed action of a performance once, each after what it reads:
 * a depth-first topological order of the performance's dependencies
 * (Tarjan 1976, "Edge-disjoint spanning trees and depth-first search", Acta
 * Informatica 6:171, the depth-first finishing order of a directed acyclic
 * graph). The dependencies are the reads themselves: while an action is
 * solved, a read of a person's displayed pose or posture at a film second
 * (`IAutoMovieMotionHumanSegment.IPerson.ready`) first solves that person's
 * actions entered by then, so an action is solved only after every action it
 * reads. A read that returns to an action being solved (a cycle of reads, two
 * people facing each other) reads it as it stands, the back edge a depth-first
 * order leaves; each action is solved exactly once.
 *
 * @param self The placed performance.
 * @param actions The actions of a person to solve, in film order.
 * @param solve Solve one action.
 */
export function prepareHumanPerformanceOrder(
  self: IAutoMovieMotionHumanPerformanceState,
  actions: (
    person: IAutoMovieMotionHumanSegment.IPerson,
  ) => readonly IAutoMovieMotionHumanSegment[],
  solve: (
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
  ) => void,
): void {
  const people: readonly IAutoMovieMotionHumanSegment.IPerson[] = [
    ...self.people.values(),
  ];
  const lists: Map<
    IAutoMovieMotionHumanSegment.IPerson,
    readonly IAutoMovieMotionHumanSegment[]
  > = new Map(
    people.map(
      (
        person: IAutoMovieMotionHumanSegment.IPerson,
      ): [
        IAutoMovieMotionHumanSegment.IPerson,
        readonly IAutoMovieMotionHumanSegment[],
      ] => [person, actions(person)],
    ),
  );

  // Visited actions: entered when their solve starts, so a read returning to
  // one being solved does not solve it again.
  const visited: Set<IAutoMovieMotionHumanSegment> = new Set();
  const visit = (
    person: IAutoMovieMotionHumanSegment.IPerson,
    segment: IAutoMovieMotionHumanSegment,
  ): void => {
    if (visited.has(segment)) return;
    visited.add(segment);
    solve(person, segment);
  };
  for (const person of people)
    person.ready = (seconds: number): void => {
      for (const segment of lists.get(person)!)
        if (segment.entryTime <= seconds + 1e-9) visit(person, segment);
    };
  try {
    for (const person of people)
      for (const segment of lists.get(person)!) visit(person, segment);
  } finally {
    for (const person of people) delete person.ready;
  }
}
