import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanBodyCappedSurface } from "../../simple/humanBodyCappedSurface";

/**
 * Exact signed space between internal spheres and connected exterior skins.
 *
 * Positions and radii are metres in the body's Y-up, Z-forward frame. Each
 * skin boundary is closed at its actual ring to define inside, then the
 * minimum Euclidean point-to-triangle distance is evaluated on every source
 * and cap triangle. A projection inside a face wins; otherwise the nearest
 * edge or vertex wins. Positive clearance means the entire sphere fits in
 * exactly one skin solid, zero means contact and negative means protrusion.
 * Skin closure and validation are shared across every supplied sphere.
 *
 * The caller first checks skin self-crossings in the same posed build. A
 * self-intersecting exterior has no unambiguous anatomical inside, even if
 * its algebraic tetrahedron sum is finite. This geometry does not infer a
 * missing bone shaft, tissue thickness or an elastic contact response.
 *
 * @evidence contracts/common.md#principled-implementation The signed clearance of a sphere is its nearest distance to the closed skin minus the radius, positive when the sphere lies wholly inside exactly one skin solid. Inside is decided by solid-angle containment in the skin closed with a centroid fan at each boundary loop by `humanBodyCappedSurface`, and the nearest distance is the minimum exact point-to-triangle distance over every source and cap triangle (face projection by barycentric coordinates, otherwise the nearest edge). The premises are a closed, non-self-intersecting skin, which the caller checks and whose closed mesh `assertValid` refuses when its volume or cap faces are degenerate or a cap crosses the skin, and non-degenerate triangles, which the divisor test throws on; a centre inside two solids throws instead of guessing. Distances are computed squared in double precision and rooted once.
 * @evidence contracts/common.md#clear-and-simple-design One pass that closes each skin once, measures every sphere against every triangle and settles inside and outside per solid; the point-triangle distance is the only helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fixture, sphere name or tolerance special case: the result is a function of the skins and spheres alone, and a violated precondition throws instead of being repaired.
 * @evidence contracts/common.md#meaningful-documentation The comment states the units and frame, how inside is defined, what positive, zero and negative clearance mean, that skin closure and validation are shared across spheres, that the caller must first check self-crossings, and that no bone shaft, tissue thickness or elastic response is inferred.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function measures and defines no part or group.
 * @evidenceExclude contracts/modeling.md#parameter-channels The function defines and consumes no channel that varies a form.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry: it returns one clearance record per input sphere.
 * @evidence contracts/modeling.md#spatial-conventions Positions, radii and every returned distance are metres in the body's Y-up, Z-forward frame; the function converts nothing and the closed cap it adds stays in the same frame.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The function builds no surface itself: the closed solid it measures against is the one `humanBodyCappedSurface` defines for the capped skin, and this function only reads it.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function owns no part, group or joint and draws nothing; it returns numbers.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value: it is geometry over caller-supplied skins and spheres.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no anatomical value: it checks that ids are nonempty, centres finite and radii positive, throws on overlapping skin solids, and reports negative clearance as a measurement rather than a refusal; whether a protrusion is anatomically permitted is the caller's judgement.
 * @evidenceExclude contracts/anatomy.md#parametric-authority No caller input shapes a human form through this function; it only reads a built skin and caller spheres and returns a measurement.
 * @author Samchon
 */
export function measureHumanBodySpheresSkinClearance(input: {
  skins: { positions: number[]; indices: number[] }[];
  spheres: { id: string; center: IAutoMovieVector3; radiusMetres: number }[];
}): {
  id: string;
  centerInside: boolean;
  nearestMetres: number;
  clearanceMetres: number;
}[] {
  if (input.skins.length === 0)
    throw new Error("Internal components need at least one connected skin.");
  const spheres = input.spheres.map((sphere) => {
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
    const solid = humanBodyCappedSurface(skin.positions, skin.indices);
    solid.assertValid();
    const positions = solid.closed.positions;
    const indices = solid.closed.indices!;
    for (let at = 0; at < indices.length; at += 3) {
      const [a, b, c] = [0, 1, 2].map((corner) =>
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
  return spheres.map(({ id, radiusMetres, squared, interiors }) => {
    if (interiors > 1)
      throw new Error(
        "An internal component cannot occupy overlapping skin solids: " + id,
      );
    const nearestMetres = Math.sqrt(squared);
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
  const subtract = (left: number[], right: number[]) =>
    left.map((value, axis) => value - right[axis]);
  const dot = (left: number[], right: number[]) =>
    left.reduce((sum, value, axis) => sum + value * right[axis], 0);
  const squared = (vector: number[]) => dot(vector, vector);
  const ab = subtract(b, a);
  const ac = subtract(c, a);
  const ap = subtract(point, a);
  const aa = dot(ab, ab);
  const bb = dot(ac, ac);
  const cross = dot(ab, ac);
  const divisor = aa * bb - cross * cross;
  if (divisor <= 0)
    throw new Error("A skin triangle must enclose positive area.");
  const pa = dot(ap, ab);
  const pb = dot(ap, ac);
  const towardB = (bb * pa - cross * pb) / divisor;
  const towardC = (aa * pb - cross * pa) / divisor;
  if (towardB >= 0 && towardC >= 0 && towardB + towardC <= 1) {
    const projected = a.map(
      (value, axis) => value + towardB * ab[axis] + towardC * ac[axis],
    );
    return squared(subtract(point, projected));
  }
  const edge = (start: number[], end: number[]): number => {
    const direction = subtract(end, start);
    const length = squared(direction);
    const t = Math.min(
      1,
      Math.max(0, dot(subtract(point, start), direction) / length),
    );
    return squared(
      subtract(
        point,
        start.map((value, axis) => value + t * direction[axis]),
      ),
    );
  };
  return Math.min(edge(a, b), edge(b, c), edge(c, a));
}
