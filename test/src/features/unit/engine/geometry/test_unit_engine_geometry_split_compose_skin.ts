import { TestValidator } from "@nestia/e2e";

import { ConstructionSplitCompose as C } from "../../../internal/construction/ConstructionSplitCompose";

/**
 * The composed split's skin is watertight.
 *
 * Fixture: `ConstructionSplitCompose` with lean 0.3, three children and the
 * host, realized with its skin at chord 1e-4 m.
 *
 * Scenarios:
 *
 * 1. Every edge of the skin is used by exactly two triangles, except the edges on
 *    the four free ends (the host's bottom at z = 0.06 m and each child's far
 *    end 60 mm along its axis from the end plane), and by none in more.
 */
export function test_unit_engine_geometry_split_compose_skin(): void {
  const real = C.realize(C.split({ lean: C.LEAN }), true);
  TestValidator.equals("diagnostics", real.diagnostics.length, 0);
  const uses: Map<string, number> = new Map();
  const ix: number[] = real.mesh.indices;
  for (let i: number = 0; i + 2 < ix.length; i += 3)
    for (let e: number = 0; e < 3; ++e) {
      const p: number = ix[i + e]!;
      const q: number = ix[i + ((e + 1) % 3)]!;
      const key: string = p < q ? `${p},${q}` : `${q},${p}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  const leans: [number, number][] = [
    [15, C.LEAN],
    [0, 0],
    [-15, -C.LEAN],
  ];
  const free = (v: number): boolean => {
    const p: number[] = [0, 1, 2].map(
      (a: number): number => 1000 * real.mesh.positions[3 * v + a]!,
    );
    return (
      Math.abs(p[2]! - 60) < 1e-4 ||
      leans.some(
        ([x, lean]: [number, number]): boolean =>
          Math.abs(
            C.dot(
              [Math.sin(lean), 0, -Math.cos(lean)],
              [p[0]! - x, p[1]!, p[2]! + 30],
            ) - 60,
          ) < 1e-4,
      )
    );
  };
  let open: number = 0;
  let over: number = 0;
  for (const [key, count] of uses) {
    if (count > 2) ++over;
    if (
      count === 1 &&
      !key.split(",").every((v: string): boolean => free(Number(v)))
    )
      ++open;
  }
  TestValidator.equals("open edges", open, 0);
  TestValidator.equals("over-used edges", over, 0);
}
