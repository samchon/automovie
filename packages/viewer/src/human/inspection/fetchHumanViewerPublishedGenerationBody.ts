import type {
  IAutoMovieHumanBodyBasis,
  IAutoMovieHumanPersonBodyView,
} from "@automovie/human";
import { readConnectedFaceAsset } from "@automovie/viewer/human/common/assets/readConnectedFaceAsset";

import { humanViewerBasisDigests } from "./humanViewerBasisDigests.js";
import { humanViewerBasisTokens } from "./humanViewerBasisTokens.js";

/**
 * Fetch the body basis of the published one-skin generation's body view named by a `published-generation-body@<body12>` token, with its twelve-hex digest prefix. The server checks the current prefix; a collision can accept changed bytes. Browser callers use relative routes; a Node observation caller supplies the same resident viewer's absolute origin.
 *
 * @evidence contracts/common.md#principled-implementation The published body-view digest prefix selects the existing prefix-checked person-body route and the decoded view's original body basis is returned to the numerical caller.
 * @evidence contracts/common.md#clear-and-simple-design One token-suffix parser and asset read expose the existing body basis rather than reconstructing or flattening it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The route carries the requested digest prefix rather than full-content proof; the adapter neither invents a basis nor substitutes another view when the selected route refuses.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies the body-only published token and the relative-browser versus absolute-resident-origin transport boundary.
 * @evidence contracts/performance.md#efficient-algorithms One view fetch/decode costs linear work in its bytes, and selecting its body member adds constant-time reference access.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned basis is the view's existing typed body object without copying geometry; cross-request memoization remains with numerical-source selection.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller retains the returned body basis while unrelated wrapper fields can become unreachable; this adapter owns no resident realm or separate view cache.
 *
 * @author Samchon
 */
export async function fetchHumanViewerPublishedGenerationBody(
  token: string,
  origin: string = "",
): Promise<IAutoMovieHumanBodyBasis> {
  const [body]: string[] = humanViewerBasisDigests(
    token,
    humanViewerBasisTokens.publishedGenerationBody,
    1,
  );
  const view: IAutoMovieHumanPersonBodyView =
    await readConnectedFaceAsset<IAutoMovieHumanPersonBodyView>({
      read: (): Promise<Response> =>
        fetch(origin + "/basis/person/body?digest=" + body),
    });
  return view.body;
}
