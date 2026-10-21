# Branch guide observation audit

The completed additive cohort has 183 members per source. This audit reads existing official Recovery JSON and verifies the 64 limb-guide members against both their complete snapshot commitments and individual receipts. Each guide's native-body source hash agrees with its preserved original acquisition. No acquisition, compiler, renderer or Human test was run for this audit.

## Bound snapshots

The parent paths are `test/.shots/human-observations/<source>/<epoch>/`; the epochs are listed in [Branch source correspondence](branch-source-correspondence.md). Each snapshot is named `complete.<sha256>.json`, and its actual byte digest agrees with that suffix.

| Source | Complete snapshot SHA-256 |
| --- | --- |
| jang-nara | `e3d8e7ca39c9a3e1f39feba28639e414b226ecc2be3647748a0b8140b6a73295` |
| emma-watson | `59eaad9c043d16085006caa53fbbf94a09f6f59c9eb930f17b5eaecb5014da2b` |
| won-bin | `452ee386bce0c9c840dcee268126086af055a4fb15f1208f5bb0a7e7cd969738` |
| daniel-radcliffe | `bc19fbfd24800b89dfac507a805d877cc6590de2ee84f84743c9d912ce412cce` |

## Complete limb-guide inventory

Each source has forward and across observations for left and right upper arm, forearm, thigh and shank: 16 collections and no missing member. Every collection reports `partial`; this status alone does not distinguish a published open curve, an unresolved finite-polyline tolerance or a completely failed contour.

| Source | Published closed | Published open | Published tolerance met | Published tolerance unresolved | Failed contours |
| --- | ---: | ---: | ---: | ---: | ---: |
| jang-nara | 12 | 11 | 8 | 15 | 3 |
| emma-watson | 12 | 8 | 4 | 16 | 6 |
| won-bin | 12 | 8 | 0 | 20 | 6 |
| daniel-radcliffe | 12 | 8 | 0 | 20 | 6 |
| Total | 48 | 35 | 12 | 71 | 21 |

All eight forward collections per source publish one open curve. Both forearm across collections publish two closed curves. Each lower-limb across collection retains two published closed components; its main contour is either published open or fails. The published open and closed curves remain authoritative observations, including every actual Hermite span and physical phase width. An unresolved tolerance is a reported limitation and does not authorize regenerating a published curve.

All 21 failed contours report exactly `Fitted span budget exhausted`, with original `maxSpans=256`. There are no other recorded contour-fit failure reasons in these 64 collections.

| Source | Across guide | Failed contour | Exact emitted-face count F | 3F span bound | Existing published curves on plane |
| --- | --- | ---: | ---: | ---: | ---: |
| jang-nara | upper-arm-l | 0 | 1247 | 3741 | 0 |
| jang-nara | upper-arm-r | 0 | 1247 | 3741 | 0 |
| jang-nara | thigh-r | 0 | 938 | 2814 | 2 |
| emma-watson | upper-arm-l | 0 | 1239 | 3717 | 0 |
| emma-watson | upper-arm-r | 0 | 1239 | 3717 | 0 |
| emma-watson | thigh-l | 0 | 934 | 2802 | 2 |
| emma-watson | thigh-r | 0 | 936 | 2808 | 2 |
| emma-watson | shank-l | 0 | 906 | 2718 | 2 |
| emma-watson | shank-r | 0 | 908 | 2724 | 2 |
| won-bin | upper-arm-l | 0 | 1248 | 3744 | 0 |
| won-bin | upper-arm-r | 0 | 1249 | 3747 | 0 |
| won-bin | thigh-l | 0 | 1089 | 3267 | 2 |
| won-bin | thigh-r | 0 | 1090 | 3270 | 2 |
| won-bin | shank-l | 0 | 931 | 2793 | 2 |
| won-bin | shank-r | 0 | 931 | 2793 | 2 |
| daniel-radcliffe | upper-arm-l | 0 | 1252 | 3756 | 0 |
| daniel-radcliffe | upper-arm-r | 0 | 1252 | 3756 | 0 |
| daniel-radcliffe | thigh-l | 0 | 1089 | 3267 | 2 |
| daniel-radcliffe | thigh-r | 0 | 1093 | 3279 | 2 |
| daniel-radcliffe | shank-l | 0 | 938 | 2814 | 2 |
| daniel-radcliffe | shank-r | 0 | 936 | 2808 | 2 |

