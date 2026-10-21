# Neck course identification

The native neck girths, the current neck support chain, the narrow skin tube and the head/body source-part junction are different observations. The current generator has no qualified neck skin or shared neck boundary. This analysis fixes the geometric correspondence needed before adding that region; it does not certify a generated result.

## Bound observations

All observations below are under `test/.shots/human-observations/`. Their existing stage receipts preserve the original source and the official Recovery Hermite coefficients. Native course order, closure, span count, individual physical chord-mm intervals and derivatives remain in `body-courses.json`.

| Source directory | Completed observation epoch |
| --- | --- |
| `jang-nara` | `e77b22a998b10cbbe803e64aff18fc4be89e0402459318ae778d3180a07ff708` |
| `emma-watson` | `8b6607425940ce6bd17154db41effb3d1cdf56979bc74af940ac8baa4c5f2ac8` |
| `won-bin` | `9f1cd819ba87eebb4ba7701ec67ce6155ec4484c4a532318250d1b97581a293e` |
| `daniel-radcliffe` | `fb5612fb69760ae545873f3c1ca91eb825934096e15f0fc49ede3b0d25795ab3` |

The registered frame is millimetres, +X forward, +Y up and signed lateral Z. `regional-frames.json` supplies current-pose supports. `sections.head-skin-transverse-v1.json` explicitly selects native head render section 0 while retaining its original source-triangle mapping. That selection includes the neck and upper collar; it is not limited to the cranium.

| Source | Complete body maximum Y mm | Selected head skin minimum Y mm |
| --- | --- | --- |
| Jang Nara | 1400.646 | 1337.581 |
| Emma Watson | 1405.707 | 1324.639 |
| Won Bin | 1551.917 | 1496.254 |
| Daniel Radcliffe | 1569.536 | 1508.363 |

These overlapping height bounds do not establish coincident source surfaces, a shared neck seam or matching derivatives. They establish that a body-only neck observation is incomplete. In Jang Nara the lowest point of the native Neck Base course is Y=1418.164 mm, above every body-native vertex.

## Native course and support axes

Neck Base has 76 captured points and Neck has 51, including each exact repeated endpoint. Both are oblique closed curves. Their observed normals are approximately `[0.500011, 0.866019, 0]`, while the current `neck_01` to `head` chord direction is approximately `[0.20536, 0.97869, 0]`. Their dot product is approximately 0.95025, so native girth is not a bone-normal section. Mean Y must not replace either native plane.

An area-vector normal computed from each ordered native polygon has a maximum point-to-plane residual between 0.000067 and 0.000111 mm across these eight courses. This is a bounded inferred plane of captured floating-point points, not an exact original native plane declaration. An independent least-squares plane calculation gives the same broad orientation. The new planning helper retains its own area-vector residual and caller-supplied physical admission tolerance.

| Source | Native base-to-neck plane spacing mm | Captured Neck Length line mm | Achieved neckLength mm | Current neck_01-to-head chord mm |
| --- | --- | --- | --- | --- |
| Jang Nara | 43.435 | 82.459 | 80.536 | 109.551 |
| Emma Watson | 50.490 | 92.877 | 91.537 | 105.723 |
| Won Bin | 35.992 | 60.104 | 59.514 | 110.452 |
| Daniel Radcliffe | 31.742 | 63.572 | 62.983 | 99.768 |

The two-point Neck Length course is a separate mostly vertical anterior line. Its endpoints do not coincide with the support centres or the two native girth-plane intersections. Neck to Waist is a seven-point open anterior course; its first point equals the first Neck Base point, providing one exact native guide/feature incidence. Its whole polyline length and its Hermite curve length are separate quantities.

The official Neck Hermite fits are all partial. Their sampled maximum residuals are 0.193, 0.152, 0.079 and 0.161 mm, while their reported polyline upper estimates are 0.450, 0.386, 0.451 and 0.602 mm respectively. Daniel Radcliffe's Neck Base fit is also partial, with a 0.240 mm upper estimate. The source artifacts retain those qualifications. A small sampled residual does not change their status.

## Principal structure

The existing selected-skin horizontal observations already show collar convergence, a narrow tube, then a front extension into the submandibular region. The following are sampled minima of the unique closed loop containing the extended current neck support line. They are not certified continuous extrema. Each original cubic Hermite was evaluated with its actual physical derivative interval, at 30 subdivisions per span for this preliminary study.

