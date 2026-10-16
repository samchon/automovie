# Trunk

The trunk part holds the torso, the pelvis, the shoulder girdle with the deltoid and armpit, and the hip and groin with the gluteal region and upper thigh, because muscles cross the shoulder, armpit, hip and groin (human skill). It is cut at the neck, at mid upper arm and at mid thigh, where cross-sections are simple tubes. Genitals and nipples are not modeled.

## Stations

Cross-section levels as fractions of stature, ANSUR II means (`../sources/ansur-ii.md`, measured).

| Station | Women | Men | Definition |
| --- | --- | --- | --- |
| Cervicale | 0.857 | 0.864 | Most prominent C7 spine |
| Acromion | 0.820 | 0.820 | Lateral acromial border |
| Suprasternale | 0.817 | 0.819 | Jugular notch |
| Axilla (anterior scye) | 0.761 | 0.757 | Apex of the anterior axillary fold |
| Chest point | 0.720 | 0.735 | Most anterior point of the chest (bust in women) |
| Tenth rib | 0.649 | 0.638 | Lowest point of the rib cage |
| Iliac crest top (iliocristale) | 0.611 | 0.605 | Highest palpable crest point |
| Omphalion (navel) | 0.602 | 0.602 | Centre of the navel |
| Trochanterion | 0.519 | 0.513 | Top of the greater trochanter |
| Buttock point | 0.512 | 0.506 | Maximum posterior protrusion of the buttock |
| Crotch | 0.480 | 0.482 | Lower edge of the pubic bone |
| Mid-thigh cut | about 0.40 | about 0.40 | Midway between hip centre and knee centre (derived from `skeleton.md`) |

The natural waist (narrowest) lies between the tenth rib and the iliac crest; ANSUR II measures the waist at the navel instead, which is level with the crest top on average.

## Cross-section sizes

ANSUR II means in mm (women / men), with depth-to-breadth aspect:

| Level | Circumference | Breadth | Depth | Depth / breadth |
| --- | --- | --- | --- | --- |
| Chest point | 946.9 / 1058.7 | 269.3 / 289.4 | 247.4 / 253.8 | 0.918 / 0.877 |
| Navel waist | 860.9 / 940.6 | 299.9 / 326.4 | 213.0 / 237.8 | 0.709 / 0.727 |
| Buttock | 1021.2 / 1019.5 | hip breadth 353.8 / 345.7 | 232.9 / 245.8 | 0.658 / 0.710 |
| Thigh at gluteal furrow | 616.1 / 625.1 | | | |
| Shoulder (deltoid points, around both arms) | 1028.2 / 1178.6 | bideltoid 450.3 / 510.4 | | |

Regressions on stature, BMI and age for the supplied girths, breadths and depths are in `../sources/ansur-ii.md`; their adiposity reading is in `body-composition.md`. The level profile uses bounded superellipse fits: buttock and waist sections retain their breadth and depth while solving squareness for perimeter; chest and underbust sections retain depth and squareness while solving breadth for perimeter. Derived levels interpolate form coefficients. These profile targets do not establish that the displayed displaced skin meets every measurement; the joined limit surface explicitly holds only chest and waist girths and the shared junction rings.

## Superficial muscles and overlap order

Attachments from Gray 1918 (`../sources/gray-1918.md`, conventional). Listed from the most superficial layer down, as the surface shows them.

| Region | Superficial | Under it, still shaping the surface |
| --- | --- | --- |
| Front of chest | Pectoralis major (clavicle, sternum, true rib cartilages, oblique aponeurosis to the greater tubercle crest; tendon twisted, lower fibres inserted higher) | Pectoralis minor (fills below the anterior axillary fold when the arm is raised); ribs and costal cartilages below the pectoral border |
| Side of chest | Serratus anterior digitations from the fifth rib down with the arm by the side, interlocking with the upper five external oblique digitations | Ribs |
| Abdomen | External oblique (lower eight ribs to the anterior iliac crest and the aponeurosis); rectus abdominis inside its sheath with three tendinous inscriptions | Internal oblique (with external oblique forms the iliac roll) |
| Upper back | Trapezius (occiput, C7 and all thoracic spines to clavicle, acromion and scapular spine) | Rhomboids, levator scapulae, supraspinatus |
| Lower back | Latissimus dorsi (lower six thoracic spines, thoracolumbar fascia, iliac crest, lower ribs; crosses the inferior scapular angle to the intertubercular groove) | Erector spinae under the thoracolumbar fascia: two rounded columns in the loin |
| Shoulder | Deltoid (lateral clavicle, acromion, scapular spine to the deltoid tuberosity) | Greater tubercle; infraspinatus and teres minor behind |
| Axilla | Anterior fold: lower pectoralis major border; posterior fold: latissimus with teres major | Coracobrachialis shows from under the anterior fold with the arm raised |
| Hip | Gluteus maximus (posterior ilium, sacrum, coccyx to the iliotibial band and gluteal tuberosity), covering the posterior third of gluteus medius | Gluteus medius (anterior two thirds under fascia only), tensor fasciae latae in front, greater trochanter |
| Upper thigh (to the cut) | Sartorius from the ASIS crossing medially; tensor fasciae latae and the iliotibial band laterally; adductor longus and gracilis medially | Rectus femoris between sartorius and tensor; vastus lateralis under the iliotibial band |

