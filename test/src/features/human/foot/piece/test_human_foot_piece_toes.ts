import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanFootPieceAudit } from "../../../internal/foot/HumanFootPieceAudit";
import { HumanFootPieces } from "../../../internal/foot/HumanFootPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every toe, laid on its line from the person's three foot inputs, has its own
 * tube at least as long as it is broad between its first own section and the
 * start of its tip, so its web and its dome never overlap.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's feet through the foot's own pieces (`HumanFootPieces`: centres, body, web ring, toe spans) and reads each toe span's first own section, its cap and its half breadth at the first section. It catches a toe the web ring swallows, the cause of the little toe's self-crossing web and the crumpled webs of toes two to five.
 * @evidence contracts/testing.md#independent-expectations Geometry of a closed digit: the dome that closes a tip is a half breadth long and the web's fillet into the root another half breadth, so a tube shorter than its breadth makes the two overlap and the skin fold. Proven before the rows bind: f1's left hallux with its cap moved to one half breadth past its first section fails its row, and the same toe with its cap moved to three half breadths past it passes.
 * @evidence contracts/testing.md#distinguishing-cases All five toes of both feet of every person of the run, hallux to fifth. The webs' own surface is the web patch's, the toes' girth profile `PRO-FT-6`'s.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_foot_piece_toes`, sharing the cached foot pieces, with no renderer, browser or GPU.
 */
export function test_human_foot_piece_toes(): void {
  const failures: string[] = [];

  // Proof: the hallux's cap moved to a made place past its first section.
  const f: HumanFootPieces.IPieces = HumanFootPieces.of("f1", "left");
  const hallux: HumanFootPieces.IPieces["toes"][number] = f.toes[0]!;
  const half: number = hallux.size(hallux.first)[0];
  const moved: (cap: number) => HumanFootPieces.IPieces = (cap: number): HumanFootPieces.IPieces => ({ ...f, toes: [{ ...hallux, cap: hallux.first + cap }] });
  failures.push(...assertHumanProof("the toe tube", HumanFootPieceAudit.toes(moved(half)), "toe 1", HumanFootPieceAudit.toes(moved(3 * half))));

  const rows: HumanAnatomyAudit.IRow[] = HumanFootPieces.all().flatMap((p: HumanFootPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanFootPieceAudit.toes(p));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} foot toe tube findings:\n${failures.join("\n")}`);
}
