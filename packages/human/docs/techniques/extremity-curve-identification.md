# Hand and foot curve identification

The current runtime candidates are [HumanHandShafts](../../src/extremities/HumanHandShafts.ts) and [HumanFootBody](../../src/extremities/HumanFootBody.ts). They generate open distal finger intervals and an open foot-body interval. They do not complete hands, feet, web branches or skin tips. Their curve families supply both skin and construction.

## Fixed observations

The existing reference experiment processor produced the source sections. Each file binds the registered model, actual support chart, physical frame, fitted Hermite curves, fit reports, original triangle incidence and render-section metadata. The original reference bundles and their normal outputs were preserved.

| Reference | Observation epoch |
| --- | --- |
| Jang | `ce4fde9792bdf616d9efa293d430a0e5b2a6217312c58e0f0d68afd33ccac20d` |
| Emma | `7bbc2202068df5258cca80b63641a7e053414c65dbb6ccbb45dad5ecd158212d` |
| Won | `372416304c869f7010f6fa7257b19b4aa12f325f47359f72dc1e0ec5ff9488f6` |
| Daniel | `4e2565a17539fececa917e7837529d31f8bd1aa1496198b17657ded2a32d3ae4` |

Files reside in `test/.shots/human-observations/<reference>/<epoch>/sections.extremity.native_<side>.<part>.json`. The chart uses millimetres, +X forward, +Y up and signed lateral Z. Native side names remain geometric observation identities. Current native component supports are registered once as `10(z,y,-x)`; raw UE reference bones do not replace those current supports.

Every retained source curve is cubic Hermite with its original positive millimetre phase widths. A span is evaluated using its actual width h:

`P(t) = H00(t)P0 + h H10(t)D0 + H01(t)P1 + h H11(t)D1`.

The runtime Fourier models are new fitted common families. They are not exact conversions or degree reductions of the retained source cubics.

[referenceHumanExtremityInputs](../../../../test/src/executable/reference-experiments/referenceHumanExtremityInputs.mts) supplies dynamic comparison dimensions from a committed observation directory. It verifies the completion/context binding, member receipts, original regional support map and both foot publications. It returns the existing generator input shape separately from `source-geometric-extremity-proxies-v1` acquisition metadata, which explicitly denies clinical measurement equivalence. No per-reference dimension table is consumed by the product.

## Contour selection and topology

[selectReferenceSupportSections](../../../../test/src/executable/reference-experiments/selectReferenceSupportSections.mts) intersects the actual piecewise support chain with each requested plane. It observes all closed loops, negative-winding cavity boundaries, open arcs, contacts and unresolved fits. The unique positive shell containing that intersection is a candidate, without ranking contours by size.

Adaptive de Casteljau flattening uses a declared 0.01 mm control-to-chord bound, depth 24 and 200000 vertices per curve in this research round. A point within the physical chord tolerance of a boundary, a failed flattening or multiple support intersections remains ambiguous. These are binary64 geometric observations rather than certified predicates.

Containment does not establish regional purity. Proximal finger candidates include palm tissue. The observed big-toe root initially includes forefoot tissue; all three little-toe chart sections remain about 85 mm wide in the Jang observation and do not identify a separate little-toe shaft. Some neighboring source-face support sets have no common triangle at 10 mm spacing. Zero overlap is not evidence of disconnected anatomy or absent material correspondence.

At the foot-to-ball endpoint, Emma on both sides and Won and Daniel on the native right side have three positive radial intersections in narrow toe-web directions. A single radial Fourier section cannot represent those domains. The foot-body candidate therefore ends at normalized support station 0.9317675140376587, the last common observed pre-web station, and leaves the remainder open. No rejected ray is used to invent a replacement web surface.

[observeReferenceTerminals](../../../../test/src/executable/reference-experiments/observeReferenceTerminals.mts) plans at most one subsequent official source-terminal probe per extremity chart. Each selected query clears every closed contour by its actual reported `polylineUpperEstimateMm` plus the declared flattening tolerance. A positive closed candidate also requires one matching nonempty source-face lineage. All rejected planes and sibling queries remain in the result. The last qualified physical plane is preserved without rounding or extension; sibling chains on its same shell mark a branched-component probe. These seeds establish neither regional purity nor a skin cap.

## Hand rules

Independent runtime inputs use the existing hand length, palm length, thumb length and hand breadth fields. A separate actual hand-circumference input scales the distal radial law. Breadth changes root spacing; palm length changes root reach; hand minus palm length changes the four finger chains; thumb length changes its own chain. No girth-to-length fallback is supplied.