| Source | Sampled minimum Y minus neck_01 Y mm | Sampled perimeter mm | Forward depth mm | Lateral breadth mm |
| --- | --- | --- | --- | --- |
| Jang Nara | 42.708 | 307.40 | 94.60 | 103.77 |
| Emma Watson | 43.179 | 310.17 | 98.18 | 104.12 |
| Won Bin | 38.968 | 481.14 | 167.77 | 143.12 |
| Daniel Radcliffe | 39.464 | 506.93 | 168.75 | 143.72 |

Ten millimetres above the female minima the forward depth rises to 140.02 and 155.34 mm, with a much smaller breadth change. That region cannot be represented by a uniform neck ellipse. Male collar convergence is stronger below the minimum: Won Bin's sampled breadth drops from 298.64 to 149.07 mm between neck_01+18.968 and +28.968 mm; Daniel Radcliffe's drops from 293.06 to 203.25 mm between +19.464 and +29.464 mm. Source incidence and oblique/longitudinal guides must distinguish tube convergence from collar, shoulder and jaw branching.

The working domains are therefore the lower collar with its shoulder ownership, the regular neck tube, and the upper transition into the jaw and occiput. Their exact boundaries and principal-layer count depend on observed silhouette extrema and topology. The head owner's current posterior chin half-course is not a measured neck-end curve and cannot be reused as one by name alone.

Every one of 256 angular rays from each native course's planar area centroid had one positive intersection in a dense preliminary Hermite evaluation. An angular Fourier approximation is therefore plausible for those oblique courses. This is a separate approximation; it does not replace the source Hermite representation or infer a tube between two loops.

| Source | Neck degree-6 angular fit RMS / maximum mm | Neck degree-8 angular fit RMS / maximum mm |
| --- | --- | --- |
| Jang Nara | 0.304 / 0.695 | 0.121 / 0.326 |
| Emma Watson | 0.240 / 0.481 | 0.100 / 0.303 |
| Won Bin | 0.320 / 1.141 | 0.176 / 0.861 |
| Daniel Radcliffe | 0.366 / 0.881 | 0.165 / 0.609 |

Those numbers use 200 evaluations per original Hermite span, polygon area centroids, 256 rays and an ordinary least-squares angular fit. They measure finite approximation quality only. They do not establish a continuous bound, clinical identity, transverse derivatives or unseen-shape prediction.

## Rejected representation and retained common laws

A second read-only study used exact Hermite-to-Bernstein control conversion with each original physical interval and adaptive subdivision to a 0.025 mm control-hull chord bound. It selected the unique support-line-containing closed loop and admitted a radial chart only when all 256 planar-area-centroid rays had exactly one positive intersection. Won Bin's horizontal section at support fraction 0.17547 has three ambiguous rays. Missing or ambiguous sections remain explicit; they are not paired to an outermost ray.

One fixed support-fraction horizontal radial family over fractions 0 through 0.45 fails to align the collar and neck across the references. Angular degree 8 with longitudinal Legendre degrees 2 through 5 and common `[1, shape]` coefficients gives female training RMS around 2 mm but male RMS around 9 to 12 mm. Male leave-one-person-out RMS is around 20 to 28 mm for the stable lower-order variants. Higher longitudinal degree makes the held-out result worse, including ill-conditioned extrapolation. These coefficients were rejected. Collar branching and feature misalignment cannot be repaired by adding polynomial degree or sampling layers.

The native oblique courses support a simpler common angular law. Divide radii by the corresponding achieved native girth, then jointly fit degree-8 angular coefficients with `[1, shape]` across all four sources. Keep centre placement as a separate physical problem instead of normalizing its entire world offset by girth.

| Source | Neck Base training radial RMS mm | Neck training radial RMS mm | Neck Base held-out radial RMS mm | Neck held-out radial RMS mm |
| --- | --- | --- | --- | --- |
| Jang Nara | 0.751 | 0.349 | 1.651 | 0.738 |
| Emma Watson | 0.845 | 0.404 | 1.533 | 0.718 |
| Won Bin | 1.375 | 1.069 | 2.990 | 2.302 |
| Daniel Radcliffe | 1.698 | 1.166 | 3.068 | 2.137 |

Adding neck-to-base girth ratio as a third shape coefficient improves the training residual but produces male held-out radial maxima up to 54 mm for the base course. It was rejected. The two-coefficient law remains a candidate for angular shape, not a completed neck surface. Shared centre, longitudinal form, native course widths, endpoint jets and collar/jaw domain correspondence still require their own constraints.

## Acquisition and common-rule solve

