import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";
import type { AutoMovieArchetypeEquineGaitedProfile } from "./AutoMovieArchetypeEquineGaitedProfile";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { EquinePack } from "./EquinePack";
import { EquineTack } from "./EquineTack";
import { AutoMovieArchetypeHorse } from "./AutoMovieArchetypeHorse";
import { selectEquineTack } from "./internal/selectEquineTack";

/**
 * The equid model `createHorse`, `createPony`, `createDonkey`, `createMule` and
 * `createFoal` share: one build, one tack set, one dimension set and one mass
 * law, so every equid offers the same contacts and is ridden, driven and packed
 * the same way.
 *
 * - Build: an equid is the shared quadruped body
 *   (`AutoMovieArchetypeQuadrupedBody`) laid from a profile (`IProfile`): its
 *   name under each tack, its bands, any read figures, its girth law and its
 *   proportions. `equid` builds the model from a profile and `rig` gives its
 *   joints at rest.
 * - Breed: a horse cohort whose profile replaces the warmblood one (`Breed`); a
 *   pony's breeds are `createPony.Breed`, read figures rather than a profile
 *   change.
 * - Tack: what the equid wears (`Tack`) decides which contacts (`Affordance`) it
 *   offers; each tack's parts and contacts are laid by `EquineTack`.
 * - Dimensions: the withers height scales every bone; the girth follows the
 *   height by the profile and the mass follows both by `mass`, unless a model
 *   was weighed whole.
 * - Gait: the measured equine gait table is `AutoMovieArchetypeEquineGait`,
 *   scaled to the equid's height by `AutoMovieArchetypeQuadrupedGait.scale`.
 *
 * The model faces `+Z` with its left on `+X`, stands square on level ground
 * with the middle of its trunk over the origin, and measures in metres and
 * kilograms.
 */
export namespace AutoMovieArchetypeEquine {
  /**
   * The riding, harness, combined, pack and untacked configurations, and the
   * alternative mounted supports: a bareback bridle, a side saddle and a
   * vaulting surcingle, a double saddle and a trick saddle.
   */
  export type Tack =
    | "saddle"
    | "harness"
    | "both"
    | "pack"
    | "bare"
    | "bareback"
    | "sidesaddle"
    | "surcingle"
    | "double"
    | "trick";

  /**
   * The alternative mounted supports, which a profile may leave unnamed: the
   * model then takes the producer's name.
   */
  export type Alternative =
    | "bareback"
    | "sidesaddle"
    | "surcingle"
    | "double"
    | "trick";

  /**
   * The tacks a profile may leave unnamed: the untacked equid and the
   * alternative supports.
   */
  export type Unnamed = "bare" | Alternative;

  /** The tacks every profile names. */
  export type Named = Exclude<Tack, Unnamed>;

  /**
   * The model's name under each tack: required for the named tacks, optional
   * for the others.
   */
  export type Names = Readonly<
    Record<Named, string> & Partial<Record<Unnamed, string>>
  >;

  /** Every tack the equid builder admits. */
  export const TACKS: readonly Tack[] = [
    "saddle",
    "harness",
    "both",
    "pack",
    "bare",
    "bareback",
    "sidesaddle",
    "surcingle",
    "double",
    "trick",
  ];

  /**
   * The horse cohorts with their own profile: the warmblood default, the
   * Icelandic horse and the ambling breeds
   * (`AutoMovieArchetypeEquineGaitedProfile`).
   */
  export type Breed =
    | "warmblood"
    | "icelandic"
    | AutoMovieArchetypeEquineGaitedProfile.Breed;

