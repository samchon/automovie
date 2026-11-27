import { AutoMovieArchetypePony } from "../AutoMovieArchetypePony";
import { type AutoMovieArchetype, AutoMovieArchetypeDrawSession } from "../../core";
import { AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import "../equine/EquineSegments";
import "../equine/HORSE_BANDS";
import "../horse/createHorse";

/*
 * A pony of a measured breed, with its tack: the horse's build
 * (`AutoMovieArchetypeEquine.equid`) at that breed's size and proportions,
 * under a riding saddle, in a driving harness or under a pack saddle, with the
 * horse's contacts.
 *
 * The breed is given or drawn whole from the seed
 * (`AutoMovieArchetypeDrawSession.model`, its figures `MEASURES`): a Shetland,
 * a Welsh Mountain Pony, a Welsh Pony, a Dartmoor or a Connemara, each as
 * Brooks et al. 2010's measured animals of that breed average
 * (`EquineSegments.BREEDS`). Its height at the withers and its heart girth are
 * its breed's, its mass follows them by the girth-squared-times-length law
 * anchored on weighed warmbloods (`AutoMovieArchetypeEquine.mass`), and its
 * bones are the horse's fractions of the height, each measured one scaled by
 * its breed's surface measure against the Thoroughbred's
 * (`EquineSegments.lengths`), so a pony is one breed's body, never a blend of
 * two. Its mass is shared among its bones as the horse's is: Nauwelaerts et al.
 * 2011 found that an equid's mass distribution does not change with size below
 * 600 kg, so Kubo's horse shares hold for a pony. It rides as the horse does,
 * its timing the horse's measured table scaled to its height by dynamic
 * similarity (`AutoMovieArchetypeQuadrupedGait.scale`).
 * Parameter params: The breed, the tack and any dimension the author fixes.
 * Parameter seed: The seed that draws the breed and every dimension left free
 * inside its band; absent, the Shetland, and each dimension the middle of its
 * band.
 * Returns: The pony.
 * For a breed not in `MEASURES`, a fixed
 * dimension outside its band (the height and the girth are the breed's own,
 * so fixing either is refused), or a tack that is not one of
 * `AutoMovieArchetypeEquine.TACKS`.
 */
export function createPony(
  params: AutoMovieArchetypePony.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension>(
      AutoMovieArchetypePony.ARCHETYPE,
      AutoMovieArchetypeEquine.UNITS,
      seed,
      params,
    );
  const breed: AutoMovieArchetypeDrawSession.IModel<
    AutoMovieArchetypePony.Breed,
    AutoMovieArchetypeEquine.Dimension
  > = draw.model<AutoMovieArchetypePony.Breed>("breed", params.breed, AutoMovieArchetypePony.MEASURES);
  return AutoMovieArchetypeEquine.equid(
    AutoMovieArchetypePony.profile(breed.name!, breed.figures),
    params,
    draw,
  );
}
