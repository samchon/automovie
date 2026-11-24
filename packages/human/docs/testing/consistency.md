# Anatomical consistency

Check the generated skin at the sites defined for its input measurements. Use analytical shapes to verify how the measurements are taken, published anthropometry to check anatomical relationships, and a public mesh to inspect regional form. Report the figure's inputs, the sites and planes used to measure it, and the observed values. [ANSUR II](../sources/ansur-ii.md), [ISO 7250-1](../sources/iso-7250-1-2017.md), [ISO 8559-1](../sources/iso-8559-1-2017.md).

## Measurement sites

- Separate bone centres, palpable landmarks and tape paths. Read a skin tape at its published site and posture. Use the plane normal to the local segment for a limb section where the protocol calls for it, and use a horizontal plane for a standing girth defined that way. Record when a mesh reading estimates a landmark that the protocol locates by palpation. [ISO 7250-1](../sources/iso-7250-1-2017.md), [ISO 8559-1 landmark definitions](../sources/iso-8559-1-2017-landmarks.md).
- In an input response check, perturb one control in both directions and measure the intended site and related sites. Compare the displacement or girth change with the control change and any dependencies specified by the field. Use the permissible error for each applicable measurement type when comparing scanner-equivalent dimensions. [ISO 20685-1](../sources/iso-20685-1-2018.md).
- Inspect the profile between measurement sites as well as its values at the sites. A calibrated circumference can coexist with an unintended peak, kink or crease between two sections. Use a curve read to locate the feature and a close frame to judge the surface.

## Regional profiles

| Region | What to inspect |
| --- | --- |
| Leg | Read thigh, knee, calf and ankle circumferences at their own sites. Follow the section envelope through the calf belly and toward the smaller supramalleolar region. Read hip, knee and ankle alignment and flexion in the joint frame for that leg. [ANSUR II](../sources/ansur-ii.md), [Tang et al. on lower-limb alignment](../sources/tang-2000-lower-limb-alignment.md). |
| Arm | Read the relaxed upper arm, extended elbow, forearm maximum and wrist at their specified sites. Trace the taper of the forearm toward the wrist and look for changes associated with the elbow and muscle bellies. [ANSUR II](../sources/ansur-ii.md), [Gray's Anatomy](../sources/gray-1918.md). |
| Trunk and neck | Locate the chest, underbust, waist, high hip and hip tapes independently. Check their profiles against the person's inputs. Read the neck-base path through the prescribed landmarks and the neck girth at its own level. [ISO 8559-1 landmark definitions](../sources/iso-8559-1-2017-landmarks.md), [ANSUR II trunk proportions](../sources/ansur-ii-trunk-ratios.md), [ANSUR II foot and neck measurements](../sources/ansur-ii-handbook-foot-neck.md). |
| Hand and digits | Measure hand length through dactylion III. Follow each digit from the web through its own joint sequence to the pulp and apex. Inspect the dorsal and palmar transitions at the web and around the nail. [ISO 7250-1](../sources/iso-7250-1-2017.md), [Gray's Anatomy](../sources/gray-1918.md). |
| Foot | Measure length from the heel to the longest toe and breadth over the metatarsal heads. Follow the dorsal profile from the ankle toward the toe tips. Check the heel and forefoot contacts and the separate medial and lateral arch profiles. [ANSUR II foot and neck measurements](../sources/ansur-ii-handbook-foot-neck.md), [Williams and McClay on arch height](../sources/williams-mcclay-2000-arch-height.md), [Gray's Anatomy](../sources/gray-1918.md). |
| Head | Locate the cranial and facial landmarks before reading their distances. Follow the median curvature through the forehead, nasal root and dorsum, lips, chin and neck transition. [ISO 7250-1](../sources/iso-7250-1-2017.md), [Farkas et al. on facial anthropometry](../sources/farkas-2005-international.md). |

## Public reference

The MPFB2 Human Mesh 2008 (HM08) base OBJ gives one public rest figure with joint markers. The loader pins revision `650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a` and checks SHA-256 `8e761e6624b8f54536409135d1636da63b32486a90d4897f84e121d144f6fb4c` for either a local copy or a download. The asset license is CC0 1.0. [Pinned OBJ](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/src/mpfb/data/3dobjs/base.obj), [pinned asset license](https://github.com/makehumancommunity/mpfb2/blob/650c5c53bd6989a8ac264f31fa1d11d4a0c7bd8a/LICENSE.ASSETS.md), [source loader](../../../../test/src/reference-conics/FamilyConicMpfbSource.ts).

The loader reads skin faces from `g body` and gets joint centres from the centroids of the corresponding joint marker vertices. It converts skin and centres to millimetres with the lowest skin vertex at floor level and orients the axes anterior, superior and anatomical left. Keep comparisons tied to this asset's pose and dimensions. The extraction tools record the source observations, excluded cuts and withheld-section checks used to assess individual families. [Family extraction](../../../../test/src/reference-conics/FamilyConicMpfbFamilies.ts).

## Executable checks

Run these checks from the repository root.

```powershell
pnpm test:esbuild --include human_mpfb_source human_mpfb_families human_generic_surface_capture human_form_measurements human_independent_lower_limb
```

| Check | Geometry and assertion |
| --- | --- |
| [MPFB2 source](../../../../test/src/features/human/frames/test_human_mpfb_source.ts) | A small OBJ fixture exercises body and marker separation, axis and unit conversion, and triangle orientation. |
| [MPFB2 families](../../../../test/src/features/human/frames/test_human_mpfb_families.ts) | An elliptical tube with known radii exercises withheld-section comparison and the exclusion of sections shared by a foreign segment. |
| [Surface capture](../../../../test/src/features/human/frames/test_human_generic_surface_capture.ts) | A loft sized from published anthropometry exercises watertight indexed geometry and axis, guide and section overlays in the capture scene. |
| [Form measurements](../../../../test/src/features/human/frames/test_human_form_measurements.ts) | Exact tetrahedra exercise winding, genus, empty-space probes, skin crossings, clearance and source-chart contact readings. Separate fixtures test the 0.01 mm nail clipping boundary and declared open roots. |
| [Independent lower limb](../../../../test/src/features/human/frames/test_human_independent_lower_limb.ts) | Published anthropometry exercises lower-limb placement and the five toe apexes through regional construction. |

## Whole-figure acceptance

Whole-figure acceptance is pending. The round must cover the neutral assembly, 20 length cases, the tissue cases, and 40 nail frames across all 20 nail sites. Check the assembled skin for closed topology, correct winding, genus, empty-space probes and contact gaps. Verify the overlap limit of 0.01 mm and record any crossing or gap with the implicated surfaces and its position.

List the exact neutral-case identifiers with `pnpm --filter @automovie/test conic:neutral --list`. Run a case through the production body and skin readers with `pnpm --filter @automovie/test conic:neutral --case=length-thigh-1.1 --out=<report.json>`. The receipt includes the supplied fields, their digest, the emitted owners, the floor position and the observed topology. The source-level length test verifies the twenty requested ratios before the rendering round. [Neutral case reader](../../../../test/src/reference-conics/FamilyConicNeutralCases.ts), [Length test](../../../../test/src/features/human/frames/test_human_neutral_lengths.ts).

Open the clay, curves over clay and close views of each joint beside the public reference where comparable. Include the shoulder from the front, back and below and the axilla close up. Include the hand from the back and palm, between the fingers and at the fingertips. Include the foot from above, from the sole, between the toes and from the side. Judge naturalness directly from those views. Record reference deviations with the measurements as diagnostics and record the frame and reason for each visual decision.
