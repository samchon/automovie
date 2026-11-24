# The face in one shot

A face has courses for the head, lids, lips and nose. The principal wall, its parts and their openings each keep their own boundaries and frames. [Head pieces](head-pieces.md) · [Centres and courses](centres-and-courses.md)

## Centres and frames

| Centre or frame | Anatomical basis |
| --- | --- |
| Head origin | Bitragion midpoint. |
| Frankfort axes | Tragion and the inferior orbital margin locate the horizontal reference. |
| Neck ring | The neck's course and the cervical point locate the section below the jaw. |
| Globe centre | Interpupillary breadth, axial length and corneal projection locate each globe in the orbital frame. |
| Lid course | The line between endocanthion and exocanthion. The globe supplies the centre of lid motion. |
| Mouth course | The incisor and muzzle line, with the lip corners defining its lateral ends. |
| Mandible frame | The condylar hinge line and its translation during opening. |
| Nose frame | Subnasale and nasion locate the course. Each nostril's axis follows its vestibule. |
| Ear frame | Tragion, the auricle's long direction and its plane normal. |

### Landmarks and where each definition is read

Nasion, pronasale, subnasale, labiale, stomion, sublabiale, cheilion, crista philtri, alare, the canthi, tragion and gnathion are located by extrema on anatomical curves or by the meeting of two such curves. The alar curvature point lies in the crescent where ala and cheek meet. Katina et al., 2015, *The definitions of three-dimensional landmarks on the human face*, tables 2 and 3 · FaceBase 3D Facial Norms.

The cervical point is the innermost point where the underside of the chin meets the neck. Sublabiale is the deepest point of the labiomental sulcus. Its depth is measured from the line joining labrale inferius and pogonion. [Legan–Burstone norms](../sources/celebi-2013-legan-burstone-norms.md) · Naini et al., 2017.

The modiolus lies beyond the visible mouth corner and helps locate the local deformation frame. Cheilion marks the end of the lip fissure. *The Location of the Modiolus in Living Korean*, 2013.

## The design

### The head's wall and the neck ring

A bilateral wall carries the vault, forehead, temples, cheeks, jaw, chin and floor under the jaw. Choose a course that preserves radial winding where the jaw's floor turns under the head. It shares the neck ring through a continuation with common boundary data. Brow and zygomatic relief can follow their own landmarks on that wall.

### Three openings, one construction

The lid fissure, open mouth and nostril each use a cutter with a declared loop. A `diff` keeps the portion of the cutter that forms the inner margin or wall. `AutoMovieConstructionSharedLoop` reads the declared boundary for the two surfaces. `IAutoMovieConstructionPort.ILoop` describes a smooth periodic curve in the host chart.

Round an opening's pointed ends before tracing its rails. In the made case `test_construction_operator_pointed_cut`, a lens with corners failed to admit a shared loop. Rounding both ends with circles tangent to the arcs admitted it and placed the rails on the analytic fold. Set sampling from the smallest end radius the loop needs to resolve.

### Eye

The canthal section carries the upper-lid sulcus, the two margins and the valley from lower lid to cheek. The margin follows the globe with the lid's thickness. The cutter loop follows both margins and joins them smoothly at the canthi. The globe is a separate sphere in contact with the inner lid surface. A blink moves the upper margin to the lower margin, with the sheet and cutter following the same margin law.

Fissure dimensions and canthal tilt follow the declared landmarks. Globe diameter, orbital dimensions and projection supply separate constraints. [Gao et al., 2025](../sources/gao-2025-periocular-chinese-caucasian.md) · [Ocular biometry](../sources/chen-2016-ocular-biometry-guangzhou.md) · [Hertel exophthalmometry](../sources/wu-2015-hertel-exophthalmometry.md) · Van der Walt et al., 2025.

### Mouth

From cheilion to cheilion, the section carries both vermilion edges, the lip seal and the transition to the labiomental sulcus. The upper edge's phase gives the cupid's bow. Upper-lip radial reach gives the philtral relief. Each end closes at its corner. The closed lip seal is a crease on the outer wall. The parted margin supplies the loop of the oral cutter when the jaw and expression open the mouth.

The upper portion follows the head and the lower portion follows the mandible. The modiolus mediates their movement at each corner. Published soft-tissue depths constrain the lip profile. Jaw motion includes rotation and translation. Hona and Stephan, 2024 · Woelfel et al., 2014 · [Jaw centre of rotation](../sources/mehl-2025-jaw-centre-of-rotation.md).

### Nose and auricle

The nose course follows subnasale toward nasion. The dorsum, columella, sidewalls, alae and alar grooves belong to its section guides. Each nostril uses a cutter on its own axis, with a smooth margin over the alar wall. [Nostril axes study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4977267/) · Ozkul et al., 2013 · Burget and Menick, 1985 and 1986.

The auricle's root meets the head through its own port. The rim, scapha, antihelix, concha, tragus and lobule have distinct landmarks and orientations. [Ear pieces](ear-pieces.md) · [ANSUR II](../sources/ansur-ii.md) · [Auricular concha](../sources/zhu-2017-auricular-concha.md).

### How the parts meet

A face part on the wall uses a shared-loop merge. The fold's rail reach is `hypot(reach, R tan(beta / 2))`, where `R` is the fold radius and `beta` its turn. Read the values from the connection's definition and the person's geometry. Declare each divider once and give its neighbours complementary sides so each skin point has an owner where lips, nose and eyelids approach one another.

The shared loop hands boundary values and tangent information to the child. Use the wall's own normal where a broad relief follows the underlying surface. At a groove's end, narrow its width and reduce depth and turn together, or carry it to a declared boundary. A lip-corner cap shrinks the entire section and its feature lines to the pole. [Body form](body-one-shot.md#the-trunk) · [Joint logic](joint-logic.md)

## Sources

- Gonzalez-Ulloa and Kirwan describe aesthetic regions and structures of adherence. Katina et al. describe landmark definitions. Farkas and FaceBase document the anthropometric measures for facial comparisons.
- Zhu et al., 2022, and Hykin and Bron, 1992, report lid margin thickness. The [tarsus ultrasound study](https://pmc.ncbi.nlm.nih.gov/articles/PMC5859591/) reports thickness at mid-tarsus. [Surve et al.](../sources/surve-2018-upper-eyelid.md) and [Shin et al.](../sources/shin-2025-upper-eyelid-contour.md) describe lid contour measures.
- Hona and Stephan cover facial tissue depth. Naini and the Legan–Burstone literature define the labiomental and neck profile measures. [Spanish lip norms](https://pmc.ncbi.nlm.nih.gov/articles/PMC6714104/) and [Dolci et al.](https://pmc.ncbi.nlm.nih.gov/articles/PMC8304677/) give measurements of lip landmarks.
- Burget and Menick describe the nasal and upper-lip aesthetic subunits. Ozkul et al. report alar thickness. Van der Walt and colleagues report orbital measurements.
- The [MPFB2 basemesh documentation](https://static.makehumancommunity.org/mpfb/docs/assets/basemesh_and_helpers.html) describes stable mesh topology and joint markers. [Anny](https://github.com/naver/anny) documents the MakeHuman-derived topology and its rig.
