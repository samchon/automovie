import { AutoMovieHumanF1Frames, AutoMovieHumanF1Joints as J, AutoMovieHumanF1Landmarks as L, AutoMovieHumanSegmentFrame as F } from "@automovie/human";

/**
 * f1's segment-frame tree: well formed, on its joints, and returned exactly by its chain.
 *
 * Scenarios:
 * 1. Every segment's parent precedes it, and the tree holds the segments the brief names: pelvis, thorax, head, ear, nose, breast, the arm
 *    to each finger's three phalanges and the thumb's three bones, and the leg to each toe's two.
 * 2. Every frame is orthonormal and right-handed (X . (Y x Z) = +1), so the stored side's Z points to +Z.
 * 3. Every articulated segment's origin is the joint centre it pivots about, from the joint table: GH, the elbow, the wrist, each finger's
 *    and the thumb's joints, the hip, the knee, the ankle and each toe's joints; the thorax's origin is IJ and the head's the bitragion
 *    midpoint on the median plane.
 * 4. The stored chain (`joints`) at the reference rotations returns every frame the rules build (`segments`) within 1e-12 of the stature
 *    (1,700 mm); at identity rotations every axis is parallel to the pelvis's (the neutral body) while each origin keeps its offset in
 *    its parent.
 * 5. The twin: every mirrored frame is right-handed and its joint rotation is `D R D`.
 * 6. The rules stay the stored chain's definition: `AutoMovieHumanSegmentFrame.chain` of the frames the rules build has every segment
 *    of the stored chain, with the same parent, its offset within 1e-12 of the stature and its rotation within 1e-12.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1Frames.segments`, `joints` and `world` and the law's `mirror` and `relative`.
 * @evidence contracts/development/testing.md#independent-expectations Joint centres from the joint table, the triple product of a right-handed frame and a reflection's effect on a rotation owe nothing to the tree's rules.
 * @evidence contracts/development/testing.md#distinguishing-cases The trunk's parallel frames, ISB's limb frames, the phalanges' chains and the rigid face parts.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit on the f1 tables, reached by `--include human_f1_frames`, with no reference body or figure.
 * @evidence contracts/development/common.md#meaningful-documentation Lists each scenario with the expectation it is checked against.
 */
