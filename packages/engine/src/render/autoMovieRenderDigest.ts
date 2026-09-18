import { AutoMovieContentDigest } from "@automovie/interface";
import { utf8Bytes } from "./utf8Bytes";

/**
 * SHA-256 over a UTF-8 string, in pure TypeScript.
 *
 * The engine cannot reach `node:crypto`: the viewer bundles the engine into a
 * browser, so a Node built-in here would break the one consumer that has to
 * agree with the capture path byte for byte. It also cannot reach
 * `SubtleCrypto`, which is asynchronous and unavailable outside a secure
 * context, and a digest that is sometimes a promise is a digest no synchronous
 * evidence path can use.
 *
 * So the transform is written out. It is the FIPS 180-4 algorithm with no
 * variation, which means the same bytes hash to the same digest as
 * `createHash("sha256")` does on the capture side, and the test suite proves
 * exactly that against Node's implementation rather than against a stored
 * expectation of this code's own output.
 *
 * Everything is 32-bit integer arithmetic with `>>> 0` normalization, so
 * endianness, word size, and floating-point behavior cannot make one platform
 * disagree with another.
 *
 * @evidence requirements/rendering/frame-identity-and-content-addressing.md#rendering-canonical-fingerprint Computes the stable SHA-256 fingerprint used to bind render evidence to its canonical inputs.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-frame-identity Supplies the content-addressed digest primitive for render target, inventory, mask, and report identities.
 * @author Samchon
 */
export const autoMovieRenderDigest = (text: string): AutoMovieContentDigest =>
  `sha256:${sha256Hex(utf8Bytes(text))}`;
