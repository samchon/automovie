import { AutoMovieHumanLegGirth } from "../../../../../../packages/human/src/generation/leg/AutoMovieHumanLegGirth";
import { AutoMovieHumanMonotoneCubic } from "../../../../../../packages/human/src/lofting/AutoMovieHumanMonotoneCubic";
import type { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanLegPieceAudit } from "../../../internal/leg/HumanLegPieceAudit";
import { HumanLegPieces } from "../../../internal/leg/HumanLegPieces";
import { assertHumanProof } from "../../../internal/limbs/assertHumanProof";
import { failingHumanRows } from "../../../internal/limbs/failingHumanRows";

/**
 * Every person's leg girth law, built alone from the person's thigh, knee and
 * calf tapes and the joint centres their stature and ankle height place, runs
 * the way a leg does: the thigh falls from its maximum to the suprapatellar
 * least girth, the shank rises from the infrapatellar least girth to one
 * calf belly in its upper part and falls to the least ankle just
 * above the malleoli, with no wobble, the tapes at their sites and in the
 * order the person's inputs give them.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds `AutoMovieHumanLegGirth.of` from each person's public tapes on `AutoMovieHumanLegBones.of`'s joint heights (`HumanLegPieces`, no body generated) and reads the law every 2 mm from the crotch to the ankle centre: the thigh maximum, the girth at mid-patella and the shank maximum against their tapes, the excess variation of the three spans, the calf maximum's and the least ankle's shares of the shank, the least ankle over the calf, the thigh over the knee, and the calf against the knee signed as the inputs order them. It catches a law whose tapes miss their sites, a second calf belly, an ankle and calf dent, a swollen ankle and a knee and calf in the order the inputs deny.
 * @evidence contracts/testing.md#independent-expectations Tapes within ISO 20685-1:2018 Table 4 (9 mm the thigh, 4 mm knee and calf); span shapes and shares from consistency.md section 3.1 (Gray 1918; ISO 8559-1 sites): excess variation within 4 mm per span, the calf maximum at 0.15 to 0.6 and the least ankle at 0.75 to 0.97 of the shank, the least ankle over the calf within ANSUR II's 0.439 to 0.719; the thigh above the knee (ANSUR 1988 knee over thigh 0.631, SD 0.029); knee against calf ordered only where the inputs differ by more than both errors (calf over knee 0.966, SD 0.041, so either order is human). Proven before the rows bind: a law made from the person's tapes through anatomy's own sites (thigh at the crotch, knee at mid-patella, calf at 0.35 and the least ankle at 0.9 of the shank at 0.6 of the calf) passes every row, and the same with an 8 mm ripple of 40 mm wavelength on the shank fails the shank's span rows.
 * @evidence contracts/testing.md#distinguishing-cases Every person of the run, women and men, slight and heavy, short and tall, whose tapes reach the population's ends. The delivered chain's and the skin's girth profiles are the composed-curve tests' (`test_human_curves_profile_leg`, `test_human_leg_profile`).
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_leg_piece_girth`, building each leg's pieces once per process, with no renderer, browser or GPU.
 */
export function test_human_leg_piece_girth(): void {
  const failures: string[] = [];

  // A correct law made from f1's tapes through anatomy's sites, and a ripple on it.
  const p: HumanLegPieces.IPieces = HumanLegPieces.of("f1");
  const shank: number = p.heights.knee - p.heights.ankle;
  const knots: [number, number][] = [
    [p.heights.ankle, 0.62 * p.tapes.calf],
    [p.heights.knee - 0.9 * shank, 0.6 * p.tapes.calf],
    [p.heights.knee - 0.35 * shank, p.tapes.calf],
    [p.heights.knee - 0.12 * shank, 0.9 * Math.min(p.tapes.knee, p.tapes.calf)],
    [p.heights.knee - AutoMovieHumanLegGirth.MID_PATELLA, p.tapes.knee],
    [p.crotch, p.tapes.thigh],
  ];
  const made: (s: number) => number = (s: number): number => AutoMovieHumanMonotoneCubic.interpolate(knots, s);
  const rippled: (s: number) => number = (s: number): number => made(s) + (s < p.heights.knee ? 8 * Math.sin((2 * Math.PI * s) / 40) : 0);
  failures.push(...assertHumanProof("the girth law's spans", HumanLegPieceAudit.girth(p, rippled), "excess variation from the calf maximum", HumanLegPieceAudit.girth(p, made)));

  const rows: HumanAnatomyAudit.IRow[] = HumanLegPieces.all().flatMap((q: HumanLegPieces.IPieces): HumanAnatomyAudit.IRow[] => HumanLegPieceAudit.girth(q));
  failures.push(...failingHumanRows(rows));
  if (failures.length !== 0) throw new Error(`${failures.length} leg girth law findings:\n${failures.join("\n")}`);
}
