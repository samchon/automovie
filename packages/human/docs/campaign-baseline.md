# Human campaign baseline

Campaign #3013 resumes from handoff #3036 on `feat/human-body-tapes`, branched from master `b058c6898` after a fast-forward pull on 2026-11-02. The remote introduced no added paths, so the pre-switch disk comparison found no collision. Existing ignored reference data and unrelated untracked paths were preserved.

## Anatomy

The seven maintained `test_human_anatomy_*` functions were invoked once, serially, against f1, f2, m1, m2, tall, short, wide, narrow and masculine. The tests and their tolerances were unchanged. A task-local TypeScript launcher runs under `ttsx` with a focused CommonJS configuration; the older `runHumanTest.ts` cannot compile under the test project's CommonJS configuration because it uses top-level await and `import.meta`.

| Region | Failed rows | Runtime, seconds |
| --- | ---: | ---: |
| Trunk | 55 | 259.6 |
| Arm | 105 | 50.0 |
| Hand | 58 | 27.4 |
| Leg | 54 | 32.6 |
| Foot | 0 | 6.3 |
| Head | 170 | 14.8 |
| Pose | 265 | 179.0 |

Of 1,971 measurements, 707 fail; these are not 707 independent causes. Foot passes. The other six test functions fail. The original log and complete measurement rows belong to the local artifact directory below. The following independent skin readings preserve the reference examples' body-tape baseline; arm rows are the left side.

| Site, measured / input mm | f1 | f2 | m1 | m2 |
| --- | ---: | ---: | ---: | ---: |
| Chest | 884.76 / 851.57 | 947.96 / 919.16 | 879.81 / 1029.96 | 912.85 / 1126.58 |
| Underbust | 684.35 / 741.76 | 683.62 / 741.22 | 905.94 / 934.65 | 940.63 / 1006.91 |
| Waist | 647.61 / 666.32 | 666.73 / 681.07 | 905.49 / 869.68 | 948.72 / 903.44 |
| High hip | 807.50 / 820.68 | 850.23 / 856.58 | 987.64 / 921.99 | 997.88 / 969.77 |
| Hip | 977.56 / 983.24 | 1002.20 / 1006.47 | 1063.92 / 1068.36 | 1092.78 / 1094.14 |
| Neck | 328.52 / 332.84 | 326.58 / 331.36 | 405.55 / 411.96 | 413.81 / 422.64 |
| Neck base | 403.94 / 359.11 | 408.82 / 349.56 | 453.01 / 388.69 | 465.22 / 455.62 |
| Upper arm | 251.22 / 262.29 | 274.47 / 293.93 | 324.62 / 367.71 | 320.30 / 377.82 |
| Elbow | 178.05 / 219.85 | 180.33 / 240.54 | 198.44 / 298.21 | 193.44 / 299.72 |
| Forearm | 198.74 / 227.94 | 194.99 / 234.40 | 232.65 / 297.52 | 232.30 / 299.84 |
| Wrist | 150.84 / 142.98 | 153.24 / 145.32 | 201.13 / 191.21 | 195.41 / 186.31 |

## Render evidence

The private Vite viewer uses port 5194. The initial set contains 56 actual 1200 by 1200 GPU captures: f1, f2, m1 and m2 in clay and appearance, each from front, side and back, plus a face close-up, a hand diagnostic, an oblique trunk view and the demo pose. Each saved PNG's SHA-256 matches its `x-human-png-sha256` header and every initial request reports `new-requested-frame`. Source commitment: `72293f621edebf68c838b9aa068c31bdeea93fe87baf4fc1b7a1fd0b7f504800`.

