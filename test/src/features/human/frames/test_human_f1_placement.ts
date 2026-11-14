import { AutoMovieHumanConicLoft, AutoMovieHumanF1, AutoMovieHumanF1Joints as J, AutoMovieHumanF1Placement as P, AutoMovieHumanF1Placing as T, AutoMovieHumanSegmentFrame as F } from "@automovie/human";

/**
 * f1's re-based placing: the stored local tables return the traced figure at the reference pose, and a joint's rotation moves what
 * hangs on it rigidly and nothing else.
 *
 * Scenarios:
 * 1. A made chain of two segments whose answer is a closed form: a root at (1, 2, 3) turned a quarter turn about Z and a child 10 mm
 *    along the root's Y turned a quarter turn more. A datum 5 mm along the child's Y stands at (-9, -3, 3) and the child's X points along
 *    (-1, 0, 0); with the child's joint at zero the datum stands at (-14, 2, 3).
 * 2. The reference pose returns step 1's world tables: a sample of every kind of datum (a rig joint, a pad, a built course point, an ear
 *    polyline's centre, a landmark) and of every kind of direction (a course's `up`, a relief's `axis`, the sole's normal), each against
 *    the value step 1 stored for it, within 1e-12 of the stature (1,700 mm) for a point and 1e-12 for a direction.
 * 3. A course end is its rule's point: `handEnd`, `footEnd` and each digit's end against `AutoMovieHumanF1Joints.toward` and `beyond` on
 *    the joints, within the same tolerance.
 * 4. A parent's rotation moves its children exactly and nothing else: with the elbow and the hip turned by made rotations, every stored
 *    point past the elbow is the reference point turned rigidly about the elbow centre, `e + Q (p - e)` with `Q = A_h R' R^T A_h^T`
 *    (`A_h` the humerus's reference axes, `R` the elbow's reference rotation, `R'` the posed one), and likewise past the hip; every other
 *    point is the reference point bit for bit; and every point read back in its own posed segment's frame is its stored local value.
 * 5. `assemble` at the reference pose returns every family as its stored module: each centre, `up` and relief direction number for
 *    number, and the section table by identity (the same `knots`, `values` and relief `heights` arrays), so it was not copied or changed.
 * 6. `assemble` at the pose of scenario 4: the index finger's course is the reference course turned about the elbow, its `up` and the
 *    forearm relief's `axis` are the reference directions turned by `Q`, the trunk's course and the leg-free families are unmoved, and a
 *    family with another count of centres than its course is refused.
 * 7. The twin: reflecting every posed frame (`AutoMovieHumanSegmentFrame.mirror`) and negating a stored point's local z gives the
 *    reflection of the posed point in z = 0, so a twin placed through mirrored frames is the reflection `AutoMovieHumanConicLoft.mirror`
 *    takes of the placed family, whose centres and `up` are checked against that reflection.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls `AutoMovieHumanF1Placement.point`, `direction`, `frames` and `place`, `AutoMovieHumanF1.assemble` and the frame law's `world` on tables and made chains.
 * @evidence contracts/development/testing.md#independent-expectations A hand-solved two-segment chain, step 1's stored world numbers, a rigid rotation about one joint centre and a reflection in z = 0 are each derived apart from the chain's composition.
 * @evidence contracts/development/testing.md#distinguishing-cases A made chain, the reference pose, a pose that turns one arm joint and one leg joint, segments on and off the turned branches, and both sides of the median plane.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU unit over f1's placing tables, reached by `--include human_f1_placement`; it lofts nothing and reads no reference body.
 * @evidence contracts/development/common.md#meaningful-documentation Numbers each scenario with its closed form or stored value and its tolerance.
 */
