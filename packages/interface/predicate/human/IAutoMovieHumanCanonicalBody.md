# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IBody

## @evidence contracts/development/common.md#meaningful-documentation

The type names the canonical T-pose rig and distinguishes its contact profile from the full ordered set of Human joints.

## @evidence contracts/development/design.md#principled-representation

The evaluator's rig has canonical bone names. The retained Human joints have explicit carriers where a noncanonical joint accompanies a canonical bone.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The display returns Human-order bones from the same prepared joints the profile consumed. The runtime place operation consumes the canonical skeleton and each joint's carrier.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies the rest joint, leaf tip, positive girth radius and optional heel point in canonical metres.

## @evidence contracts/development/design.md#principled-representation

Each retained joint carries a rig bone and canonical position. For a stock foot, the heel-plane point follows the final ankle placement. Its absence retains the skeleton-only geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The display reads rest position, tip, heel and radius, and posed placement reads the carrier. The all-joint identity and hierarchy remain reusable by both consumers.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPlacement

## @evidence contracts/development/common.md#meaningful-documentation

The fields identify a Human joint's world point in canonical metres and its rotation from rest.

## @evidence contracts/development/design.md#principled-representation

A full world point and quaternion specify each spatial placement without reconstructing a transform from joint offsets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The canonical evaluator produces one entry per retained joint, and the display reflects its point and quaternion into the Human registration frame.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPrepareOptions

## @evidence contracts/development/common.md#meaningful-documentation

Preparation requires a body mass in kilograms and an explicit rig and profile identity.

## @evidence contracts/development/design.md#principled-representation

The mass and identity are required for the canonical physical body. The numerical owner derives the per-part mass distribution.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The preparation owner passes these two caller choices to the rig and profile builders. Pose, measurements and drawing options belong to their own boundaries.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IBody.skeleton

## @evidence contracts/development/common.md#meaningful-documentation

The canonical rig provides the frame and joint hierarchy used for pose evaluation.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IBody.profile

## @evidence contracts/development/common.md#meaningful-documentation

The contact and mass profile pairs with the same rig bone addresses.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IBody.joints

## @evidence contracts/development/common.md#meaningful-documentation

The retained joints give the complete drawable order and carrier assignment.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.bone

## @evidence contracts/development/common.md#meaningful-documentation

The Human joint id remains stable even when the canonical rig lacks it.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.parent

## @evidence contracts/development/common.md#meaningful-documentation

The Human parent identifies the retained hierarchy, separate from the carrier.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.carrier

## @evidence contracts/development/common.md#meaningful-documentation

Forward kinematics reads the pose of this canonical rigid attachment.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.position

## @evidence contracts/development/common.md#meaningful-documentation

The rest point is canonical metres, before a supplied pose.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.tip

## @evidence contracts/development/common.md#meaningful-documentation

The endpoint is canonical metres, with null denoting a child-owned end.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.radius

## @evidence contracts/development/common.md#meaningful-documentation

The stock ring owner reads this girth radius in metres.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IJoint.heel

## @evidence contracts/development/common.md#meaningful-documentation

Canonical display reflects this optional rear foot plane point like its joint.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPlacement.bone

## @evidence contracts/development/common.md#meaningful-documentation

The id connects the world placement to its retained Human joint.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPlacement.position

## @evidence contracts/development/common.md#meaningful-documentation

The canonical evaluator places the joint's centre in world metres.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPlacement.rotation

## @evidence contracts/development/common.md#meaningful-documentation

The quaternion describes rotation from the canonical T-pose.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPrepareOptions.mass

## @evidence contracts/development/common.md#meaningful-documentation

The profile receives this explicit mass in kilograms for its part distribution.

# src/human/IAutoMovieHumanCanonicalBody.ts#IAutoMovieHumanCanonicalBody.IPrepareOptions.id

## @evidence contracts/development/common.md#meaningful-documentation

The rig and contact profile use the same caller-supplied identity.