The explicit 2500 mm oblique camera crops the crown and feet, so it is a trunk view. The initial hand selection shows the hand edge-on with selected intervals coloured, so it is a diagnostic rather than a plain material view. Fifty-two supplementary captures provide a fitted whole-body oblique, plain dorsal hand views framed from the viewer's own selection bounds, opposite raking light, and matching front, side and back overlay/construction passes. Their original GPU receipts are saved with the PNGs. All 108 PNGs were opened and inspected, and their hashes were checked again from disk in one manifest pass. The receipts identify hardware ANGLE on AMD Radeon 8060S through Direct3D11, not software WebGL.

Local artifact directory: `packages/playground/.shots/human-3036-baseline-20261102/`. Raw PNGs, exact query strings, UTC capture times and hash headers stay there; this ignored directory is local evidence and is not recoverable from Git.

## Causes and the first correction

| Phenomenon | Responsible cause and contributing factors | Next action |
| --- | --- | --- |
| Trunk tapes disagree with their inputs | `TrunkConstruction` closes fitted girth ratios at prior stations, then fairs the closure. Those stations do not follow the bust point, fold, natural waist and buttock prominence. The neck also retains size regressions. | Locate the anatomical sites on the generated construction and close their hull perimeters there; preserve the connecting rings. |
| Arm tapes disagree; forearm has extra bellies | `ArmConstruction.arm()` places tape keys at fitted fractions of the whole arm, scales a circular circumference by a fitted ratio, then emits elliptical sections with a natural spline. The elbow key is independent of the actual elbow. | Derive tape sites from the actual bone landmarks, normalize each section's hull perimeter and preserve a single forearm belly. |
| Leg tapes disagree | `LegConstruction.prepare()` closes fitted ratios at fixed fractions, while the independent measurements locate the crotch, patella and calf maximum on the skin. The sections now follow tilted bone frames. | Solve the tapes at their defined sites while retaining the bone frames and shared end rings. |
| m1/m2 elbow bone appears outside its skin section | The anatomy test clips the bent arm with a 90 mm region around the shoulder-to-knuckle chord. This can leave the cut open. | Prove the selection correction red on a displaced tube and green on an intact bent tube before adopting it. |
| Hand, head, pose, trunk joins and hair remain defective | The causes and excluded hypotheses are carried by #3036. Appearance views reproduce shoulder swelling, narrow elbows, broad lower faces, large noses, gaps at the hair part and folding under action poses. | Retain the handoff order after body tapes; do not reopen its excluded hypotheses. |

`AutoMovieHumanBodyGirth` currently has no production caller: the only references under maintained source are inside its own module. It therefore cannot be the live cause of the generated body's tape errors. The body law reads public tapes directly; the active fitted sites and ratios are in the part constructions named above. Fix those owners rather than repairing an unused measurement utility.

This baseline precedes every generation change in the branch. No issue met its completion criteria at this checkpoint.

## Arm measurement-region proof

A 300 mm tube of 20 mm radius, whose axis bows 130 mm away from its end-to-end chord, has no elbow cut inside the old 90 mm capsule. Selecting the complete arm chains returns a closed 125.651 mm circumference against the analytic 125.664 mm, with its bone inside. Translating the skin 45 mm from that bone reports 24.996 mm outside against the analytic 25 mm. The straight intact tube stays green at 125.651 mm and zero outside. These observations precede adoption of the selection change and its regression test; `arm-region-proof.log` preserves them locally.

## First arm candidate

The first candidate derives the upper-arm and wrist stations from the skeleton landmarks, puts the elbow key at the elbow, and normalizes an elliptical section to its requested perimeter. A monotone quintic tape profile replaces the fitted size keys and their natural spline. The anatomy audit selects the complete arm, hand and digit chains instead of the 90 mm chord capsule. The synthetic region regression passes without changing the anatomy limits.

The affected checks ran once in the following order across the nine people. These are local results for the uncommitted candidate, separate from the committed baseline and its CI result.