`test/src/executable/reference-experiments/planReferenceNeckSections.mts` is a pure planner consumed by the existing acquisition processor. It returns the actual support-normal family, the two inferred native oblique planes, a parallel family between those oblique courses and orthogonal longitudinal planes. Each plan is duplicated for the unchanged complete body and explicitly selected head skin section 0. Recovery remains the only curve extractor, and the existing processor owns immutable stage publication and reuse. At 5 mm sampling, the four support-normal families have 26, 26, 27 and 24 planes, including actual supports and native-plane intersections. Observation spacing does not select the generator's principal layers.

The native-girth parallel family uses the captured Neck Base area-vector normal without averaging it with the upper course's normal. The upper course's first captured point anchors its last selected parallel plane. Both original feature normals and offsets, their angle, the upper course's projected coordinate range, maximum point-to-selected-plane difference and physical tolerance remain in the chart metadata. The selected upper parallel plane differs from the captured upper course by at most 0.000105 mm across the four sources. Its sampling uses half the caller's policy step while retaining both physical endpoints. With a 10 mm policy step it plans 10, 12, 9 and 8 planes respectively. This is an explicit bounded observation-frame choice, not an alteration of the original oblique course.

The support-line intersection of a native plane uses `s=(d-n·A)/(n·t)`, where `t` is the unit neck chord, `A` its proximal support, and `n·t` is the actual physical station Jacobian. Both native planes retain their own normals, coordinates, point-to-plane bounds and original course-fit status. Their scalar or circumferential parameters never substitute for `s`.

After the official observer publishes those families, use exact source incidence to select corresponding tube components and guide intersections. Determine the collar end, sampled narrow-tube extremum and jaw-transition onset from those observations before solving common coefficients. Fit world centres, angular shape and longitudinal derivatives jointly across the four sources, preserving actual endpoint functions and parameter scales. Use constrained linear least squares for linear coefficients and bounded nonlinear solving for oblique-plane intersections or perimeter constraints. Derive recursive interval restrictions from the resulting common evaluator; adding sampling layers does not fill an unobserved collar or jaw domain.

`neckBase` and `neck` are physical native girth controls under oblique definitions. `neckLength` is a distinct anterior course control. A generated independent response requires an explicit geometric mapping among those definitions and the tube's support frame; the four correlated source states do not identify causal derivatives. The achieved girth readbacks also differ from captured polyline lengths by several millimetres, so forcing one to equal the other would silently redefine the input. Height and the common support assembly place the region; the sole assembly owner must reconcile any independently varied neck length with adjacent trunk and head boundaries.

## Committed regular neck family

The existing processor completed 183-stage snapshots for all four sources. It preserved the earlier completed artifacts and appended the native-girth family, source slabs, support-normal family and guides through the official Recovery observer. The four `complete.<sha>.json` suffixes are:

| Source | Completed snapshot SHA-256 | Native-girth head sections SHA-256 | Native-girth head slabs SHA-256 |
| --- | --- | --- | --- |
| Jang Nara | `e3d8e7ca39c9a3e1f39feba28639e414b226ecc2be3647748a0b8140b6a73295` | `79db6a92134f453dc5dbd8a8f1f8c1ce137b02460f8439ea9d5809556987154d` | `7f4cb70d12c3877520cb7eeaeb134ed28296dcb16cfe2b7c24461fb289766369` |
| Emma Watson | `59eaad9c043d16085006caa53fbbf94a09f6f59c9eb930f17b5eaecb5014da2b` | `ea606c91c87e4b466462a6295a910dc6b20ffa4c73d394483e94338f009c730b` | `20297d33b890173d778aa6cfe8f984771e6e09db0bb7e8005c6562297ffa9c0a` |
| Won Bin | `452ee386bce0c9c840dcee268126086af055a4fb15f1208f5bb0a7e7cd969738` | `d43828bc6b60b8a16b163a25e76bbb69b9a27ca4d1dbbf90686b9da5bc0a59fc` | `2da5e9eb36f430c99895e994be9527d756ea2f01f98b25d5cf23c651eba63e14` |
| Daniel Radcliffe | `bc19fbfd24800b89dfac507a805d877cc6590de2ee84f84743c9d912ce412cce` | `cc3a2a285c8129e746fe8ccb78795457c8883e343b9e7678169b8ee0a17dd9cf` | `caef35b1cb076d1fe259af0c4a11cdd904581f5e33b36bf5057b8a0bb5eac14d` |

Every consumed section/slab member's path, length and SHA-256 was checked against its stage receipt and the matching 183-member snapshot. The head source SHA matches the unchanged original `head-native.json`; explicit selection remains render section 0 with original-face remapping. Matching complete-body stages were also checked against the original body source SHA and the snapshot. Their 10, 12, 9 and 8 planes contain no closed or open body contours, confirming that this domain belongs to the head skin.

