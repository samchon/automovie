import fs from "node:fs/promises";
import path from "node:path";

import { FamilyConicCaseIdentity as Identity } from "./FamilyConicCaseIdentity";

/** Shared exact-byte file identity and realpath containment for capture metadata readers. */
export namespace FamilyConicCaptureFileIO {
  /**
   * Byte identity used by the existing RootInputs producer.
   *
   * @evidence contracts/development/design.md#principled-representation A file path and its SHA256 identify bytes; checked validates the digest shape and contents at runtime.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Baseline and recorded-input readers share the same existing reference structure.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No generation status or geometry claim is encoded by this byte reference.
   * @evidence contracts/development/common.md#meaningful-documentation Members state path resolution and exact byte identity.
   */
  export interface IReference {
    /** Absolute path or path resolved from the reader's root, subject to realpath containment. */
    file: string;

    /** SHA256 hexadecimal digest of the exact file bytes. */
    byteHash: string;
  }
  /**
   * Resolve a real file inside this checkout, preserving junction containment.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Realpath resolution and path.relative reject files outside the supplied root, including junction escapes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve the root and file before checking their relative path.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Existing containment failures propagate without fallback or path substitution.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two realpath calls and path-length work dominate; only path strings remain.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Current, historical and baseline readers share this containment operation without caching filesystem state.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Awaited filesystem calls acquire no retained handle; one resolved path escapes.
   * @evidence contracts/development/common.md#meaningful-documentation States realpath containment and its junction premise.
   */
  export async function inside(
    root: string,
    filename: string,
  ): Promise<string> {
    const base: string = await fs.realpath(root);
    const file: string = await fs.realpath(path.resolve(base, filename));
    const relative: string = path.relative(base, file);
    if (
      relative === ".." ||
      relative.startsWith(".." + path.sep) ||
      path.isAbsolute(relative)
    )
      throw new Error("Recorded input leaves checkout: " + filename);
    return file;
  }
  /**
   * Read one exact byte reference; the caller owns the returned buffer.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Digest syntax, realpath containment and the existing SHA256 byte recipe bind the read to the supplied reference.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Validate the reference, read its contained path, then compare its digest.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing files, malformed references and differing bytes fail without a replacement read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Reading and hashing cost the referenced file size and retain one buffer.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All metadata readers share Identity.byteHash and inside; reads remain sequential and uncached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources readFile releases its handle; the returned buffer lives only as long as the caller retains it.
   * @evidence contracts/development/common.md#meaningful-documentation States exact-byte checking and caller buffer ownership.
   */
  export async function checked(
    root: string,
    reference: IReference,
  ): Promise<Buffer> {
    if (
      typeof reference?.file !== "string" ||
      !/^[a-f0-9]{64}$/i.test(reference.byteHash)
    )
      throw new Error("Invalid recorded file identity");
    const bytes: Buffer = await fs.readFile(await inside(root, reference.file));
    if (Identity.byteHash(bytes) !== reference.byteHash)
      throw new Error("Recorded file bytes changed: " + reference.file);
    return bytes;
  }
}
