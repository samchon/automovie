import { AutoMovieHumanF1FaceCentres as C, AutoMovieHumanF1FacePriors as P } from "@automovie/human";

type V3 = [number, number, number];

/**
 * The face's centres and dividing surfaces by their definitions, on made landmarks.
 *
 * Scenarios, each a closed form of made points:
 * 1. Eye frame: with endocanthion `(5, -2, -10)` and exocanthion `(1, 2, 12)` the canthal line is `(-4, 4, 22) / sqrt(516)`, so its tilt
 *    above the level is `atan2(4, hypot(4, 22))`; the frame is orthonormal and right-handed, its Z that line, its X in the plane of the
 *    forward direction and Z, facing forward.
 * 2. Mouth line: its origin stands the lips' margin tissue behind stomion along the forward direction, and its half length is cheilion's
 *    lateral distance.
 * 3. Ring: on a vertical course of 100 mm a cervical point 70 mm below the head's origin and 40 mm forward gives the level plane at
 *    station -70 through the course's own point.
 * 4. Orbit: the ends of both semi-axes lie on the cylinder at any depth ahead of the centre; on its axis a point reads the lesser of its
 *    depth ahead and `sqrt(a b)` inside; a point half again as far out reads `sqrt(a b) / 2` outside, and one behind the centre's plane
 *    its distance behind.
 * 5. Lips' wedge between half planes at -45 and +45 degrees: a point on the forward axis is inside by its radius times a quarter turn's
 *    half; a point at 50 degrees is outside by its radius times 5 degrees; a point past the line's end is outside by the excess.
 * 6. Nose's plane, through both alar bases parallel to subnasale to nasion: with the line vertical and the alar bases 10 behind it, the
 *    plane is `x = -10`; both alar bases read 0, the tip reads the lesser of its 30 ahead and its 20 above subnasale, a point 20 behind
 *    reads 20, and a point 5 above nasion reads 5.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `eye`, `muzzle`, `ring`, `orbit`, `wedge` and `tent` of `AutoMovieHumanF1FaceCentres` and reads the returned frames, planes and signed measures. It catches a frame built on the wrong exact axis, a mouth line placed without the tissue's depth or the modiolus's reach, a ring not square to its course, and a dividing surface with the wrong sign, the wrong semi-axis or no mirror symmetry.
 * @evidence contracts/development/testing.md#independent-expectations Each expectation is arithmetic on the made points written in the scenario list: a normalized difference, a dot product along a unit direction, an ellipse's equation, an arc as radius times angle, and membership of three points in the plane they define. The two priors are read from `AutoMovieHumanF1FacePriors` only as the offsets the definitions name.
 * @evidence contracts/development/common.md#meaningful-documentation The synthetic landmarks define eye and mouth axes, a neck ring, an orbit, and the lip and nose separating surfaces and their signed distances.
 */
export function test_human_f1_face_centres(): void {
  const failures: string[] = [];
  const near = (label: string, got: number, want: number, tolerance: number = 1e-9): void => {
    if (!(Math.abs(got - want) <= tolerance)) failures.push(`${label}: ${got}, expected ${want}`);
  };
  const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

  // 1. The eye's frame.
  const eye: ReturnType<typeof C.eye> = C.eye([0, 0, 0], [5, -2, -10], [1, 2, 12], [1, 0, 0]);
  const [X, Y, Z]: [V3, V3, V3] = eye.axes;
  const size: number = Math.sqrt(516);
  near("eye: Z along the canthal line, x", Z[0], -4 / size);
  near("eye: Z along the canthal line, y", Z[1], 4 / size);
  near("eye: Z along the canthal line, z", Z[2], 22 / size);
  near("eye: canthal tilt", Math.asin(Z[1]), Math.atan2(4, Math.hypot(4, 22)));
  near("eye: X square to Z", dot(X, Z), 0);
  near("eye: X unit", dot(X, X), 1);
  near("eye: X in the plane of forward and Z", dot(X, cross([1, 0, 0], Z)), 0);
  if (!(X[0] > 0)) failures.push(`eye: X faces backward, ${X[0]}`);
  const handed: V3 = cross(Z, X);
  near("eye: Y = Z x X", Math.hypot(Y[0] - handed[0], Y[1] - handed[1], Y[2] - handed[2]), 0);

  // 2. The mouth's line.
  const mouth: C.IMuzzle = C.muzzle([113, 20, 0], [104, 19, 22], [1, 0, 0], [0, 0, 1]);
  near("mouth: origin x", mouth.frame.origin[0], 113 - P.LIP_MARGIN_TISSUE_MM);
  near("mouth: origin y", mouth.frame.origin[1], 20);
  near("mouth: half length", mouth.half, 22);
  near("mouth: Z lateral", mouth.frame.axes[2][2], 1);

  // 3. The ring.
  const ring: C.IPlane = C.ring([0, 0, 0], [0, 100, 0], [40, 30, 0]);
  near("ring: station", ring.station, -70);
  near("ring: normal up", ring.normal[1], 1);
  near("ring: point on the course", Math.hypot(ring.point[0], ring.point[1] - 30, ring.point[2]), 0);

  // 4. The orbit.
  const orbit: (p: V3) => number = C.orbit({ origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }, 40, 30);
  near("orbit: breadth's end", orbit([5, 0, 20]), 0);
  near("orbit: height's end", orbit([7, 15, 0]), 0);
  near("orbit: on the axis 3 mm ahead of the centre", orbit([3, 0, 0]), -3);
  near("orbit: on the axis 40 mm ahead of the centre", orbit([40, 0, 0]), -Math.sqrt(300));
  near("orbit: half again outside", orbit([1, 0, 30]), 0.5 * Math.sqrt(300));
  near("orbit: behind the centre's plane", orbit([-4, 0, 0]), 4);

  // 5. The lips' wedge.
  const level: C.IMuzzle = { frame: { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }, half: 30 };
  const wedge: (p: V3) => number = C.wedge(level, [10, -10, 0], [10, 10, 0]);
  near("wedge: on the forward axis", wedge([5, 0, 0]), -5 * (Math.PI / 4));
  const fifty: number = (50 * Math.PI) / 180;
  near("wedge: 5 degrees past the upper half plane", wedge([7 * Math.cos(fifty), 7 * Math.sin(fifty), 0]), 7 * (fifty - Math.PI / 4));
  near("wedge: past the line's end", wedge([5, 0, 31]), 1);

  // 6. The nose's planes.
  const nasal: (p: V3) => number = C.nasal([0, 60, 0], [0, 0, 0], [-10, 10, 20]);
  near("nasal: the alar base on the surface", nasal([-10, 10, 20]), 0);
  near("nasal: the twin alar base on the surface", nasal([-10, 10, -20]), 0);
  near("nasal: the tip, 30 ahead of the plane and 20 above subnasale", nasal([20, 20, 0]), -20);
  near("nasal: 20 behind the plane", nasal([-30, 20, 0]), 20);
  near("nasal: a cheek point ahead of the plane is the nose's whatever its side", nasal([4, 25, 50]), nasal([4, 25, -50]));
  near("nasal: above nasion by 5", nasal([30, 65, 0]), 5);
  if (failures.length !== 0) throw new Error(`${failures.length} face centre failures:\n${failures.join("\n")}`);
}