Of the head family's 10, 12, 10 and 12 total closed loops, respectively, one support-containing loop per physical plane identifies 39 regular neck courses. Every selected course has exactly one positive ray intersection in all 256 radial directions. Every one of the 35 adjacent selected-loop pairs has unique exact source ports into the same consistently oriented, manifold, orientable, genus-zero annulus with Euler characteristic zero and two boundary cycles. The first Won Bin slab has one other source component, and Daniel Radcliffe's slabs have four other component occurrences; those domains remain recorded and ungenerated. An incidence-qualified annulus establishes contour continuation, not material phase or a source transverse derivative.

The actual skin perimeter is not the native course readback. For example, the Jang Nara native Neck polyline is 308.710 mm while the recovered selected skin contour in its matching plane is 317.479 mm. The generator keeps the independent native control as a normalization scale and fits the observed skin discrepancy through the common shape coefficients. It does not force the recovered skin perimeter to equal the control or relabel the geometrical minimum as a clinical neck measurement.

## Analytic regional implementation

`HumanNeckRules` contains one compact shared population, and `HumanNeckCurves.build(body, skeleton, HumanNeckRules.rule)` consumes the main owner's unchanged `neck_01` and `head` supports. The oblique chart's relative rotation from that support chord towards projected forward is the pooled least-squares angle 0.3167722656181057 radians. The common base-plane offset is `L * (0.23732448742183537 - 0.07874317394494325 * shape)`, and its normal span is `0.5480046138273743 * neckLength`. Their sampled placement residuals reach 2.064 and 3.378 mm respectively. These source-conditioned geometric mappings are not native one-cause parameter derivatives.

At normalized physical station `eta`, the forward centre uses separate physical support-chord and native-girth terms. Lateral centre and angular Fourier degree-8 coefficients use common constant and shape-coordinate populations. Each channel has longitudinal Legendre degree 3. The independent physical normalization `G(eta)=(1-eta)*neckBase+eta*neck` multiplies those identified coefficients; this product is degree 4 and is evaluated directly. The intermediate source curves jointly determine its shape, so the equation is not a linear blend of two endpoint contours.

The fit uses each person's actual adjacent physical station widths for trapezoidal quadrature, normalized to unit total weight per person. This avoids giving extra influence to more densely sampled or very short final intervals. The finite residual includes angular approximation and planar centre error before the common frame-placement residuals above.

| Source | Training RMS / maximum mm | Held-out-source RMS / maximum mm |
| --- | --- | --- |
| Jang Nara | 1.505 / 2.301 | 3.219 / 4.775 |
| Emma Watson | 1.476 / 3.192 | 2.548 / 4.774 |
| Won Bin | 2.339 / 5.094 | 4.462 / 9.008 |
| Daniel Radcliffe | 2.220 / 4.406 | 4.826 / 9.590 |

The retained degree-3 longitudinal law has weighted joint-design condition numbers 3.555 for radial/lateral channels and 51.987 for the physical forward-centre channels. Degree 1 has larger training residuals; degrees 4 and 5 change held-out residuals little. The recovered Hermite degree, chord-mm phase intervals and actual source orientation remain in the immutable source artifacts; this fitted degree-4 surface is a distinct generative representation.

Principal boundaries retain the native base and neck planes. Internal perimeter turns are found from the same analytic family using 128-point angular quadrature, 32 sign brackets and bounded scalar solving. They can move or disappear when independent girths change. The scan does not certify even-multiplicity stationary points or all continuous extrema. This layer selection changes the interval descriptors, while exact analytic values and jets remain unchanged. `HumanCurveFamily.fromFunction` recursively restricts that original degree-4 function; it never replaces it by a cubic or adds sampling layers to fill missing shape.

The result exposes `sections`, `family`, `outwardSign: 1` and limitations for the main owner's skin/construction assembly. Position, physical longitudinal derivative, circumferential derivative and mixed derivative come from that one evaluator. The lower shoulder/collar branch and upper jaw/occiput junction remain open domains for the single common-boundary owner. The model does not invent their seam, transverse jet, cap, overlap mask or source fallback.

The regional implementation has not been executed or visually accepted here. Its consumer must inspect the independent generated tube, whole body, multiple angles, close-ups and neighboring boundaries under the existing matched conditions, then vary independent inputs, interactions and return. Held-out conditional fit is reported separately from unobserved morphology prediction.
