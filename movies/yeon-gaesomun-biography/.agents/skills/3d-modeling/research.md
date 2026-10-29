# Asset and rigging references

Use primary sources to choose a method and understand its limits, then read the installed contracts and inspect the actual result. These references supply options, not installed features, mandatory dependencies or reproduced benchmark results. External model/code/data licenses and hardware support are separate checks at adoption; a research preview is not the production's accepted asset.

| Primary source | Decision informed here |
| --- | --- |
| [Khronos glTF skinning tutorial](https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_020_Skins.md) and [glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) | Distinguish scene hierarchy, joint palette, inverse-bind interpretation and current transforms; verify admitted animation/skin data rather than equating node names with an executable rig |
| [Blender armature modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html) | Inspect deformation choices and preserve-volume behavior in that tool, then separately verify the actual export/import consumer |
| [UniRig paper](https://arxiv.org/abs/2504.12451) and [official implementation](https://github.com/VAST-AI-Research/UniRig) | Learned skeleton and skinning acquisition can reduce manual work; inferred controls still need semantic characterization, supported conversion and pose/motion inspection |
| [RigAnything](https://arxiv.org/abs/2502.09615) | Template-free joint/topology and skin-weight prediction is an optional rig source, not proof of usable controls for this asset or its target runtime |
| [TRELLIS.2 official implementation](https://github.com/microsoft/TRELLIS.2) | Image-to-3D geometry/material acquisition is separate from rigging and animation; check current platform and device requirements before adopting a local setup |
| [Hunyuan3D](https://github.com/Tencent-Hunyuan/Hunyuan3D-2) | Shape/material generation may provide a fixed source for direct use or supported recovery; select based on required edits and deformation |
| [SMPL](https://smpl.is.tue.mpg.de/) and [AMASS](https://amass.is.tue.mpg.de/) | Parametric bodies and motion collections carry their own skeleton, pose, shape and rights conventions; do not assume equivalence with AutoMovie's Human or a generic imported rig |

[Asset workflows](workflows.md), [rigging](rigging.md) and [inspection](inspection.md) own application. [Motion references](../motion/research.md) cover retargeting and contact. Compare source and reconstruction independently where recovery is chosen; research claims never waive fixed-source provenance or rendered-use checks.
