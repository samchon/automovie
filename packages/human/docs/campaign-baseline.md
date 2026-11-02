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

These are failing anatomical measurements, not 707 independent causes. Foot passes. The other six test functions fail. The original log and complete measurement rows belong to the local artifact directory below.

## Render evidence

The private Vite viewer uses port 5194. The initial set contains 56 actual 1200 by 1200 GPU captures: f1, f2, m1 and m2 in clay and appearance, each from front, side and back, plus a face close-up, a hand diagnostic, an oblique trunk view and the demo pose. Each saved PNG's SHA-256 matches its `x-human-png-sha256` header and every initial request reports `new-requested-frame`. Source commitment: `72293f621edebf68c838b9aa068c31bdeea93fe87baf4fc1b7a1fd0b7f504800`.

The explicit 2500 mm oblique camera crops the crown and feet, so it is a trunk view. The initial hand selection shows the hand edge-on with selected intervals coloured, so it is a diagnostic rather than a plain material view. Supplementary captures provide a fitted whole-body oblique, plain hand views framed from the viewer's own selection bounds, opposite raking light, and matching front, side and back overlay/construction passes. Their original GPU receipts are saved with the PNGs. Inspection remains in progress at this checkpoint.

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

No generation source or anatomical tolerance changed at this checkpoint. No issue meets its completion criteria yet.
