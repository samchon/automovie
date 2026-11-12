import { type IAutoMovieResolvedBone, Quaternion } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanSignature, type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The shipped signature readings give the angle a figure was built with.
 *
 * A production asserts a cited value on its own composition through
 * `HumanSignature`, so each reading must mean what its name says in degrees
 * and seconds. The figure here is a stick figure built from known angles, not
 * a performed body: the expected value of every reading is the angle the
 * figure was drawn at.
 *
 * The figure faces +Z: hips at 1 m, 0.2 m apart, shoulders 0.5 m along a
 * trunk line tipped forward by a chosen inclination, a thigh and a shank of
 * 0.4 m folded at a chosen knee angle, an upper arm and a forearm of 0.3 m
 * folded at a chosen elbow angle, and a head whose forward axis is pitched
 * down by a chosen angle.
 *
 * Scenarios:
 * 1. Trunk inclinations of -20, 0, 15 and 40 degrees read as built, within
 *    1e-9; the reading is positive forward.
 * 2. The same figure turned to face +X and read along a heading of 90
 *    degrees gives the same inclination (the reading follows the heading).
 * 3. Knee flexions of 0, 30, 90 and 135 degrees read as built on either
 *    side, and elbow flexions of 0, 45 and 120 likewise.
 * 4. Head pitches of -10, 0 and 25 degrees read as built, positive down.
 * 5. `flexion` of three collinear points is 0 and of a right angle is 90.
 * 6. `times` from 0 to 1 at 4 Hz has five instants ending at 1, and `mean`
 *    of a linear reading over them is its midpoint value.
 * 7. A joint the figure lacks throws instead of reading as zero.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public readings on bones a test places by hand; a reading in the wrong plane, with the wrong sign or of the wrong joints fails.
 * @evidence contracts/development/testing.md#independent-expectations Every expectation is the angle the figure was constructed with by elementary trigonometry, never a value read back from the readings.
 * @evidence contracts/development/testing.md#distinguishing-cases Both signs and zero of each signed reading, a straight and a deeply folded joint, both sides, and two headings.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit on plain points; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the figure, the 7 scenarios and why the readings must be exact.
 */
