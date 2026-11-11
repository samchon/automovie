import { AutoMovieHumanF1, AutoMovieHumanF1Joints } from "@automovie/human";

/**
 * f1's sewn body as `AutoMovieHumanF1.create()` generates it, against what a body is.
 *
 * Scenarios:
 * 1. One piece without a diagnostic: the generation yields the single piece `body`, with triangles and no engine diagnostic.
 * 2. A closed skin: every edge of the piece is used by exactly two triangles, and the triangles hang together as one component.
 * 3. The figure's own size: the crown stands at the trunk's tip on its axis (the axis's foot plus the tip's station) within 1 mm, the soles within 5 mm of the ground, and the piece's extent to the two sides differs by under 2 mm, since both sides are the same families reflected.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1.create()`, the figure's public producer, and reads the mesh it returns: its diagnostics, its edges and its bounds.
 * @evidence contracts/development/testing.md#independent-expectations A closed surface's edge rule and connectedness, and heights taken from the datum module and the trunk's own tip, not from the generated mesh.
 * @evidence contracts/development/testing.md#distinguishing-cases A refused part leaves a diagnostic, a missing band leaves edges used once, a part not sewn leaves a second component, and a wrong course or twin moves the bounds.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit that realizes the whole body once, about half a minute, reached by `--include human_f1_body`; it is the only test that runs the figure's realization.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the property of a body it checks and its tolerance.
 */
export function test_human_f1_body(): void {
  const failures: string[] = [];
  const pieces: AutoMovieHumanF1.IPiece[] = AutoMovieHumanF1.create();

  // 1. One piece, no diagnostic.
  if (pieces.length !== 1 || pieces[0]!.name !== "body") failures.push(`pieces: ${pieces.map((piece: AutoMovieHumanF1.IPiece): string => piece.name).join(", ")}`);
  const body: AutoMovieHumanF1.IPiece = pieces[0]!;
  if (body.diagnostics.length !== 0) failures.push(`${body.diagnostics.length} diagnostics: ${body.diagnostics.slice(0, 3).join(" | ").slice(0, 600)}`);
  if (body.indices.length === 0) failures.push("the body has no triangle");

  // 2. Closed and connected.
  const count: number = body.positions.length / 3;
  const uses: Map<number, number> = new Map();
  const parent: number[] = Array.from({ length: count }, (_: unknown, i: number): number => i);
  const find = (i: number): number => {
    let root: number = i;
    while (parent[root] !== root) root = parent[root]!;
    while (parent[i] !== root) {
      const next: number = parent[i]!;
      parent[i] = root;
      i = next;
    }
    return root;
  };
  for (let t: number = 0; t + 2 < body.indices.length; t += 3)
    for (let e: number = 0; e < 3; ++e) {
      const a: number = body.indices[t + e]!;
      const b: number = body.indices[t + ((e + 1) % 3)]!;
      const key: number = Math.min(a, b) * count + Math.max(a, b);
      uses.set(key, (uses.get(key) ?? 0) + 1);
      parent[find(a)] = find(b);
    }
  let open: number = 0;
  let over: number = 0;
  for (const used of uses.values()) {
    if (used === 1) ++open;
    if (used > 2) ++over;
  }
  if (open !== 0 || over !== 0) failures.push(`skin: ${open} edges used once and ${over} used more than twice, of ${uses.size}`);
  const components: Set<number> = new Set();
  for (let t: number = 0; t < body.indices.length; t += 3) components.add(find(body.indices[t]!));
  if (components.size !== 1) failures.push(`the triangles form ${components.size} components`);

  // 3. Size, mm.
  const bound = (axis: number, pick: (...values: number[]) => number): number => {
    let value: number = body.positions[axis]!;
    for (let i: number = axis; i < body.positions.length; i += 3) value = pick(value, body.positions[i]!);
    return value * 1000;
  };
  const crown: number = AutoMovieHumanF1Joints.axisFloor[1] + AutoMovieHumanF1.BODY.trunk.tips![1]!.tip;
  if (!(Math.abs(bound(1, Math.max) - crown) <= 1)) failures.push(`the crown stands at ${bound(1, Math.max)} mm, the trunk's tip at ${crown} mm`);
  if (!(Math.abs(bound(1, Math.min)) <= 5)) failures.push(`the soles stand at ${bound(1, Math.min)} mm`);
  if (!(Math.abs(bound(2, Math.max) + bound(2, Math.min)) <= 2)) failures.push(`the sides reach ${bound(2, Math.max)} and ${bound(2, Math.min)} mm`);

  if (failures.length > 0) throw new Error("human f1 body:\n" + failures.join("\n"));
}
