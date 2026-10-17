# Neck

Covers neck circumference and length, sternocleidomastoid and trapezius form, the laryngeal prominence, and the joins to the trunk and head.

## Circumference

| Measure (mm) | Male | Female | Population, protocol | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Neck circumference | 366.1 (19.4) | 321.6 (24.9) | Chinese workers 18-66, tape | measured | `../sources/du-2008-chinese-workers.md` |
| Neck circumference | 397.6 baseline | -50.1 at equal stature and weight | US workers, regression; baseline Caucasian man 18-29, 78.7 kg, 1762 mm | population-fitted | `../sources/zhuang-2010-niosh-facial.md` |
| Age effect | +5.6 at 30-44, +9.0 at 45+ | | same regression | population-fitted | Zhuang 2010 |

The neck is the most sexually dimorphic head-and-neck girth: 50 mm at equal body size, against 5 mm for head circumference. Body mass drives it too (NIOSH: weight and height are covariates with significant coefficients). ANSUR and NHANES neck girths belong to the body research files and should be preferred for adults when the body identity already uses them.

## Muscles that shape the surface

From Gray 1918 (`../sources/gray-1918.md`, head and neck section). Grade: established anatomical account.

- Sternocleidomastoid: sternal head a rounded tendon from the front of the manubrium, running up, laterally and back; clavicular head flat and almost vertical from the medial third of the clavicle, up to 7.5 cm broad; a triangular gap between the heads at their origins; the heads join below mid-neck and insert on the lateral mastoid from apex to superior border and on the lateral half of the superior nuchal line. It is thick and narrow in the middle, broad and thin at the ends.
- Its anterior border bounds the anterior triangle (midline, mandible, SCM; apex at the suprasternal notch); its posterior border bounds the posterior triangle (SCM, middle third of clavicle, trapezius).
- One SCM turns the face to the opposite side and tilts the head to the same shoulder, so its relief under rotation is asymmetric: the side opposite the face direction stands out.
- Trapezius upper fibres descend from the occiput and ligamentum nuchae to the lateral third of the clavicle and give the neck-shoulder line; its attachments are tabulated in the trunk part of `../sources/gray-1918.md`.
- Platysma: a thin sheet from the fascia over upper pectoralis and deltoid, crossing the clavicle obliquely up and medially to the mandible and the skin about the mouth; in action it wrinkles the neck skin obliquely and draws the lower lip and mouth corners down (AU21 neck tightener, AU20 with risorius).
- The external jugular vein runs beneath the platysma from the mandibular angle to the clavicle.

## Laryngeal prominence

| Measure | Male | Female | Population | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Internal angle of the thyroid laminae | 74.4 (8.2) degrees | 92.4 (6.6) degrees | 40 male and 10 female Indian cadavers | measured | `../sources/rawal-2014-thyroid-cartilage.md` |
| Lamina height | 26.6 mm | 24.2 mm | same | measured | Rawal 2014 |
| Lamina width | 37.0 mm | 31.9 mm | same | measured | Rawal 2014 |

Derived rule: with laminae of width w meeting at internal angle θ, the anterior notch projects w·cos(θ/2) in front of the line joining the posterior lamina borders: about 29.5 mm for the male means and 22.1 mm for the female means. The visible prominence is that projection minus the soft tissue over it; there is no source here for the soft-tissue thickness.

## Form rules for the generator

- Inputs: neck circumference, neck length (C7 to the occipital base, from the body skeleton), and sex-dependent laminae angle; derive the SCM path from its two bony ends (mastoid and manubrium/clavicle) so head rotation moves it correctly.
- The neck cross-section is a simple tube at mid-neck, which makes mid-neck the cut for the head-trunk junction (human skill rule); SCM and trapezius cross that cut, so their relief must be a function of both parts' skeletons, not of one part's mesh.
- The SCM belly and the triangles between SCM, clavicle and trapezius are the main neck relief at rest; the laryngeal prominence and the suprasternal notch are the midline features.

## Open questions

- Neck length norms by age and sex were not found in the sources read.
- Soft-tissue thickness over the thyroid cartilage, and the prominence height by age (it develops at puberty), have no source here.
- Child neck circumference: percentile papers for Mexican and Iranian children exist open (PMC8157592, PMC5750675) but were not read.
- SCM cross-section and thickness for the relief amplitude have no source here.
