import {
  ArchetypeDraw,
  type AutoMovieArchetype,
  type AutoMovieArchetypeCourse,
  type AutoMovieArchetypeRide,
  AutoMovieArchetypeRefusal,
} from "../core/index";
import { AnnularFitting } from "./fittings/AnnularFitting";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquineFootwork } from "./equine/EquineFootwork";
import type { QuadrupedTimedCues } from "./quadruped/QuadrupedTimedCues";
import { rideQuadrupedImplementation } from "./quadruped/rideQuadruped";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { AutoMovieArchetypeEquineGait } from "./AutoMovieArchetypeEquineGait";
import { AutoMovieArchetypeEquineGaitedProfile } from "./AutoMovieArchetypeEquineGaitedProfile";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedLameness } from "./AutoMovieArchetypeQuadrupedLameness";
import { CamelGait } from "./camel/CamelGait";
import { CatBody } from "./cat/CatBody";
import { CatGait } from "./cat/CatGait";
import { DeerGait } from "./deer/DeerGait";
import { DogGait } from "./dog/DogGait";
import { EquineHarness } from "./equine/EquineHarness";
import { EquineIcelandicProfile } from "./equine/EquineIcelandicProfile";
import { OxGait } from "./ox/OxGait";
import type { QuadrupedProportions } from "./quadruped/QuadrupedProportions";
import { buildCamelBody } from "./camel/buildCamelBody";
import { AutoMovieArchetypeCamel } from "./AutoMovieArchetypeCamel";
import { AutoMovieArchetypeCat } from "./AutoMovieArchetypeCat";
import type { createCohortQuadruped } from "./quadruped/createCohortQuadruped";
import { AutoMovieArchetypeDeer } from "./AutoMovieArchetypeDeer";
import { AutoMovieArchetypeDog } from "./AutoMovieArchetypeDog";
import { AutoMovieArchetypeDonkey } from "./AutoMovieArchetypeDonkey";
import { AutoMovieArchetypeHorse } from "./AutoMovieArchetypeHorse";
import { AutoMovieArchetypeMule } from "./AutoMovieArchetypeMule";
import { AutoMovieArchetypeOx } from "./AutoMovieArchetypeOx";
import { AutoMovieArchetypePony } from "./AutoMovieArchetypePony";
import { buildDeerBody } from "./deer/buildDeerBody";
import { buildDogBody } from "./dog/buildDogBody";
import { buildOxBody } from "./ox/buildOxBody";

/**
 * Constructs the quadruped archetype from its recipe.
 *
 * Companion types and species of {@link AutoMovieArchetypeQuadruped.create}.
 *
 * The generic quadruped ride and its contract.
 */
export namespace AutoMovieArchetypeQuadruped {
/**
 * A four-legged animal of a kind, with its kind's tack: every kind shares one
 * body of the horse's bone vocabulary (`AutoMovieArchetypeQuadrupedBody`) and
 * one ride (`AutoMovieArchetypeQuadruped.ride`), and differs from the others only by its species'
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
export function create(
  params: AutoMovieArchetypeQuadruped.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeQuadruped.Affordance, AutoMovieArchetypeQuadruped.Dimension> {
  ArchetypeDraw.choice("quadruped", "kind", params.kind, AutoMovieArchetypeQuadruped.KINDS);
  if (params.kind === "dog") return AutoMovieArchetypeDog.create(params, seed);
  if (params.kind === "cat") return AutoMovieArchetypeCat.create(params, seed);
  if (params.kind === "ox") return AutoMovieArchetypeOx.create(params, seed);
  if (params.kind === "camel") return AutoMovieArchetypeCamel.create(params, seed);
  if (params.kind === "deer") return AutoMovieArchetypeDeer.create(params, seed);
  if (params.kind === "horse") return AutoMovieArchetypeHorse.create(params, seed);
  return AutoMovieArchetypeQuadruped.PRODUCERS[params.kind](params, seed);
}
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
    | IHorseParams
    | IPonyParams
    | IDonkeyParams
    | IMuleParams
    | IDogParams
    | ICatParams
    | IOxParams
    | ICamelParams
    | IDeerParams;

  /** Parameters for the horse kind. */
  export interface IHorseParams extends AutoMovieArchetypeHorse.IParams {
    /** The animal kind: `horse`. */
    kind: "horse";
  }

