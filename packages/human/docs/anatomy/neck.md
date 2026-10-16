# Neck

Covers the neck part of #2798: circumference and length, sternocleidomastoid and trapezius form, the laryngeal prominence, and the joins to the trunk and head through #2795.

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
- The part boundary is a simple cervical tube. The complete jaw floor and cervical turn stay inside the head. SCM and trapezius cross that cut, so their relief must follow shared skeleton definitions rather than either part's mesh.
- The SCM belly and the triangles between SCM, clavicle and trapezius are the main neck relief at rest; the laryngeal prominence and the suprasternal notch are the midline features.

## Open questions

- Neck length norms by age and sex were not found in the sources read.
- Soft-tissue thickness over the thyroid cartilage, and the prominence height by age (it develops at puberty), have no source here.
- Child neck circumference: percentile papers for Mexican and Iranian children exist open (PMC8157592, PMC5750675) but were not read.
- SCM cross-section and thickness for the relief amplitude have no source here.

## Jaw-floor and neck ownership correction

The mandibular outline is an internal unpinned head guide, not the part cut.
The former boundary joined a broad mandibular floor directly to a steep neck
wall; the assembled surface showed a flat disc, hard anterior rim and posterior
rim below the ear. A distant C2 head spine can also change the tangent of the
last neck section even when that section's radius is constant. The correction
uses an independent two-station straight collar on each side of one shared cut.
Both owners translate the same raw ring controls by equal, opposite support
distances. The construction network names both sources and their common nodes.

The cut is a geometric partition separate from the circumference-fit plane.
Its lower bound clears both the complete conventional column ellipse from the
oblique base plane and the shared base control hull along the neck axis. Cut
and supports divide the remaining interval below the unchanged fit plane into
four equal subintervals. This does not add anatomical dimensions or age branches.
The head owns the fit plane and gives it a free named row above the pinned
collar. The lower-neck spine therefore never passes beyond its endpoint to fit
an out-of-part plane.

The anterior cervical guide is a construction guide: on the anterior column
generator, it bisects the interval between the fit plane and that generator's
intersection with the mandibular plane through menton and both gonia. It is
not a hyoid or cervicomental landmark. Projecting menton's world height onto the
column failed in birth and infant skeletons; a different world-height assumption
or an age clamp would hide that contract error. No neck coefficients, skeleton
landmarks or body measurements were fitted to remove the failure.

Cervicale height remains the existing geometric circumference proxy. Its
correspondence to the adult source's infrathyroid tape site is unresolved;
matching this proxy's perimeter is not clinical validation. The converter's
range, actual joined surface intersections, rest and posed continuity, all four
lean gates, every original view and raking-light close-ups must be judged
separately. Neither a finite construction nor a zero boundary gap establishes
an appearance pass.

The birth-male diagnostic remains open: with the same complete C7 plane, the
canonical European body's whole envelope misses its neck circumference by
50.985191 mm. The first cut/fit-separated candidate misses by 20.592722 mm,
while the whole cut-plane hull is 216.746798497 mm in both. A neck-region-only
fit made its own residual zero but worsened the complete C7 envelope to
61.675655 mm; that fitting change was rejected. Source-region selection does
not replace the complete envelope, other section components, or strict 3D
intersection checks. The C7 plane meets the mandibular overhang; deciding the
physical infant neck tape correspondence requires its own evidence. These
figures are diagnostic failures, not clinical or form passes.

The shared collar now consumes the engine's B-spline section from raw shared
controls, rather than interpolating their already stencilled samples. This is
source-curve equality; the actual joined skin and its tangents still require
measurement and images. The lower-neck graph names its six anatomical rows
using the existing engine nodes, curves and Coons patches, without importing
the head's network adapter. Shared neck-plane measurement belongs to junction
and converts millimetres to engine metres explicitly at that boundary.

The cut also affects placeholder skinning. Head and neck now consume the same
candidate bones and a continuous upper-chest weight share derived from the
shared neck-to-head bone interval. The share is one at the neck joint and zero
at the head joint, with zero endpoint slope; inverse-distance weights remain
conventional placeholders. An anatomical part label no longer changes that
neck field when the construction boundary moves. Finite pose/return checks do
not establish collision-free motion. The current viewer's construction output
is rest-only, so posed construction alignment remains a separate limitation.
