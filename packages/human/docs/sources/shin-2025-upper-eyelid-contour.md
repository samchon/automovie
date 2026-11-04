# Shin 2025, upper eyelid contour

Shin DY, Cho WK, Paik JS, Yang SW. "Upper eyelid contour measurement in an Asian population using Bézier curve analysis." *PLOS One* 20(6):e0316714, 2025. [Primary article](https://doi.org/10.1371/journal.pone.0316714). CC BY.

## Population and definition

80 Korean clinic patients, 40 women and 40 men, aged 20-39, photographed in primary gaze. A cubic Bézier curve describes the upper margin from medial palpebral commissure to lateral canthus. Coordinates use the pupil centre; photographs assume a 12 mm white-to-white corneal diameter for scale. Eye width is the horizontal endpoint separation. This differs from an unoccluded en-ex distance.

## Reading and use

The full article body, PDF Tables 1-3, S3 Appendix text and its embedded plot were directly read. S3's actual four-row P1/P2 matrices use `bernsteinMatrix(3,t)`; its five-point example prose is inconsistent. The [shared outline record](../../src/generation/AutoMovieHumanReferenceOutlines.ts) retains those matrices once. Their male/female assignment is inferred by matching the reported widths and peak heights. No lower-margin law, tissue thickness or globe clearance follows. The [campaign audit](../work/law-definition-audit.md) derives an endpoint-preserving mapping; supplied 3D length and pupil-height measurements remain separate constraints.
