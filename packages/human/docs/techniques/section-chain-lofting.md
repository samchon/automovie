# Section-chain lofting

This is the current generator design for campaign #2925. The JSDoc of `packages/human/src/lofting/` and `src/generation/` holds the formulas and premises; this note keeps the overall plan and its status.

## Plan

The body surface is a tree of chains, each a family of horizontal sections indexed by world height in the registered frame (forward +X, up +Y, lateral +Z, mm). Horizontal sections match the saved Recovery loft, which slices the neutral A-pose body along Y, so every observed loop belongs to one chain without reslicing.

1. **Universal lofting logic.** A section is a closed periodic uniform cubic B-spline in x(t) and z(t), with N control points chosen from the section's perimeter spacing. Local support keeps a sharp feature in one place, where the earlier Fourier series rang along the whole loop. Observed samples are projected by penalised least squares (a P-spline): a second-difference penalty whose weight halves the response at a cutoff wavelength (20 mm on the body, 8 mm on the head and toes, 4 mm on the auricle), so sub-millimetre scan noise does not become ribs. The control-point mean is the section centre, which gives the chain's central axis. A correspondence rule assigns the phase t: polar angle for limb and digit shafts, arclength from the front for contact parents such as palms, and guide rails for the trunk and head. Each rail is a phase anchored at the front and back midline crossings, smoothed along height, with uniform arclength between rails, so a point keeps its anatomical place from section to section. Between two principal layers, coefficients follow the cubic Hermite polynomial of their values and height slopes. A section frame may tilt (origin and in-plane axes interpolated along the chain) where a horizontal cut would graze the surface, such as under the chin. Tessellation bisects each interval recursively and stops when the midpoint section lies within a physical chord tolerance.
2. **Body layers.** Each chain keeps only its principal layers. The shared layer fit solves the Hermite values and slopes by least squares over every observation, with a bending penalty, and bisects an interval wherever it misses a recovered section by more than the tolerance. Principal layers therefore fall where the shape changes. After branch events are reconciled, chains are fitted again with their reconciled end sections and end slopes held, so no interval bends to meet an end changed afterwards.
3. **Branch events.** Where loops merge (the axillae, the crotch, the finger webs), the parent's bottom section is a contact of its children's sections. The parent ring is split along pinch-phase arcs, and the children inherit those exact vertices. Each child projects them onto its own end section for their phases, then zips them to its own phase set in its first band, so parent and children share one boundary without seam copies. Chain ends close at recovered critical points: the crown and the fingertips.
4. **Addressable construction.** Every principal section is the curve `<chain>/<k>` and every axis is `<chain>/axis`. The skin is split per chain interval `<chain>/<k>`, so a viewer can select a curve and the skin it shapes (#2966).
5. **Parameter laws.** A body warp maps the calibrated geometry to a person:
   - Vertical landmark heights come from stature and inseam.
   - Limb subtrees stretch along their axes from the arm and leg lengths.
   - Section sizes scale radially from the girth inputs at their measured stations.
   - Region transforms blend smoothly across branch events, so shared boundaries stay shared.
   - The warp is identity for the calibration specimen. Its coefficients are refitted across f1, f2, m1 and m2.
6. **Progressive conquest.** The order is: whole-body outer form, then fingers (done), toes, ears, eyes and the mouth as further branch events, then the parameter laws, then f2, m1 and m2.

## Observation program

The fitters live in `test/src/executable/reference-experiments/human-calibration/` and share `HumanSectionFitting` (spline sections, rails, matched samples) and `HumanLayerFitting` (the layer fit). Each region writes one calibration under `src/generation/calibration/`, the shared coefficients the generator reads:

- **Torso** (trunk, limbs, hands, neck) reads the saved Recovery loft `test/.shots/<id>/hermite-curves.json.gz`. Chains and merge events come from the loft's own interval correspondences, and pinch phases come from the contact sections. It trims at the head region's base.
- **Foot** cuts the reference mesh on planes suited to the foot, so toes lying on the floor separate.
- **Head** (the whole head above the neck base, auricles included; the file keeps its historical `Ear` name) plans tilted section frames and observes them on the reference mesh. It records the eyelid apertures and the eyeball globes.

## f1 observations used

The saved f1 loft has closed loops at every height except 1338 to 1404 mm. In that band the loops cross the body and head mesh boundary and are saved as open pieces; the fitter joins them. The striping over the shoulders in the ruled reverse render comes from this band. Topology events are:

- the crotch contact at 804.9 mm;
- the axillary contacts at 1276.6 mm;
- the finger merges between 920 and 958 mm;
- the floor-contact toe pads below 3 mm;
- facial and ear branches between 1490 and 1610 mm.

Horizontal slices do not separate toes lying on the floor, so the foot region cuts its own planes.

## Status

- **Generated:** trunk, legs, arms, thumbs and fingers, neck, the whole head with auricles and eyelid apertures, and feet with five toes each.
- **Open defects:** faint contact lines at the crotch, the axillae and the wrists, and at the head's event rings; the lateral eye corner opens past the eyeball; the nostrils close by chords.
- **Parameters:** stature scales the body uniformly; the parameter-law warp is designed but not implemented.