  /**
   * The contact ids:
   *
   * - `seat`: the saddle's seat, facing forward.
   * - `pommel`, `cantle`: the front and the back of the saddle, gripped when
   *   mounting.
   * - `leftStirrup`, `rightStirrup`: the stirrups' treads on `+X` and `-X`, each
   *   hanging its drop below the saddle.
   * - `leftRein`, `rightRein`: the reins where the hands hold them above the
   *   withers, each frame at the middle of the held run, which runs forward to
   *   the mouth.
   * - `lead`: the middle of the lead rope's held run beside the head on the
   *   equid's left, running up to the halter.
   * - `hitch`: in harness, the middle between the tugs at the driving saddle,
   *   where a cart's shafts are held and its `coupling` is drawn from.
   * - `leftLoad`, `rightLoad`: under a pack saddle, the middle of each side's
   *   pad, facing out, where a load rests.
   * - `tie`: under a pack saddle, the pads' back on the spine, where a following
   *   animal's lead is made fast in a pack string.
   * - `fixedHead`, `leapingHead`: on a side saddle, the upper pommel the right
   *   thigh goes over and the lower one over the left thigh
   *   (`EquineSideSaddle`).
   * - `leftHandle`, `rightHandle`, `pad`: on a vaulting surcingle, its two
   *   handles and the back pad's top (`EquineSurcingle`).
   * - `mane`: under a riding saddle, a handful of mane on the crest a rider grips
   *   (`EquineMane`).
   * - `pillion`: under a riding saddle with a pillion pad (`tack` `double`), the
   *   passenger's seat astride on the loins behind the cantle
   *   (`EquineSaddle.pillion`).
   * - `horn`, `leftHandhold`, `rightHandhold`, `leftStrap`, `rightStrap`,
   *   `hippodrome`: on a trick saddle (`tack` `trick`), its tall horn, the
   *   handholds on each side of the pommel, the foot straps on each side for
   *   the drags and the hippodrome strap across the seat a standing rider's
   *   feet go under (`EquineSaddle.trick`).
   *
   * A tack lacks the ids of the others; the `lead` is the riding saddle's and
   * the pack saddle's.
   */
  export type Affordance =
    | "seat"
    | "pommel"
    | "cantle"
    | "leftStirrup"
    | "rightStirrup"
    | "leftRein"
    | "rightRein"
    | "lead"
    | "hitch"
    | "leftLoad"
    | "rightLoad"
    | "tie"
    | "fixedHead"
    | "leapingHead"
    | "leftHandle"
    | "rightHandle"
    | "pad"
    | "mane"
    | "pillion"
    | "horn"
    | "leftHandhold"
    | "rightHandhold"
    | "leftStrap"
    | "rightStrap"
    | "hippodrome";

