# Skin material

`AutoMovieHumanSkin` dresses the generated skin pieces with per-vertex albedo, relief weights and texture coordinates and supplies one `human.skin` material. Everything is computed from `params` and the generated geometry; no image or person table is stored.

## Albedo

[Donner and Jensen](../sources/donner-jensen-2006-spectral-skin.md) describe skin using hemoglobin, melanin amount/type and surface oiliness. `AutoMovieHumanSkinPigment` converts `pigmentation.{melanin, eumelaninShare, haemoglobin}` to linear RGB with their absorption spectra, a two-layer Kubelka-Munk approximation instead of the multipole, a carotenoid band at 465 nm that their model omits, and CIE 1931 integration under an equal-energy illuminant. Without the carotenoid band, fair skin reflects blue almost as strongly as green and renders mauve. The band's amplitude and shape, the 3 percent stratum corneum reflectance and the approximation itself are conventions; no measured skin spectrum was compared. An omitted `pigmentation` uses melanin 0.008, eumelanin share 0.6 and haemoglobin 0.01, a fair convention giving linear albedo about (0.72, 0.53, 0.44).

`AutoMovieHumanSkinTone` multiplies melanin and haemoglobin per vertex and stores the result as vertex colours over a white base colour, so the tint follows the joined surface without separate materials or charts. The regions are functions of the generated body:

| Region | Located from | Multipliers |
| --- | --- | --- |
| Lips | Midline profile extrema below the eyes: labrale superius to a border below labrale inferius; half-width 0.39 interpupillary distances (IPD) | melanin 0.9, haemoglobin 6 |
| Cheeks | Gaussian of 0.32 IPD below and outside each eye | haemoglobin up to 3 |
| Nose tip | Gaussian of 0.2 IPD about pronasale | haemoglobin up to 2 |
| Periorbital | Ring at 1.3 globe radii | melanin 1.15, haemoglobin 1.25 |
| Ears | Field about each ear's centroid, on the ear chains and the head around them | haemoglobin up to 1.6 |
| Palms, soles | Palmar direction from hand, thumb and finger centroids; downward skin in the lowest tenth of the foot | melanin 0.35 |
| Knuckles, fingertips, toe tips | Finger and toe chain ends | haemoglobin up to 1.6 to 1.8 |
| Knees, elbows | 0.285 statures, front of the leg; 0.55 along the arm chain, back of the arm | melanin 1.2 to 1.25, haemoglobin 1.4 to 1.5 |

Solid value noise in rest millimetres, seeded by `appearance.skin.seed`, mottles melanin by at most 4.5 percent and haemoglobin by at most 14 percent. Its octaves (40 and 22 mm for melanin, 30 and 16 mm for haemoglobin) are the same on every piece. Every multiplier and placement proportion is an appearance convention. A face whose profile lacks the lip extrema gets no lip tint.

## Reflection and translucency

The material is a dielectric of index 1.4 (normal-incidence reflectance about 0.028, after [d'Eon and Luebke](../sources/deon-luebke-2007-skin-rendering.md)), specular intensity `min(1, 0.7 + 0.6 oiliness)` and perceptual roughness `0.55 - 0.15 oiliness`, multiplied per texel by the tile's roughness image. A sheen lobe of a quarter of the person's base albedo at roughness 0.6 adds the grazing glow of vellus hair. These follow the oiliness parameter's direction without calibration.

The viewer's subsurface approximation uses the weighted deviations of d'Eon and Luebke's skin profile, 1.18, 0.26 and 0.16 mm; it changes direct diffuse light only and tints sharp geometric creases red. A warm emission of 12, 7.5 and 5 percent of the person's base albedo stands in for the light skin returns from under its surface in shadow. It is a convention, not light transport, and it scales with the tone so darker skin keeps darker shadows.

Under the viewer's reference lights a lit forehead renders at about 0.56 of its albedo (neutral grey 0.8 renders at sRGB 179), so albedo near the model's ceiling is needed for a fair appearance. This was measured on rendered pixels; the colour chain (linear vertex colours, sRGB-decoded colour image, sRGB output without tone mapping) has no double conversion.

## Micro-relief

`AutoMovieHumanSkinImage` generates a 40 mm periodic tile: sparse irregular pores and a faint undulation, as a normal map, a base-colour grain and a roughness image. Per-vertex relief weights scale the normal map (0.25 on the vermilion, 0.55 on palms and soles, 0.6 on eyelids, up to 1.4 on the nose and cheeks); the material scale is `0.4 + 0.9 wrinkles`. [Procedural skin fields](procedural-skin-fields.md) owns its units and limits, and [UV layout](uv-layout.md) the coordinates it is sampled through.

## Marks

`appearance.skin.{freckles, moles, acne}` are drawn by `AutoMovieHumanSkinMarks` into one RGB multiplier overlay over the packed chart layout ([UV layout](uv-layout.md)), only when requested; f1 requests none. Marks are sampled per triangle from area, density and a regional weight, keyed by the skin seed and the quantized rest centroid. Freckles cluster under a 45 mm solid noise and, on the face, concentrate in a band across the nose and cheeks located from the eyes; moles are spread uniformly to the requested count; acne sits on the face and, less, the upper chest and back. Lips, palms, soles, eyelids and strongly distorted chart triangles take none. Each mark is a circle on the surface drawn through its triangle's local chart map, and its colour is the ratio of a darker chromophore set to the person's albedo, so it scales with the tone. `IAutoMovieHumanMoles` (`count`, `diameterMm`, `contrast`) was added beside the existing freckle and acne structures. Weights, colours and shapes are conventions.

## Nails

The loft has no nail geometry, and digit vertices (3 to 5 mm apart) cannot outline a nail in vertex colours, so `AutoMovieHumanNail` adds one plate part per digit, `human.nail.<side>.<digit>`, 0.45 mm above the distal dorsal skin. The dorsal direction is away from the palm for fingers, between that and the radial side for the thumb, and up for toes; the plate spans 1.6 (fingers) or 1.25 (toes) digit radii, ends 0.35 to 0.45 radii short of the tip, and is fitted as a smooth surface over ray hits on the digit's own triangles. A shared 256 square alpha-masked image draws the outline, pink bed, lunula, cuticle, onychodermal line and cream free edge, and a normal map rounds the edge; the material is glossy (roughness 0.3, clearcoat 0.2) and its colour follows the square root of the person's albedo. Proportions and colours are conventions.

## Not yet consumed

Veins, wrinkle lines, regional roughness, areolae and genital pigmentation are not modelled. Marks are soft at close range because the mark image is about 0.8 mm per pixel.
