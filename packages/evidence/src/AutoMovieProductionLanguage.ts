import { AUTO_MOVIE_PRODUCTION_LANGUAGES } from "./AUTO_MOVIE_PRODUCTION_LANGUAGES";


/**
 * One exact supported language identity selected by a generated production, independent of whether its required contract pack is present.
 *
 * @evidence contracts/common.md#principled-implementation The indexed readonly language tuple derives a closed union of Chinese, English, Japanese and Korean protocol identities; actual authored text remains project-owned.
 * @evidence contracts/common.md#clear-and-simple-design The language type travels with production declarations while the registry and predicate own runtime admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No arbitrary string is promoted to a supported language and no bundled contract availability is implied by the union.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies exact language identity selection and distinguishes that identity from supplying its contract pack.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This selected-language type erases without executing a grammar or membership scan.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A selected-language union stores no cross-request validation result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The language type retains no translated prose, parser or language-pack resource.
 *
 * @author Samchon
 */
export type AutoMovieProductionLanguage =
  (typeof AUTO_MOVIE_PRODUCTION_LANGUAGES)[number];
