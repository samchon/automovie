# Human generalization

## Independent verification

Measure the indexed surface and retain triangle addresses for witness points. An unused vertex cannot establish a crown, sole or spike. Check narrow spikes with a local measurement so an area-weighted statistic cannot hide them. Use analytical surfaces and supplied defects to verify the observer on the same path used for generated skin. [Anatomical consistency](testing/consistency.md).

Register source coverage before opening the candidate. For a section comparison, cut both surfaces perpendicular to the source locator's tangent. Retain every intersected component. Match a component only where the same source point belongs strictly to one loop on each surface. Report coverage discrepancies and geometry that lacks support separately.

Nearest Euclidean separation and normal-line separation measure different things. A nearest-point witness remains a useful diagnostic where the normal misses. Report the missing normal support instead of providing that witness as a normal measurement. Before comparing turning, propagate uncertainty from the cut and edge interpolation and inspect the matched profiles for the location of a fold.

Fix registered anatomical landmarks from their definitions. A source asset's named vertices, courses or joint markers provide evidence according to their actual geometry. Keep source-site and generated-site residuals separate. Hold out whole people when using a population to assess generalization.

Report a surface-strain reading only if the bind triangle supplies a numerically supported tangent basis. Record the original and posed corners, the conditioning and the world-coordinate resolution when it does not. Test exact rigid maps and known scales as controls.

## Whole body

The body law resolves the person's dimensions and the skeleton supplies the frames for each course. Check stature between the standard standing floor and vertex. Read the body in the posture specified by each control. Audit geometry and joint placement together where a change in one affects the other. [ISO 7250-1](sources/iso-7250-1-2017.md).

Use a cohort spanning the stated input domain to assess population behavior. Use length, tissue and placement changes to test dependencies. Read the achieved value at the input's own site.

## Tapes

Read the tape at its published site and prescribed posture. Under a positive uniform in-plane scale, the circumference of a planar curve scales by the same factor. If the tape must pass named points or bridge a concavity, verify the full path and contact. [ANSUR II measurement handbook](sources/ansur-ii-handbook-foot-neck.md).

## Leg

Locate landmarks with respect to the hip, knee and ankle frames. Keep each tape tied to its own joint or skin site when the parent join moves. Use the trunk or foot boundary loop and its slopes at the shared join. [Leg anatomy](anatomy/leg.md).

## Foot

Use the foot's measured length and breadth, the malleolus site and the measured or estimated metatarsal layout to place the courses. Each toe grows along its own line. Follow the heel and ball contacts and the arch in sole and side views. [Foot anatomy](anatomy/foot.md).

When a foot uses a fan of section planes, locate their common line outside the skin and carry the guide stations through any change in rotation axis. Check the heel and plantar guide across that change. A plane that recuts earlier skin can fold the loft even when its one outline is admissible.

## Trunk

Place the front, side and back guides from their own landmarks. Give features such as the breast, gluteal mass and umbilicus their own location and footprint. At the neck and arm, continue from each shared boundary's position and slope. [Trunk anatomy](anatomy/trunk.md), [shoulder anatomy](anatomy/arm.md).

## Arm and hand

Keep biceps, bideltoid and shoulder measurements in their specified postures. The upper-arm envelope may have different breadth in the arms-down and bind poses. Read wrist circumference at stylion, the length of digit III through its true endpoint, and palm length through the proximal crease named by that definition. [Arm anatomy](anatomy/arm.md), [ANSUR II hand calipers](sources/ansur-ii-handbook-foot-neck.md).

Place each digit along its own bone course. Carry the parent loop and derivatives into its adjoining curves. Inspect the radial, ulnar, dorsal and palmar profiles and verify the tip and nail together.

## Webs

The web crest is a saddle. Locate the separation of the adjoining digits at that saddle and check the parent and both children in cuts on either side. Constrain the boundary from the neighbouring pieces and inspect the pinch in close views.

## Neck and head

Keep infrathyroid, cervicale, the neck-base tape and the head circumference in their respective definitions. Verify the neck-to-head seam at shared boundary values and slopes. [ANSUR II neck and head tapes](sources/ansur-ii-handbook-foot-neck.md).

Read each head measure at its own landmark. Search the glabella and nasion in separate anatomical intervals. Compare profiles along the length as well as across sections to expose a flank step hidden by a smooth section. Read the zygion at the arch and keep the cheek's separate maximum visible in the other views. [Farkas et al. on facial anthropometry](sources/farkas-2005-international.md).

## Nose

Read the dorsum, tip, alar margins and columella in the nasal plane and in close views. Locate protrusion from the subnasale to the pronasale by its definition and check the nares and alar creases under the nose. [Farkas et al. on facial anthropometry](sources/farkas-2005-international.md).

## Lower face

Read the menton at the chin and the gonion at the jaw angle. Inspect the submental transition into the neck separately from the jaw's frontal and side contours. Check that the skin's extrema still coincide with the sites where the calipers are read.

## Ear

Locate the upper and lower auricular attachments. Between them and around the helix, inspect the concha, scapha, sulcus and free portions of the auricle. [Ear anatomy](anatomy/ear.md).

## Rig

Use the same prepared skin and blend rule in each posed consumer. A seam point with the same bind position needs the same binding through a pose. Measure the change using actual bound triangles. Report the bind pose and pose ranges with the results.

For a normalized dual-quaternion blend of two pure rotations about a common centre, with turn `theta` and weight `w`, the angular derivative at even share is `4 tan(theta / 4)`. Derive local stretch from the point's distance to the rotation axis and the measured spatial weight gradient. Treat the bound as conditional on this rotation model.

## Mouth

Inspect the lip contact line in repose and during jaw opening. Distinguish the outer lip margin from the lining and check the transition at the corners. Measure upper vermilion height at its specified midline landmarks.

## Eye

Measure canthus separation and the pupil-aligned lid opening in their defined frames. Inspect the upper and lower margins against the globe. The published upper-lid contour supplies a source curve for primary gaze. [Shin et al. on the upper eyelid](sources/shin-2025-upper-eyelid-contour.md).

## Publication

Verify that encoding and decoding preserves the chosen mesh precision. Include only selected outputs and measurements in the capture record.

## Rules to reuse

- Transport an in-plane basis with least rotation along an oriented course. Under reflection, reverse phase to preserve section orientation.
- When changing the length of a station interval, transform first and second derivatives by the first and second powers of the coordinate scale.
- Define positive course progress directly and keep adaptive section refinement tied to shape deviation and turning.
- Test the entire seam at shared boundary values and slopes. Fix the line the parent passes to the child if the current line cannot support the continuation.
