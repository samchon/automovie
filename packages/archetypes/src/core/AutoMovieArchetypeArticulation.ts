import {
  AffordanceArticulation,
  Vector3,
  affordanceFollowedTravel,
  affordanceTravelRange,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeArticulationState } from "./ArchetypeArticulationState";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/**
 * How a model's articulations move its parts and its other affordances: the
 * rigid motion each articulation kind makes at a travel, and the model those
 * motions leave.
 *
 * The model declares the articulation itself (`IAutoMovieAffordance.parts`,
 * `rides` and `follows`), so this reads any `IAutoMovieModel`'s affordances,
 * not only an archetype's. Each kind moves about or along an axis of its own
 * rest frame, as `AutoMovieAffordanceKind` states: a `hinge`, `knob`, `crank`
 * and `wheel` turn about `+Y`, a `slider` runs along `+X`, a `button`, a
 * `pedal` and a `trigger` go in along `-Y`. A carried affordance takes its
 * carrier's motion after its own, up the chain of `rides`, so a door's lever
 * turns on the leaf and swings with it. An articulation's own frame moves with
 * its own travel, so a drawer's grip is where the hand holds it at every
 * travel.
 *
 * A follower's travel is set by its leader's (`follows`), resolved before any
 * motion. A state names independent leaders, or explicitly reversible followers
 * whose requested travels uniquely determine their leaders. Spatial parentage
 * (`rides`) is resolved afterwards as a separate dependency graph.
 *
 * A `pedal` carried by a `crank` goes round with it and keeps its orientation,
 * since a pedal turns freely on its spindle and the foot holds it level.
 */
export namespace AutoMovieArchetypeArticulation {
  /** The kinds whose travel moves parts and carried affordances. */
  export const KINDS: ReadonlySet<IAutoMovieAffordance["kind"]> =
    AffordanceArticulation.KINDS;

  /**
   * A model's moving data: its parts and its affordances, both in the model's
   * space.
   */
  export interface IPosed {
    /** The parts, each at its transform. */
    parts: IAutoMovieModelPart[];

    /** The affordances, each at its frame. */
    affordances: IAutoMovieAffordance[];
  }

  /**
   * A model's parts and affordances at an articulation state, with the travel
   * every articulation took.
   */
  export interface IResult extends IPosed {
    /**
     * Every articulation's travel by id: the state's for a leader, 0 for one
     * not set, the rule's for a follower.
     */
    travels: ReadonlyMap<string, number>;
  }

  /**
   * The travel range of an articulation, in its kind's unit.
   *
   * @param affordance The articulation.
   * @returns The least and greatest travel; null for an end without a limit, as
   *   the engine's `affordanceTravelRange` gives them: a `wheel` turns `travel`
   *   to either side, a `crank` without `travel` has no limit, a `hinge`,
   *   `knob` or `slider` runs from minus its `reverse` to `travel`, every other
   *   kind runs from 0 to `travel`, and one without `travel` does not move
   *   forward.
   */
  export function range(affordance: IAutoMovieAffordance): {
    minimum: number | null;
    maximum: number | null;
  } {
    return affordanceTravelRange(affordance);
  }

  /**
   * The rigid motion one articulation makes at a travel, in the model's space,
   * from its rest frame.
   *
   * @param affordance The articulation at rest.
   * @param travel The travel, degrees for the turning kinds and metres for the
   *   others.
   * @returns The motion; the motion that moves nothing for a kind that does not
   *   travel.
   */
  export function motion(
    affordance: IAutoMovieAffordance,
    travel: number,
  ): AutoMovieArchetypeFrame.IMotion {
    const shift = (
      axis: "x" | "y",
      sign: number,
    ): AutoMovieArchetypeFrame.IMotion => ({
      rotation: AutoMovieArchetypeFrame.STILL.rotation,
      translation: Vector3.scale(
        AutoMovieArchetypeFrame.axis(affordance.frame, axis),
        sign * travel,
      ),
    });
    const kind: IAutoMovieAffordance["kind"] = affordance.kind;
    if (TURNING.has(kind))
      return AutoMovieArchetypeFrame.turn(
        affordance.frame.translation,
        AutoMovieArchetypeFrame.axis(affordance.frame, "y"),
        travel,
      );
    if (kind === "slider") return shift("x", 1);
    if (kind === "button" || kind === "pedal" || kind === "trigger")
      return shift("y", -1);
    return AutoMovieArchetypeFrame.STILL;
  }

