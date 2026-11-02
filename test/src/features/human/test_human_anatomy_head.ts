import { assertHumanAnatomy } from "../internal/assertHumanAnatomy";

/**
 * Head identity, resting lip closure and facial population relations agree
 * with the final generated skin and the visible lid-contact curves.
 *
 * Scenarios:
 * 1. All four references and five population-end people answer their inputs.
 * 2. Median landmarks, transverse widths and visible eye margins are measured.
 * 3. Resting lips conceal teeth and retain the stated facial proportions.
 * 4. Model, observed and clinical rows stay distinct; unavailable clinical
 *    n, gn, al, go and zy correspondence remains a reasoned failure rather
 *    than being certified by a generated feature or a passed model residual.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person's cached final skin and finds median-profile landmarks, transverse facial breadths, alar grooves and auricle bounds. Fissure dimensions and canthi come from the actual lid-contact samples produced by the same eyelid owner as the consumer, rather than the posterior tuck opening. Reports every identity and relation finding before failing, catching oversized noses and lower faces, short visible eye margins, thin lips and exposed teeth at rest.
 * @evidence contracts/testing.md#independent-expectations Expected dimensions are the current public head inputs by their documented Farkas and FaceBase definitions, with breadth equal to length times cephalic index. ISO 20685-1 Table 4 supplies 1 mm head-dimension and 4 mm circumference allowances. Resting lip gap is zero within 1 mm with no visible tooth points. Nasolabial angle uses Legan and Burstone's 102 degrees and 8 degree SD at 2.326 SD; lower-face and upper-lip ratios retain the existing 3D Facial Norms population intervals. The separate analytic eyelid fixture proves intact margins green and a shortened 23.3 mm boundary red. Current reference nose inputs were remeasured at sn/prn. Zygion and gonion remain skin-band extrema; minimum frontal width has no independent temporal-crest oracle and is not claimed tested. Reference face and mandibular widths retain their documented extraction limitations. Whole-person results remain an acceptance requirement.
 * @evidence contracts/testing.md#distinguishing-cases Covers f1, f2, m1, m2 and long, short, broad, narrow and masculine population-end people. The independent margin fixture owns rigid-transform and known-boundary-defect discrimination; mouth tests own jaw opening and visemes, and curve tests own skin continuity, sampling and surface health.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU test reached by --include human_anatomy_head. The shared harness owns the nine dynamic cases and generates skin and mouth geometry in process without a browser, renderer or GPU.
 */
export function test_human_anatomy_head(): void {
  assertHumanAnatomy("head");
}
