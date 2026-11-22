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
import { ArchetypePartOwnership } from "./ArchetypePartOwnership";
import { AutoMovieArchetypeFrame } from "./AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "./AutoMovieArchetypeRefusal";

/**
 * How a model's articulations move its parts and its other affordances: the rigid motion each articulation kind makes at a travel, and the model those motions leave.
 *
 * The model declares the articulation itself (`IAutoMovieAffordance.parts`, `rides` and `follows`), so this reads any `IAutoMovieModel`'s affordances, not only an archetype's. Each kind moves about or along an axis of its own rest frame, as `AutoMovieAffordanceKind` states: a `hinge`, `knob`, `crank` and `wheel` turn about `+Y`, a `slider` runs along `+X`, a `button`, a `pedal` and a `trigger` go in along `-Y`. A carried affordance takes its carrier's motion after its own, up the chain of `rides`, so a door's lever turns on the leaf and swings with it. An articulation's own frame moves with its own travel, so a drawer's grip is where the hand holds it at every travel.
 *
 * A follower's travel is set by its leader's (`follows`), resolved before any motion. A state names independent leaders, or explicitly reversible followers whose requested travels uniquely determine their leaders. Spatial parentage (`rides`) is resolved afterwards as a separate dependency graph.
 *
 * A `pedal` carried by a `crank` goes round with it and keeps its orientation, since a pedal turns freely on its spindle and the foot holds it level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, each kind's motion, how followers are set, the order of carried motions and the pedal rule.
 * @evidence contracts/development/design.md#principled-representation A kinematic tree of one-degree-of-freedom joints whose joint frames are the affordance frames, with some travels coupled to others. A state gives one input per coupled degree of freedom, by a leader or an explicitly reversible follower, in that kind's travel unit; travel and spatial-parent graphs are resolved separately.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `pose` for the posed model and its travels, `motion` for a single articulation's motion and `range` for its limits. The archetypes own it: the product's own prop articulation (`IAutoMoviePropArticulation`) is a joint subtree with a profile, declared per staged prop and played by authored clips, and reads no affordance; this poses what the affordances themselves declare, and no code yet derives that record from an archetype's affordances (#3368).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No kind's motion is named after an archetype; the pedal rule is the kind's own, stated on `AutoMovieAffordanceKind`; ranges and a follower's rule are the engine's, read here, not restated.
 */
export namespace AutoMovieArchetypeArticulation {
  /** The kinds whose travel moves parts and carried affordances. */
  export const KINDS: ReadonlySet<IAutoMovieAffordance["kind"]> =
    AffordanceArticulation.KINDS;

  /**
   * A model's moving data: its parts and its affordances, both in the model's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A model's two moving lists in the model's space; the type rules out nothing beyond their element types, and the references between them are admitted by `validateModel`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; `pose` takes and returns it and `AutoMovieArchetype` builds it from its rest data.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface package's part and affordance records and declares none of its own.
   */
  export interface IPosed {
    /** The parts, each at its transform. */
    parts: IAutoMovieModelPart[];

    /** The affordances, each at its frame. */
    affordances: IAutoMovieAffordance[];
  }

  /**
   * A model's parts and affordances at an articulation state, with the travel every articulation took.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation The posed lists and one travel per articulation id, in its kind's unit, set or followed.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `pose` and read by `AutoMovieArchetype`, whose `travel` publishes the travels.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Extends `IPosed` and repeats none of its members.
   */
  export interface IResult extends IPosed {
    /** Every articulation's travel by id: the state's for a leader, 0 for one not set, the rule's for a follower. */
    travels: ReadonlyMap<string, number>;
  }

