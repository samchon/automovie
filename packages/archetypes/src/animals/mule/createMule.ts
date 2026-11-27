import { AutoMovieArchetypeMule } from "../AutoMovieArchetypeMule";
import { type AutoMovieArchetype, AutoMovieArchetypeDrawSession } from "../../core";
import { AutoMovieArchetypeEquine } from "../AutoMovieArchetypeEquine";
import "../AutoMovieArchetypeEquineEarProfiles";
import "../HORSE_BANDS";
import "../horse/createHorse";

/**
 * A mule with its tack: the horse's build (`AutoMovieArchetypeEquine.equid`) at
 * a mule's size, under a riding saddle, in a driving harness or under a pack
 * saddle, with the horse's contacts.
 *
 * The mule is given or drawn whole by sex
 * (`AutoMovieArchetypeDrawSession.model`, its figures `MEASURES`): the mean
 * female or male of 94 weighed working mules (Velásquez Mosquera et al. 2020),
 * its height at the withers, heart girth and weighed mass all that sex's, so a
 * mule is one sex's body, never a blend. Its bones are the horse's fractions of
 * the height, provisional: no study measures a mule's segments. It rides the
 * horse's measured gaits scaled to its height (`createQuadruped.SPECIES`). The
 * added ear plates transfer a separate same-sex Araucan donor's paired
 * ear-length/breadth/height means, as AutoMovieArchetypeEquineEarProfiles
 * documents. Their thickness and diagonal neutral pose are authored rectangular
 * proxies, not anatomy.
 *
 * @param params The sex, the tack and any dimension the author fixes.
 * @param seed The seed that draws the sex and every dimension left free inside
 *   its band; absent, the female, and each dimension the middle of its band.
 * @returns The mule.
 * @throws {AutoMovieArchetypeRefusal} For a sex not in `MEASURES`, a fixed
 *   dimension outside its band (the height is the sex's own, so fixing it is
 *   refused), or a tack that is not one of `AutoMovieArchetypeEquine.TACKS`.
 */
export function createMule(
  params: AutoMovieArchetypeMule.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeEquine.Dimension>(
      AutoMovieArchetypeMule.ARCHETYPE,
      AutoMovieArchetypeEquine.UNITS,
      seed,
      params,
    );
  const sex: AutoMovieArchetypeDrawSession.IModel<
    AutoMovieArchetypeMule.Sex,
    AutoMovieArchetypeEquine.Dimension
  > = draw.model<AutoMovieArchetypeMule.Sex>("sex", params.sex, AutoMovieArchetypeMule.MEASURES);
  return AutoMovieArchetypeEquine.equid(
    AutoMovieArchetypeMule.profile(sex.figures, sex.name!),
    params,
    draw,
  );
}
