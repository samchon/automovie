import type { AutoMovieContentDigest } from "@automovie/interface";

/**
 * Say why builder-owned bytes on disk are not the bytes derived now.
 *
 * The message used to name "current source and design" as what derived the
 * expected digest, which reads as a verdict about the author's own inputs. A
 * digest mismatch is a statement about one output, and its cause is either an
 * edit to that builder-owned file or a move in any compile input, the build
 * protocol included. Naming the complete input set keeps an author from hunting
 * a source change that never happened, which is exactly what the old wording
 * cost while a compiled clearance report still carried the project revision and
 * every build rewrote it.
 *
 * `repair` separates the build that will rewrite the file from the read-only
 * lint that can only refuse it, because those two ask the author for different
 * things. An absent file has no digest, and rendering that absence rather than
 * inventing one keeps the two cases one message.
 *
 * @author Samchon
 */
export const generatedOwnershipDiagnosticMessage = (props: {
  /** Digest of the bytes on disk, or `null` when the file is absent. */
  actual: AutoMovieContentDigest | null;

  /** Digest the current compile inputs derive for that file. */
  expected: AutoMovieContentDigest;

  /** Whether the caller will rewrite the file rather than refuse it. */
  repair: boolean;
}): string =>
  `Generated digest is ${String(props.actual)} but the current design, source, authoring evidence, adopted content, and builder protocol derive ${props.expected}. Either this builder-owned file was edited or one of those inputs moved. ${
    props.repair
      ? "The builder will regenerate this builder-owned file."
      : "Run the scaffold compile command to regenerate it before accepting lint."
  }`;
