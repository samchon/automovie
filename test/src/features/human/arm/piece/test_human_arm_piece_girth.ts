import { AutoMovieHumanMonotoneCubic } from "../../../../../../packages/human/src/lofting/AutoMovieHumanMonotoneCubic";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanArmPieceAudit } from "../../../internal/arm/HumanArmPieceAudit";
import { HumanArmPieces } from "../../../internal/arm/HumanArmPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every person's arm girth law, built alone from the person's four arm tapes
 * and two arm lengths, runs the way an arm does: it falls from the root to the
 * upper arm's site and on to the supracondylar waist, carries one forearm belly
 * in the forearm's proximal half, falls to its least girth at the wrist, holds
 * each tape at its site, and orders every pair of tapes as the inputs do.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the arm's five spans (`AutoMovieHumanArmPieces.build`) on bones placed from acromion-radiale and radiale-stylion at the bind's directions, with the walk the arm's composer uses (`HumanArmPieces`, no body generated), and reads `AutoMovieHumanArmGirth.at` every 2 mm from the shoulder centre to 10 mm past stylion: the girth at the four tapes' sites, the excess variation of the root, upper arm and forearm-to-wrist spans, the forearm belly's share, the least girth's place against stylion, and the sign of every pair of tapes against their inputs' sign. It catches a tape off its site, a second belly or a wobble on the upper arm or the forearm, a belly near the wrist, a mitten wrist and an upper arm, elbow, forearm and wrist in an order the inputs deny.
 * @evidence contracts/testing.md#independent-expectations Tapes within ISO 20685-1:2018's 4 mm; spans from consistency.md section 3.2 (Gray 1918: the deltoid's insertion at mid-humerus, biceps and triceps tapering to their tendons, the forearm's muscles fleshy above its middle), excess variation within 4 mm; the least girth from 30 mm proximal to 10 mm distal of stylion (Gray 1918, the existing arm rows); the pairwise order is ORD-0, the person's own tape order wherever two inputs differ by more than both errors. Proven before the rows bind: a law made through f1's tapes at anatomy's sites passes every row, and the same with a 6 mm ripple of 30 mm wavelength over the forearm fails the forearm's span row.
 * @evidence contracts/testing.md#distinguishing-cases Every person of the run, women and men, slight and heavy, with tapes at the population's ends; elbow against forearm is read only where the inputs order them. The skin's arm profile is `test_human_arm_profile`'s and the delivered chain's the composed-curve tests'.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_arm_piece_girth`, building each arm's pieces once per process, with no renderer, browser or GPU.
 */
export function test_human_arm_piece_girth(): void {
  const failures: string[] = [];

  // A correct law made through f1's tapes at anatomy's sites, and a ripple on it.
  const p: HumanArmPieces.IPieces = HumanArmPieces.of("f1");
  const t: HumanArmPieces.IPieces["tapes"] = p.tapes;
  const knots: [number, number][] = [
    [0, 1.1 * t.bicep],
    [p.bicep, t.bicep],
    [0.85 * p.elbow, 0.9 * Math.min(t.bicep, t.elbow)],
    [p.elbow, t.elbow],
    [p.elbow + 0.25 * p.forearm, Math.max(t.forearm, t.elbow + 1)],
    [p.stylion, t.wrist],
    [p.stylion + 20, 1.1 * t.wrist],
  ];
  const made: (s: number) => number = (s: number): number => AutoMovieHumanMonotoneCubic.interpolate(knots, s);
  const rippled: (s: number) => number = (s: number): number => made(s) + (s > p.elbow + 0.3 * p.forearm ? 6 * Math.sin((2 * Math.PI * s) / 30) : 0);
  failures.push(...assertHumanProof("the arm law's spans", HumanArmPieceAudit.girth(p, rippled), "forearm belly to the least girth", HumanArmPieceAudit.girth(p, made)));

  const rows: HumanAnatomyAudit.IRow[] = HumanArmPieces.all().flatMap((q: HumanArmPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanArmPieceAudit.girth(q));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} arm girth law findings:\n${failures.join("\n")}`);
}
