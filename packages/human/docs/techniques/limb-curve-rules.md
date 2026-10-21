# Common limb curve rules

`HumanLimbCurves` generates independent arm and leg shafts from the shared generated supports and physical body inputs. Skin and construction sample its same `HumanCurveFamily`. Proximal trunk branches and terminal hand/foot transitions remain separately owned assembly domains.

## Observations

The four immutable acquisition bundles are under `test/.shots/human-observations/<reference>/<epoch>`. Each `sections.<region>-<side>.json.receipt.json` binds the saved section member. The original Hermite coefficients, positive physical phase intervals, degree, frame, source-face lineage, all intersected components and fit reports remain in those members.

| Reference directory | Observation epoch |
| --- | --- |
| `jang-nara` | `ce4fde9792bdf616d9efa293d430a0e5b2a6217312c58e0f0d68afd33ccac20d` |
| `emma-watson` | `7bbc2202068df5258cca80b63641a7e053414c65dbb6ccbb45dad5ecd158212d` |
| `won-bin` | `372416304c869f7010f6fa7257b19b4aa12f325f47359f72dc1e0ec5ff9488f6` |
| `daniel-radcliffe` | `4e2565a17539fececa917e7837529d31f8bd1aa1496198b17657ded2a32d3ae4` |

The acquisition helper `selectReferenceSupportSections` was exercised on all four left-side limb families with 0.1 mm cubic chord tolerance, maximum subdivision depth 20 and 16,000 vertices per curve. All cuts had a unique support-containing shell except the last Won forearm plane, which had no unique support-chain intersection. The helper explicitly leaves regional purity and interplane continuation unqualified. Matching one render section or containing a rig support alone does not establish anatomical membership.

The upper-arm support-containing contour includes torso before separation, and the thigh contour includes pelvis or both legs before separation. The observed upper-arm separation brackets end between normalized support stations 0.261 and 0.306 across the references; thigh brackets end between 0.228 and 0.238. The generated independent shaft domains begin at 0.34 and 0.25 respectively. The initial forearm and shank candidates stopped at 0.95. Forearm retains that wrist limit; the later source-backed full-domain shank identification is described below. No source mesh was cropped or closed to establish these domains.

## Identification

For each selected closed curve, the original cubic Hermite spans were evaluated with their actual positive millimetre widths. Each span supplied twelve uniform samples, and signed polygon area gave its area centroid. Exactly one positive ray intersection at each of 192 uniform angles admitted a radial candidate; conflicting ray intersections were omitted rather than replaced by the largest radius. The common physical angular chart projects registered forward into each bone-normal plane. Right-side U reverses the reflected frame's cross-product sign, so left and right retain corresponding physical angles.

Six angular Fourier harmonics fit the candidate radii by linear least squares. Two centroid coordinates and thirteen radial coefficients then divide by the region's physical girth equation. A single pooled linear least-squares fit identifies six Legendre coefficients, degrees zero through five, for each of these fifteen dimensionless channels across all four references and both sides. `HumanLimbRules` stores only this shared compact coefficient family. It contains no reference identity branch, original curve, mesh, normal or per-person control table.

The local girth equations use bicep at 0.46 and elbow at 1 for upper arm, elbow at 0, forearm at 0.2 and wrist at 1 for forearm, and thigh at 0.4 and knee at 1 for thigh. Two-site equations are linear and three-site equations are quadratic Lagrange interpolation. These equations normalize identified shape channels; the nonplanar measured course is not asserted to equal the generated planar perimeter. Their discrepancy remains in the fitted common channels. The initial shank used knee, calf and a terminal perimeter/height ratio of 0.13321579336070133. The full-domain shank law below replaces that terminal scale; no new primary ankle-girth field is introduced.

Principal layers follow observed bicep/thigh courses, proximal forearm and calf volume, centre-offset extremes, width/depth transitions, distal minima and terminal changes. They describe and partition the identified continuous law. `HumanCurveFamily.fromFunction` evaluates that same law and its derivatives throughout each interval; restriction and subdivision preserve the original analytic function instead of fitting a new cubic between the principal layers. The linear girth equations multiply degree-five shape channels to degree six; quadratic girth equations produce degree seven. Subdivision changes sampling and adds no missing feature. Cross-region continuity still requires the assembly's shared boundary and compatible longitudinal derivative in the actual station scale.

