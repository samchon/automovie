/** Complete triangle-strain observations with reproducible geometric witnesses. */
export namespace HumanPoseStrain {
  /** A world point in the caller's common rest/pose length unit. */
  export type V3 = [number, number, number];

  /** Evaluated mesh; rest and pose must retain identical vertex and face ids. */
  export interface ISkin {
    /** Flat evaluated world positions in one common length unit. */
    P: ArrayLike<number>;
    /** Flat triangle vertex indices, unchanged between bind and pose. */
    I: ArrayLike<number>;
    /** Owning chain index of each triangle. */
    tri: ArrayLike<number>;
    /** Names addressed by the per-triangle ownership indices. */
    chains: readonly string[];
  }

  /** The actual exported four influences, not reconstructed field parameters. */
  export interface IBinding {
    /** Bone names addressed by exported influence slots. */
    joints: readonly string[];
    /** Four actual bone-name indices per vertex. */
    boneIndices: ArrayLike<number>;
    /** Four normalized actual exported weights per vertex. */
    weights: ArrayLike<number>;
  }

  /** One retained nonzero exported bone influence. */
  export interface IInfluence {
    /** Actual influence bone name. */
    bone: string;
    /** Actual positive exported mass. */
    weight: number;
  }

  /** The actual face that supplied the largest principal stretch. */
  export interface IWitness {
    /** Global face id in the supplied immutable skin. */
    triangle: number;
    /** Surface owner, null when the caller has no chain metadata. */
    chain: string | null;
    /** Three actual mesh vertex ids in the original winding. */
    vertices: [number, number, number];
    /** Three original bind positions in the caller's world unit. */
    rest: [V3, V3, V3];
    /** Corresponding three actual deformed positions in the same unit. */
    posed: [V3, V3, V3];
    /** Bind-space point at which to locate the reported face. */
    restCentroid: V3;
    /** Posed-space point at which to locate the same face. */
    posedCentroid: V3;
    /** Actual retained exported bone weights, or null when not supplied. */
    influences: [IInfluence[], IInfluence[], IInfluence[]] | null;
    /** Twice the face area in squared caller world units. */
    restDoubleArea: number;
    /** The original in-plane-to-world deformation map's two columns. */
    deformation: [V3, V3];
    /** Larger singular value at this face; dimensionless. */
    stretch: number;
  }

  /** A selected face that cannot support a complete-region strain claim. */
  export interface IUnmeasurable {
    /** Original selected face id. */
    triangle: number;
    /** Exact distinction between invalid input, finite degeneracy and arithmetic failure. */
    reason: "nonfinite-rest-input" | "degenerate-rest" | "nonfinite-rest-basis" | "nonfinite-deformation" | "degenerate-posed" | "nonfinite-posed-normal" | "nonfinite-fold-normal";
    /** Original vertex ids in their supplied winding. */
    vertices: [number, number, number];
    /** Original bind coordinates in the caller's common length unit. */
    rest: [V3, V3, V3];
    /** Corresponding actual posed coordinates in the same unit. */
    posed: [V3, V3, V3];
  }

  /** Existing numeric verdict plus evidence; no threshold is embedded here. */
  export interface IOutput {
    /** Aggregate larger singular value; any unavailable face, normal or empty region yields NaN. */
    stretch: number;
    /** Whether every selected face supports the complete-region numeric claim. */
    availability: "complete" | "empty-region" | "unmeasurable-face";
    /** Original count of neighbour-relative face reversals. */
    folded: number;
    /** Faces on which the original determinant path was evaluated. */
    measured: number;
    /** Faces skipped by the original absolute determinant threshold. */
    skippedDegenerate: number;
    /** Exact finite-degenerate face ids excluded by the unchanged area threshold. */
    skippedDegenerateTriangles: number[];
    /** Every omitted or nonfinite face, with its exact input addresses and cause. */
    unmeasurableTriangles: IUnmeasurable[];
    /** Face identities whose original operation produced nonfinite stretch. */
    nonFiniteTriangles: number[];
    /** Largest finite face encountered even if another face is nonfinite. */
    worst: IWitness | null;
    /** All neighbour-relative fold face identities, preserving collect-all. */
    foldedTriangles: number[];
  }

