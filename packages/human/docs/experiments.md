# Human experiment findings

Measured findings from the offline fitters and the identity measurement program under `test/src/executable/reference-experiments/human-calibration/` (private, ignored), all on the four reference meshes and their observations. The rows' error is `0.2 / sqrt(3) = 0.115 mm`, their 0.2 mm fitting tolerance spread evenly.

## Fitting energy and stiffness

- A thin-plate energy on the section coordinates counts a closed section's own curvature as bending and shrinks every section. On f1's head base (`fitHeadBase.ts`, keys every 6 mm, 128 control points) the inliers fell from 138,514 to 32,315 samples at a median offset of 0.70 mm. Put the energy on the correction from the stage's starting keys.
- A relaxing robust fit climbs onto an unmasked protrusion from its edges: on f1's head base the nose tip stood 4 mm and each auricle split into two regions of 8 to 9 mm. Mask feature regions before fitting the base under them.
- On f1's head base under the landmark regions, Tukey's biweight reached an inlier RMS offset of 0.098 mm at 71 keys. Plain least squares stopped at 0.154 mm at its 1 mm stiffness floor, and each key addition raised its offset, to 0.199 mm at 71 keys.
- A stiffness floor of twice the 4 mm family spacing (8 mm) stopped f1's palm and foot bases at 10 mm, 3.6 to 5.8 times above the rows' error. With a 1 mm floor the discrepancy principle's length was 1.7 to 4.5 mm and every base met the error. Raising N to 128 or keying every 4 mm changed neither result.
- Under generalized cross-validation, f1's feet, arms, leg, digits, toes, left breast relief and nose relief score lowest at 1.01 mm, the bracket's lower end, so the 1 mm floor and not the data ends the search. The palms (1.03 mm), the trunk (2.21 mm), the head base with its cap (1.10 mm) and the arm, thumb and index strips (1.05 to 1.25 mm) have their least inside the bracket.

## Feature regions

Three detection sets on f1's head base tried to find the nose, lips and auricles as stand-off above a stiff base. None held one connected region per feature:

- Rays cast along the base normal cannot measure a hollow protrusion: observed points lie only on the outer skin, so the 20 mm nose read at most 7.5 mm.
- A symmetric robust fit absorbs features until they stand about the threshold over it: the nose read 9.5, 6.8 and 4.7 mm and the auricles 12.9, 10.8 and 8.8 mm as the threshold fell from 4.1 to 1.3 mm.
- An asymmetric least-squares baseline reaches the features' full height at a 20 mm length (nose 17.9 mm, auricles 18 mm) but sinks into the cranium as it stiffens: its median offset fell from 0.69 to -1.07 mm from 20 to 80 mm.
- Each auricle broke into 4 to 40 basins at every setting, since the concha and scapha sink toward the base between the helix and antihelix.

Regions therefore come from `head-observations.json` landmarks projected onto the base's starting keys. Their limits:

- The skull midline curve reaches at most 94.9 mm forward against about 112 mm at the nasal bridge, so a nasion estimate takes the mean of the medial brow ends and inner eye corners.
- The cutaneous lips run past the vermilion border to the mentolabial and nasolabial folds, so a lip region bounded by the outer lip contours leaves skin outside it.
- The ear landmark curves run inside the ear's outline. On f1 most auricle misses lie within 2 to 4 mm outside the landmark hull, standing up to 13 mm, densest along the ear's top: the rim's overhang.

## Auricle representation

On f1's head base, three auricle variants were fitted to each auricle's region observations and the rim-normal family: a ribbon swept along the rim arc, a relief over the face base, and a biharmonic implicit surface in a 2 mm smooth union with the base. The 99th percentile distance of the region observations to the surface, in mm:

| Auricle | Ribbon | Relief | Implicit |
| --- | --- | --- | --- |
| left | 13.008 | 8.307 | 9.475 |
| right | 5.893 | 7.962 | 9.681 |

Every variant is 26 to 57 times the rows' error at the 99th percentile. The relief's window edge, where its height and first two derivatives vanish by construction, measured 0.19 to 0.26 mm of G0 and 23 to 31 degrees of G1 against the base, on a measure that samples the base on a 1 mm by 256-phase grid. The ribbon's long edges stand 12 to 15 mm off the base, since its sections end where they leave the root loop.

## Identity measurement

The identity measurement program (`measureIdentity.ts`) cuts each joined mesh by the identity types' definitions. Findings:

- The scanned skin does not show suprapatella: on all four the front reach rises without a fall from the source's patella mark to the thigh's midpoint.
- The scanned skin does not show gonion: below the lobules the frontal outline turns into the neck with no single corner, and on f1's mirror-symmetric mesh the two candidate gonia fell 8 mm apart in height.
- The bind pose abducts the arms, so the bideltoid breadth, the carrying angle and the upper arm length (acromion to radiale, defined hanging) are not measurable.
- A leg root loop must stand apart from the other femur's crossing as well as the bind axis's: on m1 and m2 a loop tested only against the bind axis held both thighs, reaching 308 to 310 mm from the bone line against 117 to 126 mm otherwise.
- The hand breadth plane must pass through `index_01` and `pinky_01`: `ring_01` lies 7.0 to 8.9 mm and `pinky_01` 14.4 to 19.2 mm proximal of the plane through `middle_01` normal to the palm axis. The foot breadth's plane has the same form.
- On f1 and f2 the philtrum curves end 1.4 to 1.6 mm above labiale superius, on the vermilion border, not at subnasale.
- The midline cut runs into the nose's cavities behind the columella and into the mouth along the lips' inner faces, so an extremum of the whole cut there lands on those inner surfaces (subnasale on all four, stomion on f1 and f2).
- The skin under the chin runs back nearly level to the throat, so on all four menton lies 19 to 39 mm behind gnathion when taken as the profile's farthest turn toward the back.

The program writes each specimen's identity and site stations to `.shots/claude-scratch/<alias>-identity.json`.
