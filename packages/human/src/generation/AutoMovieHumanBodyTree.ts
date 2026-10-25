import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanBodyCalibration } from "./IAutoMovieHumanBodyCalibration";

/**
 * Traversals of a calibration's event graph, where every event joins a
 * parent chain's end to its children. A chain may have two parents, one
 * at each end (the lower head between the neck and the middle head), so
 * the graph is acyclic rather than a tree; both traversals read only
 * `calibration.events`.
 */
export namespace AutoMovieHumanBodyTree {
  /**
   * Chain names with every event parent before its children (Kahn's
   * topological order, passes in calibration order).
   *
   * @throws {Error} When the events form a cycle.
   */
  export function order(calibration: IAutoMovieHumanBodyCalibration): string[] {
    const parents: Map<string, Set<string>> = new Map(
      calibration.chains.map(
        (c: IAutoMovieHumanLoftChain): [string, Set<string>] => [
          c.name,
          new Set(),
        ],
      ),
    );
    for (const e of calibration.events)
      for (const s of e.splits) parents.get(s.child)!.add(e.parent);
    const out: string[] = [];
    const done: Set<string> = new Set();
    while (out.length < parents.size) {
      const before: number = out.length;
      for (const [name, set] of parents)
        if (
          !done.has(name) &&
          [...set].every((p: string): boolean => done.has(p))
        ) {
          done.add(name);
          out.push(name);
        }
      if (out.length === before)
        throw new Error("Calibration events form a cycle");
    }
    return out;
  }

  /**
   * Every chain reached from a parent's events in one direction, and from
   * those chains' own events transitively: below the crotch, the legs, feet
   * and toes.
   */
  export function descendants(
    calibration: IAutoMovieHumanBodyCalibration,
    parent: string,
    direction: "down" | "up",
  ): Set<string> {
    const out: Set<string> = new Set();
    const stack: string[] = calibration.events
      .filter(
        (e: IAutoMovieHumanBodyCalibration.IEvent): boolean =>
          e.parent === parent && e.direction === direction,
      )
      .flatMap((e: IAutoMovieHumanBodyCalibration.IEvent): string[] =>
        e.splits.map(
          (s: IAutoMovieHumanBodyCalibration.ISplit): string => s.child,
        ),
      );
    while (stack.length > 0) {
      const name: string = stack.pop()!;
      if (out.has(name)) continue;
      out.add(name);
      for (const e of calibration.events)
        if (e.parent === name) for (const s of e.splits) stack.push(s.child);
    }
    return out;
  }
}
