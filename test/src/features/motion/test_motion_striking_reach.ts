import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { StrikingReach } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * The strike reach solve places the middle and end joints so a point of the
 * distal segment meets a target, and applies the declared rule when the
 * target is out of reach.
 *
 * Scenarios:
 * 1. Reached: a target at the reach of a 30 degree flexion (law of cosines on
 *    a 0.45 m thigh and a 0.3 m shin point) is met exactly; the middle joint
 *    lies one upper length from the root on the bend side, the point one
 *    `along` from the middle, the end one lower length from it, and the
 *    flexion reads 30 degrees.
 * 2. Short: a target twice the longest reach is not met; the point lies on
 *    the root-to-target line at the band's longest reach, the gap is the
 *    difference, and the flexion is the band's least.
 * 3. Jammed with slide: a target closer than the band's shortest reach is met
 *    with the band's most flexion by sliding the contact toward the middle
 *    joint (a jammed kick); without slide (a fist) the flexion passes the
 *    band, still meeting the target, up to the jam limit.
 * 4. Metamorphic: scaling every length and point by 1.3 scales the joints by
 *    1.3 and keeps the flexion; mirroring x mirrors the joints.
 * 5. The advance clamps to its limit either way; a target at the root
 *    throws.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the solve's joints, status, gap and flexion; a wrong triangle, a missing clamp or a lost bend side fails.
 * @evidence contracts/development/testing.md#independent-expectations Reach is the closed form `sqrt(u^2 + a^2 + 2 u a cos phi)`; segment lengths and the flexion are measured back from the returned points; scaling and mirroring are exact symmetries of the geometry.
 * @evidence contracts/development/testing.md#distinguishing-cases Covers reached, short, both jammed modes, the symmetries and the advance clamp.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 5 scenarios and what each pins.
 */
export function test_motion_striking_reach(): void {
  const near = (
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
    e: number = 1e-9,
  ): boolean => Vector3.length(Vector3.subtract(a, b)) <= e;
  const len = (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
    Vector3.length(Vector3.subtract(a, b));
  const root: IAutoMovieVector3 = { x: 0.1, y: 0.9, z: 0 };
  const base: Omit<StrikingReach.IChain, "point"> = {
    root,
    upper: 0.45,
    along: 0.3,
    lower: 0.42,
    bend: { x: 0, y: 1, z: 0 },
    flexion: [5, 40],
    slide: true,
  };
  const dir: IAutoMovieVector3 = Vector3.normalize({ x: 0.3, y: -0.1, z: 1 });
  const across = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.subtract(v, Vector3.scale(dir, Vector3.dot(v, dir)));
  const bendSide = (middle: IAutoMovieVector3): number =>
    Vector3.dot(across(Vector3.subtract(middle, root)), across(base.bend));

  const at30: IAutoMovieVector3 = Vector3.add(
    root,
    Vector3.scale(dir, StrikingReach.reach(0.45, 0.3, 30)),
  );
  const r: StrikingReach.ISolution = StrikingReach.chain({
    ...base,
    point: at30,
  });
  TestValidator.predicate(
    "reached exactly",
    r.status === "reached" &&
      near(r.point, at30) &&
      Math.abs(len(r.middle, root) - 0.45) < 1e-9 &&
      Math.abs(len(r.point, r.middle) - 0.3) < 1e-9 &&
      Math.abs(len(r.end, r.middle) - 0.42) < 1e-9 &&
      Math.abs(r.flexion - 30) < 1e-6 &&
      bendSide(r.middle) > 0,
  );

  const far: IAutoMovieVector3 = Vector3.add(
    root,
    Vector3.scale(dir, 2 * StrikingReach.reach(0.45, 0.3, 5)),
  );
  const s: StrikingReach.ISolution = StrikingReach.chain({
    ...base,
    point: far,
  });
  const longest: number = StrikingReach.reach(0.45, 0.3, 5);
  TestValidator.predicate(
    "short at maximum reach along the line",
    s.status === "short" &&
      Math.abs(s.gap - longest) < 1e-9 &&
      near(s.point, Vector3.add(root, Vector3.scale(dir, longest))) &&
      Math.abs(s.flexion - 5) < 1e-6,
  );

  const close: IAutoMovieVector3 = Vector3.add(root, Vector3.scale(dir, 0.55));
  const j: StrikingReach.ISolution = StrikingReach.chain({
    ...base,
    point: close,
  });
  TestValidator.predicate(
    "jammed slides the contact",
    j.status === "jammed" &&
      near(j.point, close, 1e-9) &&
      Math.abs(j.flexion - 40) < 1e-6 &&
      j.along < 0.3 &&
      Math.abs(len(j.point, j.middle) - j.along) < 1e-9,
  );
  const rigid: StrikingReach.ISolution = StrikingReach.chain({
    ...base,
    point: close,
    slide: false,
  });
  TestValidator.predicate(
    "jammed rigid flexes past the band",
    rigid.status === "jammed" &&
      near(rigid.point, close, 1e-9) &&
      rigid.flexion > 40 &&
      rigid.flexion <= StrikingReach.JAM_FLEXION + 1e-6,
  );

  const k: number = 1.3;
  const scaled: StrikingReach.ISolution = StrikingReach.chain({
    ...base,
    root: Vector3.scale(root, k),
    point: Vector3.scale(at30, k),
    upper: 0.45 * k,
    along: 0.3 * k,
    lower: 0.42 * k,
  });
  TestValidator.predicate(
    "stature scaling",
    near(scaled.middle, Vector3.scale(r.middle, k), 1e-9) &&
      Math.abs(scaled.flexion - r.flexion) < 1e-6,
  );
  const mirror = (v: IAutoMovieVector3): IAutoMovieVector3 => ({
    x: -v.x,
    y: v.y,
    z: v.z,
  });
  const mirrored: StrikingReach.ISolution = StrikingReach.chain({
    ...base,
    root: mirror(root),
    point: mirror(at30),
  });
  TestValidator.predicate(
    "mirror",
    near(mirrored.middle, mirror(r.middle), 1e-9) &&
      near(mirrored.end, mirror(r.end), 1e-9),
  );

  TestValidator.predicate(
    "advance clamps",
    StrikingReach.advance(2, 0.5, 0.4) === 0.4 &&
      StrikingReach.advance(0, 0.5, 0.4) === -0.4 &&
      Math.abs(StrikingReach.advance(0.7, 0.5, 0.4) - 0.2) < 1e-12,
  );
  TestValidator.error("target at the root", (): unknown =>
    StrikingReach.chain({ ...base, point: root }),
  );
}