The calibration used geometric support proxies:

| Reference and native side | Palm proxy | Breadth proxy | Hand proxy | Thumb proxy | Achieved hand circumference |
| --- | --- | --- | --- | --- | --- |
| Jang l | 79.754694 | 56.744849 | 150.587400 | 70.270770 | 178.874416 |
| Jang r | 79.773186 | 56.737951 | 150.623855 | 70.295158 | 178.874416 |
| Emma l | 82.858153 | 62.133993 | 159.155533 | 69.142354 | 197.631016 |
| Emma r | 82.885721 | 62.149538 | 159.196761 | 69.159847 | 197.631016 |
| Won l | 81.671030 | 66.695112 | 159.641205 | 79.463932 | 237.356358 |
| Won r | 73.405947 | 64.891657 | 148.288249 | 71.113275 | 237.356358 |
| Daniel l | 87.845658 | 69.138248 | 168.746825 | 77.887738 | 234.193954 |
| Daniel r | 86.864872 | 69.654260 | 166.481980 | 76.008968 | 234.193954 |

All table values are millimetres. Palm proxy is the hand-to-middle-01 chord. Breadth proxy is the index-01-to-pinky-01 chord. Hand proxy is palm proxy plus middle-01-to-02 and middle-02-to-03 chord lengths. Thumb proxy sums thumb-01-to-02 and thumb-02-to-03 chord lengths. These are measured scalar geometric inputs for comparison, without claiming clinical skin endpoint correspondence. The table is acquisition evidence and is absent from the runtime generator.

Each actual side supplies its own support-chord dimensions and orthonormal palm frame. Constrained directional least squares identifies one common neutral frame; through-origin scalar fits identify intrinsic offsets, branch ratios and segment fractions. The middle root has the exact palm reach and its chain has the exact hand-minus-palm length. Thumb chain length is independently exact. The full index-to-pinky root chord is the breadth input: after determining axial and normal separation, a direct Pythagorean solve supplies its transverse separation. Infeasible independent dimensions refuse generation. No fitted ratio replaces a defining equality.

Source-only numeric evaluation put defining-dimension error at at most 2.85e-14 mm. The pooled root RMS changed from 2.643 to 2.494 mm; maximum root error changed from 7.430 to 7.669 mm. Exact dimension constraints do not establish individual root fidelity. The acquired hand circumference is reused for both sides because bilateral independent girth was not observed. Each digit still has only the second-to-third support surface interval. Every digit root, web, first-to-second interval and skin tip remains unsupported.

For each distal interval, all four references and both sides contribute radial observations at their actual physical stations. Circumferential Fourier channels through order four have quadratic longitudinal coefficients. A twice-reorthogonalized QR least-squares solve identifies the shared coefficients. Native-right phase reversal changes sine-channel signs. No individual coefficient row enters the generator.

Two principal endpoint curves and their exact quadratic longitudinal jets clamp HumanCurveFamily. Recursive midpoint subdivision restricts that same world polynomial. It does not introduce another principal layer or supply a missing feature.

The full-fit radial RMS errors are 1.09, 1.63, 1.71, 1.44 and 1.33 mm for index, middle, ring, pinky and thumb. Their maxima are 3.00, 5.68, 5.62, 5.59 and 4.29 mm. Increasing order beyond four did not remove the dominant residual. The model is a finite comparison candidate, not accepted reference fidelity.

A preliminary girth-only support fit missed finger support positions by as much as 28 mm. A height-and-girth fit retained substantial residuals and implied unobserved negative length responses to girth. Neither law was adopted. Independent existing hand dimensions remain separate.

## Foot-body rules

The runtime takes the existing foot length, foot breadth and ankle height fields, plus the caller-owned ankle support. For source comparison, partial geometric proxies were measured from the observed foot-body curves: forward extent, maximum transverse span and support height above the observed plantar extent. They are not full-foot clinical measurements or observed skin-tip distances.

| Reference and native side | Body extent proxy | Transverse proxy | Support-height proxy |
| --- | --- | --- | --- |
| Jang l | 176.162512 | 85.272124 | 74.583009 |
| Jang r | 176.159984 | 85.285442 | 74.628713 |
| Emma l | 186.538789 | 95.229262 | 78.569463 |
| Emma r | 186.464069 | 95.176387 | 78.363983 |
| Won l | 200.905032 | 108.483918 | 94.196757 |
| Won r | 218.911824 | 109.130151 | 95.083062 |
| Daniel l | 208.384949 | 109.237797 | 89.799424 |
| Daniel r | 216.394492 | 109.875947 | 91.266160 |

