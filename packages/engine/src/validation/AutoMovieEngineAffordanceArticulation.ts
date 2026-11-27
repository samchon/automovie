import type {
  IAutoMovieAffordance,
  IAutoMovieAffordanceArticulation,
} from "@automovie/interface";

import { affordanceFollowedTravel } from "./internal/affordanceFollowedTravel";
import { affordanceLeadingTravel } from "./internal/affordanceLeadingTravel";
import { affordanceTravelRange } from "./internal/affordanceTravelRange";

/**
 * Coordinates of coupled articulations: one independent degree of freedom,
 * reversible authored inputs and the actual travel of a requested joint.
 */
export namespace AutoMovieEngineAffordanceArticulation {
  /** The kinds whose travel moves parts and carried affordances. */
  export const KINDS: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set([
    "hinge",
    "slider",
    "knob",
    "button",
    "trigger",
    "crank",
    "wheel",
    "pedal",
  ]);

  /**
   * The independent articulation upstream of a coordinate, or null for an
   * unknown, non-articulating or cyclic chain. Reversibility concerns input
   * permission, not which degree of freedom a writer addresses.
   */
  export function leader(
    byId: ReadonlyMap<string, IAutoMovieAffordance>,
    id: string,
  ): string | null {
    const path: IAutoMovieAffordance[] | null = chain(byId, id);
    return path === null ? null : path[path.length - 1]!.id;
  }

  /**
   * Admit one authored input and resolve it through explicitly reversible
   * couplings to its independent leader, checking every joint's legal range.
   * Input records remain unchanged; a caller admitting a whole authored state
   * must also refuse duplicate independent inputs.
   */
  export function input(
    byId: ReadonlyMap<string, IAutoMovieAffordance>,
    id: string,
    value: number,
  ): IAutoMovieAffordanceArticulation.Input {
    const path: IAutoMovieAffordance[] | null = chain(byId, id);
    if (path === null)
      return { success: false, kind: "reference", id, travel: value };
    let travel: number = value;
    for (let k: number = 0; k < path.length; k++) {
      const at: IAutoMovieAffordance = path[k]!;
      const { minimum, maximum } = affordanceTravelRange(at);
      if (
        (minimum !== null && travel < minimum) ||
        (maximum !== null && travel > maximum)
      )
        return { success: false, kind: "range", id: at.id, travel };
      if (at.follows === undefined) return { success: true, id: at.id, travel };
      if (at.follows.reversible !== true)
        return {
          success: false,
          kind: "follower",
          id: at.id,
          travel,
          leader: at.follows.id,
        };
      const leading: number | null = affordanceLeadingTravel(
        at.follows,
        travel,
        affordanceTravelRange(path[k + 1]!),
      );
      if (leading === null)
        return {
          success: false,
          kind: "inverse",
          id: at.id,
          travel,
          leader: at.follows.id,
        };
      travel = leading;
    }
    return { success: false, kind: "reference", id, travel: value };
  }

  /**
   * A joint's actual travel from a state containing at most one authored input
   * per independent degree of freedom; a degree without an input starts at its
   * leader's zero. Null means the joint, its relevant input or its chain is
   * invalid or duplicated.
   */
  export function travel(
    byId: ReadonlyMap<string, IAutoMovieAffordance>,
    state: Readonly<Record<string, number>>,
    id: string,
  ): number | null {
    const path: IAutoMovieAffordance[] | null = chain(byId, id);
    if (path === null) return null;
    const degree: string = path[path.length - 1]!.id;
    let value: number = 0;
    let found: boolean = false;
    for (const [authored, requested] of Object.entries(state)) {
      if (leader(byId, authored) !== degree) continue;
      if (found) return null;
      const resolved: IAutoMovieAffordanceArticulation.Input = input(
        byId,
        authored,
        requested,
      );
      if (!resolved.success) return null;
      found = true;
      value = resolved.travel;
    }
    for (let k: number = path.length - 2; k >= 0; k--)
      value = affordanceFollowedTravel(path[k]!.follows!, value);
    return value;
  }

  /*
   * A coordinate's articulations, upstream through follows, or null for an
   * invalid reference or cycle.
   */
  function chain(
    byId: ReadonlyMap<string, IAutoMovieAffordance>,
    id: string,
  ): IAutoMovieAffordance[] | null {
    const path: IAutoMovieAffordance[] = [];
    const seen: Set<string> = new Set();
    let at: IAutoMovieAffordance | undefined = byId.get(id);
    for (;;) {
      if (at === undefined || !KINDS.has(at.kind) || seen.has(at.id))
        return null;
      path.push(at);
      seen.add(at.id);
      if (at.follows === undefined) return path;
      at = byId.get(at.follows.id);
    }
  }
}
