import fs from "node:fs";
import path from "node:path";
import ts from "typescript-compiler";

/**
 * The construction levels' import boundary (`packages/human/docs/techniques/construction-levels.md`):
 * each level reads only the levels below it, and a piece never reads a
 * sibling at its own level.
 *
 * Each source file of `packages/human/src` takes its level from its name, by
 * the document's "File names" column, checked from the highest level down so
 * a name carrying two marks takes the higher (an `...Eyebrow` is hair, not a
 * brow piece), except that a level-1 suffix decides first. Shared types and
 * mathematics, which every level reads, are level 0: `structures/`,
 * `typings/`, the loft mathematics of `lofting/` and the merge operators the
 * document names as shared mathematics (`AutoMovieHumanSeam`, `AutoMovieHumanSeamKnot`, `AutoMovieHumanSeamUnion`, `AutoMovieHumanSeamCarve`, `AutoMovieHumanLoftContract`, the splines),
 * procedural noise (`...Noise`) and every interface file `I...`, a declared record of what a level publishes, which as an importer
 * is not judged, since it declares a record and computes nothing. A file
 * whose name carries no mark is unclassified and its edges are not judged.
 *
 * An edge is upward when the importer's level is below the target's, and
 * sideways when both are pieces of the same level 3, 4 or 5 and of different
 * families, each family named by its first mark (an additive lip reading
 * another additive piece, the mouth's deformation reading the eye's aperture);
 * files of one family compose one piece, the oral cavity counted in the mouth's (one aperture and its cavity). The document's one declared feedback, the head's solve
 * of every Farkas measure on the cut skin (`AutoMovieHumanHeadSolve`), is
 * allowed. Imports are read by TypeScript's pre-processor
 * (`ts.preProcessFile`), so static, type-only, re-exported, dynamic and
 * required modules are all found and comments and strings are not.
 */
export namespace HumanLevelIsolation {
  /** One source file as read. */
  export interface IFile {
    /** Path relative to `packages/human/src`, forward slashes. */
    name: string;

    /** The file's text. */
    text: string;
  }

  /** One judged edge that breaks the levels. */
  export interface IEdge {
    /** Importer, relative to `packages/human/src`. */
    importer: string;

    /** One-based line of the import. */
    line: number;

    /** Target, relative to `packages/human/src`, without extension. */
    target: string;

    /** The importer's level. */
    from: number;

    /** The target's level. */
    to: number;

    /** `upward` or `sideways`. */
    kind: "upward" | "sideways";
  }

  /** Absolute path of `packages/human/src`. */
  export const ROOT: string = path.resolve(__dirname, "../../../../../packages/human/src");

  /** Each level's name marks, from the document's "File names" column; level 0 is the shared layer, 8.5 the appearance assembly (8a), which reads every level below it. */
  export const MARKS: ReadonlyArray<readonly [number, RegExp]> = [
    [9, /(Rig|Skeleton|Pose|Binding)/],
    [8.5, /(Appearance)/],
    [8, /(Hair|Eyebrow|Eyelash)/],
    [7, /(BodySurface|SkinChart|Skin\w*Field)/],
    [6, /(Seam(?!Union|Carve)|StationSolve|Strip|Patch)/],
    [5, /(Aperture|Margin|Nostril|Mouth(?!Corner)|OralCavity)/],
    [4, /(Philtrum|Orbit|NoseCrease|Sulcus|Navel)/],
    [3, /(NoseTip|UpperLip|LowerLip|Brow|Forehead|Cheek|Chin|MouthCorner|Malar|JawJoint)/],
    [2, /(Section|Radius|Vault|Profile|Sector|Stations)$/],
    [1, /(Landmarks|Prior|Calibration|Layout)$/],
  ];

  /** The pieces' levels, where a sibling may not read a sibling. */
  export const PIECES: readonly number[] = [3, 4, 5];

  /** The one declared feedback from level 7 to level 1. */
  export const FEEDBACK: readonly string[] = ["generation/AutoMovieHumanHeadSolve"];

