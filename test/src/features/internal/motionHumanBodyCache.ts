import type { IAutoMovieHumanParameters } from "@automovie/human";
import type {
  IAutoMoviePhysicalProfile,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Prepared bodies kept on disk between test processes: preparing a person
 * costs seconds, every test process prepares the people it reads, and the
 * result depends only on the code that prepares it and on the person's
 * inputs.
 *
 * An entry lives under `test/.cache/bodies/<key>/<person>.json` (git-ignored),
 * the key a hash of every source file of the human, engine and interface
 * packages, so a change to any code a preparation may read starts a new key
 * and the directories of other keys are removed. An entry holds the person's
 * inputs beside the skeleton and the profile and is read only when they are
 * the inputs asked; a number JSON cannot hold (a signed zero, a non-finite
 * value) is written tagged and read back as itself, so the body read is the
 * body prepared, number for number. A missing, stale or unreadable entry is
 * prepared again and rewritten, through a temporary file renamed into place,
 * so a process never reads another's half-written entry.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is kept, where, under which key, when an entry is read, and how a stale or broken one is replaced.
 * @evidence contracts/development/implementation.md#principled-implementation A pure function's result cached under the hash of everything it reads; the inputs are checked on read, and the encoding keeps every double exactly.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One key, one read, one write.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A failed read or write falls back to preparing the body; nothing is trusted that was not checked.
 * @evidence contracts/development/implementation.md#efficient-algorithms The key is hashed once per process; an entry read is one file parse.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A body prepared by any process is read by every later one with the same code.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources One key's directory is kept; the others are removed when a new key is written.
 */
export namespace motionHumanBodyCache {
  /** What a preparation gives that the tests read. */
  export interface IPrepared {
    /** The canonical rig. */
    skeleton: IAutoMovieSkeleton;

    /** The contact and mass profile. */
    profile: IAutoMoviePhysicalProfile;
  }

  /**
   * A person's prepared body, from disk when an entry for these inputs and
   * this code is there, otherwise prepared and written.
   *
   * @param name The person.
   * @param inputs The person's parameters and mass.
   * @param prepare Prepares the body when no entry serves.
   * @returns The prepared body.
   */
  export function read(
    name: string,
    inputs: { mass: number; params: IAutoMovieHumanParameters },
    prepare: () => IPrepared,
  ): IPrepared {
    const root: string | null = folder();
    if (root === null) return prepare();
    const file: string = path.join(root, `${name}.json`);
    const asked: string = JSON.stringify(inputs);
    try {
      const entry: IEntry = JSON.parse(
        fs.readFileSync(file, "utf8"),
        decode,
      ) as IEntry;
      if (entry.inputs === asked)
        return { skeleton: entry.skeleton, profile: entry.profile };
    } catch {
      // Missing or unreadable: prepared below.
    }
    const prepared: IPrepared = prepare();
    try {
      fs.mkdirSync(root, { recursive: true });
      for (const other of fs.readdirSync(path.dirname(root)))
        if (other !== path.basename(root))
          fs.rmSync(path.join(path.dirname(root), other), {
            recursive: true,
            force: true,
          });
      const temporary: string = `${file}.${process.pid}.tmp`;
      fs.writeFileSync(
        temporary,
        JSON.stringify(
          {
            inputs: asked,
            skeleton: prepared.skeleton,
            profile: prepared.profile,
          },
          encode,
        ),
      );
      fs.renameSync(temporary, file);
    } catch {
      // A cache that cannot be written only costs the next process time.
    }
    return prepared;
  }

  /** An entry on disk. */
  interface IEntry extends IPrepared {
    /** The inputs it was prepared from, as JSON. */
    inputs: string;
  }

  /** The tag of a number JSON cannot hold. */
  const TAG: string = "\u0000number";

  /** A signed zero or a non-finite number, tagged. */
  const encode = (_: string, value: unknown): unknown =>
    typeof value === "number" &&
    (Object.is(value, -0) || !Number.isFinite(value))
      ? { [TAG]: Object.is(value, -0) ? "-0" : String(value) }
      : value;

  /** A tagged number, read back as itself. */
  const decode = (_: string, value: unknown): unknown =>
    value !== null &&
    typeof value === "object" &&
    TAG in (value as Record<string, unknown>)
      ? Number((value as Record<string, string>)[TAG])
      : value;

  /** This code's directory of entries, or null when the repository is not found. */
  let known: string | null | undefined;

  /** The directory of entries for the code as it stands. */
  function folder(): string | null {
    if (known !== undefined) return known;
    let at: string = process.cwd();
    while (!fs.existsSync(path.join(at, "pnpm-workspace.yaml"))) {
      const up: string = path.dirname(at);
      if (up === at) return (known = null);
      at = up;
    }
    const hash: crypto.Hash = crypto.createHash("sha256");
    for (const pkg of ["human", "engine", "interface"]) {
      const files: string[] = [];
      const walk = (dir: string): void => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full: string = path.join(dir, entry.name);
          if (entry.isDirectory()) walk(full);
          else if (/\.(ts|json)$/.test(entry.name)) files.push(full);
        }
      };
      walk(path.join(at, "packages", pkg, "src"));
      for (const file of files.sort((a: string, b: string): number =>
        a < b ? -1 : a > b ? 1 : 0,
      )) {
        hash.update(path.relative(at, file));
        hash.update(fs.readFileSync(file));
      }
    }
    return (known = path.join(
      at,
      "test",
      ".cache",
      "bodies",
      hash.digest("hex").slice(0, 16),
    ));
  }
}