  /**
   * The travel range of an articulation, in its kind's unit.
   *
   * @param affordance The articulation.
   * @returns The least and greatest travel; null for an end without a limit, as the engine's `affordanceTravelRange` gives them: a `wheel` turns `travel` to either side, a `crank` without `travel` has no limit, a `hinge`, `knob` or `slider` runs from minus its `reverse` to `travel`, every other kind runs from 0 to `travel`, and one without `travel` does not move forward.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each kind's range and the meaning of null.
   * @evidence contracts/development/implementation.md#principled-implementation The ranges `IAutoMovieAffordance.travel` and `reverse` state for each kind, read from their engine owner.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call, kept so the package's readers, such as the website's gallery, ask the articulation module for a range.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing beyond the owner it calls.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `affordanceTravelRange`, which engine admission reads too.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function range(affordance: IAutoMovieAffordance): {
    minimum: number | null;
    maximum: number | null;
  } {
    return affordanceTravelRange(affordance);
  }

  /**
   * The rigid motion one articulation makes at a travel, in the model's space, from its rest frame.
   *
   * @param affordance The articulation at rest.
   * @param travel The travel, degrees for the turning kinds and metres for the others.
   * @returns The motion; the motion that moves nothing for a kind that does not travel.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit per kind and the result for other kinds.
   * @evidence contracts/development/implementation.md#principled-implementation A turn about the rest frame's `+Y` through its origin, or a shift along the rest frame's axis the kind names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per axis the kinds name.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Every kind takes its stated axis.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieArchetypeFrame.turn` and `axis`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
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
   * @param state One travel per coupled degree of freedom, named by its leader or an explicitly reversible follower; an independent articulation not listed stays at rest.
   * @returns New parts and affordances and every articulation's travel; the rest records are not changed.
   * @throws {AutoMovieArchetypeRefusal} For an unknown articulation, a non-finite or out-of-range travel, an unmarked follower input, a non-invertible reverse input, duplicate inputs for one coupled degree of freedom, an unresolved or cyclic follows chain, or a followed travel outside its range. Model admission owns the separate acyclic rides graph.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the state's meaning, what is returned and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Normalize reversible inputs to leaders with ArchetypeArticulationState, then resolve every travel by affordanceFollowedTravel with memoization and cycle detection. Only then resolve spatial transforms through rides, with a separate memo; model admission requires each graph to be acyclic separately.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the state, resolve every travel, resolve each affordance's motion once, then move frames and bound parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A travel outside its range is refused, never clamped, a follower's included.
   * @evidence contracts/development/implementation.md#efficient-algorithms Forward travel and spatial evaluation are linear in affordances, bound parts and coupling table lookups; reverse input normalization additionally costs one follows-chain walk and inverse-table validation per authored input.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A carrier's motion and a leader's travel are shared by everything that reads them within one call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memos live for one call; the travels are handed to the caller.
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
    const original: IPosed["parts"] = rest.parts;
    const ownership: object | undefined =
      ArchetypePartOwnership.beforeMap(original);
    const parts: IAutoMovieModelPart[] = original.map(
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
    ArchetypePartOwnership.afterMap(ownership, parts);
    return { parts, affordances, travels: selected.travels };
  }

  /**
   * Absolute travel inputs, omitting unspecified entries before admission.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Preserves the caller's articulation ids and units.
   * @evidence contracts/development/implementation.md#principled-implementation An undefined entry is absent, while zero is an explicit travel.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass over the caller's own input keys.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Admission stays with the travel resolver.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the authored travels.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Complete poses and selected contacts use the same input convention.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one map owned by the sampling call.
   */
  export function travels<Id extends string>(
    state: Partial<Record<Id, number>>,
  ): Map<string, number> {
    const inputs: Map<string, number> = new Map();
    for (const id of Object.keys(state) as Id[]) {
      const value: number | undefined = state[id];
      if (value !== undefined) inputs.set(id, value);
    }
    return inputs;
  }
  /**
   * One admitted travel state, whose contact frames can be evaluated independently.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The travels and per-contact readers all describe the same absolute state.
   * @evidence contracts/development/design.md#principled-representation Separates complete travel admission from the spatial ancestry needed for a model-space contact frame.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The complete pose consumes motion and travels; a selected socket consumes its frame.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Unknown frame ids remain absent so the archetype can issue its own refusal.
   */
  export interface IProjection {
    /** Admitted travel of every articulation, including followers. */
    travels: ReadonlyMap<string, number>;
    /**
     * Model-space motion taking the supplied rest contact to its posed frame.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The input belongs to this rest graph; the result carries it through its own absolute travel and its carriers.
     * @evidence contracts/development/implementation.md#principled-implementation Compose its own motion under the rides chain, including the level-pedal rule.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure The projection exposes the same total motion used to move rigid parts in a complete pose.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Uses the already-admitted travel for each articulation in the chain.
     * @evidence contracts/development/implementation.md#efficient-algorithms Visits each required carrier once per projection.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Contacts that ride the same carrier share its compounded motion within this travel state.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only this projection retains the selected carrier motions.
     */
    motion: (contact: IAutoMovieAffordance) => AutoMovieArchetypeFrame.IMotion;
    /**
     * Model-space frame at the admitted travels, absent for an unknown id.
     *
     * @evidence contracts/development/common.md#meaningful-documentation The id identifies a rest contact; the fresh result has its posed translation, rotation and scale.
     * @evidence contracts/development/implementation.md#principled-implementation Find the original rest record and apply its total rigid motion through AutoMovieArchetypeFrame.move.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One index lookup and one frame application when found.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absent contact has no fabricated frame; the calling model owns its refusal.
     * @evidence contracts/development/implementation.md#efficient-algorithms Evaluates only this contact and the spatial ancestor motions it needs.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the same total motion and frame application as a complete posed archetype.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh transform without retaining it in the projection.
     */
    frame: (id: string) => IAutoMovieTransform | undefined;
  }

  /**
   * Index a rest model for independent travel queries and selected contact frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The inputs are immutable producer rest records and each invocation admits absolute travel inputs.
   * @evidence contracts/development/implementation.md#principled-implementation Resolve every travel and refusal before evaluating the spatial rides chain for a requested contact.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Index the rest graph once and resolve each requested state independently.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Followers and crank-carried pedals retain their full articulation semantics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Travel admission visits each articulation and a contact visits only its carrier ancestry.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The full pose and single contact share their travel admission and spatial motion.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader retains the rest graph and each projection retains only its own travel and spatial results.
   */
  export function prepare(
    archetype: string,
    rest: IPosed,
  ): (state: ReadonlyMap<string, number>) => IProjection {
    const byId: Map<string, IAutoMovieAffordance> = new Map(
      rest.affordances.map(
        (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
      ),
    );
    const articulations: string[] = rest.affordances
      .filter((a: IAutoMovieAffordance): boolean => KINDS.has(a.kind))
      .map((a: IAutoMovieAffordance): string => a.id);
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
          Number.isFinite(travel) &&
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
