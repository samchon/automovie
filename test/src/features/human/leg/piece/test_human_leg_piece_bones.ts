import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanLegPieceAudit } from "../../../internal/leg/HumanLegPieceAudit";
import { HumanLegPieces } from "../../../internal/leg/HumanLegPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every person's leg joint centres, placed alone from stature and ankle
 * height, stand hip over crotch over knee over ankle, and the knee stands on
 * the hip-ankle line at neutral, neither knock-kneed nor bow-legged.
 *
 * @evidence contracts/testing.md#behavioral-verification Places each person's hip, knee and ankle centres through `AutoMovieHumanLegBones.of` and the crotch through `AutoMovieHumanLegCrotchHeight.of` from the public inputs (`HumanLegPieces`, no body generated) and reads their heights' order and the hip-knee-ankle angle. It catches a crotch above the hip joint or below the knee, a knee below the ankle and a knee pushed out of the mechanical axis.
 * @evidence contracts/testing.md#independent-expectations The body's vertical order of its joints and its crotch; the mechanical axis of the healthy young adult lower limb, 2.2 degrees varus with SD 2.5 (women) and 2.7 (men) on weight-bearing long radiographs (Tang 2000, `sources/tang-2000-lower-limb-alignment.md`), so 4.1 degrees valgus to 8.5 degrees varus at 2.326 SD (consistency.md KIN-LG-4, ORD-LG-6). Proven before the rows bind: f1's bones with the knee moved 50 mm medially fail the alignment row, and f1's bones as placed (on the hip-ankle line) pass.
 * @evidence contracts/testing.md#distinguishing-cases Every person of the run, short and tall, with ankle heights at the population's ends. Flexion's direction is the pose tests' (KIN-LG-1).
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_leg_piece_bones`, building the leg pieces, with no renderer, browser or GPU.
 */
export function test_human_leg_piece_bones(): void {
  const failures: string[] = [];
  const p: HumanLegPieces.IPieces = HumanLegPieces.of("f1");
  const knee: [number, number, number] = [p.bones.knee[0], p.bones.knee[1], p.bones.knee[2] - 50];
  failures.push(...assertHumanProof("the knee alignment", HumanLegPieceAudit.bones(p, { ...p.bones, knee }), "hip-knee-ankle angle", HumanLegPieceAudit.bones(p)));

  const rows: HumanAnatomyAudit.IRow[] = HumanLegPieces.all().flatMap((q: HumanLegPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanLegPieceAudit.bones(q));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} leg bone findings:\n${failures.join("\n")}`);
}
