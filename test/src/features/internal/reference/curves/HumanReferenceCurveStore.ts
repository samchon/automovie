import fs from "node:fs";
import path from "node:path";

import { HumanReferenceCurveFile } from "./HumanReferenceCurveFile";

/**
 * Where the private reference curve pack lives and how its files are read.
 * The pack is git-ignored data under `.references/curves/<id>/`; the
 * repository holds none of it, so every reader here answers "absent" rather
 * than failing when a checkout has no pack.
 */
export namespace HumanReferenceCurveStore {
  /** The references the pack can hold. */
  export const IDS: readonly string[] = ["f1", "f2", "m1", "m2"];

  /** The repository root. */
  const ROOT: string = path.resolve(__dirname, "../../../../../..");

  /**
   * Directory of a reference's curve pack.
   *
   * @param id Reference alias.
   */
  export function directory(id: string): string {
    return path.join(ROOT, ".references/curves", id);
  }

  /** The references whose pack is present in this checkout. */
  export function available(): string[] {
    return IDS.filter((id: string): boolean => fs.existsSync(path.join(directory(id), "index.json")));
  }

  /**
   * A pack file's parsed JSON, read by each call of
   * `HumanReferenceCurveFile` and shared by every caller, so a caller
   * never mutates it. The path is under `directory(id)`.
   *
   * @param file Absolute path of the pack file.
   * @throws Error when the file is missing or is not JSON.
   */
  export function read<T>(file: string): T {
    return HumanReferenceCurveFile.get<T>(file);
  }

  /**
   * Whether a pack file exists.
   *
   * @param file Absolute path of the pack file.
   */
  export function exists(file: string): boolean {
    return fs.existsSync(file);
  }
}
