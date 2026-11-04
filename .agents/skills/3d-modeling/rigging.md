# Rigging

Use this guide when an asset needs a new or changed skeleton, skin, attachment or deformation control. Read the asset's required use, its retained source, and the installed import, model, skinning and viewer contracts. A generated surface is not a rig, and a generated rig is a candidate until its actual consumer deforms it correctly.

## Characterize Before Binding

Keep exact mesh, skeleton, textures, source pose and transforms as fixed inputs. Identify units, handedness/up/forward axes, local versus world transforms, rest/bind pose, hierarchy, joint identifiers, pivots and attachment ownership. An exported rest pose, an animation's first frame and the display's zero pose need not coincide. Inspect required bones and every used influence, including rigid accessories; a successful import cannot establish a missing control.

Choose the supported path: project-authored bones/weights, an admitted imported rig/clip, or an external rigging tool whose result will be converted and adopted. UniRig and RigAnything are optional acquisition methods in [Research](research.md); their inferred topology and weights do not establish semantic mapping, task fitness or an installed AutoMovie feature. Verify a representative actual export/import/deformation path before scaling acquisition, within adopted setup authority. Keep generated outputs and conversions separately identifiable.

Map each deforming vertex to the actual joint palette and bind interpretation. Validate influence indices, finite weights, admitted sums and influence counts, parent relationships and coordinate conversion through the installed APIs. A rigid prop needs its correct transform/attachment, not gratuitous skinning. Unknown joints or extra influences cannot be dropped merely to pass admission; a deliberate reduction is a new derivative with measured and rendered error at the required poses.

## Prove Deformation Through The Real Consumer

Check the unposed/rest result first, then isolate required controls before combined poses and the actual shot sequence. Inspect shoulder/hip bends, elbow/knee flexion, twisting, hands, face or other required regions, attachments, and transitions back to rest. Choose coverage from this asset's actual anatomy and promised use, including silhouettes, junctions and the intended screen scale. Look for displaced bind pose, double transforms, collapsing or bulging joints, penetrating clothing/accessories and changing normals/materials. Distinguish malformed binding from a correct but unsuitable blend method.

Read the current API before choosing linear or dual-quaternion skinning and its scale constraints; compare their actual results where the asset needs that choice. A DCC's preserve-volume preview does not establish the imported consumer's deformation. Keep meaningful proportions and control identities stable across detail variants, and recheck weights, rig assumptions and attachments when topology or proportions change. [Visual Debugging](visual-debugging.md) owns the complete observation round and matching comparisons.

An external DCC's constraints, drivers, corrective shapes and modifier stack are evaluated behavior, not automatically portable rig controls. Inventory which operations produce the promised deformation and which channels the actual exporter, ingest profile and runtime preserve. Where needed, bake evaluated results into admitted channels or a supported fixed representation, preserving the original and conversion identity. Refuse unsupported required behavior rather than silently exporting only the visible rest mesh. [Blender's baking guidance](https://docs.blender.org/manual/en/4.5/editors/nla/editing/strip.html#bake-action) distinguishes evaluated motion from stored keys; it does not establish this consumer's support.

Compare the source's evaluated deformation with the imported result at matched times and views, including required corrective or facial states, attachments and nonuniform-scale cases where used. Inspect preserved channels and visible error together; matching bone names or key counts cannot prove the same deformation. Choose enough coverage to protect the promised screen-scale performance without requiring unused controls or maximum rig complexity. [glTF's animation and skin contract](https://github.com/KhronosGroup/glTF/blob/main/specification/2.0/Specification.adoc#animations) defines interchange semantics; the installed ingest profile can accept a narrower subset.

## Hand Off

Hand the admitted skeleton interpretation, controls, source identities and unresolved limits to the owner of the asset's performance, which owns time-varying motion and retargeting, never a hidden rig repair inside a shot. A pose screenshot, successful auto-rig job or low fitting residual does not prove the full promised performance.
