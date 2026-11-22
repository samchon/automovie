# Conditioning

Conditioning uses a render to guide an image's pose, camera and shape, while frozen canon references supply appearance. Choose the inputs the chosen model's documentation admits.

## Routes

When an endpoint accepts a render as an ordinary reference image, label its role as pose and camera and name what must match. Use a clear pose with every limb visible. This reference and any layout boxes guide the result without imposing exact geometry.

Choose compatible controls, checkpoint, endpoint and adapter. Render controls from the scene in the adapter's convention under [channel alignment](../../motion/control-channels.md#channel-alignment). Match output size and use supported masks and strengths. See [dense channels](../../motion/control-channels.md#dense-channels) for coarse shapes.

To restyle the render itself, combine image-to-image strength with structural controls where supported. Neither controls nor a fixed seed guarantee identical pixels; compare the output's pose, silhouette and camera against the render under shot frames.

## Shot frames

A video model that starts from a frame takes the look from it while the hint gives the motion, and the take drifts where the two disagree on pose or camera.

Render the hint's first frame at the video model's output size and aspect, cropping when image-model sizes differ. Align the canon references' aspect where the generator uses an input to set it.

Generate the shot frame from the render and canon references through a route above, with the canon references' prompt wording. [Overlay](../../visual-debugging/comparison.md#reading-the-difference) the result on the render and repair displaced silhouettes, horizon or facing.

When supported, derive needed last frames or keyframes from matching hint frames for cuts, still-frame outcomes, later entrances or appearance in loose-reference requests.

## Place angles

Make a place's view at each camera angle a scene uses by rendering the set's coarse form from that shot's camera and restyling it against the canon plate, so every angle keeps one layout.

## Control images

For shapes a model renders poorly by default, add a neutral control render from the entity beside its canon reference. Apply it loosely under [dense channels](../../motion/control-channels.md#dense-channels).
