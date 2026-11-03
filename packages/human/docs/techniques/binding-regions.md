# Binding and neutral regions

The rig's skin binding and the anatomical neutral are divided into pieces, one rule each, so a region can be estimated, skinned and checked alone from fixed inputs instead of generating the whole body.

## Fixed inputs

`AutoMovieHumanBindingInputs.derive(calibration, scale)` is everything the binding reads from a body: the bind skeleton with each segment's girth, the skin of every chain as rings of 48 phases (the binding reads every fourth), the anatomical neutral, each joint's largest turn, the crotch's height and the lips' contact line. A weight is a function of a place and this record alone, so `AutoMovieHumanRig.fromInputs(inputs)` builds the same rig as `prepare(calibration, scale)` without a calibration. The shared fixture (`packages/human/.shots/fixtures/f1`) holds f1's calibration, so its inputs derive in seconds and nobody generates the person again. Dividing the rig moved no weight: the baseline is the unsplit rig's four weights for all 315,308 vertices of f1's bind skin, kept in the fixture beside the poses' placements.

## Binding regions

Each region is a file exporting `region: IAutoMovieHumanBindingRegion`, which names the joints it owns and states only what differs from a hinge: its capsule, the end of its segment, its cut's normal and plane, and what its limb needs once it exists. `AutoMovieHumanBindingRegions` lists them top to bottom; `AutoMovieHumanBindingTree` finds a joint's region and knows no region itself.

| Region | Piece | Rule |
| --- | --- | --- |
| Lumbar, thoracic, cervical | `AutoMovieHumanLumbarBinding`, `ThoracicBinding`, `CervicalBinding` | Hinges of the trunk's column; the chest's capsule narrows to the skin's depth at the neck; the neck's segment ends at the head's joint |
| Head, jaw, lips | `AutoMovieHumanHeadBinding`, `JawBinding`, `LipBinding` | The head a ball from chin to crown in a quintic contest with the neck; jaw planes at the hinge; share by side of the lips' contact line |
| Girdle, glenohumeral, deltoid | `AutoMovieHumanGirdleBinding`, `ShoulderBinding`, `DeltoidBinding` | Clavicle plane square to itself with a capsule that swells from a line; the arm's wider cut; where the arm's cut lies over the deltoid |
| Axilla | `AutoMovieHumanAxillaBinding` | Capsule band between arm and trunk, capped by the arm's girth and the bind's gap |
| Elbow, wrist | `AutoMovieHumanElbowBinding`, `WristBinding` | Hinges of the arm |
| Thumb | `AutoMovieHumanThumbCmcBinding`, `ThumbMcpBinding`, `ThumbIpBinding` | Thenar capsule with the palm as rival; the thumb's two hinges |
| Fingers | `AutoMovieHumanKnuckleBinding`, `FingerPipBinding`, `FingerDipBinding` | Band against neighbours at the knuckle (0.8 of a radius at least, a radius at most); the two interphalangeal hinges |
| Hip, groin, crotch | `AutoMovieHumanHipBinding`, `GroinBinding`, `CrotchBinding` | Plane leaning forward and outward; the midline's fall over the half pelvis; the release from the crotch down, ending before the knee |
| Knee, ankle, toes | `AutoMovieHumanKneeBinding`, `AnkleBinding`, `ToeBinding` | Hinges of the leg; the foot keeps the shank's plane; the toes one channel |

Shared mathematics: `AutoMovieHumanHingeBinding` (the default capsule, normal and plane, and the per-sector size), `AutoMovieHumanJointTransition` (per-sector ramps), `AutoMovieHumanSkinStep`, `AutoMovieHumanLimbCapsule` (capsule heights and depths), `AutoMovieHumanBindingInfluence` (a place's share down the tree) and `AutoMovieHumanBindingQuantize` (strongest four in thousandths). `AutoMovieHumanRig` only composes them with `AutoMovieHumanRigBones` and `AutoMovieHumanRigPose`. The gluteal skin has no piece of its own yet: it is the hip plane's posterior sectors.

## Neutral pieces

`AutoMovieHumanNeutral` composes one piece per joint, parent before child, on the turns of `AutoMovieHumanNeutralTurn`: `NeutralShoulder` (the least abduction at which the arm's own skin clears the trunk and the leg), `NeutralElbow`, `NeutralForearm` (thumbs forward), `NeutralWrist`, `NeutralThumbCmc` (toward the index metacarpal's line as far as the thumb's skin stays out of the hand's), `NeutralThumbMcp`, `NeutralThumbIp`, `NeutralKnuckle` (neighbouring fingers parted in the palm's plane by the least angle at which their skins meet from the web on), `NeutralFingerPip`, `NeutralFingerDip`, `NeutralHip` (the least abduction at which the thighs stay on their own sides of the midline), `NeutralKnee` and `NeutralAnkle` (the foot straight ahead). Every other bone rides its parent. The separating pieces read the skin's rings of the chains `AutoMovieHumanNeutral.READS` names.