  /**
   * The dimensions, metres unless stated:
   *
   * - `withersHeight`: the withers above the ground, which scales every bone.
   * - `mass`: body mass, kilograms: the read mass of a model weighed whole, else
   *   `mass` of the height and the girth.
   * - `girth`: the heart girth's circumference, which sizes the barrel the
   *   rider's legs lie round: the profile's, following the height
   *   (`IProfile.girth`).
   * - `seatSize`: the saddle's seat from the pommel's nail to the cantle, one of
   *   `SEATS`.
   * - `stirrupDrop`: a stirrup's tread below the saddle's seat.
   * - `stirrupWidth`: the tread's width.
   * - `reinWidth`: a rein's width, one of `REINS`.
   * - `tempo`: how far this equid's stride time lies from the mean, in standard
   *   deviations.
   * - `breechingDrop`: in harness, the breeching's seat below the point of
   *   buttock.
   * - `croupClearance`: under a pack saddle, the croup piece's end above the
   *   tail's root, a packer's hand's breadth (`EquinePack.BANDS`).
   */
  export type Dimension =
    | "withersHeight"
    | "mass"
    | "girth"
    | "seatSize"
    | "stirrupDrop"
    | "stirrupWidth"
    | "reinWidth"
    | "tempo"
    | "breechingDrop"
    | "croupClearance";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    withersHeight: "m",
    mass: "kg",
    girth: "m",
    seatSize: "m",
    stirrupDrop: "m",
    stirrupWidth: "m",
    reinWidth: "m",
    tempo: "",
    breechingDrop: "m",
    croupClearance: "m",
  };

  /**
   * The dimensions that follow from others (`girth`, `mass`) or are a read
   * model's (`seatSize`, `reinWidth`).
   */
  export type Derived = "girth" | "mass" | "seatSize" | "reinWidth";

  /** The dimensions drawn from a band. */
  export type Free = Exclude<Dimension, Derived>;

  /**
   * The parameters every equid producer takes: the tack, the seat and the reins
   * by their read sizes, any free dimension fixed inside its band, and the id.
   */
  export interface IParams extends Partial<Record<Free, number>> {
    /** The saddle's seat size; drawn from the seed when absent. */
    seat?: Seat;

    /** The reins' width; drawn from the seed when absent. */
    rein?: Rein;

    /** What the equid wears; `saddle` when absent. */
    tack?: Tack;

    /** The model's id, unique in a scene; the producer's name when absent. */
    id?: string;
  }

  /**
   * The saddle's middle behind the shoulder joints, metres: an estimate, no
   * source read gives it. A harness's tugs hang on the saddle pad there, so a
   * cart's shafts are held there too.
   */
  export const SADDLE: number = 0.45;

  /**
   * The equid's joints and landmarks at rest, in the model's space: the shared
   * quadruped's (`AutoMovieArchetypeQuadrupedBody.IRig`) and the two places a
   * harness is laid by.
   */
  export interface IRig extends AutoMovieArchetypeQuadrupedBody.IRig {
    /**
     * The point of draft on the `+X` side: where the breast collar meets the
     * barrel's side at the point of shoulder's height, just behind the elbow,
     * as the IVC Carriage measuring chart takes the breast collar from the
     * centre of the chest to just behind the elbow; the `-X` side's is its
     * mirror.
     */
    draft: IAutoMovieVector3;

    /**
     * The middle between the tugs, on the trunk's axis under the saddle's
     * middle: a harness's `hitch`, where a cart's shafts are held.
     */
    hitch: IAutoMovieVector3;
  }

  /**
   * The equid's joints and landmarks at rest.
   *
   * @param dimensions The equid's dimensions, as
   *   `AutoMovieArchetype.dimensions` gives them.
   * @param body The body's proportions; the horse's (`createHorse.BODY`) when
   *   absent.
   * @returns The rest rig.
   */
  export function rig(
    dimensions: Readonly<Partial<Record<Dimension, number>>>,
    body: AutoMovieArchetypeQuadrupedBody.IBody = AutoMovieArchetypeHorse.BODY,
  ): IRig {
    const rest: AutoMovieArchetypeQuadrupedBody.IRig =
      AutoMovieArchetypeQuadrupedBody.rig(body, dimensions);
    const shoulder: IAutoMovieVector3 = rest.limbs.leftFore[0]!;
    const axis: number = rest.back - rest.barrel;
    const side: number = Math.sqrt(
      Math.max(0, rest.barrel * rest.barrel - (axis - shoulder.y) ** 2),
    );
    return {
      ...rest,
      draft: Vector3.create(side, shoulder.y, rest.limbs.leftFore[1]!.z),
      hitch: Vector3.create(0, axis, rest.trunk / 2 - SADDLE),
    };
  }

  /**
   * An equid of a profile with its tack: the shared quadruped body from the
   * profile's proportions, under the chosen tack as `createHorse` describes it.
   * A saddle's read weight is added on top of the equid's drawn mass, and every
   * tack part whose weight no maker states is massless.
   *
   * @param profile The equid's name, bands and body.
   * @param params The tack, the seat and reins by their read sizes, and any
   *   free dimension the author fixes.
   * @param draw The equid's draw session, opened with its name, the seed and
   *   the dimensions the author fixed; a pony's has already picked its breed.
   * @returns The equid.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
   *   a tack that is not one of `TACKS`, or a seat or reins not among `SEATS`
   *   and `REINS`.
   */
  export function equid(
    profile: IProfile,
    params: IParams,
    draw: AutoMovieArchetypeDrawSession<Dimension>,
  ): AutoMovieArchetype<Affordance, Dimension> {
    const tack: Tack = ArchetypeDraw.choice(
      profile.archetype,
      "tack",
      params.tack ?? "saddle",
      TACKS,
    );
    // A pack saddle draws its own dimension beside the equid's.
    const bands: Readonly<Partial<Record<Free, IAutoMovieArchetypeBand>>> =
      tack === "pack"
        ? { ...profile.bands, ...EquinePack.BANDS }
        : profile.bands;
    const drawn: Partial<Record<Free, number>> = {
      ...draw.dimensions(bands),
      ...profile.figures,
    };
    const need = (name: Free): number => {
      const value: number | undefined = drawn[name];
      if (value === undefined)
        throw new Error(
          `${profile.archetype}: no band or figure gives ${name}`,
        );
      return value;
    };
    const selected: EquineTack.Selection = selectEquineTack(
      tack,
      drawn.croupClearance,
      profile.archetype,
    );
    const free: Record<Exclude<Free, "croupClearance">, number> = {
      withersHeight: need("withersHeight"),
      stirrupDrop: need("stirrupDrop"),
      stirrupWidth: need("stirrupWidth"),
      tempo: need("tempo"),
      breechingDrop: need("breechingDrop"),
    };
    const girth: number = draw.derive(
      "girth",
      profile.girth(free.withersHeight),
    );
    const d: EquineTack.Dimensions = {
      ...free,
      girth,
      mass: draw.derive(
        "mass",
        profile.mass ?? mass(free.withersHeight, girth),
      ),
      seatSize: draw.model<Seat>("seat", params.seat, SEATS).figures.seatSize!,
      reinWidth: draw.model<Rein>("rein", params.rein, REINS).figures
        .reinWidth!,
    };
    const builder: AutoMovieArchetypeBuilder<Affordance, Dimension> =
      new AutoMovieArchetypeBuilder({
        id: params.id,
        name: profile.names[tack] ?? profile.archetype,
        draw,
        material: "skin",
      });
    const h: number = d.withersHeight;
    const at: IRig = rig(d, profile.body);
    AutoMovieArchetypeQuadrupedBody.lay(profile.body, builder, h, at);

    // The tack's read weight is its own, beside the equid's (`EquineTack`).
    return builder.build(d.mass + EquineTack(selected, builder, d, at), {
      rests: profile.body.foot,
    });
  }

  /** An equid's build: what `equid` builds one from. */
  export interface IProfile {
    /**
     * The producer's name, which refusals carry and the ride finds the species
     * by.
     */
    archetype: string;

    /** The model's name under each tack. */
    names: Names;

    /** The band of each free dimension the read figures do not give. */
    bands: Readonly<Partial<Record<Free, IAutoMovieArchetypeBand>>>;

    /**
     * A read model's figures, such as a pony breed's height at the withers and
     * girth, laid over the drawn dimensions; absent for the horse, whose height
     * is drawn.
     */
    figures?: Readonly<Partial<Record<Dimension, number>>>;

    /**
     * The heart girth at a height at the withers, both in metres: the profile's
     * girth law.
     */
    girth: (withers: number) => number;

    /**
     * The read mass of a model weighed whole, kilograms; absent, the mass
     * follows the height and the girth by `mass`.
     */
    mass?: number;

    /** The body's proportions. */
    body: AutoMovieArchetypeQuadrupedBody.IBody;
  }

  /** A measured cohort's mean size. */
  export interface IMeans {
    /** The height at the withers, metres. */
    withers: number;

    /** The heart girth, metres. */
    girth: number;

    /** The body mass, kilograms. */
    mass: number;
  }

  /**
   * The measured warmbloods every equid's size is anchored on, means: withers
   * 172 cm, heart girth 204 cm and body weight 640 kg, weighed on a scale
   * (Jensen et al. 2019, Acta Vet Scand 61, Table 2, 38 adult warmbloods,
   * https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML).
   * The paper reports no relation between the measures, so the relation is
   * `mass`'s law.
   */
  export const JENSEN: Readonly<IMeans> = {
    withers: 1.72,
    girth: 2.04,
    mass: 640,
  };

  /**
   * An equid's mass from its height at the withers and its heart girth, where
   * no mass was read with its size: the warmbloods' mean mass scaled by the
   * girth's ratio squared times the height's.
   *
   * The girth-based equine weight formulas take mass as proportional to the
   * heart girth squared times the body's length (Carroll and Huntington 1988,
   * Equine Vet J 20:41), the volume of a barrel; the length is taken as
   * proportional to the height at the withers, as isometric similarity scales
   * every length together. Anchored on `JENSEN`'s means, an equid whose girth
   * is in the warmbloods' proportion to its height has the mass the cube of its
   * height gives. A model weighed whole carries its own read mass instead
   * (`IProfile.mass`).
   *
   * @param withers The height at the withers, metres.
   * @param girth The heart girth, metres.
   * @returns The mass, kilograms.
   */
  export function mass(withers: number, girth: number): number {
    return (
      JENSEN.mass * (girth / JENSEN.girth) ** 2 * (withers / JENSEN.withers)
    );
  }

  /**
   * The seat sizes, inches: Wintec's 16, 16.5, 17, 17.5 and 18 in seats,
   * measured from the saddle nail to the middle of the cantle
   * (https://wintec-saddles.com.au/pages/measuring-your-seat-size).
   */
  export type Seat = "16in" | "16.5in" | "17in" | "17.5in" | "18in";

  /** Each seat size's seat, metres. */
  export const SEATS: Readonly<
    Record<Seat, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "16in": { seatSize: 16 * AutoMovieArchetypeUnits.INCH },
    "16.5in": { seatSize: 16.5 * AutoMovieArchetypeUnits.INCH },
    "17in": { seatSize: 17 * AutoMovieArchetypeUnits.INCH },
    "17.5in": { seatSize: 17.5 * AutoMovieArchetypeUnits.INCH },
    "18in": { seatSize: 18 * AutoMovieArchetypeUnits.INCH },
  };

  /**
   * The rein widths: Dover Saddlery's snaffle reins, 5/8 and 3/4 in wide
   * (https://www.doversaddlery.com/pages/reins-for-english-riding-disciplines).
   */
  export type Rein = "5/8in" | "3/4in";

  /** Each rein's width, metres. */
  export const REINS: Readonly<
    Record<Rein, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "5/8in": { reinWidth: (5 / 8) * AutoMovieArchetypeUnits.INCH },
    "3/4in": { reinWidth: (3 / 4) * AutoMovieArchetypeUnits.INCH },
  };
}
