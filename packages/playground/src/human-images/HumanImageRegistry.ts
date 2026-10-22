import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import type { IAutoMovieHumanParameters } from "../../../human/src/structures/IAutoMovieHumanParameters";
import { f1, f2, m1, m2 } from "../human-parameters";

/** Serialize the explicitly registered typed Human examples as public JSON.
 * The registry names their source modules, not deleted JSON copies. These are
 * authored parameter examples; publication does not implement generation.
 *
 * @evidence contracts/common.md#principled-implementation Each published literal satisfies IAutoMovieHumanParameters and is serialized from the same typed source used by the playground.
 * @evidence contracts/common.md#clear-and-simple-design One reader supplies both JSON URL spellings from four explicit typed examples.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No deleted-file fallback, generated shape or unchecked parameter assertion is used.
 * @evidence contracts/common.md#meaningful-documentation States typed authority, explicit registration and the generation boundary.
 * @evidence contracts/performance.md#efficient-algorithms Each read selects among four typed examples, reads/parses an uncapped registry file and scans its entries before serializing one example; no geometry work occurs.
 * @evidence contracts/performance.md#reuse-equivalent-work Both JSON routes share the same imported literal and canonical serialized bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Module loading owns four examples; this reader retains no per-request cache or open file handle.
 */
export class HumanImageRegistry {
  /** Verify an alias's source mapping and serialize its imported typed example.
   * This checks registry addressing, not runtime admission of arbitrary parameters.
   *
   * @evidence contracts/common.md#principled-implementation The alias must be one of four imported typed literals and its registry path must resolve to that alias's source module.
   * @evidence contracts/common.md#clear-and-simple-design Both JSON route spellings call this single reader and share the same f1/f2/m1/m2 source values.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown aliases and mismatched paths reject; no public JSON fallback or generated geometry is returned.
   * @evidence contracts/common.md#meaningful-documentation Distinguishes explicit source-address validation from arbitrary-input runtime validation and preserves authored units and nulls.
   * @evidence contracts/performance.md#efficient-algorithms Work reads and parses the registry, scans its entries and serializes one example; registry file size has no explicit cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Imported literals are module-shared; registry reads and serialization repeat so changed mappings are rechecked, while module reload owns source-value freshness.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The method retains no cache or file handle; returned bytes and the shallow value copy belong to the caller, with nested parameter objects still shared with the imported literal.
   */
  public static async read(
    filename: string,
    alias: string,
  ): Promise<{
    value: Record<string, unknown>;
    bytes: Buffer;
    sha256: string;
  }> {
    const examples: Record<string, IAutoMovieHumanParameters> = {
      f1,
      f2,
      m1,
      m2,
    };
    const entry: [string, IAutoMovieHumanParameters] | undefined =
      Object.entries(examples).find(
        ([key]: [string, IAutoMovieHumanParameters]): boolean => key === alias,
      );
    if (entry === undefined) throw new Error("Unknown Human alias");
    const registry: unknown = JSON.parse(await fs.readFile(filename, "utf8"));
    if (
      registry === null ||
      typeof registry !== "object" ||
      Array.isArray(registry)
    )
      throw new Error("Expected an explicit Human source registry");
    const source: unknown = Object.entries(registry).find(
      ([key]: [string, unknown]): boolean => key === alias,
    )?.[1];
    if (
      typeof source !== "string" ||
      path.resolve(path.dirname(filename), source) !==
        path.resolve(
          path.dirname(filename),
          "src/human-parameters/" + alias + ".ts",
        )
    )
      throw new Error("Human alias must name its typed source module");
    const value: Record<string, unknown> = { ...entry[1] };
    const bytes: Buffer = Buffer.from(JSON.stringify(value));
    return {
      value,
      bytes,
      sha256: createHash("sha256").update(bytes).digest("hex"),
    };
  }
}
