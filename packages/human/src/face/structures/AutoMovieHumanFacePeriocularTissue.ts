/**
 * Coarse attached tissue identities; none claims measured histology or mechanics.
 *
 * @evidence contracts/common.md#principled-implementation Separate upper/lower tarsal, orbicularis, septal and conjunctival identities label the existing coarse attached tissue stack, whose descriptors qualify measured versus authored quantities independently.
 * @evidence contracts/common.md#clear-and-simple-design One closed tissue vocabulary connects descriptor and generated-part owners without exposing a personal shell or arbitrary tissue name.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Naming a tissue does not establish histology, mechanics, an individual thickness or clinical validity of upper-to-lower authored extensions.
 * @evidence contracts/common.md#meaningful-documentation The comment limits these identities to coarse attachment and the literals distinguish both lid sides and tissue owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This union performs no tissue offset, mesh construction or contact algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Literal tissue identity owns no stack-evaluation or generated-mesh cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The vocabulary acquires no tissue shells or source buffers; construction owns actual resources.
 *
 * @author Samchon
 */
export type AutoMovieHumanFacePeriocularTissue =
  | "upperTarsalBody"
  | "lowerTarsalBody"
  | "upperOrbicularis"
  | "lowerOrbicularis"
  | "upperSeptalSupport"
  | "lowerSeptalSupport"
  | "upperConjunctiva"
  | "lowerConjunctiva";
