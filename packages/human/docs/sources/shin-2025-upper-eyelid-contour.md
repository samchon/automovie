# Shin 2025, upper eyelid contour

Shin DY, Cho WK, Paik JS, Yang SW. "Upper eyelid contour measurement in an Asian population using Bézier curve analysis." *PLOS One* 20(6):e0316714, 2025. [Primary article](https://doi.org/10.1371/journal.pone.0316714). CC BY.

## Population and definition

80 Korean clinic patients, 40 women and 40 men, aged 20-39, photographed in primary gaze. A cubic Bézier curve describes the upper margin from medial palpebral commissure to lateral canthus. Coordinates use the pupil centre; photographs assume a 12 mm white-to-white corneal diameter for scale. Eye width is the horizontal endpoint separation. The exported Bézier controls are coefficients of the fitted curve.

## Reading and use

The full article body, PDF Tables 1-3, S3 Appendix text and its embedded plot were directly read. S3's actual four-row P1/P2 matrices use `bernsteinMatrix(3,t)`. Its five-point example prose is inconsistent. The [head eye source](../../src/generation/head/AutoMovieHumanHeadEyeParts.ts) owns those matrices. Their male/female assignment is inferred by matching the reported widths and peak heights. The endpoint-preserving map uses supplied 3D en-ex length and pupil-aligned margin separation as separate constraints. The paper measures upper-margin contours from photographs.

## Implemented source curve

HeadEyeParts reads the four controls, applies the chord/residual affine map and declares value plus normalized first/second jets at the endpoints and pupil. Its station is `L*sin(pi*t/2)^2` for the supplied 3D chord length L, so the engine's normalized angle parameter is the original Bezier t. Here station is a parameter scaled to millimetres. The common frame origin uses that parameter too. In real arithmetic, each quintic Hermite span equals the mapped cubic: their degree-at-most-five difference has a triple zero at each end. The equality applies to the declared source curve.

The photographic pupil (0,0) is mapped by that same affine function. With `sP=-u0/(u3-u0)`, endpoint-chord ordinate `ellP=(1-sP)*v0+sP*v3`, and upper-cubic ordinate `VP=v(tP)` at u(tP)=0, its world point is `A+sP*(B-A)-k*ellP*Up`. With the model's chosen ratio `r=5.2/3.5`, `k=H/((1+r)*VP)` and lower chord residual `ellP+r*VP` close the supplied separation H about that template pupil, provided VP is positive. The lower margin uses the model's parabolic residual. Shin's observations constrain the upper margin. The resulting parts expose the mapped margins and globe for inspection.
