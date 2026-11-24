# Arm

## Shoulder and bind

The authored acromial height and biacromial breadth place the acromion. ESTIMATE: use the original neck-side support's sagittal coordinate for the unmeasured acromial AP coordinate. This gives a frontal chord from the neck to the acromion. `AutoMovieHumanShoulderJoint` transfers Campbell et al. 2009's generic GH offset of `[12, -49, 6]` physical millimetres into this frame, scaled once. The original paper's acromial receiver and marker triad use a different measuring frame. [Campbell et al. 2009](https://doi.org/10.1016/j.jbiomech.2009.03.039)

The actual downward GH projection `d` and the elbow-to-radiale projection `e = 0.0432 AR` give a rigid humeral length `H = AR - d - e`. De Leva's Table 2 and the segment lengths in Table 4 give the approximate radiale offset and the 1.5 mm stylion-to-wrist offset. The radius runs `e + RS + 1.5 mm` along its own bind direction. ESTIMATE: the humerus follows a 45° coronal A-pose, halfway between a hanging arm and horizontal abduction. The extended forearm carries a further 15.07° on female statistics or 10.97° on male statistics, the mean angles in the studied students. The hand's longitudinal axis follows that forearm. [De Leva 1996](../sources/de-leva-1996.md), [Paraskevas et al. 2004](https://pubmed.ncbi.nlm.nih.gov/14648036/)

## Skin sites

| Site | Station and section |
| --- | --- |
| First free deltoid row | ESTIMATE: halfway from GH to the biceps tape, continuing the biceps girth. Public bideltoid separately constrains the outer support on the proximal domain in the arms-down frame. |
| Biceps | `AR/2 - d` below GH. Radiale substitutes for the distinct olecranon when locating the midpoint. |
| Elbow | At its centre, using the elbow tape. |
| Forearm | At 0.2 of radiale–stylion, distal of radiale. The AP depth and lateral breadth own the extents. ESTIMATE: carry the relaxed maximum tape to this proximal belly station. |
| Wrist | At stylion. The caliper extents and the styloid tape constrain the same section. |
| Palm | At MCP III. The person's breadth and palm tape set the section. MCP packing provides the breadth-centre offset. |

When a tape is the sole measurement, a circle of radius `C / (2 pi)` supplies its supports. Forearm and wrist calipers use the person's values. ESTIMATE: the public defaults transfer Perry et al. 2021's supination ellipses from the study's flexed circumference to the person's relaxed tape. The conic fullness solves the tape while holding both available calipers. [Perry et al. 2021](https://www.frontiersin.org/journals/robotics-and-ai/articles/10.3389/frobt.2021.576783/full), [Heinz et al. 2003](../sources/heinz-2003-body-dimensions.md)

At the deltoid and biceps, the bideltoid solve supplies lateral support in the arms-down measuring frame. ESTIMATE: with the lateral span fixed, use the depth of a centred ellipse carrying the tape because these sites have no independent AP caliper. The native conic closes the tape on this section box. Any positive-area section needs a circumference greater than twice its breadth. [ANSUR II bideltoid protocol](../sources/ansur-ii-handbook-foot-neck.md#bideltoid-source-constraint-campaign-3062)

Omitted hand length, palm length and breadth use sex-specific fits on stature and metacarpal circumference from the public ANSUR II working databases (1,986 women and 4,082 men). Omitted thumb length uses Greiner's mean thumb-length to hand-length ratio by sex. [ANSUR II](../sources/ansur-ii.md), [Greiner 1991](../sources/greiner-1991-hand.md)
