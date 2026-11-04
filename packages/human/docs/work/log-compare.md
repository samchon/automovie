# View comparison log (campaign #3044)

Times are read from `Get-Date` after the fact. Owner order (relayed 2026-11-04): f1 alone; f2, m1 and m2 are dropped from the overlay, the captures and the table.

## The overlay (debug viewer, 2026-11-04)

`reference=f1` on the shared viewer (`packages/human/debug/README.md`, "View comparison") draws f1 from the private `.references` pack as a translucent clay stack of its horizontal sections, and over it, in f1's own frame, the 2D view curves of every view part the current source builds from f1's inputs: each part's front outline pair, side outline pair, top (the section rings at its knot stations) and axis, one colour per part, each curve labelled `<part> · <view>`. The parts are recorded as the engine's view operator received them while `AutoMovieHumanBodyLaw.calibrate` and the head composer run (`HumanDebugViewTap`), so the drawing is the production's own input.

The table comes from the same load (`HumanDebugViewDeviation`), per part over the stations of its loft, in person millimetres:

- E: largest absolute edge deviation (an outline minus the reference's extreme on that side, the reference cut by the part's own section plane), its mean, the largest as a share of the reference's breadth (front edges) or depth (side edges) there, which edge, and where along the axis (share of the station span, nearest site). `-` where the reference's skin does not surround the part's axis at any station: a face part on the head, or a part whose axis lies outside the reference's skin.
- B: mean signed deviation of each edge `+u, +v, -u, -v`; positive is built outside the skin.
- T: largest and mean distance from the four box touch points to the nearest cut skin.
- R: largest and mean distance from the built section, read at 48 angles, to the nearest cut skin.

No reference coordinate is recorded here, only these aggregates. The comparison is a diagnostic for the modelers, never a target a shape is fitted to.

## f1, source a4de85f91a2b (frame captured 18:07:01, read 18:11)

Built from f1's inputs (scale 1.0000 person mm per calibration mm), 57 parts; the trunk, both breasts and both gluteal masses are lofted twice by the trunk solve and the last loft is the one compared. Worst first by E, else by T.