  /** Parameters for the pony kind. */
  export interface IPonyParams
    extends AutoMovieArchetypePony.IParams,
      AutoMovieArchetypeMule.IParams {
    /** The animal kind: `pony`. */
    kind: "pony";
  }

  /** Parameters for the donkey kind. */
  export interface IDonkeyParams
    extends AutoMovieArchetypePony.IParams,
      AutoMovieArchetypeMule.IParams {
    /** The animal kind: `donkey`. */
    kind: "donkey";
  }

  /** Parameters for the mule kind. */
  export interface IMuleParams
    extends AutoMovieArchetypePony.IParams,
      AutoMovieArchetypeMule.IParams {
    /** The animal kind: `mule`. */
    kind: "mule";
  }

  /** Parameters for the dog kind. */
  export interface IDogParams extends AutoMovieArchetypeDog.IParams {
    /** The animal kind: `dog`. */
    kind: "dog";
  }

  /** Parameters for the cat kind. */
  export interface ICatParams extends AutoMovieArchetypeCat.IParams {
    /** The animal kind: `cat`. */
    kind: "cat";
  }

  /** Parameters for the ox kind. */
  export interface IOxParams extends AutoMovieArchetypeOx.IParams {
    /** The animal kind: `ox`. */
    kind: "ox";
  }

  /** Parameters for the camel kind. */
  export interface ICamelParams extends AutoMovieArchetypeCamel.IParams {
    /** The animal kind: `camel`. */
    kind: "camel";
  }

  /** Parameters for the deer kind. */
  export interface IDeerParams extends AutoMovieArchetypeDeer.IParams {
    /** The animal kind: `deer`. */
    kind: "deer";
  }

