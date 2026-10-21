# Common neutral supports

`HumanSkeleton` owns the generated support hierarchy and the transport between
the trunk's identified reference frame and independently changed inputs.
Recovered Hermite curves own skin shape. Native rig points only establish
geometric correspondence and section frames; they are not clinical landmarks.

## Observations and coordinates

The four original `body-observations.json` members under `test/.shots` bind the
current native component matrices to the captured body geometry and its unchanged
native state. `planReferenceLimbSections` verifies those receipts and the original
installed coordinate-conversion implementation before producing registered
supports. Native component translations become `[10*z,10*y,-10*x]` mm. This is
distinct from the native exported mesh's UE-to-registered conversion.

| Original directory | Body-observation SHA-256 |
| --- | --- |
| `jang-nara` | `f67520f7ebef51b990833847854687c88d286c7e9f61b281fd400d2798e46eed` |
| `emma-watson` | `22b43743c561006cfd6089554b4ed60b54c5c6550b7be5c719431cc6a5151596` |
| `won-bin` | `9b2f8010b71150c6597af73cb40df27e4f935194db168a33a6d48b0716a43f8a` |
| `daniel-radcliffe` | `e5c012ca9e0aa5c0770ccbec2100306bffd3ffe431a20ac14ad14a12a9a93e28` |

The common neutral directions retain the observed posture. No conversion to a
straight clinical standing pose is inferred. Bilateral reflection is a declared
generation symmetry; the original people and their native support chains need
not be exactly symmetric. Native side labels remain unqualified anatomical names.

## Hierarchy and independent length constraints

Through-origin pooled fits relate achieved native measurement courses to support
chords. The upper-arm chord is `0.8242395804153954 * upperArmLength`; the forearm
chord is `1.0278544231416413 * lowerArmLength`. Their directions and the axial
hierarchy's eight normalized segment lengths are common coefficients.

The sum of thigh and shank chords is `1.1155098721717496 * inseam`, and the thigh
fraction is `0.5198535106861544`. These course-to-chord relations are measured
geometric approximations. In particular, the original Inseam course runs between
an ankle-area point and a crotch-area point; it is not crotch-to-floor height.

The observed common ankle datum, hip offset and directed leg projections solve
pelvis height. The remaining axial scale solves the height constraint with the
common crown allowance. No independent constant pelvis-height equation is added.
An impossible nonpositive upper axial extent is refused. Across-shoulder course
affects the shared clavicle law separately from upper- and lower-arm lengths.

For the initial pooled hierarchy, comparing 23 support positions per reference
gave 7.637 mm RMS and 17.969 mm maximum error. This is a conditional source-fit
result, not a clinical protocol or proof of unseen morphology prediction.

## Trunk reference transport

Trunk course positions were identified conditionally on achieved height and the
native masculine/feminine coordinate. Transporting them from an unrelated
constant pelvis fraction introduced an additional station displacement in the
first assembled render. The reference hierarchy now uses the same conditional
observation chart:

`referenceInseam / height = 0.43686773202807394 + 0.0056851924785208344 * shape`.

Ordinary two-column least squares over the four achieved course ratios gives
these shared coefficients. This conditional relation has rank two; it does not
identify an independent biological effect of the shape coordinate.

The reference pelvis and neck are solved with that reference inseam and the
same leg/axial equations as the generated hierarchy. `mapTrunkOrigin` transports
each identified centre by the affine displacement between these two anchors.
An independent inseam change therefore moves the actual trunk curves and their
limb attachments together. Section shape coefficients remain with the trunk
curve owner; the skeleton supplies no replacement silhouette or mesh.

## Remaining scope

Neck-length and neck-to-waist courses still lack an independently identified
course-to-support mapping. Source-fit residuals, inferred neutral symmetry and
conditional population correlations remain separate from independent parameter
effects. Shared skin boundaries, transverse jets and branch domains belong to
the assembly and must be inspected with their neighbors after each combined
correction. A support fit or exact length equation alone certifies none of those
surface properties.
