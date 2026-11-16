# Conditioning

Conditioning uses a render to guide an image's pose, camera and shape, while frozen canon references supply appearance. Choose the inputs under [model documentation](SKILL.md#model-documentation).

## Routes

When an endpoint accepts a render as an ordinary reference image, label its role as pose and camera and name what must match. Use a clear pose with every limb visible. This reference and any layout boxes guide the result; they do not impose exact geometry.

For stronger structural guidance, choose a checkpoint and endpoint with compatible pose, depth, edge or normal controls. Match the adapter to the base model and the control's documented convention. Use its recommended strengths, with masks where supported, and align every channel to the output size.

To restyle the render itself, combine image-to-image strength with structural controls where supported. Neither controls nor a fixed seed guarantee identical pixels; compare the output's pose, silhouette and camera against the render under [shot frames](#shot-frames).

Render controls from the scene rather than estimate them from the hint's RGB image. Match the adapter's convention under [control channels](../../motion/control-channels.md#channel-alignment), and a coarse shape's strength under [dense channels](../../motion/control-channels.md#dense-channels).

## Shot frames

A video model that starts from a frame takes the look from it while the hint gives the motion, and the take drifts where the two disagree on pose or camera.

Render the hint's first frame at the video model's output size and aspect, cropping when image-model sizes differ. Align the canon references' aspect where the generator uses an input to set it.

Generate the shot frame from the render and canon references through a route above, with [canon-reference wording](../canon-references.md#prompts). [Overlay](../../visual-debugging/comparison.md#reading-the-difference) the result on the render and repair displaced silhouettes, horizon or facing.

Make a last frame or a keyframe the same way, from the hint's frame there, where the model takes one and the shot needs it: a matched cut, an outcome a still-frame model must keep, a subject that enters after the first frame, or a look that a request taking the hint only as a reference must hold.

## Place angles

Make a place's view at each camera angle a scene uses by rendering the set's coarse form from that shot's camera and restyling it against the canon plate, so every angle keeps one layout.

## Control images

A subject whose build or shape departs from what the model draws by default, such as a child or an unusual object, takes a control image beside its canon reference prompt. Render it from the subject's entity in a neutral pose and pass it loosely, as [dense channels](../../motion/control-channels.md#dense-channels) sets.
