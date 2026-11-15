import type { IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { tetrahedralizeAutoMovieDelaunay } from "../math/tetrahedralizeAutoMovieDelaunay";

/**
 * Adapt the spatial relations of a multi-body key pose to bodies of other
 * proportions by an interaction mesh (Ho, Komura and Tai 2010, "Spatial
 * relationship preserving character motion adaptation", ACM TOG 29(4),
 * article 33): a volumetric mesh over every joint and contact point of all
 * bodies at the key pose records how they lie among each other, and the
 * adapted pose is the one that deforms that mesh least, by its Laplacian
 * coordinates, while each body keeps its own bone lengths and every contact
 * its pairing, two points coinciding or held at a fixed offset.
 *
 * - **Mesh.** The Delaunay tetrahedralization of the points by Bowyer and
 *   Watson's incremental insertion (Bowyer 1981; Watson 1981), the points
 *   inserted in their given order inside an enclosing tetrahedron, so the
 *   mesh is deterministic in that order. Its edges are the points'
 *   neighbourhoods.
 * - **Laplacian coordinates.** Each point's offset from the mean of its
 *   neighbours, `灌_i = p_i - (1 / |N_i|) 誇 p_j`, the uniform-weight
 *   Laplacian of the mesh (Sorkine 2006, "Differential representations for
 *   mesh processing", Computer Graphics Forum 25(4)).
 * - **Solve.** `min 誇 |L(p)_i - 灌_i|짼` subject to each bone's length and
 *   each contact's pairing, the constraints as penalty rows of weight
 *   `琯^(-1/4)`, which balances the penalty's residual `1 / w짼` against the
 *   round-off `w짼 琯` the normal equations amplify. Each Gauss-Newton step
 *   linearizes a bone `|p_i - p_j| = l` as `u 쨌 (p_i - p_j) = l` along the
 *   bone's current direction `u` and solves the linear least squares by
 *   conjugate gradients on the normal equations, at most `3 n` iterations
 *   for `n` points, the system's dimension; the steps repeat until one moves
 *   no point by more than the points' extent times `sqrt(ε)`, the accuracy
 *   a least-squares solve in double precision keeps, at most `3 n` times.
 *
 * The paper's own weights (distance-based importance of the mesh's
 * vertices) and its collision penalty are not taken: the uniform Laplacian
 * keeps every relation alike. This first pass read the paper's abstract
 * and a course summary, not the full text.
 *
 * @param props The key pose's points, the target bones and contacts, and the start.
 * @returns The adapted points and the mesh.
 * @throws {Error} When fewer than four points are given, an index is out of range, or a bone's length is not positive.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the method with its sources, each stage, the constraint weight's derivation, the iteration bounds and what is not taken from the paper.
 * @evidence contracts/development/implementation.md#principled-implementation The interaction mesh of Ho, Komura and Tai: a Delaunay tetrahedralization of the joints and contacts and the minimum deformation of its Laplacian coordinates under bone lengths and contacts, linearized by Gauss-Newton and solved by conjugate gradients.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit, mesh, coordinates, then the Gauss-Newton loop over one linear solve.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Malformed input throws; the constraints are penalties stated with their weight, and no point is clamped after the solve.
 * @evidence contracts/development/implementation.md#efficient-algorithms The insertion is quadratic in the points at worst; each linear solve costs at most `3 n` products of a sparse operator linear in the mesh's edges, bones and contacts. Run once per key pose, never per frame.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The mesh and the coordinates are built once and returned, so a caller adapting one key pose to many pairs passes them back (`mesh`).
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the arrays it returns are the caller's.
 */
export function adaptAutoMovieInteractionMesh(
  props: adaptAutoMovieInteractionMesh.IProps,
): adaptAutoMovieInteractionMesh.IResult {
  const n: number = props.reference.length;
  if (n < 4) throw new Error("An interaction mesh needs at least four points");
  for (const bone of props.bones)
    if (!(bone.length > 0) || !inside(bone.from, n) || !inside(bone.to, n))
      throw new Error(
        `A bone ${bone.from}-${bone.to} needs two points and a positive length`,
      );
  for (const contact of props.contacts)
    if (!inside(contact.a, n) || !inside(contact.b, n))
      throw new Error(`A contact ${contact.a}-${contact.b} needs two points`);
  const mesh: adaptAutoMovieInteractionMesh.IMesh =
    props.mesh ?? tetrahedralizeAutoMovieDelaunay(props.reference);
  const neighbours: number[][] = tetrahedralizeAutoMovieDelaunay.neighbours(
    mesh,
    n,
  );
  const delta: IAutoMovieVector3[] = laplace(props.reference, neighbours);
  const weight: number = Number.EPSILON ** -0.25;
  const extent: number = Math.max(
    ...props.reference.map((p: IAutoMovieVector3): number =>
      Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z)),
    ),
    Number.MIN_VALUE,
  );
  const tolerance: number = extent * Number.EPSILON ** 0.5;
  let points: IAutoMovieVector3[] = (props.start ?? props.reference).map(
    (p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p }),
  );
  for (let step: number = 0; step < 3 * n; step++) {
    const next: IAutoMovieVector3[] = solve(
      points,
      neighbours,
      delta,
      props.bones,
      props.contacts,
      weight,
    );
    const moved: number = Math.max(
      ...next.map((p: IAutoMovieVector3, i: number): number =>
        Vector3.length(Vector3.subtract(p, points[i]!)),
      ),
    );
    points = next;
    if (moved <= tolerance) break;
  }
  return { points, mesh };
}

