import {
  AutoMovieHumanSex,
  AutoMovieHumanHandBones as Hand,
} from "@automovie/human";
import type { AutoMovieVector3Tuple as V } from "@automovie/interface";

/**
 * A straight wrist, measured phalanx lengths and a bilateral hand bind.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the same hand records that the body source and skeleton consume.
 * @evidence contracts/development/testing.md#independent-expectations A 3-4-5 forearm sets the frame. Buryanov Table I splits thumb phalanges and de Leva Table 4 places the third metacarpal head.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks the projected thumb, exact segment lengths, reflected digit and an invalid forearm.
 * @evidence contracts/development/testing.md#execution-ownership Pure geometry on two small hand records.
 * @evidence contracts/development/common.md#meaningful-documentation Names the anatomical and geometric expectations.
 */
export function test_human_hand_bones(): void {
  const wrist: V = [4, 115, 80];
  const frame = Hand.frame([0, -4, 3]);
  const measures = { length: 192, palm: 116, breadth: 86, thumb: 70 };
  const left = Hand.of(wrist, measures, AutoMovieHumanSex.Male, 1, [], frame);
  const right = Hand.sided(left, -1);
  const dist = (p: V, q: V): number =>
    Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]);
  const check = (a: number, b: number): boolean =>
    Math.abs(a - b) <= 1e-12 * Math.max(1, Math.abs(a), Math.abs(b));
  const failures: string[] = [];
  if (
    dist(left.frame.along, [0, -0.8, 0.6]) > 1e-12 ||
    dist(left.frame.across, [1, 0, 0]) > 1e-12 ||
    dist(left.frame.palmar, [0, -0.6, -0.8]) > 1e-12
  )
    failures.push(
      "the hand did not follow the supplied forearm and projected anterior",
    );
  const middle = left.fingers.Middle.centres;
  const middleLength: number = middle
    .slice(1)
    .reduce((sum, point, i): number => sum + dist(point, middle[i]!), 0);
  const knuckleReach: number = ((measures.length - 1.5) * 86.2) / 187.9;
  if (
    !check(dist(wrist, middle[0]!), knuckleReach) ||
    !check(middleLength, measures.length - 1.5 - knuckleReach)
  )
    failures.push(
      "the middle finger's straight course lost the subject's length and metacarpal reach",
    );
  const [cmc, mcp, ip, apex] = left.thumb.centres;
  const proximal: number = dist(mcp!, ip!),
    distal: number = dist(ip!, apex!);
  const radial: number = cmc![0] - wrist[0];
  const palmar: number =
    -0.6 * (cmc![1] - wrist[1]) - 0.8 * (cmc![2] - wrist[2]);
  if (
    !(radial > 0 && palmar > 0) ||
    !check(proximal + distal, measures.thumb) ||
    !check(proximal / distal, 31.57 / (21.67 + 5.67))
  )
    failures.push(
      "the thumb lost its radial-palmar base or its measured length division",
    );
  if (
    right.thumb.centres.some((point, i): boolean => {
      const p = left.thumb.centres[i]!;
      return dist(point, [p[0], p[1], -p[2]]) > 1e-12;
    })
  )
    failures.push(
      "the right thumb is not the bilateral reflection of the left",
    );
  try {
    Hand.frame([0, 0, 0]);
    failures.push("the hand admitted a zero forearm direction");
  } catch (error: unknown) {
    if (!(error instanceof Error && error.message.includes("forearm")))
      throw error;
  }
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
