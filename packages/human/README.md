# @automovie/human

Human currently contains parameter types and closed value enums. It has no geometry generator, converter, editor, validator, measurement implementation or viewer connection.

## Body parameters

`IAutoMovieHumanBodyParameters` is the primary body-authoring document. It separates 28 named control values with pins, 25 independent course measurements and two read-only height diagnostics. Unknown values are null.

| Group | Channels |
| --- | --- |
| Global | Height, Fat, Masculine/Feminine, Muscularity |
| Upper torso | Chest, Bust Span, Underbust, Front Interscye Length, Neck to Waist, Across Shoulder, Shoulder to Apex |
| Lower torso | Waist, Hip, High Hip |
| Neck | Neck Base, Neck, Neck Length |
| Arms | Upper Arm Length, Lower Arm Length, Bicep, Elbow, Wrist, Forearm |
| Legs | Inseam, Thigh, Knee, Calf |
| Hands | Hand Circumference |
| Diagnostics | Rise, Shoulder Height; read-only |

All length values use mm. Fat, Masculine/Feminine and Muscularity are unitless authoring coordinates, not clinical composition or the older traits' normalized offsets. Source-unit conversion belongs at an import boundary; there is no public alternative length unit.

A control value is not an independent measurement. A pin states that the authored value should be fixed by a future implementation; no current code edits values, fits constraints or checks feasibility. UI ranges and request history are not part of the body document. Course names alone do not establish clinical landmarks, posture conversion or left/right correspondence.

## Other contracts

`IAutoMovieHumanIdentity` retains detailed physical measurements and appearance semantics. `IAutoMovieHumanTraits` describes beginner inputs but has no current converter. Pose, expression, appearance and measurement types remain declarations only. No automatic conversion between these contracts and the body-authoring document is supplied.

The public entry exports named interfaces from `structures` and closed value enums from `typings`. Field documentation defines units and measurement meanings. Runtime behavior has been removed.