All values are millimetres. Their directional extents came from 32 evaluations per original Hermite span. Restricted cubic control-to-chord bounds over every retained fitting polygon were at most 0.026140 mm for foot and 0.021683 mm for hand. These bounds are separate from the selector's adaptive 0.01 mm policy. A directional max-minus-min from the foot polygons can differ by about 0.05228 mm under that geometric bound, before binary64 rounding and source fitting error.

The comparison adapter now computes the selected fitted cubics' directional extrema from all interior derivative roots, preserving each actual Hermite phase width. Those values can differ slightly from this earlier exploratory table. They remove polygon sampling error from the fitted-curve extent calculation without certifying the fitter's unknown continuous source surface. Source fit estimates and failed or ambiguous plane queries remain visible.

Cross-sectional area moments identify a skin-centre curve separately from the rig support axis. Five principal stations correspond to the proximal plane, first transverse breadth maximum, following breadth minimum, distal global breadth maximum and last common observed pre-web station. The normalized stations are 0, 0.12419648785485467, 0.33089108098401504, 0.862 and 0.9317675140376587. The distal maximum repairs a missing silhouette feature; the other four stations retain their original source interpretation.

The two centre channels and radial channels are linear in transverse breadth and support height at those stations. The new centre descriptor is an exact restriction of the original four-knot natural cubic, preserving its complete centre function. A natural cubic basis provides longitudinal interpolation. Radial Fourier order six improved both RMS and maximum error relative to order four; order eight reduced RMS but worsened maximum error and was rejected. The current order-six law has 130 common coefficients, identified by source least squares under defining width equalities and whole-domain width inequalities.

The distal feature's directional breadth equals the input breadth directly within binary64 coefficient residual. The source-derived complete-domain inequality solve also covers the admitted height/breadth interaction interval without a final scale correction. Forward body extent and support height still drive their corresponding common shape channels without guaranteeing that their generated geometric extrema equal those input proxies. Clinical full-foot correspondence remains unresolved.

The constrained radial fit retains 2.32598 mm RMS and 14.95197 mm maximum error, compared with the original unconstrained model's 2.35 and 15.30 mm. The two unchanged centre channels retain maxima 4.18 and 6.74 mm. These substantial residuals remain unresolved. Independent heel breadth, heel reach, pad heights, instep, arch and toe-supplement responses have not been identified. They are not silently connected to this candidate.

## Added terminal observations and hypothesis

The existing processor extended the following committed contexts with `terminal-regular-sections-v2` members. Existing terminal-v1 and other normal stages were reused without byte changes. Each new member and individual receipt was verified before numeric analysis.

| Reference | Extended observation context |
| --- | --- |
| Jang | `e77b22a998b10cbbe803e64aff18fc4be89e0402459318ae778d3180a07ff708` |
| Emma | `8b6607425940ce6bd17154db41effb3d1cdf56979bc74af940ac8baa4c5f2ac8` |
| Won | `9f1cd819ba87eebb4ba7701ec67ce6155ec4484c4a532318250d1b97581a293e` |
| Daniel | `fb5612fb69760ae545873f3c1ca91eb825934096e15f0fc49ede3b0d25795ab3` |

Forty digit publications contain 88 new regular sections. The plane intersection of the actual support-03 to observed source-maximum chord identified one containing positive shell in every section under a 0.01 mm adaptive cubic flattening bound. That chord is a geometric query, without establishing source material transport. Contour ordinal changes along the same digit; selecting ordinal zero would be incorrect.

Three candidate fits did not meet their source tolerance: two Won native-left thumb sections and one Daniel native-left thumb section. Four near-maximum sections had multiple positive intersections along some radial queries: Emma native-left pinky, Emma ring on both sides and Daniel native-left index. Each entire non-star section was excluded from radial identification. The remaining 81 sections supplied 5184 radial observations. The v2 section stage currently publishes lineage without adjacent source slabs, so between-plane source incidence and phase transport remain unqualified.

Source terminal classification retains 12 single-maximum digits and 28 digits with a saddle and two maxima. For the latter, total critical-coordinate span is 0.0394 to 2.0974 mm. The smaller peak's prominence above its saddle is 0.0310 to 0.3873 mm; 21 of 28 are within the acquisition policy's 0.2 mm fitting tolerance. This scalar comparison does not replace each loop's actual fit estimate or prove a whole-surface error bound. The PL source events remain saved. A smooth terminal hypothesis must be assessed separately for broad geometry, source-fit uncertainty and critical-event correspondence.

