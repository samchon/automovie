import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanCourseRuns as Runs,
  AutoMovieHumanF1,
  AutoMovieHumanF1Centres as Centres,
  AutoMovieHumanF1NativeCourse as Course,
  AutoMovieHumanF1Placement as P,
  AutoMovieHumanF1SegmentLengths as Lengths,
} from "@automovie/human";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1SegmentLengths,
  IAutoMovieHumanSegmentJoint,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
} from "@automovie/interface";

/**
 * A segment length enters a family through its course in material stations (`AutoMovieHumanF1NativeCourse`).
 *
 * Scenarios:
 * 1. f1's leg placed at f1's own lengths has unchanged runs, and so has every other family of the figure.
 * 2. f1's leg with a shank 1.1 times as long, placed on the chain those lengths make: its runs are changed; at the material station of
 *    each reference joint (the hip centre, the knee's, the ankle's and the ball's turn middles, the course's end) the course stands off
 *    the person's joint centre by the very vector the reference course stands off the reference's centre, and its section plane is the
 *    reference's there. The joint centres are known apart from the course: the hip and the knee where they were, the three past the
 *    shank moved by a tenth of the foot's stored offset turned into the figure's frame.
 *    A thigh 0.9 times as long moves an unheld first ring (station 104) 10.4 mm up the femur; with the root held to 155 mm the course
 *    there is the reference's point, the ring stays within 1 mm and the knee still lands on the person's knee centre.
 * 3. The same leg's arm, which no shank moves, keeps unchanged runs.
 * 4. A trunk length other than f1's is refused by name, each of the two; f1's own lengths are admitted.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production `create`, `unchanged` and `admit` on f1's stored leg and arm placed through the production chain and datum laws, and reads the returned course's frames.
 * @evidence contracts/development/testing.md#independent-expectations A rigid bone carries its far joints by one vector and turns nothing, so the course's stand-off from each joint centre and its section planes are the reference's own; the moved centres are a stored offset through the stored frames.
 * @evidence contracts/development/common.md#meaningful-documentation Reference lengths retain the stored runs. A longer shank moves only the owning leg course, and both unsupported trunk length requests have named refusals.
 */
