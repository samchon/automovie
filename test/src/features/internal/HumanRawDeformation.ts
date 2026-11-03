import { HumanRawGeometry as G } from "./HumanRawGeometry";

/** Independent first fundamental forms of actual bind and posed triangle buffers. */
export namespace HumanRawDeformation {
  /** One material triangle's exact output coordinates and physical stretch readings. */
  export interface Row {
    /** Original material face index, preserved across bind and pose. */
    triangle: number;

    /** Bind XYZ corners in millimetres. */
    bind: readonly [G.Point, G.Point, G.Point];

    /** Posed XYZ corners in millimetres. */
    posed: readonly [G.Point, G.Point, G.Point];

    /** Largest principal linear stretch; null means unresolved. */
    maximum: number | null;

    /** Smallest principal linear stretch; null means unresolved. */
    minimum: number | null;

    /** Posed area over bind area; null means unresolved. */
    areaRatio: number | null;

    /** Bind altitude over the first material edge length; a very small ratio exposes a thin basis. */
    bindHeightRatio: number | null;

    /** Two-norm condition number of the actual bind edge basis, before deformation. */
    basisCondition: number | null;

    /** One world-coordinate double-precision scale over the least bind altitude; diagnostic only. */
    worldResolutionOverAltitude: number | null;

    /** Actual tangent basis dot/norm residual; no value is inferred from a pose formula. */
    orthogonalityResidual: number | null;

    /** Conservative dimensionless arithmetic screen, not an anatomical allowance or certified interval. */
    arithmeticScreen: number | null;

    /** Exact invalid material geometry or arithmetic refusal. */
    reason: string | null;
  }
  /** Finite deformation is an observation, never proof of no skin collision. */
  export interface Report {
    /** Missing, mismatched or unresolved actual geometry stays red. */
    status: "OBSERVED" | "FAIL";

    /** Every actual material face, including every unresolved reading. */
    rows: Row[];

    /** Complete buffer-level or material correspondence failures. */
    issues: (G.Issue & { stage: string })[];

    /** Worst finite actual principal stretch, or null without support. */
    maximum: number | null;

