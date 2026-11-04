import { AutoMovieHumanJointedAxis } from "../../../../../../packages/human/src/generation/limb/AutoMovieHumanJointedAxis";
import { type AutoMovieLoftFrame, AutoMovieSolidVector } from "@automovie/engine";

type Vec3 = AutoMovieSolidVector.Vec3;
const { cross, dot, norm, scale, sub } = AutoMovieSolidVector;

/**
 * A limb's jointed axis runs straight along each bone, turns at each joint
 * within the joint's own half length, keeps an orthonormal frame whose normal
 * is the axis's own direction, never spins about the bone, and moves C2 in
 * station; malformed chains are refused.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds `AutoMovieHumanJointedAxis.create` on a made three-bone chain (an arm-like walk: 300, 250 and 90 mm bones turned 12 and 20 degrees in different planes, half lengths 35 and 20 mm) and reads `at(station)` every 0.5 mm: orthonormality of `u`, `v`; the frame normal `v x u` against the origin's own derivative (a central difference over 1e-3 mm); the twist rate `u' . v` (zero for a frame that does not spin about its axis); the second station difference of the direction against its neighbours' (no jump in curvature); the direction on each straight run against its bone; and the joint centres downstream of each turn against the made centres. It catches a turn that leaks outside its half length, a frame whose normal is not the axis, a spin about the bone, a C1-only turn, and a misplaced downstream joint.
 * @evidence contracts/testing.md#independent-expectations Expectations are the made chain's own geometry and the frame's definition: on a straight run the direction is the bone's (1e-9); the normal is the unit tangent of the origin (1e-6, the difference's truncation at 1e-3 mm); a rotation about a fixed axis square to both bones has zero twist (1e-6 per mm); the quintic smoothstep's angle is C2, so the direction's second difference over 0.5 mm changes between neighbours by no more than the smooth bound `2 Theta max|e'''| h / span^3` (`max|e'''| = 60`), while a C1 turn (a cubic smoothstep) jumps by `6 Theta / span^2` at its ends, four to seven times that bound on this chain; downstream joint centres stand within `h Theta^2` of the made ones (the turn's corner cut is second order in its angle: its first-order part cancels by the smoothstep's symmetry `e(1 - x) = 1 - e(x)`).
 * @evidence contracts/testing.md#distinguishing-cases Green: the made chain; a two-centre chain (one bone, no joint) gives a straight axis. Refused: a zero-length bone, a joint count that does not match the centres, overlapping turns, and a first chart axis along the bone each return null. The view loft over this axis is `test_construction_operator_view_section`'s; the limbs' sizes are their identity tests'.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_limb_piece_jointed_axis`; closed-form inputs, no host, browser or GPU.
 */
