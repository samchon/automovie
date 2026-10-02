import { closeHumanBodyUnderwearCreases } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

/**
 * A garment on skin that is flat, convex or a hollow wider than the ball is
 * on the closing surface already, so it is lifted by its thickness along its
 * own normal and nothing else: no displacement toward a ball, no bridged
 * weight and no tilt of the normal. The closing of a flat floor by a ball is
 * the floor, whatever grid the ball's centres were found on, so a vertex
 * whose position falls between grid centres must stay exactly where it is.
 *
 * The floor is a 0.4 m square in the plane y = 0 wound to face +Y. Its
 * corners are the only skin vertices, so no garment point coincides with a
 * skin sample, and the span is 0.04 m (cells of 8 mm).
 *
 * Scenarios:
 * 1. Eleven points laid across the floor at offsets that are not multiples of
 *    the cell (steps of 3.7 mm in x and 5.3 mm in z) keep a bridged weight of
 *    exactly zero, an unchanged normal and a position lifted by the thickness
 *    along +Y alone.
 * 2. The same points on a floor tilted by thirty degrees about z, with the
 *    tilted normal, keep their zero weight and their normal: the ball along
 *    the vertex's own normal is free whichever way the skin faces.
 */
export const test_human_body_underwear_flat_stay = (): void => {
  const lift = 0.003;
  const tilt = Math.PI / 6;
  const stay = (title: string, angle: number): void => {
    const turn = (x: number, y: number): [number, number] => [
      x * Math.cos(angle) - y * Math.sin(angle),
      x * Math.sin(angle) + y * Math.cos(angle),
    ];
    const corner = [
      [-0.2, 0, -0.2],
      [0.2, 0, -0.2],
      [0, 0, 0.2],
    ].flatMap(([x, y, z]) => [...turn(x!, y!), z!]);
    const skin = [{ positions: corner, indices: [0, 2, 1] }];
    const points: number[] = [];
    const normals: number[] = [];
    for (let i = 0; i < 11; i++) {
      const [x, y] = turn(-0.0185 + i * 0.0037, 0);
      points.push(x, y, -0.0106 + i * 0.0053);
      normals.push(...turn(0, 1), 0);
    }
    const closed = closeHumanBodyUnderwearCreases({
      skin,
      points,
      normals,
      offsetMetres: lift,
      spanMetres: 0.04,
    });
    TestValidator.equals(title + ": nothing is bridged", closed.bridged, new Array(11).fill(0));
    TestValidator.equals(title + ": no normal tilts", closed.normals, normals);
    TestValidator.predicate(
      title + ": every point is lifted by the thickness along its normal",
      closed.positions.every(
        (value, k) => Math.abs(value - (points[k]! + lift * normals[k]!)) < 1e-12,
      ),
    );
  };
  stay("level floor", 0);
  stay("tilted floor", tilt);
};
