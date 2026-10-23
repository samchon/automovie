# Eyes and lids

An eye opening is calibrated as the line where the lids touch the eye, not as the edge of the skin. The reference head lists that contact line for each lid as a landmark curve (`crv_eyelid_upper_<s>`, `crv_eyelid_lower_<s>`); `fitEyeCalibration.ts` orders their vertices from the lateral to the medial canthus, joins the two lids into one closed margin through a centripetal Catmull-Rom spline, and stores a Fourier series of order 24 on arc length (largest deviation 0.23 mm, at the canthi). The earlier margin, taken from the mouths of notches in horizontal head sections, lay up to 4 mm off the contact line and wandered in depth, which tore the lid edge.

The globe is calibrated from the same line. The lids rest on the eye, so the biometric globe of `AutoMovieHumanEyeGlobe` (24 mm, a 7.64 mm cornea, Bekerman 2014 and Chen 2016) is moved by least squares until the contact vertices within 0.9 of its radius from its axis lie on its anterior surface; for f1 the residual is 0.39 and 0.33 mm RMS. A sphere fitted to the reference's eye loops instead put the left globe 2 mm too deep and 1 mm too low, so the lids hung in front of it and the canthi showed the head behind. The region stores the sphere matching that globe's anterior surface, centred behind it by the seat shift, so `AutoMovieHumanEyeGlobe.seat` puts the globe back exactly where it was fitted.

## Lid band

`AutoMovieHumanEyelid` evaluates the margin at 360 phases and derives, by fixed rules, the posterior edge (on the globe surface plus 0.03 mm wherever the globe lies behind it, the calibrated point beyond its silhouette), the anterior edge (1.0 mm in front for the upper lid, 0.8 mm for the lower, 0.25 mm outward, thinning to 30 percent toward the canthi), the canthi and lid membership.

The lofted skin reproduces the reference's inward roll at the margin only coarsely, so `AutoMovieHumanBodyApertures` cuts the skin out to a band 2.5 mm outside the contact line and rebuilds the lid there: per phase, a column of the anterior lid surface (a cubic Hermite from the skin's own depth and slope at the band edge, read from the kept skin, kept at least 0.5 mm in front of the globe), the anterior edge rounded by a quadratic Bezier of 0.4 times the margin depth, the margin face back to the posterior edge, and a tuck 1.5 mm under the lid just inside the globe's surface. The skin's cut loop, wherever its triangles crossed the outline, is joined to the first row by a zipper ordered by phase; the loop is an Eulerian circuit of the open edges, so a boundary that touches itself stays one loop.

## Wet tissue

`AutoMovieHumanConjunctiva` fills the medial canthus beyond the globe's silhouette with the caruncle, a low pink mound fading to the paler plica on the globe. The lateral canthus shows the lid's own tuck toward the globe's silhouette. A concave tear meniscus 0.32 mm high on the lower lid and 0.18 mm on the upper runs along the posterior edge, a faint glossy blended film whose look is its highlight.

## Globe shading

The renderer casts no shadows, so `AutoMovieHumanEyeball.occlusion` darkens sclera and iris vertex colours with the depth inside the opening: the upper lid by up to 55 percent over about 1.6 mm, the lower by 30 percent over 0.7 mm. The sclera is a warm white, sRGB (246, 242, 236), reddening slightly toward the canthi, with faint vessels that fade well before the limbus; the pupil is 4 mm. The cornea stays a glossy blended shell without refraction.

## Limits

- The lid band rule constants are anatomical conventions, not fits; the upper lid crease and fold (`crv_eyecrease`, `crv_eyefold`) are not modelled.
- The globe is not scaled with stature while the lids are; a stature far from the calibration's separates them.
- The lofted skin around the band lies 1 to 1.8 mm behind the reference below the lower lid and over the upper lid fold; the band hides that only within its width.
