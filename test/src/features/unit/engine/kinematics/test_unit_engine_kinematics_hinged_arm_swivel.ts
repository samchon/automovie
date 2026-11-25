import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  IAutoMovieHingedChainGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `hingedArmSwivel` solves a two-segment chain whose mid joint is a hinge:
 * `branches` gives the hinge angles whose span is the target's distance (the
 * law of cosines, stopped at the range), `pose(chain, theta)` the chain at a
 * hinge angle for any swivel about the root-to-target line, and `read` the
 * swivel back from the root rotation.
 *
 * Fixture: unit segments hanging along -y from a root at the origin with an
 * identity frame, the hinge about x; the effector is U (m + L e) with m = e =
 * (0, -1, 0), U and L the returned root and mid rotations.
 *
 * Scenarios:
 *
 * 1. Target (0, -1, -1), at sqrt 2: the branches are +-pi/2 with no shortfall.
 * 2. Target (0, -2, 0): the extended rest angle 0; (0, -5, 0): 0 short by 3.
 * 3. With the range [0, pi/4] the sqrt 2 branches stop at pi/4 and 0, both short.
 * 4. At either branch every swivel 0, 37, 200 lands the effector on the target
 *    within 1e-12, and `read` returns the swivel (wrapped into (-180, 180])
 *    within 1e-9.
 * 5. A zero segment or a target at the root has no branches.
 * 6. Preparation fixes the origin, rotation, offsets and actual target before
 *    branch or pose reads. This retains the right-angle target's two branches
 *    after input edits and gives the next independent target its own geometry.
 *    Use a 64-ulp absolute allowance for unit-scale joint and FK arithmetic.
 */
export function test_unit_engine_kinematics_hinged_arm_swivel(): void {
  const chain = (
    target: IAutoMovieVector3,
    range?: IAutoMovieHingedChainGeometry["range"],
  ): IAutoMovieHingedChainGeometry => ({
    upper: {
      worldPosition: { x: 0, y: 0, z: 0 },
      worldRotation: Quaternion.identity(),
    },
    midOffset: { x: 0, y: -1, z: 0 },
    midRest: Quaternion.identity(),
    endOffset: { x: 0, y: -1, z: 0 },
    hinge: { x: 1, y: 0, z: 0 },
    target,
    ...(range === undefined ? {} : { range }),
  });
  const bent: IAutoMovieVector3 = { x: 0, y: -1, z: -1 };
  const near = (a: number, b: number, e: number = 1e-12): boolean =>
    Math.abs(a - b) <= e;

  // 1.
  const stops = hingedArmSwivel.branches(chain(bent))!;
  TestValidator.predicate(
    "branches",
    stops.length === 2 &&
      near(Math.abs(stops[0]!.theta), Math.PI / 2) &&
      near(stops[0]!.theta, -stops[1]!.theta) &&
      stops.every((s) => s.shortfall === 0),
  );

  // 2.
  TestValidator.equals(
    "extended",
    hingedArmSwivel.branches(chain({ x: 0, y: -2, z: 0 })),
    [{ theta: 0, shortfall: 0 }],
  );
  const far = hingedArmSwivel.branches(chain({ x: 0, y: -5, z: 0 }))!;
  TestValidator.predicate(
    "far",
    far.length === 1 && far[0]!.theta === 0 && near(far[0]!.shortfall, 3),
  );

  // 3.
  const ranged = hingedArmSwivel.branches(
    chain(bent, { min: 0, max: Math.PI / 4 }),
  )!;
  TestValidator.predicate(
    "range",
    ranged
      .map((s) => s.theta)
      .sort((a: number, b: number): number => a - b)
      .every((t: number, i: number): boolean =>
        near(t, [0, Math.PI / 4][i]!),
      ) && ranged.every((s) => s.shortfall > 0),
  );

  // 4.
  for (const stop of stops) {
    const posed = hingedArmSwivel.pose(chain(bent), stop.theta);
    for (const swivel of [0, 37, 200]) {
      const { upper, lower } = posed(swivel);
      const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
      const end: IAutoMovieVector3 = Quaternion.rotateVector(
        upper,
        Vector3.add(down, Quaternion.rotateVector(lower, down)),
      );
      TestValidator.predicate(
        `lands ${stop.theta} ${swivel}`,
        Vector3.distance(end, bent) <= 1e-12,
      );
      const read: number = hingedArmSwivel.read(chain(bent), upper, stop.theta);
      TestValidator.predicate(
        `read ${stop.theta} ${swivel}`,
        near(read, swivel > 180 ? swivel - 360 : swivel, 1e-9),
      );
    }
  }

  // 5.
  TestValidator.equals(
    "none",
    [
      hingedArmSwivel.branches({
        ...chain(bent),
        midOffset: { x: 0, y: 0, z: 0 },
      }),
      hingedArmSwivel.branches(chain({ x: 0, y: 0, z: 0 })),
    ],
    [null, null],
  );

  const point: IAutoMovieVector3 = { x: 0, y: -1, z: -1 };
  const source: IAutoMovieHingedChainGeometry = chain(point);
  const prepared: hingedArmSwivel.IPrepared = hingedArmSwivel.prepare(source);
  source.midOffset.y = 0;
  source.upper.worldPosition.x = 8;
  source.upper.worldRotation.x = 1;
  source.upper.worldRotation.w = 0;
  const target: hingedArmSwivel.IPreparedTarget = prepared.target(point);
  point.y = 10;
  const branches: ReturnType<typeof target.branches> = target.branches();
  const preparationRoundoff: number = 64 * Number.EPSILON;
  TestValidator.predicate(
    "the prepared right-angle target retains both unstopped branches",
    branches?.length === 2 &&
      branches.every(
        ({ theta, shortfall }) =>
          near(Math.abs(theta), Math.PI / 2, preparationRoundoff) &&
          shortfall === 0,
      ),
  );
  const { upper, lower } = target.pose(branches![0]!.theta)(0);
  const down: IAutoMovieVector3 = { x: 0, y: -1, z: 0 };
  const end: IAutoMovieVector3 = Quaternion.rotateVector(
    upper,
    Vector3.add(down, Quaternion.rotateVector(lower, down)),
  );
  TestValidator.predicate(
    "the prepared branch still lands on its own point",
    Vector3.distance(end, bent) <= preparationRoundoff,
  );
  TestValidator.equals(
    "a subsequent target has its own span",
    prepared.target({ x: 0, y: -2, z: 0 }).branches(),
    [{ theta: 0, shortfall: 0 }],
  );
}