| Check | Result | Runtime, seconds |
| --- | --- | ---: |
| Anatomy arm region | Pass | 0.075 |
| Anatomy arm | 25 failed rows, down from 105 | 200.512 |
| Anatomy hand | 58 failed rows, unchanged count | 27.725 |
| Curve arm | 2 failed regions | 1.069 |
| Curve hand | 74 crumple and 4 tear findings | 3.198 |
| Anatomy pose | 267 failed rows, baseline 265 | 184.514 |

The arm check includes generation of the nine people; later checks reuse their cached outputs. These elapsed times do not establish a performance improvement or regression against the baseline.

The 25 remaining arm failures comprise 16 upper-arm tape rows, two f2 forearm rows, six wrist-minimum rows and one wide mirror row. Upper-arm readings remain 257.57 / 262.29 mm for f1, 282.24 / 293.93 mm for f2, 348.60 / 367.71 mm for m1 and 355.29 / 377.82 mm for m2 on the left. The narrow upper arm instead overshoots its 215 mm tape at 228.24 mm. The wrist-minimum rows report values between approximately -0.01 and 0 mm against a nonnegative limit. The wide mirror error is 0.59 mm against 0.50 mm. No elbow tape, wrist tape, elbow-axis containment or extra forearm-maximum row fails in this round.

The curve check finds a fold at the upper-to-arm join on wide, 24.93 degrees on the left and 25.01 degrees on the right against 20 degrees. Hand crumples and the tall/narrow thumb-root tears remain. The pose failure count increased by two; a lower arm tape failure count therefore does not establish acceptance of the candidate.

Comparing the baseline rows with the round-one log localizes the net pose increase to the right elbow, not neutral pose: short and narrow each acquire one folded triangle in both flexed and limit poses, while masculine clears the same two previously failing rows. Person totals change from 26 to 28 for short, 39 to 41 for narrow and 30 to 28 for masculine; f1 (28), f2 (24), m1 (27), m2 (31), tall (34) and wide (26) retain their counts.

### Controlled cause diagnosis

The frozen candidate was measured as a bare loft, after its 70 mm shoulder-ring blend and after final event reconciliation. Left upper-arm girths in millimetres show that closing the bare ellipse does not preserve the assembled tape:

| Person | Input | Bare loft | After root blend | After event join |
| --- | ---: | ---: | ---: | ---: |
| f1 | 262.29 | 262.67 | 261.12 | 257.57 |
| f2 | 293.93 | 294.17 | 285.97 | 282.24 |
| m1 | 367.71 | 367.93 | 351.78 | 348.60 |
| m2 | 377.82 | 378.00 | 358.92 | 355.29 |
| wide | 400.00 | 400.08 | 374.12 | 368.99 |
| narrow | 215.00 | 215.55 | 229.98 | 228.24 |

The complete cut also needs the parent `upper` chain where the tape crosses the shoulder boundary. In masculine, the closed arm-plus-upper loop measures 260.93 mm, while the arm-only selection reports 257.87 mm; 35 loop segments belong to `upper`. In m1, five parent segments contribute to the loop. Retain complete limb selection for the bent elbow, and prove the assembled parent/child selection separately before changing the oracle.

The wide boundary's reflection and half-open phase sampling both contribute to asymmetry. An isolated boundary experiment reduces the reversed-point mismatch from 3.282 mm to 0.413 mm with half-cell sampling alone, to 3.115 mm with a canonical reflected boundary alone, and below 0.000000001 mm with both. These are boundary diagnostics, not a new whole-skin mirror pass. Bypassing the event fillet's spread is excluded as a join fix: wide's pre-reconciliation folds are 44.14/43.87 degrees, normal reconciliation reduces them to 24.93/25.01, and the bypass regresses them to 32.83/33.42.

The tiny negative wrist rows arise because the 1 mm minimum-search grid omits the exact stylion section read separately by the tape. Including that section in the minimum removes the logical contradiction without relaxing a limit; an adopted check still needs its controlled regression proof. The forearm maximum oracle searches only 10–60% of the elbow-to-wrist length. Its anatomical basis remains unconfirmed, so the f2 residual must be resolved against the published definition before changing the window or construction.