/**
 * Companion types and the mesh of {@link adaptAutoMovieInteractionMesh}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning, frame and unit.
 * @evidence contracts/development/design.md#principled-representation Points by index, bones and contacts as index pairs, and the mesh as its tetrahedra, the data of an interaction mesh.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The input, the result and the mesh's type; the mesh is `tetrahedralizeAutoMovieDelaunay`'s.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Nothing names a body: a body is a set of indices, so any skeleton serves.
 */
export namespace adaptAutoMovieInteractionMesh {
  /** A bone: two points and the length it keeps. */
  export interface IBone {
    /** One end's index. */
    from: number;

    /** The other end's index. */
    to: number;

    /** Metres. */
    length: number;
  }

  /** A contact: two points, usually of different bodies, held at a fixed offset. */
  export interface IContact {
    /** One point's index. */
    a: number;

    /** The other point's index. */
    b: number;

    /** `a` minus `b`, world metres; they coincide when absent. */
    offset?: IAutoMovieVector3;
  }

  /** The tetrahedra over the points (`tetrahedralizeAutoMovieDelaunay`). */
  export type IMesh = tetrahedralizeAutoMovieDelaunay.IMesh;

  /** The adaptation's input. */
  export interface IProps {
    /** The key pose's points, world metres. */
    reference: readonly IAutoMovieVector3[];

    /** The target bodies' bones. */
    bones: readonly IBone[];

    /** The contacts to keep. */
    contacts: readonly IContact[];

    /** The points to start from; the reference when absent. */
    start?: readonly IAutoMovieVector3[];

    /** The reference's mesh, when built before; built here when absent. */
    mesh?: IMesh;
  }

  /** The adaptation's result. */
  export interface IResult {
    /** The adapted points, world metres. */
    points: IAutoMovieVector3[];

    /** The mesh it kept. */
    mesh: IMesh;
  }
}
/** Whether an index lies among n points. */
function inside(index: number, n: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < n;
}

/** The uniform Laplacian coordinates of points. */
function laplace(
  points: readonly IAutoMovieVector3[],
  neighbours: readonly number[][],
): IAutoMovieVector3[] {
  return points.map((p: IAutoMovieVector3, i: number): IAutoMovieVector3 => {
    const around: readonly number[] = neighbours[i]!;
    if (around.length === 0) return { x: 0, y: 0, z: 0 };
    const mean: IAutoMovieVector3 = Vector3.scale(
      around.reduce(
        (s: IAutoMovieVector3, j: number): IAutoMovieVector3 =>
          Vector3.add(s, points[j]!),
        { x: 0, y: 0, z: 0 },
      ),
      1 / around.length,
    );
    return Vector3.subtract(p, mean);
  });
}

/**
 * One Gauss-Newton step: the linear least squares of the Laplacian rows and
 * the weighted constraint rows, by conjugate gradients on the normal
 * equations from the current points.
 */
