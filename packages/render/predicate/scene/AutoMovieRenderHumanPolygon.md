# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawingHead

## @evidence contracts/development/common.md#meaningful-documentation

The type exposes the posed head group and its unposed local bounds, front query and optional stock anchors.

## @evidence contracts/development/design.md#principled-representation

The inherited head bounds, queries and anchors use one metre frame. The group carries the pose separately from unposed geometry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Face and equipment callers use the posed object as the parent while resolving attachment points against the shared unposed shell.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.build

## @evidence contracts/development/common.md#meaningful-documentation

The contract documents Human-frame rest bones and posed placements, optional palette and source-clock cues, head attachments and drawing ownership.

## @evidence contracts/development/implementation.md#principled-implementation

Rig and palette admission precede resources. The renderer lofts the exact engine ring points in each rest joint's frame, then applies its supplied pose once. The optional stock anchors follow the actual eye joints and shell exits.

## @evidence contracts/development/implementation.md#efficient-algorithms

It builds the bind mesh, palette and stable registries once. Subsequent pose updates reuse geometry and mutate only registered poses. The drawing disposes its own resources and borrows separately attached objects.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IPresentation

## @evidence contracts/development/common.md#meaningful-documentation

Presentation names the actor, admitted cues, pose clock and optional actor frame.

## @evidence contracts/development/design.md#principled-representation

The subject and source-time readers provide consistent inputs for cue selection. Optional actor placement defaults to identity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A single scene host supplies all pose and placement inputs. The drawing retains only those required for its own optional source-time sampler.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing

## @evidence contracts/development/common.md#meaningful-documentation

The type names geometry, parts, diagnostic groups, posed joints, synchronous mutation and disposal ownership.

## @evidence contracts/development/design.md#principled-representation

Named mesh and group collections share the original bone identities. Fixed resources live with the drawing and can be posed repeatedly.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scene host mounts the root and chooses pose, color and cleanup. Diagnostic callers get the same actual surface objects without another mesh.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildOptions

## @evidence contracts/development/common.md#meaningful-documentation

The options forward optional display overrides and an optional pose presentation.

## @evidence contracts/development/design.md#principled-representation

Colors use the same bone identity as the generated meshes. A supplied presentation enables the source-time draw port.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Simple static draws need neither option. The renderer owns conversion from option inputs to materials and source-pose callbacks.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps

## @evidence contracts/development/common.md#meaningful-documentation

The contract carries a compiled shot, exact actor, opening pose, source readers, frame grid and colors.

## @evidence contracts/development/design.md#principled-representation

The shot and actor identify admitted cues. The source rate and reader clocks specify how layers request the presented pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The body and frame remain owned by the shot host. Only the inputs needed to sample that actor enter this builder.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IShotActor

## @evidence contracts/development/common.md#meaningful-documentation

The result separates mounted-owned geometry and the admitted render-layer sampler.

## @evidence contracts/development/design.md#principled-representation

A layer samples the source frame of a single shot into an unchanged drawing. Both ports share the same source pose owner.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The scene host mounts and retires the geometry. The renderer invokes the sampler when preparing a layer.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.ICreateFigureProps

## @evidence contracts/development/common.md#meaningful-documentation

The builder accepts a neutral evaluator and optional colors by emitted bone identity.

## @evidence contracts/development/design.md#principled-representation

The supplied evaluator produces the exact bind bones and original placements used for a resting figure.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller may supply the Human evaluator or an otherwise compatible structural evaluator without exposing its hidden state.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IFigure

## @evidence contracts/development/common.md#meaningful-documentation

The result describes the mounted root, drawing, face capability reports and pose/retirement methods.

## @evidence contracts/development/design.md#principled-representation

Pose placement and optional cartoon rebuild share one resource owner. The drawing's geometry remains pinned to its admitted original rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The caller mounts one figure, then receives mutable pose and face updates through the same public owner.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.buildShotActor

## @evidence contracts/development/common.md#meaningful-documentation

The method states the compiled shot's frame grid and its pose and frame callbacks, plus ordinary drawing disposal.

## @evidence contracts/development/implementation.md#principled-implementation

The sampler reads the admitted layer's source frame and presents the associated pose and cue state. The scene host still owns mounting and disposal.

## @evidence contracts/development/implementation.md#efficient-algorithms

One opening drawing is prepared. Subsequent layer preparations use its existing mesh bindings and current source readers.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.createFigure

## @evidence contracts/development/common.md#meaningful-documentation

The method documents one neutral evaluation, pose reuse, optional expression rebuilding and returned ownership.

## @evidence contracts/development/implementation.md#principled-implementation

The figure builds its actual polygon drawing once and mounts a face against the real shell. It rebuilds the owned face only when requested face state changes by value.

## @evidence contracts/development/implementation.md#efficient-algorithms

Repeated pose placement updates existing transforms. A repeated identical expression avoids recreation and retirement of face geometry.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IFigure.place

## @evidence contracts/development/common.md#meaningful-documentation

The pose update accepts complete placed joints and optional already admitted head pose and expression.

## @evidence contracts/development/implementation.md#principled-implementation

