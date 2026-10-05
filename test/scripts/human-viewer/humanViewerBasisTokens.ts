/**
 * The basis token prefixes a viewer document names its basis file with. Each
 * token is `<prefix>@<digests>`, the leading twelve hex digits of the named
 * files' SHA-256, so a changed file names a different resident runtime and
 * the server refuses bytes that no longer match.
 *
 * - `published`: the domain's published basis, `published@<d12>`; for a
 *   person on the two separately published bases, `published@<face12>.<body12>`.
 * - `published-generation`: the published one-skin generation's head and
 *   body view files, `published-generation@<head12>.<body12>`.
 * - `published-generation-body`: a body document on that generation's body
 *   view file, `published-generation-body@<body12>`.
 *
 * Any other token is a candidate dropped beside a hand-written document.
 *
 * @author Samchon
 */
export const humanViewerBasisTokens = {
  published: "published",
  publishedGeneration: "published-generation",
  publishedGenerationBody: "published-generation-body",
} as const;
