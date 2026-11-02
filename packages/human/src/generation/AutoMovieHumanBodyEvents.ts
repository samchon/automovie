import type { IAutoMovieHumanBodyCalibration as Body } from "./IAutoMovieHumanBodyCalibration";

/** One production owner of the head, torso and limb branch topology. */
export namespace AutoMovieHumanBodyEvents {
  /**
   * Fresh event records for one construction. Partial consumers select only
   * present owners/children and preserve the original arc definitions; they
   * never replace a branched boundary with an entire shared ring.
   */
  export function create(): Body.IEvent[] {
    return [
      { parent: "head", direction: "down", splits: [{ child: "upper", arcs: [[0, 2 * Math.PI]] }] },
      {
        parent: "upper", direction: "down", fillet: 1,
        splits: [
          { child: "trunk", arcs: [[ARM_ARC[1], 2 * Math.PI - ARM_ARC[1]], [2 * Math.PI - ARM_ARC[0], ARM_ARC[0]]] },
          { child: "arm.left", arcs: [[ARM_ARC[0], ARM_ARC[1]]] },
          { child: "arm.right", arcs: [[2 * Math.PI - ARM_ARC[1], 2 * Math.PI - ARM_ARC[0]]] },
        ],
      },
      { parent: "head", direction: "up", splits: [{ child: "head.lower", arcs: [[0, 2 * Math.PI]] }] },
      { parent: "trunk", direction: "down", splits: [] },
    ];
  }

  /** Select real available branches from the same production event definition. */
  export function select(names: ReadonlySet<string>): Body.IEvent[] {
    return project(create(), names);
  }

  /** Preserve an actual construction's event records while selecting the available partial consumer. */
  export function project(events: readonly Body.IEvent[], names: ReadonlySet<string>): Body.IEvent[] {
    return events.filter((event: Body.IEvent): boolean => names.has(event.parent)).map((event: Body.IEvent): Body.IEvent => ({ ...event, splits: event.splits.filter((split: Body.ISplit): boolean => names.has(split.child)) })).filter((event: Body.IEvent): boolean => event.splits.length > 0);
  }
}

/** Left shoulder contact phases; reflection owns the opposite boundary. */
const ARM_ARC: readonly [number, number] = [1.133093657, 2.308057249];
