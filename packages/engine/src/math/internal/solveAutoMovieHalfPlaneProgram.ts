import type { IAutoMovieSolveHalfPlaneProgram } from "@automovie/interface";

/*
 * The point of a disc nearest a preferred point that satisfies a set of
 * half-planes in the plane, or, when no point satisfies them all, the point of
 * the disc that violates the worst of them least: the two- and
 * three-dimensional linear programs of optimal reciprocal collision avoidance
 * (van den Berg, Guy, Lin and Manocha 2011, Reciprocal n-body collision
 * avoidance, Robotics Research, Springer Tracts in Advanced Robotics 70,
 * sections 5.2 and 5.3).
 *
 * A half-plane is a directed line, a point and a unit direction; a point `v`
 * lies inside it when `det(direction, point - v) <= 0`, on the direction's
 * left. The program is solved incrementally, the half-planes added in their
 * given order (Seidel's randomised incremental algorithm in its deterministic
 * order, which keeps the result reproducible): while the current optimum
 * satisfies the next half-plane it stays; otherwise the new optimum lies on
 * that half-plane's line and is found by a one-dimensional program along it
 * against the earlier half-planes and the disc. When that fails, the
 * three-dimensional program takes the point of the disc whose greatest signed
 * distance into the violated half-planes is least, by the same incremental
 * method on the projected half-planes of the planes that bound it.
 *
 * The first `hard` half-planes stay hard in that fallback: the paper's obstacle
 * half-planes, which the projected programs carry unchanged while only the
 * later ones are relaxed. When the hard half-planes leave no point of the disc
 * between them, every half-plane is relaxed alike.
 * Parameter lines: The half-planes, in order.
 * Parameter radius: The disc's radius about the origin, positive.
 * Parameter preferred: The preferred point.
 * Parameter hard: How many leading half-planes the fallback keeps, from 0 (the
 * default) to their count.
 * Returns: The point found, and whether every half-plane holds at it.
 * When the radius is not positive and finite, `hard` is not a
 * whole count within the half-planes, a direction is not a unit vector, or a
 * value is not finite: a caller's defect.
 */
export function solveAutoMovieHalfPlaneProgram(
  lines: readonly IAutoMovieSolveHalfPlaneProgram.ILine[],
  radius: number,
  preferred: IAutoMovieSolveHalfPlaneProgram.IPoint,
  hard: number = 0,
): IAutoMovieSolveHalfPlaneProgram.IResult {
  if (!(radius > 0))
    throw new Error(
      `solveAutoMovieHalfPlaneProgram: the radius ${radius} is not positive and finite`,
    );
  if (hard < 0 || hard > lines.length)
    throw new Error(
      `solveAutoMovieHalfPlaneProgram: hard ${hard} is not a count within the ${lines.length} half-planes`,
    );
  // Every half-plane is admitted before any is used: its four values read
  // once each in order, with no record a half-plane.
  for (let i: number = 0; i < lines.length; ++i) {
    const line: ILine = lines[i]!;

    // The squared length decides a direction plainly inside or outside the
    // unit band (its square lies within 1 - 2e-6 + 1e-12 to 1 + 2e-6 + 1e-12),
    // with room to spare for the rounding of either form; only a square near
    // the band's edge takes the length itself.
    const dx: number = line.direction.x;
    const dy: number = line.direction.y;
    const square: number = dx * dx + dy * dy;
    if (Math.abs(square - 1) < UNIT_INSIDE) continue;
    if (
      Math.abs(square - 1) > UNIT_OUTSIDE ||
      Math.abs(Math.hypot(dx, dy) - 1) > 1e-6
    )
      throw new Error(
        `solveAutoMovieHalfPlaneProgram: half-plane ${i}'s direction is not a unit vector`,
      );
  }
  const planar: { failed: number; point: IPoint } = program2(
    lines,
    radius,
    preferred,
    false,
  );
  if (planar.failed >= lines.length)
    return { point: planar.point, feasible: true };
  return {
    point: program3(
      lines,
      planar.failed,
      radius,
      planar.point,
      planar.failed < hard ? 0 : hard,
    ),
    feasible: false,
  };
}

type IPoint = IAutoMovieSolveHalfPlaneProgram.IPoint;
type ILine = IAutoMovieSolveHalfPlaneProgram.ILine;

/*
 * Below this, two directions count as parallel and a determinant as zero.
 */
const EPSILON: number = 1e-9;

/*
 * A squared direction length this close to 1 has its length inside the 1e-6
 * unit band: (1 - 1e-6)^2 = 1 - 2e-6 + 1e-12 bounds it, less a margin far above
 * rounding.
 */
const UNIT_INSIDE: number = 1.99e-6;

/*
 * A squared length this far from 1 has its length outside the band: (1 +
 * 1e-6)^2 = 1 + 2e-6 + 1e-12 bounds it, plus the same margin.
 */
const UNIT_OUTSIDE: number = 2.01e-6;

/*
 * The determinant of two plane vectors, `a.x b.y - a.y b.x`.
 */
function det(a: IPoint, b: IPoint): number {
  return a.x * b.y - a.y * b.x;
}

/*
 * The dot product of two plane vectors.
 */
function dot(a: IPoint, b: IPoint): number {
  return a.x * b.x + a.y * b.y;
}

