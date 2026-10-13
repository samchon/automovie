import type { IAutoMovieInspectedDesignReference } from "./IAutoMovieInspectedDesignReference";

import { digestAutoMovieBytes } from "./contentIdentity";
import { inspectAutoMovieDesignReferenceContainer } from "./designReference/inspectAutoMovieDesignReferenceContainer";

/**
 * Every container this inspector recognizes, named in each refusal so a
 * rejected reference says what to register instead of only what it is not.
 */
const SUPPORTED_DESIGN_REFERENCES =
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
 * The whole function is a pure function of `bytes`: no filesystem, no clock, no
 * locale, so the same asset inspects identically on every machine.
 */
export const inspectDesignReferenceAsset = (props: {
  /** Project-relative declared asset path, named in every refusal. */
  path: string;

  /** Exact current bytes of that asset. */
  bytes: Uint8Array;
}): IAutoMovieInspectedDesignReference => {
  const digest = digestAutoMovieBytes(props.bytes);
  const container = inspectAutoMovieDesignReferenceContainer(props);
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
};

/** The leading bytes as hex, for a file whose family is not recognizable. */
const leadingHex = (bytes: Uint8Array): string => {
  let text = "0x";
  for (let index = 0; index < Math.min(4, bytes.length); ++index)
    text += bytes[index]!.toString(16).padStart(2, "0");
  return bytes.length === 0 ? "empty" : text;
};
