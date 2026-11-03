import { HumanLevelStructure } from "../../internal/levels/HumanLevelStructure";

type IFile = HumanLevelStructure.IFile;
type IFinding = HumanLevelStructure.IFinding;

/**
 * Pins that the Human source carries no structural debt: no file that only
 * forwards to another function or holds one constant, no rule written twice
 * in two files, and no module state that outlives its caller, in the library,
 * its tests and their Human helpers.
 *
 * Scenarios:
 * 1. Made files in memory: a forward-only file, a single-constant file, two files of one masked code and a module-scope `Map` cache filled at run time are each listed with their kind; a file with a rule of its own, a fixed lookup `Set` and a `WeakMap` keyed by its caller's object are not.
 * 2. The source tree as it stands: every finding is listed by kind and file.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads every TypeScript file of `packages/human/src`, `test/src/features/human` and the Human helpers of `test/src/features/internal` (`HumanLevelStructure.read`), parses each with TypeScript, and reads its declarations at module and namespace scope and its token stream with names, numbers, strings, comments and imports masked. It catches a forward that should join its owner's table, a one-constant file, two twins of one rule (such as the former lateral and medial malleolus files) and a module cache, such as a `Map` of built parts that a later test reads.
 * @evidence contracts/testing.md#independent-expectations The rules are the skills': the `human` skill's construction gives every piece its own file with a rule of its own and keeps common mathematics in one shared module, and the testing skill builds everything inside the test that needs it and caches nothing across tests. No construction output enters; the test generates nothing. Proven on the made files of scenario 1. Oracle limits: a twin needs at least `TWIN_TOKENS` masked tokens, so two short records of one shape are not judged; a forward is read only where every argument is a parameter passed on as it came; a cache held inside a closure or an object is not seen.
 * @evidence contracts/testing.md#distinguishing-cases Every file of the three folders; barrels (`index.ts`) are not judged, since a barrel only forwards by design. The import boundary between levels belongs to `test_human_levels_isolation`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_levels_structure`, reading files only, with no generation, renderer, browser or GPU.
 */
export function test_human_levels_structure(): void {
  const failures: string[] = [];

  // Made files in memory, the rule of the twins long enough to be judged.
  const rule: string = `export namespace R { export function f(a: number, b: number): number { const c: number = a * a + b * b - 2 * a * b; const d: number = Math.sqrt(Math.abs(c)) + Math.max(a, b) / Math.min(a, b) - Math.hypot(a, b, c); return c > 0 ? d * d - c / 3 + a * 7 - b * 11 : d / 2 + c * 5 - a + b * 13 - Math.atan2(a, b) * Math.cos(c) + Math.sin(d) * Math.exp(-a); } }\n`;
  const made: IFile[] = [
    { name: "made/Forward.ts", text: 'import { B } from "./B";\nexport namespace F { export function f(x: number): number { return B.g(x); } }\n' },
    { name: "made/Constant.ts", text: "export namespace C { export const ONE: number = 1; }\n" },
    { name: "made/TwinA.ts", text: rule },
    { name: "made/TwinB.ts", text: rule.replace("R", "Q").replace("2 * a", "3 * a") },
    { name: "test/made/Cache.ts", text: "const BUILT: Map<string, number> = new Map();\nexport function get(k: string): number { if (!BUILT.has(k)) BUILT.set(k, k.length); return BUILT.get(k) ?? 0; }\n" },
    { name: "made/Own.ts", text: 'const SEEN: WeakMap<object, number> = new WeakMap();\nconst SIDES: Set<string> = new Set(["left", "right"]);\nexport function own(x: number, s: string): number { return 2 * x + (SIDES.has(s) ? 1 : 0) + (SEEN.has(SIDES) ? 1 : 0); }\n' },
  ];
  const got: string[] = HumanLevelStructure.findings(made)
    .map((f: IFinding): string => `${f.kind} ${f.file}`)
    .sort((a: string, b: string): number => a.localeCompare(b));
  const want: string[] = ["constant made/Constant.ts", "forward made/Forward.ts", "state test/made/Cache.ts", "twin made/TwinA.ts", "twin made/TwinB.ts"];
  if (JSON.stringify(got) !== JSON.stringify(want)) failures.push(`made files read ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);

  // The source tree.
  const files: IFile[] = HumanLevelStructure.read();
  console.log(`  ${files.length} files read`);
  for (const f of HumanLevelStructure.findings(files)) failures.push(`${f.kind.padEnd(8)} ${f.file}: ${f.detail}`);
  if (failures.length !== 0) throw new Error(`${failures.length} structural findings:\n${failures.join("\n")}`);
}
