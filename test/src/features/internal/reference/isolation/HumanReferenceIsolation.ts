import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";

/**
 * The import boundary of the reference comparison layer: which source files
 * outside the layer's two folders reach a module inside them.
 *
 * The layer compares generated people with the private reference bodies and
 * curve packs, and is deleted as a whole when the anatomical-logic tests cover
 * what it stands in for. That holds only while every edge into it starts
 * inside it, so this namespace reads the module graph of the test program and
 * the packages and lists every edge that crosses into the layer from outside.
 *
 * Imports are read by TypeScript's own pre-processor (`ts.preProcessFile` with
 * import and JavaScript-require detection), the scanner the compiler uses to
 * find a file's dependencies, so static imports, type-only imports,
 * re-exports, dynamic `import()` and `require()` are all found and comments
 * and strings are not. Only relative specifiers can reach the layer, since it
 * belongs to no package; each is resolved against its importer's directory.
 */
export namespace HumanReferenceIsolation {
  /** One source file as read: its absolute path and its text. */
  export interface IFile {
    /** Absolute path of the file. */
    location: string;

    /** The file's TypeScript source text. */
    text: string;
  }

  /** One import edge that enters the layer from outside it. */
  export interface IBreach {
    /** Repository-relative path of the importing file. */
    importer: string;

    /** The specifier as written in the import. */
    specifier: string;

    /** Repository-relative path the specifier resolves to, without extension. */
    target: string;
  }

  /** Absolute repository root. */
  export const ROOT: string = path.resolve(__dirname, "../../../../../..");

  /** The layer's two folders, repository-relative with forward slashes. */
  export const FOLDERS: readonly string[] = [
    "test/src/features/human/reference",
    "test/src/features/internal/reference",
  ];

  /**
   * The source trees whose files are read: the test program and every
   * package. Generated, installed and ignored output below them is skipped by
   * {@link SKIPPED}.
   */
  export const SOURCES: readonly string[] = ["test/src", "packages"];

  /**
   * Directory names never read: installed dependencies, build output and the
   * ignored evidence folders, none of which is maintained source.
   */
  export const SKIPPED: readonly string[] = ["node_modules", "lib", "dist", ".shots", ".references"];

  /**
   * Every TypeScript source file of the given repository-relative trees.
   *
   * @param trees Repository-relative directories to read.
   * @returns The files found, in a stable path order.
   */
  export function read(trees: readonly string[]): IFile[] {
    const out: IFile[] = [];

    for (const tree of trees) walk(path.join(ROOT, tree), out);
    return out.sort((a: IFile, b: IFile): number => a.location.localeCompare(b.location));
  }

  /**
   * Every import edge from a file outside the layer into it.
   *
   * @param files The files whose imports to read; files inside the layer are
   *   read too, and their edges are allowed.
   * @returns Each crossing edge, by importer, specifier and target.
   */
  export function breaches(files: readonly IFile[]): IBreach[] {
    const out: IBreach[] = [];

    for (const file of files) {
      if (inside(file.location)) continue;

      const info: ts.PreProcessedFileInfo = ts.preProcessFile(file.text, true, true);

      for (const reference of info.importedFiles) {
        const specifier: string = reference.fileName;

        // A bare specifier names a package, and no package holds the layer.
        if (!specifier.startsWith(".")) continue;

        const target: string = path.resolve(path.dirname(file.location), specifier);

        if (inside(target))
          out.push({
            importer: relative(file.location),
            specifier,
            target: relative(target).replace(/\.(?:ts|js)$/u, ""),
          });
      }
    }
    return out;
  }

  /**
   * Whether an absolute path lies in one of the layer's folders, compared by
   * whole path segments, so a sibling such as `reference-notes` is outside.
   *
   * @param location Absolute path of a file or a resolved specifier.
   */
  export function inside(location: string): boolean {
    const rel: string = relative(location);

    return FOLDERS.some((folder: string): boolean => rel === folder || rel.startsWith(`${folder}/`));
  }

  /**
   * Repository-relative path with forward slashes.
   *
   * @param location Absolute path.
   */
  function relative(location: string): string {
    return path.relative(ROOT, location).split(path.sep).join("/");
  }

  /**
   * Collect the TypeScript files below a directory, skipping {@link SKIPPED}.
   *
   * @param directory Absolute directory to read.
   * @param out Receives every file found.
   */
  function walk(directory: string, out: IFile[]): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const location: string = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (!SKIPPED.includes(entry.name)) walk(location, out);
        continue;
      }

      if (entry.isFile() && /\.(?:ts|tsx|mts|cts)$/u.test(entry.name) && !entry.name.endsWith(".d.ts"))
        out.push({ location, text: fs.readFileSync(location, "utf8") });
    }
  }
}
