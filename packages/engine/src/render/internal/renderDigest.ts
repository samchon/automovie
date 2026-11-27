import { digestBytes } from "./digestBytes";
import { utf8Bytes } from "./utf8Bytes";

/*
 * SHA-256 over a UTF-8 string, in pure TypeScript.
 *
 * The engine cannot reach `node:crypto`: the viewer bundles the engine into a
 * browser, so a Node built-in here would break the one consumer that has to
 * agree with the capture path byte for byte. It also cannot reach
 * `SubtleCrypto`, which is asynchronous and unavailable outside a secure
 * context, and a digest that is sometimes a promise is a digest no synchronous
 * evidence path can use.
 *
 * The string is encoded by `utf8Bytes` and digested by `digestBytes`,
 * the FIPS 180-4 algorithm with no variation, so the same text hashes to the
 * same `sha256:` digest as `createHash("sha256")` does on the capture side, and
 * the test suite proves exactly that against Node's implementation rather than
 * against a stored expectation of this code's own output.
 */
export function renderDigest(text: string): string {
  return digestBytes(Uint8Array.from(utf8Bytes(text)));
}
