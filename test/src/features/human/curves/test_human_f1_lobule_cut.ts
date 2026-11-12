import { realizeAutoMovieConstruction } from "@automovie/engine";
import { AutoMovieHumanF1, AutoMovieHumanF1Joints } from "@automovie/human";
import type { AutoMovieConstructionNode } from "@automovie/interface";

/**
 * A cut that runs over a face's skin outside a hole and starts and ends on that hole widens the hole; it does not give the face the hole's
 * inside back. On f1's head.
 *
 * Scenario: f1's trunk with its +Z ear attached at the auricle's port, exactly as the construction declares them, and the gap under the
 * lobule cut after it (`AutoMovieHumanF1Lobule`). The cut's host rail runs over the trunk's skin under the port's loop and crosses onto the
 * ear's band and back, so on the trunk it is one run whose two ends lie on the port's hole. Of the two cycles that run and the hole's two
 * arcs make, both keep the skin just past the rail and remove the skin just before it: one is the hole widened by the cut, the other the
 * cut's own region, which would keep the trunk's skin inside the port's loop. Before the change the second was kept, and the trunk's
 * skin stood again under the whole auricle, inside the ear and across the gap under the lobule (69 to 77 mm out at x 0 to 10, 1,560 to
 * 1,600 mm high, where the port had taken it away). The trunk keeps none of its triangles inside the auricle's loop, drawn in by a tenth of each semi-axis.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Realizes the construction's own nodes through `realizeAutoMovieConstruction` and reads the trunk's triangles.
 * @evidence contracts/development/testing.md#independent-expectations The loop is the auricle's from its datums (`AutoMovieHumanF1Joints.earBase`, `earHalf`, a 6 mm margin): a port removes the host's skin inside its loop, whatever any later cut does.
 * @evidence contracts/development/testing.md#distinguishing-cases A refused cut leaves a diagnostic, a cut that gives the hole back leaves trunk triangles inside the loop; only the widened hole passes.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit that realizes the head and one ear, about twenty-five seconds, reached by `--include human_f1_lobule_cut`.
 * @evidence contracts/development/common.md#meaningful-documentation States the configuration, the two candidates and what each leaves.
 */
export function test_human_f1_lobule_cut(): void {
  const declared: AutoMovieHumanF1.IConstruction = AutoMovieHumanF1.construction();
  const find = (node: AutoMovieConstructionNode, name: string): AutoMovieConstructionNode | null => {
    if (node.name === name) return node;
    const below: AutoMovieConstructionNode[] = node.type === "join" || node.type === "port" ? [node.host, node.part] : node.type === "split" ? [node.host, ...node.children.map((child): AutoMovieConstructionNode => child.part)] : [];
    for (const inner of below) {
      const hit: AutoMovieConstructionNode | null = find(inner, name);
      if (hit !== null) return hit;
    }
    return null;
  };
  const port: AutoMovieConstructionNode | null = find(declared.root, "auricle.ear");
  const cut: AutoMovieConstructionNode | null = find(declared.root, "cut.lobule");
  if (port === null || port.type !== "port" || cut === null || cut.type !== "join") throw new Error("f1 lobule cut: the construction has no +Z auricle port or lobule cut");
  const root: AutoMovieConstructionNode = { ...cut, host: { ...port, host: { type: "source", name: "trunk", source: "trunk" } } };
  const real: ReturnType<typeof realizeAutoMovieConstruction> = realizeAutoMovieConstruction({ name: "f1.lobule", root }, { chord: 0.001, sources: declared.sources });
  if (real.diagnostics.length > 0) throw new Error("f1 lobule cut: " + JSON.stringify(real.diagnostics));

  // The auricle's loop in the trunk's chart, its station the height above the trunk axis's foot and its phase the angle about that
  // vertical axis from +X toward +Z, drawn in by a tenth of each semi-axis.
  const loop = AutoMovieHumanF1.auricle(1);
  const foot: number = AutoMovieHumanF1Joints.axisFloor[1];
  const trunk: number = real.mesh.owners.indexOf("trunk");
  const P: number[] = real.mesh.positions;
  let inside: number = 0;
  for (let t: number = 0; t < real.mesh.indices.length; t += 3) {
    if (real.mesh.coordinates[real.mesh.indices[t]! * 3] !== trunk) continue;
    const c: number[] = [0, 1, 2].map((k: number): number => ((P[real.mesh.indices[t]! * 3 + k]! + P[real.mesh.indices[t + 1]! * 3 + k]! + P[real.mesh.indices[t + 2]! * 3 + k]!) / 3) * 1000);
    const station: number = (c[1]! - foot) / 1000;
    const phase: number = Math.atan2(c[2]!, c[0]!);
    if (((station - loop.centre[0]) / (0.9 * loop.semi[0])) ** 2 + ((phase - loop.centre[1]) / (0.9 * loop.semi[1])) ** 2 < 1) inside++;
  }
  if (trunk < 0 || inside > 0) throw new Error(`f1 lobule cut: the trunk keeps ${inside} triangles inside the auricle's loop`);
}
