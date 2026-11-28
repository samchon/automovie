import { AutoMovieEngineViewJointedCourse } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanF1,
  AutoMovieHumanF1Centres as Centres,
  AutoMovieHumanF1Placement as P,
  AutoMovieHumanF1Placing as T,
  AutoMovieHumanF1SegmentLengths as Lengths,
  AutoMovieHumanSegmentFrame as F,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1SegmentLengths,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewJointedCourse,
} from "@automovie/interface";

/**
 * Every f1 course is generated from its centres' rules, a length moves exactly the centres past it, and every turn is C2.
 *
 * Scenarios:
 * 1. For every authored family and cutter of f1, the centres generated at f1's own lengths are the family's stored `centres` bit for bit.
 * 2. A 10 % longer thigh leaves the leg course's first centre (the hip joint centre) and the whole arm course bit for bit and moves the
 *    knee, the ankle, the ball and the foot's end by one common vector, a tenth of the tibia's stored offset turned into the figure's frame.
 * 3. A chain whose glenohumeral centre is moved by [1, 2, 3] mm in the thorax's frame moves the arm's two thorax datums and the armpit
 *    cutter's centres by that same vector (the offset law), and leaves the trunk's centres.
 * 4. At both ends of every turn of every f1 course the tangent is the neighbouring straight run's direction and the curvature is zero, and
 *    at the turn's middle the curvature is the quintic's peak, 15/8 of the angle over the turn's arclength 2 h: tangent and curvature are
 *    continuous through every turn.
 * 5. Every course centre has an inventory row with a kind and a rule, and a joint centre is its segment's origin. A failure appends the
 *    whole centre table with every turn's half length, angle, set-back and section size and every course's offsets from its sections'
 *    centres and from its bone line.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production centre generator, offset law and inventory, and reads the production course's own jets.
 * @evidence contracts/development/testing.md#independent-expectations Stored centres are the comparison for f1; the moved centres are a stored offset through the stored frames; the turn's end and peak curvatures are the closed form of the quintic smoothstep angle.
 * @evidence contracts/development/common.md#meaningful-documentation Stored centre identity, local effects of a longer thigh or moved shoulder, turn jets and the inventory of centre owners are checked separately.
 */