function solve(
  current: readonly IAutoMovieVector3[],
  neighbours: readonly number[][],
  delta: readonly IAutoMovieVector3[],
  bones: readonly adaptAutoMovieInteractionMesh.IBone[],
  contacts: readonly adaptAutoMovieInteractionMesh.IContact[],
  weight: number,
): IAutoMovieVector3[] {
  const n: number = current.length;
  const directions: IAutoMovieVector3[] = bones.map(
    (b: adaptAutoMovieInteractionMesh.IBone): IAutoMovieVector3 => {
      const d: IAutoMovieVector3 = Vector3.subtract(
        current[b.from]!,
        current[b.to]!,
      );
      const l: number = Vector3.length(d);
      return l > 0 ? Vector3.scale(d, 1 / l) : { x: 0, y: 1, z: 0 };
    },
  );

  // A x: the Laplacian rows (3 per point), the bone rows, the contact rows
  // (3 each); x is 3 n long, x then y then z by point.
  const product = (x: readonly number[]): number[] => {
    const out: number[] = [];
    for (let i: number = 0; i < n; i++) {
      const around: readonly number[] = neighbours[i]!;
      for (let k: number = 0; k < 3; k++) {
        let v: number = x[3 * i + k]!;
        for (const j of around) v -= x[3 * j + k]! / around.length;
        out.push(v);
      }
    }
    bones.forEach(
      (b: adaptAutoMovieInteractionMesh.IBone, index: number): void => {
        const u: IAutoMovieVector3 = directions[index]!;
        out.push(
          weight *
            (u.x * (x[3 * b.from]! - x[3 * b.to]!) +
              u.y * (x[3 * b.from + 1]! - x[3 * b.to + 1]!) +
              u.z * (x[3 * b.from + 2]! - x[3 * b.to + 2]!)),
        );
      },
    );
    for (const c of contacts)
      for (let k: number = 0; k < 3; k++)
        out.push(weight * (x[3 * c.a + k]! - x[3 * c.b + k]!));
    return out;
  };

  // A^T y, the transpose of the same rows.
  const transpose = (y: readonly number[]): number[] => {
    const out: number[] = new Array<number>(3 * n).fill(0);
    let row: number = 0;
    for (let i: number = 0; i < n; i++) {
      const around: readonly number[] = neighbours[i]!;
      for (let k: number = 0; k < 3; k++) {
        const v: number = y[row++]!;
        out[3 * i + k]! += v;
        for (const j of around) out[3 * j + k]! -= v / around.length;
      }
    }
    bones.forEach(
      (b: adaptAutoMovieInteractionMesh.IBone, index: number): void => {
        const u: IAutoMovieVector3 = directions[index]!;
        const v: number = weight * y[row++]!;
        out[3 * b.from]! += u.x * v;
        out[3 * b.from + 1]! += u.y * v;
        out[3 * b.from + 2]! += u.z * v;
        out[3 * b.to]! -= u.x * v;
        out[3 * b.to + 1]! -= u.y * v;
        out[3 * b.to + 2]! -= u.z * v;
      },
    );
    for (const c of contacts)
      for (let k: number = 0; k < 3; k++) {
        const v: number = weight * y[row++]!;
        out[3 * c.a + k]! += v;
        out[3 * c.b + k]! -= v;
      }
    return out;
  };
  const rhs: number[] = [
    ...delta.flatMap((d: IAutoMovieVector3): number[] => [d.x, d.y, d.z]),
    ...bones.map(
      (b: adaptAutoMovieInteractionMesh.IBone): number => weight * b.length,
    ),
    ...contacts.flatMap(
      (c: adaptAutoMovieInteractionMesh.IContact): number[] => [
        weight * (c.offset?.x ?? 0),
        weight * (c.offset?.y ?? 0),
        weight * (c.offset?.z ?? 0),
      ],
    ),
  ];

  // Conjugate gradients on A^T A x = A^T b from the current points.
  const x: number[] = current.flatMap((p: IAutoMovieVector3): number[] => [
    p.x,
    p.y,
    p.z,
  ]);
  const ax: number[] = product(x);
  const r: number[] = transpose(
    rhs.map((b: number, i: number): number => b - ax[i]!),
  );
  let p: number[] = [...r];
  let rr: number = dot(r, r);
  const floor: number = rr * Number.EPSILON * Number.EPSILON;
  for (let k: number = 0; k < 3 * n && rr > floor; k++) {
    const ap: number[] = transpose(product(p));
    const pap: number = dot(p, ap);
    if (!(pap > 0)) break;
    const alpha: number = rr / pap;
    for (let i: number = 0; i < x.length; i++) {
      x[i]! += alpha * p[i]!;
      r[i]! -= alpha * ap[i]!;
    }
    const next: number = dot(r, r);
    const beta: number = next / rr;
    p = r.map((v: number, i: number): number => v + beta * p[i]!);
    rr = next;
  }
  return current.map(
    (_: IAutoMovieVector3, i: number): IAutoMovieVector3 => ({
      x: x[3 * i]!,
      y: x[3 * i + 1]!,
      z: x[3 * i + 2]!,
    }),
  );
}

/** The dot product of two arrays. */
function dot(a: readonly number[], b: readonly number[]): number {
  let s: number = 0;
  for (let i: number = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}
