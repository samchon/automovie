# Hints

The chosen model determines how the motion hint reaches it, and each method preserves different information; [video models](models.md) gives current examples.

## Hint video and channels

### Editing and reference video

Edit or restyle the hint video when positions, timing and camera must follow it closely while surfaces change. An edit can zoom or recenter the frame; state that framing holds and check by overlay.

Use the hint as a reference video when appearance matters more than exact placement. Motion and camera are followed loosely, with [keyframe images](../../image/diffusion/conditioning.md#shot-frames) holding appearance at their instants. The prompt's [input roles](prompts.md#input-roles) say whether the hint is edited or referenced and what each reference supplies.

### Layout and control adapters

A gray-layout adapter replaces coarse forms with detailed ones while following the camera path and placement. Shapes can still drift, and some adapters need a first frame made from the hint.

For contacts and positions that must hold exactly, use the model's control adapters, with each channel's strength and any supported frame or region masks. A [dense channel](../../motion/control-channels.md#dense-channels) also holds the coarse shape; combine channels only where the model's documentation allows.

### Geometry and material channels

When the film's detail is built and the target is a photographed look, give geometry and material channels to a neural renderer. It keeps geometry, materials and camera while computing light and shading; supply lighting separately, often as an environment map. Coarse forms remain coarse.

## Still frames

When the model takes no video, still frames hold only their own poses and camera. The model generates the intervening motion, so prompt it under [still frames](prompts.md#still-frames).

## Character and speech animation

Motion transfer animates a character image from a performer's body motion, within the chosen model's supported figure count.

When speech carries the shot, accepted dialogue audio can drive lip sync and gesture, with a pose video where the model accepts both. Few models take both; [other roles](models.md#other-roles) gives an example.
