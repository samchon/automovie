import type { IAutoMovieAffordance } from "@automovie/interface";

import { affordanceFollowedTravel } from "./affordanceFollowedTravel";
import { affordanceLeadingTravel } from "./affordanceLeadingTravel";
import { affordanceTravelRange } from "./affordanceTravelRange";

/**
 * Coordinates of coupled articulations: one independent degree of freedom,
 * reversible authored inputs and the actual travel of a requested joint.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the coordinate operations and their travel units, domain and failure results.
 * @evidence contracts/development/design.md#principled-representation A follows chain relates travel coordinates, independently of spatial rides; an input names one coordinate and resolves to its independent leader in that leader's unit.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Engine owns the kinds, independent leader, admitted input and current travel used by archetype posing and human prop writers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reads the existing affordance records and coupling functions; no producer or action names enter the calculation.
 */
export namespace AffordanceArticulation {
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
   * An independent input, or the coordinate where its upstream resolution failed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Success gives the independent id and travel; failure gives the offending id, travel, reason kind and leader when one was resolved.
   * @evidence contracts/development/design.md#principled-representation A discriminated result keeps failed input admission apart from a usable independent coordinate; each travel uses its named articulation's unit.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by input; archetypes own their structured refusal and motion reads successful coordinates to recover a joint's current travel.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No exception class crosses package boundaries; the optional leader is diagnostic context present only after a coupling is resolved.
   */
  export type Input =
    | { success: true; id: string; travel: number }
    | {
        success: false;
        id: string;
        travel: number;
        kind: "reference" | "range" | "follower" | "inverse";
        leader?: string;
      };

  /**
   * The independent articulation upstream of a coordinate, or null for an unknown, non-articulating or cyclic chain. Reversibility concerns input permission, not which degree of freedom a writer addresses.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the coordinate identity, failure cases and distinction from reverse input permission.
   * @evidence contracts/development/implementation.md#principled-implementation Walk only follows references to the terminal articulation, with a visited set; spatial rides never change coordinate identity.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Read the terminal id of the shared chain walk.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Contains no arithmetic or fallback coordinate.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(D) time and space for follows depth D, bounded by the model's affordances.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure lookup over caller-owned affordances; a performance keeps the result with its immutable writer list.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing across calls.
   */
  export function leader(
    byId: ReadonlyMap<string, IAutoMovieAffordance>,
    id: string,
  ): string | null {
    const path: IAutoMovieAffordance[] | null = chain(byId, id);
    return path === null ? null : path[path.length - 1]!.id;
  }

  /**
   * Admit one authored input and resolve it through explicitly reversible couplings to its independent leader, checking every joint's legal range. Input records remain unchanged; a caller admitting a whole authored state must also refuse duplicate independent inputs.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States units, domain checks, reversible permission, immutability, failures and the caller's duplicate-input responsibility.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve the acyclic chain, check the requested joint, then invert each permitted coupling over its leader's legal domain with affordanceLeadingTravel. Endpoint recovery uses exact forward images, not a tolerance.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One chain walk, then one upstream admission pass returning either a coordinate or the first failed admission.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never reverses an unmarked coupling, clamps a request or chooses among duplicate inputs.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(D + T) work and O(D) space for chain depth D and inverse table rows T along it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares coupling inversion and travel ranges with model admission and forward posing; no cross-call cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Temporary path data is released on return.
   */
  export function input(
    byId: ReadonlyMap<string, IAutoMovieAffordance>,
    id: string,
    value: number,
  ): Input {
    const path: IAutoMovieAffordance[] | null = chain(byId, id);
    if (path === null)
      return { success: false, kind: "reference", id, travel: value };
    let travel: number = value;
    for (let k: number = 0; k < path.length; k++) {
      const at: IAutoMovieAffordance = path[k]!;
      const { minimum, maximum } = affordanceTravelRange(at);
      if (
        !Number.isFinite(travel) ||
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
   * A joint's actual travel from a state containing at most one authored input per independent degree of freedom; a degree without an input starts at its leader's zero. Null means the joint, its relevant input or its chain is invalid or duplicated.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the state's meaning, zero default, result unit and null failures.
   * @evidence contracts/development/implementation.md#principled-implementation Find the requested joint's independent degree, normalize that degree's authored coordinate with input, then apply its forward coupling chain in reverse path order.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the path, find its one input, then walk forward to the joint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not treat an absent follower key as zero when its leader or another reversible coordinate has already moved it.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(S times D + T) work for S state inputs, maximum chain depth D and tables T inverted on the relevant input; paths use O(D) temporary space. Operations read a small prop state once when planning their start.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses input and the one forward coupling owner; no duplicated inverse arithmetic or retained state.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing across calls.
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
      const resolved: Input = input(byId, authored, requested);
      if (!resolved.success) return null;
      found = true;
      value = resolved.travel;
    }
    for (let k: number = path.length - 2; k >= 0; k--)
      value = affordanceFollowedTravel(path[k]!.follows!, value);
    return Number.isFinite(value) ? value : null;
  }

  /** A coordinate's articulations, upstream through follows, or null for an invalid reference or cycle. */
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
