# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadBounds

## @evidence contracts/development/common.md#meaningful-documentation

The bounds and front query are in head-local metres. Optional stock sites override bounds-based face layout.

## @evidence contracts/development/design.md#principled-representation

The caller provides one actual rest envelope and a front-versus-Y/Z query in the same frame. The face builder refuses nonfinite or nonpositive bounds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These inputs give the face builder its surface and coordinate frame without exposing the rendering mesh or a physical profile.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadAnchors

## @evidence contracts/development/common.md#meaningful-documentation

Each site is a head-local Y/Z pair in metres. The renderer projects it onto the emitted shell when mounting.

## @evidence contracts/development/design.md#principled-representation

The two eye sites use anatomical side. The two other marks use the visible exits of the centered head contact-ray directions, which preserves the pre-pose frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The stock polygon drawing produces these sites, and the optional face builder consumes all four. The shell query supplies the anterior coordinate.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.buildFace

## @evidence contracts/development/common.md#meaningful-documentation

The method specifies caller mounting, finite admitted pose input, degree and millimetre controls, neutral defaults, unsupported expression reporting and disposal.

## @evidence contracts/development/implementation.md#principled-implementation

The renderer applies supported sided controls to its marks, resolves each mark against the front triangle query and keeps projected sites within the shell silhouette. Bounds and duplicate or invalid intensity inputs are refused before drawing.

## @evidence contracts/development/implementation.md#efficient-algorithms

One action lookup per mark and bounded geometry sizes limit the build. The returned face owns its materials and geometry. The polygon figure can retain the same marks across unchanged pose and expression values.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpression

## @evidence contracts/development/common.md#meaningful-documentation

The type documents sided FACS intensities, missing-unit neutrality and reported unsupported activations.

## @evidence contracts/development/design.md#principled-representation

A unit and side identify each intensity. The builder expands bilateral values and rejects duplicate time-independent requests.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The drawing reads actions and optional named mouth values. It reports tongue and viseme requests through its unsupported list.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpressionMouth

## @evidence contracts/development/common.md#meaningful-documentation

Named lip controls accept a scalar or an explicit pair. Presence of tongue or visemes is reported.

## @evidence contracts/development/design.md#principled-representation

Optional fields distinguish requested native lip control from alternate expression forms that this owner does not evaluate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The mouth reader passes named lip controls to the same admitted action map as explicit units, and preserves unsupported-field identity.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPose

## @evidence contracts/development/common.md#meaningful-documentation

The record describes already admitted eye angles and jaw motion in the drawing's head frame.

## @evidence contracts/development/design.md#principled-representation

Optional group fields default to neutral. Their own types distinguish angular gaze and millimetre translation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The drawing consumes only eye and jaw articulation. The posed parent owns head and neck movement.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseJaw

## @evidence contracts/development/common.md#meaningful-documentation

Each optional displacement is measured in millimetres, with lateral direction toward the anatomical left.

## @evidence contracts/development/design.md#principled-representation

The builder converts all three controls to metres and applies them to the optional mouth marks.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This type exposes the shape controls the current drawing actually reads. It does not name unrelated bare-skull geometry.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseEyes

## @evidence contracts/development/common.md#meaningful-documentation

The type records independent anatomical eyes with optional vertical and horizontal degree motion.

## @evidence contracts/development/design.md#principled-representation

Each eye's optional fields default to zero. The calculations resolve vertical and horizontal values in the head-local frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Both named eye inputs are consumed directly in pupil placement.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IFace

## @evidence contracts/development/common.md#meaningful-documentation

The drawing exposes a mountable group, unsupported controls and disposal ownership.

## @evidence contracts/development/design.md#principled-representation

The object holds the generated marks in local metres. Its separate resource callback owns the mark geometry and materials.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The polygon figure or manual caller mounts and retires this one output without transferring the borrowed head.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadBounds.min

## @evidence contracts/development/common.md#meaningful-documentation

The minimum emitted head coordinate is in the attachment's unposed metre frame.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadBounds.max

