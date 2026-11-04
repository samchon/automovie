import { AutoMovieHumanBodySurface } from "../../../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { HumanPeople } from "../../../internal/HumanPeople";

/**
 * A reading, not a check: how many of the skin's vertices carry their loft
 * coordinates (chain, station, phase), and, of those that do not, which
 * triangle groups use them, so the owners that still publish no parameters
 * for their points can be listed.
 *
 * Scenarios:
 * 1. For each person of `HumanPeople` (or `AUTOMOVIE_HUMAN_PEOPLE`), the skin's vertex count, the vertices with all three coordinates, those with a phase of NaN (pole apexes) and those with none, the last grouped by the chain of the first triangle group that uses each.
 *
 * @evidence contracts/testing.md#behavioral-verification Lofts each person's skin (`AutoMovieHumanBodySurface.generate`) and reads its `coordinates` buffer against its triangle groups, printing the counts by kind and, for vertices with no coordinates, by the chain part of the group name of their first triangle.
 * @evidence contracts/testing.md#independent-expectations No expectation: a reading kept in its own removable file that no real test imports.
 * @evidence contracts/testing.md#distinguishing-cases Every core person.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_loft_coordinate_reading`, lofting in process with no browser or GPU.
 */
export function test_human_loft_coordinate_reading(): void {
  for (const name of HumanPeople.names()) {
    const body: HumanPeople.IPerson["body"] = HumanPeople.person(name).body;
    const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(body, []);
    const count: number = surface.mesh.positions.length / 3;
    let full: number = 0;
    let apex: number = 0;
    const none: Set<number> = new Set();
    for (let v: number = 0; v < count; v++) {
      const [c, s, t] = [surface.coordinates[3 * v]!, surface.coordinates[3 * v + 1]!, surface.coordinates[3 * v + 2]!];
      if (Number.isFinite(c) && Number.isFinite(s) && Number.isFinite(t)) full++;
      else if (Number.isFinite(c) && Number.isFinite(s)) apex++;
      else none.add(v);
    }
    const byGroup: Map<string, number> = new Map();
    const seen: Set<number> = new Set();
    surface.mesh.groups.forEach((g: { name: string; start: number }, k: number): void => {
      const end: number = surface.mesh.groups[k + 1]?.start ?? surface.mesh.indices.length;
      const chain: string = g.name.includes("/") ? g.name.slice(0, g.name.lastIndexOf("/")) : g.name;
      for (let i: number = g.start; i < end; i++) {
        const v: number = surface.mesh.indices[i]!;
        if (!none.has(v) || seen.has(v)) continue;
        seen.add(v);
        byGroup.set(chain, (byGroup.get(chain) ?? 0) + 1);
      }
    });
    const rows: string[] = [...byGroup.entries()].sort((a: [string, number], b: [string, number]): number => b[1] - a[1]).map(([g, n]: [string, number]): string => `${g} ${n}`);
    console.log(`  ${name}: ${count} vertices, ${full} with coordinates, ${apex} pole apexes, ${none.size} without (${none.size - seen.size} unused); without, by group: ${rows.join(", ")}`);
  }
}
