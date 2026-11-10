# Research

Use primary sources to choose a method and understand its limits, then read the contracts of the packages in use and inspect the actual result. These references supply options, not supported features, mandatory dependencies or reproduced benchmark results. Model, code and data licenses and hardware support are separate checks at adoption; a research preview is not an accepted asset.

| Primary source | Decision informed here |
| --- | --- |
| [Khronos glTF skinning tutorial](https://github.com/KhronosGroup/glTF-Tutorials/blob/main/gltfTutorial/gltfTutorial_020_Skins.md) and [glTF specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html) | Distinguish scene hierarchy, joint palette, inverse-bind interpretation and current transforms; verify admitted animation and skin data rather than equating node names with an executable rig |
| [Blender armature modifier](https://docs.blender.org/manual/en/latest/modeling/modifiers/deform/armature.html) | Inspect deformation choices and preserve-volume behavior in that tool, then verify the actual export and import consumer separately |
| [UniRig paper](https://arxiv.org/abs/2504.12451) and [official implementation](https://github.com/VAST-AI-Research/UniRig) | Learned skeleton and skinning acquisition can reduce manual work; inferred controls still need semantic characterization, supported conversion and pose and motion inspection |
| [RigAnything](https://arxiv.org/abs/2502.09615) | Template-free joint, topology and skin-weight prediction is an optional rig source, not proof of usable controls for this asset or its target runtime |
| [TRELLIS official implementation](https://github.com/microsoft/TRELLIS.2) | Image-to-3D geometry and material acquisition is separate from rigging and animation; check current platform and device requirements before adopting a local setup |

[Diffusion](diffusion.md), [Recovery](recovery.md), [Rigging](rigging.md) and [Visual Debugging](visual-debugging.md) own application. Research claims never waive fixed-source provenance or rendered-use checks.