## @evidence contracts/development/common.md#meaningful-documentation

The maximum emitted head coordinate is in the same unposed metre frame.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadBounds.frontAt

## @evidence contracts/development/common.md#meaningful-documentation

The query reads the most anterior triangle X for local Y and Z, or undefined beyond the shell.

## @evidence contracts/development/implementation.md#principled-implementation

The stock renderer supplies a ray query over its own indexed head surface. Intersections are in the same unposed metre frame as the attachment sites, and the largest X is the frontmost surface.

## @evidence contracts/development/implementation.md#efficient-algorithms

The ray scans the existing index once and reuses four scratch vectors throughout the scan. It creates no renderer resource and releases all scratch when the call returns.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadBounds.anchors

## @evidence contracts/development/common.md#meaningful-documentation

Present stock sites take precedence over bounding-box proportions for the optional drawing.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadAnchors.leftEye

## @evidence contracts/development/common.md#meaningful-documentation

The anatomical left rest eye supplies the Y/Z position of that eyeball mark.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadAnchors.rightEye

## @evidence contracts/development/common.md#meaningful-documentation

The anatomical right rest eye supplies the Y/Z position of that eyeball mark.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadAnchors.nose

## @evidence contracts/development/common.md#meaningful-documentation

The nose ray's visible shell exit supplies the mark's Y/Z position.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadAnchors.mouth

## @evidence contracts/development/common.md#meaningful-documentation

The mouth ray's visible shell exit supplies the neutral mark's Y/Z position.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpression.units

## @evidence contracts/development/common.md#meaningful-documentation

Explicit named action intensities identify a side or both sides. Absent controls are neutral.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpression.mouth

## @evidence contracts/development/common.md#meaningful-documentation

The mouth object supplies optional named lip values and unsupported controls.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpressionMouth.lips

## @evidence contracts/development/common.md#meaningful-documentation

A scalar is bilateral. A pair gives independent intensities in the admitted [0,1] interval.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpressionMouth.tongue

## @evidence contracts/development/common.md#meaningful-documentation

Presence adds the tongue capability name to the unsupported report.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IExpressionMouth.visemes

## @evidence contracts/development/common.md#meaningful-documentation

Presence adds the viseme capability name to the unsupported report.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPose.eyes

## @evidence contracts/development/common.md#meaningful-documentation

Admitted eye angles use degrees. Omitted coordinate values are zero.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPose.jaw

## @evidence contracts/development/common.md#meaningful-documentation

Admitted displacement uses millimetres. Omitted coordinate values are zero.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseJaw.opening

## @evidence contracts/development/common.md#meaningful-documentation

Positive opening creates the visible open-mouth drawing.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseJaw.protrusion

## @evidence contracts/development/common.md#meaningful-documentation

Forward displacement adds to the mouth marks' head-local X values.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseJaw.lateralExcursion

## @evidence contracts/development/common.md#meaningful-documentation

Lateral displacement moves the mouth marks toward anatomical left when positive.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseEyes.left

## @evidence contracts/development/common.md#meaningful-documentation

The left controls drive the fill of the anatomical left pupil.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IHeadPoseEyes.right

## @evidence contracts/development/common.md#meaningful-documentation

The right controls drive the fill of the anatomical right pupil.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IFace.object

## @evidence contracts/development/common.md#meaningful-documentation

The group keeps the generated marks in local head metres until the host mounts it.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IFace.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

The read-only list names requested controls absent from the supported cartoon subset.

# src/scene/AutoMovieRenderHumanCartoon.ts#AutoMovieRenderHumanCartoon.IFace.dispose

## @evidence contracts/development/common.md#meaningful-documentation

The disposer releases the geometry and materials created for the face.

## @evidence contracts/development/implementation.md#principled-implementation

The face retires each geometry recorded during creation and its own three shared materials. The caller retains ownership of the head it attached the face to.

## @evidence contracts/development/implementation.md#efficient-algorithms

Disposal visits the face's geometry list once and releases each of three shared materials once. It only follows the resource records the face created.
