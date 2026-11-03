import { AutoMovieHumanFootBodyChain } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanFootBodyChain";
import { AutoMovieHumanFootLateralMalleolus } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanFootLateralMalleolus";
import { AutoMovieHumanFootMedialMalleolus } from "../../../../../../packages/human/src/generation/foot/AutoMovieHumanFootMedialMalleolus";
import type { IAutoMovieHumanLoftChain } from "../../../../../../packages/human/src/lofting/IAutoMovieHumanLoftChain";
import type { IAutoMovieHumanRelief } from "../../../../../../packages/human/src/network/IAutoMovieHumanRelief";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanFootPieces } from "../../../internal/foot/HumanFootPieces";
import { HumanLimbUnion } from "../../../internal/limbs/HumanLimbUnion";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * The malleoli join the foot's body by adding volume only: the body's chain
 * with both malleolus reliefs never lies inside the same chain without them,
 * is unchanged outside the reliefs' windows, rises from the base with its
 * tangent plane at each window's edge and nowhere steeper than 45 degrees.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds each person's feet through the foot's own pieces (`HumanFootPieces`), lofts the body's chain `foot.left` twice through `AutoMovieHumanFootBodyChain`, once bare (the base envelope) and once with the lateral and medial malleolus windows the foot's composer attaches, and compares the two at 256 phases every 0.5 mm across each window and its 10 mm margin and every 5 mm elsewhere (`HumanLimbUnion`): the deepest merged point inside the base along its outward normal, the largest move outside every window, the rise of the blend across a window's edge and its steepest rise. It catches a relief that pushes skin inward, a window that leaks past its declared stations, a relief that meets the base at an angle and a lump too steep for its width.
 * @evidence contracts/testing.md#independent-expectations Composition by volume alone: a protrusion adds to its base and recesses belong to the base, so the merged surface stands on or outside the base everywhere (to 0.01 mm) and equals it outside the window (to 1e-6 mm). The edge rise is class A surfacing's 0.1 degree normal mismatch along a seam; the steepest rise is 45 degrees, which a smooth bump of height h meets when its half width is at least 1.6 h. Proven before the rows bind: f1's left foot with the lateral relief's heights negated fails the inside row, with its declared station window narrowed by half while its net is unchanged fails the outside row, and with its heights scaled 20 times fails the steepest row; the same relief with its net clipped to non-negative heights and scaled to a tenth reads no merged point inside the base.
 * @evidence contracts/testing.md#distinguishing-cases Both feet of every person of the run, each foot's malleoli placed from its own lateral malleolus height. The body's sections are the piece tests'; the ankle ring the leg takes is the leg's seam test's.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_foot_seam_malleoli`, sharing the cached foot pieces, with no renderer, browser or GPU.
 */
export function test_human_foot_seam_malleoli(): void {
  const failures: string[] = [];

  // Proof on f1's left foot: the lateral relief made wrong three ways.
  const f: HumanFootPieces.IPieces = HumanFootPieces.of("f1", "left");
  const [lateral, medial]: IAutoMovieHumanRelief[] = reliefs(f);
  const union: (made: IAutoMovieHumanRelief) => HumanAnatomyAudit.IRow[] = (made: IAutoMovieHumanRelief): HumanAnatomyAudit.IRow[] => rows(f, [made, medial!]);
  const correct: HumanAnatomyAudit.IRow[] = union({ ...lateral!, heights: lateral!.heights.map((h: number): number => Math.max(0, h) / 10) }).filter((r: HumanAnatomyAudit.IRow): boolean => r.site.includes("inside the base"));
  const span: number = lateral!.stations[1] - lateral!.stations[0];
  failures.push(
    ...assertHumanProof("the union's inside", union({ ...lateral!, heights: lateral!.heights.map((h: number): number => -h) }), "inside the base", correct),
    ...assertHumanProof("the union's window", rows(f, [lateral!, medial!], [{ ...lateral!, stations: [lateral!.stations[0] + span / 4, lateral!.stations[1] - span / 4] }, medial!]), "outside every window", []),
    ...assertHumanProof("the union's steepness", union({ ...lateral!, heights: lateral!.heights.map((h: number): number => 20 * h) }), "steepest rise", []),
  );

  const all: HumanAnatomyAudit.IRow[] = HumanFootPieces.all().flatMap((p: HumanFootPieces.IPieces): HumanAnatomyAudit.IRow[] => rows(p, reliefs(p)));
  failures.push(...failingHumanRows(all));
  if (failures.length !== 0) throw new Error(`${failures.length} malleolus union findings:\n${failures.join("\n")}`);
}

/** A foot's two malleolus windows as the foot's composer attaches them to the left-frame body. */
function reliefs(p: HumanFootPieces.IPieces): IAutoMovieHumanRelief[] {
  return [
    AutoMovieHumanFootLateralMalleolus.of(p.centres.frame, p.body, 1, "left"),
    AutoMovieHumanFootMedialMalleolus.of(p.centres.frame, p.body, 1, "left"),
  ];
}

/**
 * The union rows of a foot's body chain with the given reliefs against its
 * bare chain, the windows read as `declared` (the attached reliefs' own unless
 * a proof declares them otherwise).
 */
function rows(p: HumanFootPieces.IPieces, attached: IAutoMovieHumanRelief[], declared: IAutoMovieHumanRelief[] = attached): HumanAnatomyAudit.IRow[] {
  const base: IAutoMovieHumanLoftChain = AutoMovieHumanFootBodyChain.of(p.body, "foot.left", 1, []);
  const merged: IAutoMovieHumanLoftChain = AutoMovieHumanFootBodyChain.of(p.body, "foot.left", 1, attached);
  return HumanLimbUnion.rows({ person: p.person, label: `${p.side} foot malleoli`, base, merged, reliefs: declared });
}
