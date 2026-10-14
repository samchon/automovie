import { type IAutoMovieEvidenceSyntaxDocument } from "./IAutoMovieEvidenceSyntaxDocument";
import { parseAutoMovieEvidenceSyntax } from "./parseAutoMovieEvidenceSyntax";

/**
 * Parsed declaration fields used by syntax-only duplicate and prior-acknowledgement checks.
 *
 * The optional fingerprint is retained from the native review grammar; target graph resolution remains outside this private record.
 *
 * @author Samchon
 */
interface IParsedAnnotation {
  /** Whether the declaration excludes its addressed checklist target. */
  exclusion: boolean;

  /** Native review token, or null for an acknowledgement. */
  fingerprint: string | null;

  /** Grammar branch that determines the required prior declaration. */
  kind: "acknowledgement" | "review";

  /** Unresolved Markdown address checked for canonical relative spelling. */
  target: string;
}

const ACKNOWLEDGEMENT: RegExp = /^@evidence(Exclude)?\s+(\S+)\s+(\S(?:.*\S)?)$/u;
const REVIEW: RegExp =
  /^@evidence(Exclude)?Review\s+(\S+)\s+(#[0-9a-f]{7})\s+(\S(?:.*\S)?)$/u;
const FINGERPRINT_TOKEN: RegExp = /(?:^|\s)#[0-9a-f]{7}(?=\s|$)/gu;

/**
 * Refuses deterministic contradictions in native evidence declarations.
 *
 * Graph resolution remains `@wrtnlabs/evidence`'s authority. This preflight owns only syntax facts that can otherwise produce a false carrier, a conflicting acknowledgement, or a review with no declaration to review.
 *
 * Every detected defect is collected into one Error with document, line and host addresses. Review rows require a prior matching acknowledgement; target syntax is checked without resolving whether the addressed Markdown unit exists.
 *
 * @evidence contracts/common.md#principled-implementation Native carrier parsing precedes exact acknowledgement and review grammars; per-host keys distinguish polarity and declaration kind, enforcing canonical relative targets, unique declarations and a prior matching acknowledgement for each review.
 * @evidence contracts/common.md#clear-and-simple-design This syntax preflight owns mechanically contradictory declarations while target-graph resolution remains the evidence engine's separate responsibility.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Malformed or contradictory declarations accumulate diagnostics rather than being repaired or ignored; lexical lookalikes outside native carriers do not enter validation.
 * @evidence contracts/common.md#meaningful-documentation The comment states syntax-only authority, aggregated refusal behavior and the distinction from graph resolution.
 * @evidence contracts/performance.md#efficient-algorithms For A annotations and L source characters, carrier parsing dominates and one map pass performs expected O(A) declaration checks, retaining at most one entry per distinct declaration key plus diagnostics.
 * @evidence contracts/performance.md#reuse-equivalent-work One declaration map per document serves duplicate, opposite-polarity and prior-acknowledgement lookups; no result is reused across changed source documents.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Per-document maps are discarded after each document and only the error's diagnostic text escapes on refusal; all source inputs remain caller-owned.
 */
export function assertAutoMovieEvidenceSyntax(
  documents: readonly IAutoMovieEvidenceSyntaxDocument[],
): void {
  const diagnostics: string[] = [];
  for (const document of documents) {
    const declarations: Map<string, IParsedAnnotation> = new Map<string, IParsedAnnotation>();
    for (const annotation of parseAutoMovieEvidenceSyntax(document)) {
      const parsed: IParsedAnnotation | null = parseAnnotation(annotation.text);
      const address: string = `${document.path}:${annotation.line}`;
      if (parsed === null) {
        diagnostics.push(
          `${address} [evidence-syntax] malformed evidence declaration in ${annotation.host}.`,
        );
        continue;
      }
      if (!isCanonicalTarget(parsed.target))
        diagnostics.push(
          `${address} [evidence-target] ${JSON.stringify(parsed.target)} is not a normalized relative Markdown evidence address.`,
        );
      if (
        parsed.kind === "review" &&
        (annotation.text.match(FINGERPRINT_TOKEN)?.length ?? 0) > 1
      )
        diagnostics.push(
          `${address} [evidence-fingerprint-extra] a review carries more than one fingerprint token.`,
        );

      const polarity: "exclude" | "answer" = parsed.exclusion ? "exclude" : "answer";
      const key: string = `${annotation.host}\0${parsed.target}\0${parsed.kind}\0${polarity}`;
      if (declarations.has(key))
        diagnostics.push(
          `${address} [evidence-duplicate] ${annotation.host} repeats its ${polarity} ${parsed.kind} for ${parsed.target}.`,
        );
      declarations.set(key, parsed);

      const opposite: string = `${annotation.host}\0${parsed.target}\0${parsed.kind}\0${parsed.exclusion ? "answer" : "exclude"}`;
      if (declarations.has(opposite))
        diagnostics.push(
          `${address} [evidence-contradiction] ${annotation.host} both answers and excludes ${parsed.target}.`,
        );

      if (parsed.kind === "review") {
        const acknowledgement: string = `${annotation.host}\0${parsed.target}\0acknowledgement\0${polarity}`;
        if (!declarations.has(acknowledgement))
          diagnostics.push(
            `${address} [evidence-review-orphan] ${annotation.host} reviews ${parsed.target} without a matching prior ${polarity} acknowledgement.`,
          );
      }
    }
  }
  if (diagnostics.length !== 0)
    throw new Error(
      `Evidence syntax is contradictory or malformed:\n${diagnostics
        .map((diagnostic: string): string => `- ${diagnostic}`)
        .join("\n")}`,
    );
}

/** Parse one exact acknowledgement or review declaration. */
function parseAnnotation(text: string): IParsedAnnotation | null {
  const review: RegExpExecArray | null = REVIEW.exec(text);
  if (review !== null)
    return {
      exclusion: review[1] !== undefined,
      fingerprint: review[3]!,
      kind: "review",
      target: review[2]!,
    };
  const acknowledgement: RegExpExecArray | null = ACKNOWLEDGEMENT.exec(text);
  if (acknowledgement === null) return null;
  return {
    exclusion: acknowledgement[1] !== undefined,
    fingerprint: null,
    kind: "acknowledgement",
    target: acknowledgement[2]!,
  };
}

/** Validate the address form without resolving the target graph. */
function isCanonicalTarget(target: string): boolean {
  if (
    target.includes("\\") ||
    target.startsWith("/") ||
    target.includes("//") ||
    /[:*?]/u.test(target)
  )
    return false;
  const [file, anchor, ...rest]: string[] = target.split("#");
  if (rest.length !== 0 || !file.endsWith(".md")) return false;
  if (
    file
      .split("/")
      .some(
        (part: string) : boolean =>
          part.length === 0 ||
          part === "." ||
          part === ".." ||
          !/^[A-Za-z0-9][A-Za-z0-9._-]*$/u.test(part),
      )
  )
    return false;
  return anchor === undefined || /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(anchor);
}
