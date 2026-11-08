# Shin 2025, upper eyelid contour

Shin DY, Cho WK, Paik JS, Yang SW. "Upper eyelid contour measurement in an Asian population using Bézier curve analysis." *PLOS One* 20(6):e0316714, 2025. [Primary article](https://doi.org/10.1371/journal.pone.0316714). CC BY.

## Population and definition

80 Korean clinic patients, 40 women and 40 men, aged 20-39, photographed in primary gaze. A cubic Bézier curve describes the upper margin from medial palpebral commissure to lateral canthus. Coordinates use the pupil centre; photographs assume a 12 mm white-to-white corneal diameter for scale. Eye width is the horizontal endpoint separation. This differs from an unoccluded en-ex distance. Grade: published curve coefficients, not directly measured control-point landmarks.

## Reading and use

The full article body, PDF Tables 1-3, S3 Appendix text and its embedded plot were directly read. S3's actual four-row P1/P2 matrices use `bernsteinMatrix(3,t)`; its five-point example prose is inconsistent. The [shared outline record](../../src/generation/AutoMovieHumanReferenceOutlines.ts) retains those matrices once. Their male/female assignment is inferred by matching the reported widths and peak heights. No lower-margin law, tissue thickness or globe clearance follows. The [campaign audit](../work/law-definition-audit.md) derives an endpoint-preserving mapping; supplied 3D en-ex length and pupil-aligned margin separation remain separate constraints, not an absolute pupil-elevation input.

## Source consumer checkpoint, campaign #3062

The current HeadEyeParts imports the four controls, applies the chord/residual affine map and declares value plus normalized first/second jets at the endpoints and pupil. Its station is `L*sin(pi*t/2)^2` for the supplied 3D chord length L, so the engine's normalized angle parameter is the original Bezier t. This millimetre station is neither world lateral position nor arc length. The common frame origin uses that parameter too. In real arithmetic, each quintic Hermite span equals the mapped cubic: their degree-at-most-five difference has a triple zero at each end. This is a source-polynomial statement, not a final-loft or anatomical placement proof.

The photographic pupil (0,0) is mapped by that same affine function. With `sP=-u0/(u3-u0)`, endpoint-chord ordinate `ellP=(1-sP)*v0+sP*v3`, and upper-cubic ordinate `VP=v(tP)` at u(tP)=0, its world point is `A+sP*(B-A)-k*ellP*Up`. For the separate model choice r=5.2/3.5, `k=H/((1+r)*VP)` and lower chord residual `ellP+r*VP` close the supplied separation H about that template pupil, provided VP is positive. The lower residual is a parameter-parabola, not a lower-lid observation in Shin. Neither the cross-study ratio nor this affine placement is an individual 3D pupil-seat law.

The completed shared f1-only round 57353 (program start 05:03:14, 41/47 overall) passed both head questions in 764/547 ms. Direct primary Bernstein evaluation at nine points on each of the two spans observed maximum upper-source errors 2.2782e-13/2.2793e-13 mm, left/right, with the unchanged 1e-8 mm numerical bound; both independent photo-origin errors were zero. Its 28 raw section-concavity diagnostics, 14 per side, remain unresolved. The earlier 4691 snapshot used a unit-length station and a chord-pupil convention, passed both head questions and reported 820 diagnostics (411/409); that dated result is preserved rather than relabelled as the new source. The count change does not repair the conic cause. AP allowance remains a separate natural support curve, and four eye studies remain outside the production tree. The later C7 candidate was not executed by 57353. No PNG/reference acceptance or uniform binary64 error bound follows from the sampled numerical result.
