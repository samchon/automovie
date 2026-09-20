# Connected body basis studies

This directory holds the reproducible record behind the numerical body basis that `@automovie/human` evaluates below the neck: pinned reference sources, the anthropometric distributions that bound its channels, and the clinical joint ranges its joints are validated against. The basis itself lives in [`connected-basis`](connected-basis/README.md) with its extraction receipt; the study population and the census receipts are added by later topics of [#2519](https://github.com/samchon/automovie/issues/2519). Every receipt cites this file.

The face lives in [`../human-face/connected-basis`](../human-face/connected-basis/README.md). The body is the remainder of the same MPFB base mesh below the neck clip at Y = -0.145 m, so the two studies share the source revision, the license record and the coordinate frame.

## Sources and license

[`references-receipt.json`](references-receipt.json) pins every source by URL, revision or SHA256, and by license class. The classes are kept apart rather than merged into one permission:

- [MPFB2](https://github.com/makehumancommunity/mpfb2), commit `817587ceb2ea03ea17a5b47e04396cbb4ddfa2d5`: the CC0 base mesh, body targets, joint cubes, rig and weights (asset license retained in [LICENSE.md](LICENSE.md)). Its GPL add-on code runs offline inside Blender to sample geometry and is never part of the runtime or of any committed payload.
- [MakeHuman](https://github.com/makehumancommunity/makehuman), commit `a8bc2d54ff0ac92e78ff71431b1023eda42bf482`: read for the measurement modifier catalogue only. The measurement ruler vertex lists inside its AGPL plugin code are not transplanted; the body defines its own rulers from ISO 7250-1 measurement definitions.
- [OpenRigLogic 5.8](https://github.com/EpicGames/OpenRigLogic), commit `7b9e7a88898f51f29aa308acb4877276f27e1507` (MIT): the evaluation order, product-activated correctives and pose-space interpolation the body builder mirrors. No MetaHuman sample asset or database is imported.
- ANSUR II public working data (2012), from the Penn State OPEN Design Lab mirror: 4,082 men and 1,986 women, 93 measurements. Public U.S. Government data.
- 38 CFR 4.71 Plates I and II and 4.71a Note (2), 2025 print and eCFR of 2026-09-17: the public-domain normal ranges of motion.

The downloaded files live under the gitignored `.references/` directory at the paths the receipt names. A fresh checkout reproduces them from the recorded URLs and revisions and verifies the recorded digests before use.

## Anthropometry

[`anthropometry-percentiles.json`](anthropometry-percentiles.json) is produced by [`test/scripts/body-review/ansur2-percentiles.py`](../../scripts/body-review/ansur2-percentiles.py), which refuses a source CSV whose SHA256 differs from the receipt. For each measurement the body basis exposes as a millimetre channel, or uses to check a joint pivot, it records per sex the sample size, the 5th, 50th and 95th nearest-rank percentiles, the mean and the population standard deviation. Units are millimetres as published; `weightkg` is in tenths of a kilogram.

These distributions decide what a channel's authored endpoints have to reach, not what they are: the endpoints stay the CC0 targets as authored, and a channel whose reach does not cover the 5th to 95th percentile is recorded as such in the basis receipt rather than stretched.

## Clinical range of motion

The primary source is public and pinned. Where it is silent, the AAOS 1965 goniometry values quoted in #2519 fill the axis and are marked as secondary in the receipt. Sign conventions follow `IAutoMovieJointConstraint`: flexion positive, extension negative; abduction positive, adduction negative; external rotation positive.

| Joint | Axis | Range (degrees) | Source |
| --- | --- | --- | --- |
| Shoulder | flexion | -60 to 180 | Plate I (flexion 180), AAOS (extension 60) |
| Shoulder | abduction | -30 to 180 | Plate I (abduction 180) |
| Shoulder | twist | -90 to 90 | Plate I (internal 90, external 90) |
| Elbow | flexion | 0 to 145 | Plate I |
| Forearm | twist | -80 to 85 | Plate I (pronation 80, supination 85) |
| Wrist | flexion | -70 to 80 | Plate I (dorsiflexion 70, palmar flexion 80) |
| Wrist | abduction | -45 to 20 | Plate I (ulnar deviation 45, radial deviation 20) |
| Hip | flexion | -30 to 125 | Plate II (flexion 125), AAOS (extension 30) |
| Hip | abduction | -30 to 45 | Plate II (abduction 45) |
| Hip | twist | -45 to 45 | AAOS |
| Knee | flexion | 0 to 140 | Plate II |
| Ankle | flexion | -45 to 20 | Plate II (dorsiflexion 20, plantar flexion 45) |
| Cervical spine, whole chain | flexion / lateral / rotation | -45 to 45 / 45 each side / 80 each side | 4.71a Note (2) |
| Thoracolumbar spine, whole chain | flexion / lateral / rotation | -30 to 90 / 30 each side / 30 each side | 4.71a Note (2) |

The engine's fallback table `DEFAULT_HUMANOID_ROM` in `@automovie/engine` declares itself an approximate baseline and differs from this record at the elbow (150 against 145), the knee (150 against 140), forearm rotation (90 against 80/85), ulnar deviation (30 against 45), and in per-segment spine and neck ranges whose sums run well past the chain's clinical total (150 degrees of flexion over three thoracolumbar segments against 90; 90 over two cervical segments against 45). The body basis carries the clinical values on its own joints through `IAutoMovieBone.constraint` and leaves the engine table, which is part of the specification, to its own topic.

## Frame and correspondence with the face

Measured in Blender 5.2 against the committed face basis: subdividing the masked MPFB body once with Catmull-Clark, limit surface on, reproduces all 17,727 non-ring head vertices of the face basis to 0.00000 mm, under the frame `x = x_blender`, `y = z_blender - 1.519431`, `z = -y_blender` (metres, Y up, Z forward). The body basis is published in that same frame so that the 200 ring vertices at the neck clip are the same points in both bases with no translation; the ground plane sits at Y = -1.5187 m and is recorded in the extraction receipt. The extraction re-derives the offset and re-proves both facts on every run and refuses to publish when either fails.
