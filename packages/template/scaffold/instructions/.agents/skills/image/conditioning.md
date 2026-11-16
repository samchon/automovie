# Conditioning

Conditioning holds a generated image to a shape rendered from the production's own scenes: a shot frame to the hint's pose and camera, a place's angle to its set, an unusual build to its entity. The render gives the structure and the frozen canon references give the look.

## Routes

Most hosted image models take no control input, so a render reaches them as one more input image, which it reads for meaning rather than pixel by pixel and follows only roughly. Label it "pose and camera reference only", name in words what to match, such as the arm position, the body's angle to the camera and the gaze, and render a clean pose with every limb visible. Region boxes, where a model takes them, are a strong hint rather than a constraint.

An open model, or one of the few hosted endpoints that do, takes control images through control adapters for pose, depth, edges or normals, so it holds the render closely and repeats from a fixed seed; choose this route when a shot frame must keep the hint's pose and camera exactly. Give each adapter its own conditioning scale, start below full strength and raise it until the silhouette holds, mask each adapter to its region where they overlap, and resize every control image to the output size. To restyle the render itself as the starting image, keep its silhouette with a low to middle strength, the share of the steps generated afresh, together with a structural adapter.

Render each control image from the scene, such as depth, normals or the pose skeleton, rather than estimating it from the hint render, because the scene's values are exact; [control channels](../motion/control-channels.md#channel-alignment) owns rendering them to the adapter's convention, and [dense channels](../motion/control-channels.md#dense-channels) sets how strongly a shape is held.

## Shot frames

A video model that starts from a frame takes the look from it while the hint gives the motion, and the take drifts where the two disagree on pose or camera.

Render the first frame of the request's hint at the video model's exact output size and aspect, cropping when the image model's sizes differ, and crop the canon references given beside it to the same aspect, because some generators take the output's aspect from an input image. Generate the shot frame from that render and the canon references through a route above, prompted as [canon references](canon-references.md#prompts) are. Then [overlay](../visual-debugging/comparison.md#reading-the-difference) the generated frame on the render, and generate it again when silhouettes, horizon or facing move.

Make a last frame or a keyframe the same way, from the hint's frame there, where the model takes one and the shot needs it: a matched cut, an outcome a still-frame model must keep, a subject that enters after the first frame, or a look that a request taking the hint only as a reference must hold.

## Place angles

Make a place's view at each camera angle a scene uses by rendering the set's coarse form from that shot's camera and restyling it against the canon plate, so every angle keeps one layout.

## Control images

A subject whose build or shape departs from what the model draws by default, such as a child or an unusual object, takes a control image beside its canon reference prompt. Render it from the subject's entity in a neutral pose and pass it loosely, as [dense channels](../motion/control-channels.md#dense-channels) sets.
