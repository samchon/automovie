import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanBodyCappedSurface } from "../../simple/humanBodyCappedSurface";

type SphereState = {
  id: string;
  center: IAutoMovieVector3;
  radiusMetres: number;
  point: number[];
  squared: number;
  interiors: number;
};

type SphereClearance = {
  /** Identity of the inspected compiled sphere. */
  id: string;

  /** Whether the centre lies in exactly one admitted skin solid. */
  centerInside: boolean;

  /** Minimum centre-to-skin boundary distance in metres. */
  nearestMetres: number;

  /** Positive full containment margin, zero contact or negative protrusion in metres. */
  clearanceMetres: number;
};

/**
 * Exact signed space between internal spheres and connected exterior skins.
 *
 * Positions and radii are metres in the body's Y-up, Z-forward frame. Each skin boundary is closed at its actual ring to define inside, then the minimum Euclidean point-to-triangle distance is evaluated on every source and cap triangle. A projection inside a face wins; otherwise the nearest edge or vertex wins. Positive clearance means the entire sphere fits in exactly one skin solid, zero means contact and negative means protrusion. Skin closure and validation are shared across every supplied sphere.
 *
 * The caller first checks skin self-crossings in the same posed build. A self-intersecting exterior has no unambiguous anatomical inside, even if its algebraic tetrahedron sum is finite. This geometry does not infer a missing bone shaft, tissue thickness or an elastic contact response.
 *
 * @evidence contracts/common.md#principled-implementation Closed skin triangles supply inside and nearest face/edge/vertex distance; radius subtraction gives containment margin, assuming caller-admitted non-self-intersecting exteriors.
 * @evidence contracts/common.md#clear-and-simple-design Each skin closes/validates once for all spheres; one distance helper owns face-versus-clamped-edge projection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Sphere placement/finite volume infer no missing shaft, tissue thickness or elastic response, and overlapping containing skins refuse.
 * @evidence contracts/common.md#meaningful-documentation Comments give body/metre frame, signed margin, shared closure, self-crossing premise and unavailable anatomical/contact conclusions.
 * @evidence contracts/performance.md#efficient-algorithms For H spheres and T closed triangles, distance/containment scans cost O(HT) plus closure/validation; unaccelerated full nearest scans remain indexable.
 * @evidence contracts/performance.md#reuse-equivalent-work Validated skin triangles serve all spheres within a call; no prior posed surface is cached across changed geometry.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Skin instruments/minima are temporary; only scalar reports escape and caller geometry/spheres remain unchanged on refusal.
 * @author Samchon
 */
export function measureHumanBodySpheresSkinClearance(input: {
  /** Actual compiled exterior positions and triangle indices, retaining their shared ring correspondence. */
  skins: { positions: number[]; indices: number[] }[];

  /** Generated or measured analytic candidates in the same posed body frame; no skin-derived radius prior. */
  spheres: { id: string; center: IAutoMovieVector3; radiusMetres: number }[];
}): SphereClearance[] {
  if (input.skins.length === 0)
    throw new Error("Internal components need at least one connected skin.");
  const spheres: SphereState[] = input.spheres.map((sphere: (typeof input.spheres)[number]): SphereState => {
    if (
      sphere.id.trim() === "" ||
      !Number.isFinite(sphere.radiusMetres) ||
      sphere.radiusMetres <= 0 ||
      ![sphere.center.x, sphere.center.y, sphere.center.z].every(
        Number.isFinite,
      )
    )
      throw new Error(
        "An internal sphere needs an id, finite centre and positive radius in metres.",
      );
    return {
      ...sphere,
      point: [sphere.center.x, sphere.center.y, sphere.center.z],
      squared: Infinity,
      interiors: 0,
    };
  });
  for (const skin of input.skins) {
    const solid: ReturnType<typeof humanBodyCappedSurface> = humanBodyCappedSurface(skin.positions, skin.indices);
    solid.assertValid();
    const positions: number[] = solid.closed.positions;
    const indices: number[] = solid.closed.indices!;
    for (let at: number = 0; at < indices.length; at += 3) {
      const [a, b, c]: number[][] = [0, 1, 2].map((corner: number): number[] =>
        positions.slice(indices[at + corner] * 3, indices[at + corner] * 3 + 3),
      );
      for (const sphere of spheres)
        sphere.squared = Math.min(
          sphere.squared,
          pointTriangleSquaredDistance(sphere.point, a, b, c),
        );
    }
    for (const sphere of spheres)
      if (solid.contains(sphere.point)) sphere.interiors++;
  }
  return spheres.map(({ id, radiusMetres, squared, interiors }: SphereState): SphereClearance => {
    if (interiors > 1)
      throw new Error(
        "An internal component cannot occupy overlapping skin solids: " + id,
      );
    const nearestMetres: number = Math.sqrt(squared);
    return {
      id,
      centerInside: interiors === 1,
      nearestMetres,
      clearanceMetres:
        interiors === 1
          ? nearestMetres - radiusMetres
          : -nearestMetres - radiusMetres,
    };
  });
}

/** Squared distance to a triangle's face, or its nearest edge when outside. */
function pointTriangleSquaredDistance(
  point: number[],
  a: number[],
  b: number[],
  c: number[],
): number {
  const subtract: (left: number[], right: number[]) => number[] = (left: number[], right: number[]): number[] =>
    left.map((value: number, axis: number): number => value - right[axis]);
  const dot: (left: number[], right: number[]) => number = (left: number[], right: number[]): number =>
    left.reduce((sum: number, value: number, axis: number): number => sum + value * right[axis], 0);
  const squared: (vector: number[]) => number = (vector: number[]): number => dot(vector, vector);
  const ab: number[] = subtract(b, a);
  const ac: number[] = subtract(c, a);
  const ap: number[] = subtract(point, a);
  const aa: number = dot(ab, ab);
  const bb: number = dot(ac, ac);
  const cross: number = dot(ab, ac);
  const divisor: number = aa * bb - cross * cross;
  if (divisor <= 0)
    throw new Error("A skin triangle must enclose positive area.");
  const pa: number = dot(ap, ab);
  const pb: number = dot(ap, ac);
  const towardB: number = (bb * pa - cross * pb) / divisor;
  const towardC: number = (aa * pb - cross * pa) / divisor;
  if (towardB >= 0 && towardC >= 0 && towardB + towardC <= 1) {
    const projected: number[] = a.map(
      (value: number, axis: number): number => value + towardB * ab[axis] + towardC * ac[axis],
    );
    return squared(subtract(point, projected));
  }
  const edge: (start: number[], end: number[]) => number = (start: number[], end: number[]): number => {
    const direction: number[] = subtract(end, start);
    const length: number = squared(direction);
    const t: number = Math.min(
      1,
      Math.max(0, dot(subtract(point, start), direction) / length),
    );
    return squared(
      subtract(
        point,
        start.map((value: number, axis: number): number => value + t * direction[axis]),
      ),
    );
  };
  return Math.min(edge(a, b), edge(b, c), edge(c, a));
}