    /** Least finite actual area ratio, or null without support. */
    minimumAreaRatio: number | null;
  }
  /**
   * Read singular values of the affine deformation restricted to each material triangle.
   * The bind's orthonormal tangent basis determines its first fundamental form.
   * This reader uses no rig, weights, clinical angles or production pose formulas.
   * It does not infer material failure, collision freedom or closed-body volume
   * from finite strain; those need their own independent facts and observations.
   */
  export function read(bind: G.Mesh, posed: G.Mesh): Report {
    const issues: (G.Issue & { stage: string })[] = [];
    for (const issue of G.inspect(bind)) issues.push({ ...issue, stage: "bind" });
    for (const issue of G.inspect(posed)) issues.push({ ...issue, stage: "posed" });
    const rows: Row[] = [];
    if (issues.length !== 0) return { status: "FAIL", rows, issues, maximum: null, minimumAreaRatio: null };
    if (bind.positions.length !== posed.positions.length || bind.indices.length !== posed.indices.length) issues.push({ stage: "material correspondence", triangle: null, vertex: null, coordinate: null, reason: `Bind/posed cardinalities differ: positions ${bind.positions.length}/${posed.positions.length}, indices ${bind.indices.length}/${posed.indices.length}` });
    for (let i: number = 0; i < Math.min(bind.indices.length, posed.indices.length); i++) if (bind.indices[i] !== posed.indices[i]) issues.push({ stage: "material correspondence", triangle: Math.floor(i / 3), vertex: bind.indices[i]!, coordinate: G.vertex(bind, bind.indices[i]!), reason: `Material index ${i} differs: ${bind.indices[i]} vs ${posed.indices[i]}` });
    if (issues.length !== 0) return { status: "FAIL", rows, issues, maximum: null, minimumAreaRatio: null };
    let maximum: number = 0; let minimumAreaRatio: number = Infinity;
    for (let face: number = 0; face < bind.indices.length / 3; face++) {
      const original: readonly [G.Point, G.Point, G.Point] = G.triangle(bind, face);
      const moved: readonly [G.Point, G.Point, G.Point] = G.triangle(posed, face);
      const row: Row = { triangle: face, bind: original, posed: moved, maximum: null, minimum: null, areaRatio: null, bindHeightRatio: null, basisCondition: null, worldResolutionOverAltitude: null, orthogonalityResidual: null, arithmeticScreen: null, reason: null };
      const ab: G.Point = G.sub(original[1], original[0]); const ac: G.Point = G.sub(original[2], original[0]);
      const length: number = Math.hypot(...ab); const r12: number = G.dot(ac, ab) / length;
      const r22: number = Math.hypot(...G.cross(ab, ac)) / length;
      const tangent: G.Point = ab.map((value: number): number => value / length) as unknown as G.Point;
      const across: G.Point = ac.map((value: number, axis: number): number => (value - r12 * tangent[axis]!) / r22) as unknown as G.Point;
      const longest: number = Math.max(length, Math.hypot(...ac), Math.hypot(...G.sub(original[2], original[1])));
      const altitude: number = Math.hypot(...G.cross(ab, ac)) / longest;
      const bindTrace: number = length ** 2 + r12 ** 2 + r22 ** 2;
      const bindLargest: number = (bindTrace + Math.hypot(length ** 2 - r12 ** 2 - r22 ** 2, 2 * length * r12)) / 2;
      const condition: number = bindLargest / (length * r22);
      const residual: number = Math.max(Math.abs(Math.hypot(...tangent) - 1), Math.abs(Math.hypot(...across) - 1), Math.abs(G.dot(tangent, across)));
      // gamma_128 is an operation-count engineering screen for the Gram reader.
      // Squared conditioning reflects the first-fundamental-form sensitivity.
      // It is explicitly not a certified error interval for Math.hypot or skin material.
      const screen: number = 128 * Number.EPSILON / (1 - 128 * Number.EPSILON) * Math.max(1, condition ** 2);
      row.bindHeightRatio = r22 / length; row.basisCondition = condition;
      row.worldResolutionOverAltitude = Number.EPSILON * Math.max(1, ...original.flatMap((point: G.Point): number[] => Array.from(point, Math.abs))) / altitude;
      row.orthogonalityResidual = residual; row.arithmeticScreen = screen;
      const first: G.Point = G.sub(moved[1], moved[0]).map((value: number): number => value / length) as unknown as G.Point;
      const second: G.Point = G.sub(moved[2], moved[0]).map((value: number, axis: number): number => (value - first[axis]! * r12) / r22) as unknown as G.Point;
      const c11: number = G.dot(first, first); const c12: number = G.dot(first, second); const c22: number = G.dot(second, second);
      const eigenvalue: number = (c11 + c22 + Math.hypot(c11 - c22, 2 * c12)) / 2;
      const area: number = Math.hypot(...G.cross(first, second));
      const largest: number = Math.sqrt(eigenvalue); const smallest: number = area / largest;
      if (![length, r12, r22, ...first, ...second, c11, c12, c22, eigenvalue, area, largest, smallest, row.bindHeightRatio, condition, row.worldResolutionOverAltitude, residual, screen].every(Number.isFinite) || r22 <= 0 || largest <= 0 || smallest <= 0 || area <= 0 || screen >= 1 || residual > screen) row.reason = "UNAVAILABLE: unresolved/collapsed material metric or insufficient numeric basis support; original corners and conditioning remain attached, and no strain value is admitted";
      else { row.maximum = largest; row.minimum = smallest; row.areaRatio = area; maximum = Math.max(maximum, largest); minimumAreaRatio = Math.min(minimumAreaRatio, area); }
      rows.push(row);
    }
    return { status: rows.length === 0 || rows.some((row: Row): boolean => row.reason !== null) ? "FAIL" : "OBSERVED", rows, issues, maximum: maximum > 0 ? maximum : null, minimumAreaRatio: Number.isFinite(minimumAreaRatio) ? minimumAreaRatio : null };
  }
}
