# Joint trunk value and jet identification

The current law uses C2 minimum-jerk quintic shape fields, radial Fourier order ten and the actual degree-eight product of shape and native size. Five native size curves and admitted area-feature curves consume one analytic family. The [source record](trunk-curve-identification.md) defines correspondence, units and the public five-size output contract.

## Cause and representation

The second render round showed horizontal undulations in surface and construction. Its earlier residual bubble preserved incorrect principal first jets and forced native circumference to equal a different geometric surface perimeter. A zero-value, zero-first-jet correction could approach intermediate source positions only by turning back between those endpoints.

The subsequent C2 cubic model removed that conflict but retained dependent internal first jets. Third-round whole-body and torso-neighbor surface, overlay and construction comparisons were inspected for all four people. Broad undulations reduced; anterior waist turning, upper-trunk directional mass, back-groove loss and lower-hip centre bias remained. These findings prompted joint first-jet identification rather than extra layers or a higher residual bubble.

## Joint scalar fields

Let `x=(s-s_hip)/(s_chest-s_hip)`. There are 23 dimensionless channels: centre X/height and Z/height, then 21 radial Fourier coefficients divided by native size Q. Each channel has five values and five first derivatives with respect to x. Every unknown uses a common `[intercept, masculineFeminine slope]` pair, giving 460 shared shape coefficients rather than specimen-specific controls.

`HumanTrunkShapeSpline.build` derives shared second jets by minimizing `integral(f'''(x)^2) dx` for each scalar field with its values and first jets fixed. The interior variation requires continuous third derivative, and free endpoint second jets require zero third derivative at both ends. A five-variable linear solve with partial pivoting determines those second jets. The resulting piecewise quintic retains C2 continuity. This scalar minimum-jerk condition is not a claim that the full physical surface minimizes jerk.

The native-size field Q remains a natural C2 cubic over the same five physical controls. Its product with the quintic radial field has degree eight. Centres have degree five. Exact circumferential phase is radians; longitudinal station is mm. `HumanCurveFamily.fromFunction` preserves the actual function through recursive interval subdivision, including longitudinal second, angular second and longitudinal/angular-second mixed jets.

At an observed section the value design is `Q*S`, and the longitudinal first-jet design is `Q'*S+Q*S'`. Both remain linear in the shared unknown coefficients because Q is determined by that source's achieved native inputs. Centres use achieved height as their physical scale. Each person has equal total observation weight; residuals are normalized by achieved height. First-jet residuals carry a physical 30 mm loss length.

Longitudinal source jets are local quadratic estimates from neighboring original sections within 25 mm, with at least three observations at domain ends. They are not longitudinal derivatives supplied by Recovery. Original circumferential Hermite derivatives retain their actual mm/mm units and physical span widths. Native interval fractions map the source planes into the common gauge before longitudinal estimation.

## Matched source comparison

The following comparison recomputes the preceding cubic/K6 baseline and selected quintic/K10 law on the same 177 sections and 256 rays. Centre RMS averages X and Z. Radial error excludes centre error. First-jet error is mm/mm. Assembly station error is excluded.

| Source | Centre RMS cubic / quintic mm | Radial RMS cubic / quintic mm | Maximum radial cubic / quintic mm | Radial first-jet RMS cubic / quintic |
| --- | --- | --- | --- | --- |
| jang-nara | 2.024 / 2.015 | 2.688 / 2.283 | 10.323 / 7.984 | 0.06790 / 0.04895 |
| emma-watson | 2.320 / 2.292 | 2.753 / 2.480 | 10.363 / 8.943 | 0.06052 / 0.05543 |
| won-bin | 2.312 / 2.160 | 2.824 / 2.307 | 18.699 / 14.107 | 0.07253 / 0.06135 |
| daniel-radcliffe | 2.334 / 2.381 | 3.312 / 2.731 | 15.147 / 11.805 | 0.07698 / 0.06694 |

Radial RMS, maximum radial error and source first-jet RMS improve for all four. Daniel centre RMS worsens by about 0.047 mm. The largest remaining radial error is 14.107 mm. Aggregate improvement does not establish local feature fidelity or actual rendered acceptance.

Quintic/K6 reduces source first-jet error, but retains radial RMS 2.486/2.617/2.589/3.124 mm. Quintic/K10 gives 2.283/2.480/2.307/2.731 mm. K14 adds less than 0.033 mm radial RMS improvement per source and does not resolve missing anatomy, so it was not selected. Degree was compared with the same correspondence and physical loss, not used to hide a failed branch representation. Candidate choice on these four references is not independent validation.

