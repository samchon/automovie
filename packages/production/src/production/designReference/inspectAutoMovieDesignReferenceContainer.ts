import { decodeAutoMovieUtf8 } from "../strictUtf8";
import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { inspectDesignReferencePng } from "./inspectDesignReferencePng";
import { inspectDesignReferenceJpeg } from "./inspectDesignReferenceJpeg";
import { inspectDesignReferencePdf } from "./inspectDesignReferencePdf";
import { inspectDesignReferenceDxf } from "./inspectDesignReferenceDxf";
import { inspectXmlRoot } from "./inspectXmlRoot";
import { svgExtent } from "./svgExtent";

const PNG_SIGNATURE: number[] = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Inspect one reference under the selected family's bounded admission profile.
 *
 * A signature or a token selects the family and nothing more; the family's parser then has to close the container before any fact leaves this function. The admitted profiles are deliberately narrow and are stated here so a refusal is a decision rather than a limitation nobody wrote down:
 *
 * - PNG: every chunk CRC, a 13-byte IHDR, positive decoded extent, IDAT and empty terminal IEND are required. Native decoding rejects trailing bytes; ancillary semantic schemas are not fully checked.
 * - JPEG: bounded segments, one frame, matching scan components, ordered restart markers under positive DRI and exact terminal EOI are checked. Entropy-coded pixels are not decoded.
 * - PDF: a classic xref table, matching Root object, acyclic parent-consistent Pages tree with matching leaf counts and terminal startxref/EOF are checked. Dictionary extraction uses regular expressions; complete PDF semantics and page extent remain unsupported.
 * - SVG: strict UTF-8 and the XML owner's DTD-free namespace-resolved SVG root are required. Root viewBox or unitless/px width and height supply user-unit extent; absent supported units omit extent.
 * - DXF: group-code/value pairs form closed SECTION records and one terminal EOF; drawing extent is not derived.
 *
 * `null` means no family candidate was observed. A candidate that fails its parser throws {@link AutoMovieDesignReferenceContainerError} naming the family and stage, and malformed text throws the strict UTF-8 refusal before any grammar runs.
 *
 * @evidence contracts/common.md#principled-implementation Signature dispatch selects the PNG/JPEG/PDF owners; strict UTF-8 then selects XML/SVG or paired-record DXF. Each owner establishes only its documented admission facts.
 * @evidence contracts/common.md#clear-and-simple-design This entry returns scalar family/extent metadata and delegates family rules to their owners; the reference inventory need not duplicate those parsers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Candidate failures propagate instead of becoming successful metadata; JPEG entropy and complete PDF semantics are outside this admission profile.
 * @evidence contracts/common.md#meaningful-documentation Lists the family profiles, unsupported extent states, null result and typed grammar or UTF-8 failures without claiming visual validity.
 * @evidence contracts/performance.md#efficient-algorithms Dispatch uses fixed prefixes, then one family path. Text decoding costs O(B); family owners describe their additional scans, decoding and traversal costs.
 * @evidence contracts/performance.md#reuse-equivalent-work One invocation retains its decoded text for XML and DXF inspection; it does not cache facts across mutable byte inputs.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Text and parser intermediates live for this call; returned metadata does not retain input bytes. No filesystem handle or process is acquired.
 * @author Samchon
 */
export function inspectAutoMovieDesignReferenceContainer(props: {
  /** Logical source path retained in every candidate grammar refusal. */
  path: string;

  /** Complete current container bytes; no filesystem or codec process is used. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer | null {
  if (startsWith(props.bytes, PNG_SIGNATURE)) return inspectDesignReferencePng(props);
  if (startsWith(props.bytes, [0xff, 0xd8])) return inspectDesignReferenceJpeg(props);
  if (startsWith(props.bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    return inspectDesignReferencePdf(props);
  const text: string = decodeAutoMovieUtf8({
    record: props.path,
    bytes: props.bytes,
    leadingBom: "strip",
  });
  const xml: ReturnType<typeof inspectXmlRoot> = inspectXmlRoot(props.path, text);
  if (xml !== null) {
    if (
      xml.localName !== "svg" ||
      xml.namespace !== "http://www.w3.org/2000/svg"
    )
      return null;
    return { media: "image/svg+xml", ...svgExtent(xml.attributes) };
  }
  const dxf: boolean = inspectDesignReferenceDxf(props.path, text);
  return dxf ? { media: "image/vnd.dxf" } : null;
}

/** Match a fixed family signature without treating it as admission. */
function startsWith(bytes: Uint8Array, signature: readonly number[]): boolean { return bytes.length >= signature.length &&
  signature.every((byte: number, index: number) : boolean => bytes[index] === byte); }
