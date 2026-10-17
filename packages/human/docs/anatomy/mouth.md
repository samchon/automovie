# Mouth, teeth and tongue

Covers lips, vermilion, cupid's bow, philtrum and commissures, and the teeth and tongue meshes sized from the jaw.

## Lips and philtrum

Mean (SD) mm.

| Measure | Landmarks | 3DFN M | 3DFN F | Kenyan M | Kenyan F | SA women |
| --- | --- | --- | --- | --- | --- | --- |
| Mouth width | ch-ch | 50.9 (3.8) | 48.1 (3.5) | 55.9 (3.3) | 52.0 (4.0) | |
| Philtrum width | cph-cph | 13.3 (1.8) | 11.8 (1.7) | | | |
| Philtrum length | sn-ls | 16.4 (2.7) | 14.3 (2.4) | 15.5 (1.3) | 13.5 (1.6) | |
| Upper lip height | sn-sto | 22.7 (2.7) | 20.5 (2.5) | 25.5 (1.3) | 24.0 (2.5) | 23.9 (2.5) |
| Upper vermilion height | ls-sto | 7.5 (1.7) | 7.4 (1.4) | 13.7 (1.3) | 13.4 (0.9) | 11.0 (2.0) |
| Lower vermilion height | sto-li | 8.7 (2.3) | 8.5 (1.9) | 13.8 (0.9) | 13.6 (1.0) | 13.2 (1.9) |
| Lower lip height | sto-sl | 19.2 (2.8) | 17.6 (2.3) | 22.5 (1.9) | 20.7 (1.1) | 19.5 (2.5) |
| Cutaneous lower lip | li-sl | 12.5 (2.6) | 10.8 (2.2) | | | |
| Upper lip to E-line | | | | | | 2.4 (2.1) in front |
| Lower lip to E-line | | | | | | 5.2 (2.2) in front |

Other mouth widths: Chinese workers 52.2 (3.4) men, 49.8 (4.6) women (`../sources/du-2008-chinese-workers.md`); NIOSH baseline 48.6, female -2.1 (`../sources/zhuang-2010-niosh-facial.md`). Farkas 2005 found mouth width the same as North American whites in 99.7 percent of comparisons across ethnic groups (`../sources/farkas-2005-international.md`), and Virdi found it the only measure shared by Kenyans, African Americans and North American whites. Mouth width is an ancestry-stable measure; vermilion height is the ancestry-variable one: 7.5 mm upper in the European-ancestry 3D norms against 11 to 14 mm in the Kenyan and South African samples. Upper-to-lower vermilion ratio: 0.86 (3DFN men), 0.99 (Kenyan men), 0.84 (SA women, measured as 0.838).

Sources: `../sources/weinberg-2016-3d-facial-norms.md` (3D straight distances; the vermilion values are chords ls-sto and sto-li), `../sources/virdi-2019-kenyan-face.md` (caliper), `../sources/wilson-2023-south-african-women.md` (photogrammetry). Grade: measured.

Growth (3DFN, M / F): mouth width 36.2 / 34.3 at 3-4, 42.9 / 42.5 at 10-11, 50.9 / 48.1 adult; philtrum length already 12.7 / 12.8 at 3-4 (about 80 to 90 percent of adult); vermilion heights grow only about 1 mm after age 3 (upper 6.7 to 7.5 mm, lower 7.3 to 8.7 mm in boys).

## Muscle structure that shapes the lips (Gray 1918)

- Orbicularis oris is layered, not a simple ring: a deep stratum from buccinator, whose middle fibres decussate at the angle (maxillary fibres to the lower lip, mandibular to the upper); a superficial stratum from caninus and triangularis crossing at the angle; oblique fibres from the lip elevators and depressors; and proper fibres running through the lip thickness from skin to mucosa.
- The medial incisive bands (m. nasolabialis) tie the upper lip to the back of the nasal septum; "the interval between the two medial bands corresponds with the depression, called the philtrum". The philtral columns are therefore the edges of a muscular trough, and the cupid's bow is where those columns meet the vermilion at the crista philtri points (cph-cph 11.8 to 13.3 mm apart).
- The commissure (modiolus region) is where zygomaticus, caninus, triangularis, risorius, buccinator and orbicularis converge; every lip-corner AU pulls on this one point.

## Teeth

Mesiodistal crown width, mean (SD) mm, German orthodontic patients mean age 16.7 (`../sources/guht-2026-tooth-crown.md`, measured):

| Tooth | Upper | Lower |
| --- | --- | --- |
| Central incisor | 9.05 (0.55) | 5.66 (0.35) |
| Lateral incisor | 7.18 (0.54) | 6.25 (0.37) |
| Canine | 8.21 (0.43) | 7.10 (0.41) |
| First premolar | 7.40 (0.37) | 7.47 (0.37) |
| Second premolar | 7.15 (0.37) | 7.60 (0.43) |
| First molar | 10.87 (0.53) | 11.49 (0.62) |
| Second molar | 10.39 (0.56) | 10.78 (0.52) |

Resting incisor relation (`../sources/verkouteren-2022-mandible-rom-children.md`, children 6-18): overjet 2.9 to 3.0 mm, overbite 2.2 to 2.3 mm. Sum of the six upper anterior crowns 48.9 mm (derived), close to the 48 to 51 mm mouth width, so the smile shows roughly canine to canine.

## Tongue

No measured tongue dimensions were found in the sources read. Gray 1918 describes its parts but the pages fetched give no overall length or width.

## Form rules for the generator

- Inputs: mouth width, philtrum width and length, upper and lower vermilion heights, lip projections; the cupid's bow peaks sit at the crista philtri points, the vermilion border is a crease of the shared face surface, and the commissure is a single point where the lips meet.
- Teeth are a separate mesh whose arch is sized from crown widths and placed from the jaw (`jaw.md`): upper incisors overlap the lower by the overjet and overbite at rest.
- The mouth opening is driven by the jaw angle plus lip AUs; the lips stay attached to the face surface while the teeth and tongue are rigid parts of the skull and mandible.

## Open questions

- Tongue length, width and thickness by age and sex: no open source read.
- Crown heights, arch widths and arch form are not covered; Guht gives widths only.
- East Asian lip and philtrum dimensions in 3D were not found open.
- Lip shape as a curve (vermilion outline, cupid's bow depth) has no measured source; only landmark distances.
