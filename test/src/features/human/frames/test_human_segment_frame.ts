import { AutoMovieHumanSegmentFrame as F } from "@automovie/human";

/**
 * The segment-frame law against closed forms, on made landmark sets.
 *
 * Scenarios:
 * 1. Orthonormal and right-handed: every builder's axes are unit, mutually square and have the triple product X . (Y x Z) = +1.
 * 2. ISB's definitions on landmark sets whose answer is known: a straight arm and leg in the anatomical position, turned by a known
 *    rotation Q. The humerus (2.3.4 option 1) has axes Q e1, Q e2, Q e3; the forearm (2.3.6) has X = Q e1 and Y = Q (0, 250, 22) / |.|
 *    because US stands 22 mm medial of the elbow's midline; the femur (4.4) has Y = Q (-5, 400, 0) / |.| and Z = Q e3. Each origin is the
 *    joint centre its definition names.
 * 3. The mirror: the twin's origin is (x, y, -z), its axes are right-handed, mirroring twice returns the frame, and the twin's joint
 *    rotation is `D R D` with `D = diag(1, 1, -1)`.
 * 4. Composition is associative and the inverse round trip is exact: `compose(a, compose(b, c)) = compose(compose(a, b), c)`,
 *    `compose(f, inverse(f))` is the identity, and points and directions return from the segment's frame.
 * 5. A chain: the reference rotations return the frames they were read from; identity rotations give axes parallel to the root's; a
 *    parent turned by 0.4 rad about its own Z moves its child by Rodrigues' rotation about the parent's Z through the parent's origin,
 *    while the child's offset and rotation in its parent stay as they were.
 * 6. ISB's angle sequences: `cardanZXY(Rz(a) Rx(b) Ry(c)) = (a, b, c)` and `eulerYXY(Ry(a) Rx(b) Ry(c)) = (a, b, c)` on ISB's
 *    negative-elevation branch (b = -0.7).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the builders, `mirror`, `compose`, `inverse`, `chain`, `world`, `cardanZXY` and `eulerYXY` of `AutoMovieHumanSegmentFrame`.
 * @evidence contracts/development/testing.md#independent-expectations A rotated straight limb's axes, a plane reflection, Rodrigues' rotation and the angle sequences' own products owe nothing to this code.
 * @evidence contracts/development/testing.md#distinguishing-cases An arm, a forearm with an offset styloid, a femur with an offset knee, a three-segment chain at its reference, neutral and a turned pose.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on made numbers, reached by `--include human_segment_frame`, with no reference body or figure.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the closed form it is checked against.
 */