For support chord length `L`, physical station is `s=tL`, and `z=2(t-lo)/(hi-lo)-1` is only the dimensionless Legendre coordinate. If `B_i(t)` is one fitted shape channel and `g(t)` its physical girth equation, its dimensioned value and longitudinal derivative are `c_i=gB_i` and `dc_i/ds=(g'B_i+gB_i')/L`. The implementation differentiates the Legendre recurrence and the actual linear or quadratic girth equation. The two centre-offset channels use this same derivative rule; they are not replaced by the bone direction.

Let `O=A+t(B-A)+U*c_0+V*c_1`, `e=U*cos(phi)+V*sin(phi)` and let `R` be the six-harmonic radial series. Then `P=O+eR`, `P_s=O_s+eR_s`, `P_phi=e_phi*R+eR_phi`, and `P_sphi=e_phi*R_s+eR_sphi`. `O_s` includes the unit chord direction and both offset-channel derivatives. Phase stays in radians, positions use mm, `P_s` uses mm per physical station mm, and the mixed derivative uses inverse radians. The common frame axes stay fixed within each shaft. Reflection retains the same physical angular meaning and its explicit surface-normal sign.

These analytic end jets belong to the identified regional function. A requested external clamped jet would change that function, so `HumanLimbCurves` explicitly refuses nonempty prescribed endpoint conditions. The sole common boundary owner must use exact restrictions and its separately constrained joining spans to establish position and transverse continuity. It cannot infer a smooth join from equal endpoints, and this regional operation does not silently impose zero curvature or alter shared shape coefficients to satisfy another region.

## Numerical observations and limits

The following residuals compare the pooled fitted coefficient function with radial samples of the saved source Hermite curves, using the observed source support frames. They precede generated-skeleton placement, tessellation and rendering, and do not certify final skin fidelity.

| Shaft | Selected cuts across four references and both sides | Source angular K6 maximum, mm | Pooled function RMS, mm | Pooled function maximum, mm |
| --- | ---: | ---: | ---: | ---: |
| Upper arm | 151 | 0.814 | 3.261 | 9.035 |
| Forearm | 207 | 0.933 | 2.353 | 6.240 |
| Thigh | 277 | 4.722 | 4.441 | 16.711 |
| Shank | 318 | 1.350 | 5.127 | 15.065 |

The longitudinal design condition numbers range from 3.15 to 3.36. Source fitting and finite polygon/ray sampling add their own errors. This radial family is an approximation of retained Hermite evidence, not exact basis conversion or reduction of arbitrary high-degree or rational curves.

The earlier natural-cubic interpolation of the principal descriptors introduced a separate degree-reduction error. An arithmetic comparison using the same coefficients, all four achieved physical input sets, both sides' original source stations and 192 angular phases isolated this extra loss without changing any source coefficient. The dense column samples 1,001 longitudinal coordinates per input set and is a sampling diagnostic rather than a continuous error bound.

| Shaft | Extra cubic RMS at source stations, mm | Extra cubic maximum at source stations, mm | Extra cubic maximum at dense stations, mm |
| --- | ---: | ---: | ---: |
| Upper arm | 1.092 | 4.942 | 4.956 |
| Forearm | 0.996 | 4.309 | 4.338 |
| Thigh | 1.535 | 6.346 | 6.374 |
| Shank | 0.530 | 2.721 | 2.725 |

Direct analytic evaluation removes this additional cubic representation stage. It changes neither the pooled source-fit residuals above nor the generated support placement and unresolved joint/terminal geometry. The first four-person actual comparison round showed elbow openings, knee cuffs and shelves, smoothed calf/ankle transitions, and the explicitly absent branch and terminal domains. This correction addresses one traced cause of those observations; a new assembled render round must determine its visible effect.