export function test_human_f1_frames(): void {
  const failures: string[] = [];
  const tolerance: number = 1e-12 * 1700;
  const near = (label: string, a: readonly number[], b: readonly number[], limit: number = 1e-12): void => {
    const error: number = Math.max(...a.map((x: number, i: number): number => Math.abs(x - b[i]!)));
    if (!(error <= limit)) failures.push(`${label}: ${JSON.stringify(a)} against ${JSON.stringify(b)} (error ${error})`);
  };
  const segments: AutoMovieHumanF1Frames.ISegment[] = AutoMovieHumanF1Frames.segments();
  const byName: Map<string, AutoMovieHumanF1Frames.ISegment> = new Map(segments.map((s: AutoMovieHumanF1Frames.ISegment): [string, AutoMovieHumanF1Frames.ISegment] => [s.name, s]));

  // 1: parents first, and the named segments.
  const seen: Set<string> = new Set();
  for (const s of segments) {
    if (s.parent !== null && !seen.has(s.parent)) failures.push(`${s.name}: parent ${s.parent} does not precede it`);
    seen.add(s.name);
  }
  const fingers: string[] = ["index", "middle", "ring", "pinky"].flatMap((f: string): string[] => ["proximal", "middle", "distal"].map((b: string): string => f + "." + b));
  const thumb: string[] = ["metacarpal", "proximal", "distal"].map((b: string): string => "thumb." + b);
  const toes: string[] = ["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"].flatMap((t: string): string[] => ["proximal", "distal"].map((b: string): string => t + "." + b));
  for (const name of ["pelvis", "thorax", "head", "ear", "nose", "breast", "humerus", "forearm", "hand", ...fingers, ...thumb, "femur", "tibia", "foot", ...toes]) if (!byName.has(name)) failures.push(`missing segment ${name}`);
  near("segment count", [segments.length], [9 + fingers.length + thumb.length + 3 + toes.length], 0);

  // 2: orthonormal and right-handed.
  for (const s of segments) {
    const [x, y, z]: [F.V3, F.V3, F.V3] = s.frame.axes;
    near(s.name + " unit", [F.dot(x, x), F.dot(y, y), F.dot(z, z)], [1, 1, 1]);
    near(s.name + " square", [F.dot(x, y), F.dot(y, z), F.dot(z, x)], [0, 0, 0]);
    near(s.name + " triple product", [F.dot(x, F.cross(y, z))], [1]);
  }

  // 3: origins on the joints.
  const origins: [string, F.V3][] = [
    ["thorax", L.suprasternale],
    ["head", [L.tragion[0], L.tragion[1], 0]],
    ["humerus", J.upperarm],
    ["forearm", J.lowerarm],
    ["hand", J.hand],
    ["index.proximal", J.index1], ["index.middle", J.index2], ["index.distal", J.index3],
    ["middle.proximal", J.middle1], ["middle.middle", J.middle2], ["middle.distal", J.middle3],
    ["ring.proximal", J.ring1], ["ring.middle", J.ring2], ["ring.distal", J.ring3],
    ["pinky.proximal", J.pinky1], ["pinky.middle", J.pinky2], ["pinky.distal", J.pinky3],
    ["thumb.metacarpal", J.thumb1], ["thumb.proximal", J.thumb2], ["thumb.distal", J.thumb3],
    ["femur", J.thigh],
    ["tibia", J.calf],
    ["foot", J.foot],
    ["bigtoe.proximal", J.bigtoe1], ["bigtoe.distal", J.bigtoe2],
    ["indextoe.proximal", J.indextoe1], ["indextoe.distal", J.indextoe2],
    ["middletoe.proximal", J.middletoe1], ["middletoe.distal", J.middletoe2],
    ["ringtoe.proximal", J.ringtoe1], ["ringtoe.distal", J.ringtoe2],
    ["littletoe.proximal", J.littletoe1], ["littletoe.distal", J.littletoe2],
  ];
  for (const [name, point] of origins) if (byName.has(name)) near(name + " origin", byName.get(name)!.frame.origin, point, 0);

  // 4: the chain returns the reference, and identity rotations give the neutral body.
  const joints: F.IJoint[] = AutoMovieHumanF1Frames.joints();
  const reference: Map<string, F.IFrame> = AutoMovieHumanF1Frames.world((): undefined => undefined);
  for (const s of segments) {
    const got: F.IFrame | undefined = reference.get(s.name);
    if (got === undefined) {
      failures.push(`${s.name}: not returned by the chain`);
      continue;
    }
    near(s.name + " reference origin", got.origin, s.frame.origin, tolerance);
    for (let k: number = 0; k < 3; ++k) near(s.name + " reference axis " + "XYZ"[k], got.axes[k]!, s.frame.axes[k]!);
  }
  const neutral: Map<string, F.IFrame> = AutoMovieHumanF1Frames.world((name: string): F.M3 | undefined => (name === "pelvis" ? undefined : F.IDENTITY));
  const pelvis: F.IFrame = byName.get("pelvis")!.frame;
  for (const joint of joints) {
    const got: F.IFrame = neutral.get(joint.name)!;
    for (let k: number = 0; k < 3; ++k) near(joint.name + " neutral axis " + "XYZ"[k], got.axes[k]!, pelvis.axes[k]!);
    if (joint.parent !== null) near(joint.name + " neutral offset", F.toLocal(neutral.get(joint.parent)!, got.origin), joint.offset, tolerance);
  }

  // 5: the twin.
  const D: F.M3 = [[1, 0, 0], [0, 1, 0], [0, 0, -1]];
  for (const joint of joints) {
    if (joint.parent === null) continue;
    const child: F.IFrame = F.mirror(byName.get(joint.name)!.frame);
    const parent: F.IFrame = F.mirror(byName.get(joint.parent)!.frame);
    near(joint.name + " twin triple product", [F.dot(child.axes[0], F.cross(child.axes[1], child.axes[2]))], [1]);
    near(joint.name + " twin rotation", F.relative(parent, child).rotation.flat(), F.multiply(F.multiply(D, joint.rotation), D).flat());
  }

  // 6: the rules return the stored chain.
  const ruled: F.IJoint[] = F.chain(segments);
  near("chain length", [ruled.length], [joints.length], 0);
  ruled.forEach((joint: F.IJoint, i: number): void => {
    const stored: F.IJoint | undefined = joints[i];
    if (stored === undefined || stored.name !== joint.name || stored.parent !== joint.parent) {
      failures.push(`${joint.name}: the stored chain holds ${stored?.name ?? "nothing"} under ${stored?.parent ?? "none"} there`);
      return;
    }
    near(joint.name + " stored offset", stored.offset, joint.offset, tolerance);
    near(joint.name + " stored rotation", stored.rotation.flat(), joint.rotation.flat());
  });

  if (failures.length > 0) throw new Error(`f1 frames: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
