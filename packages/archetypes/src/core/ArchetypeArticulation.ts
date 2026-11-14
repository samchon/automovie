import {
  Vector3,
  affordanceFollowedTravel,
  affordanceTravelRange,
} from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";

/**
 * How a model's articulations move its parts and its other affordances: the rigid motion each articulation kind makes at a travel, and the model those motions leave.
 *
 * The model declares the articulation itself (`IAutoMovieAffordance.parts`, `rides` and `follows`), so this reads any `IAutoMovieModel`'s affordances, not only an archetype's. Each kind moves about or along an axis of its own rest frame, as `AutoMovieAffordanceKind` states: a `hinge`, `knob`, `crank` and `wheel` turn about `+Y`, a `slider` runs along `+X`, a `button`, a `pedal` and a `trigger` go in along `-Y`. A carried affordance takes its carrier's motion after its own, up the chain of `rides`, so a door's lever turns on the leaf and swings with it. An articulation's own frame moves with its own travel, so a drawer's grip is where the hand holds it at every travel.
 *
 * A follower's travel is set by its leader's (`follows`), resolved before any motion: a state names leaders only, and a car's road wheels steer when its steering wheel is set.
 *
 * A `pedal` carried by a `crank` goes round with it and keeps its orientation, since a pedal turns freely on its spindle and the foot holds it level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, each kind's motion, how followers are set, the order of carried motions and the pedal rule.
 * @evidence contracts/development/design.md#principled-representation A kinematic tree of one-degree-of-freedom joints whose joint frames are the affordance frames, with some joints' travels coupled to others'; a state is one travel per leader articulation id, in the unit of that kind's `travel`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `pose` for the posed model and its travels, `motion` for a single articulation's motion and `range` for its limits. The archetypes own it: the product's own prop articulation (`IAutoMoviePropArticulation`) is a joint subtree with a profile, declared per staged prop and played by authored clips, and reads no affordance; this poses what the affordances themselves declare, and no code yet derives that record from an archetype's affordances (#3368).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No kind's motion is named after an archetype; the pedal rule is the kind's own, stated on `AutoMovieAffordanceKind`; ranges and a follower's rule are the engine's, read here, not restated.
 */