[HumanHandTerminal](../../src/extremities/HumanHandTerminal.ts) constructs a separately labelled single-pole hypothesis, returned through `HumanHandShafts.terminalCandidates`. Default shaft families remain unchanged. Its original shaft domain delegates to the exact existing family. Let `R` be the generated reach, `u=(s-s0)/(2R)`, and `z=2u-u²`. Its centre follows the endpoint's actual longitudinal derivative plus a pooled transverse quadratic correction in z. Radius is `(1-u) A(phase) exp[u(1+2R D(phase)/A(phase))+u²G(phase)+u³H(phase)]`, where A and D are the existing shaft endpoint radius and physical radial derivative. G and H are common order-four Fourier corrections from twice-reorthogonalized QR. This expression preserves the shaft endpoint jet, positive interior radii and a finite terminal jet. The common `fromFunction` authority retains the analytic expression and supplies both skin and construction without cubic reduction.

An unconstrained cubic-radius alternative became negative in four digit families and was rejected before implementation. The logarithmic alternative has these source-conditioned radial residuals, in millimetres:

| Digit | Full-fit RMS | Full-fit maximum | Person-held-out RMS | Person-held-out maximum |
| --- | --- | --- | --- | --- |
| Index | 1.0215 | 2.6821 | 1.4400 | 3.6532 |
| Middle | 1.2854 | 4.9468 | 1.5907 | 5.6864 |
| Ring | 1.3855 | 3.5259 | 1.8055 | 8.4835 |
| Pinky | 1.5627 | 7.5052 | 2.6716 | 12.5933 |
| Thumb | 1.2591 | 4.9034 | 1.5402 | 5.8079 |

These calculations use each source's actual support-to-maximum geometry. Runtime common supports, reach and neutral directions add their own errors. The result explicitly reports `sourceTopologyCorrespondenceQualified: false`; pinky holdout and independent parameter effects remain unqualified. This candidate is neither a copied source terminal nor evidence of reproducing every saved PL event.

## Whole-body comparison round 2

The execution owner completed 420 captures for each of four references, 1680 images total. Hand and foot inspection included whole front, back and side views, bilateral enlarged hand views, and foot back, side, oblique and high-front views. The current generated domains retain large palm, root, web, tip, heel, ankle and toe gaps.

Read-only geometric analysis of the actual generated meshes found strict interior noncoplanar shank-foot triangle crossings: Jang left/right 18/20 pairs, Emma 124/146, Won 60/100 and Daniel 0/0. These are triangle-pair counts, not connected collision counts. Binary64 edge-triangle predicates excluded coplanar and boundary-only contacts and do not certify all continuous intersections. The common ankle boundary owner must solve one source-derived boundary and restrict both adjacent domains; translating or cropping individual specimens does not address the cause.

The 98304 emitted hand and foot triangles had no zero areas or winding disagreement against their provided vertex normals. Neighboring index/middle bounds overlapped slightly, but their triangle bounds supplied no intersection candidates. These observations do not certify continuous self-intersection freedom or qualify missing joins.

Maximum generated foot-ring width exceeded its proxy input on all eight sides: Jang 1.1466/1.1415 mm, Emma 2.0076/2.0316 mm, Won 1.5646/1.5238 mm and Daniel 2.3535/2.2221 mm. Every generated maximum occurred at the final pre-web ring. The source width observations include a distal global maximum followed by narrowing; the current four-feature law omits a separate distal-maximum feature and does not constrain the defining breadth equality. A proposed common normalized five-feature width profile retained 4.86 mm RMS and 12.09 mm maximum width error and was not adopted. Further identification must preserve the measured width definition within the shape law rather than rescale the entire foot.

A source-only alternative retains order six and the same breadth/height physical basis while adding the observed distal maximum as the fifth principal feature at normalized station 0.862. Eight linear coefficient conditions impose U-extremum tangents, exact breadth and zero longitudinal breadth derivative at that feature. Nullspace QR fits the remaining 122 of 130 coefficients to 7680 source radial observations. Full-fit RMS is 2.3258 mm and maximum 14.9512 mm. On all eight observed dimensions, a 301-station by 1024-phase observation found maximum width equal to the input within 1.5e-14 mm. Person-held-out RMS remains 2.81 to 5.18 mm and maximum reaches 24.47 mm, so prediction remains unqualified.

