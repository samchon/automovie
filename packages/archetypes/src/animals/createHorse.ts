import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeUnits,
  type IArchetypeBand,
} from "../core";
import { EquidEarProfiles } from "./EquidEarProfiles";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { HorsePack } from "./HorsePack";
import { HorseTack } from "./HorseTack";
import { IcelandicHorseProfile } from "./IcelandicHorseProfile";
import { QuadrupedBody } from "./QuadrupedBody";

/**
 * A horse with its tack: a coarse body of one bar per bone, under a riding saddle with stirrups, reins and a lead rope, in a driving harness, under a pack saddle with a lead rope, or without tack.
 *
 * The horse stands square on level ground, facing `+Z`, with the middle of its trunk over the origin. Its body is the shared quadruped's (`QuadrupedBody`) drawn by the horse's proportions, `BODY`: its parts are its bones, named by `QuadrupedBody.Bone`, a trunk, the hindquarters behind it, a neck, a head and a tail, and four bones down each limb. Each bone is a bar from joint to joint, so the horse is posed by moving joints; `createHorse.rig` gives the joints at rest and `rideHorse` poses the limbs through a gait. Bone lengths are fixed fractions of the height at the withers and each bone's share of the body's mass is the measured one. The trunk runs Kubo's shoulder to hip; the hindquarters carry the body on from the hip joint to the point of buttock, which Jensen et al. place behind the point of shoulder.
 *
 * Under the saddle (`tack` `saddle`, the default) the rider's contacts ride the trunk: the saddle's `seat`, the two stirrups, the two reins where the hands hold them, and the pommel and cantle a mounting rider grips. `lead` is the lead rope's held run, beside the head on the horse's left. In harness (`tack` `harness`) the horse wears a breast collar, a driving saddle with its tugs, terrets, girth and backstrap, a breeching and a bridle with blinkers, as `HorseHarness` lays them; its one contact is the `hitch` between the tugs, which a cart's `coupling` is held on. The traces and the driving lines run between the horse and the vehicle, so the towing ride lays them (`createCart.lines`). A postilion's horse (`tack` `both`) wears the harness under the riding saddle and offers both's contacts. Under a pack saddle (`tack` `pack`) the horse wears FM 25-7's Phillips cargo saddle sized to it, with its cinch, breast collar, croup piece and breeching, as `HorsePack` lays them; its contacts are the `lead` and a load against each side, `leftLoad` and `rightLoad`. The alternative mounted supports keep the horse's body: a bareback bridle (`tack` `bareback`) offers only the two reins, the `lead` and a `seat` on the back itself; a side saddle (`tack` `sidesaddle`, `HorseSideSaddle`) offers a `seat` entered sideways from the near side, the `fixedHead` and `leapingHead`, the one `leftStirrup`, the reins and the `lead`; a vaulting surcingle (`tack` `surcingle`, `HorseSurcingle`) offers the `leftHandle` and `rightHandle`, the back `pad` and the basic `seat` astride on it; a double saddle (`tack` `double`) is the riding saddle with a pillion pad behind its cantle, whose `pillion` seat a passenger rides double on.
 *
 * The default horse draws from the warmblood height band. Its girth follows the cohort's mean proportion and its mass follows the girth-squared-times-length law anchored on that cohort's mean (`mass`). An explicit Icelandic horse uses its own sourced profile and enables the two alternate gaits. The seat and reins are selected from their read sizes.
 *
 * @param params The tack, the seat and reins by their read sizes, and any free dimension the author fixes.
 * @param seed The seed that draws every free dimension inside its band and the seat and the reins among their read sizes; absent, each dimension takes the middle of its band and each size the first listed.
 * @returns The horse.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, a tack that is not one of `TACKS`, or a seat or reins not among `SEATS` and `REINS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the horse stands, that its parts are the shared quadruped's bones, how it is posed, where the body ends and where each tack's contacts are.
 * @evidence contracts/development/implementation.md#principled-implementation The shared equid builder (`equid`) on the horse's profile, laying the shared body (`QuadrupedBody.lay`) from the horse's proportions: segment lengths as fractions of withers height from Kubo et al. 1992 and Matsuura et al. 2008, and segment mass shares from Kubo et al. 1992, Table 5, stated per part so the mass properties follow the measured distribution; the tack is placed on the rig's landmarks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `equid` on `PROFILE`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body's simplifications are `QuadrupedBody.lay`'s and the tack's estimates `HorseSaddle`'s, `HorseHarness`'s, `HorsePack`'s, `HorseSideSaddle`'s and `HorseSurcingle`'s, stated there; `HorseTack` lays the selected tack.
 * @evidence contracts/development/implementation.md#efficient-algorithms Twenty-one bones, the withers and a few tens of tack parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `equid`, which the pony shares; each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHorse(
  params: createHorse.IParams = {},
  seed?: number | string,
): Archetype<createHorse.Affordance, createHorse.Dimension> {
  const draw: ArchetypeDrawSession<createHorse.Dimension> =
    new ArchetypeDrawSession(
      createHorse.PROFILE.archetype,
      createHorse.UNITS,
      seed,
      params,
    );
  const breed: createHorse.IParams["breed"] =
    params.breed === undefined
      ? undefined
      : draw.model("breed", params.breed, { warmblood: {}, icelandic: {} })
          .name;
  const profile: createHorse.IProfile =
    breed === "icelandic"
      ? IcelandicHorseProfile.shape(createHorse.PROFILE)
      : createHorse.PROFILE;
  return createHorse.equid(profile, params, draw);
}

/**
 * Companion types, proportions and bands of {@link createHorse}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each bone, affordance, dimension, proportion and band states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The horse's proportions in the shared quadruped body's forms, segment lengths as fractions of withers height and segment masses as percentages of body mass, the two forms the equine studies report.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The horse's proportions, tack and bands; the bone vocabulary is `QuadrupedBody`'s, shared by every quadruped (#3373, #2805, #3496).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No humanoid bone stands in for a horse's, the defect #2805 removed.
 */
