# VRM 1.0 lookAt

VRM Consortium, VRM 1.0 specification, `VRMC_vrm-1.0/lookAt.md`, https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm-1.0/lookAt.md.

## Licence

Specification text published by the VRM Consortium. `AutoMovieHumanoidBone` already follows the VRM 1.0 humanoid vocabulary.

## What it says

- `type: "bone"` drives gaze as the local rotation of the humanoid `leftEye` and `rightEye` bones (Euler angles); `type: "expression"` drives the `lookUp`, `lookDown`, `lookLeft` and `lookRight` expressions by weight.
- Range maps: the gaze angle's magnitude is capped at `inputMaxValue`, normalized by it and multiplied by `outputScale`, the largest bone rotation or expression weight produced.
- Eye bones have separate inner and outer horizontal ranges per eye; expressions use only the outer range because one expression moves both eyes.

## What Human takes

The model-declared choice between bone gaze and expression gaze is carried by `IAutoMovieLookAt` and consumed by engine `resolveLookAt` through the viewer player; see the [core survey](../core/gaps.md). Human's separate eyeballs on `leftEye` and `rightEye` motivate bone gaze, but that shared path does not establish Human's eye signs, lid following or rendered behavior.