| Part | E max (mm) | E mean | E share | Worst edge, place, site | B +u / +v / -u / -v | T max / mean | R max / mean |
| --- | --- | --- | --- | --- | --- | --- | --- |
| gluteal.right | - | - | - | - | - | 205.3 / 70.5 | 205.3 / 60.5 |
| gluteal.left | - | - | - | - | - | 204.7 / 69.4 | 204.7 / 60.5 |
| breast.right | - | - | - | - | - | 173.2 / 54.9 | 183.2 / 54.4 |
| trunk | 135.3 | 24.5 | 35% | -v, 0.5%, bottom pole | -8.2 / -18.1 / -24.0 / -18.2 | 89.0 / 14.8 | 91.1 / 19.9 |
| leg.right | 130.1 | 21.0 | 70% | +u, 97%, top pole | -35.4 / -0.3 / -2.8 / -10.8 | 266.5 / 42.0 | 270.0 / 40.5 |
| breast.left | - | - | - | - | - | 130.0 / 50.7 | 136.6 / 49.5 |
| arm.right | - | - | - | - | - | 121.0 / 36.2 | 122.9 / 34.6 |
| leg.left | 110.0 | 18.8 | 50% | +u, 1%, bottom pole | -25.6 / -8.5 / -1.3 / 2.1 | 261.1 / 42.6 | 264.8 / 40.9 |
| arm.left | - | - | - | - | - | 101.7 / 35.6 | 105.5 / 34.0 |
| neck | 93.2 | 19.6 | 56% | +u, 100%, neck.top | -56.8 / -9.3 / -1.0 / -9.6 | 57.6 / 13.3 | 57.6 / 10.7 |
| auricle.left | - | - | - | - | - | 68.2 / 13.6 | 82.0 / 13.4 |
| foot.left | - | - | - | - | - | 65.0 / 20.8 | 69.9 / 18.1 |
| foot.right | - | - | - | - | - | 64.6 / 18.9 | 69.2 / 17.7 |
| finger.right.middle | - | - | - | - | - | 64.8 / 50.8 | 64.8 / 50.8 |
| finger.right.index | - | - | - | - | - | 64.5 / 52.1 | 64.7 / 52.1 |
| finger.left.middle | - | - | - | - | - | 62.9 / 47.6 | 62.9 / 47.7 |
| finger.left.index | - | - | - | - | - | 62.7 / 49.5 | 63.1 / 49.5 |
| finger.right.ring | - | - | - | - | - | 59.6 / 46.8 | 59.8 / 46.9 |
| nose | - | - | - | - | - | 58.1 / 11.9 | 58.1 / 10.3 |
| finger.left.ring | - | - | - | - | - | 57.1 / 44.7 | 57.4 / 44.7 |
| head.mass | 56.5 | 12.7 | 51% | +v, 0%, throat | -8.1 / -2.4 / 0.2 / -2.9 | 129.7 / 17.4 | 134.5 / 15.5 |
| sulcus.mentolabial | - | - | - | - | - | 55.6 / 15.1 | 55.9 / 13.6 |
| finger.right.little | - | - | - | - | - | 49.3 / 40.2 | 49.3 / 40.3 |
| finger.left.little | - | - | - | - | - | 48.8 / 39.8 | 49.1 / 39.8 |
| auricle.right | - | - | - | - | - | 48.0 / 14.4 | 51.8 / 13.8 |
| thumb.right | - | - | - | - | - | 46.6 / 19.9 | 46.6 / 19.9 |
| orbit.right | - | - | - | - | - | 45.6 / 10.8 | 46.1 / 10.9 |
| thumb.left | - | - | - | - | - | 41.5 / 20.1 | 41.5 / 20.1 |
| brow.right | - | - | - | - | - | 40.9 / 11.3 | 40.9 / 11.2 |
| nose.nostril.right | 36.6 | 22.7 | 57% | -v, 100%, nose.nostril.right.20 | -8.6 / -26.6 / -19.1 / -36.6 | 9.9 / 3.5 | 9.9 / 3.1 |
| lid.lower.left | - | - | - | - | - | 36.5 / 13.5 | 36.5 / 13.5 |
| lid.lower.right | - | - | - | - | - | 35.1 / 12.6 | 35.1 / 12.4 |
| lid.upper.right | - | - | - | - | - | 34.2 / 5.9 | 34.2 / 5.4 |
| lip.upper | 33.4 | 10.7 | 79% | +v, 100%, lip.upper.20 | -1.4 / -27.6 / -1.3 / -5.8 | 25.0 / 5.0 | 29.2 / 3.8 |
| lid.upper.left | - | - | - | - | - | 32.3 / 6.2 | 32.3 / 5.5 |
| brow.left | - | - | - | - | - | 31.5 / 12.3 | 33.6 / 12.0 |
| nose.nostril.left | 30.5 | 19.6 | 55% | -v, 100%, nose.nostril.left.20 | -8.6 / -24.1 / -15.4 / -30.5 | 10.0 / 3.5 | 10.0 / 3.0 |
| toe.left.1 | - | - | - | - | - | 28.6 / 11.9 | 28.8 / 12.0 |
| ear.concha.right | - | - | - | - | - | 27.1 / 14.5 | 27.2 / 14.6 |
| toe.right.1 | - | - | - | - | - | 26.3 / 11.3 | 26.5 / 11.2 |
| lip.lower | - | - | - | - | - | 23.0 / 6.8 | 25.0 / 5.9 |
| ear.concha.left | - | - | - | - | - | 20.6 / 12.6 | 21.0 / 12.6 |
| philtrum | 20.2 | 15.8 | 68% | +u, 17%, philtrum.1 | -17.9 / -15.2 / -15.2 / -14.8 | 12.5 / 6.0 | 12.5 / 6.0 |
| ear.antihelix.right | - | - | - | - | - | 19.2 / 7.9 | 19.2 / 7.6 |
| toe.left.2 | - | - | - | - | - | 18.0 / 5.6 | 18.5 / 5.7 |
| toe.right.2 | - | - | - | - | - | 16.5 / 5.4 | 16.8 / 5.5 |
| nose.ala.right | - | - | - | - | - | 16.0 / 5.4 | 17.7 / 5.3 |
| ear.antihelix.left | - | - | - | - | - | 14.9 / 5.9 | 14.9 / 5.4 |
| nose.lobule | 14.4 | 5.7 | 46% | -v, 100%, nose.lobule.20 | 4.4 / -5.3 / 4.0 / -5.5 | 18.6 / 4.4 | 19.8 / 4.6 |
| nose.ala.left | - | - | - | - | - | 14.1 / 5.1 | 16.6 / 5.1 |
| toe.right.3 | - | - | - | - | - | 14.0 / 4.6 | 14.1 / 4.5 |
| toe.left.4 | - | - | - | - | - | 13.5 / 4.3 | 14.2 / 4.2 |
| toe.left.3 | - | - | - | - | - | 13.5 / 4.7 | 14.2 / 4.6 |
| toe.right.4 | - | - | - | - | - | 10.9 / 4.3 | 11.4 / 4.2 |
| orbit.left | 9.5 | 2.0 | 28% | +u, 80%, orbit.left.14 | -0.9 / 0.6 / 1.3 / 1.0 | 45.4 / 9.4 | 45.9 / 9.5 |
| toe.right.5 | - | - | - | - | - | 8.1 / 3.7 | 8.5 / 3.7 |
| toe.left.5 | - | - | - | - | - | 8.1 / 3.5 | 8.5 / 3.4 |

Reading, by the overlay frames of the same source:

- The gluteal masses are the worst parts: a lobe ~110-160 mm behind the buttock from the waist past the gluteal fold (side and top frames). The breasts reach ~20-25 mm past the breast front and rise toward the shoulder (side).
- The trunk holds the skin along most of its height (E mean 25 mm, R mean 20 mm); its front edge stands ~40-50 mm in front of the lower belly, its largest deviation is at the perineum pole, and all four mean biases are negative (built inside the skin by 8-24 mm on average).
- The legs hold the skin below the knee; their worst stations are the poles (the crotch top pole and the ankle end), and the two front outlines cross each other between the thighs (front frame). Leg +u bias -26 to -35 mm.
- Arms and digits: the reference skin never surrounds the arm or finger axes (E `-`), and the built section stands 34-36 mm (arms) and 40-52 mm (fingers) from the skin on average: the built arm runs outside the reference arm and the hands end lateral and forward of the reference hands.
- Head: head.mass's sides hold (E mean 13 mm), its worst at the throat station; the neck's +u (front) edge is 57 mm inside the skin on average; the face parts are 3-15 mm from the skin on average, the lids, orbits, brows and auricles reaching 30-80 mm at their worst stations.
- Feet and toes: 3-21 mm mean, the big toes and foot outline ends worst.
