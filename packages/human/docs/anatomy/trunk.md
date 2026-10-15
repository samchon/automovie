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

Regressions on stature, BMI and age for every girth, breadth and depth are in `../sources/ansur-ii.md`; their adiposity reading is in `body-composition.md`. A cross-section is a closed curve whose breadth and depth match these values and whose perimeter matches the circumference; the generator solves the curve's shape coefficients to hit all three, which fixes how square or round each level is.

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
- The shape of each cross-section beyond breadth, depth and perimeter (where the flat and the round parts lie) has no measured source; 3D scan statistics are excluded by the data rule, so it must come from the muscle and bone placement.
- Clavicle and scapula dimensions for the shoulder girdle form were not read.
- How the armpit and groin hollows deform under abduction belongs to #2800 and has no source yet.
