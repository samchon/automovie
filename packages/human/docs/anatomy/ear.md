# Ear

Covers the ear part of #2799: a separate part joined at its attachment ring through #2795, generated from ear length, breadth and protrusion.

## Morphology (Gray 1918, conventional)

From `../sources/gray-1918.md`:

- The auricle is ovoid with the larger end up; its lateral surface is concave and faces slightly forward.
- Helix: the rim, curling forward into the crus of the helix that crosses the concha; an occasional Darwin tubercle where it turns down behind.
- Antihelix: parallel inside the helix, dividing above into two crura around the fossa triangularis.
- Scapha: the groove between helix and antihelix.
- Concha: the deep cavity inside the antihelix, split by the crus of the helix into the cymba (upper) and cavum (lower); the cavum leads to the external acoustic meatus, about 2.5 cm deep from the concha floor.
- Tragus in front over the meatus, antitragus opposite across the intertragic notch, lobule below, made of areolar and adipose tissue without cartilage.
- One plate of yellow fibrocartilage under thin, adherent skin; the cranial surface repeats the lateral relief in reverse (eminentia conchae, eminentia triangularis).
- Extrinsic ligaments tie the tragus and spina helicis to the zygomatic root and the concha back to the mastoid.

## Dimensions

| Measure (mm) | Men | Women | Population, protocol | Grade | Source |
| --- | --- | --- | --- | --- | --- |
| Ear length | 66.8 to 67.1 (10) | 64.5 (10) | 631 Korean adults 20-92, 3D CT | measured | `../sources/cho-2025-korean-ear.md` |
| Ear width | 28.9 to 29.2 (7) | 27.3 to 27.5 (6) | same | measured | Cho 2025 |
| Insertion length | 54.2 to 54.7 | 53.4 to 53.7 | same | measured | Cho 2025 |
| Conchal length | 28.0 | 27.0 to 27.4 | same | measured | Cho 2025 |
| Conchal width | 18.7 to 18.8 | 18.1 to 18.2 | same | measured | Cho 2025 |
| Protrusion at superaurale | 9.9 (3.7) | 8.3 (3.1) | same | measured | Cho 2025 |
| Protrusion at tragal level | 19.5 (4.5) | 17.3 (4.6) | same | measured | Cho 2025 |
| Lobular length | 25.3 (4.9) | 23.5 (4.3) | same | measured | Cho 2025 |
| Auricle distance from the inferior orbital rim | 90 to 91 | 90 to 91 | same | measured | Cho 2025 |

Age: ear length rises from 63.9 mm (men, 20-29) to 69.5 mm (70+), and from 60.1 to 68.1 mm in women; all length measures correlate positively with age. The ear keeps growing through adulthood, so an older identity has longer ears and lobules at the same head size. Children: Cho cites a Korean study in which ear length and width reach 90 percent of adult size at 14 to 15 years (9 to 12 in Western populations). Farkas 2005 found ear height (length) identical to North American whites in 99.7 percent of comparisons across ethnic groups (`../sources/farkas-2005-international.md`, abstract).

## Lobule

Lobule type from the angle between the auricle base and the line through the superior and inferior otobasion (Cho 2025, measured): tapering at 69 degrees or less (1.5 to 1.6 percent), square 70 to 109 (25.2 percent of men, 18.8 of women), pendulate 110 or more (73.3 and 79.6 percent). The attached versus free lobule distinction is not in the sources read.

## Placement and protrusion

The ear sits behind the face at tragion; `head.md` gives the tragion-based depths t-n, t-sn and t-gn and the cranial base width t-t that place it. Protrusion is given as distances of the helix rim from the scalp at two heights (about 10 mm at superaurale and 17 to 20 mm at the tragal level, Cho 2025); an auriculocephalic angle can be derived from them and the conchal depth, but no measured angle was found in an open source read (the Asian photonumeric scale paper PMC13128748 grades the angle without giving values).

## Form rules for the generator

- Parameters: ear length, ear width, conchal length and width, lobule length and type, protrusion at the two levels. The helix-antihelix-concha relief is generated from these as named sub-forms; the cartilage plate has constant thickness except at the lobule.
- The ear is its own part joined to the head at the insertion ring (insertion length 53 to 55 mm). The ring lies along the cranial attachment from the superior otobasion to the inferior otobasion, around the tragus root; the junction must not crease where the helix root and tragus meet the cheek.
- Thin cartilage makes the ear translucent when back-lit; see `skin.md`.

## Open questions

- No European or African ear norms with the same protocol were read; Farkas's ear tables were not accessible.
- No measured auriculocephalic angle or conchal depth.
- Helix width, scapha depth and antihelix fold angle (prominent ears) have no measured distribution here.
- Large SDs in the CT data (ear length SD about 10 mm) look wider than caliper studies usually report; a second population source is needed before using them as admission bounds.
