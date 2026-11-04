import type { HumanSkinIntegrity } from "./HumanSkinIntegrity";
import { HumanSkinIntegrityEuler as Euler } from "./HumanSkinIntegrityEuler";
import { HumanSkinIntegrityPatch as Patch } from "./HumanSkinIntegrityPatch";
import type { HumanSkinIntegrityTopology } from "./HumanSkinIntegrityTopology";
import { HumanSkinIntegrityVector as Vec } from "./HumanSkinIntegrityVector";

/**
 * The skin read along the seams of its construction: the patch each region
 * (chain) lays on the composed skin, the seams where two regions meet, and the
 * whole. Every finding names the region or the seam it lies on.
 *
 * This reads the composed skin; it is not a test of a region built alone from
 * its fixed inputs, which belongs to the region's own unit once its division
 * is declared complete.
 */
export namespace HumanSkinIntegrityDecomposition {
  /**
   * The turning angle between the normals of two adjacent triangles beyond
   * which the skin folds back on itself at an edge, degrees. A right angle is
   * the sharpest crease a single sheet of skin keeps without a flap: past it
   * the two faces overhang each other. Anatomy has creases (axilla, groin,
   * elbow), but those are concave turns that stay within it at the mesh's
   * edge length.
   */
  export const FOLD: number = 90;

  /** Every decomposition finding of a mesh. */
  export function findings(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    areas: Float64Array,
  ): HumanSkinIntegrity.IFinding[] {
    const out: HumanSkinIntegrity.IFinding[] = [];

    // The patch of every region on the composed skin.
    const byRegion: Map<number, number[]> = new Map();

    for (let t: number = 0; t < mesh.I.length / 3; t++) {
      const region: number = mesh.tri[t] ?? -1;
      const list: number[] | undefined = byRegion.get(region);

      if (list === undefined) byRegion.set(region, [t]);
      else list.push(t);
    }

    let inRegions: number = 0;

    for (const triangles of byRegion.values())
      for (const component of Euler.components(mesh, topo, triangles)) {
        // The edge rules already report an edge with three users or two windings.
        if (!component.manifold) continue;

        // A boundary that is not simple closed loops is pinched at a seam; a handle fuses what anatomy leaves apart.
        if (!component.simple) out.push(measured(mesh, areas, "pinched seam", component.triangles, 0));
        else if (component.genus > 0) {
          out.push(measured(mesh, areas, "handle", component.triangles, component.genus));
          inRegions += component.genus;
        }
      }

    // The whole: one connected skin, and a handle only when the regions do not already account for it.
    const whole: Euler.IComponent[] = Euler.components(
      mesh,
      topo,
      Array.from({ length: mesh.I.length / 3 }, (_: unknown, t: number): number => t),
    );

    whole.sort((a: Euler.IComponent, b: Euler.IComponent): number => b.faces - a.faces);

    for (const [k, component] of whole.entries()) {
      if (k > 0) out.push(measured(mesh, areas, "separate component", component.triangles, 0));
      else if (component.manifold && component.simple && component.genus > 0 && inRegions === 0)
        out.push(measured(mesh, areas, "handle", component.triangles, component.genus));
    }

    out.push(...creases(mesh, topo, areas));

    return out;
  }

  /** A patch as a finding with a measurement. */
  function measured(
    mesh: HumanSkinIntegrity.IMesh,
    areas: Float64Array,
    kind: HumanSkinIntegrity.Kind,
    patch: number[],
    measure: number,
  ): HumanSkinIntegrity.IFinding {
    const out: HumanSkinIntegrity.IFinding = Patch.finding(mesh, areas, kind, patch);

    out.measure = measure;

    return out;
  }

  /**
   * Seam edges where the two regions' normals turn past {@link FOLD}, grouped
   * by the pair of regions and joined where they touch.
   */
  function creases(
    mesh: HumanSkinIntegrity.IMesh,
    topo: HumanSkinIntegrityTopology,
    areas: Float64Array,
  ): HumanSkinIntegrity.IFinding[] {
    const byPair: Map<string, number[]> = new Map();
    const angle: Map<number, number> = new Map();

    for (let e: number = 0; e < topo.edges; e++) {
      if (topo.uses(e) !== 2 || !topo.consistent(e)) continue;

      // Only an edge between two regions is a seam.
      const t1: number = Math.floor(topo.users[topo.offset[e]!]! / 3);
      const t2: number = Math.floor(topo.users[topo.offset[e]! + 1]! / 3);
      const r1: number = mesh.tri[t1] ?? -1;
      const r2: number = mesh.tri[t2] ?? -1;

      if (r1 === r2 || areas[t1]! <= 0 || areas[t2]! <= 0) continue;

      // The angle the unit normals turn by across the edge.
      const n1: Vec.V3 = unit(Vec.normal(mesh.P, mesh.I[3 * t1]!, mesh.I[3 * t1 + 1]!, mesh.I[3 * t1 + 2]!));
      const n2: Vec.V3 = unit(Vec.normal(mesh.P, mesh.I[3 * t2]!, mesh.I[3 * t2 + 1]!, mesh.I[3 * t2 + 2]!));
      const turn: number = (Math.acos(Math.max(-1, Math.min(1, Vec.dot(n1, n2)))) * 180) / Math.PI;

      if (!(turn > FOLD)) continue;

      const key: string = `${Math.min(r1, r2)},${Math.max(r1, r2)}`;
      const list: number[] | undefined = byPair.get(key);

      angle.set(e, turn);

      if (list === undefined) byPair.set(key, [e]);
      else list.push(e);
    }

    const out: HumanSkinIntegrity.IFinding[] = [];

    for (const edges of byPair.values())
      for (const group of Patch.edgeGroups(topo, edges)) {
        const found: HumanSkinIntegrity.IFinding = Patch.edgeFinding(mesh, topo, areas, "seam crease", group);

        found.measure = Math.max(...group.map((e: number): number => angle.get(e)!));
        out.push(found);
      }

    return out;
  }

  /** A vector scaled to unit length. */
  function unit(v: Vec.V3): Vec.V3 {
    const length: number = Math.hypot(...v);

    return [v[0] / length, v[1] / length, v[2] / length];
  }
}
