import { IAutoMovieSpace, IAutoMovieVector3, IAutoMovieSurface } from "@automovie/interface";
import { prepareSpace } from "./prepareSpace";
import { surfaceAt } from "./surfaceAt";
import { surfaceHeightAt } from "./surfaceHeightAt";
import { IAutoMoviePreparedSpace } from "./IAutoMoviePreparedSpace";
/**
 * Project supplied footprint points onto the topmost authored support surface.
 *
 * @evidence contracts/common.md#principled-implementation Each point's XZ selects surfaceAt independently and replaces input Y with that surface's height; no-go surfaces support objects too, while points over nothing contribute no contact.
 * @evidence contracts/common.md#clear-and-simple-design The point-contact producer composes canonical space selection and height owners; its repository consumers are owning tests, with no product toppling host wired here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This does not prove contact over an entire footprint, infer unsupported points or apply collision/toppling response; validated surface records are a caller premise.
 * @evidence contracts/common.md#meaningful-documentation Documents ignored input Y, omitted unsupported points, non-walkable support and fresh contact ownership rather than claiming delivered collision adoption.
 * @evidence contracts/performance.md#efficient-algorithms Preparation costs O(E) total edges, followed by F full surface membership scans and a second selected-height evaluation per supported point; result size is at most F.
 * @evidence contracts/performance.md#reuse-equivalent-work One preparation serves all supplied points in the call; repeated calls rebuild and retain no source-revision cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the fresh point array; temporary preparations and source references leave scope, without simulation or host resources.
 * @author Samchon
 */
export const supportContactsFor: (space: IAutoMovieSpace, footprint: readonly IAutoMovieVector3[]) => IAutoMovieVector3[] = (
  space: IAutoMovieSpace,
  footprint: readonly IAutoMovieVector3[],
): IAutoMovieVector3[] => {
  const contacts: IAutoMovieVector3[] = [];
  const prepared: IAutoMoviePreparedSpace = prepareSpace(space);
  for (const point of footprint) {
    const surface: IAutoMovieSurface | null = surfaceAt(space, point.x, point.z, prepared);
    if (surface === null) continue;
    contacts.push({
      x: point.x,
      y: surfaceHeightAt(surface, point.x, point.z),
      z: point.z,
    });
  }
  return contacts;
};