The initial regional coefficients did not include a held-out-person comparison. The later shank comparison below includes whole-person folds; it does not qualify independent native parameter responses. Independent input changes remain generative hypotheses; muscularity, fat and masculine/feminine responses were not identified. Source asymmetry, branch surfaces, pose deformation, clinical joint correspondence and unseen morphology remain separate unresolved qualifications. The generated curve family must be judged with its neighbors and through matched whole-body and enlarged actual renders.

## Distal calf and incoming ankle support

The existing acquisition program subsequently observed `sections.ankle.native_{l,r}.incoming.json` at physical offsets -20, -10 and 0 mm from each actual foot rig support along the incoming calf-to-foot axis. The four later epochs are listed in `joint-curve-rules.md`; they also preserve the original shank members. Sixteen member byte counts and SHA256 receipts were checked. Their sorted relative-path/hash aggregate is `873adb2ba700890981642f16b91a0d375ed9344e1c840bb2b40ca8f74ae9ff84`. The numerical record, source input hashes, runtime hashes, alternatives and person-level losses are in `test/.shots/human-comparisons/shank-distal-identification.json`.

All 318 original shank cuts and 24 incoming cuts have one support-containing original-positive shell and one positive radial crossing at each of 192 identification phases. The original span widths form exact polynomial Green integrals for area and centroid. Radial identification uses recursive cubic Bernstein-control flattening with a 0.025 mm chord bound, depth 20 and 16,000-vertex budget; it is not an exact conversion of the source Hermite. Original triangle incidence binds the 318 legacy cuts, while all 24 new incoming cuts additionally retain exact source-triangle incidence. Containment and incidence do not on their own establish anatomical or material correspondence; terminal source-slab qualification remains separately owned.

The original source fit tolerance is unresolved at 221 of these 342 selected cuts, including 21 of 24 incoming cuts. The maximum selected fit upper estimate is 0.403253 mm. Those qualifications remain distinct from ray approximation, common-law fitting error, generated skeleton placement and final assembly loss.

Incoming planes have the same native axis as their original shank chart, and the zero plane is exactly support fraction `t=1`. The recovered area increases through -20, -10 and 0 for all four people. This zero plane therefore supplies an observed endpoint for a new full-domain law; it is not an ankle minimum and is not extrapolation of the earlier 0.95-limited family. The original distal area-minimum grid brackets remain at approximately `t=0.896..0.931`, separate from that endpoint.

The source profiles distinguish calf volume near 0.33, anterior-profile transition near 0.70, distal area minimum near 0.91 and the incoming support at 1. These shared feature neighborhoods define three simple internal knots, not additional sampled layers intended to hide residuals. One jointly identified degree-five spline uses repeated endpoint knots and simple internal knots at 0.33, 0.70 and 0.91. It is C4 across those knots. Its intermediate curves and exact physical derivatives follow the same piecewise polynomial under restriction and recursive subdivision.

Each of the two centre-offset and thirteen K6 radial channels has the common physical form `c(t)=Calf*A(t)+(Knee-rho*Calf)/sigma*B(t)`, with `rho=0.9582318435866255` and `sigma=0.013937396607537391`. Both inputs are the existing authored controls in mm. The constants merely condition the shared Knee/Calf contrast; they introduce neither an ankle measurement nor a person selection. Source identification uses independently observed actual courses, without injecting measurements into product controls. The two shared coefficient families contain nine spline coefficients per channel, fitted jointly across people and both sides. The design has rank 18 and condition number 19.624.

For `s=tL`, exact derivatives are `c_s=(Calf*A_t+(Knee-rho*Calf)*B_t/sigma)/L` and `c_ss=(Calf*A_tt+(Knee-rho*Calf)*B_tt/sigma)/L^2`. Cox–de Boor polynomial recurrences provide values and both derivatives directly, including one-sided endpoint jets. The surface's angular, longitudinal, mixed and second derivatives use these same channels. The other six arm/thigh shafts retain their existing degree-six/seven laws; no source high degree, rational curve or physical phase is replaced by this fitted candidate.

