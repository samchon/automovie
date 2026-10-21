# Trunk curve identification

`HumanTrunkLaw` generates a hip-to-chest curve authority from five native size inputs and common shape coefficients. `HumanTrunkRules` stores those coefficients. `HumanTrunkShapeSpline` derives the quintic shape fields and their area features. `HumanTrunkCurves` transports the same function into the assembly frame for skin, analytic normals and construction. The [joint identification record](trunk-interval-identification.md) gives the fit, conditional holdouts and derivative contract.

`generateHumanTrunkSections` retains exactly five native size curves: hip, highHip, waist, underbust and chest. The internal family also exposes admitted cross-sectional area extrema of the same function. These additional principal curves do not add fitting knots or shape coefficients. Native measurement planes are control addresses, not a complete list of anatomical silhouette or volume features.

## Source authority

The retained inputs are `test/.shots/human-observations/<id>/<epoch>/sections.trunk-transverse.json` and the matching `body-courses.json`. The identification evidence, original member hashes and candidate comparison are in `test/.shots/human-comparisons/trunk-round3-identification.json`.

| Source | Observation epoch | Selected sections |
| --- | --- | --- |
| jang-nara | e77b22a998b10cbbe803e64aff18fc4be89e0402459318ae778d3180a07ff708 | 42 |
| emma-watson | 8b6607425940ce6bd17154db41effb3d1cdf56979bc74af940ac8baa4c5f2ac8 | 41 |
| won-bin | 9f1cd819ba87eebb4ba7701ec67ce6155ec4484c4a532318250d1b97581a293e | 47 |
| daniel-radcliffe | fb5612fb69760ae545873f3c1ca91eb825934096e15f0fc49ede3b0d25795ab3 | 47 |

Registration is `[10*y,10*z,-10*x]` mm: forward +X, up +Y, signed lateral Z. At each observed height the closed component of greatest XZ area is the central trunk in these four sources. Other components remain in the original artifact. This selection establishes no general branch or component rule.

All 177 selected curves are cubic Hermite observations with their original physical phase widths in mm and derivatives in mm/mm. Evaluation used at least six subdivisions per span and at most 0.5 mm of physical phase. The measured centre is the XZ envelope midpoint. Each of 256 half-step angular rays has one positive intersection in every selected hip-to-chest section. The source results retain unresolved fitting-tolerance qualifications; publication of a curve does not certify exact recovery.

The generated radial Fourier order ten is a common approximation identified from those observations. It is not an exact Hermite conversion. Original coefficients, phase widths, directions, other curves and their diagnostics remain unchanged. Higher-order and rational source conversion is not established by this cubic-only cohort.

## Physical size and common shape

Five native girths form a natural C2 cubic scalar field `Q(s)`. Twenty-one dimensionless radial Fourier channels form a C2 quintic field `S(s,phi;m)`, where `m` is the achieved masculineFeminine coordinate. Two further quintic channels describe centre X/height and Z/height. Each channel has five values and five independent first jets under a common `[1,m]` law. Shared second jets minimize integrated squared third derivative of that scalar shape field.

```text
R(s,phi) = Q(s) * S(s,phi;m)
centre(s) = [height*fX(s),s,height*fZ(s)]
P(s,phi) = centre(s) + R(s,phi) * [cos(phi),0,sin(phi)]
```

The radial product has actual longitudinal degree eight. Multiplication by cosine and sine gives world angular degree eleven. The function and its analytic first, second and mixed jets retain these degrees through `HumanCurveFamily.fromFunction` and recursive restriction. Finer sampling creates no new shape law.

At native size plane i, `Q=q_i`. Its generated geometric perimeter is therefore

```text
L_i = q_i * integral_0^(2*pi) sqrt(S_i(phi)^2 + dS_i/dphi(phi)^2) dphi
```

Changing q_i scales that principal radial curve linearly while the other four native size values remain unchanged. This is the implemented mathematical scale relation. Independent physiological responses, interactions and return to the starting values remain separate experimental qualifications.

## Native scalar, observed course and geometric perimeter

The native girth scalar, observed native course polygon and recovered horizontal surface perimeter are distinct observables. Over the original four sources, course polygon length exceeds the native scalar by 5.778 to 11.097 mm, and skin perimeter exceeds the polygon by 0.873 to 27.909 mm. Skin perimeter exceeds the native scalar by about 8 to 37 mm. The law learns a native-scalar-to-shape relation; it imposes no curve-length equality or clinical measurement conversion. `test/.shots/human-analysis/trunk-course-axis-identification-v2.json` retains the separate metrics and all original point/skin-root witnesses.

These original Hermite perimeter/native-control ranges come from 16-point Gauss-Legendre quadrature per original span. They are numerical quadrature results, not certified bounds. They describe the source, not the current generated perimeter.

| Native size plane | Original section perimeter/native control |
| --- | --- |
| hip | 1.02635 to 1.03642 |
| highHip | 1.01638 to 1.02109 |
| waist | 1.01781 to 1.01889 |
| underbust | 1.01125 to 1.01955 |
| chest | 1.02043 to 1.03873 |

Current generated perimeter error has not been recomputed in this record. Radial fit, geometric perimeter and visible feature fidelity require separate comparisons.

## Stations, features and supported scope

Native plane Y/height follows a common `[1,m]` law. Intermediate observations correspond by measured fraction between those planes before longitudinal jets are estimated. No average of hip and waist supplies highHip. The source gauge and assembly transport remain separate from local curve-shape error.

Native waist is not generally the minimum-area plane. Won Bin and Daniel source area minima lie about 26 mm below their native waist planes. The generated family isolates admitted interior area minima and maxima from its own retained polynomial and adds their actual curves to construction. The [interval record](trunk-interval-identification.md#area-feature-principals) states the finite numerical bounds and qualifications.

Observed shape is approximately -0.992 to 0.926 and achieved height approximately 1692 to 1862 mm. Four correlated references qualify conditional identification. Fat, muscularity, bust-span, interscye, shoulder-to-apex and neck-to-waist have no independently identified trunk response in this law. Extrapolation is unqualified. Evaluation rejects a nonpositive radial field or native-girth interpolant; that pointwise rejection is not a complete-domain positivity certificate.

The regional domain ends at chest. Existing full Recovery curves show multiple positive ray intersections at axillary branch mergers, and shoulder before-port A is itself non-star. Collar sections also contain actual open curves in `reports.open`; empty closed-loop collections are not absent observations. A single radial continuation cannot represent that topology. The upper-body study requires a jointly identified chest, two-arm and collar four-port authority; it has not completed that generator. `test/.shots/human-analysis/trunk-upperbody-authority-v1.json` records the rejected extensions and remaining scope. Shoulder, collar, neck and pelvic assembly remain with the common boundary owner.

The pending feature-vector study separately identifies the posterior C0-to-G1 event from all 177 original profiles and a positive posterior-recess generating-node constraint. `test/.shots/human-analysis/trunk-feature-pending-handoff-v3.md` states its full-fit, holdout and source-definition limits. These pending files do not replace the maintained function described here, qualify an entire native course as a skin boundary or complete the buttock/upper-body generator.