export function test_human_f1_placement(): void {
  const failures: string[] = [];
  const stature: number = 1700;
  const near = (label: string, a: readonly number[], b: readonly number[], limit: number): void => {
    const error: number = Math.max(...a.map((x: number, i: number): number => Math.abs(x - b[i]!)));
    if (!(error <= limit) || a.length !== b.length) failures.push(`${label}: ${JSON.stringify(a)} against ${JSON.stringify(b)} (error ${error})`);
  };

  // 1: a made chain with a closed-form answer.
  const quarter: F.M3 = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
  const made: F.IJoint[] = [
    { name: "root", parent: null, offset: [1, 2, 3], rotation: quarter },
    { name: "child", parent: "root", offset: [0, 10, 0], rotation: quarter },
  ];
  const turned: F.IFrame = F.world(made, (): undefined => undefined).get("child")!;
  near("made datum", F.toWorld(turned, [0, 5, 0]), [-9, -3, 3], 1e-12);
  near("made direction", F.toWorldDirection(turned, [1, 0, 0]), [-1, 0, 0], 1e-12);
  const straight: F.IFrame = F.world(made, (name: string): F.M3 | undefined => (name === "child" ? F.IDENTITY : undefined)).get("child")!;
  near("made datum at zero", F.toWorld(straight, [0, 5, 0]), [-14, 2, 3], 1e-12);

  // 2: the reference pose returns step 1's stored world values.
  const points: [string, F.V3][] = [
    ["upperarm", [-16.33, 1353.22, 142.22]], ["hand", [140.73, 993.53, 427.22]], ["index3", [247.22, 907.85, 464.42]], ["thumbPad", [249.23, 931.95, 420.01]],
    ["calf", [16.32, 466.85, 117.13]], ["littletoe2", [131.85, 12.21, 201.42]], ["bigtoePad", [199.3, 12.53, 150.53]], ["footBall", [133, 20, 157]],
    ["axisFloor", [0, 780, 0]], ["axisCrown", [0, 1705, 0]], ["armpit", [-25, 1276, 151]], ["armTurn", [-12, 1300, 203]],
    ["helix.3", [6.56, 1598.26, 88.17]], ["plate.4", [7.5, 1605, 87]], ["antihelix.0", [6.2, 1559.8, 76.9]], ["conchaTip", [16.5, 1563, 54]],
    ["noseTip", [140, 1556, 0]], ["nostrilRoot", [127.1, 1540.4, 7.7]], ["breastRoot", [97.4, 1258.41, 65.14]], ["breastTip", [134.64, 1261.94, 71.8]],
    ["axilla.2", [-45, 1269.5, 151]], ["vault.1", [-1, 1276, 148.5]], ["breastFan", [99, 1245, 110]],
    ["epicondyleMedial", [-2.48, 1114.56, 271.09]], ["styloidRadial", [163.58, 1001.55, 408.85]], ["femoralEpicondyleLateral", [5.64, 469.11, 160.68]],
    ["pternion", [-45.89, 21.09, 133.97]], ["suprasternale", [43.15, 1415.5, 0]], ["nasion", [115.74, 1598.5, 0]], ["metacarpalBase", [161.12, 976.78, 438.87]], ["tragion", [21.55, 1563, 73.44]],
  ];
  for (const [name, world] of points) near("reference " + name, P.point(name), world, 1e-12 * stature);
  near("reference helix polyline", [P.points("helix").length, ...P.points("helix")[3]!], [11, 6.56, 1598.26, 88.17], 1e-12 * stature);
  const directions: [string, F.V3][] = [
    ["trunk.up", [1, 0, 0]], ["arm.up", [0.9998, -0.0212, 0]], ["leg.up", [1, 0, 0]], ["plate.up", [0, 0, 1]], ["finger.thumb.up", [0, 1, 0]], ["toe.big.up", [0, 1, 0]], ["breast.up", [0, 1, 0]],
    ["arm.hollow.1.axis", [-0.04203, 0.55821, 0.82864]], ["arm.fore.turn", [0.012288723763944992, -0.6332953114506825, -0.77381266192977]], ["leg.sole.axis", [0, 1, 0]],
    ["trunk.chin.axis", [-0.70711, 0.70711, 0]], ["trunk.crotch.twin.turn", [-0.9128, 0, -0.4085]], ["nose.side.axis", [0, -1, 0]], ["leg.fan.up", [0, -1, 0]],
  ];
  for (const [name, world] of directions) near("reference " + name, P.direction(name), world, 1e-12);

  // 3: each course end is its rule's point.
  near("handEnd rule", J.handEnd, J.toward(J.middle1, [[J.index1, J.index2], [J.middle1, J.middle2], [J.ring1, J.ring2], [J.pinky1, J.pinky2]], 40), 1e-12 * stature);
  near("footEnd rule", J.footEnd, J.toward(J.footBall, [[J.bigtoe1, J.bigtoe2], [J.indextoe1, J.indextoe2], [J.middletoe1, J.middletoe2], [J.ringtoe1, J.ringtoe2], [J.littletoe1, J.littletoe2]], 40), 1e-12 * stature);
  near("indexEnd rule", J.indexEnd, J.beyond(J.index3, J.indexPad, 4), 1e-12 * stature);
  near("thumbEnd rule", J.thumbEnd, J.beyond(J.thumb3, J.thumbPad, 4), 1e-12 * stature);
  near("bigtoeEnd rule", J.bigtoeEnd, J.beyond(J.bigtoe2, J.bigtoePad, 4), 1e-12 * stature);
  near("littletoeEnd rule", J.littletoeEnd, J.beyond(J.littletoe2, J.littletoePad, 4), 1e-12 * stature);

  // 4: a parent's rotation moves its children exactly and nothing else.
  const chain: Map<string, F.IJoint> = new Map(T.CHAIN.map((joint: F.IJoint): [string, F.IJoint] => [joint.name, joint]));
  const under = (segment: string, ancestor: string): boolean => {
    for (let at: string | null = segment; at !== null; at = chain.get(at)!.parent) if (at === ancestor) return true;
    return false;
  };
  const posed: Record<string, F.M3> = { forearm: F.multiply(F.about(2, 0.7), F.about(0, -0.4)), femur: F.multiply(F.about(0, 0.3), F.about(1, 0.5)) };
  const pose: P.IPose = (name: string): F.M3 | undefined => posed[name];
  const frames: P.IFrames = P.frames(pose);
  // The rigid motion of everything past a turned joint: about the joint's centre by Q = A_p R' R^T A_p^T, A_p the parent's reference axes.
  const motion = (joint: string): ((p: F.V3) => F.V3) & { turn: (d: F.V3) => F.V3 } => {
    const parent: F.M3 = F.matrix(P.frame(chain.get(joint)!.parent!));
    const q: F.M3 = F.multiply(F.multiply(parent, F.multiply(posed[joint]!, F.transpose(chain.get(joint)!.rotation))), F.transpose(parent));
    const centre: F.V3 = P.frame(joint).origin;
    return Object.assign((p: F.V3): F.V3 => F.add(centre, F.multiplyVector(q, F.sub(p, centre))), { turn: (d: F.V3): F.V3 => F.multiplyVector(q, d) });
  };
  const [elbow, hip]: (((p: F.V3) => F.V3) & { turn: (d: F.V3) => F.V3 })[] = [motion("forearm"), motion("femur")];
  let moved: number = 0;
  for (const [name, placed] of Object.entries(T.POINTS)) {
    const reference: F.V3 = P.point(name);
    const got: F.V3 = P.point(name, frames);
    if (under(placed.frame, "forearm")) near("posed " + name, got, elbow!(reference), 1e-12 * stature);
    else if (under(placed.frame, "femur")) near("posed " + name, got, hip!(reference), 1e-12 * stature);
    else near("unmoved " + name, got, reference, 0);
    if (under(placed.frame, "forearm") || under(placed.frame, "femur")) ++moved;
    near("local " + name, F.toLocal(P.frame(placed.frame, frames), got), placed.local, 1e-12 * stature);
  }
  near("points past the elbow or the hip", [moved > 40 ? 1 : 0, moved < Object.keys(T.POINTS).length - 40 ? 1 : 0], [1, 1], 0);
  near("the elbow's turn moves the wrist", [Math.hypot(...F.sub(P.point("hand", frames), P.point("hand"))) > 100 ? 1 : 0], [1], 0);

  // 5: the reference assembly is the stored modules, and no section table is copied.
  const reference: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble();
  const modules: Map<string, AutoMovieHumanConicLoft.IFamily> = new Map([...AutoMovieHumanF1.FAMILIES, ...AutoMovieHumanF1.CUTTERS].map((member: { family: AutoMovieHumanConicLoft.IFamily }): [string, AutoMovieHumanConicLoft.IFamily] => [member.family.name, member.family]));
  near("assembled families", [reference.families.length], [modules.size], 0);
  for (const family of reference.families) {
    const source: AutoMovieHumanConicLoft.IFamily | undefined = modules.get(family.name);
    if (source === undefined) {
      failures.push(`assembled ${family.name}: not a stored family`);
      continue;
    }
    near(family.name + " centres", family.centres.flat(), source.centres.flat(), 0);
    near(family.name + " up", family.up, source.up, 0);
    if (family.knots !== source.knots || family.values !== source.values || family.layout !== source.layout || family.halves !== source.halves) failures.push(`${family.name}: its section table is not the module's own`);
    (family.reliefs ?? []).forEach((relief: NonNullable<AutoMovieHumanConicLoft.IFamily["reliefs"]>[number], i: number): void => {
      const stored: NonNullable<AutoMovieHumanConicLoft.IFamily["reliefs"]>[number] = source.reliefs![i]!;
      near(relief.name + " axis", relief.axis, stored.axis, 0);
      near(relief.name + " turn", relief.turn ?? [], stored.turn ?? [], 0);
      if (relief.heights !== stored.heights || relief.stations !== stored.stations || relief.phases !== stored.phases) failures.push(`${relief.name}: its window or net is not the module's own`);
    });
  }

  // 6: the assembly at the pose of scenario 4.
  const assembled: AutoMovieHumanF1.IAssembly = AutoMovieHumanF1.assemble(pose);
  const finger = (assembly: AutoMovieHumanF1.IAssembly): AutoMovieHumanConicLoft.IFamily => assembly.digits.find((digit: AutoMovieHumanF1.IDigit): boolean => digit.family.name === "finger.index")!.family;
  near("posed finger course", finger(assembled).centres.flat(), finger(reference).centres.flatMap((p: F.V3): F.V3 => elbow!(p)), 1e-12 * stature);
  near("posed finger up", finger(assembled).up, elbow!.turn(finger(reference).up), 1e-12);
  const fore = (assembly: AutoMovieHumanF1.IAssembly): F.V3 => assembly.body.arm.reliefs!.find((relief: { name: string }): boolean => relief.name === "arm.fore")!.axis;
  near("posed forearm relief axis", fore(assembled), elbow!.turn(fore(reference)), 1e-12);
  near("posed leg course", assembled.body.leg.centres.slice(1).flat(), reference.body.leg.centres.slice(1).flatMap((p: F.V3): F.V3 => hip!(p)), 1e-12 * stature);
  near("posed leg up", assembled.body.leg.up, hip!.turn(reference.body.leg.up), 1e-12);
  near("unmoved trunk course", assembled.body.trunk.centres.flat(), reference.body.trunk.centres.flat(), 0);
  near("unmoved breast course", assembled.body.breast.centres.flat(), reference.body.breast.centres.flat(), 0);
  near("unmoved shoulder course", assembled.body.arm.centres.slice(0, 2).flat(), reference.body.arm.centres.slice(0, 2).flat(), 0);
  if (assembled.body.arm.knots !== reference.body.arm.knots) failures.push("the posed arm's section table is not the module's own");
  let refused: boolean = false;
  try {
    P.place({ ...reference.body.arm, centres: reference.body.arm.centres.slice(1) });
  } catch {
    refused = true;
  }
  if (!refused) failures.push("a family on another course was placed");

  // 7: the twin is the reflection of the placed side.
  const flip = (p: readonly number[]): number[] => [p[0]!, p[1]!, -p[2]!];
  for (const [name, placed] of Object.entries(T.POINTS)) near("twin " + name, F.toWorld(F.mirror(P.frame(placed.frame, frames)), flip(placed.local) as F.V3), flip(P.point(name, frames)), 1e-12 * stature);
  const twin: AutoMovieHumanConicLoft.IFamily = AutoMovieHumanConicLoft.mirror(assembled.body.arm, "arm.mirror");
  near("twin course", twin.centres.flat(), assembled.body.arm.centres.flatMap(flip), 0);
  near("twin up", twin.up, flip(assembled.body.arm.up), 0);

  if (failures.length > 0) throw new Error(`f1 placement: ${failures.length} finding(s):\n${failures.join("\n")}`);
}