The complete log and diagnosis JSON files are in `packages/playground/.shots/human-3036-arm-round1-20261102/`: `verification.log`, `arm-diagnosis.json`, `arm-bare-diagnosis.json`, `arm-ownership-diagnosis.json`, `arm-mirror-diagnosis.json` and `wide-join-diagnosis.json`.

### Candidate render audit

The round contains 160 original GPU frames for source SHA-256 `c1636c32c66ad8faa184c3faa2aa2e086c70012854edcf8b140ec8b80769a2f5`. All exact PNG hashes match the saved hash and `x-human-png-sha256`, all responses report `new-requested-frame`, and each retains its original archive receipt. The render operator inspected all originals through 27 contact sheets, opened principal whole, demo, arm, shoulder, heel and wrist frames individually, and reviewed four matching before/after comparisons. `render-manifest.json` and `viewer-observations.json` preserve this audit on hardware ANGLE AMD Radeon 8060S through Direct3D11.

The initial selection labelled shoulder used `arm.left/0,1,2`, which the source and camera receipt identify as the heel of the hand. Those original bytes and receipts are preserved as `*-heel-*`. Corrected shoulder captures select `arm.left/23,24,25`; supplementary context views move the target 60 mm upward and use at least 500 mm distance to include the torso junction. The document reviewer also opened `comparison-f1.png` and the f1 shoulder-context clay, overlay and construction originals directly.

The matching f1 whole-front clay, appearance and demo comparisons show no clear whole-figure acceptance despite fewer failed arm tapes. The shoulder context shows an abrupt pinch and medial protrusion below the deltoid at the selected rings. The four-person render audit records the same junction defect, most prominent on m1/m2, persistent thumb-root and heel ridges, and abrupt bends and overlaps in demo. The candidate remains visually red. Body tapes and the dependent issues remain open.

### Harness and compilation checkpoint

The new campaign harness smoke run selects f1 foot only, generates it once in 13.532 seconds, and audits seven rows in 7.837 seconds with zero failed rows and zero errors. `campaign-smoke.json` retains the exact rows, selection and timings. This proves that smoke path, not all-person campaign completion. Both Human source and test `ttsc --noEmit` checks passed on the current uncommitted snapshot; no complete green test or visual result is claimed.

A request-local triangle projection index now supplies candidates to the existing arm plane cutter. It changes neither section sampling nor tolerances. Synthetic bent, translated and disconnected tubes, tangencies, long triangles and floating-point edge cases preserve full-scan cuts; both maintained synthetic regressions pass. On the declared 200,000-triangle, 400-plane workload, candidates fall from 80 million to 80,000 with 7,394,304 retained array bytes. These are synthetic results, not a whole-campaign speed claim. The integrated runner subsequently completes all nine arm audits: 225 measurements, the same 25 failed rows and zero worker errors, in 160.106 seconds including generation. Exact rows and category timings are in `index-arm-parity.json`; `plane-index-benchmark.json` retains the isolated benchmark.

## Baseline CI checkpoint

Draft PR #3038 was opened from checkpoint `0f06c89ac9cbb23ec7788caf7b63624088e77115`, which changes only this document. Its build passed in 2 minutes 34 seconds; its test job failed in 18 minutes 23 seconds. The failing functions are anatomy arm, hand, head, leg, pose and trunk; curve foot, hand and head; mouth; and skin binding. These failures belong to the committed baseline source, not the uncommitted arm candidate. The downloaded test log is `packages/playground/.shots/human-3036-baseline-20261102/ci-test.log`; the corresponding [test job](https://github.com/samchon/automovie/actions/runs/41408204952/job/125154971148) and [build job](https://github.com/samchon/automovie/actions/runs/41408205042/job/125154971166) preserve the remote results.
