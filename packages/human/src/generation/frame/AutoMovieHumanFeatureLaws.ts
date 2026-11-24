import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanFeatureLaws,
} from "@automovie/interface";

import { AutoMovieHumanFeatureTemplate as T } from "./AutoMovieHumanFeatureTemplate";
import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";

/**
 * Place a supplied surface feature at one landmark or between two.
 *
 * The caller supplies signed relief and extents as shares of a named length.
 * The landmark frame supplies the centre and directions.
 */
export namespace AutoMovieHumanFeatureLaws {
  /** The length a law's shares are of. */
  export type Scale = IAutoMovieHumanFeatureLaws.Scale;

  /** One feature's law. */
  export type ILaw = IAutoMovieHumanFeatureLaws.ILaw;

  /**
   * What a law is given to make its template: points and directions in its
   * segment's frame.
   */
  export type IDatums = IAutoMovieHumanFeatureLaws.IDatums;

  /**
   * A law's template for a person.
   *
   * @param law The feature's law.
   * @param datums Its landmarks and directions in its segment's frame.
   * @param scale The person's length the law names, mm.
   * @evidence contracts/development/implementation.md#principled-implementation A feature of one landmark is centred on it, long along the segment's direction made square to the outward direction and short along `outward x along`, so its height stands along the outward direction; a feature of two landmarks is `AutoMovieHumanFeatureTemplate.between` of them. Every size is the law's share times the person's length. Premise: `outward` is not along the long direction.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch on the number of landmarks.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No feature is named in the constructor; a nonpositive length, a missing end, a missing long direction and a missing share are refused.
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the units and where each number of the result comes from.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The span's construction is the template record's own `between`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns one record.
   */
  export function template(
    law: ILaw,
    datums: IDatums,
    scale: number,
  ): T.ITemplate {
    if (!(Number.isFinite(scale) && scale > 0))
      throw new Error(
        "feature law: the length of " +
          law.name +
          " must be finite and positive",
      );
    if (law.landmarks.length === 2) {
      if (datums.to === undefined)
        throw new Error(
          "feature law: " +
            law.name +
            " runs between two landmarks and was given one",
        );
      return T.between(datums.from, datums.to, {
        name: law.name,
        class: law.class,
        segment: law.segment,
        outward: datums.outward,
        half: law.across * scale,
        height: law.height * scale,
      });
    }
    if (datums.along === undefined || law.along === undefined)
      throw new Error(
        "feature law: " +
          law.name +
          " has one landmark and needs a long direction and a share along it",
      );
    const outward: AutoMovieVector3Tuple = F.unit(datums.outward);
    const along: AutoMovieVector3Tuple = F.perpendicular(datums.along, outward);
    return {
      name: law.name,
      class: law.class,
      segment: law.segment,
      centre: [...datums.from],
      along,
      across: F.unit(F.cross(outward, along)),
      extent: [law.along * scale, law.across * scale],
      height: law.height * scale,
    };
  }
}
