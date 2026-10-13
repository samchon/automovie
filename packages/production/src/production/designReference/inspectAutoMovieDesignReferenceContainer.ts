import { decodeAutoMovieUtf8 } from "../strictUtf8";
import { IAutoMovieDesignReferenceContainer } from "./IAutoMovieDesignReferenceContainer";
import { inspectDesignReferencePng } from "./inspectDesignReferencePng";
import { inspectDesignReferenceJpeg } from "./inspectDesignReferenceJpeg";
import { inspectDesignReferencePdf } from "./inspectDesignReferencePdf";
import { inspectDesignReferenceDxf } from "./inspectDesignReferenceDxf";
import { inspectXmlRoot } from "./inspectXmlRoot";
import { svgExtent } from "./svgExtent";

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

/**
 * Admit one design reference only after its complete supported profile parses.
 *
 * A signature or a token selects the family and nothing more; the family's
 * parser then has to close the container before any fact leaves this function.
 * The admitted profiles are deliberately narrow and are stated here so a
 * refusal is a decision rather than a limitation nobody wrote down:
 *
 * - PNG: the resident decoder reads the whole datastream with CRC checking and
 *   refuses any byte outside its chunk framing, so the leading 13-byte `IHDR`
 *   and the terminal `IEND` are its facts; this parser then requires a positive
 *   extent, at least one `IDAT`, and an empty `IEND`.
 * - JPEG: every byte outside entropy-coded data is a marker segment of the
 *   interchange format, exactly one frame header states the extent, every scan
 *   references frame components, restart markers appear only under a positive
 *   `DRI` interval and in `RST0..RST7` order, and a terminal `EOI` closes the
 *   bytes exactly.
 * - PDF: a `%PDF-1.x` header, at least one closed indirect object, a classic
 *   cross-reference table reachable from `startxref`, a trailer naming `/Size`
 *   and `/Root`, a `Catalog` whose single `/Pages` tree is acyclic, parent-
 *   consistent and whose `/Count` equals its leaves, and a terminal `%%EOF`.
 *   The page box is not read, so the extent stays unsupported.
 * - SVG: strictly decoded UTF-8 that is a well-formed XML document without
 *   DTD or external entities, whose namespace-resolved root is `svg` in the
 *   SVG namespace; the extent is the root `viewBox`, else unitless or `px`
 *   `width` and `height`, and is omitted when neither states user units.
 * - DXF: group-code and value pairs forming `SECTION` / `ENDSEC` records that
 *   end with one `EOF`; the drawing extent is never derived.
 *
 * `null` means no family candidate was observed. A candidate that fails its
 * parser throws {@link AutoMovieDesignReferenceContainerError} naming the
 * family and stage, and malformed text throws the strict UTF-8 refusal before
 * any grammar runs.
 */
export const inspectAutoMovieDesignReferenceContainer = (props: {
  /** Logical source path retained in every candidate grammar refusal. */
  path: string;

  /** Complete current container bytes; no filesystem or codec process is used. */
  bytes: Uint8Array;
}): IAutoMovieDesignReferenceContainer | null => {
  if (startsWith(props.bytes, PNG_SIGNATURE)) return inspectDesignReferencePng(props);
  if (startsWith(props.bytes, [0xff, 0xd8])) return inspectDesignReferenceJpeg(props);
  if (startsWith(props.bytes, [0x25, 0x50, 0x44, 0x46, 0x2d]))
    return inspectDesignReferencePdf(props);
  const text = decodeAutoMovieUtf8({
    record: props.path,
    bytes: props.bytes,
    leadingBom: "strip",
  });
  const xml = inspectXmlRoot(props.path, text);
  if (xml !== null) {
    if (
      xml.localName !== "svg" ||
      xml.namespace !== "http://www.w3.org/2000/svg"
    )
      return null;
    return { media: "image/svg+xml", ...svgExtent(xml.attributes) };
  }
  const dxf = inspectDesignReferenceDxf(props.path, text);
  return dxf ? { media: "image/vnd.dxf" } : null;
};

const startsWith = (bytes: Uint8Array, signature: readonly number[]): boolean =>
  bytes.length >= signature.length &&
  signature.every((byte, index) => bytes[index] === byte);