/*
 * `a + s b`.
 */
function along(a: IPoint, s: number, b: IPoint): IPoint {
  return { x: a.x + s * b.x, y: a.y + s * b.y };
}

/*
 * The one-dimensional program on line `index`: the point of that line, within
 * the disc and inside the half-planes before it, nearest the preferred point
 * (or furthest along `direction` when `directional`); null when there is none.
 */
function program1(
  lines: readonly ILine[],
  index: number,
  radius: number,
  preferred: IPoint,
  directional: boolean,
): IPoint | null {
  const line: ILine = lines[index]!;
  const dotProduct: number = dot(line.point, line.direction);
  const discriminant: number =
    dotProduct * dotProduct + radius * radius - dot(line.point, line.point);
  if (discriminant < 0) return null;
  const root: number = Math.sqrt(discriminant);
  let left: number = -dotProduct - root;
  let right: number = -dotProduct + root;
  for (let i: number = 0; i < index; ++i) {
    const other: ILine = lines[i]!;
    const denominator: number = det(line.direction, other.direction);
    const numerator: number = det(other.direction, {
      x: line.point.x - other.point.x,
      y: line.point.y - other.point.y,
    });
    if (Math.abs(denominator) <= EPSILON) {
      // Parallel lines: this one is wholly outside the other, or the other adds nothing.
      if (numerator < 0) return null;
      continue;
    }
    const t: number = numerator / denominator;
    if (denominator >= 0) right = Math.min(right, t);
    else left = Math.max(left, t);
    if (left > right) return null;
  }
  if (directional)
    return along(
      line.point,
      dot(preferred, line.direction) > 0 ? right : left,
      line.direction,
    );
  const t: number = dot(line.direction, {
    x: preferred.x - line.point.x,
    y: preferred.y - line.point.y,
  });
  return along(line.point, Math.min(right, Math.max(left, t)), line.direction);
}

/*
 * The two-dimensional program: the point of the disc inside every half-plane
 * nearest the preferred point (or furthest along it when `directional`), and
 * the index of the half-plane it failed on, `lines.length` when none.
 */
function program2(
  lines: readonly ILine[],
  radius: number,
  preferred: IPoint,
  directional: boolean,
): { failed: number; point: IPoint } {
  const length: number = Math.hypot(preferred.x, preferred.y);
  let point: IPoint = directional
    ? { x: preferred.x * radius, y: preferred.y * radius }
    : length > radius
      ? {
          x: (preferred.x / length) * radius,
          y: (preferred.y / length) * radius,
        }
      : { x: preferred.x, y: preferred.y };
  for (let i: number = 0; i < lines.length; ++i) {
    const line: ILine = lines[i]!;
    if (
      det(line.direction, {
        x: line.point.x - point.x,
        y: line.point.y - point.y,
      }) > 0
    ) {
      const next: IPoint | null = program1(
        lines,
        i,
        radius,
        preferred,
        directional,
      );
      if (next === null) return { failed: i, point };
      point = next;
    }
  }
  return { failed: lines.length, point };
}

/*
 * The three-dimensional program from the half-plane the two-dimensional one
 * failed on: the point of the disc whose greatest signed distance into the
 * half-planes is least, each violated half-plane in turn bounding the earlier
 * ones by the bisector of the two. The first `hard` half-planes are carried
 * unchanged, as the paper carries its obstacles'.
 */
function program3(
  lines: readonly ILine[],
  begin: number,
  radius: number,
  start: IPoint,
  hard: number,
): IPoint {
  let point: IPoint = start;
  let distance: number = 0;
  for (let i: number = begin; i < lines.length; ++i) {
    const line: ILine = lines[i]!;
    if (
      det(line.direction, {
        x: line.point.x - point.x,
        y: line.point.y - point.y,
      }) <= distance
    )
      continue;
    const projected: ILine[] = lines.slice(0, hard);
    for (let j: number = hard; j < i; ++j) {
      const other: ILine = lines[j]!;
      const determinant: number = det(line.direction, other.direction);
      let at: IPoint;
      if (Math.abs(determinant) <= EPSILON) {
        // Parallel: opposite directions bound nothing new; the same direction is already implied.
        if (dot(line.direction, other.direction) > 0) continue;
        at = {
          x: 0.5 * (line.point.x + other.point.x),
          y: 0.5 * (line.point.y + other.point.y),
        };
      } else
        at = along(
          line.point,
          det(other.direction, {
            x: line.point.x - other.point.x,
            y: line.point.y - other.point.y,
          }) / determinant,
          line.direction,
        );
      const dx: number = other.direction.x - line.direction.x;
      const dy: number = other.direction.y - line.direction.y;
      const norm: number = Math.hypot(dx, dy);
      if (norm <= EPSILON) continue;
      projected.push({ point: at, direction: { x: dx / norm, y: dy / norm } });
    }
    const before: IPoint = point;
    const solved: { failed: number; point: IPoint } = program2(
      projected,
      radius,
      { x: -line.direction.y, y: line.direction.x },
      true,
    );
    // In principle the projected program cannot fail; a failure is rounding, and the point before it is kept.
    point = solved.failed < projected.length ? before : solved.point;
    distance = det(line.direction, {
      x: line.point.x - point.x,
      y: line.point.y - point.y,
    });
  }
  return point;
}