## Finite retry bound and preservation

`cutExact.prepare` emits at most one segment from a noncoplanar triangle and at most three boundary edges from a coplanar triangle. Its maximal-chain walker visits every emitted graph edge once. For F distinct exact contributing faces, a contour therefore has at most 3F edges, at most 3F+1 open observations or 3F closed observations. Canonical aliases and coincident-edge cancellation can reduce this population; they do not increase it.

`RecoveryBezierFit.fit` partitions a fixed positive integer observation-edge range. Each accepted span and each outstanding work job owns at least one original observation edge. A split partitions one job's range into two nonempty ranges. Consequently `accepted spans + outstanding jobs <= observation edges <= 3F` throughout the fit. A `maxSpans` of 3F removes this particular budget failure without determining the adaptive span count or replacing the fitted curve with one span per source edge. Other numerical failures and unresolved terminal-span tolerance remain possible.

The additive planner `test/src/executable/reference-experiments/planReferenceFailedGuideRetries.mts` uses this bound. Eight wholly unpublished shoulder planes can be observed through the existing official program as new versioned members, while their failed v1 members remain unchanged. Thirteen lower-limb planes already publish two curves each. The current whole-plane observer would recompute those normal authorities, so their retry requests are blocked until an official contour-resume operation can retain them without fitting again. Broad endpoint-star face sets cannot substitute for exact emitted-face provenance in either route.

## Source seam shape findings

For all four sources and both shoulders, the planned limb across plane intersects each of the actual three pants ports twice. Its v1 source curve fit fails, so these six port intersections do not establish three observed seam paths or transverse jets. The forward plane misses the body-side after port and cannot replace the missing complete seam network.

The published female forward curves give two before-to-arm-after collar arcs per shoulder. Using each original physical phase interval and its endpoint derivatives, a single endpoint-constrained Hermite reproduces the Jang arcs within 0.0678 mm and the Emma arcs within floating-point noise. This is a local source-shape observation below the 0.2 mm fit policy, not permission to reduce or overwrite the original full Hermite curves, and not a law for the inner branch.

The separately observed native-body neck across plane provides all three interport arc pairs in Emma, Won and Daniel. Jang instead has four before-port intersections and no arm-after to body-after arc in this plane, so this guide cannot define one common three-seam chart across the cohort. Source hashes and ordinal spaces must remain native-body specific; head curve face IDs are unrelated addresses.

| Source | Inner arc physical phase width, left/right mm | Inner sag along shoulder scalar, left/right mm | Maximum single endpoint-Hermite residual, left/right mm |
| --- | --- | --- | --- |
| emma-watson | 17.4556 / 17.6235 | 7.0218 / 7.0716 | 3.5302 / 3.6075 |
| won-bin | 19.5756 / 20.1924 | 7.9814 / 8.5212 | 4.4895 / 5.0157 |
| daniel-radcliffe | 15.4414 / 13.1319 | 4.6346 / 4.0164 | 1.7139 / 1.5475 |

These sampled residuals use all existing source Hermite coefficients and their actual widths. The inner arcs contain two to eight source spans and cannot be replaced by the endpoint cubic within the existing fit scale. A common residual law must identify their interior shape while preserving shared endpoint values and first jets. These partial neck-plane observations do not establish the unobserved limb-across paths or cohort-wide material phase.

