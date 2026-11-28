# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile

## @evidence contracts/development/common.md#meaningful-documentation

The profile owns one neutral body frame and per-bone geometry and inertia. The declaration gives the caller the units, material and joint references, and the diagnostic operation that reads the record without changing it.

## @evidence contracts/development/design.md#principled-representation

The neutral body frame owns total mass and centre of mass in kilograms and metres. Each segment supplies bone-local colliders and principal inertia, with attached equipment assigned to that segment. The joint tree identifies the one root and links known segment IDs. The engine profile validator checks those references, neutral anchor agreement, summed mass and centre of mass. The stock polygon profile derives its hulls from the drawing rings and supplies segment-neutral transforms and consistent totals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The physical profile supplies each segment transform, mass, inertia and collision geometry to the simulation binder, and the joint and material records supply its constraints and contact response. The same segment shapes let kinematic readers locate body surfaces. Declared self-contact pairs belong to the profile because the solver and contact audit consume them for the same body. The optional head-local station lets the provider place its ear rays without changing those shapes.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.id

## @evidence contracts/development/common.md#meaningful-documentation

The provider supplies a profile identifier. The validator reports the id field if trimming it leaves an empty string.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.mass

## @evidence contracts/development/common.md#meaningful-documentation

Equipment contributes to the owning segment before summation. The validator compares the positive declared mass with the segment sum in kilograms, allowing an absolute error of 1e-8 times the larger of one kilogram and the declared mass.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.centerOfMass

## @evidence contracts/development/common.md#meaningful-documentation

Validation rotates each bone-local centre by its neutral rotation and adds the neutral translation before weighting it by segment mass. The Euclidean distance from this derived centre to the declared body-frame centre may be at most 1e-8 metres.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.segments

## @evidence contracts/development/common.md#meaningful-documentation

Admission requires at least one segment. Bone names are validated for uniqueness and nonblank text, and each segment supplies a nonempty collision shape array. Joints look up the bone names independently of segment order.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.joints

## @evidence contracts/development/common.md#meaningful-documentation

Each child names a unique parent and both IDs resolve to known distinct segments. The validator checks for exactly one root and rejects cycles. Neutral anchors are transformed into the body frame and compared with a tolerance of 1e-8 metres.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.collisionExclusions

## @evidence contracts/development/common.md#meaningful-documentation

The validator admits each unordered pair of distinct known bones once and requires a nonblank reason. The bound contact filter combines that list with the joint neighbours and same-segment exclusions. It applies the result to rigid contact and sensor overlap.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.materials

## @evidence contracts/development/common.md#meaningful-documentation

The material catalogue uses nonblank IDs unique within the profile. Validation resolves every shape and contact-only shape material in this catalogue and checks its physical response ranges.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.earRayOrigin

## @evidence contracts/development/common.md#meaningful-documentation

A provider may identify the head-local neutral ray station in metres. Both full region reads and tangent offsets trace the actual head collider from the supplied station. Existing profiles that omit it retain the bounds-centre ray.

# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile.provenance

## @evidence contracts/development/common.md#meaningful-documentation

The provider records where its model parameters came from and the limits of their use. The validator requires nonblank text. Measurement and approximation details come from the provider.