export function test_human_limb_piece_jointed_axis(): void {
  const failures: string[] = [];
  const turn = (d: Vec3, k: Vec3, degrees: number): Vec3 => {
    const a: number = (degrees * Math.PI) / 180;
    return [0, 1, 2].map((c: number): number => d[c]! * Math.cos(a) + cross(k, d)[c]! * Math.sin(a) + k[c]! * dot(k, d) * (1 - Math.cos(a))) as Vec3;
  };
  const d0: Vec3 = [0, -1, 0];
  const d1: Vec3 = turn(d0, [1, 0, 0], 12);
  const d2: Vec3 = turn(d1, [0, 0.6, 0.8], 20);
  const lengths: number[] = [300, 250, 90];
  const centres: Vec3[] = [[10, 1300, 180]];
  [d0, d1, d2].forEach((d: Vec3, i: number): void => {
    centres.push(centres[i]!.map((x: number, c: number): number => x + lengths[i]! * d[c]!) as Vec3);
  });
  const halves: number[] = [35, 20];
  const angles: number[] = [12, 20].map((a: number): number => (a * Math.PI) / 180);
  const axis: AutoMovieHumanJointedAxis.IAxis | null = AutoMovieHumanJointedAxis.create({ centres, joints: halves.map((half: number): AutoMovieHumanJointedAxis.IJoint => ({ half })), u: [1, 0, 0] });
  if (axis === null) throw new Error("the made chain was refused");

  // Frames every 0.5 mm along the whole walk.
  const end: number = axis.stations[axis.stations.length - 1]!;
  const h: number = 0.5;
  const direction = (s: number): Vec3 => {
    const f: AutoMovieLoftFrame.IFrame = axis.at(s);
    return cross(f.v as Vec3, f.u as Vec3);
  };
  // A C2 turn changes the direction's second difference between neighbours
  // by at most max |t'''| h: the angle's third derivative peaks at
  // Theta max|e'''| / span^3 with max|e'''| = 60 for the quintic smoothstep,
  // taken twice for the lower-order terms. A C1 turn (a cubic smoothstep,
  // e''(0) = 6) jumps by Theta 6 / span^2 at its ends, four to seven times
  // this bound on the made chain.
  const smooth: number = Math.max(...halves.map((half: number, i: number): number => (2 * angles[i]! * 60 * h) / (2 * half) ** 3));
  let previous: number | null = null;
  for (let s: number = h; s < end - h; s += h) {
    const f: AutoMovieLoftFrame.IFrame = axis.at(s);
    const u: Vec3 = f.u as Vec3;
    const v: Vec3 = f.v as Vec3;
    if (Math.abs(norm(u) - 1) > 1e-9 || Math.abs(norm(v) - 1) > 1e-9 || Math.abs(dot(u, v)) > 1e-9) failures.push(`station ${s}: the chart axes are not orthonormal`);

    // The normal is the origin's own direction.
    const e: number = 1e-3;
    const tangent: Vec3 = scale(sub(axis.at(s + e).origin as Vec3, axis.at(s - e).origin as Vec3), 1 / (2 * e));
    if (norm(sub(tangent, direction(s))) > 1e-6) failures.push(`station ${s}: the frame normal is off the axis's tangent by ${norm(sub(tangent, direction(s)))}`);

    // No spin about the axis.
    const du: Vec3 = scale(sub(axis.at(s + e).u as Vec3, axis.at(s - e).u as Vec3), 1 / (2 * e));
    if (Math.abs(dot(du, v)) > 1e-6) failures.push(`station ${s}: the frame spins at ${dot(du, v)} per mm`);

    // C2: the direction's second difference has no jump between neighbours.
    const second: number = norm(scale(sub(sub(direction(s + h), direction(s)), sub(direction(s), direction(s - h))), 1 / (h * h)));
    if (previous !== null && Math.abs(second - previous) > smooth) failures.push(`station ${s}: the direction's curvature jumps from ${previous} to ${second} per mm^2`);
    previous = second;
  }

  // Straight runs follow their bones; downstream centres stand in place.
  const runs: [number, number, Vec3][] = [
    [0, axis.stations[1]! - halves[0]!, d0],
    [axis.stations[1]! + halves[0]!, axis.stations[2]! - halves[1]!, d1],
    [axis.stations[2]! + halves[1]!, end, d2],
  ];
  for (const [a, b, d] of runs)
    for (const s of [a + 0.25, (a + b) / 2, b - 0.25]) if (norm(sub(direction(s), d)) > 1e-9) failures.push(`station ${s}: off its bone's direction by ${norm(sub(direction(s), d))}`);
  for (let i: number = 1; i < centres.length; i++) {
    const bound: number = i === 1 ? 1e-9 : halves.slice(0, i - 1).reduce((sum: number, half: number, k: number): number => sum + half * angles[k]! ** 2, 0) + 1e-9;
    const off: number = norm(sub(axis.at(axis.stations[i]!).origin as Vec3, centres[i]!));
    if (off > bound) failures.push(`centre ${i}: ${off} mm from its made place, over ${bound}`);
  }

  // One bone: a straight axis.
  const one: AutoMovieHumanJointedAxis.IAxis | null = AutoMovieHumanJointedAxis.create({ centres: centres.slice(0, 2), joints: [], u: [1, 0, 0] });
  if (one === null || norm(sub(one.at(150).origin as Vec3, [10, 1150, 180])) > 1e-9) failures.push("one bone: not the straight axis");

  // Refused chains.
  const refuse = (name: string, input: AutoMovieHumanJointedAxis.IInput): void => {
    if (AutoMovieHumanJointedAxis.create(input) !== null) failures.push(`${name}: accepted`);
  };
  refuse("a zero-length bone", { centres: [centres[0]!, centres[0]!, centres[1]!], joints: [{ half: 10 }], u: [1, 0, 0] });
  refuse("a joint count that does not match", { centres, joints: [{ half: 10 }], u: [1, 0, 0] });
  refuse("overlapping turns", { centres: [centres[0]!, centres[1]!, centres[2]!, centres[3]!], joints: [{ half: 200 }, { half: 100 }], u: [1, 0, 0] });
  refuse("a chart axis along the bone", { centres, joints: halves.map((half: number): AutoMovieHumanJointedAxis.IJoint => ({ half })), u: d0 });

  if (failures.length !== 0) throw new Error(`${failures.length} jointed axis findings:\n${failures.slice(0, 40).join("\n")}`);
}
