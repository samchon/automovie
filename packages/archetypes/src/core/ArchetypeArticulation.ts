import { Vector3 } from "@automovie/engine";
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
 * The model declares the articulation itself (`IAutoMovieAffordance.parts` and `rides`), so this reads any `IAutoMovieModel`'s affordances, not only an archetype's. Each kind moves about or along an axis of its own rest frame, as `AutoMovieAffordanceKind` states: a `hinge`, `knob`, `crank` and `wheel` turn about `+Y`, a `slider` runs along `+X`, a `button`, a `pedal` and a `trigger` go in along `-Y`. A carried affordance takes its carrier's motion after its own, up the chain of `rides`, so a door's lever turns on the leaf and swings with it. An articulation's own frame moves with its own travel, so a drawer's grip is where the hand holds it at every travel.
 *
 * A `pedal` carried by a `crank` goes round with it and keeps its orientation, since a pedal turns freely on its spindle and the foot holds it level.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read, each kind's motion, the order of carried motions and the pedal rule.
 * @evidence contracts/development/design.md#principled-representation A kinematic tree of one-degree-of-freedom joints whose joint frames are the affordance frames; a state is one travel per articulation id, in the unit of that kind's `travel`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `pose` for the posed model, `motion` for a single articulation's motion and `range` for its limits. The archetypes own it: the product's own prop articulation (`IAutoMoviePropArticulation`) is a joint subtree with a profile, declared per staged prop and played by authored clips, and reads no affordance; this poses what the affordances themselves declare, and no code yet derives that record from an archetype's affordances (#3368).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No kind's motion is named after an archetype; the pedal rule is the kind's own, stated on `AutoMovieAffordanceKind`.
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
   * The travel range of an articulation, in its kind's unit.
   *
   * @param affordance The articulation.
   * @returns The least and greatest travel; null for an end without a limit. A `wheel` turns `travel` to either side, a `crank` without `travel` has no limit, and every other kind runs from 0 to `travel`. Any other articulation without `travel` states none and stays at rest: both ends are 0.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each kind's range and the meaning of null.
   * @evidence contracts/development/implementation.md#principled-implementation The ranges `IAutoMovieAffordance.travel` states for each kind.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rule: the endless crank, the articulation that states no travel, the two-sided wheel, then the rest.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case beyond the kinds' stated rules.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function range(affordance: IAutoMovieAffordance): {
    minimum: number | null;
    maximum: number | null;
  } {
    const travel: number | null = affordance.travel ?? null;
    if (affordance.kind === "crank" && travel === null)
      return { minimum: null, maximum: null };
    if (travel === null) return { minimum: 0, maximum: 0 };
    if (affordance.kind === "wheel")
      return { minimum: -travel, maximum: travel };
    return { minimum: 0, maximum: travel };
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
   * @param state The travel of each articulation by id; an articulation not listed stays at rest.
   * @returns New parts and affordances; the rest records are not changed.
   * @throws {ArchetypeRefusal} When an id names no articulation of the model, listing those that exist, or a travel is not finite or lies outside the articulation's range, giving the range.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the state's meaning, what is returned and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Forward kinematics of the tree: each affordance's motion is its carrier's motion after its own, memoised per affordance; `validateModel` admits the tree as acyclic, which producers satisfy by construction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the state, resolve each affordance's motion once, then move frames and bound parts.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A travel outside its range is refused, never clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in affordances and bound parts, each motion computed once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work A carrier's motion is shared by everything it carries within one call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The memo lives for one call.
   */
  export function pose(
    archetype: string,
    rest: IPosed,
    state: ReadonlyMap<string, number>,
  ): IPosed {
    const byId: Map<string, IAutoMovieAffordance> = new Map(
      rest.affordances.map(
        (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
      ),
    );

    // Admit the state: known articulations, travels inside their ranges.
    for (const [id, travel] of state) {
      const affordance: IAutoMovieAffordance | undefined = byId.get(id);
      if (affordance === undefined || !KINDS.has(affordance.kind))
        throw new ArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: "articulation",
          value: id,
          feasible: {
            kind: "alternatives",
            values: rest.affordances
              .filter((a: IAutoMovieAffordance): boolean => KINDS.has(a.kind))
              .map((a: IAutoMovieAffordance): string => a.id),
          },
          reason: `"${id}" is not an articulation of this model`,
          fix: "name one of the model's articulations",
        });
      const { minimum, maximum } = range(affordance);
      if (
        !Number.isFinite(travel) ||
        (minimum !== null && travel < minimum) ||
        (maximum !== null && travel > maximum)
      )
        throw new ArchetypeRefusal({
          kind: "articulation",
          archetype,
          axis: id,
          value: travel,
          feasible: {
            kind: "range",
            minimum,
            maximum,
            unit: TURNING.has(affordance.kind) ? "degrees" : "m",
          },
          reason: `the ${affordance.kind} "${id}" cannot travel ${travel}`,
          fix: "set the travel inside the articulation's range",
        });
    }

    // Each affordance's motion: its carrier's motion after its own.
    const memo: Map<string, ArchetypeFrame.IMotion> = new Map();
    const own = (a: IAutoMovieAffordance): ArchetypeFrame.IMotion =>
      motion(a, state.get(a.id) ?? 0);
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
    return { parts, affordances };
  }
}

/** The kinds whose travel is an angle in degrees. */
const TURNING: ReadonlySet<IAutoMovieAffordance["kind"]> = new Set<
  IAutoMovieAffordance["kind"]
>(["hinge", "knob", "crank", "wheel"]);
