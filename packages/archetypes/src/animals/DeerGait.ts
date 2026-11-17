import { DeerBody } from "./DeerBody";
import { HorseGait } from "./HorseGait";
import type { QuadrupedGait } from "./QuadrupedGait";

/**
 * An observed sika walking clock, with explicit construction-only pose data.
 *
 * Catavitello, Ivanenko and Lacquaniti (2018), eLife 7:e38190, Table 1 and
 * Figure 2–figure supplement 2 source data B/C/D, recorded three sika deer
 * freely walking in Nara, Japan, at 0.78 m/s: six hindlimb and six forelimb
 * strides. Published numerical tables were joined by Cervusnippon row name,
 * because B/C/D have different row populations and ordering.
 * https://doi.org/10.7554/eLife.38190
 * https://cdn.elifesciences.org/articles/38190/elife-38190-fig2-figsupp2-data1-v2.zip
 *
 * D gives the mean stride period in seconds, C the fore/hind stance
 * percentages, and B both fore onsets relative to the camera-facing hindlimb.
 * The stance seconds below combine that common representative period and
 * each reported fraction; they are not directly reported mean stance times.
 * Values are averaged over strides then animals. Unreported stride SD is
 * left unknown: zero deviation means authored deterministic variation.
 *
 * The camera-facing side is assigned to model left and its fore onset
 * rebased to zero. Both measured fore delays are preserved; the opposite
 * hind contact is authored half a stride later under the paper's roughly
 * symmetric walk description. DeerBody's Boso males are another population,
 * so no paired Nara anatomy or individual scaling law is claimed. Absolute
 * timing leaves the observed clock unscaled. Fold, lift, bob and top-joint
 * follow remain named horse construction proxies, and nod is authored zero.
 * A sika's faster rotary gallop needs independent timing and phase data;
 * this walking-only table does not substitute the horse's transverse gallop.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the measured Nara sika cohort, source variable meanings, averaging, representative stance arithmetic, phase frame, authored symmetry and every unmeasured morphology/shape quantity.
 * @evidence contracts/development/design.md#principled-representation A species-specific speed/period/contact point and observed fore coupling enter the shared walk schema; absolute scaling preserves the source timebase without inventing a paired reference height.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The deer species supplies its table to the existing shared ride, with source-owned morphology and construction controls imported rather than a second solver.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No white-tailed-deer phase substitutes for this sika sample, no horse transverse gallop is misrepresented as the deer gait, and no unreported speed interval, stride SD or anatomical joint limit is fabricated.
 */
export namespace DeerGait {
  /** Figure 2 supplement 2D, Cervusnippon row: mean stride period, seconds. */
  const STRIDE: number = 1.136111111111111;

  /** Figure 2 supplement 2C, fore stance percentage divided by 100. */
  const FORE_DUTY: number = 0.7704956892177161;

  /** Figure 2 supplement 2C, hind stance percentage divided by 100. */
  const HIND_DUTY: number = 0.7239413565500523;

  /** Figure 2 supplement 2B, camera-facing fore onset relative to ipsilateral hind touchdown. */
  const FORE_PHASE: number = 0.2589911698607351;

  /** Figure 2 supplement 2B, opposite fore onset on the same hind-referenced clock. */
  const OPPOSITE_FORE_PHASE: number = 0.7700624657146398;

  /** One measured walking point with no invented faster-gait clock or stride spread. */
  export const TABLE: QuadrupedGait.ITable = {
    order: ["walk"],
    gaits: {
      walk: {
        ...HorseGait.TABLE.gaits.walk!,
        nod: { range: 0, timing: "support" },
        phases: {
          leftFore: 0,
          rightFore: OPPOSITE_FORE_PHASE - FORE_PHASE,
          leftHind: 1 - FORE_PHASE,
          rightHind: 0.5 - FORE_PHASE,
        },
        rows: [{
          speed: 0.78,
          stride: STRIDE,
          deviation: 0,
          stance: STRIDE * FORE_DUTY,
          hindStance: STRIDE * HIND_DUTY,
        }],
      },
    },
    reference: DeerBody.MEASURES.withers,
    scaling: "absolute",
    hysteresis: 0,
    follow: HorseGait.FOLLOW,
  };
}
