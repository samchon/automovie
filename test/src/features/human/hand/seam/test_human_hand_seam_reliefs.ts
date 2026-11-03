import { AutoMovieHumanDigitJointRelief } from "../../../../../../packages/human/src/generation/hand/AutoMovieHumanDigitJointRelief";
import { AutoMovieHumanDigitStations } from "../../../../../../packages/human/src/generation/hand/AutoMovieHumanDigitStations";
import { AutoMovieHumanFingertipPulp } from "../../../../../../packages/human/src/generation/hand/AutoMovieHumanFingertipPulp";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanLimbUnion } from "../../../internal/limbs/HumanLimbUnion";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * The digit's protruding pieces, the joint swelling and the fingertip pulp,
 * join their base by adding volume only: no negative height anywhere in their
 * windows, zero on the window's edge, leaving the edge with the base's tangent
 * plane, and never steeper than 45 degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Evaluates `AutoMovieHumanDigitJointRelief.height` along each person's joint window and `AutoMovieHumanFingertipPulp.height` over the pad's footprint (`HumanLimbUnion.heights`, 61 by 61 samples, slopes by central differences over 0.01 mm) from fixed inputs read off the person's hand inputs: a finger's joint radius an eighth of the hand breadth (four fingers across the knuckles), the joint window the hand's own 4 mm (`AutoMovieHumanDigitStations.JOINT_WINDOW`), the distal phalanx a quarter of the middle finger beyond the palm (hand length less palm length), the pad's half width the joint radius and its palmar depth half of it. It catches a piece that carves into its base, a window cut short that leaves a step, and a piece too steep for its footprint, which reads as a bead on the finger.
 * @evidence contracts/testing.md#independent-expectations Composition by volume alone (`HumanLimbUnion`): a protruding piece adds to its base, so its height is never negative (to 1e-6 mm), is zero on its edge (to 1e-6 mm), rises across the edge within class A's 0.1 degree and nowhere above 45 degrees. The rows are properties of the pieces' height functions at any size, so the fixed inputs need only be a hand's order of size. Proven before the rows bind: a made (1 - x^2)^3 swelling of 0.4 mm over a 4 mm half window passes every row, the same negated fails the least-height row, and the same cut at half its window, a 0.17 mm step, fails the steepest-rise row.
 * @evidence contracts/testing.md#distinguishing-cases Both pieces on every person of the run, from the smallest to the largest hand. The pieces' effect on the delivered digit chains waits for their wiring; the digits' section density and joint steps are the hand's chain tests'.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_hand_seam_reliefs`, evaluating the pieces' functions with no person generated and no renderer, browser or GPU.
 */
export function test_human_hand_seam_reliefs(): void {
  const failures: string[] = [];
  const half: number = AutoMovieHumanDigitStations.JOINT_WINDOW;

  // A made swelling of known height, then made wrong two ways.
  const swell: (s: number) => number = (s: number): number => (Math.abs(s) >= half ? 0 : 0.4 * (1 - (s / half) ** 2) ** 3);
  const made: (height: (s: number) => number) => HumanAnatomyAudit.IRow[] = (height: (s: number) => number): HumanAnatomyAudit.IRow[] =>
    HumanLimbUnion.heights({ person: "made", label: "made swelling", height: (s: number): number => height(s), s: [-half, half], t: [0, 0] });
  failures.push(
    ...assertHumanProof("the piece's sign", made((s: number): number => -swell(s)), "least height", made(swell)),
    ...assertHumanProof("the piece's cut", made((s: number): number => (Math.abs(s) > half / 2 ? 0 : swell(s))), "steepest rise", []),
  );

  const rows: HumanAnatomyAudit.IRow[] = HumanPeople.names().flatMap((name: string): HumanAnatomyAudit.IRow[] => {
    const hand: { handLength: number; palmLength: number; handBreadth: number } | undefined = HumanPeople.params(name).extremities?.hands?.left;
    if (hand === undefined) return [];
    const radius: number = hand.handBreadth / 8;
    const joint: AutoMovieHumanDigitJointRelief.IInput = { at: 0, half, radius };
    const pad: AutoMovieHumanFingertipPulp.IInput = { phalanx: (hand.handLength - hand.palmLength) / 4, width: radius, palmar: radius / 2 };
    const a: number = AutoMovieHumanFingertipPulp.LENGTH_SHARE * pad.phalanx;
    const b: number = AutoMovieHumanFingertipPulp.WIDTH_SHARE * pad.width;
    return [
      ...HumanLimbUnion.heights({ person: name, label: "digit joint swelling", height: (s: number): number => AutoMovieHumanDigitJointRelief.height(joint, s), s: [-half, half], t: [0, 0] }),
      ...HumanLimbUnion.heights({ person: name, label: "fingertip pulp", height: (s: number, t: number): number => AutoMovieHumanFingertipPulp.height(pad, s, t), s: [-a, a], t: [-b, b] }),
    ];
  });
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} digit piece union findings:\n${failures.join("\n")}`);
}