  /**
   * Preserve the anatomy audit's singular-value and neighbour-normal formulas.
   * Every selected face is visited; the first maximum wins an exact tie. A
   * witness is copied only after the entire scan. Finite valid faces retain
   * the original arithmetic and 1e-9 determinant threshold. A partial or empty
   * scan or undefined posed/fold normal cannot certify a complete region, so
   * its aggregate is unavailable; the largest finite singular value remains
   * available separately as a witness, including a collapsed map's zero.
   */
  export function measure(rest: ISkin, posed: ISkin, region: ArrayLike<number>, binding?: IBinding): IOutput {
    const inRegion: Set<number> = new Set(Array.from(region));
    const edgeOwner: Map<number, number[]> = new Map();
    const vertices: number = rest.P.length / 3;
    let stretch: number = 0;
    let measured: number = 0;
    let skippedDegenerate: number = 0;
    let worstTriangle: number | null = null;
    let worstDeformation: [V3, V3] | null = null;
    let worstArea: number = 0;
    let worstStretch: number = 0;
    const nonFiniteTriangles: number[] = [];
    const skippedDegenerateTriangles: number[] = [];
    const unmeasurableTriangles: IUnmeasurable[] = [];

    for (let k: number = 0; k < region.length; k++) {
      const triangle: number = region[k]!;
      for (let e: number = 0; e < 3; e++) {
        const a: number = rest.I[3 * triangle + e]!;
        const b: number = rest.I[3 * triangle + (e + 1) % 3]!;
        const key: number = Math.min(a, b) * vertices + Math.max(a, b);
        const owners: number[] = edgeOwner.get(key) ?? [];
        owners.push(triangle);
        edgeOwner.set(key, owners);
      }
    }

    for (let k: number = 0; k < region.length; k++) {
      const triangle: number = region[k]!;
      const r: V3[] = [0, 1, 2].map((corner: number): V3 => point(rest, rest.I[3 * triangle + corner]!));
      const q: V3[] = [0, 1, 2].map((corner: number): V3 => point(posed, rest.I[3 * triangle + corner]!));
      const e1: V3 = sub(r[1]!, r[0]!);
      const e2: V3 = sub(r[2]!, r[0]!);
      const f1: V3 = sub(q[1]!, q[0]!);
      const f2: V3 = sub(q[2]!, q[0]!);

      // Classify invalid input and zero basis vectors before normalization divides.
      if (!r[0]!.every(Number.isFinite) || !r[1]!.every(Number.isFinite) || !r[2]!.every(Number.isFinite)) {
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "nonfinite-rest-input"));
        nonFiniteTriangles.push(triangle);
        continue;
      }
      if (e1[0] === 0 && e1[1] === 0 && e1[2] === 0) {
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "degenerate-rest"));
        skippedDegenerate++; skippedDegenerateTriangles.push(triangle);
        continue;
      }
      const u: V3 = unit(e1);
      const perpendicular: V3 = sub(e2, scale(u, dot(e2, u)));
      if (perpendicular[0] === 0 && perpendicular[1] === 0 && perpendicular[2] === 0) {
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "degenerate-rest"));
        skippedDegenerate++; skippedDegenerateTriangles.push(triangle);
        continue;
      }
      const w: V3 = unit(perpendicular);
      const matrix: number[] = [dot(e1, u), dot(e2, u), dot(e1, w), dot(e2, w)];
      const determinant: number = matrix[0]! * matrix[3]! - matrix[1]! * matrix[2]!;
      if (!Number.isFinite(determinant)) {
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "nonfinite-rest-basis"));
        nonFiniteTriangles.push(triangle);
        continue;
      }
      if (Math.abs(determinant) < 1e-9) {
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "degenerate-rest"));
        skippedDegenerate++; skippedDegenerateTriangles.push(triangle);
        continue;
      }
      const inverse: number[] = [matrix[3]! / determinant, -matrix[1]! / determinant, -matrix[2]! / determinant, matrix[0]! / determinant];
      const c1: V3 = add(scale(f1, inverse[0]!), scale(f2, inverse[2]!));
      const c2: V3 = add(scale(f1, inverse[1]!), scale(f2, inverse[3]!));
      const a11: number = dot(c1, c1);
      const a12: number = dot(c1, c2);
      const a22: number = dot(c2, c2);
      const trace: number = a11 + a22;
      const discriminant: number = Math.sqrt(Math.max(0, (a11 - a22) ** 2 / 4 + a12 * a12));
      const current: number = Math.sqrt(trace / 2 + discriminant);
      measured++;
      stretch = Math.max(stretch, current);
      if (!Number.isFinite(current)) {
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "nonfinite-deformation"));
        nonFiniteTriangles.push(triangle);
      }
      if (Number.isFinite(current) && (worstTriangle === null || current > worstStretch)) {
        worstStretch = current;
        worstTriangle = triangle;
        worstDeformation = [c1, c2];
        worstArea = Math.abs(determinant);
      }
      if (Number.isFinite(current)) {
        const posedArea: V3 = cross(f1, f2);
        if (posedArea.every((value: number): boolean => value === 0))
          unmeasurableTriangles.push(omission(rest, triangle, r, q, "degenerate-posed"));
        else if (!unit(posedArea).every(Number.isFinite)) {
          unmeasurableTriangles.push(omission(rest, triangle, r, q, "nonfinite-posed-normal"));
          nonFiniteTriangles.push(triangle);
        }
      }
    }

    const foldedTriangles: number[] = [];
    for (let k: number = 0; k < region.length; k++) {
      const triangle: number = region[k]!;
      const neighbours: number[] = [];
      for (let e: number = 0; e < 3; e++) {
        const a: number = rest.I[3 * triangle + e]!;
        const b: number = rest.I[3 * triangle + (e + 1) % 3]!;
        for (const other of edgeOwner.get(Math.min(a, b) * vertices + Math.max(a, b)) ?? []) {
          if (other !== triangle && inRegion.has(other)) neighbours.push(other);
        }
      }
      if (neighbours.length === 0) continue;
      const mean: (skin: ISkin) => V3 = (skin: ISkin): V3 => unit(neighbours.reduce((sum: V3, other: number): V3 => add(sum, normal(skin, other)), [0, 0, 0]));
      const was: number = dot(normal(rest, triangle), mean(rest));
      const now: number = dot(normal(posed, triangle), mean(posed));
      if ((!Number.isFinite(was) || !Number.isFinite(now)) && !unmeasurableTriangles.some((entry: IUnmeasurable): boolean => entry.triangle === triangle)) {
        const r: V3[] = [0, 1, 2].map((corner: number): V3 => point(rest, rest.I[3 * triangle + corner]!));
        const q: V3[] = [0, 1, 2].map((corner: number): V3 => point(posed, rest.I[3 * triangle + corner]!));
        unmeasurableTriangles.push(omission(rest, triangle, r, q, "nonfinite-fold-normal"));
        nonFiniteTriangles.push(triangle);
      }
      if (was > 0.5 && now < -0.5) foldedTriangles.push(triangle);
    }

    const ids: [number, number, number] | null = worstTriangle === null ? null : [0, 1, 2].map((corner: number): number => rest.I[3 * worstTriangle! + corner]!) as [number, number, number];
    const r: [V3, V3, V3] | null = ids === null ? null : ids.map((id: number): V3 => point(rest, id)) as [V3, V3, V3];
    const q: [V3, V3, V3] | null = ids === null ? null : ids.map((id: number): V3 => point(posed, id)) as [V3, V3, V3];
    const worst: IWitness | null = worstTriangle === null ? null : {
      triangle: worstTriangle,
      chain: rest.chains[rest.tri[worstTriangle]!] ?? null,
      vertices: ids!, rest: r!, posed: q!,
      restCentroid: scale(add(add(r![0], r![1]), r![2]), 1 / 3),
      posedCentroid: scale(add(add(q![0], q![1]), q![2]), 1 / 3),
      influences: binding === undefined ? null : ids!.map((id: number): IInfluence[] => [0, 1, 2, 3].filter((slot: number): boolean => binding.weights[4 * id + slot] !== 0).map((slot: number): IInfluence => ({ bone: binding.joints[binding.boneIndices[4 * id + slot]!]!, weight: binding.weights[4 * id + slot]! }))) as [IInfluence[], IInfluence[], IInfluence[]],
      restDoubleArea: worstArea,
      deformation: worstDeformation!,
      stretch: worstStretch,
    };
    const availability: IOutput["availability"] = region.length === 0 ? "empty-region" : unmeasurableTriangles.length === 0 ? "complete" : "unmeasurable-face";
    return { stretch: availability === "complete" ? stretch : NaN, availability, folded: foldedTriangles.length, measured, skippedDegenerate, skippedDegenerateTriangles, unmeasurableTriangles, nonFiniteTriangles, worst, foldedTriangles };
  }

  /** Read the actual vertex without changing its unit. */
  function point(skin: ISkin, id: number): V3 { return [skin.P[3 * id]!, skin.P[3 * id + 1]!, skin.P[3 * id + 2]!]; }
  /** Allocate cause and source coordinates only when a selected face is unmeasurable. */
  function omission(skin: ISkin, triangle: number, rest: V3[], posed: V3[], reason: IUnmeasurable["reason"]): IUnmeasurable {
    return { triangle, reason, vertices: [skin.I[3 * triangle]!, skin.I[3 * triangle + 1]!, skin.I[3 * triangle + 2]!], rest: rest as [V3, V3, V3], posed: posed as [V3, V3, V3] };
  }
  /** Outward face normal, preserving the audit's nonfinite degenerate behavior. */
  function normal(skin: ISkin, triangle: number): V3 {
    const a: V3 = point(skin, skin.I[3 * triangle]!);
    return unit(cross(sub(point(skin, skin.I[3 * triangle + 1]!), a), sub(point(skin, skin.I[3 * triangle + 2]!), a)));
  }
  /** Vector sum. */
  function add(a: V3, b: V3): V3 { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  /** Vector difference. */
  function sub(a: V3, b: V3): V3 { return [a[0] - b[0], a[1] - b[1], a[2] - b[2]]; }
  /** Vector scaling. */
  function scale(a: V3, s: number): V3 { return [a[0] * s, a[1] * s, a[2] * s]; }
  /** Euclidean scalar product. */
  function dot(a: V3, b: V3): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  /** Euclidean cross product. */
  function cross(a: V3, b: V3): V3 { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  /** Preserve the original audit's division, including nonfinite zero normals. */
  function unit(a: V3): V3 { const length: number = Math.hypot(...a); return [a[0] / length, a[1] / length, a[2] / length]; }
}