Overlap rules the generator keeps: pectoralis major lies over serratus and pectoralis minor and its lower border is free (the anterior axillary fold); serratus and external oblique interdigitate in a zigzag line, neither over the other; latissimus covers the lower serratus slips and the inferior angle of the scapula; trapezius covers the upper medial scapula and its lower border runs to T12; deltoid covers the shoulder joint and the upper ends of biceps and triceps; gluteus maximus covers the posterior gluteus medius and ends in a depression behind the greater trochanter.

## Surface form rules

Grade: conventional (Gray, Bridgman), each a check on renders.

- Sternal furrow between the two pectorals: wide above and below, narrowest at mid-sternum where the muscles overlap the sternum most.
- Infraclavicular fossa: a triangular hollow between the upper pectoral border and the anterior deltoid, below the clavicle's lateral third.
- Rectus abdominis: lateral border marked by the linea semilunaris; three transverse furrows at the xiphoid tip, midway to the navel, and at the navel (faint); a dip along the linea alba from the xiphoid to just below the navel.
- Iliac furrow: the external and internal obliques form "a thick oblique roll" over the iliac crest; the crest is felt below the roll, which is why the palpated crest reads one vertebral level higher than the bone (`../sources/cooperstein-2015.md`).
- Navel 2 to 2.5 cm above the level of the iliac tubercles, above the body's midpoint.
- Back: the erector spinae columns in the loin set the depth of the spinal furrow and taper to a point on the sacrum; the lower thoracic continuation is flattened; PSIS dimples at S1 to S2.
- Triangle of auscultation between the lower trapezius border, the upper latissimus border and the vertebral border of the scapula.
- Torso profile (Bridgman): the front is one long curve broken into three nearly equal lesser curves by the lower pectoral border and the navel; the back is the sharp forward curve of the waist opposite the navel, the long backward curve of the chest and the shorter curve of the buttocks.
- Rib cage and pelvis are rigid blocks that tilt, twist and bend against each other; in a lateral bend the front centre line bends to the convex side, the rectus borders parallel to it.
- From behind, the torso is a wedge with its base across the shoulders and its apex between the buttocks.
- The gluteal fold is crossed obliquely downward and lateralward by the lower border of gluteus maximus.

## Sex differences

Biacromial / bicristal breadth 1.344 (women) against 1.513 (men); bideltoid / hip breadth 1.276 against 1.479; shoulder / buttock circumference 1.010 against 1.159 (`../sources/ansur-ii.md`). Women's waist is relatively narrower against the hips (navel waist / buttock 0.842 against 0.921) and their natural waist-to-hip ratio reaches about 0.72 by 17 to 18 (`growth.md`). Fat placement by sex is in `body-composition.md`.

## Open questions

- Station heights for the gluteal furrow and mid-thigh are not in ANSUR II. The natural waist height is now an identity measurement (`waistHeight`), from the 1988 Army survey (`../sources/ansur-1988.md`): at or just above the tenth rib (women 1056 against 1044 mm, men 1127 against 1121), not midway to the iliac crest, and 74 and 68 mm above the navel; `waistCircumference`, `waistBreadth` and `waistDepth` are taken there.
- Muscle relief depth per muscularity level: no source quantifies how far each belly stands above the fat layer.
- The shape of each cross-section beyond breadth, depth and perimeter needs source-specific calibration. Reference data can supply offline section and feature-curve fits; only named coefficients enter the package, with population and protocol limits retained, never reference mesh or morph data.
- Clavicle and scapula dimensions for the shoulder girdle form were not read.
- How the armpit and groin hollows deform under abduction belongs to #2800 and has no source yet.

## Campaign 2831 upper trunk representation

