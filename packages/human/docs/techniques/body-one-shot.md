# Every body part in one shot

Body form comes from the person's courses, section measurements and feature landmarks. [Centres and courses](centres-and-courses.md) owns placement and length. The connection operator owns each shared boundary. [Joint logic](joint-logic.md)

## Published measures and what each solves

Use the measurement definition to select its site and plane. A girth constrains the full section there. Breadth and depth constrain the reaches in their respective directions.

| Region | Measure and use |
| --- | --- |
| Hip and waist | Buttock and waist girths constrain fullness at their own levels. Breadth and depth constrain the lateral and sagittal reaches. |
| Chest | Under-bust girth constrains the chest wall. Bust girth runs over the two mounds on that wall. |
| Shoulder and neck | Biacromial breadth locates the shoulder ends. Cervicale and suprasternale help place the neck base. Neck girth follows its defined cut. |
| Arm and hand | Upper-arm, forearm and wrist girths constrain their respective sections. Elbow breadth and hand breadth use their anatomical landmarks. |
| Leg and foot | Thigh, knee, calf and ankle measurements constrain their own sections. Ball girth uses the forefoot's ball section. |
| Digits | Distal joint breadth constrains the shaft at the joint. Pad position and shape determine the end dome. |

[ANSUR II](../sources/ansur-ii.md) · [ANSUR II hand, foot and neck definitions](../sources/ansur-ii-handbook-foot-neck.md) · [ISO 7250-1](../sources/iso-7250-1-2017.md) · [ISO 8559-1](../sources/iso-8559-1-2017.md)

## The section law

Place the chart on the section's centre line. When a bony breadth is available, its contribution follows the skeleton and tissue contributes the remaining reach. Form the four reaches from the breadth and depth and the chosen split about the centre. Keep the basis of that split with the field.

A rational quadratic conic with middle weight `w` has shoulder share `rho = w / (1 + w)`. The quarter circle has `rho = sqrt(2) - 1`. `AutoMovieHumanNativeGirthClosure` solves the taut tape constraint over the admissible fullness interval. `AutoMovieHumanNativeSiteSection` and `AutoMovieHumanNativeSiteReaches` hold the section and reach operations. Between measurement sites, interpolate the reaches and fullness with continuous derivatives. Sánchez-Reyes, 2011, *Conic segments in Bézier form*.

### The trunk

Torso tapes lie in level planes. Keep broad body volume in the wall, including the buttocks and the chest wall under the breast footprints. Use the median and off-axis guides for continuous furrows and crests. Give a local feature an explicit centre in its segment frame.

Where a feature line ends, narrow its width and reduce depth and turn together. The defining conic's end tangents must keep meeting in the admissible direction. A groove with width proportional to `q` and depth proportional to `q^2` approaches the wall as `q` tends to zero. Raymer's conic lofting describes growing or shrinking a bulge with fixed end tangents.

### Neck and limbs

Use a neck course and the ring at each end to keep the neck's section and girth independent of the adjacent torso and head. The mastoid, manubrium and medial clavicle define the sternocleidomastoid's course. Published muscle thickness informs its local relief. [Gray's anatomy](../sources/gray-1918.md) · Pirri et al., 2021, *Frontiers in Rehabilitation Sciences*.

In a limb, the section fields own its broad wall. A local prominence uses a feature reference at its bone or tendon. The same distinction applies to the patella and its adjacent hollows, the malleoli, the wrist tendons and the pads of the hand. Bone and tendon relief follows skeletal landmarks. Pad prominence can follow tissue.

### Feature templates

`AutoMovieHumanFeatureTemplate` places a feature in its segment frame from a centre, two directions, two half extents, height and class. A superellipse exponent describes the footprint. A quintic edge ramp or `(1 - r^2)^3` bump meets its wall with continuous second derivatives. `between` places a ridge between anatomical landmarks. Several features can occupy one region with their own footprints.

### Knots and tips

Place knots at joint and measurement sites, form extrema and points where a feature changes its course. Preserve the stations through interpolation so each supplied measure stays at its site.

A digit's pad is a dome in the distal bone's frame. Its base publishes the last full section and the wall's leaving derivative. Its pole is the distal skin datum. The cap approaches the pole with a tangent square to the course. Off-axis fullness can move the cap's centre through the chart. The nail bed and plate read the same distal surface. [Nails](nails.md) · Shirato et al., 2017, *Journal of Physical Therapy Science*, 29:1914 · Wu, Welcome and Dong, 2006, fingertip model.

### The breast

Bust point breadth places each apex laterally. Bust height and under-bust height specify the mound's vertical position and lower extent. The chest wall comes from its own under-bust measurement. The bust tape over the mounds constrains their projection.

Qiao's relation, as reported by Kayar et al., gives volume as `V = (pi / 3) MP^2 (MR + LR + IR - MP)`, where `MP` is projection and `MR`, `LR` and `IR` are medial, lateral and inferior radii. `AutoMovieHumanMoundLaw` uses a base-radius exponent of 0.17 as an estimate from the slope of log chest-wall diameter against log volume by cup group. Zheng, Yu and Fan also relate width to under-bust size and projection to cup. Kayar et al., 2011, *Breast Cancer*, 5:43 · [Breast CT study](https://pmc.ncbi.nlm.nih.gov/articles/PMC3081868/) · Zheng, Yu and Fan, 2010, *3DBODY*.

### Root height and mirrored parts

Set the lowest point of the person's completed soles on the floor. Read the pelvis-relative height of that point through the person's chain and neutral placement. Keep the gluteal and torso landmarks on the same root frame. [de Leva's segment definitions](../sources/de-leva-1996.md)

When the design uses bilateral symmetry, reflect the authored side through the median plane and reverse face winding. Verify reflected placement, loop orientation and the median seam directly.

## Further sources

- [ANSUR II trunk ratios](../sources/ansur-ii-trunk-ratios.md), [ISO 8559-1 landmarks](../sources/iso-8559-1-2017-landmarks.md) and [trunk anatomy](../anatomy/trunk.md) cover torso measurement sites.
- Thelwell et al., 2020, *Scientific Reports*, 10:12125, reports measured torso shape modes.
- Hoogervorst et al., 2018, and Muhamed et al., 2017, report clavicle and patella imaging. Meng et al., 2010, and Mello et al., 2006, report extensor and Achilles tendon measurements.
- Huang et al., 2017, *PLOS ONE*, and Petrova and Baytar, 2023, give breast measurement context.
- Barger and Adams, 1993, NASA TM-4406, describes blending a fillet along a length. Raymer's *Aircraft Design* describes conics whose defining points follow smooth lines along a loft.