export function test_human_f1_native_course(): void {
  const failures: string[] = [];
  const family = (name: string): IAutoMovieHumanConicLoft.IFamily => {
    const found: { family: IAutoMovieHumanConicLoft.IFamily } | undefined = AutoMovieHumanF1.FAMILIES.find((member: { family: IAutoMovieHumanConicLoft.IFamily }): boolean => member.family.name === name);
    if (found === undefined) throw new Error("f1 has no family " + name);
    return found.family;
  };
  const placedAt = (prior: IAutoMovieHumanConicLoft.IFamily, lengths: IAutoMovieHumanF1SegmentLengths.IFields): IAutoMovieHumanConicLoft.IFamily => {
    const chain: readonly IAutoMovieHumanSegmentJoint[] = Lengths.chain(lengths);
    return P.repose(prior, P.frames(undefined, chain), (name: string): AutoMovieVector3Tuple => Centres.local(name, lengths, chain)).family;
  };
  const leg: IAutoMovieHumanConicLoft.IFamily = family("leg");

  // 1. Unchanged lengths, every family.
  for (const member of AutoMovieHumanF1.FAMILIES)
    if (!Course.unchanged(member.family, placedAt(member.family, Lengths.F1))) failures.push(member.family.name + " at f1's own lengths has changed runs");

  // 2. A longer shank.
  const longer: IAutoMovieHumanF1SegmentLengths.IFields = { ...Lengths.F1, shank: Lengths.F1.shank * 1.1 };
  const placed: IAutoMovieHumanConicLoft.IFamily = placedAt(leg, longer);
  if (Course.unchanged(leg, placed)) failures.push("a longer shank left the leg's runs unchanged");
  const [before, after]: AutoMovieVector3Tuple[][] = [Centres.course("leg"), Centres.course("leg", longer)];
  const reference: IAutoMovieViewAxis.IAxis = H.axis(leg);
  const course: IAutoMovieViewAxis.IAxis = Course.create(leg, placed);
  Runs.joints(leg.centres, leg.halves).forEach((station: number, k: number): void => {
    const [own, made]: IAutoMovieLoftSectionFrame[] = [reference.at(station), course.at(station)];
    const off = (frame: IAutoMovieLoftSectionFrame, centre: AutoMovieVector3Tuple): number[] => frame.origin.map((x: number, c: number): number => x - centre[c]!);
    const [want, got]: number[][] = [off(own!, before![k]!), off(made!, after![k]!)];
    const gap: number = Math.hypot(...got!.map((x: number, c: number): number => x - want![c]!));
    if (!(gap <= 1e-9)) failures.push(`leg joint ${k}: the course stands [${got!.join(", ")}] off its centre, the reference [${want!.join(", ")}]`);
    for (const key of ["u", "v"] as const) {
      const turn: number = Math.hypot(...made![key].map((x: number, c: number): number => x - own![key][c]!));
      if (!(turn <= 1e-12)) failures.push(`leg joint ${k}: the section plane's ${key} turned by ${turn}`);
    }
  });

  // 2b. A thigh 0.9 times as long. Carried from the hip centre, the leg's first ring (station 104) moves up the femur by the
  // thigh's lost tenth of its 104 mm, 10.4 mm less what the knee's window lends (under 0.2 mm). With the root held to 155 mm over a
  // 45 mm window, the course at 155 is the reference's own point, the ring at 104 stays within 1 mm (the window lends the held run
  // the ratio 1 + (1 - k) (5 w / 32) / (155 - 5 w / 32) with k about 0.85 for the run from 155 to the knee, 0.8 mm at 104), and the
  // knee's turn middle still stands off the person's knee centre as the reference's does off its own.
  const shorter: IAutoMovieHumanF1SegmentLengths.IFields = { ...Lengths.F1, thigh: Lengths.F1.thigh * 0.9 };
  const short: IAutoMovieHumanConicLoft.IFamily = placedAt(leg, shorter);
  const apart = (a: readonly number[], b: readonly number[]): number => Math.hypot(a[0]! - b[0]!, a[1]! - b[1]!, a[2]! - b[2]!);
  const free: IAutoMovieViewAxis.IAxis = Course.create(leg, short);
  const held: IAutoMovieViewAxis.IAxis = Course.create(leg, short, { station: 155, window: 45 });
  const lifted: number = apart(free.at(104).origin, reference.at(104).origin);
  if (!(Math.abs(lifted - 10.4) <= 0.2)) failures.push(`an unheld root ring moves ${lifted} mm under a 0.9 thigh, 10.4 expected`);
  if (!(apart(held.at(155).origin, reference.at(155).origin) <= 1e-9)) failures.push("the held root's end left the reference's point");
  const kept: number = apart(held.at(104).origin, reference.at(104).origin);
  if (!(kept <= 1)) failures.push(`the held root ring moves ${kept} mm`);
  const knee: number = Runs.joints(leg.centres, leg.halves)[1]!;
  const [kneeWant, kneeGot]: number[][] = [
    reference.at(knee).origin.map((x: number, c: number): number => x - before![1]![c]!),
    held.at(knee).origin.map((x: number, c: number): number => x - Centres.course("leg", shorter)[1]![c]!),
  ];
  if (!(apart(kneeWant!, kneeGot!) <= 1e-9)) failures.push("the held leg's knee turn left the person's knee centre");

  // 3. The arm under a longer shank.
  if (!Course.unchanged(family("arm"), placedAt(family("arm"), longer))) failures.push("a longer shank changed the arm's runs");

  // 4. Trunk lengths.
  try {
    Course.admit(Lengths.F1, Lengths.F1);
  } catch (error: unknown) {
    failures.push("f1's own trunk lengths were refused: " + (error instanceof Error ? error.message : String(error)));
  }
  for (const key of ["pelvisToThorax", "thoraxToHead"] as const) {
    try {
      Course.admit({ ...Lengths.F1, [key]: Lengths.F1[key] * 1.05 }, Lengths.F1);
      failures.push("a changed " + key + " was admitted");
    } catch (error: unknown) {
      if (!(error instanceof Error && error.message.includes(key))) failures.push("the refusal of " + key + " does not name it");
    }
  }

  if (failures.length > 0) throw new Error("human f1 native course:\n" + failures.join("\n"));
}