export namespace createHorse {
  /** The riding, harness, combined, pack and untacked configurations, and the alternative mounted supports: a bareback bridle, a side saddle and a vaulting surcingle. */
  export type Tack =
    | "saddle"
    | "harness"
    | "both"
    | "pack"
    | "bare"
    | "bareback"
    | "sidesaddle"
    | "surcingle"
    | "double";

  /** The alternative mounted supports, which a profile may leave unnamed: the model then takes the producer's name. */
  export type Alternative =
    | "bareback"
    | "sidesaddle"
    | "surcingle"
    | "double";

  /** Every equipment configuration admitted by the equid producer. */
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
  ];

  /**
   * The affordance ids:
   *
   * - `seat`: the saddle's seat, facing forward.
   * - `pommel`, `cantle`: the front and the back of the saddle, gripped when mounting.
   * - `leftStirrup`, `rightStirrup`: the stirrups' treads on `+X` and `-X`, each hanging its drop below the saddle.
   * - `leftRein`, `rightRein`: the reins where the hands hold them above the withers, each frame at the middle of the held run, which runs forward to the mouth.
   * - `lead`: the middle of the lead rope's held run beside the head on the horse's left, running up to the halter.
   * - `hitch`: in harness, the middle between the tugs at the driving saddle, where a cart's shafts are held and its `coupling` is drawn from.
   * - `leftLoad`, `rightLoad`: under a pack saddle, the middle of each side's pad, facing out, where a load rests.
   * - `tie`: under a pack saddle, the pads' back on the spine, where a following animal's lead is made fast in a pack string.
   * - `fixedHead`, `leapingHead`: on a side saddle, the upper pommel the right thigh goes over and the lower one over the left thigh (`HorseSideSaddle`).
   * - `leftHandle`, `rightHandle`, `pad`: on a vaulting surcingle, its two handles and the back pad's top (`HorseSurcingle`).
   * - `mane`: under a riding saddle, a handful of mane on the crest a rider grips (`HorseMane`).
   * - `pillion`: under a riding saddle with a pillion pad (`tack` `double`), the passenger's seat astride on the loins behind the cantle (`HorseSaddle.pillion`).
   *
   * A tack lacks the ids of the others; the `lead` is the riding saddle's and the pack saddle's.
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
    | "pillion";

  /**
   * The dimensions, metres unless stated:
   *
   * - `withersHeight`: the withers above the ground, which scales every bone.
   * - `mass`: body mass, kilograms: the read mass of a model weighed whole, else `mass` of the height and the girth.
   * - `girth`: the heart girth's circumference, which sizes the barrel the rider's legs lie round: the profile's, following the height (`IProfile.girth`).
   * - `seatSize`: the saddle's seat from the pommel's nail to the cantle, one of `SEATS`.
   * - `stirrupDrop`: a stirrup's tread below the saddle's seat.
   * - `stirrupWidth`: the tread's width.
   * - `reinWidth`: a rein's width, one of `REINS`.
   * - `tempo`: how far this horse's stride time lies from the mean, in standard deviations.
   * - `breechingDrop`: in harness, the breeching's seat below the point of buttock.
   * - `croupClearance`: under a pack saddle, the croup piece's end above the tail's root, a packer's hand's breadth (`HorsePack.BANDS`).
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
  export const UNITS: Readonly<Record<Dimension, ArchetypeDrawSession.Unit>> = {
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

  /** The dimensions drawn from a band: the others follow from these (`girth`, `mass`) or are a read model's (`seatSize`, `reinWidth`). */
  export type Free = Exclude<
    Dimension,
    "girth" | "mass" | "seatSize" | "reinWidth"
  >;

  /** The parameters: the tack, the saddle's seat and the reins by their read sizes, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Free, number>> {
    /** Explicit horse cohort. Icelandic admits tölt and flying pace. The ordinary warmblood profile is used when absent. */
    breed?: "warmblood" | "icelandic";

    /** The saddle's seat size; drawn from the seed when absent. */
    seat?: Seat;

    /** The reins' width; drawn from the seed when absent. */
    rein?: Rein;

    /** What the horse wears; `saddle` when absent. */
    tack?: Tack;

    /** The model's id, unique in a scene; `horse` when absent. */
    id?: string;
  }

  /**
   * Bone lengths as fractions of the height at the withers, from the top of each limb down: Kubo et al. 1992, Jpn J Equine Sci 3:149, Table 4 (antebrachium 0.382 m, metacarpus 0.280 m, fore digit 0.185 m, crus 0.384 m, metatarsus 0.368 m, hind digit 0.183 m, shoulder to hip 1.317 m, on thoroughbreds of about 1.62 m; https://www.jstage.jst.go.jp/article/jes1990/3/2/3_2_149/_pdf) and Matsuura et al. 2008, J Equine Sci 19:9, Table 2 (humerus 0.300 m and femur 0.350 m at 1.584 m; https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4019204/fullTextXML).
   */
  export const LENGTHS: Readonly<{
    fore: readonly [number, number, number, number];
    hind: readonly [number, number, number, number];
    trunk: number;
  }> = {
    fore: [0.189, 0.236, 0.173, 0.114],
    hind: [0.221, 0.237, 0.227, 0.113],
    trunk: 0.813,
  };

  /**
   * Each bone's standing direction, degrees from straight down toward the front, from the top of each limb down. The cannons stand upright and the pasterns slope forward so the fetlock stands as high as Kubo's digit length allows; the humerus, the femur and the tibia take the slopes that put the shoulder joint at 0.635 and the hip joint at 0.717 of the withers height. These are a consistent standing pose built from the lengths, not measured angles.
   */
  export const STANCE: Readonly<{
    fore: readonly [number, number, number, number];
    hind: readonly [number, number, number, number];
  }> = {
    fore: [-46.5, 0, 0, 32.6],
    hind: [25, -35, 0, 32.6],
  };

  /** The back, where the saddle sits, as a fraction of the height at the withers: an estimate, no source read gives it. The withers themselves are a ball on the trunk whose top stands at the withers height. */
  export const BACK: number = 0.95;

  /**
   * Mass shares, percent of body mass (Kubo et al. 1992, Table 5): the torso 59.5 with the tail's 0.1 apart, the neck 7.0, the head 4.4; down a fore limb the scapula and brachium 4.6, the antebrachium 0.9, the metacarpus 0.3 and the digit 0.3; down a hind limb the thigh 6.9, the crus 1.0, the metatarsus 0.4 and the digit 0.3.
   */
  export const MASS: Readonly<{
    trunk: number;
    neck: number;
    head: number;
    tail: number;
    fore: readonly [number, number, number, number];
    hind: readonly [number, number, number, number];
  }> = {
    trunk: 59.5,
    neck: 7,
    head: 4.4,
    tail: 0.1,
    fore: [4.6, 0.9, 0.3, 0.3],
    hind: [6.9, 1, 0.4, 0.3],
  };

  /** The saddle's middle behind the shoulder joints, metres: an estimate, no source read gives it. A harness's tugs hang on the saddle pad there, so a cart's shafts are held there too. */
  export const SADDLE: number = 0.45;

  /**
   * The point of buttock behind the point of shoulder, as a fraction of the height at the withers: Jensen et al. 2019, Acta Vet Scand 61, Methods and Table 2, L1, the horizontal length "from the tuber ischium (point of the buttocks) to greater tubercle (point of the shoulder)", 185 cm on warmbloods of 172 cm mean height at the withers (https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML). The point of shoulder is taken at the shoulder joint.
   */
  export const BUTTOCK: number = 185 / 172;

  /**
   * The horse's body, the shared quadruped body's proportions: `LENGTHS`, `STANCE`, `BACK`, `BUTTOCK` and `MASS`, each with its source, and the shapes no source read gives, each an estimate the model is drawn by: the withers a ball of 0.05 of the withers height whose top stands at the withers (massless, a share of 0: the trunk's measured share holds it), the neck's root 0.06 below the back and its bar's radius 0.08, the poll 0.27 above the back and 0.27 ahead of the shoulder joints, the nose 0.31 below and 0.18 ahead of the poll, the head bar's radius 0.06 and the mouth's corners 0.03 above and behind the nose, the tail's bar 0.02 in radius reaching 0.4 down and 0.1 back from its root, its root 0.65 of the barrel's radius up and back from the hindquarters' rounded end's centre, the limb bones' radii 0.055 of the withers height for the humerus and the femur, 0.035 for the radius and the tibia, and 0.022 for the cannon and the pastern alike, and each limb 0.08 m inside the barrel's side. The feet are hooves, shod.
   */
  export const BODY: QuadrupedBody.IBody = {
    lengths: LENGTHS,
    stance: STANCE,
    back: BACK,
    buttock: BUTTOCK,
    mass: { ...MASS, withers: 0 },
    withers: 0.05,
    neck: { root: 0.06, radius: 0.08 },
    head: {
      poll: { rise: 0.27, ahead: 0.27 },
      nose: { drop: 0.31, ahead: 0.18 },
      radius: 0.06,
      mouth: 0.03,
      // Krebs et al. 2021's measured ear length with a transferred breadth (`EquidEarProfiles.horse`), an authored coarse jaw inside the head (half its radius, hinged 0.15 of the head's length below the poll) an authored coarse upper lip (0.4 of its radius from 0.75 of its length to the nose) and authored coarse nostrils (0.3 of its radius, set 0.4 back on the nose cap).
      ears: EquidEarProfiles.horse(),
      jaw: { radius: 0.5, hinge: 0.15 },
      lip: { radius: 0.4, root: 0.75 },
      nostrils: { radius: 0.3, back: 0.4 },
    },
    tail: { radius: 0.02, drop: 0.4, back: 0.1, dock: 0.65 },
    bones: [0.055, 0.035, 0.022, 0.022],
    inset: 0.08,
    colors: { coat: "#8a5a3a", tail: "#3a2a1e" },
    foot: "hoof",
  };

  /**
   * The horse's joints and landmarks at rest, in the model's space: the shared quadruped's (`QuadrupedBody.IRig`) and the two places a harness is laid by.
   *
   */
  export interface IRig extends QuadrupedBody.IRig {
    /** The point of draft on the `+X` side: where the breast collar meets the barrel's side at the point of shoulder's height, just behind the elbow, as the IVC Carriage measuring chart takes the breast collar from the centre of the chest to just behind the elbow; the `-X` side's is its mirror. */
    draft: IAutoMovieVector3;

    /** The middle between the tugs, on the trunk's axis under the saddle's middle: a harness's `hitch`, where a cart's shafts are held. */
    hitch: IAutoMovieVector3;
  }

  /**
   * The horse's joints and landmarks at rest.
   *
   * @param dimensions The horse's dimensions, as `Archetype.dimensions` gives them.
   * @param body The body's proportions; the horse's `BODY` when absent, another equid's for that equid.
   * @returns The rest rig.
   *
   */
  export function rig(
    dimensions: Readonly<Partial<Record<Dimension, number>>>,
    body: QuadrupedBody.IBody = BODY,
  ): IRig {
    const rest: QuadrupedBody.IRig = QuadrupedBody.rig(body, dimensions);
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
   * An equid of the horse's build and tack, the producer behind `createHorse`, `createPony`, `createDonkey` and `createMule`: the shared quadruped body from the profile's proportions, under a riding saddle with stirrups, reins and a lead rope, in a driving harness, or under a pack saddle, as `createHorse` describes them; a saddle's read weight is added on top of the equid's drawn mass, and every tack part whose weight no maker states is massless.
   *
   * @param profile The equid's name, bands and body.
   * @param params The tack, the seat and reins by their read sizes, and any free dimension the author fixes.
   * @param draw The equid's draw session, opened with its name, the seed and the dimensions the author fixed; a pony's has already picked its breed.
   * @returns The equid.
   * @throws {ArchetypeRefusal} For a fixed dimension outside its band, a tack that is not one of `TACKS`, or a seat or reins not among `SEATS` and `REINS`.
   *
   */
  export function equid(
    profile: IProfile,
    params: Omit<IParams, "breed">,
    draw: ArchetypeDrawSession<Dimension>,
  ): Archetype<Affordance, Dimension> {
    const tack: createHorse.Tack = ArchetypeDraw.choice(
      profile.archetype,
      "tack",
      params.tack ?? "saddle",
      createHorse.TACKS,
    );
    // A pack saddle draws its own dimension beside the equid's.
    const bands: Readonly<Partial<Record<createHorse.Free, IArchetypeBand>>> =
      tack === "pack"
        ? { ...profile.bands, ...HorsePack.BANDS }
        : profile.bands;
    const free: Record<createHorse.Free, number> = {
      ...draw.dimensions(bands),
      ...profile.figures,
    } as Record<createHorse.Free, number>;
    const girth: number = draw.derive(
      "girth",
      profile.girth(free.withersHeight),
    );
    const d: Record<createHorse.Dimension, number> = {
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
    const builder: ArchetypeBuilder<
      createHorse.Affordance,
      createHorse.Dimension
    > = new ArchetypeBuilder({
      id: params.id,
      name: profile.names[tack] ?? profile.archetype,
      draw,
      material: "skin",
    });
    const h: number = d.withersHeight;
    const rig: createHorse.IRig = createHorse.rig(d, profile.body);
    QuadrupedBody.lay(profile.body, builder, h, rig);

    // The tack's read weight is its own, beside the equid's (`HorseTack`).
    return builder.build(d.mass + HorseTack(tack, builder, d, rig), {
      rests: profile.body.foot,
    });
  }

  /**
   * An equid of the horse's build: what `equid` builds one from.
   *
   */
  export interface IProfile {
    /** The producer's name, which refusals carry and the ride finds the species by. */
    archetype: string;

    /** The model's name under each tack. */
    names: Readonly<
      Record<Exclude<Tack, "bare" | Alternative>, string> &
        Partial<Record<"bare" | Alternative, string>>
    >;

    /** The band of each free dimension the read figures do not give. */
    bands: Readonly<Partial<Record<Free, IArchetypeBand>>>;

    /** A read model's figures, such as a pony breed's height at the withers and girth, laid over the drawn dimensions; absent for the horse, whose height is drawn. */
    figures?: Readonly<Partial<Record<Dimension, number>>>;

    /** The heart girth at a height at the withers, metres. */
    girth: (withers: number) => number;

    /** The read mass of a model weighed whole, kilograms; absent, the mass follows the height and the girth by `mass`. */
    mass?: number;

    /** The body's proportions. */
    body: QuadrupedBody.IBody;
  }

  /**
   * The measured warmbloods every equid's size is anchored on, means: withers 172 cm, heart girth 204 cm and body weight 640 kg, weighed on a scale (Jensen et al. 2019, Acta Vet Scand 61, Table 2, 38 adult warmbloods, https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML). The paper reports no relation between the measures, so the relation is `mass`'s law.
   */
  export const JENSEN: Readonly<{
    withers: number;
    girth: number;
    mass: number;
  }> = {
    withers: 1.72,
    girth: 2.04,
    mass: 640,
  };

  /**
   * An equid's mass from its height at the withers and its heart girth, where no mass was read with its size: the warmbloods' mean mass scaled by the girth's ratio squared times the height's.
   *
   * The girth-based equine weight formulas take mass as proportional to the heart girth squared times the body's length (Carroll and Huntington 1988, Equine Vet J 20:41), the volume of a barrel; the length is taken as proportional to the height at the withers, as isometric similarity scales every length together. Anchored on `JENSEN`'s means, a horse whose girth is in the warmbloods' proportion to its height has the mass the cube of its height gives. A model weighed whole carries its own read mass instead (`IProfile.mass`), a read value beating this derivation.
   *
   * @param withers The height at the withers, metres.
   * @param girth The heart girth, metres.
   * @returns The mass, kilograms.
   *
   */
  export function mass(withers: number, girth: number): number {
    return (
      JENSEN.mass * (girth / JENSEN.girth) ** 2 * (withers / JENSEN.withers)
    );
  }

  /** The seat sizes, inches: Wintec's 16, 16.5, 17, 17.5 and 18 in seats, measured from the saddle nail to the middle of the cantle (https://wintec-saddles.com.au/pages/measuring-your-seat-size). */
  export type Seat = "16in" | "16.5in" | "17in" | "17.5in" | "18in";

  /** Each seat size's seat, metres. */
  export const SEATS: Readonly<
    Record<Seat, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "16in": { seatSize: 16 * ArchetypeUnits.INCH },
    "16.5in": { seatSize: 16.5 * ArchetypeUnits.INCH },
    "17in": { seatSize: 17 * ArchetypeUnits.INCH },
    "17.5in": { seatSize: 17.5 * ArchetypeUnits.INCH },
    "18in": { seatSize: 18 * ArchetypeUnits.INCH },
  };

  /** The rein widths: Dover Saddlery's snaffle reins, 5/8 and 3/4 in wide (https://www.doversaddlery.com/pages/reins-for-english-riding-disciplines). */
  export type Rein = "5/8in" | "3/4in";

  /** Each rein's width, metres. */
  export const REINS: Readonly<
    Record<Rein, Readonly<Partial<Record<Dimension, number>>>>
  > = {
    "5/8in": { reinWidth: (5 / 8) * ArchetypeUnits.INCH },
    "3/4in": { reinWidth: (3 / 4) * ArchetypeUnits.INCH },
  };

  /** The band of each free dimension. */
  export const BANDS: typeof HORSE_BANDS = HORSE_BANDS;

  /** The horse's profile: its girth in the warmbloods' proportion to its height, so its mass is their mean mass times the cube of its height's ratio. */
  export const PROFILE: IProfile = {
    archetype: "horse",
    names: {
      saddle: "saddle horse",
      harness: "driving horse",
      both: "postilion horse",
      pack: "pack horse",
      bare: "untacked horse",
      bareback: "bareback horse",
      sidesaddle: "side-saddle horse",
      surcingle: "vaulting horse",
    },
    bands: BANDS,
    girth: (withers: number): number =>
      (withers * JENSEN.girth) / JENSEN.withers,
    body: BODY,
  };
}
