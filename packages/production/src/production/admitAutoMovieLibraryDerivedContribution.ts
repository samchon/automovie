import type {
  IAutoMovieDerivedArtifactSource,
  IAutoMovieDiagnostic,
} from "@automovie/interface";

import { digestAutoMovieBytes } from "./contentIdentity";
import {
  AutoMovieStructuredJsonError,
  parseAutoMovieStructuredJson,
} from "./duplicateAwareJson";

/** The byte order mark a WHATWG UTF-8 decoder removes from projected text. */
const UTF8_BOM: Uint8Array = Uint8Array.of(0xef, 0xbb, 0xbf);

/**
 * Admit the complete precomputed contribution one library owner selected.
 *
 * A derived artifact's declared `utf8` encoding proves only that its bytes are
 * text. Nothing in the ledger says the text is JSON, because an ordinary
 * generator may publish any text an authored builder reads. The one place the
 * bytes become a JSON record is here, where an owner registers `derivedArtifact`
 * instead of `build`: from this point the artifact is a library contribution,
 * so it is admitted through the shared structured JSON ingress rather than a
 * host parser that silently keeps the last of two same-named members.
 *
 * The ingress reads exactly the bytes the verified output digest names. The
 * build context carries decoded text, and decoding removes one leading byte
 * order mark, so the text is matched against the digest with and without that
 * mark. Text that reproduces neither is not the current artifact and is refused
 * as a selection failure before any JSON stage runs.
 *
 * The returned value is an untyped data tree. The caller still applies the
 * same contribution schema and branch validation a `build` result receives,
 * so a derived owner earns no weaker admission than an executed one.
 *
 * @evidence contracts/common.md#principled-implementation Requires an own selected UTF-8 artifact and exclusive derived registration, reconstructs decoded bytes with the two allowed initial-BOM possibilities to match its admitted digest, then applies the duplicate-aware structured JSON owner. The collector still owns contribution schema and carrier validation.
 * @evidence contracts/common.md#clear-and-simple-design Owns derived selection and text-to-JSON admission while residentArtifact confines exact byte recovery; the collector applies the same downstream contribution contract used for authored build results.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No path or export bypasses current digest matching. The BOM reconstruction restores a decoder-removed prefix only when its digest matches; JSON ingress can still refuse that BOM, and an artifact cannot also register build().
 * @evidence contracts/common.md#meaningful-documentation States the selection and digest premises, initial-BOM reconstruction, typed JSON refusal attribution and untyped return requiring later schema validation; arbitrary non-JSON text remains valid in the general artifact ledger but cannot complete this derived owner.
 * @evidence contracts/performance.md#efficient-algorithms For B text bytes, recovery encodes and hashes O(B) bytes, allocating a prefixed copy only if the unprefixed digest differs, then pays structured JSON admission costs. Parsed output size and parser depth limits belong to that ingress owner.
 * @evidence contracts/performance.md#reuse-equivalent-work Uses the build context's already-admitted artifact record; digest equality proves reconstructed bytes match it, without rereading the filesystem. No cross-call cache assumes mutable resident text or digest equivalence.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Reconstructed buffers and parsing intermediates are local until return; success transfers the data tree and refusal transfers one diagnostic. No file handle or task is acquired, and the caller retains the original context artifact.
 * @author Samchon
 */
export function admitAutoMovieLibraryDerivedContribution(props: {
  /** Project-relative library source path whose export made the selection. */
  source: string;
  /** Named export that registered the derived owner. */
  exportName: string;
  /** Declared `derivedArtifact` path, or null when it is not a string. */
  derivedArtifact: string | null;
  /** Whether the same export also declared a `build` function. */
  build: boolean;
  /** Verified current artifacts from the owner's build context. */
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;
}):
  | {
      /** The selected artifact parsed as one JSON value. */
      success: true;
      /** Data tree that still owes contribution schema validation. */
      value: unknown;
    }
  | {
      /** The selection or its JSON admission was refused. */
      success: false;
      /** Blocking source-phase diagnostic naming the refused input. */
      diagnostic: IAutoMovieDiagnostic;
    } {
  const target: string = `library-source:${props.source}:${props.exportName}`;
  const selected: { path: string; bytes: Uint8Array } | null = props.build ? null : residentArtifact(props);
  if (selected === null)
    return {
      success: false,
      diagnostic: {
        code: "source-export-invalid",
        category: "error",
        phase: "source",
        target,
        path: props.source,
        message: `Library owner export "${props.exportName}" must select exactly one current UTF-8 derived artifact and omit build(). Received ${JSON.stringify(props.derivedArtifact)}. Generate the declared artifact explicitly before compiling.`,
      },
    };
  try {
    return {
      success: true,
      value: parseAutoMovieStructuredJson({
        record: selected.path,
        bytes: selected.bytes,
      }),
    };
  } catch (error) {
    // The shared ingress throws nothing but its own typed refusal, so the
    // diagnostic restates that refusal under the owner that selected it.
    const refusal: AutoMovieStructuredJsonError = error as AutoMovieStructuredJsonError;
    return {
      success: false,
      diagnostic: {
        code: "source-export-invalid",
        category: "error",
        phase: "source",
        target,
        path: selected.path,
        message: `Library owner export "${props.exportName}" in ${props.source} selected derived artifact "${selected.path}", which is not one admissible JSON library contribution. ${refusal.message}. No generated artifact was published. Correct the generator so it emits exactly one JSON value, without a byte order mark and without a member name repeated inside any one object, then run the explicit generation command and compile again. Derived bytes are never edited by hand.`,
      },
    };
  }
}

/**
 * Recover the exact resident bytes of one selected UTF-8 artifact.
 *
 * Returns null when the path is not an own current entry, the artifact is not
 * UTF-8 text, or its text reproduces the verified digest neither as decoded nor
 * with the one byte order mark decoding removes.
 */
function residentArtifact(props: {
  derivedArtifact: string | null;
  derivedArtifacts: Readonly<Record<string, IAutoMovieDerivedArtifactSource>>;
}): { path: string; bytes: Uint8Array } | null {
  const path: string | null = props.derivedArtifact;
  if (path === null || Object.hasOwn(props.derivedArtifacts, path) === false)
    return null;
  const artifact: IAutoMovieDerivedArtifactSource = props.derivedArtifacts[path];
  if (artifact.encoding !== "utf8") return null;
  const text: Buffer = Buffer.from(artifact.content, "utf8");
  if (digestAutoMovieBytes(text) === artifact.digest)
    return { path, bytes: text };
  const marked: Buffer = Buffer.concat([UTF8_BOM, text]);
  return digestAutoMovieBytes(marked) === artifact.digest
    ? { path, bytes: marked }
    : null;
}
