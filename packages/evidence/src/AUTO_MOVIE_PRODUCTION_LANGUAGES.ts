
/**
 * Supported production-authoring language identities. The selected project's contract pack is validated separately and is not supplied by this registry.
 *
 * Four literal language identities form the supported production-language registry; admitting a name does not supply the project-owned contract pack that graph validation separately requires.
 * One language registry supplies both the closed language type and the runtime language predicate.
 * Language names are protocol values rather than translated prose or a production-specific whitelist.
 * The comment identifies supported language selection; contract-pack presence remains a project validation obligation rather than a bundled-data claim.
 * The supported-language registry initializes four constant strings and performs no per-project search.
 * The language predicate and language type share this tuple rather than constructing separate membership lists.
 * One module-level four-entry tuple lives for the process lifetime without retaining a production root or language document.
 */
export const AUTO_MOVIE_PRODUCTION_LANGUAGES: readonly ["chinese", "english", "japanese", "korean"] = [
  "chinese",
  "english",
  "japanese",
  "korean",
] as const;