  /**
   * A model's parts and affordances at an articulation state.
   *
   * @param archetype The name refusals carry.
   * @param rest The model's parts and affordances at rest.
   * @param state One travel per coupled degree of freedom, named by its leader
   *   or an explicitly reversible follower; an independent articulation not
   *   listed stays at rest.
   * @returns New parts and affordances and every articulation's travel; the
   *   rest records are not changed.
   * @throws {AutoMovieArchetypeRefusal} For an unknown articulation, a
   *   non-finite or out-of-range travel, an unmarked follower input, a
   *   non-invertible reverse input, duplicate inputs for one coupled degree of
   *   freedom, an unresolved or cyclic follows chain, or a followed travel
   *   outside its range. Model admission owns the separate acyclic rides
   *   graph.
   */
  export function pose(
    archetype: string,
    rest: IPosed,
    state: ReadonlyMap<string, number>,
  ): IResult {
    const selected: IProjection = prepare(archetype, rest)(state);
    const moved: Map<string, AutoMovieArchetypeFrame.IMotion> = new Map();
    const affordances: IAutoMovieAffordance[] = rest.affordances.map(
      (a: IAutoMovieAffordance): IAutoMovieAffordance => {
        const by: AutoMovieArchetypeFrame.IMotion = selected.motion(a);
        for (const part of a.parts ?? []) moved.set(part, by);
        return { ...a, frame: AutoMovieArchetypeFrame.move(by, a.frame) };
      },
    );
    const parts: IAutoMovieModelPart[] = rest.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const by: AutoMovieArchetypeFrame.IMotion | undefined = moved.get(
          part.id,
        );
        return by === undefined
          ? part
          : {
              ...part,
              transform: AutoMovieArchetypeFrame.move(
                by,
                part.transform ??
                  AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
              ),
            };
      },
    );
    return { parts, affordances, travels: selected.travels };
  }

  /** Absolute travel inputs, omitting unspecified entries before admission. */
  export function travels<Id extends string>(
    state: Partial<Record<Id, number>>,
  ): Map<string, number> {
    const inputs: Map<string, number> = new Map();
    for (const [id, value] of Object.entries<number | undefined>(state))
      if (value !== undefined) inputs.set(id, value);
    return inputs;
  }
  /**
   * One admitted travel state, whose contact frames can be evaluated
   * independently.
   */
  export interface IProjection {
    /** Admitted travel of every articulation, including followers. */
    travels: ReadonlyMap<string, number>;
    /** Model-space motion taking the supplied rest contact to its posed frame. */
    motion: (contact: IAutoMovieAffordance) => AutoMovieArchetypeFrame.IMotion;
    /** Model-space frame at the admitted travels, absent for an unknown id. */
    frame: (id: string) => IAutoMovieTransform | undefined;
  }

  /**
   * Index a rest model for independent travel queries and selected contact
   * frames.
   */
  export function prepare(
    archetype: string,
    rest: IPosed,
  ): (state: ReadonlyMap<string, number>) => IProjection {
    const byId: Map<string, IAutoMovieAffordance> = new Map();
    const articulations: string[] = [];
    const partOwners: Map<string, IAutoMovieAffordance> = new Map();
    for (const contact of rest.affordances) {
      byId.set(contact.id, contact);
      if (KINDS.has(contact.kind)) {
        articulations.push(contact.id);
        for (const part of contact.parts ?? []) partOwners.set(part, contact);
      }
    }
    return (state: ReadonlyMap<string, number>): IProjection => {
      const outside = (
        affordance: IAutoMovieAffordance,
        travel: number,
        reason: string,
        fix: string,
      ): AutoMovieArchetypeRefusal => {
        const { minimum, maximum } = range(affordance);
        return new AutoMovieArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: affordance.id,
          value: travel,
          feasible: {
            kind: "range",
            minimum,
            maximum,
            unit: TURNING.has(affordance.kind) ? "degrees" : "m",
          },
          reason,
          fix,
        });
      };
      const within = (
        affordance: IAutoMovieAffordance,
        travel: number,
      ): boolean => {
        const { minimum, maximum } = range(affordance);
        return (
          (minimum === null || travel >= minimum) &&
          (maximum === null || travel <= maximum)
        );
      };

      // Normalize reversible inputs before resolving any dependent travel.
      const inputs: Map<string, number> = ArchetypeArticulationState(
        archetype,
        byId,
        articulations,
        state,
      );

      // Every articulation's travel: a leader's as set, a follower's by its rule from its leader's.
      const travels: Map<string, number> = new Map();
      const visiting: Set<string> = new Set();
      const travelOf = (a: IAutoMovieAffordance): number => {
        const known: number | undefined = travels.get(a.id);
        if (known !== undefined) return known;
        if (a.follows === undefined) {
          const set: number = inputs.get(a.id) ?? 0;
          travels.set(a.id, set);
          return set;
        }
        const leader: IAutoMovieAffordance | undefined = byId.get(a.follows.id);
        if (
          leader === undefined ||
          !KINDS.has(leader.kind) ||
          visiting.has(a.id)
        )
          throw new AutoMovieArchetypeRefusal({
            kind: "articulation",
            archetype,
            axis: a.id,
            value: a.follows.id,
            feasible: {
              kind: "alternatives",
              values: articulations.filter(
                (id: string): boolean => id !== a.id && !visiting.has(id),
              ),
            },
            reason:
              leader === undefined || !KINDS.has(leader.kind)
                ? `"${a.id}" follows "${a.follows.id}", which is no articulation of this model`
                : `the chain of leaders from "${a.id}" returns to it`,
            fix: "make the follower follow an articulation that does not follow it",
          });
        visiting.add(a.id);
        const lead: number = travelOf(leader);
        visiting.delete(a.id);
        const followed: number = affordanceFollowedTravel(a.follows, lead);
        if (!within(a, followed))
          throw outside(
            a,
            followed,
            `"${a.id}" follows "${leader.id}" at ${lead} to ${followed}, outside its range`,
            "keep the follower's rule inside its range over its leader's",
          );
        travels.set(a.id, followed);
        return followed;
      };
      for (const a of rest.affordances) if (KINDS.has(a.kind)) travelOf(a);

      // Each affordance's motion: its carrier's motion after its own.
      const memo: Map<string, AutoMovieArchetypeFrame.IMotion> = new Map();
      const own = (a: IAutoMovieAffordance): AutoMovieArchetypeFrame.IMotion =>
        motion(a, travels.get(a.id) ?? 0);
      const total = (
        a: IAutoMovieAffordance,
      ): AutoMovieArchetypeFrame.IMotion => {
        const known: AutoMovieArchetypeFrame.IMotion | undefined = memo.get(
          a.id,
        );
        if (known !== undefined) return known;
        const result: AutoMovieArchetypeFrame.IMotion =
          AutoMovieArchetypeFrame.chain(carried(a), own(a));
        memo.set(a.id, result);
        return result;
      };
      const carried = (
        a: IAutoMovieAffordance,
      ): AutoMovieArchetypeFrame.IMotion => {
        // A non-driving site follows the same motion as the part carrying it.
        if (a.materialPart !== undefined && !KINDS.has(a.kind)) {
          const owner: IAutoMovieAffordance | undefined = partOwners.get(
            a.materialPart,
          );
          if (owner !== undefined) return total(owner);
        }
        const carrier: IAutoMovieAffordance | undefined =
          a.rides === undefined ? undefined : byId.get(a.rides);
        if (carrier === undefined) return AutoMovieArchetypeFrame.STILL;
        if (!(a.kind === "pedal" && carrier.kind === "crank"))
          return total(carrier);

        // A pedal on a crank: the crank carries its spindle round without turning the plate.
        const at: IAutoMovieVector3 = a.frame.translation;
        const turned: IAutoMovieVector3 = AutoMovieArchetypeFrame.move(
          own(carrier),
          {
            ...a.frame,
          },
        ).translation;
        return AutoMovieArchetypeFrame.chain(carried(carrier), {
          rotation: AutoMovieArchetypeFrame.STILL.rotation,
          translation: Vector3.subtract(turned, at),
        });
      };
      return {
        travels,
        motion: total,
        frame: (id: string): IAutoMovieTransform | undefined => {
          const contact: IAutoMovieAffordance | undefined = byId.get(id);
          return contact === undefined
            ? undefined
            : AutoMovieArchetypeFrame.move(total(contact), contact.frame);
        },
      };
    };
  }
}

/** The kinds whose travel is an angle in degrees. */
const TURNING: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set<
  IAutoMovieAffordance["kind"]
>(["hinge", "knob", "crank", "wheel"]);
