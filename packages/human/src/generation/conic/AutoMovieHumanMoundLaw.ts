/**
 * The breast mound's form from its volume: how a change of volume is shared between the base's radii and the projection, under the
 * bounds the person's own measures set on the base.
 *
 * The mound is described by the three radii of its base from the apex's foot (medial, lateral, inferior) and its projection, tied to its
 * volume by `V = (pi / 3) MP^2 (MR + LR + IR - MP)` (Qiao, Zhou and Ling 1997, as given in Kayar et al. 2011, where it agreed with
 * mastectomy specimens at r 0.975). For a hemisphere of radius `R` it gives `(2 / 3) pi R^3`, the hemisphere's volume.
 *
 * A girth says how much mound there is, not where it goes. The published tables say where it goes: mostly into projection, little into
 * the base. On breast CT (219 women; group means by cup, read as a summary of the paper) the volume rises from 324.7 to 467.9, 803.1 and
 * 1,203.7 ml from cup A to D while the breast's diameter at the chest wall goes 11.1, 11.4, 13.0, 13.7 cm: the least-squares slope of
 * `ln diameter` on `ln volume` through those four means is 0.17 (`BASE_EXPONENT`), against the one third of similar solids, and the
 * length from the chest wall grows 1.70 times where a similar solid would grow 1.55. Zheng, Yu and Fan 2010 (322 women, read in full)
 * find the same split in a sizing table: breast width follows the under-bust girth (13.1 to 16.0 across four bands, 14.0 to 14.2 across
 * four cups of one band) and depth follows the cup (4.3 to 5.9 on one band). So a base radius is the prior's times the volume ratio to
 * the power `BASE_EXPONENT`, and the projection is what the formula then asks for the volume.
 *
 * The person's measures bound the base: the lateral radius by the chest's half breadth outside the bust point, the medial radius by the
 * bust point's distance from the median plane less half the gap between the breasts, the inferior radius by the bust height above the
 * under-bust height. A radius that reaches its bound stays there. The bust girth is closed on this law by its owner: the tape over both
 * mounds rises with the volume.
 */
export namespace AutoMovieHumanMoundLaw {
  /** A mound's base radii from the apex's foot on the chest wall, mm. */
  export interface IRadii {
    /** Toward the median plane. */
    medial: number;

    /** Toward the side. */
    lateral: number;

    /** Down to the fold under the breast. */
    inferior: number;
  }

  /** A mound: its base and how far its apex stands off the chest wall. */
  export interface IMound {
    /** The base's radii, mm. */
    radii: IRadii;

    /** The projection, mm. */
    projection: number;
  }

  /**
   * The power of the volume ratio a base radius grows by: the slope of `ln diameter` on `ln volume` through the four cup groups' means
   * of the breast CT study (`(ln 324.7, ln 11.1)`, `(ln 467.9, ln 11.4)`, `(ln 803.1, ln 13.0)`, `(ln 1203.7, ln 13.7)`: 0.1732 /
   * 1.004). Prone breasts, group means, read from a summary of the paper: a provisional prior, to be replaced by a regression on
   * individual women when one is read.
   */
  export const BASE_EXPONENT: number = 0.17;

  /** Halvings of the projection's bracket: sixty take a bracket of a few hundred millimetres under one unit of a double. */
  const HALVINGS: number = 60;

  const sum = (radii: IRadii): number => radii.medial + radii.lateral + radii.inferior;

  /**
   * A mound's volume, mm^3, by Qiao's formula.
   *
   * @param mound The base's radii and the projection, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Qiao, Zhou and Ling 1997 as printed in Kayar et al. 2011 (read in full). Premise: the projection does not exceed two thirds of the radii's sum, past which the formula's volume falls as the projection rises.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonpositive lengths and a projection past the formula's rising range are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the formula's range.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing.
   */
  export function volume(mound: IMound): number {
    const total: number = sum(mound.radii);
    for (const x of [mound.radii.medial, mound.radii.lateral, mound.radii.inferior, mound.projection])
      if (!(Number.isFinite(x) && x > 0)) throw new Error("mound law: every radius and the projection must be finite and positive");
    if (mound.projection > (2 * total) / 3) throw new Error("mound law: a projection past two thirds of the radii's sum is outside the volume formula's range");
    return (Math.PI / 3) * mound.projection ** 2 * (total - mound.projection);
  }

  /**
   * The projection at which a base holds a volume, mm.
   *
   * @param target The volume, mm^3.
   * @param radii The base's radii, mm.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The formula's volume rises with the projection from zero to two thirds of the radii's sum (its derivative is `(pi / 3) MP (2 S - 3 MP)`), so bisection on that interval has one answer.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One bracket and one loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A volume the base cannot hold at any projection in the formula's range is refused with the largest it can.
   * @evidence contracts/development/common.md#meaningful-documentation States units and the refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms `HALVINGS` evaluations.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure solve coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Owns nothing.
   */
  export function projection(target: number, radii: IRadii): number {
    if (!(Number.isFinite(target) && target > 0)) throw new Error("mound law: the volume must be finite and positive");
    const total: number = sum(radii);
    const most: number = volume({ radii, projection: (2 * total) / 3 });
    if (target > most) throw new Error("mound law: a volume of " + target + " mm^3 is more than this base holds, " + most + " mm^3");
    let [low, high]: [number, number] = [0, (2 * total) / 3];
    for (let k: number = 0; k < HALVINGS; ++k) {
      const middle: number = (low + high) / 2;
      if ((Math.PI / 3) * middle ** 2 * (total - middle) < target) low = middle;
      else high = middle;
    }
    return (low + high) / 2;
  }

  /**
   * The mound of a volume: a prior mound's base grown or shrunk by the volume ratio to the power `BASE_EXPONENT`, each base radius
   * held at its bound where it reaches one, and the projection that then holds the volume.
   *
   * @param target The person's mound volume, mm^3.
   * @param prior A mound of the same form at another volume: the shape prior.
   * @param bounds The largest each base radius may be, mm, from the person's measures; absent members are unbounded.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The base's growth is the published split (the module's comment): a radius is the prior's times `(V / V0)^BASE_EXPONENT`; a bound is the measure's own; the projection is the formula's inverse on that base, which keeps the volume exact and puts the rest of a volume's change into projection, as the tables show.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ratio, three bounded radii, one inverse.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No radius is fitted to a person; the exponent is a named constant with its source and its provisional mark; a nonpositive bound is refused.
   * @evidence contracts/development/common.md#meaningful-documentation States units, what the prior is and what an absent bound means.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work and one inverse.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure law coordinates no shared work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function mound(target: number, prior: IMound, bounds: Partial<IRadii> = {}): IMound {
    const ratio: number = (target / volume(prior)) ** BASE_EXPONENT;
    const bounded = (name: keyof IRadii): number => {
      const bound: number | undefined = bounds[name];
      if (bound !== undefined && !(Number.isFinite(bound) && bound > 0)) throw new Error("mound law: the " + name + " bound must be finite and positive");
      return bound === undefined ? prior.radii[name] * ratio : Math.min(bound, prior.radii[name] * ratio);
    };
    const radii: IRadii = { medial: bounded("medial"), lateral: bounded("lateral"), inferior: bounded("inferior") };
    return { radii, projection: projection(target, radii) };
  }
}
