# Rigging

Use this guide when an asset needs a new or changed skeleton, skin, attachment or deformation control. Read the asset's required use, its retained source, and the import, model, skinning and viewer contracts of the packages it uses.

A generated surface is not a rig, and a generated rig is a candidate until its actual consumer deforms it correctly.

## Characterize Before Binding

### Fixed inputs

Keep the exact mesh, skeleton, textures, source pose and transforms as fixed inputs. Identify units, handedness, up and forward axes, local and world transforms, the rest and bind pose, hierarchy, joint identifiers, pivots and attachment ownership. An exported rest pose, an animation's first frame and the display's zero pose need not coincide.

Inspect the required bones and every used influence, rigid accessories included; a successful import cannot supply a missing control.

### The path

Choose the supported path: project-authored bones and weights, an admitted imported rig or clip, or an external rigging tool whose result is converted and adopted. Learned rigging methods in [Research](research.md) are optional acquisition; their inferred topology and weights establish neither semantic mapping nor fitness for the task.

Prove one representative export, import and deformation path before scaling acquisition, and keep generated outputs and conversions separately identifiable.

### Binding

Map each deforming vertex to the actual joint palette and bind interpretation. Validate influence indices, finite weights, admitted sums and influence counts, parent relationships and coordinate conversion through the supported APIs.

Give a rigid prop its transform or attachment rather than a skin. Keep unknown joints and extra influences; a deliberate reduction is a new derivative whose error is measured and rendered at the required poses.

## Prove Deformation Through The Real Consumer

### Poses to inspect

Check the rest result first, then each required control alone, then combined poses and the actual shot sequence. Choose coverage from the asset's anatomy, promised use, silhouettes, junctions and screen scale: shoulder and hip bends, elbow and knee flexion, twisting, hands, face and other required regions, attachments, and returns to rest.

Look for a displaced bind pose, double transforms, collapsing or bulging joints, penetrating clothing or accessories, and changing normals or materials. Tell malformed binding from a correct but unsuitable blend method.

[Visual Debugging](visual-debugging.md) owns the observation round and matching comparisons.

### Skinning method and variants

Read the current API before choosing linear or dual-quaternion skinning and its scale constraints, and compare their actual results where the asset needs that choice. A DCC's preserve-volume preview shows the DCC, not the imported consumer.

Keep proportions and control identities stable across detail variants, and recheck weights, rig assumptions and attachments when topology or proportions change.

### What survives export

A DCC's constraints, drivers, corrective shapes and modifier stack are evaluated behavior, not portable controls. List which operations produce the promised deformation and which channels the exporter, ingest profile and runtime keep. An interchange format such as glTF defines animation and skin semantics, and the ingest profile in use can accept a narrower subset.

Where needed, bake evaluated results into kept channels or a supported fixed representation, preserving the original and the conversion identity. Report required behavior the path cannot carry instead of exporting only the rest mesh.

Compare the source's evaluated deformation with the imported result at matched times and views, including required corrective or facial states, attachments and nonuniform scale where used. The kept channels and the visible error show whether the deformation is the same; matching bone names or key counts do not. Cover the promised screen-scale performance without requiring unused controls.

## Hand Off

Hand the admitted skeleton interpretation, controls, source identities and unresolved limits to the owner of the asset's performance under [motion](../motion/SKILL.md), which owns time-varying motion and retargeting, so every rig repair stays with the rig rather than inside a shot. A pose screenshot, a finished auto-rig job or a low fitting residual covers only what it shows.
