import { type AutoMovieArchetype } from "../core/index";
import { AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import { createHorse as createHorseImplementation } from "./internal/createHorse";
import { type QuadrupedProportions } from "./QuadrupedProportions";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeEquineEarProfiles } from "./AutoMovieArchetypeEquineEarProfiles";
import { HORSE_BANDS } from "./HORSE_BANDS";

/** Public operations for Auto Movie Archetype Horse. */
export namespace AutoMovieArchetypeHorse {
  /**
   * A horse with its tack: a coarse body of one bar per bone, under a riding
   * saddle with stirrups, reins and a lead rope, in a driving harness, under a
   * pack saddle with a lead rope, or without tack.
   *
   * The horse stands square on level ground, facing `+Z`, with the middle of its
   * trunk over the origin. Its body is the shared quadruped's
   * (`AutoMovieArchetypeQuadrupedBody`) drawn by the horse's proportions, `BODY`:
   * its parts are its bones, named by `AutoMovieArchetypeQuadrupedBody.Bone`, a
   * trunk, the hindquarters behind it, a neck, a head and a tail, and four bones
   * down each limb. Each bone is a bar from joint to joint, so the horse is posed
   * by moving joints; `AutoMovieArchetypeEquine.rig` gives the joints at rest and
   * `AutoMovieArchetypeHorseRide.ride` poses the limbs through a gait. Bone lengths are fixed fractions
   * of the height at the withers and each bone's share of the body's mass is the
   * measured one. The trunk runs Kubo's shoulder to hip; the hindquarters carry
   * the body on from the hip joint to the point of buttock, which Jensen et al.
   * place behind the point of shoulder.
   *
   * Under the saddle (`tack` `saddle`, the default) the rider's contacts ride the
   * trunk: the saddle's `seat`, the two stirrups, the two reins where the hands
   * hold them, and the pommel and cantle a mounting rider grips. `lead` is the
   * lead rope's held run, beside the head on the horse's left. In harness (`tack`
   * `harness`) the horse wears a breast collar, a driving saddle with its tugs,
   * terrets, girth and backstrap, a breeching and a bridle with blinkers, as
   * `EquineHarness` lays them; its one contact is the `hitch` between the tugs,
   * which a cart's `coupling` is held on. The traces and the driving lines run
   * between the horse and the vehicle, so the towing ride lays them
   * (`createCart.lines`). A postilion's horse (`tack` `both`) wears the harness
   * under the riding saddle and offers both's contacts. Under a pack saddle
   * (`tack` `pack`) the horse wears FM 25-7's Phillips cargo saddle sized to it,
   * with its cinch, breast collar, croup piece and breeching, as `EquinePack`
   * lays them; its contacts are the `lead` and a load against each side,
   * `leftLoad` and `rightLoad`. The alternative mounted supports keep the horse's
   * body: a bareback bridle (`tack` `bareback`) offers only the two reins, the
   * `lead` and a `seat` on the back itself; a side saddle (`tack` `sidesaddle`,
   * `EquineSideSaddle`) offers a `seat` entered sideways from the near side, the
   * `fixedHead` and `leapingHead`, the one `leftStirrup`, the reins and the
   * `lead`; a vaulting surcingle (`tack` `surcingle`, `EquineSurcingle`) offers
   * the `leftHandle` and `rightHandle`, the back `pad` and the basic `seat`
   * astride on it; a double saddle (`tack` `double`) is the riding saddle with a
   * pillion pad behind its cantle, whose `pillion` seat a passenger rides double
   * on; a trick saddle (`tack` `trick`) adds a tall horn, two handholds, two side
   * foot straps and a hippodrome strap to the riding saddle.
   *
   * The default horse draws from the warmblood height band. Its girth follows the
   * cohort's mean proportion and its mass follows the girth-squared-times-length
   * law anchored on that cohort's mean (`AutoMovieArchetypeEquine.mass`). An
   * explicit Icelandic horse uses its own sourced profile and enables the two
   * alternate gaits. The seat and reins are selected from their read sizes.
   *
   * @param params The tack, the seat and reins by their read sizes, and any free
   *   dimension the author fixes.
   * @param seed The seed that draws every free dimension inside its band and the
   *   seat and the reins among their read sizes; absent, each dimension takes the
   *   middle of its band and each size the first listed.
   * @returns The horse.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band, a
   *   tack that is not one of `AutoMovieArchetypeEquine.TACKS`, or a seat or
   *   reins not among `AutoMovieArchetypeEquine.SEATS` and
   *   `AutoMovieArchetypeEquine.REINS`.
   */
  export function create(params?: AutoMovieArchetypeHorse.IParams, seed?: number): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
    return createHorseImplementation(params, seed);
  }

  /**
   * The parameters: the equid's (`AutoMovieArchetypeEquine.IParams`) and the
   * horse cohort.
   */
  export interface IParams extends AutoMovieArchetypeEquine.IParams {
    /**
     * Explicit horse cohort. Icelandic admits tölt and flying pace; an ambling
     * breed (`AutoMovieArchetypeEquineGaitedProfile`) admits its own gait. The
     * ordinary warmblood profile is used when absent.
     */
    breed?: AutoMovieArchetypeEquine.Breed;
  }

  /**
   * Bone lengths as fractions of the height at the withers, from the top of
   * each limb down: Kubo et al. 1992, Jpn J Equine Sci 3:149, Table 4
   * (antebrachium 0.382 m, metacarpus 0.280 m, fore digit 0.185 m, crus 0.384
   * m, metatarsus 0.368 m, hind digit 0.183 m, shoulder to hip 1.317 m, on
   * thoroughbreds of about 1.62 m;
   * https://www.jstage.jst.go.jp/article/jes1990/3/2/3_2_149/_pdf) and Matsuura
   * et al. 2008, J Equine Sci 19:9, Table 2 (humerus 0.300 m and femur 0.350 m
   * at 1.584 m;
   * https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4019204/fullTextXML).
   */
  export const LENGTHS: Readonly<QuadrupedProportions.ILengths> = {
    fore: [0.189, 0.236, 0.173, 0.114],
    hind: [0.221, 0.237, 0.227, 0.113],
    trunk: 0.813,
  };

  /**
   * Each bone's standing direction, degrees from straight down toward the
   * front, from the top of each limb down. The cannons stand upright and the
   * pasterns slope forward so the fetlock stands as high as Kubo's digit length
   * allows; the humerus, the femur and the tibia take the slopes that put the
   * shoulder joint at 0.635 and the hip joint at 0.717 of the withers height.
   * These are a consistent standing pose built from the lengths, not measured
   * angles.
   */
  export const STANCE: Readonly<QuadrupedProportions.IStance> = {
    fore: [-46.5, 0, 0, 32.6],
    hind: [25, -35, 0, 32.6],
  };

  /**
   * The back, where the saddle sits, as a fraction of the height at the
   * withers: an estimate, no source read gives it. The withers themselves are a
   * ball on the trunk whose top stands at the withers height.
   */
  export const BACK: number = 0.95;

  /**
   * Mass shares, percent of body mass (Kubo et al. 1992, Table 5): the torso
   * 59.5 with the tail's 0.1 apart, the neck 7.0, the head 4.4; down a fore
   * limb the scapula and brachium 4.6, the antebrachium 0.9, the metacarpus 0.3
   * and the digit 0.3; down a hind limb the thigh 6.9, the crus 1.0, the
   * metatarsus 0.4 and the digit 0.3.
   */
  export const MASS: Readonly<QuadrupedProportions.IMassShares> = {
    trunk: 59.5,
    neck: 7,
    head: 4.4,
    tail: 0.1,
    fore: [4.6, 0.9, 0.3, 0.3],
    hind: [6.9, 1, 0.4, 0.3],
  };

  /**
   * The point of buttock behind the point of shoulder, as a fraction of the
   * height at the withers: Jensen et al. 2019, Acta Vet Scand 61, Methods and
   * Table 2, L1, the horizontal length "from the tuber ischium (point of the
   * buttocks) to greater tubercle (point of the shoulder)", 185 cm on
   * warmbloods of 172 cm mean height at the withers
   * (https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML).
   * The point of shoulder is taken at the shoulder joint.
   */
  export const BUTTOCK: number = 185 / 172;

  /**
   * The horse's body, the shared quadruped body's proportions: `LENGTHS`,
   * `STANCE`, `BACK`, `BUTTOCK` and `MASS`, each with its source, and the
   * shapes no source read gives, each an estimate the model is drawn by: the
   * withers a ball of 0.05 of the withers height whose top stands at the
   * withers (massless, a share of 0: the trunk's measured share holds it), the
   * neck's root 0.06 below the back and its bar's radius 0.08, the poll 0.27
   * above the back and 0.27 ahead of the shoulder joints, the nose 0.31 below
   * and 0.18 ahead of the poll, the head bar's radius 0.06 and the mouth's
   * corners 0.03 above and behind the nose, the tail's bar 0.02 in radius
   * reaching 0.4 down and 0.1 back from its root, its root 0.65 of the barrel's
   * radius up and back from the hindquarters' rounded end's centre, the limb
   * bones' radii 0.055 of the withers height for the humerus and the femur,
   * 0.035 for the radius and the tibia, and 0.022 for the cannon and the
   * pastern alike, and each limb 0.08 m inside the barrel's side. The feet are
   * hooves, shod.
   */
  export const BODY: AutoMovieArchetypeQuadrupedBody.IBody = {
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
      // Krebs et al. 2021's measured ear length with a transferred breadth (`AutoMovieArchetypeEquineEarProfiles.horse`), an authored coarse jaw inside the head (half its radius, hinged 0.15 of the head's length below the poll) an authored coarse upper lip (0.4 of its radius from 0.75 of its length to the nose) and authored coarse nostrils (0.3 of its radius, set 0.4 back on the nose cap).
      ears: AutoMovieArchetypeEquineEarProfiles.horse(),
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

  /** The band of each free dimension. */
  export const BANDS: typeof HORSE_BANDS = HORSE_BANDS;

  /**
   * The horse's profile: its girth in the warmbloods' proportion to its height,
   * so its mass is their mean mass times the cube of its height's ratio.
   */
  export const PROFILE: AutoMovieArchetypeEquine.IProfile = {
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
      (withers * AutoMovieArchetypeEquine.JENSEN.girth) /
      AutoMovieArchetypeEquine.JENSEN.withers,
    body: BODY,
  };}