export function test_human_f1_centres(): void {
  const failures: string[] = [];
  const families: IAutoMovieHumanConicLoft.IFamily[] = [
    ...AutoMovieHumanF1.FAMILIES.map((member: { family: IAutoMovieHumanConicLoft.IFamily }): IAutoMovieHumanConicLoft.IFamily => member.family),
    ...AutoMovieHumanF1.CUTTERS.map((cutter: { family: IAutoMovieHumanConicLoft.IFamily }): IAutoMovieHumanConicLoft.IFamily => cutter.family),
  ];
  const same = (a: readonly number[], b: readonly number[]): boolean => a.every((x: number, k: number): boolean => Object.is(x, b[k]));
  const near = (what: string, got: readonly number[], want: readonly number[], tolerance: number): void => {
    const d: number = Math.hypot(...got.map((x: number, k: number): number => x - want[k]!));
    if (!(d <= tolerance)) failures.push(`${what}: [${got.join(", ")}] instead of [${want.join(", ")}]`);
  };

  // 1. f1's centres.
  for (const family of families) {
    const made: AutoMovieVector3Tuple[] = Centres.course(family.name);
    if (made.length !== family.centres.length) failures.push(`${family.name}: ${made.length} generated centres for ${family.centres.length} stored`);
    else made.forEach((p: AutoMovieVector3Tuple, k: number): void => {
      if (!same(p, family.centres[k]!)) failures.push(`${family.name} centre ${k} is not the stored centre`);
    });
  }

  // 2. A longer thigh.
  const longer: IAutoMovieHumanF1SegmentLengths.IFields = { ...Lengths.F1, thigh: Lengths.F1.thigh * 1.1 };
  const [leg0, leg1] = [Centres.course("leg"), Centres.course("leg", longer)];
  const femur: IAutoMovieHumanSegmentFrame = P.REFERENCE.get("femur")!;
  const move: AutoMovieVector3Tuple = F.scale(F.toWorldDirection(femur, T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === "tibia")!.offset), 0.1);
  if (!same(leg1[0]!, leg0[0]!)) failures.push("a longer thigh moved the hip joint centre");
  for (let k: number = 1; k < leg0.length; ++k) near(`leg centre ${k} under a longer thigh`, leg1[k]!, F.add(leg0[k]!, move), 1e-9);
  Centres.course("arm", longer).forEach((p: AutoMovieVector3Tuple, k: number): void => {
    if (!same(p, Centres.course("arm")[k]!)) failures.push(`a longer thigh moved the arm's centre ${k}`);
  });

  // 3. The offset law on a moved glenohumeral centre.
  const shift: AutoMovieVector3Tuple = [1, 2, 3];
  const chain: IAutoMovieHumanSegmentJoint[] = T.CHAIN.map((j: IAutoMovieHumanSegmentJoint): IAutoMovieHumanSegmentJoint => (j.name === "humerus" ? { ...j, offset: F.add(j.offset, shift) } : j));
  const world: AutoMovieVector3Tuple = F.toWorldDirection(P.REFERENCE.get("thorax")!, shift);
  for (const course of ["arm", "axilla"]) {
    const [before, after] = [Centres.course(course), Centres.course(course, Lengths.F1, chain)];
    const count: number = course === "arm" ? 2 : before.length;
    for (let k: number = 0; k < count; ++k) near(`${course} centre ${k} under a moved shoulder`, after[k]!, F.add(before[k]!, world), 1e-9);
  }
  Centres.course("trunk", Lengths.F1, chain).forEach((p: AutoMovieVector3Tuple, k: number): void => {
    if (!same(p, Centres.course("trunk")[k]!)) failures.push(`a moved shoulder moved the trunk's centre ${k}`);
  });

  // 4. Every turn is C2: straight tangents and zero curvature at its ends, the quintic's peak curvature at its middle.
  for (const family of families) {
    if (family.halves.length === 0) continue;
    const prepared: IAutoMovieViewJointedCourse.ICourse | string = AutoMovieEngineViewJointedCourse.prepare(family.centres, family.halves);
    if (typeof prepared === "string") {
      failures.push(`${family.name}: ${prepared}`);
      continue;
    }
    const axis: IAutoMovieViewAxis.IAxis = H.axis({ centres: family.centres, halves: family.halves, up: family.up });
    const jet = (s: number): IAutoMovieViewAxisJet.IJet => {
      const j: IAutoMovieViewAxisJet.IJet | null | undefined = axis.jet?.(s);
      if (j === null || j === undefined) throw new Error(`${family.name} has no course jet at ${s}`);
      return j;
    };
    for (const turn of prepared.turns) {
      if (turn.angle === 0) continue;
      const [a, m, b] = [jet(turn.start), jet(turn.start + turn.half), jet(turn.start + 2 * turn.half)];
      near(`${family.name} turn ${turn.centre} tangent in`, a.first.origin, prepared.directions[turn.centre - 1]!, 1e-9);
      near(`${family.name} turn ${turn.centre} tangent out`, b.first.origin, prepared.directions[turn.centre]!, 1e-9);
      near(`${family.name} turn ${turn.centre} curvature in`, a.second.origin, [0, 0, 0], 1e-12);
      near(`${family.name} turn ${turn.centre} curvature out`, b.second.origin, [0, 0, 0], 1e-12);
      const peak: number = ((15 / 8) * turn.angle) / (2 * turn.half);
      if (!(Math.abs(Math.hypot(...m.second.origin) - peak) <= 1e-9 * Math.max(1, peak)))
        failures.push(`${family.name} turn ${turn.centre}: middle curvature ${Math.hypot(...m.second.origin)} instead of ${peak}`);
    }
  }

  // 5. The inventory.
  const report: string[] = [];
  for (const [course, centres] of Object.entries(Centres.inventory()))
    for (const centre of centres) {
      report.push(`${course} | ${centre.name} | ${centre.kind} | ${centre.frame} | ${centre.rule}`);
      if (centre.rule.length === 0) failures.push(`${course}.${centre.name} has no rule`);
      if (centre.kind === "joint" && !T.POINTS[centre.name]!.local.every((x: number): boolean => x === 0)) failures.push(`${course}.${centre.name} is called a joint centre off its segment's origin`);
    }
  for (const family of families) {
    for (const turn of Centres.turns(family))
      report.push(`TURN ${family.name} | ${turn.centre} | half ${turn.half} | angle ${((turn.angle * 180) / Math.PI).toFixed(2)} | setback ${turn.setback.toFixed(3)} | gap ${turn.gap.toFixed(3)} | station ${turn.station.toFixed(2)} | radius ${turn.radius.toFixed(2)} | half/radius ${(turn.half / turn.radius).toFixed(3)}`);
    const offsets: Centres.IOffset[] = Centres.offsets(family);
    const norms: number[] = offsets.map((o: Centres.IOffset): number => Math.hypot(o.centroid[0], o.centroid[1]));
    const bones: number[] = offsets.filter((o: Centres.IOffset): boolean => o.bone !== null).map((o: Centres.IOffset): number => o.bone!);
    report.push(`OFFSET ${family.name} | centroid max ${Math.max(...norms).toFixed(2)} mean ${(norms.reduce((x: number, y: number): number => x + y, 0) / norms.length).toFixed(2)} | bone ${bones.length === 0 ? "none" : `max ${Math.max(...bones).toFixed(2)} mean ${(bones.reduce((x: number, y: number): number => x + y, 0) / bones.length).toFixed(2)}`} | ${offsets.map((o: Centres.IOffset): string => `${o.station}:[${o.centroid[0].toFixed(1)},${o.centroid[1].toFixed(1)}]${o.bone === null ? "" : "b" + o.bone.toFixed(1)}`).join(" ")}`);
  }
  if (failures.length !== 0) throw new Error([...failures, "", ...report].join("\n"));
}
