# Hair, brows and lashes

Values retain their cited population, posture and measurement protocol. Derived ratios and modeling suggestions are research constraints, not current generator defaults or clinical identity.

Covers hairline and scalp coverage, scalp hair, brows and lashes, as values and direction rules. Card construction and shading are in [hair-cards](../techniques/hair-cards.md).

## Hairline

Contour classes ([zhang-2026-female-hairline](../sources/zhang-2026-female-hairline.md), after Suzan et al.; conventional classification, preference measured in Chinese raters):

| Type | Geometry |
| --- | --- |
| Round | Smooth concave contour, no distinct frontotemporal recession |
| M-shaped | Marked frontotemporal recession, lateral frontal line raised, frontotemporal angle usually under 90 degrees |
| Rectangular | Horizontal frontal margin, mild recession, frontotemporal angle 90 degrees or more |
| Bell-shaped | Normal forehead width, midline point about 2 cm higher than average |
| Triangular | Nearly straight line descending from the central forehead to the temples, vellus hairs along the edge |

Preferred proportions for women: hair-bearing height over trichion-glabella forehead height 0.505, width ratio 0.373.

Forehead height tr-g: Kenyan men 61.4 mm, women 55.4; South African women 60.2 mm; tr-n Kenyan 72.2 and 67.5 mm, Nigerian 69.1 mm ([virdi-2019-kenyan-face](../sources/virdi-2019-kenyan-face.md), [wilson-2023-south-african-women](../sources/wilson-2023-south-african-women.md), [adekunle-2022-nigerian-3d](../sources/adekunle-2022-nigerian-3d.md)). Virdi also relays North American white tr-n values, which do not supply the same tr-g protocol.

## Scalp coverage

| Site | Density (hairs/cm²) | Diameter (μm) | Population | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Frontal | 154.3 (12.8) | 81.1 (6.9) | 239 Thai adults, trichoscopy | measured | [leerunyakul-2020-thai-hair](../sources/leerunyakul-2020-thai-hair.md) |
| Vertex | 162.9 (15.7) | 80.8 (5.9) | same | measured | same |
| Temporoparietal | 133.7 (14.6) | 80.1 (4.5) | same | measured | same |
| Occipital | 160.2 (15.3) | 80.3 (5.1) | same | measured | same |
| Frontal / vertex / occipital, Caucasian | 230 / 226 / 214 | | quoted trichoscopy study | measured (relayed) | same |
| Same, African | 160 / 149 / 148 | | quoted | measured (relayed) | same |
| Same, Hispanic | 174 / 178 / 169 | | quoted | measured (relayed) | same |

Density does not differ by sex in the Thai sample and falls about 6 percent from the 20s to the 60s while diameter holds near 80 μm. Temporoparietal density is about 18 percent lower than the vertex. Physical hair density and diameter constrain coverage; they do not directly specify a card count because a card represents a bundle.

## Curl

Closed choice of eight L'Oréal types I to VIII defined from curve diameter, curl index, number of waves and number of twists; I to IV separated by curve diameter, V to VIII (curly and coily) also by curl index, waves and twists ([callender-2026-curl-classification](../sources/callender-2026-curl-classification.md)). The class thresholds were not in the text read. A helix radius and pitch are possible guide controls, but the class label alone does not determine them or require a helical representation.

## Brows

Brow position and travel need separate feature correspondence. Form and direction ([rajput-2021-eyebrow-restoration](../sources/rajput-2021-eyebrow-restoration.md), conventional; [gray-1918](../sources/gray-1918.md)):

| Part | Length share | Position | Hair direction |
| --- | --- | --- | --- |
| Head | 10 to 15 percent (0.6 to 0.8 cm) | below the orbital margin | one or two staggered rows, vertical (pointing up) |
| Body | about 60 percent (2.5 to 3 cm) | arches up onto the orbital margin | upper-border hairs down and outward, lower-border hairs up and outward, crossing at the axis; middle rows along the axis |
| Tail | 20 to 25 percent (1.2 to 1.7 cm) | above the margin, beyond the lateral canthus | horizontal and outward, sloping down |

All brow hairs lie nearly flush with the skin ("directed obliquely on the surface", Gray); density falls toward the tail. Lengths: men 5 to 6 cm by 1 to 1.5 cm, women 4.5 to 5 cm; measured lower-margin arc 69.5 (men) and 61.4 mm (women) Caucasian, 68.5 and 62.0 Chinese ([gao-2025-periocular-chinese-caucasian](../sources/gao-2025-periocular-chinese-caucasian.md)). Peak over the lateral limbus ([park-2017-eyebrow-ageing](../sources/park-2017-eyebrow-ageing.md)).

Direction field for the card generator (derived from the table): at a point with normalized position u along the brow (0 at the head, 1 at the tail) and v across it (-1 lower border, +1 upper), the hair direction angle from the brow axis is about 90 degrees at u < 0.12, then converges as θ(v) ≈ -k·v (upper hairs point down toward the axis, lower hairs up) in the body, and falls to a few degrees below the axis in the tail; hairs bend into the skin tangent plane.

## Lashes

From [aumond-2018-eyelash](../sources/aumond-2018-eyelash.md) (measured, relayed) and Gray 1918: upper lid 90 to 160 lashes in five to six rows, lower 75 to 80 in three to four rows; length rarely over 12 mm; every lash curves from the bulb; upper lashes curve upward and lower downward so they do not interlace on closing. Lash strips root along the anterior lid margin, follow the lid in blinks (AU45) and closure (AU43), and must not intersect each other or the opposite lid.

## Open questions

- European-ancestry tr-g and East Asian forehead height (trichion position) by sex and age; male pattern recession by age (Norwood stages) was not researched in open sources.
- Scalp density data come from one Thai study with secondary comparison values; a primary multi-ethnic source is needed.
- L'Oréal curl class thresholds.
- Lash length distribution by lid position (centre longer than ends) and lift angles by ancestry; the Thibaut study cited by Aumond was not read.
- Brow hair length and density per square centimetre.
- Hair colour (eumelanin and pheomelanin in hair) and greying with age have no source here.
