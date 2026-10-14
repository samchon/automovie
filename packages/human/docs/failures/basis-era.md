# The basis era

For about three months Human shipped MakeHuman data baked in Blender and corrected it in code. It never produced an accepted render. This account comes from the research notes on #2788 and from #2787, #2788 and #2789.

## What was shipped

- Commit c7af1556a held `packages/human/assets/{face/basis,body/basis,person/head,person/body}.json.gz`, 27 to 32 MB each, and `person/source-manifest.json`. Master no longer ships them, and its README says "It ships no basis, mesh or person data", so master cannot render a Human.
- The manifest names its upstreams: `mpfb2` (MakeHuman Plugin for Blender, revision 817587ce), `mpfb-extra-targets`, `makehuman` (only the CC0 low-poly eye data) and `makehuman-system-assets`. The bake ran in Blender 5.1.2 from `test/scripts/human-source/*`, which master no longer has.
- Face basis: the hm08 head skin with 16,942 vertices plus eyebrow, eyelash, eye, teeth and tongue proxy meshes, 206 channels, and 377 baked morph targets on the skin: the 52 ARKit expressions such as `browDownLeft` and `jawOpen`, MakeHuman modifiers such as `headWidth` and `noseBridgeHump`, and population targets such as `africanAncestry`. Materials carried hard-coded colours.
- Body basis: 36,810 vertices, 148 channels, 1,859 MakeHuman targets such as `torso/torso-trans-backward`, and 1,575 correctives.

## Why it failed

- Landmarks were fixed vertex indices (glabella was `vertex: 227`), and the manifest itself states that a fixed vertex does not follow a shape change.
- `typia.assertEquals` checked only the container shape. The meaning lived in `number[]` sparse rows of (vertex, dx, dy, dz) and in string channel ids; the body document's shape input was `Record<string, number>` keyed by MakeHuman channel names. The types therefore guarded nothing an authoring agent could reason about.
- Basis revisions r6 to r16 (muscle relief, underwear, sag and similar) were re-bakes of the json.gz, not code, so form knowledge lived outside review.
- About 142,000 lines in `packages/human/src` (2,033 files) evaluated and corrected that data instead of authoring form. The face "portrait" path also kept "the first 468 measured facial vertex identities", the MediaPipe Face Mesh topology.
- The inspection host never delivered a first frame (#2787 records slow worker initialization, an observed `504 Outdated Optimize Dep`, and a suspected but unproved race), yet reports claimed progress.
- No actual Human screenshot, movement, or save/resume ever passed acceptance (#2787).

## What the rebuild takes from it

- The defect was opaque external data carrying all shape knowledge, plus reports that were not backed by renders. The rebuild generates form from typed parameters through code, keeps landmarks as semantic coordinates, fixes the viewer before any form work, and accepts a visual claim only with a screenshot.
- Nothing is salvaged by moving files (#2789). A generic routine that is needed again (area-weighted normals, PNG encoding, glTF writing, dual quaternion skinning) is taken from history deliberately and rewritten in the issue that needs it.
