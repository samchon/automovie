import type { AutoMovieHumanBodySurface as Surface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkinCorridor as Corridor } from "../../../../packages/human/src/generation/AutoMovieHumanSkinCorridor";

/** Independent first variation of actual segment lengths over feasible original portal directions. */
export namespace HumanSkinVariation {
  /**
   * Inspect free portal directions and all prefixes/suffixes of active
   * equal-material blocks. Original physical points and edge displacements
   * determine the directional derivative, including zero-segment cusps.
   * Negative, numerically resolved feasible derivatives are counterexamples;
   * absence is a finite necessary-condition check, not a global proof.
   */
  export function inspect(skin: Surface.IGeometry, course: Pick<Corridor.IReading, "bindings">, points: readonly Point[], from: number, to: number): object[] {
    const direction: number = Math.sign(to - from);
    const stations: number[] = course.bindings.map((binding: Corridor.IReading["bindings"][number], index: number): number => !("edge" in binding) ? direction * (index === 0 ? from : to) : direction * ((1 - binding.unit) * skin.coordinates[3 * binding.edge[0] + 1]! + binding.unit * skin.coordinates[3 * binding.edge[1] + 1]!));
    const failures: object[] = [];
    for (let index: number = 1; index < points.length - 1; index++) check(index, index, true);
    for (let first: number = 1; first < points.length - 1;) {
      let last: number = first;
      while (last + 1 < points.length - 1 && Math.abs(stations[last + 1]! - stations[first]!) <= bound(stations[last + 1]!, stations[first]!)) last++;
      if (last > first) {
        for (let end: number = first; end <= last; end++) check(first, end, false);
        for (let start: number = first + 1; start <= last; start++) check(start, last, false);
      }
      first = last + 1;
    }
    return failures;

    /** Build actual affine edge velocities, then test both one-sided feasible perturbations. */
    function check(first: number, last: number, edgeUnit: boolean): void {
      for (const sign of [-1, 1]) {
        const velocities: Point[] = [];
        const materialRates: number[] = [];
        let available: boolean = true;
        for (let index: number = first; index <= last; index++) {
          const binding: Corridor.IReading["bindings"][number] = course.bindings[index]!;
          if (!("edge" in binding)) { available = false; break; }
          const span: number = direction * (skin.coordinates[3 * binding.edge[1] + 1]! - skin.coordinates[3 * binding.edge[0] + 1]!);
          if (!edgeUnit && span === 0) { available = false; break; }
          const unitRate: number = edgeUnit ? sign : sign / span;
          const tolerance: number = 256 * Number.EPSILON * Math.max(1, Math.abs(binding.unit));
          if (unitRate < 0 && binding.unit <= tolerance || unitRate > 0 && binding.unit >= 1 - tolerance) { available = false; break; }
          velocities.push([0, 1, 2].map((axis: number): number => unitRate * (skin.mesh.positions[3 * binding.edge[1] + axis]! - skin.mesh.positions[3 * binding.edge[0] + axis]!)) as Point);
          materialRates.push(unitRate * span);
        }
        if (!available) continue;
        for (let index: number = first; index <= last + 1; index++) {
          const rate: number = (index > last ? 0 : materialRates[index - first]!) - (index === first ? 0 : materialRates[index - first - 1]!);
          if (stations[index]! - stations[index - 1]! <= bound(stations[index]!, stations[index - 1]!) && rate < 0) available = false;
        }
        if (!available) continue;
        const scale: number = Math.max(...velocities.map((v: Point): number => Math.hypot(...v)));
        if (!(scale > 0) || !Number.isFinite(scale)) throw new Error("Independent first variation has unavailable physical edge velocities", { cause: { first, last, velocities, units: "mm per perturbation" } });
        let observed: number = 0;
        let tolerance: number = 0;
        let prior: Point = [0, 0, 0];
        for (let index: number = first; index <= last + 1; index++) {
          const velocity: Point = index > last ? [0, 0, 0] : velocities[index - first]!.map((value: number): number => value / scale) as Point;
          const change: Point = velocity.map((value: number, axis: number): number => value - prior[axis]!) as Point;
          const displacement: Point = points[index]!.map((value: number, axis: number): number => value - points[index - 1]![axis]!) as Point;
          const length: number = Math.hypot(...displacement);
          const speed: number = Math.hypot(...change);
          if (length === 0) observed += speed;
          else {
            observed += displacement.reduce((sum: number, value: number, axis: number): number => sum + value / length * change[axis]!, 0);
            const coordinateResolution: number = 512 * Number.EPSILON * Math.max(1, ...points[index]!.map(Math.abs), ...points[index - 1]!.map(Math.abs));
            tolerance += (32 * Number.EPSILON + 4 * coordinateResolution / length) * speed;
          }
          prior = velocity;
        }
        if (!Number.isFinite(observed) || observed < -tolerance) failures.push({ stage: "independent constrained first variation", first, last, edgeUnit, sign, coordinates: points.slice(first - 1, last + 2), stations: stations.slice(first - 1, last + 2), velocities, observed, expected: ">= 0", deviation: -observed, tolerance, units: "mm per unit perturbation normalized to one mm maximum vertex motion", reason: "A feasible original-portal perturbation shortens the actual physical path" });
      }
    }
  }

  /** Original physical point in millimetres. */
  type Point = [number, number, number];
  /** Arithmetic resolution of original affine material interpolation; no anatomical allowance. */
  function bound(a: number, b: number): number { return 512 * Number.EPSILON * Math.max(1, Math.abs(a), Math.abs(b)); }
}
