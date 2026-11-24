# Nails

Build the plate, the bed and the folds from the digit's positioned original skin and its distal joint frame. A separately shaded plate may use the same boundary geometry as the digit. The attachment must remain closed and keep the plate's exposed free edge.

## Proportions

Jung et al. measured the width between the two lateral grooves and normalized it by the breadth at the distal joint. They measured length from the proximal fold's groove to the fingertip and the transverse radius at the crown. Use the female width and crown ratios by anatomical ray, with a width-to-length aspect of 0.91. [Jung et al. 2015, Table 1](https://doi.org/10.5999/aps.2015.42.6.753).

Szymoniak-Lipska et al. measured plate thickness by sex and hand. The female mean of the four measured fingers is approximately 0.38 mm. The thumb thickness estimate transfers the digit I to II ratio from Bellinato et al. The hallux uses the left and right means for women in López Ripado et al. The lesser toes use the published fingernail mean as an ESTIMATE. [Szymoniak-Lipska et al. 2021](https://www.frontiersin.org/journals/medicine/articles/10.3389/fmed.2021.686470/full), [López Ripado et al. 2024](https://doi.org/10.1002/ca.24145).

Toe aspect estimates adapt the clinical finger value using the public HM08 nail groups. The distal bed's transverse arc supplies the crown where the clinical crown measurement is unavailable. The ratio of the plate crown to distal bone height and the ratio to the full skin height have different reference surfaces. Applying the former to the skin is an ESTIMATE. Refer to the rule basis for the transfer and the stock asset. [Rule basis](rule-basis.md#nails).

## Skin and attachment

The plate law reads the original distal skin with its completed tip pole and uses the physical map from the digit's authored station. The original gives the nail's facing, dorsal support, local longitudinal scale and the surface the shared attachment must meet. The plate rises from its bed by the thickness of that same digit's construction. The proximal and lateral folds meet that original wall. The free edge finishes above the physical tip where the person's original wall supports a closed junction.

The plate thickness supplies the transverse angular uncertainty `atan2(thickness / 2, halfWidth)`. The half-thickness share estimates the height uncertainty of the sampled skin under the nail. Combine the leveled turn and physical frame spread. Solve roll, shift and slope with Broyden's rank-one secant update. The estimated amplification limit of four bounds the normalized first-order correction. A pair of analytic ellipse sections checks the fitted objective independently. [Broyden 1965](https://www.ams.org/journals/mcom/1965-19-092/S0025-5718-1965-0198670-6/S0025-5718-1965-0198670-6.pdf).

## Public topology evidence

MPFB2 assigns nail materials to vertex groups on a shared indexed skin. In the inspected stock asset, the finger groups select 92 complete quads and the toe groups select 200. Each selected boundary edge has two body-face incidences. Anny reads the same upstream OBJ's body indices and supplies a second implementation of the indexed source contract. [MPFB2 nail groups](https://github.com/makehumancommunity/mpfb2/blob/9de0707fdc88438d7c53a1a2ac7937d9221e2431/src/mpfb/entities/socketobject/_extra_vertex_groups.py#L9-L14), [Anny loader](https://github.com/naver/anny/blob/8f35dc2df1c4062fd2fae86734f9705de50c0c2b/src/anny/models/full_model.py#L418-L438).

## Acceptance

Read dorsal and lateral views at the same framing for both hands and feet, two views each across twenty sites. Judge the proximal and lateral groove directions, the bed transition, the free edge and the neighboring digit walls. Measure clipping from the realized plate and bed strips with a 0.01 mm ceiling, then check the joined surface, winding, contact and component topology. The standalone construction reports clipping before whole-figure acceptance.