For a fixed geometric phase map, one suitable identification space is `E(t)=H(t)+L*t²*(1-t)²*sum(c_k(q)*P_k(2t-1))`, where H owns exact common endpoint values and jets, L has explicit millimetre units and q contains supported shared shape features. Original source knots partition the integral fit. On each source interval the residual is cubic, so Gauss-Legendre integration of sufficient polynomial order retains the full source coefficient authority. Person weighting, rank, withheld whole arcs, normal/frame limitations and actual-render validation remain separate from the in-sample residual.

## First pooled inner-arc identification

A read-only fit used the six observed neck-plane inner arcs from Emma, Won and Daniel. Jang has no such observed inner arc and was not included as an invented fourth case. Each arc is oriented arm-to-body. Its intrinsic first axis is the endpoint chord; its second axis lies in the actual guide plane and points toward decreasing shoulder scalar. The scale `L=(|E_t(0)|+|E_t(1)|)/2` uses the actual endpoint jets in millimetres and can be computed from boundary authority without a specimen length table. Source physical phase maps affinely to t with its full signed Jacobian.

The fit subtracts the exact endpoint-jet Hermite H, projects the residual into that intrinsic frame and divides by L. Thirteen Gauss-Legendre points per original clipped Hermite interval exactly integrate the polynomial products for tested residual orders through six. Each person's two arcs have equal combined weight. An order-two intercept-only residual law has three coefficients per intrinsic channel, rank three and design condition number 6.714. It gives the following physical errors; maxima use 1025 parameter samples and are not continuous bounds.

| Source | In-sample RMS mm | Sampled maximum mm | RMS with that entire person omitted mm |
| --- | ---: | ---: | ---: |
| emma-watson | 0.3463 | 1.1859 | 0.4464 |
| won-bin | 0.6644 | 2.2050 | 0.9304 |
| daniel-radcliffe | 0.6168 | 1.2628 | 0.9028 |

The shared residual reduces the endpoint-cubic failure but does not meet the 0.2 mm acquisition fit scale. Increasing residual order to six leaves a 2.0448 mm sampled maximum in Won, so polynomial order alone does not resolve the correspondence or missing geometric conditions. Adding an affine achieved masculineFeminine coefficient at order two gives a full-rank six-column design, but omitting Emma raises her predicted RMS to 14.6203 mm. The observed semantic coordinates are Emma 0.747277, Won -0.992278 and Daniel -0.845964: the omitted Emma case extrapolates far outside the two men's narrow training interval. That conditional phenotype law is rejected for current prediction; its smaller pooled fitting error does not support an independent parameter response or establish the cause of the remaining geometric variation.

The unresolved variation must be investigated through physical plane/phase correspondence and observable endpoint-jet or critical-shape conditions. This experiment supplies no runtime specimen coefficients, no replacement source curve, no qualified four-person branch law and no generated-skin or normal validation.

A second identification round replaced the phenotype condition with `q=|Q-P|/L`, the dimensionless endpoint chord relative to the actual endpoint-jet scale. The boundary owner can evaluate this geometric condition from its own common positions and jets after establishing the same affine physical phase convention. The condition is invariant under rigid placement and uniform spatial scale, but arbitrary nonlinear retiming changes the endpoint jets and therefore q; the physical Jacobian cannot be omitted. An affine `[1,q]` coefficient law at residual order two has rank six and condition number 32.601. Both in-sample and omitted-person RMS improve for all three observed people.

| Source | Geometric-condition in-sample RMS mm | Geometric-condition omitted-person RMS mm |
| --- | ---: | ---: |
| emma-watson | 0.2663 | 0.3058 |
| won-bin | 0.3240 | 0.4481 |
| daniel-radcliffe | 0.1677 | 0.6288 |

Adding a second condition from normalized endpoint opening tangents increases the design condition number to 319.391 and omitted-person RMS to 1.0368, 1.1175 and 1.0512 mm, respectively. That additional condition is rejected. The single chord/jet ratio provides measured support for a common geometric shape condition, while the remaining physical errors and missing fourth inner path prevent accepting it as the completed branch law. The corrected four-person limb-across observations must decide whether this intrinsic residual transfers to the intended common branch chart.
