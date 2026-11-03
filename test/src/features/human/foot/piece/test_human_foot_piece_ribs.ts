import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanFootMadeShapes } from "../../../internal/foot/HumanFootMadeShapes";
import { HumanFootPieceAudit } from "../../../internal/foot/HumanFootPieceAudit";
import { HumanFootPieces } from "../../../internal/foot/HumanFootPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every foot body, built alone from the person's three foot inputs, runs
 * along its stations without ribs: no phase track of any piece turns sharper
 * than the curve audit's rib limit, so a rib the delivered chain shows and
 * this test does not is the chain's lofting, and one this test shows is the
 * piece's.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's feet through the foot's own pieces (`HumanFootPieces`), cuts a section every 1 mm of station from the web ring to the ankle ring and follows 64 phase tracks along them, reading the turn between successive steps per mm times the section's radius, by piece and by tenth of the stations. It catches the rib-like bands across the foot, a dorsal arc's guide that kinks between knots and the bump where the lateral border's extreme changes branch.
 * @evidence contracts/testing.md#independent-expectations The limit is the curve audit's own rib rule (`HumanCurveFoot.auditRibs`: 250 degrees per ring radius, read at 1 mm steps on rings of radius 3 mm or more), applied to the piece instead of the chain, so the two levels judge a turn alike. Proven before the rows bind: a straight elliptic tube passes every row, and the same tube with a 0.5 mm ripple of 4 mm wavelength across 0.3 to 0.5 of the stations fails the rows of that band.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of every person of the run. The sections' own dents and kinks are `test_human_foot_piece_section`'s; the delivered chain's ribs are `test_human_curve_foot`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_foot_piece_ribs`, building the foot pieces, with no renderer, browser or GPU.
 */
export function test_human_foot_piece_ribs(): void {
  const failures: string[] = [];

  // Proof on made shapes: a ripple in the band 0.3 to 0.5 of the stations.
  const f: HumanFootPieces.IPieces = HumanFootPieces.of("f1", "left");
  const end: number = f.line.end;
  failures.push(
    ...assertHumanProof(
      "the piece rib",
      HumanFootPieceAudit.ribs(f, HumanFootMadeShapes.ripple(HumanFootMadeShapes.tube, 0.5, 4, 0.3 * end, 0.5 * end)),
      "stations 0.3 to 0.4",
      HumanFootPieceAudit.ribs(f, HumanFootMadeShapes.tube),
    ),
  );

  const rows: HumanAnatomyAudit.IRow[] = HumanFootPieces.all().flatMap((p: HumanFootPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanFootPieceAudit.ribs(p));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} foot piece rib findings:\n${failures.join("\n")}`);
}
