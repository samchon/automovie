import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
} from "../core";
import { AnnularFitting } from "./AnnularFitting";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { AutoMovieArchetypeEquineGait } from "./AutoMovieArchetypeEquineGait";
import { AutoMovieArchetypeEquineGaitedProfile } from "./AutoMovieArchetypeEquineGaitedProfile";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { CamelGait } from "./CamelGait";
import { CatBody } from "./CatBody";
import { CatGait } from "./CatGait";
import { DeerGait } from "./DeerGait";
import { DogGait } from "./DogGait";
import { EquineHarness } from "./EquineHarness";
import { EquineIcelandicProfile } from "./EquineIcelandicProfile";
import { OxGait } from "./OxGait";
import type { QuadrupedProportions } from "./QuadrupedProportions";
import { buildCamelBody } from "./camel/internal/buildCamelBody";
import { AutoMovieArchetypeCamel } from "./AutoMovieArchetypeCamel";
import { AutoMovieArchetypeCat } from "./AutoMovieArchetypeCat";
import type { createCohortQuadruped } from "./internal/createCohortQuadruped";
import { AutoMovieArchetypeDeer } from "./AutoMovieArchetypeDeer";
import { AutoMovieArchetypeDog } from "./AutoMovieArchetypeDog";
import { AutoMovieArchetypeDonkey } from "./AutoMovieArchetypeDonkey";
import { createHorse } from "./createHorse";
import { AutoMovieArchetypeMule } from "./AutoMovieArchetypeMule";
import { createOx } from "./createOx";
import { AutoMovieArchetypePony } from "./AutoMovieArchetypePony";
import { buildDeerBody } from "./deer/internal/buildDeerBody";
import { buildDogBody } from "./dog/internal/buildDogBody";
import { buildOxBody } from "./ox/internal/buildOxBody";

/**
 * A four-legged animal of a kind, with its kind's tack: every kind shares one
 * body of the horse's bone vocabulary (`AutoMovieArchetypeQuadrupedBody`) and
 * one ride (`rideQuadruped`), and differs from the others only by its species'
 * data, its proportions, its gaits and its tack.
 *
 * The four equids retain their existing producers and tack. A `dog` is
 * createDog's coarse Husky cohort prototype with required authored mass and
 * optional authored collar. A bare adult domestic cat supplies a level walk.
 * Ox, single-hump camel and Boso sika are coherent coarse cohort references,
 * with identifying parts and optional authored equipment. Source limitations
 * remain with each body/gait owner; fixed cohort means are not measured
 * population variation or complete animal dynamics.
 *
 * @param params The kind, and the kind's own parameters.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The animal.
 * @throws {AutoMovieArchetypeRefusal} For a kind that is not one of `KINDS`,
 *   and as the kind's producer refuses.
 */
export function createQuadruped(
  params: createQuadruped.IParams,
  seed?: number,
): AutoMovieArchetype<createQuadruped.Affordance, createQuadruped.Dimension> {
  ArchetypeDraw.choice("quadruped", "kind", params.kind, createQuadruped.KINDS);
  if (params.kind === "dog") return AutoMovieArchetypeDog.create(params, seed);
  if (params.kind === "cat") return AutoMovieArchetypeCat.create(params, seed);
  if (params.kind === "ox") return createOx(params, seed);
  if (params.kind === "camel") return AutoMovieArchetypeCamel.create(params, seed);
  if (params.kind === "deer") return AutoMovieArchetypeDeer.create(params, seed);
  if (params.kind === "horse") return createHorse(params, seed);
  return createQuadruped.PRODUCERS[params.kind](params, seed);
}

