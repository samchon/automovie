import type {
  IAutoMovieImage,
  IAutoMovieTextureImageFacts,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

import { AUTO_MOVIE_MAX_TEXTURE_EDGE } from "../AUTO_MOVIE_MAX_TEXTURE_EDGE";
import { readAutoMovieImageFacts } from "./readAutoMovieImageFacts";
import { validateUniqueValues } from "./validateUniqueValues";

/**
 * RFC 4648 section 4 base64: the standard alphabet in padded four-character
 * groups.
 */
const BASE64: RegExp =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

/**
 * Base64 characters that cover the signature and the whole IHDR chunk body (33
 * bytes).
 */
const HEADER_CHARACTERS: number = 44;

/** PNG colour types the viewer decodes: greyscale, RGB, greyscale-alpha, RGBA. */
const COLOUR_TYPES: ReadonlySet<number> = new Set([0, 2, 4, 6]);

/**
 * Admit the images a model carries: unique ids, strict base64 data, and a PNG
 * header inside the subset the viewer decodes.
 *
 * The header is the IHDR chunk (W3C PNG, 2nd edition, section 11.2.2): a
 * 13-byte body whose bit depth must be 8, colour type 0, 2, 4 or 6,
 * compression, filter and interlace methods 0, and whose edges must be positive
 * and at most `AUTO_MOVIE_MAX_TEXTURE_EDGE`. Only the first 44 base64
 * characters are decoded, so a corrupt compressed stream or a wrong checksum
 * after the header passes here and is refused when the viewer decodes the
 * image.
 */
export function validateModelImages(
  images: readonly IAutoMovieImage[] | undefined,
  path: string,
  collector: IAutoMovieViolationCollector,
): void {
  if (images === undefined) return;
  const ids: [string, string][] = [];
  images.forEach((image: IAutoMovieImage, index: number): void => {
    const at: string = `${path}[${index}]`;
    ids.push([image.id, `${at}.id`]);
    if (image.data.length === 0 || !BASE64.test(image.data)) {
      collector.push(
        "type",
        `${at}.data`,
        "image data must be nonempty padded standard base64 without a data: prefix",
        image.data.slice(0, 32),
      );
      return;
    }
    const header: string = atob(image.data.slice(0, HEADER_CHARACTERS));
    const bytes: Uint8Array = Uint8Array.from(
      header,
      (character: string): number => character.charCodeAt(0),
    );
    const facts: IAutoMovieTextureImageFacts | null =
      bytes.length < 29 ? null : readAutoMovieImageFacts(bytes);
    if (facts === null || facts.mediaType !== "image/png") {
      collector.push(
        "type",
        `${at}.data`,
        "image data must be a PNG beginning with its IHDR chunk",
        image.data.slice(0, 32),
      );
      return;
    }
    const length: number =
      (bytes[8]! << 24) | (bytes[9]! << 16) | (bytes[10]! << 8) | bytes[11]!;
    if (
      length !== 13 ||
      bytes[24] !== 8 ||
      !COLOUR_TYPES.has(bytes[25]!) ||
      bytes[26] !== 0 ||
      bytes[27] !== 0 ||
      bytes[28] !== 0
    )
      collector.push(
        "type",
        `${at}.data`,
        "image must be a non-interlaced 8-bit greyscale, greyscale-alpha, RGB or RGBA PNG",
        {
          bitDepth: bytes[24],
          colourType: bytes[25],
          compression: bytes[26],
          filter: bytes[27],
          interlace: bytes[28],
        },
      );
    for (const edge of ["width", "height"] as const)
      collector.range(
        `${at}.data`,
        facts[edge],
        1,
        AUTO_MOVIE_MAX_TEXTURE_EDGE,
        `image ${edge}`,
      );
  });
  validateUniqueValues(ids, "image id", collector);
}