The independent interaction probe exposed another failure: increasing height by 5 percent and decreasing breadth by 5 percent raised height/breadth ratio to 0.96716 and made the pre-web endpoint 1.0418 percent too wide. Feature equality alone is insufficient to constrain the complete domain. Fixing only that endpoint exposed another width violation around station 0.65. Both arose from the missing complete-domain inequality and were collected into the same constrained solve.

An active-set exchange method fits the source curves while requiring every fixed phase-pair width to stay within the breadth input across height/breadth ratios 0.7437636 to 0.9671565. The search oracle brackets angular stationary points and refines them by bisection, then locates longitudinal width maxima by grid search and golden-section refinement. Near-parallel active cuts made a Gram-based solve lose rank. Reorthogonalization in the QR factor's inverse-Hessian metric resolved that numerical cause without changing geometry or relaxing a bound. Three active inequalities remain, with positive multipliers. The final radial fit has 2.3259807 mm RMS and 14.9519742 mm maximum error; the numerical oracle's greatest width/breadth is 1+5.36e-11. This remains a numerical observation rather than an interval certificate of all extrema.

Every fixed phase/station coordinate is affine in height/breadth ratio, so valid width inequalities at both ratio endpoints imply their validity between the endpoints. The final admitted interval is 0.7437613374036736 to 0.9671564692141552. Its lower endpoint also covers the exact cubic-proxy comparison inputs' independent 5 percent breadth/height combinations; those differ slightly from the earlier polygon proxies. Rechecking this slightly extended endpoint retained maximum width/breadth 1. Direct longitudinal cubic extrema and an angular derivative-gap bound give a continuous positive radius lower bound of 0.06885794228225672 times breadth throughout that interval, in real arithmetic. The runtime now consumes this same constrained law and preserved centre function. Its family reports the ratio domain and physical radial lower bound explicitly and refuses inputs outside that ratio domain. Independent shape fidelity, additional absolute input ranges and held-out prediction remain unqualified.

The whole-domain model was also reidentified with one reference excluded from each solve. Each fold owns its QR factor, unconstrained optimum and active-set state explicitly. The observations remain conditioned on actual source centres, geometric inputs and the common feature locations; this is not an independently generated whole-foot prediction.

| Excluded reference | Radial RMS mm | Maximum mm | Constraint status |
| --- | --- | --- | --- |
| Jang | 2.77104 | 10.01929 | 49 exchanges; numerical width target met, including the final ratio extension |
| Emma | 4.64366 | 21.63510 | 45 exchanges on the earlier ratio interval; the final lower-endpoint extension retained relative width excess 2.147e-6 |
| Won | 2.96444 | 14.22344 | 48 exchanges; numerical width target met on the final ratio interval |
| Daniel | 4.79965 | 22.06366 | 56-exchange budget reached; relative width excess 5.956e-7 remained |

The width search target was 1e-10 relative to breadth. The two unresolved fold residuals correspond to about 0.000215 and 0.000060 mm at 100 mm breadth. They are distinct from the much larger source radial prediction errors and remain recorded rather than relabelled as fully converged models. Neither held-out failure changes the production full-cohort coefficient solve or its separately checked dimension domain. No fold establishes unseen morphological fidelity.

## Reproduction and prediction limits

Full-fit residuals describe curves used during identification. The original unconstrained leave-one-reference-out calculation conditions on the held-out reference's actual support frame, centres and scalar geometric inputs. Even under that condition, hand radial RMS spans 0.80 to 3.55 mm and reaches 6.68 mm maximum. The original four-station foot model spanned 2.80 to 5.20 mm RMS and reached 24.05 mm maximum. The current constrained foot folds and their numerical qualifications are reported above. None qualifies unseen morphology prediction.

The common hand quadratic and constrained foot natural-spline radial functions have positive continuous-domain lower bounds in real arithmetic. The current foot lower bound is 0.06885794228225672 times breadth throughout the declared ratio domain, using angular derivative bounds and direct longitudinal cubic extrema. The shared kernel supplies analytic longitudinal, phase and mixed derivatives, including Fss and Fphasephase, from the same complete world-Fourier authority. This supports validity of the individual radial families, without qualifying joins, contact between different families, normals, source fidelity or unsupported inputs.

Compiler, GPU rendering and complete visual correction rounds belong to the main execution owner. Human and Human-viewer tests were neither authored nor run for this work. Actual source/generated views, independent parameter interventions, interaction and return still gate acceptance. The next correction must address measurement correspondence, major-layer and centre rules, web topology and skin terminals together, rather than conceal them with more harmonics or mesh samples.
