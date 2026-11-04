# Head modeler log

The head lane of campaign #3044: #3052 head and neck, #3053 eye, #3054 nose, #3055 lips, #3056 ear. This file is the head modeler's own log; nobody else writes in it.

## Paths I edit and commit

- `packages/human/src/generation/`: `AutoMovieHumanHead*`, `IAutoMovieHumanHead*`, `AutoMovieHumanNeck*` (with `AutoMovieHumanNeckConstruction`, supervisor 13:4x), `AutoMovieHumanEye*`, `AutoMovieHumanEyelid*`, `AutoMovieHumanEar*`, `AutoMovieHumanMouth*`, `AutoMovieHumanOralCavity*`, the opening files (`AutoMovieHumanApertureSpan`, `AutoMovieHumanApertureSeam`, `AutoMovieHumanBodySurfaceOpening`, and the aperture parts of `AutoMovieHumanBodySurface`, `...SurfaceLoft`, `...SurfacePoles`, `...BodyRoots`, `IAutoMovieHumanSurfaceContext`), and new head parts under `generation/head/`.
- Tests under `test/src/features/human/head/` (the parts tests #3053 to #3056 name).
- `packages/human/docs/techniques/head-pieces.md`, `ear-pieces.md`, and this log.
- Not mine: `AutoMovieHumanBodyLaw` (order and events), `AutoMovieHumanTrunkNeckSeat`, `AutoMovieHumanEventJoin*` (the body modeler's); `lofting/` (the kernel worker's).

## Opening trim repair (supervisor order 13:2x; recorded 14:12:16, Get-Date)

The tester's baseline had f1, f2, m1 and m2 failing at the skin stage: "Opening mouth lies on no single chain" (f1, m1), "Opening nostril.left lies on no single chain" (f2), "Station 1698.22 is outside chain head.lower" (m2). I read the causes from the refusal reasons on the shared viewer (f1 generations 13:47:28, 13:50:56, 13:55:08, 13:57:46, 14:00:22, 14:02:40, 14:04:58 and 14:09:23, each a reason with its numbers):

| Phenomenon | Cause |
| --- | --- |
| a margin point with no foot within 0.1 mm (f1 mouth #59 at the lips' slit, 5.6 mm; f1 nostril, 224 of 720 points up to 2.8 mm) | its line of sight along the opening's axis runs along the slit's groove between the lips, or passes the nostril's outer end where it overhangs the nose's turning base; no root exists, and Newton from the previous foot drifted |
| the right station never searched (f1 mouth #658 to #661, 3 mm) | the station window was the margin's heights plus 8 mm, but the head's sections under the nose tilt front-down, so a station is no height |
| a margin over two chains had no base | `AutoMovieHumanApertureBase` took one chain only |
| m2's throw | the mouth's drawn rim and the trim's Jacobian read `s + 0.01` past the chain's top layer |

The fix, in `e04547fa5` (14:12:09): feet nearest the line of sight by Gauss-Newton with a coarse-search restart, searched over the stations whose sections pass near the margin; points without a foot are left out of the loop; a margin on two chains is split at their shared ring, each crossing solved on the event parent's ring and copied by the child; the spanning hole includes the child's zipper band and is zipped in the opening's plane; the slit's drawn rim continues into the chain beyond a shared ring; every station difference stays inside its chain. After it, f1 passes every trim and stops at the eyes' position cut, "Aperture has disconnected boundaries: eye.left" (generation 14:09:23 to 14:10:26). That residue is #3053's. The cut was not reached before this repair, so whether it predates the repair is not known. f2, m1 and m2 were not generated, because each run stops at the first failure and f1's eye fails first.

## Eye trim (supervisor order 14:1x; recorded 15:03, git time of `20eeb3500` 15:02:30)

The eyes were the last opening clipped from the skin's triangles (`AutoMovieHumanBodyApertures.cut`), because their lid band crosses the ring between `head.middle` and `head.upper`. With the opening trim spanning two chains, an eye is trimmed like the others. Its lid band's outer edge (`IPrepared.edge`, one point per lid sample) is taken to its feet on the head chains, and the lid band's columns start from that rim (`AutoMovieHumanEyelidSurface.loop`). Every opening stays listed for the rows refined near it. f1 generated whole on 5197 with the eyes trimmed (request 14:35:22, frame written 14:38, `packages/human/.shots/head/repair/f1-face-1438.png`). The frame shows the generation through, with hair covering the face; nothing in it was judged. The position cut, `AutoMovieHumanBodyApertureIslands`, `AutoMovieHumanSkinProjection` and the opening-grown lid band were then deleted (src watch green 14:49:38). The check of that state (request 14:50:06) had not answered by the commit. f2, m1 and m2 were not generated.

## Head parts, first pass (compile-only, owner's method 14:4x)

- `generation/head/AutoMovieHumanHeadMassPart.ts`: the head mass as an `IAutoMovieHumanViewPart` from P (with the submental line at Sn-Gn'-C), B and L. The axis runs along L's forward place by minimal rotation. The vault's quarters take the conic shoulder of the circumference-closing exponent; the face's front quarters take the face plan's exponent under the nasion, a prior row still to be replaced. Top pole at the vertex. Not wired.
- `generation/head/AutoMovieHumanNeckPart.ts`: the neck as a view part, its views read off today's neck chain at its layers. Ellipse shoulder. Not wired. Interface to the body modeler: merged onto the trunk through the trunk's merge entry, seeded at cervicale and suprasternale.

## Construction map of the head subtree (design, written from 13:48:14, Get-Date)

Designed against the kernel's interfaces committed in `8194f8923`: a part is an `IAutoMovieHumanViewPart` (axis `straight`, `horizontal` or `minimal`; stations; the `front` pair, the extremes along the section's `u`; the `side` pair, the extremes along `v`; fullness by `girth`, `shoulder` or `top`; an optional `pole`), lofted by `AutoMovieHumanViewLoft.create` into a chain and a solid surface; parts join by `AutoMovieHumanSolidMerge` and `AutoMovieHumanSolidDiff` (`AutoMovieHumanSolidJoin`: part with periodic phase, host, a seed, width laws per part phase); openings are `AutoMovieHumanSolidTrim` loops. Frame of the head: x forward, y up, z left, the Frankfort plane level, calibration millimetres; every paired part is built for the left side and reflected (`z -> -z`, phase run backward).

### Tree

| Part | Axis and stations | `front` pair (+u, -u) | `side` pair (+v, -v) | Fullness | Joined by | Issue |
| --- | --- | --- | --- | --- | --- | --- |
| neck | `minimal` along the cervical course, from below the trunk's neck base ring (inside the trunk) to inside the head mass | front profile through `suprasternale` and the cervical point; back profile through `cervicale` and the nape | lateral outline through `sideNeck` and the breadth at the neck tape's site | `girth`: `neckCircumference` at its ISO 8559-1 5.3.2 site (a station plane square to the axis); the neck base tape is read on the merged skin over cervicale, the side neck points and suprasternale | merge onto the trunk (host the trunk's view-loft surface, seed at cervicale); the head mass merged onto its top | #3052 |
| head mass | `minimal`: vertical through the skull's centre from the vertex pole down to the subnasale, then leaning forward going up (back going down) so the lower planes tilt front-down and pass under the chin; bottom pole inside the neck | P (the median front profile without nose, lips and chin pad) and B (the median back profile) | L, the front-view silhouette: E (eurion line) above the tragion's level, through half the cranial base width t-t at the tragion, to half go-go at the gonion and the chin; one C2 outline, symmetric | `shoulder` with per-quarter departures: the back quarters solved from the head circumference at its site, the front quarters from the bitragion arcs (below) | host of every face part; merged onto the neck | #3052 |
| orbit (each side) | `straight` along the orbital axis | rim outline in the eye's front view | depth profile | `top`: the rim's plan | diff from the head mass | #3052 |
| brow ridge, zygoma with malar eminence, cheek, chin pad, jaw angle | `straight` along each part's projection axis (the head's normal at its landmark), pole at its apex | footprint outline | projection profile | `shoulder` from its own law | merge onto the head mass | #3052 |
| temple hollow, nasolabial fold, mentolabial sulcus | `straight` along the depth axis, pole at the floor | course outline | depth profile | `shoulder` | diff from the head mass | #3052 |
| eyeball, cornea | revolution about the visual axis (`straight`, four equal outlines from the globe's profile, `AutoMovieHumanEyeGlobe`) | globe radius profile | the same | `shoulder` at the ellipse | placed in the orbit; cornea merged | #3053 |
| upper lid, lower lid (each side) | `straight` along the fissure (endocanthion to exocanthion) | margin profile over the globe with the clearance law | lid thickness and its fold | `shoulder` | merged into the orbit recess; the canthi are where the two merges meet; crease a diff; the fissure the trim between the lids | #3053 |
| nose | `straight` along nasion to the base | dorsum profile nasion to pronasale to subnasale | half `nose.width` curve from nasion to the alae | `top`: the base's outline | merge onto the face | #3054 |
| tip lobule, ala (each side), columella | each `straight` in the nose's frame | its projection | its width | `top` or `shoulder` | merged onto the nose; nostrils through-cut in the base; alar groove a diff | #3054 |
| upper lip, lower lip | `straight` along cheilion to cheilion | protrusion profile | vermilion height with the Cupid's bow | `top`: the dental arch (`AutoMovieHumanMouthArch`) | merged onto the face; philtral columns merged, groove a diff; the oral fissure a through-cut | #3055 |
| auricle (each side) | `straight` along the ear's long axis from the tragion's frame | lateral outline from `ear.length` and `ear.breadth` | thickness | `shoulder` | merged onto the head at its root; helix and antihelix swept rims merged; concha, scapha and fossa diffs; tragus, antitragus, lobule merged; canal a through-cut | #3056 |

### Head mass laws (#3052)

- Knots of P: vertex, glabella, nasion, the subnasale's and stomion's places on the skull's front without the nose and lips (the face plane through subnasale and pogonion by Legan and Burstone's maxillary and mandibular prognathism), menton, then the submental line at the lower face-throat angle (Sn-Gn'-C 100 degrees, Legan and Burstone 1980) to the cervical point. The nose, lips and chin pad amplitudes are the published profile's departures from this skull outline, carried by their own parts.
- Knots of B: vertex, opisthocranion (head length g-op from the glabella), the nape, the neck's back.
- Knots of L: eurion (half eu-eu, `length x cephalicIndex / 100`), tragion (half t-t, the 3D Facial Norms' t-t over eu-eu), gonion (half go-go), the chin; the vertex pole where L meets P and B.
- Axis: the operator's touch points lie on the chart axes through the part's axis (`view-section-lofting.md`, Limits), so the head mass's axis runs, in the side view, along L's forward place (the eurion's, the tragion's, the gonion's), and P and B are its front and back extents from there. Below the subnasale the axis leans so its planes turn front-down under the chin; their tilt is the angle that keeps the submental line crossed transversally, read from the lower face-throat angle.
- Outlines in the station planes: a `minimal` axis drawn in the sagittal plane keeps its binormal, so every plane holds the lateral axis `z` (`v = z`) and cuts the sagittal plane in one line through its origin along `u`. P's and B's extents at a station are that line's crossings with the side-view curves (one root each along `u`), and L's extent is L's half breadth at the origin's height, since the axis runs through L's forward place. Each outline is then the natural spline through its values at the landmark stations the operator requires as layers; the vertex is the `top` pole with every outline at 0 there (the kernel's G2 dome, `16c5f4323`).
- Sections stay convex (the operator's validity); every concavity of the face (orbit, temple, sulci) is a diff, every bulge a merge.
- Tragion's height: ANSUR II tragion to top of head with the head height (menton to vertex), replacing `frame.tragionDrop`.
- Fullness: one shoulder per station for the back quarters, solved so the section through the glabella and opisthocranion reads the head circumference; the front quarters' departure solved so the bitragion arcs read back on the merged skin. The lead "Farkas 1994 surface arcs as the face's girths" is verified with a published per-person source instead: the 1988 US Army survey (Gordon et al. 1989, NATICK/TR-89/044; public `ansurMen.csv` and `ansurWomen.csv`) measures six bitragion arcs (minimum frontal, crinion, coronal, subnasale, menton, submandibular), and ANSUR II measures the bitragion chin and submandibular arcs. Defaults by sex from the public head inputs come from the input and laws worker's regressions; the coronal arc owns L's turn over the vault, the submandibular arc the head mass's underside where the neck merges.
- Deleted when the head mass lands: the ray field (`AutoMovieHumanHeadRadius`, `AutoMovieHumanHeadMath.outermost` and its smooth maxima and minima as joins, `AutoMovieHumanHeadVault.gauge` and `cranial`, `AutoMovieHumanHeadSideSector`, `AutoMovieHumanHeadSkin`, `AutoMovieHumanHeadJawJoin`), the relief windows (`AutoMovieHumanHeadRelief` and every window piece it sums), the neck hand-over fade (`AutoMovieHumanHeadNeckBase.neckFade`), the three head chains and their events (one chain from pole to pole, ears merged), and the prior rows the outlines replace.

### Requests

- Kernel worker (#3046 and the solid operators):
  1. An intersection traced as one closed loop by arc length, not as a graph over the part's phase. An elongated part lying along its host (the helix and antihelix rims, the lids along the fissure, the lips, the nasolabial and mentolabial grooves) meets the host along two long sides, and no one station per phase describes that.
  2. A part merged at both ends (the neck: onto the trunk at its bottom, the head mass onto its top), so `width.part` takes a station at either end.
  3. A part closed by a pole at its free end and merged at its other (each face mass and groove cutter, the nose's parts).
- Input and laws worker: defaults for the bitragion arcs and the tragion-to-vertex height by sex from the public head inputs (ANSUR 1988, ANSUR II), and published replacements for the head prior's "Observed" rows (`ratios.neck`, `ratios.forward`, `profile.glabella`, `profile.nasion`, `ear.drop` by ANSUR 1988 ear length above tragion, `ear.forward`, `frame.plan`) and for `AutoMovieHumanNeckPrior`. The neck's breadth and depth at its tape site have no public source in ANSUR 1988 or ANSUR II; a source is needed before the neck's `side` pair can be an input.

### Order

#3052's neck and head mass first, then the eye, nose, lips and ear, each design recorded here before it is built, one batch per part, judged once by its tests and one look on the shared viewer (`hide=human.garment.*`), committed with `Close #n` and pushed. The neck merges onto the trunk after the body modeler publishes `neckBase`.
