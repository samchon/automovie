# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IGlideSample

## @evidence contracts/development/common.md#meaningful-documentation

States the world frame and the meaning of both vectors.

## @evidence contracts/development/design.md#principled-representation

A point and a tangent let the contact measure distinguish forward travel and transverse drift.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The geometry the glide measurement reads for each of two samples.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Measurements consume geometry from the displayed pose or prop, so this record carries no requested pose.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IGlidePlane

## @evidence contracts/development/common.md#meaningful-documentation

Specifies a point and outward normal.

## @evidence contracts/development/design.md#principled-representation

A point with one normal defines exactly one planar surface.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Used with two rendered samples in the glide measurement.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Accepts the actual scene plane rather than assuming a horizontal floor.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IGlideMeasure

## @evidence contracts/development/common.md#meaningful-documentation

Each member specifies its sign, unit and reading interval.

## @evidence contracts/development/design.md#principled-representation

One normal reading plus two tangent-plane displacement components.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returns the three quantities to compare with the declared contact mode.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Carries measurements without asserting which behavior a fixture allowed.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IGlideParams

## @evidence contracts/development/common.md#meaningful-documentation

States the bilateral starting support and the unit of each path parameter.

## @evidence contracts/development/design.md#principled-representation

One signed total turn over the traversed arc and one starting speed determine a kinematic path.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Controls the glide from the entered position and heading.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The outcome of the deceleration is declared separately from path turn and carries no fabricated friction figure.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISkateParams

## @evidence contracts/development/common.md#meaningful-documentation

States the optional edge and footwork controls in the ice-only form.

## @evidence contracts/development/design.md#principled-representation

The glide path and the changes of each foot's contact are independent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Adds optional ice-specific controls to the existing skate law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller supplies the actual edge points in foot coordinates.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IBladeEdge

## @evidence contracts/development/common.md#meaningful-documentation

Defines the local point and angle convention.

## @evidence contracts/development/design.md#principled-representation

A rotation and a pivot for each of two rigid feet.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Only the cant and edge points the foot goals consume.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Numerical locations come from the attached equipment rather than from a presumed blade width.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISkateStep

## @evidence contracts/development/common.md#meaningful-documentation

States timing, directions and the two supports.

## @evidence contracts/development/design.md#principled-representation

The foot has an ordered release and acquisition with one flight path in the moving stance.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The side, window and displacement used by the skate planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A crossover changes the actual endpoint of the foot instead of hiding it in the root path.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IStepOffset

## @evidence contracts/development/common.md#meaningful-documentation

States the stance frame, its two horizontal axes and metres.

## @evidence contracts/development/design.md#principled-representation

Two horizontal components leave the height to the step's own clearance and the ice plane.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The displacement `ISkateStep.offset` gives the skate planner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No vertical component exists, so a step cannot move the runner off its plane through the offset.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ICurlDeliveryParams

## @evidence contracts/development/common.md#meaningful-documentation

Documents slide timing, the lead shoe and the trailing shoe.

## @evidence contracts/development/design.md#principled-representation

Straight travel plus the separately authored height and stance parameters.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Options of the curling delivery law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The bearing front sole and trailing forefoot replace skate-edge controls for this stance.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISnowGlideParams

## @evidence contracts/development/common.md#meaningful-documentation

States the slope premise, grade sign and entry requirement.

## @evidence contracts/development/design.md#principled-representation

The glide path adds a slope and distinguishes alpine edge transfer from a Nordic pole and ski stroke.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Uses only the snow plane and the authored alpine or Nordic phase controls.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An authored grade changes the path geometry without implying measured friction or ski loads.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISkiEdgeTransfer

## @evidence contracts/development/common.md#meaningful-documentation

Documents both sets, the time of the flat passage and the counter-rotation.

## @evidence contracts/development/design.md#principled-representation

Two mounted edge poses, a neutral time and a relative torso rotation on the same glide.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The alpine branch of snowGlide.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reads mounted equipment and uses opposite signs to distinguish the two phases.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.INordicStroke

## @evidence contracts/development/common.md#meaningful-documentation

Documents the pole and its contact window and the opposite ski's stroke distance.

## @evidence contracts/development/design.md#principled-representation

A side and prop reference identify one grip throughout a timed window, coupled to an opposite-side ski displacement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Nordic branch of snowGlide.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reads the real prop contact, so the author retains ownership of the pole path.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISupportStepParams

## @evidence contracts/development/common.md#meaningful-documentation

States the two supports, the world target and its frame.

## @evidence contracts/development/design.md#principled-representation

A world target at the step's start and two optional scene ids; the fixed ground when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanSupportStep`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The supports' motion belongs to the scene; the target is where the arrival point is at the step's start.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.IBoardRideParams

## @evidence contracts/development/common.md#meaningful-documentation

States the two entry contacts, the optional hand grips and who drives the support.

## @evidence contracts/development/design.md#principled-representation

A scene id selects the support whose film-clock transform carries the stance and every grip point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The support id, the time the stance is carried and the hands' points on the same support.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The ride consumes the real board placement. It has no separate parameters for a scripted shadow of the board, and a grip names a point of the support rather than a world position.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISkateboardPhraseParams

## @evidence contracts/development/common.md#meaningful-documentation

States the support, staged phases and units.

## @evidence contracts/development/design.md#principled-representation

One scene board and clock coordinate distinct support phases.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The board id, duration, stance and ground height used by the skateboard law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The author retains ownership of the actual board path.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.ISurfboardPhraseParams

## @evidence contracts/development/common.md#meaningful-documentation

States the board and entry, both support transfer modes and units.

## @evidence contracts/development/design.md#principled-representation

Two distinct release versus acquisition orders use the same authored board clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The board id, duration, lead side, transfer and waterline used by the surfing law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

All grip and stance targets use the posed board.

# src/motion/human/lexicon/IAutoMovieMotionHumanSurface.ts#IAutoMovieMotionHumanSurface.SurfboardTransfer

## @evidence contracts/development/common.md#meaningful-documentation

Defines both transfer orders by their support events.

## @evidence contracts/development/design.md#principled-representation

A closed literal union of the two support orders the surfing law plans.

## @evidence contracts/development/design.md#minimal-and-owned-surface `ISurfboardPhraseParams.transfer` and the surfboard phrase planner consume it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union admits no third order that the planner would have to guess.