/** Companion types and species of {@link createQuadruped}. */
export namespace createQuadruped {
  /** The kinds. */
  export type Kind =
    | "horse"
    | "pony"
    | "donkey"
    | "mule"
    | "dog"
    | "cat"
    | "ox"
    | "camel"
    | "deer";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "horse",
    "pony",
    "donkey",
    "mule",
    "dog",
    "cat",
    "ox",
    "camel",
    "deer",
  ];

  /** The four existing equids, which share the horse tack contract. */
  export const EQUIDS: readonly ("horse" | "pony" | "donkey" | "mule")[] = [
    "horse",
    "pony",
    "donkey",
    "mule",
  ];

  /**
   * The affordance ids of every kind: each kind's own, as its producer lists
   * them.
   */
  export type Affordance =
    | AutoMovieArchetypeEquine.Affordance
    | createCohortQuadruped.Affordance;

  /**
   * The free dimensions of every kind: each kind's own, as its producer lists
   * them.
   */
  export type Dimension = AutoMovieArchetypeEquine.Dimension;

  /** The parameters: the kind, and the kind's own parameters. */
  export type IParams =
    | ({ kind: "horse" } & createHorse.IParams)
    | ({ kind: "pony" | "donkey" | "mule" } & AutoMovieArchetypePony.IParams &
        AutoMovieArchetypeMule.IParams)
    | ({ kind: "dog" } & AutoMovieArchetypeDog.IParams)
    | ({ kind: "cat" } & AutoMovieArchetypeCat.IParams)
    | ({ kind: "ox" } & createOx.IParams)
    | ({ kind: "camel" } & AutoMovieArchetypeCamel.IParams)
    | ({ kind: "deer" } & AutoMovieArchetypeDeer.IParams);

  /** Each kind's producer. */
  export const PRODUCERS: Readonly<{
    horse: typeof createHorse;
    pony: typeof AutoMovieArchetypePony.create;
    donkey: typeof AutoMovieArchetypeDonkey.create;
    mule: typeof AutoMovieArchetypeMule.create;
    dog: typeof AutoMovieArchetypeDog.create;
    cat: typeof AutoMovieArchetypeCat.create;
    ox: typeof createOx;
    camel: typeof AutoMovieArchetypeCamel.create;
    deer: typeof AutoMovieArchetypeDeer.create;
  }> = {
    horse: createHorse,
    pony: AutoMovieArchetypePony.create,
    donkey: AutoMovieArchetypeDonkey.create,
    mule: AutoMovieArchetypeMule.create,
    dog: AutoMovieArchetypeDog.create,
    cat: AutoMovieArchetypeCat.create,
    ox: createOx,
    camel: AutoMovieArchetypeCamel.create,
    deer: AutoMovieArchetypeDeer.create,
  };

  /**
   * A species: what the shared body and the ride read for an animal of its
   * kind.
   */
  export interface ISpecies {
    /**
     * The producer's name, which the animal's `archetype` carries and refusals
     * name.
     */
    archetype: string;

    /**
     * Producer neutral standing directions, degrees:
     * AutoMovieArchetypeQuadrupedBody.IBody.stance builds the declared form,
     * while pose solvers recover constructed control directions.
     */
    stance: Readonly<QuadrupedProportions.IStance>;

    /** The gaits. */
    table: AutoMovieArchetypeQuadrupedGait.ITable;

    /**
     * Producer part-id vocabulary carried by the common neck nod, including
     * neck/head themselves and optional tack that need not exist on every
     * animal. QuadrupedCarriage binds existing accessories only.
     */
    nodding: readonly string[];

    /**
     * Producer contact-id vocabulary carried by the common neck nod; optional
     * contacts need not exist on every animal. Absent or unlisted contacts
     * preserve trunk carriage, including the legacy equid held-rein policy.
     */
    noddingContacts?: readonly string[];
  }

  /**
   * Equid head-carried vocabulary: neck, head, bridle, optional ear plates, the
   * optional jaw, upper lip and nostrils.
   */
  export const BRIDLED: readonly string[] = [
    "neck",
    ...EquineHarness.HEAD,
    "leftEar",
    "rightEar",
    "jaw",
    "lip",
    "leftNostril",
    "rightNostril",
  ];

  /**
   * Each kind's species. Every equid stands at the horse's angles
   * (`createHorse.STANCE`; no pony's, donkey's or mule's were found) and rides
   * the horse's measured gaits, `AutoMovieArchetypeEquineGait.TABLE`, scaled to
   * its height by dynamic similarity, which Bullimore and Burn 2006 (J Exp Biol
   * 209:455, abstract) found to hold across trotting horses of 86 to 714 kg:
   * relative stride length and duty factor at equal Froude number were not
   * related to body mass. For the donkey and the mule the table is provisional:
   * no study gives their duty factors, limb phases or transitions (the searches
   * are in the sources record).
   */
  export const SPECIES: Readonly<Record<Kind, ISpecies>> = {
    horse: {
      archetype: createHorse.PROFILE.archetype,
      stance: createHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    pony: {
      archetype: AutoMovieArchetypePony.ARCHETYPE,
      stance: createHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    donkey: {
      archetype: AutoMovieArchetypeDonkey.ARCHETYPE,
      stance: createHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    mule: {
      archetype: AutoMovieArchetypeMule.ARCHETYPE,
      stance: createHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    dog: {
      archetype: "dog",

      // Each cohort has its own constructed stance; species() reads it below.
      stance: buildDogBody("pet").stance,
      table: DogGait.TABLE,
      nodding: [
        "neck",
        "head",
        "leftEar",
        "rightEar",
        ...AnnularFitting.ids("collar"),
        "lead",
      ],
      noddingContacts: ["lead"],
    },
    cat: {
      archetype: "cat",
      stance: CatBody().stance,
      table: CatGait.TABLE,
      nodding: ["neck", "head", "leftEar", "rightEar"],
    },
    ox: {
      archetype: "ox",
      stance: buildOxBody().stance,
      table: OxGait.TABLE,
      nodding: [
        "neck",
        "head",
        "leftEar",
        "rightEar",
        "leftHorn",
        "rightHorn",
        ...AnnularFitting.ids("collar"),
        "lead",
        "yoke-beam",
        "yoke-bearing",
        "yoke-bearing-link",
        "yoke-hitch-link",
        "yoke-hitch-base",
        "yoke-hitch-upright--1",
        "yoke-hitch-upright-1",
      ],
      // The roper's head and horns targets ride the head with the nod; the heel target between the hocks keeps trunk carriage.
      noddingContacts: ["lead", "hitch", "head", "horns"],
    },
    camel: {
      archetype: "camel",
      stance: buildCamelBody().stance,
      table: CamelGait.TABLE,
      nodding: ["neck", "head", ...AnnularFitting.ids("collar"), "lead"],
      noddingContacts: ["lead"],
    },
    deer: {
      archetype: "deer",
      stance: buildDeerBody().stance,
      table: DeerGait.TABLE,
      nodding: [
        "neck",
        "head",
        "leftAntler",
        "rightAntler",
        "leftAntlerTine1",
        "leftAntlerTine2",
        "rightAntlerTine1",
        "rightAntlerTine2",
        ...AnnularFitting.ids("collar"),
        "lead",
      ],
      noddingContacts: ["lead"],
    },
  };

  /**
   * The species of an animal, found by its producer's name.
   *
   * @param animal The animal.
   * @returns Its species.
   * @throws {AutoMovieArchetypeRefusal} When the animal is no quadruped's,
   *   listing the kinds.
   */
  export function species(animal: {
    archetype: string;
    provenance?: { models: Readonly<Record<string, string | undefined>> };
  }): ISpecies {
    const kind: Kind | undefined = KINDS.find(
      (k: Kind): boolean => SPECIES[k].archetype === animal.archetype,
    );
    if (kind === undefined)
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: animal.archetype,
        axis: "animal",
        value: animal.archetype,
        feasible: { kind: "alternatives", values: [...KINDS] },
        reason: `a ${animal.archetype} is no quadruped`,
        fix: "ride an animal createQuadruped builds",
      });
    if (kind === "dog") {
      const cohort: string | undefined = animal.provenance?.models.cohort;
      if (cohort === "pet" || cohort === "show" || cohort === "sled")
        return {
          ...SPECIES.dog,
          stance: buildDogBody(cohort).stance,
        };
    }
    if (kind === "horse" && animal.provenance?.models.breed === "icelandic")
      return { ...SPECIES.horse, table: EquineIcelandicProfile.TABLE };
    const gaited: AutoMovieArchetypeEquineGaitedProfile.Breed | undefined =
      AutoMovieArchetypeEquineGaitedProfile.BREEDS.find(
        (breed: AutoMovieArchetypeEquineGaitedProfile.Breed): boolean =>
          breed === animal.provenance?.models.breed,
      );
    if (kind === "horse" && gaited !== undefined)
      return {
        ...SPECIES.horse,
        table: AutoMovieArchetypeEquineGaitedProfile.table(gaited),
      };
    return SPECIES[kind];
  }
}
