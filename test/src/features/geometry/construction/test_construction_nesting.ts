import { type AutoMovieConstructionRealization, realizeAutoMovieConstruction } from "@automovie/engine";

import { ConstructionChecks } from "../../internal/construction/ConstructionChecks";
import { ConstructionRead } from "../../internal/construction/ConstructionRead";
import { ConstructionShapes } from "../../internal/construction/ConstructionShapes";

/**
 * Nesting a construction to depth three realizes the same solid however its
 * joins are grouped: a beam, a post, a finger and a nail merged one onto the
 * next, grouped from the root or from the tip, give one surface.
 *
 * Scenarios:
 * 1. `merge(merge(merge(beam, post), finger), nail)` and `merge(beam, merge(post, merge(finger, nail)))`: both record no diagnostic, and every skin vertex of each, evaluated by its owner coordinates on the other's surface of the same name, lands on its own position within 1e-9 of the beam's radius.
 * 2. Red: the right-grouped assembly at 1.001 times the size reads off the left-grouped one's surfaces.
 *
 * @evidence contracts/testing.md#behavioral-verification Realizes both groupings with `realizeAutoMovieConstruction` and reads each skin's vertices on the other's surfaces (`ConstructionChecks.same`). It catches a realization whose result depends on how the tree is grouped (a host atlas missing a face of a nested part, a seed read on the wrong face, a blend traced against a different host), and a part realized twice; any realization that builds the same faces and trims for the same joins passes.
 * @evidence contracts/testing.md#independent-expectations The kernel's statement of the property: the two trees build the same faces and trims, so their skins are the same surface, compared by evaluating every vertex of one on the other's owner surfaces, within 1e-9 of the part size; vertex order and count may differ. Each part meets only its neighbour in the chain (the finger stands above the beam, the nail on the finger), so grouping cannot change what each join meets.
 * @evidence contracts/testing.md#distinguishing-cases Positive: the two groupings. Negative: the scaled assembly. Determinism and scale belong to `test_construction_determinism`; each join's own geometry to `test_construction_merge`.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include construction_nesting`; it realizes made trees in process and starts no host, browser or GPU.
 */
export function test_construction_nesting(): void {
  const failures: string[] = [];
  const realize: (k: number, nested: "left" | "right") => AutoMovieConstructionRealization.IRealization = (k: number, nested: "left" | "right"): AutoMovieConstructionRealization.IRealization =>
    realizeAutoMovieConstruction({ name: `made.${nested}`, root: ConstructionShapes.assembly(k, nested) }, { chord: 1e-4 * k });
  const left: AutoMovieConstructionRealization.IRealization = realize(1, "left");
  const right: AutoMovieConstructionRealization.IRealization = realize(1, "right");
  for (const [name, r] of [
    ["left", left],
    ["right", right],
  ] as [string, AutoMovieConstructionRealization.IRealization][])
    if (r.diagnostics.length !== 0) failures.push(`${name}: diagnostics ${ConstructionRead.diagnostics(r)}`);
  const tol: number = 1e-9 * 0.03;
  failures.push(...ConstructionChecks.same(left.mesh, ConstructionRead.surfaces(right), tol, 1e-3).slice(0, 10).map((f: string): string => `left on right: ${f}`));
  failures.push(...ConstructionChecks.same(right.mesh, ConstructionRead.surfaces(left), tol, 1e-3).slice(0, 10).map((f: string): string => `right on left: ${f}`));

  // Red: a slightly larger assembly is not the same surface.
  if (ConstructionChecks.same(realize(1.001, "right").mesh, ConstructionRead.surfaces(left), tol, 1e-3).length === 0) failures.push("proof: an assembly 1.001 times larger reads as the same surface");
  if (failures.length !== 0) throw new Error(`${failures.length} nesting failures:\n${failures.join("\n")}`);
}
