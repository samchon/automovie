# Hints

The chosen model determines how the motion hint reaches it, and each method preserves different information; [video models](models.md) gives current examples.

## Hint video and channels

### Editing and reference video

Edit or restyle the hint video when positions, timing and camera must follow it closely while surfaces change. An edit can zoom or recenter the frame; state that framing holds and check by overlay.

Use a reference video for loose placement, motion and camera. Use [keyframes](../../image/diffusion/conditioning.md#shot-frames) to hold appearance at their instants. Set each reference's role under [input roles](prompts.md#input-roles).

### Layout and control adapters

A gray-layout adapter replaces coarse forms with detailed ones while following the camera path and placement. Shapes can still drift, and some adapters need a first frame made from the hint.

Use control adapters for precise placements and contacts. Set strength and supported masks by channel. A [dense channel](../../motion/control-channels.md#dense-channels) also carries coarse shape. Combine channels only as documented.

### Geometry and material channels

For a photographed look on built detail, give a neural renderer geometry channels and the installed [material channel](../../motion/control-channels.md#channels-to-render), the `albedo` pass, and supply lighting separately. The renderer keeps geometry, base colors and camera.

## Still frames

When the model takes no video, still frames hold only their own poses and camera. The model generates the intervening motion, so prompt it under [still frames](prompts.md#still-frames).

## Character and speech animation

Motion transfer animates a character image from a performer's body motion, within the chosen model's supported figure count.

When speech carries the shot, accepted dialogue audio can drive lip sync and gesture, with a pose video where the model accepts both. Few models take both; [other roles](models.md#other-roles) gives an example.