Jang Nara's anterior waist-to-underbust slope at nine equal interval fractions changes from approximately `[-.128,-.027,.048,.094,.112,.100,.058,-.015,-.116]` to `[.058,.090,.067,.023,-.016,-.038,-.042,-.040,-.069]`. The estimated source waist derivative is about +.025, or +.068 by a neighboring-section secant. The incorrect initial sign and two reversals become a positive initial slope and one reversal. This numeric profile does not prove visible feature placement across the whole region.

Generated hip-to-chest volume divided by source volume in the same conditional station gauge is approximately 0.99867/1.00020/0.99761/1.00141 for the four sources. These are numerical station/ray integrations, not continuous bounds or whole-body volume comparisons. A near-unit integrated volume does not conceal the directional and local feature errors above.

## Conditional person holdouts

Each omitted person's size-plane height law and shared shape coefficients are refitted using only the other three. The held-out achieved controls are inputs. Their actual source planes still label interval correspondence for measurement. These results evaluate conditional identification, not independent anatomical correspondence, causal parameter response or prediction of an unobserved person.

| Omitted source | Centre RMS cubic / quintic mm | Radial RMS cubic / quintic mm | Maximum radial cubic / quintic mm | Radial first-jet RMS cubic / quintic |
| --- | --- | --- | --- | --- |
| jang-nara | 4.420 / 4.428 | 4.755 / 4.654 | 17.042 / 15.651 | 0.10001 / 0.09650 |
| emma-watson | 4.159 / 4.149 | 4.637 / 4.569 | 16.640 / 16.144 | 0.08419 / 0.09109 |
| won-bin | 4.721 / 4.668 | 4.912 / 4.850 | 26.835 / 23.103 | 0.10439 / 0.11239 |
| daniel-radcliffe | 4.262 / 4.344 | 4.856 / 4.675 | 20.802 / 19.567 | 0.10530 / 0.10985 |

Radial holdout error improves in all four, but first-jet holdouts worsen for Emma, Won and Daniel. Centre holdout error also worsens for Jang Nara and Daniel. These regressions remain model limitations. Independent girth, fat, muscularity, shape interactions and return experiments are not established by fitting or by these holdouts.

## Area-feature principals

Fourier orthogonality gives the generated section area directly from its physical radial coefficients:

```text
A(s) = pi * [c0(s)^2 + sum(k=1..10)(ak(s)^2+bk(s)^2)/2]
```

Each radial coefficient has degree eight per native size interval, so A has degree sixteen and its derivative degree fifteen. `areaExtrema` recursively partitions a derivative polynomial at roots of its own derivative and isolates admitted strict sign changes. At most 80 bisections refine a bracket. Rounded zero evaluations retain the computed address and crossing direction.

The additional area-feature sections are evaluations of the unchanged curve law at those stations. Their source-gauge mm brackets are recorded in `Gauge.volumeFeatures` and family limitations. Native size count stays five, and `generateHumanTrunkSections` filters the additional area curves from its public result. Skin and construction consume the internal feature curves through the same authority.

The numeric candidate calculation found one interior area minimum per achieved source, at source-gauge Y approximately 1090.34/1093.24/1174.27/1187.49 mm. These generated stations are distinct from original source Y and assembly world Y. Binary64 sign brackets are not interval-arithmetic certificates for coefficient uncertainty or shallow multiple-root completeness. They do not certify anatomical feature placement. The native waist/area-minimum distinction is retained rather than treating every size plane as an extremum.

## Skeleton transport and verification scope

The source gauge owns physical radius and its analytic jets. The assembly owns affine centre displacement D(s) and world station `y=a*s+b`, with a positive. Every mapped principal centre, including additional area features, must follow that same displacement. The evaluator uses

```text
s = (y-b)/a
P_world(y,phi) = P_source(s,phi) + D(s)
P_y = (P_s + D')/a
P_phi = P_source_phi
P_yy = P_source_ss/a^2
P_y_phi = P_source_s_phi/a
P_phi_phi = P_source_phi_phi
P_y_phi_phi = P_source_s_phi_phi/a
```

Affine displacement adds no second derivative. Radial values remain unchanged in mm; mapped interval width does not multiply their amplitude. Non-affine mappers need a separate jet contract and are rejected. Curve kernels, skeleton and shared branch assembly remain outside the regional law's ownership.

The evidence file `test/.shots/human-comparisons/trunk-round3-identification.json` binds the source members and identified implementation. Its numeric study and baseline image inspection do not certify later compiled or hardware-rendered acceptance. Main integration owns those receipts and complete affected inspections. Human and Human-viewer tests are not written, restored or run. Shoulder, collar, neck and pelvic connections remain outside this regional identification; the four-port upper-body generator is not complete.
