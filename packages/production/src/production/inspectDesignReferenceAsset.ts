import type { IAutoMovieInspectedDesignReference } from "./IAutoMovieInspectedDesignReference";

import { digestAutoMovieBytes } from "./contentIdentity";
import { inspectAutoMovieDesignReferenceContainer } from "./designReference/inspectAutoMovieDesignReferenceContainer";

/**
 * Every container this inspector recognizes, named in each refusal so a
 * rejected reference says what to register instead of only what it is not.
 */
const SUPPORTED_DESIGN_REFERENCES: string =
  'Supported design references are PNG ("image/png"), JPEG ("image/jpeg"), SVG ("image/svg+xml"), PDF ("application/pdf") and DXF ("image/vnd.dxf") bytes.';

/**
 * Read one registered design-reference asset's own container facts.
 *
 * ## Why the bytes decide
 *
 * A design reference is evidence, and evidence that is trusted by filename is
 * not evidence. The media family, the digest and the source extent all come out
 * of the bytes, so a manifest that calls a JPEG a plan SVG, or a frame that
 * declares 4096 pixels of a 1024-pixel image, is contradicted by the file
 * itself rather than by nobody.
 *
 * ## Why a signature is not a family
 *
 * The family is whatever {@link inspectAutoMovieDesignReferenceContainer}
 * confirms after the complete admitted profile parses, so a PNG that stops
 * after its header, a JPEG with no scan, a `%PDF-` prefix, or an SVG root
 * hidden in a comment never becomes a measured reference. A candidate that
 * fails its parser throws that parser's typed refusal, and malformed UTF-8
 * text throws the strict decoding refusal, so a caller can name the exact
 * stage rather than fold every failure into "unsupported".
 *
 * ## Why it refuses instead of guessing
 *
 * Bytes in which no family candidate is observed throw, naming
 * {@link SUPPORTED_DESIGN_REFERENCES}, because a reference nobody can open
 * cannot be the basis of a building. A confirmed container whose extent this
 * host cannot derive — a PDF page, a DXF drawing, an SVG sized only in
 * millimetres with no `viewBox` — returns `unsupported` with the reason. The
 * one thing this function will never do is invent a number that a downstream
 * frame then treats as measured.
 *
 * Results depend on current bytes and the logical path used in refusals and
 * unsupported-bound reasons; no filesystem, clock or locale is consulted.
 *
 * @evidence contracts/common.md#principled-implementation Complete family parsing establishes media and any supported positive container extent, while SHA-256 identifies exact current bytes; unrecognized input throws and confirmed extent-free containers retain unsupported reasons rather than guessed measurements.
 * @evidence contracts/common.md#clear-and-simple-design One design-reference ingress joins the byte identity with the family parser's compact facts; reference frames consume the resulting measured/unsupported bound distinction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Filename and declared media cannot replace full-container admission, a signature-only candidate cannot become a measured reference and physical units are not invented for PDF/DXF or unsupported SVG sizing.
 * @evidence contracts/common.md#meaningful-documentation States exact-byte media/digest/extent ownership, typed parser/UTF-8 refusals and explicit unsupported-bound behavior.
 * @evidence contracts/performance.md#efficient-algorithms Exact-byte hashing scans B input bytes once, then complete family admission incurs its parser/decoder costs and allocations; error context formats at most four leading bytes. Parsing cost remains included rather than attributed only to the fixed result construction.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One inspection operates on supplied current bytes without a cross-asset cache; callers must prove exact input equivalence before sharing a result.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned metadata retains scalars/path reason rather than the byte buffer; parser temporaries belong to this call and family owners, and this operation opens no file, process or task.
 */
export function inspectDesignReferenceAsset(props: {
  /** Project-relative declared asset path, named in every refusal. */
  path: string;

  /** Exact current bytes of that asset. */
  bytes: Uint8Array;
}): IAutoMovieInspectedDesignReference {
  const digest: string = digestAutoMovieBytes(props.bytes);
  const container: ReturnType<typeof inspectAutoMovieDesignReferenceContainer> = inspectAutoMovieDesignReferenceContainer(props);
  if (container === null)
    throw new Error(
      `Design reference "${props.path}" is not a container this host recognizes (${leadingHex(props.bytes)}). ${SUPPORTED_DESIGN_REFERENCES}`,
    );
  if ("width" in container)
    return {
      media: container.media,
      digest,
      bounds: {
        status: "measured",
        width: container.width,
        height: container.height,
      },
    };
  return {
    media: container.media,
    digest,
    bounds: {
      status: "unsupported",
      reason: `Design reference "${props.path}" is a parser-confirmed "${container.media}" container whose source extent this host does not derive. Declare the frame bounds from the drawing itself.`,
    },
  };
}

/** The leading bytes as hex, for a file whose family is not recognizable. */
function leadingHex(bytes: Uint8Array): string {
  let text: string = "0x";
  for (let index: number = 0; index < Math.min(4, bytes.length); ++index)
    text += bytes[index]!.toString(16).padStart(2, "0");
  return bytes.length === 0 ? "empty" : text;
}