  /**
   * A file's level, 0 for the shared layer, null when its name carries no
   * mark. A level-1 suffix (`...Prior`, `...Landmarks`, `...Calibration`,
   * `...Layout`) decides before any other mark, since the document names
   * those files level 1 whatever part they serve (a `...MouthPrior` holds the
   * mouth's inputs, not its aperture). Interface files and noise functions are
   * level 0.
   */
  export function level(name: string): number | null {
    const base: string = path.posix.basename(name).replace(/\.(?:ts|tsx|mts|cts)$/u, "");
    if (/^(structures|typings)\//.test(name) || (name.startsWith("lofting/") && !/(Seam(?!Union|Carve)|StationSolve|Strip|Patch)/.test(base))) return 0;
    if (/^AutoMovieHuman(Seam|SeamKnot|SeamUnion|SeamCarve|LoftContract)$/.test(base) || /(Noise|Spline\w*)$/.test(base) || /^I[A-Z]/.test(base)) return 0;
    const own: string = base.replace(/^I(?=AutoMovieHuman)/, "");
    if (/(Landmarks|Prior|Calibration|Layout)$/.test(own)) return 1;
    for (const [k, mark] of MARKS) if (mark.test(own)) return k;
    return /^I[A-Z]/.test(base) ? 0 : null;
  }

  /**
   * The piece family of a file, its first level mark (such as `Mouth`,
   * `OralCavity` or `Aperture`): files of one family compose one piece, so
   * only an edge between two families of one piece level is sideways.
   */
  export function family(name: string): string | null {
    const base: string = path.posix.basename(name).replace(/\.(?:ts|tsx|mts|cts)$/u, "").replace(/^I(?=AutoMovieHuman)/, "");
    for (const [, mark] of MARKS) {
      const m: RegExpExecArray | null = mark.exec(base);
      if (m !== null) return m[1] === "OralCavity" ? "Mouth" : (m[1] ?? m[0]);
    }
    return null;
  }

  /** Every TypeScript file of `packages/human/src`, in path order. */
  export function read(): IFile[] {
    const out: IFile[] = [];
    walk(ROOT, out);
    return out.sort((a: IFile, b: IFile): number => a.name.localeCompare(b.name));
  }

  /** Every judged edge of the files that breaks the levels. */
  export function edges(files: readonly IFile[]): IEdge[] {
    const known: Set<string> = new Set(files.map((f: IFile): string => f.name.replace(/\.(?:ts|tsx|mts|cts)$/u, "")));
    const out: IEdge[] = [];
    for (const file of files) {
      const from: number | null = level(file.name);
      const self: string = file.name.replace(/\.(?:ts|tsx|mts|cts)$/u, "");

      // An interface file declares a record and reads its members' types; it computes nothing, so its edges are not judged.
      if (from === null || FEEDBACK.includes(self) || /^I[A-Z]/.test(path.posix.basename(file.name))) continue;
      for (const reference of ts.preProcessFile(file.text, true, true).importedFiles) {
        if (!reference.fileName.startsWith(".")) continue;
        let target: string = path.posix.normalize(path.posix.join(path.posix.dirname(file.name), reference.fileName)).replace(/\.(?:ts|js)$/u, "");
        if (!known.has(target) && known.has(`${target}/index`)) target = `${target}/index`;
        const to: number | null = level(`${target}.ts`);
        if (to === null || target === self) continue;
        const kind: IEdge["kind"] | null = from < to ? "upward" : from === to && PIECES.includes(from) && family(file.name) !== family(`${target}.ts`) ? "sideways" : null;
        if (kind !== null) out.push({ importer: file.name, line: file.text.slice(0, reference.pos).split("\n").length, target, from, to, kind });
      }
    }
    return out;
  }

  /** Collect the TypeScript files below a directory. */
  function walk(directory: string, out: IFile[]): void {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const location: string = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(location, out);
      else if (entry.isFile() && /\.(?:ts|tsx|mts|cts)$/u.test(entry.name) && !entry.name.endsWith(".d.ts"))
        out.push({ name: path.relative(ROOT, location).split(path.sep).join("/"), text: fs.readFileSync(location, "utf8") });
    }
  }
}