The drawing accepts the evaluated placements and moves existing meshes. The figure updates face marks against the same head frame for a changed expression or pose input.

## @evidence contracts/development/implementation.md#efficient-algorithms

The figure reuses its bind drawing. Unchanged face request values retain face resources until replacement or disposal.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IFigure.dispose

## @evidence contracts/development/common.md#meaningful-documentation

Disposal is the terminal lifecycle for the owned face and underlying polygon drawing.

## @evidence contracts/development/implementation.md#principled-implementation

The figure retires its own face and calls drawing retirement. Later pose changes refuse.

## @evidence contracts/development/implementation.md#efficient-algorithms

It makes one owned retirement attempt per figure and retains existing error behavior.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawingHead.object

## @evidence contracts/development/common.md#meaningful-documentation

Attach owned face marks or equipment to this posed head-local group.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IPresentation.subject

## @evidence contracts/development/common.md#meaningful-documentation

The actor id admits only cues addressed to this drawing.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IPresentation.cues

## @evidence contracts/development/common.md#meaningful-documentation

The shot-local source cues must select disjoint bone subtrees.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IPresentation.poseAt

## @evidence contracts/development/common.md#meaningful-documentation

The reader supplies complete placed joints at shot-local source seconds.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IPresentation.actorFrameAt

## @evidence contracts/development/common.md#meaningful-documentation

A present reader gives the actor-to-shot rigid frame at the same source time.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.object

## @evidence contracts/development/common.md#meaningful-documentation

The caller mounts the actor-local group under its world placement.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.surface

## @evidence contracts/development/common.md#meaningful-documentation

The group contains the rigid meshes bound individually to exact bone ids.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.sections

## @evidence contracts/development/common.md#meaningful-documentation

The initially hidden group holds construction diagnostics matching those meshes.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.parts

## @evidence contracts/development/common.md#meaningful-documentation

The registry exposes actual bone-addressed meshes through the drawing lifetime.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.bones

## @evidence contracts/development/common.md#meaningful-documentation

The registry contains posed joint groups, including available non-emitted drivers.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.bindings

## @evidence contracts/development/common.md#meaningful-documentation

The same placement controls the surface and diagnostic objects for each bone.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.head

## @evidence contracts/development/common.md#meaningful-documentation

The head carries its own posed attachment and original local projection.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.setPose

## @evidence contracts/development/common.md#meaningful-documentation

The pose port updates existing registered placements and world matrices.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.drawAt

## @evidence contracts/development/common.md#meaningful-documentation

The port samples the optional presentation at shot-local source seconds.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.setPartColors

## @evidence contracts/development/common.md#meaningful-documentation

The palette port changes registered colors and restores defaults when omitted.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IDrawing.dispose

## @evidence contracts/development/common.md#meaningful-documentation

The drawing owns its retirement. Separately attached objects keep their own lifetime.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildOptions.partColors

## @evidence contracts/development/common.md#meaningful-documentation

Overrides are keyed by the same emitted bone ids and use RGB hex values.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildOptions.presentation

## @evidence contracts/development/common.md#meaningful-documentation

A supplied record enables the source-clock drawAt port.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.shot

## @evidence contracts/development/common.md#meaningful-documentation

The compiled shot supplies exact identity and authored polygon cues.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.subject

## @evidence contracts/development/common.md#meaningful-documentation

The subject identifies the staged actor within the shot.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.opening

## @evidence contracts/development/common.md#meaningful-documentation

Rest and placed joints establish the actual initial polygon drawing.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.poseAt

## @evidence contracts/development/common.md#meaningful-documentation

The deterministic reader consumes shot-local seconds.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.actorFrameAt

## @evidence contracts/development/common.md#meaningful-documentation

Optional actor rigid frames share the source clock used for poses.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.frameRate

## @evidence contracts/development/common.md#meaningful-documentation

The production grid converts the render layer's source frame to seconds.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IBuildShotActorProps.partColors

## @evidence contracts/development/common.md#meaningful-documentation

The selected actor's optional RGB values are keyed by emitted module.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IShotActor.drawing

## @evidence contracts/development/common.md#meaningful-documentation

Mount the owned polygon drawing in the compiled shot's scene.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IShotActor.drawLayer

## @evidence contracts/development/common.md#meaningful-documentation

The sampler reads the admitted layer and updates the same drawing.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.ICreateFigureProps.evaluate

## @evidence contracts/development/common.md#meaningful-documentation

The factory calls the evaluator once with neutral inputs for its bind drawing.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.ICreateFigureProps.partColors

## @evidence contracts/development/common.md#meaningful-documentation

Optional color overrides apply by emitted bone name.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IFigure.object

## @evidence contracts/development/common.md#meaningful-documentation

The host places this local mountable figure below its parent.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IFigure.drawing

## @evidence contracts/development/common.md#meaningful-documentation

The prepared polygon ports and attachments remain available to the figure's caller.

# src/scene/AutoMovieRenderHumanPolygon.ts#AutoMovieRenderHumanPolygon.IFigure.unsupported

## @evidence contracts/development/common.md#meaningful-documentation

The list describes requested expression controls the current drawing does not implement.