| Comparison in observed source support frames | Old supported shank | New law on the same 318 cuts | New law on all 342 cuts |
| --- | ---: | ---: | ---: |
| Source RMS, mm | 5.127 | 2.743 | 2.706 |
| Whole-person held-out RMS, mm | 6.829 | 5.344 | 5.274 |
| Whole-person held-out centre RMS, mm | 6.182 | 4.576 | 4.493 |
| Whole-person held-out radial RMS, mm | 2.887 | 2.724 | 2.728 |

The 24 new incoming cuts have source RMS 2.162 mm and held-out RMS 4.244 mm; the full law's source maximum is 6.682 mm and held-out maximum is 12.317 mm. Whole-person folds keep both correlated sides together. A single full-domain Legendre-degree-five candidate biased its distal area minimum upward to about 0.878–0.887. The feature spline instead has actual polynomial area minima at 0.900–0.914. The area function has degree ten on each quintic interval, and derivative-root solving locates these extrema without treating every principal descriptor as an extremum. Remaining calf-peak and distal-minimum location discrepancies are retained in the numerical record.

The improvement is pooled, not uniform. Won Bin's original-supported self-source RMS increases from about 3.110 to 3.553 mm, and its held-out RMS increases from 4.066 to 6.586 mm, while the other three cases improve. The common conditional law cannot distinguish all variation in four correlated shapes. Height-only, extra Height/Knee/Calf predictors and higher internal knot multiplicities were compared rather than adopted; additional freedom did not provide a consistent held-out improvement. Substituting support-chord length for Knee increases full-domain held-out RMS to 7.685 mm, while adding chord length as a third physical predictor increases it to 32.375 mm. A support-length condition therefore cannot be justified as a repair for the unresolved case. No person-specific correction is introduced.

For the observed Knee/Calf convex ratio range 0.939123–0.971876, a floating-point Bernstein interval estimate bounds `radius/Calf` below by 0.054356 throughout the spline domain. This uses the affine ratio endpoints and harmonic-amplitude bounds; it is not certified arithmetic or a causal response claim. Outside those input ratios, positivity checks remain explicit and independent changes are unqualified predictions. A positive radial chart and current-pose support direction do not prove unseen anatomy.

`Region.sectionAt(s)` returns the exact planar Fourier descriptor from the same analytic channels consumed by skin and construction. In particular, `sectionAt(L)` and `sectionAt(L-20)` lie on the actual incoming physical planes. Their radial origin is not presumed to be the generated ring's area centroid. The common ankle owner integrates all Fourier modes for area and centroid and alone establishes exact shared cuts, phase and transverse jets. This regional change requires a new assembled whole-body, multi-angle, enlarged and neighbor inspection before visual improvement is claimed.

The first new Jang Nara baseline snapshot, epoch `a8e2ad714773bc28f84988ce6f0fa84c26bfc6ac38eeaf44f60979146ebfed1f` under `human-parameter-observations`, supplies only three whole-body lower-leg cameras. Saved artifact inspection finds no reversed or degenerate face among 18,432 lower-leg triangles and zero sampled positional difference at all six knee joining pairs, with normal differences below `2.5e-16`. The visible knee collar and smoothed anatomical features remain. Reconstructing the emitted joining halves' actual cubic log-radius fields gives a middle world second-derivative jump of 0.101611 inverse mm on both knees, larger than the earlier Jang snapshot's 0.025463. New regional endpoints and physical jets therefore expose an increased curvature mismatch in the still independent common cubic joining spans. This is a shared boundary/shape-fit dependency, not a normal replacement or a reason to clamp regional endpoint jets. The common owner must include it in the complete correction batch.

The shank's minimum face/analytic-normal cosine is 0.95578, concentrated in the final emitted strip at the expanding incoming-support end. That finite sampling diagnostic does not prove a folded chart or justify hiding shape loss by subdivision. The open flare follows an observed increasing-area transition; shared ankle cutting and assembly remain necessary. Current snapshot evidence, regional source binding and scope limits are recorded in `test/.shots/human-comparisons/shank-distal-snapshot-inspection.json`. Enlarged, oblique, four-person, ankle-neighbor and independent-input inspections remain absent from this snapshot.
