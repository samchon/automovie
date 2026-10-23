# VRM 1.0 lookAt

VRM Consortium, VRM 1.0 specification, `VRMC_vrm-1.0/lookAt.md`, https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/lookAt.md.

## Licence

Specification text published by the VRM Consortium.

## What it says

- `type: "bone"` drives gaze as the local rotation of the humanoid `leftEye` and `rightEye` bones (Euler angles); `type: "expression"` drives the `lookUp`, `lookDown`, `lookLeft` and `lookRight` expressions by weight.
- Range maps: the gaze angle's magnitude is capped at `inputMaxValue`, normalized by it and multiplied by `outputScale`, the largest bone rotation or expression weight produced.
- Eye bones have separate inner and outer horizontal ranges per eye; expressions use only the outer range because one expression moves both eyes.
