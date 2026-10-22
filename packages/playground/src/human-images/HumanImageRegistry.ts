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
 * @evidence contracts/performance.md#efficient-algorithms Each read checks a bounded alias registry and serializes one small parameter example without geometry work.
 * @evidence contracts/performance.md#reuse-equivalent-work Both JSON routes share the same imported literal and canonical serialized bytes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Module loading owns four examples; this reader retains no per-request cache or open file handle.
 */
export class HumanImageRegistry {
  /** Admit an explicit source mapping and preserve the example's numeric units and nulls. */
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
