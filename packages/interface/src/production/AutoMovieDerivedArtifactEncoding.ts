/**
 * Encoding used to carry exact derived bytes through the JSON source context.
 *
 * @evidence requirements/agent-authoring/deterministic-precomputation.md#agent-precomputed-derived-artifact Makes precomputed project bytes available without turning them into source literals.
 * @evidence specifications/authoring-and-authority/deterministic-precomputed-artifacts.md#spec-authoring-precomputed-freshness Preserves text directly and binary through one explicit base64 representation.
 * @author Samchon
 */
export type AutoMovieDerivedArtifactEncoding = "utf8" | "base64";
