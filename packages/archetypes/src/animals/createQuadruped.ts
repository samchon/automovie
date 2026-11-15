import { type Archetype, ArchetypeDraw, ArchetypeRefusal } from "../core";
import { HorseGait } from "./HorseGait";
import { HorseHarness } from "./HorseHarness";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedGait } from "./QuadrupedGait";
import { createHorse } from "./createHorse";
import { createPony } from "./createPony";

/**
 * A four-legged animal of a kind, with its kind's tack: every kind shares one body of the horse's bone vocabulary (`QuadrupedBody`) and one ride (`rideQuadruped`), and differs from the others only by its species' data, its proportions, its gaits and its tack.
 *
 * A `horse` is `createHorse`'s and a `pony` `createPony`'s, each with its saddle or harness.
 *
 * @param params The kind, and the kind's own parameters.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The animal.
 * @throws {ArchetypeRefusal} For a kind that is not one of `KINDS`, and as the kind's producer refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what every kind shares, what differs and which producer each kind is.
 * @evidence contracts/development/implementation.md#principled-implementation Admit the kind, then call its producer, which builds the shared body from its species' data and adds its tack.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One choice, one call.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown kind is refused with the kinds there are.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond the producer's.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The horse is `createHorse`'s, unchanged.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createQuadruped(
  params: createQuadruped.IParams,
  seed?: number | string,
): Archetype<createQuadruped.Affordance, createQuadruped.Dimension> {
  const kind: createQuadruped.Kind = ArchetypeDraw.choice(
    "quadruped",
    "kind",
    params.kind,
    createQuadruped.KINDS,
  );
  return createQuadruped.PRODUCERS[kind](params, seed);
}

/**
 * Companion types and species of {@link createQuadruped}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, type and species table states what it is.
 * @evidence contracts/development/design.md#principled-representation A closed union of kinds, each with its producer and its species' data: the body's proportions, the gait table and the parts that nod with the head.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The kinds and the species table the ride reads; each kind's proportions and gaits stay with their sources in its own producer and gait table.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species branch in the shared body or the ride: an animal's species is found by its producer's name and read as data.
 */
export namespace createQuadruped {
  /** The kinds. */
  export type Kind = "horse" | "pony";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["horse", "pony"];

  /** The affordance ids of every kind: each kind's own, as its producer lists them. */
  export type Affordance = createHorse.Affordance;

  /** The free dimensions of every kind: each kind's own, as its producer lists them. */
  export type Dimension = createHorse.Dimension;

  /** The parameters: the kind, and the kind's own parameters. */
  export type IParams = { kind: Kind } & createPony.IParams;

  /** Each kind's producer. */
  export const PRODUCERS: Readonly<
    Record<
      Kind,
      (
        params: IParams,
        seed?: number | string,
      ) => Archetype<Affordance, Dimension>
    >
  > = { horse: createHorse, pony: createPony };

  /**
   * A species: what the shared body and the ride read for an animal of its kind.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it is and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation The producer's name, the standing angles, the gait table and the parts that nod; the joints the ride poses are read off the animal itself (`QuadrupedBody.joints`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; read by `rideQuadruped` and by the gait and change functions.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ISpecies {
    /** The producer's name, which the animal's `archetype` carries and refusals name. */
    archetype: string;

    /** Each limb bone's standing direction, degrees, which shapes a limb's lower piece in the ride: `QuadrupedBody.IBody.stance`. */
    stance: QuadrupedBody.IBody["stance"];

    /** The gaits. */
    table: QuadrupedGait.ITable;

    /** The parts that pitch with the head as it nods, the neck and the head with any tack they wear. */
    nodding: readonly string[];
  }

  /** The parts an equid nods with its head: the neck, the head and a harness's bridle. */
  export const BRIDLED: readonly string[] = ["neck", ...HorseHarness.HEAD];

  /** Each kind's species. The horse and the pony stand at the horse's angles (`createHorse.STANCE`; no pony's were found) and both ride the horse's measured gaits, `HorseGait.TABLE`, scaled to their height by dynamic similarity, which Bullimore and Burn 2006 (J Exp Biol 209:455, abstract) found to hold across trotting horses of 86 to 714 kg: relative stride length and duty factor at equal Froude number were not related to body mass. */
  export const SPECIES: Readonly<Record<Kind, ISpecies>> = {
    horse: {
      archetype: createHorse.PROFILE.archetype,
      stance: createHorse.STANCE,
      table: HorseGait.TABLE,
      nodding: BRIDLED,
    },
    pony: {
      archetype: createPony.ARCHETYPE,
      stance: createHorse.STANCE,
      table: HorseGait.TABLE,
      nodding: BRIDLED,
    },
  };

  /**
   * The species of an animal, found by its producer's name.
   *
   * @param animal The animal.
   * @returns Its species.
   * @throws {ArchetypeRefusal} When the animal is no quadruped's, listing the kinds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The kind whose species carries the animal's producer's name.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Find, or refuse with the alternatives.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Another archetype is refused, never ridden as a horse.
   * @evidence contracts/development/implementation.md#efficient-algorithms A scan of the kinds.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function species(animal: { archetype: string }): ISpecies {
    const kind: Kind | undefined = KINDS.find(
      (k: Kind): boolean => SPECIES[k].archetype === animal.archetype,
    );
    if (kind === undefined)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis: "animal",
        value: animal.archetype,
        feasible: { kind: "alternatives", values: [...KINDS] },
        reason: `a ${animal.archetype} is no quadruped`,
        fix: "ride an animal createQuadruped builds",
      });
    return SPECIES[kind];
  }
}