This section records a historical representation experiment. [#2835](https://github.com/samchon/automovie/issues/2835) and [#2836](https://github.com/samchon/automovie/issues/2836) now own the canonical trunk/shoulder failures and private-candidate disposition; none of the source diagnostics below is a later visual pass.

Commit 62089b17 added the existing slope station to the cage, but the committed four-gate comparison failed: the neck plate remained and a new V-shaped ridge appeared below the clavicles. The numerical junction check had passed; that did not establish appearance. Raw sweep station heights show an anterior reversal before the neck, but raw sweep points, the compiled network curves and the filtered cage targets are distinct quantities and must not be substituted for each other.

The replacement candidate keeps measured horizontal sections through the axilla and uses a curve network above it. Front and back meridians join the corresponding controls of the shared neck ring; lateral guides pass through the skeleton's acromia. Intermediate guides sample a ruled axilla-to-neck field plus the lateral guide residual with a squared-sine angular blend. Coons patches fill the network and share the shoulder opening curves with the arm bridges. Every control is derived from those boundaries and anatomical landmarks; there is no authored vertex table, fitted tilt or new anatomical coefficient.

The existing thirty-five rounded reference-fit form coefficients are unchanged. The old clavicle relief feature cannot remain attached to the truncated lower sweep: its upper landmarks would be located on the wrong domain. This experiment removes that lower-sweep feature rather than projecting it onto the axilla. A clavicle feature that follows the upper network remains required in the subsequent regional/detail work; this experiment claims only an upper gross-form representation trial, not complete feature preservation or a part pass.

The initial network candidate passed the pre-displacement junction check but its joined consumer-stage mesh, with the existing relief applied, had shoulder-bridge intersections witnessed by points strictly inside two triangles. The opening loop starts at its anterior lower corner while the arm section starts on its anterior axis; their eight-sector correspondence therefore advances one column on the left and retreats one on the right. The destination loop and bridge UV chart now read that phase from one shared declaration.

The corrected candidate keeps 427 trunk controls and 404 quads for all four gates, with identical identity-independent connectivity and the same shared neck, arm and thigh controls. TypeScript and the existing eight-person plus four-gate pre-displacement junction checks pass. Sampled upper-trunk horizontal sections have no proper crossings after correction; the follow-up triangle witness search has no candidate points to test. This is a regional numerical screen, not an independent global triangle-intersection test, proof of injectivity or a visual pass. A committed actual-consumer render with construction remains required.

The patch graph changes neither the joined Catmull-Clark skin pipeline nor its placeholder bone-weight method. Torso sweep and upper Coons patches carry explicit chart rectangles based on topology row indices; every ordered face-corner chart is identical across the four identities. The row-chart revision changes UV-seam packing but preserves all indexed physical triangle-corner positions and normals exactly. It does not inherit the perineal Coons chart.

The lower input stations remain identical, but their between-station surface does not: removing upper stations changes the radial interpolant's global tension in 305 to 412 of its 512 directions. Raw same-height points near the hip differ by 8.11 to 10.80 mm and emitted lower cage controls differ by 4.34 to 5.18 mm relative to 62089b17. A new full consumer and measurement comparison is required. Curve overshoot, filtered boundary targets, patch tangency and posed states remain verification concerns. Hip maximum breadth versus buttock-level breadth and male underbust measurement assumptions remain separate open causes.


## Coupled source family and fold correspondence

The original section-measurement extractor supplied its underbust target at a lower costal plane, while the maintained generator consumes an inframammary/pectoral fold plane 0.032 stature higher. The four gate differences are 53.152 to 59.840 mm. The historical profile-fit score therefore cannot establish the present fold section's accuracy. Native pose, bone-registered pose, physical plane and connected components must be retained as distinct observations.

The current correction uses one section family P(height, angle), in the shared model frame. Its centre is derived from the spinal axis and named anatomical sections; positive anterior and posterior half-depths, lateral half-breadth and exponents interpolate dimensionless logarithms at one common set of physical key heights. Front and back supports derive from that centre and those half-depths. Eight meridians are evaluations of the family, not eight separately authored coordinate lists. The old 10 mm centre clamp and 20 mm emitted half-depth clamps are removed. The emitted sweep reads the family state, and includes the family's physical key heights as authored stations, independently of the cage rows or observation sampling counts.

Only the six underbust coefficients are recalibrated in this correction. Its depth is a dimensionless share of its own fold-plane tape girth; it is no longer an old costal-plane interpolation fraction between waist and chest depths. A bounded local fit of the same two-half superellipse family on four nearby reference bodies, using 144 radial contour observations each, has an observed first-order normal residual RMS of 4.22 to 5.06 mm. These are registered reference observations, not measured clinical norms, exact closest-distance errors, a proven optimum or final Human appearance. The rest of the existing named form values are retained.

The scalar authoring family and the compiled sweep are different evaluation stages: the sweep interpolates sampled radii between authored sections. A current four-gate source probe preserves the authored section keys to approximately 1.4e-12 mm while observing up to 2.19 mm difference between them. Do not describe a constant-section unit probe as equality of the entire longitudinal source. Feature points generated on the compiled sweep retain their known source parameters through bilateral mirroring; only independent bone-landmark hints need inverse projection. Construction is sampled from the actual compiled rig, not reconstructed from the authoring-family approximation.

Independent measurement claims must state their protocol. Buttock and natural-waist source sections retain their breadth and depth while solving their perimeter. The current chest section retains depth and girth and solves an outer rest-pose breadth; it does not consume the detailed chestBreadth field. This dates to the earlier distinction between inspiratory compressed caliper breadth and the T-pose outer contour, and remains an open input/protocol issue. It must not be hidden by claiming that all three chest dimensions were preserved, multiplying the input by an invented pose ratio, or forcing different measurement protocols onto one contour without evidence. The waist/chest held limit girths are also distinct from physical-plane breadth/depth and convex tape of the final displaced skin.

The shoulder owner consumes the actual axillary sweep boundary, and the pelvic owner consumes the buttock boundary and its own paired-section realization. Changes to between-key interpolation require both neighboring consumers to be regenerated and checked. Four-gate committed actual-consumer views with construction, defect close-ups, raking light, range and pose checks remain necessary. Private source diagnostics establish no form pass.
