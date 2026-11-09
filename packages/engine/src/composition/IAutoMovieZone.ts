import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A named region of a set, so a scene moves a subject "to the corner" or
 * "to the centre" without coordinates: a centre and a radius on the floor,
 * with optional named landmarks inside it. `resolveAutoMovieZone` reads
 * its points.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A named region of a set, so a scene moves a subject "to the corner" or "to the centre" without coordinates: a centre and a radius on the floor, with optional named landmarks inside it) and documents 4 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A named region of a set, so a scene moves a subject "to the corner" or "to the centre" without coordinates: a centre and a radius on the floor, with optional named landmarks inside it: interface of 4 members (`id`, `center`, `radius`, `landmarks`); units and frames named in its text: world, metres. Optional members `landmarks` express documented absence, and the ranges its member docs state are left to runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMovieZone` in packages/engine/src/composition/IAutoMovieZone.ts; its surface is the 4 members listed and the text shows 3 other files naming it, mostly packages/engine (2), movies (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export interface IAutoMovieZone {
  /** Stable zone id. */
  id: string;

  /** Floor centre, world metres. */
  center: IAutoMovieVector3;

  /** Radius a subject may stand within, metres; nonnegative. */
  radius: number;

  /** Named points of the set inside the zone, world metres. */
  landmarks?: Readonly<Record<string, IAutoMovieVector3>>;
}
