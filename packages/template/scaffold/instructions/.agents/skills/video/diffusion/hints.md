# Hints

A video model takes the motion hint in one of a few ways, the chosen model decides which, and each way keeps a different part of the hint; [video models](models.md) shows which current models take which.

| Way | Keeps | Prefer when | Watch for |
| --- | --- | --- | --- |
| Editing or restyling the hint video | Positions, timing and camera closely, while the model repaints the surfaces | The film must follow the hint closely | An edit can zoom or recenter the frame; say that the framing holds, and check by overlay |
| The hint as a reference video | Motion and camera loosely, in a new generation, with [keyframe images](../../image/conditioning.md#shot-frames) holding the look at their instants | The look matters more than exact positions | The wording decides whether a video is edited or referenced, and a reference supplies only what the prompt says it does |
| A gray-layout adapter | The camera path and each form's placement, while it replaces the forms | Detailed forms must replace the coarse ones while camera and placement hold | Shapes still drift, and some adapters need a first frame made from the hint |
| Control channels through adapters | Each channel at its own strength, optionally masked over frames and regions | Contacts and positions must hold exactly | A dense channel keeps the coarse shape, as [dense channels](../../motion/control-channels.md#dense-channels) sets; combine channels only where the model's documentation allows |
| Geometry and material channels to a neural renderer | Geometry, materials and camera, while the model computes light and shading | The film's detail options are built and the picture must look photographed | Coarse forms come back coarse; light is given separately, often as an environment map |
| Still frames | Only the pose and camera of the frames given | The model takes no video | The motion between frames is the model's, so prompt it as [still frames](prompts.md#still-frames) sets |
| Motion transfer onto a character image | One figure's body motion | A single performer | Only one figure transfers |
| Dialogue audio with a pose video | Lip sync and gesture from the accepted speech, and the pose where the model takes one | Speech carries the shot, at the speech-and-reaction level | Few models take both; [other roles](models.md#other-roles) shows one |
