/**
 * A SHA-256 value computed by AutoMovie from authoritative project bytes.
 *
 * @evidence requirements/production-design/scope-and-source-of-truth.md#production-design-story-boundary Exposes `AutoMovieContentDigest` as the portable data boundary for the production design story boundary requirement.
 * @evidence specifications/narrative-and-intent/design-authority-and-visual-language.md#narrative-intent-story-design-ownership Types `AutoMovieContentDigest` for the narrative intent story design ownership system contract.
 */
export type AutoMovieContentDigest = `sha256:${string}`;
