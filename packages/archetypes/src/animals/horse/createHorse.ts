import { AutoMovieArchetypeHorse } from "../AutoMovieArchetypeHorse";
import { AutoMovieArchetype, AutoMovieArchetypeDrawSession } from "../../core/index";
import { AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import "../AutoMovieArchetypeEquineEarProfiles";
import { AutoMovieArchetypeEquineGaitedProfile } from "../AutoMovieArchetypeEquineGaitedProfile";
import "../AutoMovieArchetypeQuadrupedBody";
import { EquineIcelandicProfile } from "../equine/EquineIcelandicProfile";
import "../equine/HORSE_BANDS";


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
export function createHorse(
  params: AutoMovieArchetypeHorse.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension> =
    new AutoMovieArchetypeDrawSession(
      AutoMovieArchetypeHorse.PROFILE.archetype,
      AutoMovieArchetypeEquine.UNITS,
      seed,
      params,
    );
  const breed: AutoMovieArchetypeEquine.Breed | undefined =
    params.breed === undefined
      ? undefined
      : draw.model("breed", params.breed, {
          warmblood: {},
          icelandic: {},
          walking: {},
          racking: {},
          foxTrotter: {},
          peruvian: {},
          pasoFino: {},
        }).name;
  const profile: AutoMovieArchetypeEquine.IProfile =
    breed === "icelandic"
      ? EquineIcelandicProfile.shape(AutoMovieArchetypeHorse.PROFILE)
      : breed === undefined || breed === "warmblood"
        ? AutoMovieArchetypeHorse.PROFILE
        : AutoMovieArchetypeEquineGaitedProfile.shape(AutoMovieArchetypeHorse.PROFILE);
  return AutoMovieArchetypeEquine.equid(profile, params, draw);
}
