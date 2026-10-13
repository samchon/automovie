import type { IAutoMovieHumanFaceFacialHairProfile } from "./IAutoMovieHumanFaceFacialHairProfile";
import type { IAutoMovieHumanFaceFacialHairSite } from "./IAutoMovieHumanFaceFacialHairSite";

/**
 * Independent authored visible terminal populations on seven named sites.
 * Omission, null or an empty record adds no visible facial shafts; it does not
 * remove vellus skin appearance or claim absence of biological follicles.
 * Source native growth domains own all roots and attachment identities. This
 * input contains no personal source vertices, guides, meshes or textures.
 *
 * @evidence contracts/common.md#principled-implementation Sparse named terminal populations resolve through the existing native growth/root pipeline, requiring exactly one registered site domain for a nonzero visible layer.
 * @evidence contracts/common.md#clear-and-simple-design Closed anatomical site keys and shared numerical Profile values separate region identity from count/dimension/finish authoring.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted/shaved visible layers imply no biological absence or removed vellus appearance, and no personal root coordinates, mesh, texture or donor-density conversion enters this record.
 * @evidence contracts/common.md#meaningful-documentation The comment states sparse/null/empty visibility and native-root ownership; the member identifies independent named site selection.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This type performs no domain matching, root distribution or shaft generation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Shared profile shape defines no emitted-population cache or repeated root evaluation.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The personal document owns its finite keyed profiles and the declaration opens no root/mesh resource.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceFacialHair {
  /** Independently selected anatomical sites; omission leaves a site without an emitted terminal layer. */
  sites: Partial<
    Record<IAutoMovieHumanFaceFacialHairSite, IAutoMovieHumanFaceFacialHairProfile>
  >;
}