export function test_human_segment_frame(): void {
  const failures: string[] = [];
  const near = (label: string, a: readonly number[], b: readonly number[], tolerance: number = 1e-12): void => {
    const error: number = Math.max(...a.map((x: number, i: number): number => Math.abs(x - b[i]!)));
    if (!(error <= tolerance)) failures.push(`${label}: ${JSON.stringify(a)} against ${JSON.stringify(b)} (error ${error})`);
  };
  const frame = (label: string, got: F.IFrame, want: F.IFrame, tolerance: number = 1e-12): void => {
    near(label + " origin", got.origin, want.origin, tolerance);
    for (let k: number = 0; k < 3; ++k) near(label + " axis " + "XYZ"[k], got.axes[k]!, want.axes[k]!, tolerance);
  };
  const healthy = (label: string, f: F.IFrame): void => {
    const [x, y, z]: [F.V3, F.V3, F.V3] = f.axes;
    near(label + " unit", [F.dot(x, x), F.dot(y, y), F.dot(z, z)], [1, 1, 1]);
    near(label + " square", [F.dot(x, y), F.dot(y, z), F.dot(z, x)], [0, 0, 0]);
    near(label + " triple product", [F.dot(x, F.cross(y, z))], [1]);
  };

  // A known rotation Q and a rotated landmark set: p -> o + Q p.
  const Q: F.M3 = F.multiply(F.multiply(F.about(2, 0.3), F.about(0, -0.2)), F.about(1, 0.5));
  const o: F.V3 = [10, 1300, 150];
  const at = (p: F.V3): F.V3 => F.add(o, F.multiplyVector(Q, p));
  const turned = (origin: F.V3, axes: [F.V3, F.V3, F.V3]): F.IFrame => ({ origin, axes: axes.map((a: F.V3): F.V3 => F.multiplyVector(Q, F.unit(a))) as [F.V3, F.V3, F.V3] });

  // 1 and 2: the ISB definitions.
  const humerus: F.IFrame = F.humerus(at([0, 0, 0]), at([0, -300, 25]), at([0, -300, -25]));
  healthy("humerus", humerus);
  frame("humerus", humerus, turned(o, [[1, 0, 0], [0, 1, 0], [0, 0, 1]]));
  const forearm: F.IFrame = F.forearm(at([0, -300, 0]), at([0, -550, -22]), at([0, -550, 22]), at([0, -300, 25]), at([0, -300, -25]));
  healthy("forearm", forearm);
  frame("forearm", forearm, turned(at([0, -300, 0]), [[1, 0, 0], [0, 250, 22], [0, -22, 250]]));
  const femur: F.IFrame = F.femur(at([0, 0, 0]), at([5, -400, 45]), at([5, -400, -45]));
  healthy("femur", femur);
  frame("femur", femur, turned(o, [[400, 5, 0], [-5, 400, 0], [0, 0, 1]]));
  for (const [label, f] of [["fromYZ", F.fromYZ(o, [1, 2, 3], [0.3, -1, 2])], ["fromYX", F.fromYX(o, [1, 2, 3], [0.3, -1, 2])], ["fromXY", F.fromXY(o, [1, 2, 3], [0.3, -1, 2])]] as [string, F.IFrame][]) healthy(label, f);
  near("fromYZ keeps Y", F.fromYZ(o, [0, 2, 0], [1, 1, 1]).axes[1], [0, 1, 0]);
  near("fromYX keeps Y", F.fromYX(o, [0, 2, 0], [1, 1, 1]).axes[1], [0, 1, 0]);
  near("fromXY keeps X", F.fromXY(o, [2, 0, 0], [1, 1, 1]).axes[0], [1, 0, 0]);

  // 3: the mirror.
  const twin: F.IFrame = F.mirror(forearm);
  healthy("twin", twin);
  near("twin origin", twin.origin, [forearm.origin[0], forearm.origin[1], -forearm.origin[2]]);
  frame("mirror twice", F.mirror(twin), forearm);
  const D: F.M3 = [[1, 0, 0], [0, 1, 0], [0, 0, -1]];
  const R: F.M3 = F.relative(humerus, forearm).rotation;
  const twinR: F.M3 = F.relative(F.mirror(humerus), twin).rotation;
  near("twin rotation", twinR.flat(), F.multiply(F.multiply(D, R), D).flat());

  // 4: composition and inverse.
  const a: F.IFrame = F.columns([1, 2, 3], F.multiply(F.about(0, 0.7), F.about(2, -1.1)));
  const b: F.IFrame = F.columns([-40, 5, 12], F.multiply(F.about(1, 0.4), F.about(0, 2.2)));
  const c: F.IFrame = F.columns([7, -9, 30], F.multiply(F.about(2, 1.3), F.about(1, -0.6)));
  frame("associative", F.compose(a, F.compose(b, c)), F.compose(F.compose(a, b), c), 1e-12 * 100);
  frame("inverse", F.compose(b, F.inverse(b)), { origin: [0, 0, 0], axes: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }, 1e-12 * 100);
  const q: F.V3 = [12.5, -300.25, 41];
  near("point round trip", F.toLocal(b, F.toWorld(b, q)), q, 1e-12 * 1000);
  near("direction round trip", F.toLocalDirection(b, F.toWorldDirection(b, [0.2, -0.5, 0.8])), [0.2, -0.5, 0.8]);
  near("toWorld closed form", F.toWorld(b, [1, 0, 0]), F.add(b.origin, b.axes[0]));

  // 5: a chain of three segments.
  const root: F.IFrame = F.columns([0, 900, 0], F.about(1, 0.2));
  const upper: F.IFrame = F.fromYZ([20, 1350, 140], [0.1, 1, -0.6], [0, 0, 1]);
  const lower: F.IFrame = F.fromYZ([25, 1100, 300], [-0.4, 1, -0.5], [0.2, 0, 1]);
  const segments: { name: string; parent: string | null; frame: F.IFrame }[] = [
    { name: "root", parent: null, frame: root },
    { name: "upper", parent: "root", frame: upper },
    { name: "lower", parent: "upper", frame: lower },
  ];
  const joints: F.IJoint[] = F.chain(segments);
  const reference: Map<string, F.IFrame> = F.world(joints, (): undefined => undefined);
  for (const s of segments) frame("reference " + s.name, reference.get(s.name)!, s.frame, 1e-12 * 1500);
  const neutral: Map<string, F.IFrame> = F.world(joints, (name: string): F.M3 | undefined => (name === "root" ? undefined : F.IDENTITY));
  for (const s of segments) for (let k: number = 0; k < 3; ++k) near("neutral " + s.name + " axis " + "XYZ"[k], neutral.get(s.name)!.axes[k]!, root.axes[k]!);
  near("neutral upper origin", neutral.get("upper")!.origin, F.toWorld(root, joints[1]!.offset), 1e-12 * 1500);

  // Turn the upper segment by 0.4 rad about its own Z: the lower one turns by Rodrigues' rotation about that axis through its origin.
  const angle: number = 0.4;
  const posed: Map<string, F.IFrame> = F.world(joints, (name: string): F.M3 | undefined => (name === "upper" ? F.multiply(joints[1]!.rotation, F.about(2, angle)) : undefined));
  const k: F.V3 = upper.axes[2];
  const spin = (v: F.V3): F.V3 => F.add(F.add(F.scale(v, Math.cos(angle)), F.scale(F.cross(k, v), Math.sin(angle))), F.scale(k, F.dot(k, v) * (1 - Math.cos(angle))));
  frame("turned lower", posed.get("lower")!, { origin: F.add(upper.origin, spin(F.sub(lower.origin, upper.origin))), axes: [spin(lower.axes[0]), spin(lower.axes[1]), spin(lower.axes[2])] }, 1e-12 * 1500);
  near("turned upper origin stays", posed.get("upper")!.origin, upper.origin, 1e-12 * 1500);
  const local: { offset: F.V3; rotation: F.M3 } = F.relative(posed.get("upper")!, posed.get("lower")!);
  near("local offset unchanged", local.offset, joints[2]!.offset, 1e-12 * 1500);
  near("local rotation unchanged", local.rotation.flat(), joints[2]!.rotation.flat());

  // 6: the angle sequences.
  const [p, r, s]: number[] = [0.35, -0.25, 0.6];
  near("Z-X-Y", F.cardanZXY(F.multiply(F.multiply(F.about(2, p), F.about(0, r)), F.about(1, s))), [p, r, s]);
  near("Y-X-Y", F.eulerYXY(F.multiply(F.multiply(F.about(1, p), F.about(0, -0.7)), F.about(1, s))), [p, -0.7, s]);

  if (failures.length > 0) throw new Error(`segment frame law: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
