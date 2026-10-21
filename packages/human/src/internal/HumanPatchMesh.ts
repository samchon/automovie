import type { IAutoMovieModelPart } from "@automovie/interface";
import type { HumanCurve } from "./HumanCurve";
import type { HumanCurveMesh } from "./HumanCurveMesh";
import type { HumanSurface } from "./HumanSurface";

/** Sample independently generated regular patch domains and their construction.
 * A named boundary has one actual function authority across the whole assembly.
 * The emitter introduces no shape, boundary weld, hole mask or source normal.
 */
export namespace HumanPatchMesh {
  /** Geometry and visible curves generated from the same surface evaluator. */
  export interface Result {
    /** Ordinary new triangle geometry in model metres. */
    part: IAutoMovieModelPart;
    /** Exact patch isolines sampled for the displayed construction. */
    construction: HumanCurveMesh.Line[];
  }

  /** Emit one rectangular domain under a shared dyadic sampling resolution.
   * Chart boundaries must be consumed by their defining formula and orientation;
   * this registry refuses two independent authorities with the same identity.
   * Analytic first derivatives supply all normals. Singular surface jets fail
   * rather than receiving an invented normal or a small collapsed ring.
   * For R=2^depth, work and output storage are O(R²) plus the evaluator's cost.
   * The caller owns the registry's assembly lifetime and returned resources.
   */
  export function build(patch: HumanSurface.Patch, boundaryRegistry: Map<string, HumanSurface.Boundary>, depth: number = 4): Result {
    if (!patch.id || !Number.isSafeInteger(depth) || depth < 1 || depth > 8 || (patch.outwardSign !== 1 && patch.outwardSign !== -1) || ![patch.u, patch.v].every((range: HumanSurface.Patch["u"]): boolean => Number.isFinite(range.start) && Number.isFinite(range.end) && range.end > range.start && Number.isFinite(range.end - range.start) && range.unit.length > 0)) throw new Error("Regular patch emission requires named finite directed domains and bounded dyadic sampling");
    for (const edge of Object.values(patch.boundaries)) {
      const previous: HumanSurface.Boundary | undefined = boundaryRegistry.get(edge.curve.id);
      if (!edge.curve.id || !edge.curve.unit || !Number.isFinite(edge.curve.start) || !Number.isFinite(edge.curve.end) || !(edge.curve.end > edge.curve.start) || (edge.orientation !== 1 && edge.orientation !== -1)) throw new Error("Patch boundary has no admitted canonical physical parameter");
      if (previous !== undefined && previous !== edge.curve) throw new Error("Multiple generating authorities claim patch boundary " + edge.curve.id);
      boundaryRegistry.set(edge.curve.id, edge.curve);
    }
    const count: number = 2 ** depth;
    const us: readonly number[] = samples(patch.sampling?.u, patch.u), vs: readonly number[] = samples(patch.sampling?.v, patch.v);
    const columns: number = us.length, rows: number = vs.length;
    const positions: number[] = [], normals: number[] = [], indices: number[] = [];
    for (let row: number = 0; row < rows; row++)
      for (let column: number = 0; column < columns; column++) {
        const u: number = us[column]!, v: number = vs[row]!;
        const jet: ReturnType<HumanSurface.Patch["jet"]> = patch.jet(u, v);
        if (![jet.positionMm, jet.derivativeU, jet.derivativeV].every((value: HumanCurve.Vector): boolean => value.length === 3 && value.every(Number.isFinite))) throw new Error("Patch evaluator returned a nonfinite physical jet: " + patch.id);
        const a: HumanCurve.Vector = jet.derivativeU, b: HumanCurve.Vector = jet.derivativeV;
        const normal: HumanCurve.Vector = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
        const length: number = Math.hypot(...normal);
        if (!(length > 0 && Number.isFinite(length))) throw new Error("Patch has an unresolved singular surface jet: " + patch.id);
        positions.push(...jet.positionMm.map((value: number): number => value / 1000));
        normals.push(...normal.map((value: number): number => patch.outwardSign * value / length));
      }
    for (let row: number = 0; row < rows-1; row++)
      for (let column: number = 0; column < columns-1; column++) {
        const a: number = row * columns + column, b: number = a + 1, d: number = a + columns, c: number = d + 1;
        if (patch.outwardSign === 1) indices.push(a, b, c, a, c, d); else indices.push(a, c, b, a, d, c);
      }
    const construction: HumanCurveMesh.Line[] = [];
    for (let index: number = 0; index < columns; index++) construction.push({ id: patch.id + ".u." + index, points: Array.from({ length: rows }, (_unused: unknown, row: number): HumanCurve.Vector => point(index, row)) });
    for (let index: number = 0; index < rows; index++) construction.push({ id: patch.id + ".v." + index, points: Array.from({ length: columns }, (_unused: unknown, column: number): HumanCurve.Vector => point(column, index)) });
    return { part: { id: patch.id, name: patch.id, material: null, attachedBone: null, transform: null, geometry: { type: "mesh", mesh: { positions, normals, indices, uvs: null, skin: null } } }, construction };

    /** Construction reads the already emitted samples of that same evaluator. */
    function point(column: number, row: number): HumanCurve.Vector {
      const offset: number = 3 * (row * columns + column);
      return [positions[offset]!, positions[offset + 1]!, positions[offset + 2]!];
    }
    /** Common owners supply exact boundary addresses; no rounded deduplication. */
    function samples(supplied: readonly number[] | undefined, range: HumanSurface.Patch["u"]): readonly number[] {
      if (supplied === undefined) return Array.from({ length: count+1 }, (_unused: unknown, index: number): number => index === count ? range.end : range.start+(range.end-range.start)*index/count);
      if (supplied.length < 2 || supplied.length > 8193 || supplied[0] !== range.start || supplied.at(-1) !== range.end || supplied.some((value: number, index: number): boolean => !Number.isFinite(value) || (index > 0 && !(value > supplied[index-1]!)))) throw new Error("Shared patch samples must retain finite ordered physical endpoints");
      return supplied;
    }
  }
}
