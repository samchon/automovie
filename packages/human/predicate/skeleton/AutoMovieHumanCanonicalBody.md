# src/skeleton/AutoMovieHumanCanonicalBody.ts#AutoMovieHumanCanonicalBody.prepare

## @evidence contracts/development/common.md#meaningful-documentation

Preparation takes Human measurements and explicit mass in kilograms and id. It returns a reusable canonical T-pose skeleton, joint list and matching physical profile in the right-handed metre frame. The profile carries a neutral, head-local ear ray station in metres.

## @evidence contracts/development/implementation.md#principled-implementation

The bind is scaled and reflected before limb alignment. The thigh and shank point down while the child foot's bind orientation is restored. Subtracting the minimum foot sphere ordinate places the floor at zero. The reflected heel offset therefore follows only the final ankle translation and is shared by the stored joint and physical profile. Preparation reflects the measured Human ear offset into the canonical axes and applies the same stature scale as the bind.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each call derives one stock bind and girth set and prepares one skeleton, one joint list and one profile. Independent readers place the prepared body or draw it at new poses without repeating those preparation calculations.

# src/skeleton/AutoMovieHumanCanonicalBody.ts#AutoMovieHumanCanonicalBody.place

## @evidence contracts/development/common.md#meaningful-documentation

The supplied pose belongs to the prepared body's canonical skeleton. The returned metre-space joint centres and carrier rotations follow the order of the body's original Human joints.

## @evidence contracts/development/implementation.md#principled-implementation

Resolve the posed carriers with the same canonical axes and rest frames as the rig. For each Human joint, subtract its carrier's rest origin, rotate that offset by the carrier's world rotation and add the carrier's world origin.

## @evidence contracts/development/implementation.md#efficient-algorithms

One forward-kinematics resolution and one parent-first rest-origin pass construct lookup maps for all joint placements. Each placement reads one carrier and returns values with the current array.

# src/skeleton/AutoMovieHumanCanonicalBody.ts#AutoMovieHumanCanonicalBody.display

## @evidence contracts/development/common.md#meaningful-documentation

The drawing reads rest bones, tips, radii and optional heels in Human-frame metres. Omitting the pose gives identity rest placements. The scene applies REFLECTION to the drawing parent to put that data in the canonical world.

## @evidence contracts/development/implementation.md#principled-implementation

Swapping X and Z takes each canonical rest point and each posed centre into the display frame. Conjugating the posed rotation by the reflection keeps offsets consistent with the centre. The same swap applies to a supplied heel plane.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call builds the requested rest and placement arrays. Rest placement copies the returned bind positions and uses identity rotation; a posed read evaluates forward kinematics once through place. Both branches return fresh arrays.

# src/skeleton/AutoMovieHumanCanonicalBody.ts#AutoMovieHumanCanonicalBody.REFLECTION

## @evidence contracts/development/common.md#meaningful-documentation

The column-major matrix swaps X and Z, preserving Y and the homogeneous coordinate. MotionCaptureFigure and the installed passage put it on the Polygon drawing parent; three.js uses the reflected determinant when culling faces.
