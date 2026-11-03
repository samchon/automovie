import { AutoMovieHumanLegPatella } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegPatella";
import { AutoMovieHumanLegReliefWindow } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegReliefWindow";
import { AutoMovieHumanLegStations } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegStations";
import type { IAutoMovieHumanRelief } from "../../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanLegPieceAudit } from "../../../internal/leg/HumanLegPieceAudit";
import { HumanLegPieces } from "../../../internal/leg/HumanLegPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every relief window of every person's leg joins the leg by adding volume
 * only: it pushes skin out of the leg, vanishes at its window's edge, leaves
 * the edge with the base's tangent plane and rises no steeper than 45 degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Places each person's fourteen relief windows through `AutoMovieHumanLegReliefs.of` on the joints and girth law built from the public inputs (`HumanLegPieces`, no body generated) and evaluates each relief (`AutoMovieHumanRelief.height`) on a 41 by 40 grid over its window: its outward height at its centre (its axis against the outward direction at its angle), its largest height on the window's edge, its rise across the edge over 0.01 mm and its steepest rise along the bone and round the section. It catches a relief that carves into the leg (a recess made by a protruding piece), a window that leaves a step at its edge and a lump too steep for its width.
 * @evidence contracts/testing.md#independent-expectations Composition by volume alone (`HumanLimbUnion`): a piece's displacement points out of its base, recesses belong to the base or to a declared subtractive piece, so an inward relief is a contradiction until it is declared subtractive; the edge is zero within 1e-6 mm and its rise within class A's 0.1 degree; the steepest rise is 45 degrees. Proven before the rows bind: a patella window made from its own declaration on f1 passes every row, the same with its axis reversed fails the outward row, and with its height three local radii fails the steepest row.
 * @evidence contracts/testing.md#distinguishing-cases Every relief of every person of the run, the knee, shank, thigh and hip windows alike, each sized by its own local radius. The reliefs' effect on the delivered chain waits for their wiring into the leg's chain.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_leg_seam_reliefs`, sharing the cached leg pieces, with no renderer, browser or GPU.
 */
export function test_human_leg_seam_reliefs(): void {
  const failures: string[] = [];

  // A patella window made on f1 from its own declaration, then made wrong.
  const p: HumanLegPieces.IPieces = HumanLegPieces.of("f1");
  const w: AutoMovieHumanLegReliefWindow.IWindow = AutoMovieHumanLegPatella.WINDOW;
  const radius: number = p.girth(AutoMovieHumanLegStations.heightAt(p.heights, w.segment, w.share)) / (2 * Math.PI);
  const made: (window: AutoMovieHumanLegReliefWindow.IWindow) => IAutoMovieHumanRelief[] = (window: AutoMovieHumanLegReliefWindow.IWindow): IAutoMovieHumanRelief[] => [
    AutoMovieHumanLegReliefWindow.create(window, { bones: p.heights, radius }),
  ];
  const correct: HumanAnatomyAudit.IRow[] = HumanLegPieceAudit.reliefs(p, made(w));
  failures.push(
    ...assertHumanProof("the relief's direction", HumanLegPieceAudit.reliefs(p, made({ ...w, axis: [-w.axis[0], -w.axis[1], -w.axis[2]] })), "outward height", correct),
    ...assertHumanProof("the relief's steepness", HumanLegPieceAudit.reliefs(p, made({ ...w, height: 3 })), "steepest rise", []),
  );

  const rows: HumanAnatomyAudit.IRow[] = HumanLegPieces.all().flatMap((q: HumanLegPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanLegPieceAudit.reliefs(q));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} leg relief findings:\n${failures.join("\n")}`);
}
