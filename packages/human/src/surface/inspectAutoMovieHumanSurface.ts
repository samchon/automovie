import { AutoMovieBernstein64 as B, type IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieHumanConstructionNet as N } from "../structures/IAutoMovieHumanConstructionNet";
import type { IAutoMovieHumanSurfaceDefinition as D } from "./IAutoMovieHumanSurfaceDefinition";

/**
 * Draw restrictions and coefficients of the exact field consumed by the skin.
 * No independent regional curve factory or previous cage supplies this view.
 * Sixteen local subdivisions per cubic are display polylines without a certified
 * screen-space error. The skin's adaptive tessellation has its own qualification.
 * Coefficient edges are Bezier handles, never claimed to lie on the surface.
 *
 * One pass over courses and incident patch coefficients builds part/side groups.
 * Explicit coefficient IDs deduplicate edges within each group; equal positions
 * do not imply topology. Output arrays transfer to the viewer; no cache is global.
 */
export function inspectAutoMovieHumanSurface(definition: D): N[] {
  const groups: Map<string, N> = new Map();
  const slots: Map<string, Map<number, number>> = new Map();
  const edges: Map<string, Set<string>> = new Map();
  /** Display grouping does not reconstruct placement or semantic ownership. */
  function group(part: string, side: "left" | "right" | null): N {
    const key: string = `${part}/${side}`;
    let result: N | undefined = groups.get(key);
    if (result === undefined) {
      result = {part, side, curves: [], cage: {
        controlRole: "bezier-controls", positions: [], edges: [],
      }};
      groups.set(key, result); slots.set(key, new Map()); edges.set(key, new Set());
    }
    return result;
  }
  for (const course of definition.courses) {
    if (course.role !== "internal-support" && course.patches.length === 0)
      throw new Error(`Exterior construction has no surface consumer: ${course.name}`);
    if (course.patches.some((id: string): boolean => !definition.patches.has(id)))
      throw new Error(`Construction names an unknown surface patch: ${course.name}`);
    const points: number[] = [];
    for (const span of course.curve.spans) {
      const controls: B.Poly = span.map((point: C.Vector): B.Vec => [...point]);
      for (let sample: number = 0; sample < 16; ++sample)
        for (const coordinate of B.value(controls, sample / 16))
          points.push(coordinate / 1000);
    }
    if (!course.curve.closed)
      for (const coordinate of course.curve.spans.at(-1)![3]) points.push(coordinate / 1000);
    group(course.part, course.side).curves.push({
      name: course.name, closed: course.curve.closed, points,
      kind: course.role === "section" ? "station" : course.role === "boundary" ? "ring"
        : course.role === "feature" ? "feature" : "guide",
      designRole: course.role === "boundary" ? "atlas-boundary"
        : course.role === "internal-support" ? "unspecified" : course.role,
      designQualification: course.role === "internal-support"
        ? "Internal constraint; not an exterior skin restriction"
        : "Restriction of the same generated polynomial field as the skin; polyline display is approximate",
    });
  }
  for (const patch of definition.atlas.patches) {
    const owner: D.Patch | undefined = definition.patches.get(patch.id);
    if (owner === undefined) throw new Error(`Missing generated patch owner ${patch.id}`);
    const net: N = group(owner.part, owner.side);
    const key: string = `${owner.part}/${owner.side}`;
    const local: Map<number, number> = slots.get(key)!;
    const seen: Set<string> = edges.get(key)!;
    /** Shared integer coefficient identity owns the control display slot. */
    function slot(id: number): number {
      let index: number | undefined = local.get(id);
      if (index === undefined) {
        const p: D["atlas"]["controls"][number] = definition.atlas.controls[id]!;
        index = net.cage.positions.length / 3;
        local.set(id, index); net.cage.positions.push(p.x, p.y, p.z);
      }
      return index;
    }
    for (let row: number = 0; row < 4; ++row)
      for (let column: number = 0; column < 4; ++column)
        for (const next of [column < 3 ? 4*row+column+1 : -1, row < 3 ? 4*(row+1)+column : -1]) {
          if (next < 0) continue;
          const a: number = patch.controlIds[4*row+column]!;
          const b: number = patch.controlIds[next]!;
          const edge: string = a < b ? `${a}/${b}` : `${b}/${a}`;
          if (seen.has(edge)) continue;
          seen.add(edge); net.cage.edges.push(slot(a), slot(b));
        }
  }
  return [...groups.values()];
}
