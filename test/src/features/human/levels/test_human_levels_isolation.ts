import { HumanLevelIsolation } from "../../internal/levels/HumanLevelIsolation";

type IFile = HumanLevelIsolation.IFile;
type IEdge = HumanLevelIsolation.IEdge;

/**
 * Pins that the Human construction reads its levels in order: no source file
 * of `packages/human/src` imports a file of a higher construction level, and
 * no additive, subtractive or aperture piece imports a sibling piece of its
 * own level.
 *
 * Scenarios:
 * 1. Made files in memory: an additive nose piece importing the body surface reads one upward edge; an additive lip piece importing another additive piece reads one sideways edge; the body surface importing a base radius reads none.
 * 2. The source tree as it stands: every upward and sideways edge is listed by importer, line, target and both levels, and the unclassified files are counted.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads every TypeScript file of `packages/human/src` from disk, gives each its level by its name from the "File names" column of `packages/human/docs/techniques/construction-levels.md` (`HumanLevelIsolation.MARKS`, the shared types and loft mathematics as level 0), and reads every relative import by TypeScript's own pre-processor, resolving it against its importer. It catches a piece that evaluates the base's guides or a higher level's output, a base cut with its pieces in mind, a seam read before its owner publishes, and an additive piece reading a sibling.
 * @evidence contracts/testing.md#independent-expectations The rule is the document's: each level reads only the levels below it and never a sibling's internals at its own level, with the head's Farkas solve on the cut skin as the one declared feedback. No construction output enters; the test generates nothing. Proven on made files: an upward edge and a sideways edge are each listed with their levels, and a downward edge is not. Oracle limits: a file whose name carries no level mark is not judged and is counted instead, so the table's marks bound what the test sees; an interface file is not judged as an importer, since it declares a record; sideways edges are judged only between different families of the pieces of levels 3 to 5, each family named by its first mark, since a base, a seam family, the surface and one piece are composed of files of their own level.
 * @evidence contracts/testing.md#distinguishing-cases Every file of the Human source tree. The reference layer is erased (#3057); the construction's results to the anatomy and curve tests.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_levels_isolation`, reading files only, with no generation, renderer, browser or GPU.
 */
export function test_human_levels_isolation(): void {
  const failures: string[] = [];

  // Made files in memory.
  const made: IFile[] = [
    { name: "generation/AutoMovieHumanHeadNoseTip.ts", text: 'import { AutoMovieHumanBodySurface } from "./AutoMovieHumanBodySurface";\n' },
    { name: "generation/AutoMovieHumanHeadUpperLip.ts", text: '\nimport type { X } from "./AutoMovieHumanHeadLowerLip";\n' },
    { name: "generation/AutoMovieHumanHeadLowerLip.ts", text: "export type X = number;\n" },
    { name: "generation/AutoMovieHumanBodySurface.ts", text: 'import { AutoMovieHumanHeadRadius } from "./AutoMovieHumanHeadRadius";\n' },
    { name: "generation/AutoMovieHumanHeadRadius.ts", text: "export const R: number = 1;\n" },
  ];
  const read: IEdge[] = HumanLevelIsolation.edges(made);
  const show: (e: IEdge) => string = (e: IEdge): string => `${e.importer}:${e.line} -> ${e.target} (${e.kind}, level ${e.from} to ${e.to})`;
  const want: string[] = [
    "generation/AutoMovieHumanHeadNoseTip.ts:1 -> generation/AutoMovieHumanBodySurface (upward, level 3 to 7)",
    "generation/AutoMovieHumanHeadUpperLip.ts:2 -> generation/AutoMovieHumanHeadLowerLip (sideways, level 3 to 3)",
  ];
  const got: string[] = read.map(show).sort((a: string, b: string): number => a.localeCompare(b));
  if (JSON.stringify(got) !== JSON.stringify(want)) failures.push(`made files read ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);

  // The source tree.
  const files: IFile[] = HumanLevelIsolation.read();
  const unclassified: number = files.filter((f: IFile): boolean => HumanLevelIsolation.level(f.name) === null).length;
  console.log(`  ${files.length} files, ${files.length - unclassified} classified by level, ${unclassified} unclassified`);
  for (const e of HumanLevelIsolation.edges(files)) failures.push(show(e));
  if (failures.length !== 0) throw new Error(`${failures.length} construction level findings:\n${failures.join("\n")}`);
}