export function test_human_motion_signature_readings(): void {
  const rad = (degrees: number): number => (degrees * Math.PI) / 180;
  const close = (a: number, b: number): boolean => Math.abs(a - b) <= 1e-9;

  // A point a length along a direction pitched from straight down toward
  // +Z by an angle: 0 hangs, 90 points forward.
  const swing = (
    from: IAutoMovieVector3,
    length: number,
    pitch: number,
  ): IAutoMovieVector3 => ({
    x: from.x,
    y: from.y - length * Math.cos(rad(pitch)),
    z: from.z + length * Math.sin(rad(pitch)),
  });

  // The figure facing +Z; `turn` rotates every point about +Y afterwards.
  const figure = (
    spec: { trunk: number; knee: number; elbow: number; head: number },
    turn: number = 0,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> => {
    const spin = Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, turn);
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map();
    const put = (
      bone: AutoMovieHumanoidBone,
      at: IAutoMovieVector3,
      pitchDown: number = 0,
    ): void => {
      const worldRotation = Quaternion.normalize(
        Quaternion.multiply(
          spin,
          Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, pitchDown),
        ),
      );
      bones.set(bone, {
        bone,
        localRotation: worldRotation,
        worldPosition: Quaternion.rotateVector(spin, at),
        worldRotation,
      });
    };
    const top = (x: number): IAutoMovieVector3 => ({
      x,
      y: 1 + 0.5 * Math.cos(rad(spec.trunk)),
      z: 0.5 * Math.sin(rad(spec.trunk)),
    });
    for (const [side, x] of [
      ["left", 0.1],
      ["right", -0.1],
    ] as const) {
      const hip: IAutoMovieVector3 = { x, y: 1, z: 0 };

      // The thigh continues the trunk's line through the hip, so the hip
      // reads no flexion, and the shank folds back from it by the knee angle.
      const kneeAt: IAutoMovieVector3 = swing(hip, 0.4, -spec.trunk);
      put(`${side}UpperLeg`, hip);
      put(`${side}LowerLeg`, kneeAt);
      put(`${side}Foot`, swing(kneeAt, 0.4, -spec.trunk - spec.knee));
      const shoulder: IAutoMovieVector3 = top(x);
      const elbowAt: IAutoMovieVector3 = swing(shoulder, 0.3, 0);
      put(`${side}UpperArm`, shoulder);
      put(`${side}LowerArm`, elbowAt);
      put(`${side}Hand`, swing(elbowAt, 0.3, spec.elbow));
    }
    put("neck", top(0));
    put("head", { ...top(0), y: top(0).y + 0.1 }, spec.head);
    return bones;
  };
  const reader = (
    bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
    yaw: number = 0,
  ): HumanSignature.IReader =>
    HumanSignature.of(
      { duration: 1, bones: () => bones },
      "a",
      // No reading of this test reads the body.
      {} as IHumanBody,
      yaw,
    );
  const base = { trunk: 0, knee: 0, elbow: 0, head: 0 };

  // 1 and 2. The trunk's inclination, along the heading.
  for (const trunk of [-20, 0, 15, 40]) {
    const read: number = HumanSignature.trunk(
      reader(figure({ ...base, trunk })),
      0,
    );
    TestValidator.predicate(
      `a trunk built at ${trunk} degrees reads ${read}`,
      close(read, trunk),
    );
    const turned: number = HumanSignature.trunk(
      reader(figure({ ...base, trunk }, 90), 90),
      0,
    );
    TestValidator.predicate(
      `the same trunk facing +X reads ${turned} along a heading of 90`,
      close(turned, trunk),
    );
  }

  // 3. Knee and elbow flexion, either side.
  for (const side of ["left", "right"] as const) {
    for (const knee of [0, 30, 90, 135]) {
      const read: number = HumanSignature.knee(
        reader(figure({ ...base, trunk: 10, knee })),
        0,
        side,
      );
      TestValidator.predicate(
        `a ${side} knee built at ${knee} degrees reads ${read}`,
        close(read, knee),
      );
    }
    for (const elbow of [0, 45, 120]) {
      const read: number = HumanSignature.elbow(
        reader(figure({ ...base, elbow })),
        0,
        side,
      );
      TestValidator.predicate(
        `a ${side} elbow built at ${elbow} degrees reads ${read}`,
        close(read, elbow),
      );
    }
  }

  // 4. The head's pitch, positive down.
  for (const head of [-10, 0, 25]) {
    const read: number = HumanSignature.head(
      reader(figure({ ...base, head })),
      0,
    );
    TestValidator.predicate(
      `a head pitched ${head} degrees down reads ${read}`,
      close(read, head),
    );
  }

  // 5. The flexion of plain points.
  TestValidator.predicate(
    "collinear points are straight",
    close(
      HumanSignature.flexion(
        { x: 0, y: 2, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 0, z: 0 },
      ),
      0,
    ),
  );
  TestValidator.predicate(
    "a right angle is 90 degrees of flexion",
    close(
      HumanSignature.flexion(
        { x: 0, y: 2, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 0, y: 1, z: 1 },
      ),
      90,
    ),
  );

  // 6. Instants and means.
  const ts: number[] = HumanSignature.times(0, 1, 4);
  TestValidator.equals("five instants from 0 to 1 at 4 Hz", ts.length, 5);
  TestValidator.predicate("the last instant is 1", close(ts[4]!, 1));
  TestValidator.predicate(
    "the mean of a linear reading is its midpoint value",
    close(
      HumanSignature.mean(ts, (t: number): number => 3 * t + 1),
      2.5,
    ),
  );

  // 7. A missing joint is an error, not a zero.
  const partial: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    figure(base);
  partial.delete("leftFoot");
  let thrown: boolean = false;
  try {
    HumanSignature.knee(reader(partial), 0, "left");
  } catch {
    thrown = true;
  }
  TestValidator.predicate("a knee without its foot joint throws", thrown);
}