export namespace ArchetypeArticulation {
  /** The kinds whose travel moves parts and carried affordances. */
  export const KINDS: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set<
    IAutoMovieAffordance["kind"]
  >([
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
   * A model's moving data: its parts and its affordances, both in the model's space.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's unit or meaning.
   * @evidence contracts/development/design.md#principled-representation A model's two moving lists in the model's space; the type rules out nothing beyond their element types, and the references between them are admitted by `validateModel`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; `pose` takes and returns it and `Archetype` builds it from its rest data.
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
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; returned by `pose` and read by `Archetype`, whose `travel` publishes the travels.
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
   * @returns The least and greatest travel; null for an end without a limit, as the engine's `affordanceTravelRange` gives them: a `wheel` turns `travel` to either side, a `crank` without `travel` has no limit, every other kind runs from 0 to `travel`, and one without `travel` stays at rest.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each kind's range and the meaning of null.
   * @evidence contracts/development/implementation.md#principled-implementation The ranges `IAutoMovieAffordance.travel` states for each kind, read from their engine owner.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `ArchetypeFrame.turn` and `axis`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function motion(
    affordance: IAutoMovieAffordance,
    travel: number,
  ): ArchetypeFrame.IMotion {
    const shift = (axis: "x" | "y", sign: number): ArchetypeFrame.IMotion => ({
      rotation: ArchetypeFrame.STILL.rotation,
      translation: Vector3.scale(
        ArchetypeFrame.axis(affordance.frame, axis),
        sign * travel,
      ),
    });
    const kind: IAutoMovieAffordance["kind"] = affordance.kind;
    if (TURNING.has(kind))
      return ArchetypeFrame.turn(
        affordance.frame.translation,
        ArchetypeFrame.axis(affordance.frame, "y"),
        travel,
      );
    if (kind === "slider") return shift("x", 1);
    if (kind === "button" || kind === "pedal" || kind === "trigger")
      return shift("y", -1);
    return ArchetypeFrame.STILL;
  }

  /**
   * A model's parts and affordances at an articulation state.
   *
   * @param archetype The name refusals carry.
   * @param rest The model's parts and affordances at rest.
   * @param state The travel of each leader articulation by id; an articulation not listed stays at rest, and a follower takes the travel its rule gives at its leader's.
   * @returns New parts and affordances and every articulation's travel; the rest records are not changed.
   * @throws {ArchetypeRefusal} When an id names no articulation of the model, listing those that exist; names a follower, giving the leader that sets it; a travel is not finite or lies outside the articulation's range, giving the range; a follower's leader is no articulation of the model, or its chain of leaders returns to it, listing the articulations it may follow; or a follower's rule takes it outside its own range at the stated travels, giving that range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the state's meaning, what is returned and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Travels first: each follower's is its rule (`affordanceFollowedTravel`) at its leader's resolved travel, memoised, with a visiting set that catches a chain returning to itself. Then forward kinematics of the tree: each affordance's motion is its carrier's motion after its own, memoised per affordance; `validateModel` admits the `rides` tree as acyclic, which producers satisfy by construction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the state, resolve every travel, resolve each affordance's motion once, then move frames and bound parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A travel outside its range is refused, never clamped, a follower's included.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in affordances and bound parts, each travel and motion computed once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A carrier's motion and a leader's travel are shared by everything that reads them within one call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memos live for one call; the travels are handed to the caller.
   */
  export function pose(
    archetype: string,
    rest: IPosed,
    state: ReadonlyMap<string, number>,
  ): IResult {
    const byId: Map<string, IAutoMovieAffordance> = new Map(
      rest.affordances.map(
        (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
      ),
    );
    const articulations: string[] = rest.affordances
      .filter((a: IAutoMovieAffordance): boolean => KINDS.has(a.kind))
      .map((a: IAutoMovieAffordance): string => a.id);
    const outside = (
      affordance: IAutoMovieAffordance,
      travel: number,
      reason: string,
      fix: string,
    ): ArchetypeRefusal => {
      const { minimum, maximum } = range(affordance);
      return new ArchetypeRefusal({
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
    const within = (affordance: IAutoMovieAffordance, travel: number): boolean => {
      const { minimum, maximum } = range(affordance);
      return (
        Number.isFinite(travel) &&
        (minimum === null || travel >= minimum) &&
        (maximum === null || travel <= maximum)
      );
    };

    // Admit the state: known leader articulations, travels inside their ranges.
    for (const [id, travel] of state) {
      const affordance: IAutoMovieAffordance | undefined = byId.get(id);
      if (affordance === undefined || !KINDS.has(affordance.kind))
        throw new ArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: "articulation",
          value: id,
          feasible: { kind: "alternatives", values: articulations },
          reason: `"${id}" is not an articulation of this model`,
          fix: "name one of the model's articulations",
        });
      if (affordance.follows !== undefined)
        throw new ArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: id,
          value: travel,
          feasible: { kind: "alternatives", values: [affordance.follows.id] },
          reason: `"${id}" follows "${affordance.follows.id}", which sets its travel`,
          fix: "set the leader's travel instead",
        });
      if (!within(affordance, travel))
        throw outside(
          affordance,
          travel,
          `the ${affordance.kind} "${id}" cannot travel ${travel}`,
          "set the travel inside the articulation's range",
        );
    }

    // Every articulation's travel: a leader's as set, a follower's by its rule from its leader's.
    const travels: Map<string, number> = new Map();
    const visiting: Set<string> = new Set();
    const travelOf = (a: IAutoMovieAffordance): number => {
      const known: number | undefined = travels.get(a.id);
      if (known !== undefined) return known;
      if (a.follows === undefined) {
        const set: number = state.get(a.id) ?? 0;
        travels.set(a.id, set);
        return set;
      }
      const leader: IAutoMovieAffordance | undefined = byId.get(a.follows.id);
      if (
        leader === undefined ||
        !KINDS.has(leader.kind) ||
        visiting.has(a.id)
      )
        throw new ArchetypeRefusal({
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
    const memo: Map<string, ArchetypeFrame.IMotion> = new Map();
    const own = (a: IAutoMovieAffordance): ArchetypeFrame.IMotion =>
      motion(a, travels.get(a.id) ?? 0);
    const total = (a: IAutoMovieAffordance): ArchetypeFrame.IMotion => {
      const known: ArchetypeFrame.IMotion | undefined = memo.get(a.id);
      if (known !== undefined) return known;
      const result: ArchetypeFrame.IMotion = ArchetypeFrame.chain(
        carried(a),
        own(a),
      );
      memo.set(a.id, result);
      return result;
    };
    const carried = (a: IAutoMovieAffordance): ArchetypeFrame.IMotion => {
      const carrier: IAutoMovieAffordance | undefined =
        a.rides === undefined ? undefined : byId.get(a.rides);
      if (carrier === undefined) return ArchetypeFrame.STILL;
      if (!(a.kind === "pedal" && carrier.kind === "crank"))
        return total(carrier);

      // A pedal on a crank: the crank carries its spindle round without turning the plate.
      const at: IAutoMovieVector3 = a.frame.translation;
      const turned: IAutoMovieVector3 = ArchetypeFrame.move(own(carrier), {
        ...a.frame,
      }).translation;
      return ArchetypeFrame.chain(carried(carrier), {
        rotation: ArchetypeFrame.STILL.rotation,
        translation: Vector3.subtract(turned, at),
      });
    };

    const moved: Map<string, ArchetypeFrame.IMotion> = new Map();
    const affordances: IAutoMovieAffordance[] = rest.affordances.map(
      (a: IAutoMovieAffordance): IAutoMovieAffordance => {
        const by: ArchetypeFrame.IMotion = total(a);
        for (const part of a.parts ?? []) moved.set(part, by);
        return { ...a, frame: ArchetypeFrame.move(by, a.frame) };
      },
    );
    const parts: IAutoMovieModelPart[] = rest.parts.map(
      (part: IAutoMovieModelPart): IAutoMovieModelPart => {
        const by: ArchetypeFrame.IMotion | undefined = moved.get(part.id);
        return by === undefined
          ? part
          : {
              ...part,
              transform: ArchetypeFrame.move(
                by,
                part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
              ),
            };
      },
    );
    return { parts, affordances, travels };
  }
}

/** The kinds whose travel is an angle in degrees. */
const TURNING: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set<
  IAutoMovieAffordance["kind"]
>(["hinge", "knob", "crank", "wheel"]);