  /** Each kind's producer. */
  export const PRODUCERS: Readonly<{
    horse: typeof AutoMovieArchetypeHorse.create;
    pony: typeof AutoMovieArchetypePony.create;
    donkey: typeof AutoMovieArchetypeDonkey.create;
    mule: typeof AutoMovieArchetypeMule.create;
    dog: typeof AutoMovieArchetypeDog.create;
    cat: typeof AutoMovieArchetypeCat.create;
    ox: typeof AutoMovieArchetypeOx.create;
    camel: typeof AutoMovieArchetypeCamel.create;
    deer: typeof AutoMovieArchetypeDeer.create;
  }> = {
    horse: AutoMovieArchetypeHorse.create,
    pony: AutoMovieArchetypePony.create,
    donkey: AutoMovieArchetypeDonkey.create,
    mule: AutoMovieArchetypeMule.create,
    dog: AutoMovieArchetypeDog.create,
    cat: AutoMovieArchetypeCat.create,
    ox: AutoMovieArchetypeOx.create,
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
      archetype: AutoMovieArchetypeHorse.PROFILE.archetype,
      stance: AutoMovieArchetypeHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    pony: {
      archetype: AutoMovieArchetypePony.ARCHETYPE,
      stance: AutoMovieArchetypeHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    donkey: {
      archetype: AutoMovieArchetypeDonkey.ARCHETYPE,
      stance: AutoMovieArchetypeHorse.STANCE,
      table: AutoMovieArchetypeEquineGait.TABLE,
      nodding: BRIDLED,
      noddingContacts: [],
    },
    mule: {
      archetype: AutoMovieArchetypeMule.ARCHETYPE,
      stance: AutoMovieArchetypeHorse.STANCE,
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
  /**
   * A quadruped going along a course: its root on the path, its trunk rising and
   * falling and its head nodding with the stride, its four limbs stepping in the
   * gait's order, and its gait and lead changing with the speed or as the
   * course's legs name them. Every kind is ridden by this one function, from its
   * species' data (`createQuadruped.species`).
   *
   * The stride's timing is the selected declared table's
   * (`AutoMovieArchetypeQuadrupedGait.timing`) at the course's speed and the
   * animal's withers height, shifted by its normalized `tempo`. The source owner
   * distinguishes observed, derived and authored clocks; absolute clocks stay
   * unscaled, otherwise the table's dynamic-similarity assumption is provisional
   * as `AutoMovieArchetypeQuadrupedGait.scale` states. Each foot lands at its
   * phase of the stride, stays planted for the duty factor's share of it while
   * the body passes over, then swings forward, lifted clear of the ground and of
   * any authored pole its hoof crosses, with its carpus or hock folded; a gait
   * that states its swing height by landmark
   * (`AutoMovieArchetypeQuadrupedGait.IElevation`) lifts the toe to that point of
   * the cannon. A planted foot stays at its recorded world footprint on level
   * straight and curved legs, including signed backing and gait changes. A route
   * pause holds the hoof clock and emits no new touchdown inside its stationary
   * interval. The ride adds an instant for every landing, `leftForeOn`,
   * `rightHindOn` and so on, which a rider's rising trot or a walker's step
   * beside the animal locks to. The tack rides the trunk, so `frame("seat",
   * seconds)` is the moving support a rider sits on and `frame("hitch", seconds)`
   * the one a cart is drawn from; the species' nodding parts turn with the head.
   *
   * The gait of each stride is the one a course leg names, else the one `gait`
   * names, else the one the speed calls for at the species' change points
   * (`QuadrupedChange`), going up above a change point by the species' hysteresis
   * and coming down below it by as much, so a speed hovering at the boundary does
   * not flip the gait every stride. A change is decided at the left fore's
   * landing, the stride's start, and takes the next stride: each foot's landing
   * moves from the old gait's phase to the new one's, so a planted foot stays
   * planted, and the ride names `gait:<from>-<to>` there. A leg may name a `lead`
   * for a leaded gait, whose right lead mirrors the left; a change of lead is a
   * flying change, taken the same way and named `lead:<from>-<to>`.
   *
   * A leg's `equineFootwork` names a horse's technique
   * (`EquineFootwork.Technique`). A lateral figure turns the body off the travel
   * heading (`EquineLateral`), each planted hoof then centred between its neutral
   * points at landing and release; a jump moves the takeoff stride's landings,
   * holds the hoof clock through a ballistic flight and lifts the body over the
   * authored obstacles (`EquineJump`), naming `jumpApproach`, `jumpTakeoff`
   * (final hind liftoff), `jumpLanding` (first fore landing) and `jumpRecovery`;
   * a baulk names `baulkStop` and `baulkSettle` at its halt.
   *
   * Requested gaits and speeds are admitted before timing is read
   * (`QuadrupedRideAdmission`). Virtual landing clocks use the course boundary's
   * state while their spatial samples remain held by the original plan. An
   * explicit standing departure starts with all four neutral hoof anchors, each
   * releasing for the first gait swing without a virtual pre-roll touchdown. An
   * optional authoring table is admitted and copied before planning; it supplies
   * only this ride's clocks and pose ranges.
   *
   * Limb roots remain fixed in their parent's local frame. Four unchanged foot
   * goals and cylinder/capsule soles constrain one body-root height; the gait's
   * bob is its soft preference, while the horizontal course is kept. The shared
   * generic FK must reproduce every solved origin and endpoint.
   *
   * @param animal The animal, as `createQuadruped` or its kind's producer builds
   *   it.
   * @param route The course its root follows, or a planned course such as a timed
   *   one (`AutoMovieArchetypeCourse.timed`), ridden as one leg whose strides
   *   take the gait its speed calls for, or a planned course with named-gait cues
   *   (`AutoMovieArchetypeQuadruped.IRideCued`) whose cued intervals take the named gait; a
   *   leg may name the `gait`, the `lead` and an equine technique.
   * @param gait The gait of every stride whose leg names none; absent, the speed
   *   chooses it.
   * @param table Optional admitted authoring table, replacing only this ride's
   *   gait data.
   * @returns The ride.
   * @throws {AutoMovieArchetypeRefusal} When the animal is no quadruped's, a
   *   supplied table fails AutoMovieArchetypeQuadrupedLocomotion.admit, a gait is
   *   not in the selected table, a requested speed is outside its domain, the
   *   course is malformed, a technique is inadmissible, or its phase advance
   *   exceeds representability/capacity before stride enumeration.
   * @throws {RangeError} For unsupported geometry/carriage or foot goals whose
   *   four fixed chains and body-floor constraint have no common root height.
   */
  export function ride<Affordance extends string, D extends string>(
    animal: AutoMovieArchetype<
      Affordance,
      D | AutoMovieArchetypeQuadrupedBody.Dimension
    >,
    route:
      | AutoMovieArchetypeQuadruped.IRideCourse
      | AutoMovieArchetypeCourse.IPlan
      | AutoMovieArchetypeQuadruped.IRideCued,
    gait?: AutoMovieArchetypeQuadrupedGait.Gait,
    table?: AutoMovieArchetypeQuadrupedGait.ITable,
  ): AutoMovieArchetypeRide.IRide<
    Affordance,
    D | AutoMovieArchetypeQuadrupedBody.Dimension
  > {
    return rideQuadrupedImplementation(animal, route, gait, table);
  }

  /** A per-sample trunk pitch: degrees, positive nose-down, at a film second. */
  export type RideLean = (seconds: number) => number;

  /**
   * A timed path with named-gait cues over film-second intervals, as a rider's
   * aid asks for a gait (`QuadrupedTimedCues`).
   */
  export type IRideCued = QuadrupedTimedCues.ICued;

  /** One named-gait cue of a timed path. */
  export type IRideCue = QuadrupedTimedCues.ICue;

  /** A course leg that may name its gait, its lead and an equine technique. */
  export type IRideLeg = AutoMovieArchetypeCourse.Leg & {
    /** The gait the leg is taken at; the speed chooses when absent. */
    gait?: AutoMovieArchetypeQuadrupedGait.Gait;
    /** The lead of a leaded gait on the leg; the left when absent. */
    lead?: AutoMovieArchetypeQuadrupedGait.Lead;
    /**
     * Optional film-specific hoof work, lateral figure, jump or baulk on a
     * supported individual equine route.
     */
    equineFootwork?: EquineFootwork.Technique;
  };

  /** A quadruped's course: a course whose legs may name their gait and lead. */
  export interface IRideCourse extends Omit<
    AutoMovieArchetypeCourse.ICourse,
    "legs"
  > {
    /** Begin a zero-speed course with all four neutral hoof anchors. */
    startFromStanding?: true;
    /**
     * Independently authored world landing surfaces and optional pole
     * obstacles.
     */
    footing?: AutoMovieArchetypeQuadrupedFooting.IScene;
    /**
     * A lame limb and its grade, at the walk or trot
     * (`AutoMovieArchetypeQuadrupedLameness`); an unnamed leg's automatic gait
     * is checked as the fastest it could reach.
     */
    lameness?: AutoMovieArchetypeQuadrupedLameness.ILameness;
    /**
     * An optional trunk pitch about the root at each film second, degrees,
     * positive nose-down, such as a draught horse's forward lean into its load;
     * the planted hooves keep their footprints.
     */
    lean?: RideLean;
    /**
     * Lean the body into its bends by the steady-turn balance of speed and
     * curvature (`AutoMovieArchetypeCourse.lean`), rolled about its long axis
     * on the floor with the hooves on their footprints, as a lunged horse does;
     * upright when absent.
     */
    leanIn?: true;
    /** The legs in order, at least one. */
    legs: readonly IRideLeg[];
  }
}
