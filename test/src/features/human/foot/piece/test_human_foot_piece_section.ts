import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanFootMadeShapes } from "../../../internal/foot/HumanFootMadeShapes";
import { HumanFootPieceAudit } from "../../../internal/foot/HumanFootPieceAudit";
import { HumanFootPieces } from "../../../internal/foot/HumanFootPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every section of every foot body, built alone from the person's three foot
 * inputs, is convex in each of its pieces but the medial arch, and turns no
 * sharper anywhere than the curve audit's rib limit: no dent, crease, kink or
 * protrusion inside a piece's share of the section.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's left and right foot through the foot's own pieces (centres, web line, five guides, body; `HumanFootPieces`) from foot length, foot breadth and lateral malleolus height alone, with no body generated, cuts 101 sections from the web ring to the ankle ring and reads each piece's share of every section in its own plane: the deepest concave sagitta over a 10 mm chord and the sharpest turn of the tangent per section radius over 1 mm either side. It catches the diagonal crease from the heel up to the instep, a dent at a junction, an outward kink of a dorsal arc and the lateral border's branch protrusion, each named by its piece and its share of the stations.
 * @evidence contracts/testing.md#independent-expectations A crease is a concave sagitta of more than 1 mm over a 10 mm chord (`HumanAnatomyShared.CREASE`, the catalog's CR). The foot's section is convex except where the medial longitudinal arch hollows its medial sole (Gray 1918; consistency.md SEC-7), so the medial arch piece alone may be concave. The turn limit is the curve audit's rib limit, 250 degrees per ring radius (`HumanCurveConstants.RIB`), so a piece and the delivered chain are judged alike. Proven before the rows bind: a straight elliptic tube (45 by 30 mm, `HumanFootMadeShapes.tube`) passes every row, a 2 mm raised-cosine groove across its dorsal-lateral piece fails that piece's sagitta, and a 1.5 mm spike in its lateral border fails that piece's turn. No construction constant or earlier output enters the expectation.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of every person of the run, from the smallest to the largest foot, so every foot input's population end is read. Ribs along the stations, the toes' tubes, the chain built from the body and the malleoli's union are their own piece and seam tests; the skin's foot profiles are `test_human_foot_profile`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_foot_piece_section`, building each foot once per process from a `HumanOnce` singleton, with no renderer, browser or GPU.
 */
export function test_human_foot_piece_section(): void {
  const failures: string[] = [];

  // Proof on made shapes, before any foot is judged.
  const f: HumanFootPieces.IPieces = HumanFootPieces.of("f1", "left");
  failures.push(
    ...assertHumanProof(
      "the piece dent",
      HumanFootPieceAudit.sections(f, HumanFootMadeShapes.groove(HumanFootMadeShapes.tube, 25, 6, 2)),
      "dorsal-lateral piece at",
      HumanFootPieceAudit.sections(f, HumanFootMadeShapes.tube),
    ),
    ...assertHumanProof("the piece kink", HumanFootPieceAudit.sections(f, HumanFootMadeShapes.spike(HumanFootMadeShapes.tube, 75, 1.5)), "lateral border piece at", []),
  );

  // Every foot, every failing row listed by person, side, piece and station.
  const rows: HumanAnatomyAudit.IRow[] = HumanFootPieces.all().flatMap((p: HumanFootPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanFootPieceAudit.sections(p));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} foot piece section findings:\n${failures.join("\n")}`);
}
