# Rig and skin an asset

Use this branch when an asset needs a new or changed skeleton, skin, attachment or deformation control. Read its actual settings record, required screenplay use, retained source and installed import, model, skinning and viewer contracts. [Asset workflows](workflows.md) chooses construction, recovery or direct use; [asset questions](../contracts/assets.md) judge the adopted representation. A generated surface is not a rig, and a generated rig is a candidate until its actual consumer deforms it correctly.

## Characterize before binding

Keep exact mesh, skeleton, textures, source pose and transforms as fixed inputs. Identify units, handedness/up/forward axes, local versus world transforms, rest/bind pose, hierarchy, joint identifiers, pivots and attachment ownership. An exported rest pose, an animation's first frame and the display's zero pose need not coincide. Inspect required bones and every used influence, including rigid accessories; a successful import cannot establish a missing control.

Choose the supported path: project-authored bones/weights, an admitted imported rig/clip, or an external rigging tool whose result will be converted and adopted. UniRig and RigAnything are optional acquisition methods in [rigging research](research.md); their inferred topology and weights do not establish semantic mapping, task fitness or an installed AutoMovie feature. Verify a representative actual export/import/deformation path before scaling acquisition, within adopted setup authority. Keep generated outputs and conversions separately identifiable.

Map each deforming vertex to the actual joint palette and bind interpretation. Validate influence indices, finite weights, admitted sums and influence counts, parent relationships and coordinate conversion through the installed APIs. A rigid prop needs its correct transform/attachment, not gratuitous skinning. Unknown joints or extra influences cannot be dropped merely to pass admission; a deliberate reduction is a new derivative with measured and rendered error at the required poses.

## Prove deformation through the real consumer

Check the unposed/rest result first, then isolate required controls before combined poses and the actual shot sequence. Inspect shoulder/hip bends, elbow/knee flexion, twisting, hands, face or other required regions, attachments, and transitions back to rest. Choose coverage from this asset's actual anatomy and promised use, including silhouettes, junctions and the intended screen scale. Look for displaced bind pose, double transforms, collapsing or bulging joints, penetrating clothing/accessories and changing normals/materials. Distinguish malformed binding from a correct but unsuitable blend method.

Read the current API before choosing linear or dual-quaternion skinning and its scale constraints; compare their actual results where the production needs that choice. A DCC's preserve-volume preview does not establish the imported consumer's deformation. Keep meaningful proportions and control identities stable across detail variants, and recheck weights, rig assumptions and attachments when topology or proportions change. [Rendered-use inspection](inspection.md) owns the complete observation round and matching comparisons.

Hand the admitted skeleton interpretation, controls, source identities and unresolved limits to [motion](../motion/SKILL.md). Motion owns the time-varying performance and any [retargeting](../motion/retargeting.md), not a hidden rig repair inside a shot. Maintain the actual settings-to-asset and asset-to-shot relationships under [execution traceability](../evidence/execution.md). A pose screenshot, successful auto-rig job or low fitting residual does not prove the full commissioned performance.
