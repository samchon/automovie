# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation

## @evidence contracts/development/common.md#meaningful-documentation

States the frames, the units, the axes, how a block is placed and what is composed from blocks. until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent. count: How many members it holds, a positive whole number within the layout's capacity.

## @evidence contracts/development/design.md#principled-representation

The interface's layout union reused unchanged, a block's placement in the formation's frame, and the frame as a closed union of its three ways of moving. until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent. count: How many members it holds, a positive whole number within the layout's capacity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Blocks and a frame; `HumanFormation` reads them, the ensemble, the manoeuvre and the population take them. Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.station, formation); ensemble/HumanEnsembleMembers.ts (rearRank, formation); ensemble/HumanEnsembleMembers.ts (flank, formation); ensemble/HumanFormation.ts (HumanFormation.of, formation); ensemble/HumanFormation.ts (HumanFormation.of, return); ensemble/HumanFormation.ts (HumanFormation.count, formation).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No `square` layout: four outward-faced blocks are one. Shares the canonical IAutoMovieFormationLayout, IAutoMovieVector3, IAutoMovieMotionHumanActionContext.IRoot identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IStation

## @evidence contracts/development/common.md#meaningful-documentation

until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent.

## @evidence contracts/development/design.md#principled-representation

until: The film second the station ends; the frame's own end when absent. dress: The member's slow deviation from its slot (`HumanEnsemble.station`): its bound, metres, and the stream seed its lateral and depth deviations are drawn from; none when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: actions/walkStation.ts (walkStation.rests, station); actions/walkStation.ts (walkStation.point, station); ensemble/HumanEnsemble.ts (HumanEnsemble.station, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan.stations, return); ensemble/manoeuvreWheel.ts (manoeuvreWheel, return); actions/walkClock.ts (walkClock).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFormation identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IBlock

## @evidence contracts/development/common.md#meaningful-documentation

count: How many members it holds, a positive whole number within the layout's capacity. offset: Where its own origin stands in the formation's frame, metres; the frame's origin when absent. facing: Which way it faces relative to the frame, degrees; 0 when absent.

## @evidence contracts/development/design.md#principled-representation

count: How many members it holds, a positive whole number within the layout's capacity. offset: Where its own origin stands in the formation's frame, metres; the frame's origin when absent. facing: Which way it faces relative to the frame, degrees; 0 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.of, block); ensemble/HumanFormation.ts (HumanFormation.count, block); ensemble/HumanPopulation.ts (HumanPopulation.design, block); ensemble/manoeuvreWheel.ts (manoeuvreWheel.formation, b); ensemble/manoeuvreWheel.ts (manoeuvreWheel.formation, return); ensemble/HumanFormation.ts (HumanFormation.local).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieFormationLayout identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.Frame

## @evidence contracts/development/common.md#meaningful-documentation

Where the formation stands and faces.

## @evidence contracts/development/design.md#principled-representation

The kind discriminant selects a fixed frame, a performer-guided frame, a timed path or a prescribed course; each case owns the coordinates and timing it needs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.frame); ensemble/HumanFormation.ts (HumanFormation.end).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFormation.IFixed, IAutoMovieMotionHumanFormation.IGuide, IAutoMovieMotionHumanFormation.IPath, IAutoMovieMotionHumanFormation.ICourse identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IFixed

## @evidence contracts/development/common.md#meaningful-documentation

at: Its origin, world metres. heading: Its heading, degrees.

## @evidence contracts/development/design.md#principled-representation

at: Its origin, world metres. heading: Its heading, degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in ensemble/IAutoMovieMotionHumanFormation.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IGuide

## @evidence contracts/development/common.md#meaningful-documentation

kind: The discriminator. subject: The guide performer, composed before the members who read it.

## @evidence contracts/development/design.md#principled-representation

kind: The discriminator. subject: The guide performer, composed before the members who read it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in ensemble/IAutoMovieMotionHumanFormation.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The literal vocabulary is declared independently of runtime values; implementations are checked against this exact set.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IPath

## @evidence contracts/development/common.md#meaningful-documentation

via: The path's corners on the floor, world metres, at least two; `y` is not read. heading: Its heading: along the path, or a fixed heading in degrees; along when absent. start: The film second it starts moving; 0 when absent.

## @evidence contracts/development/design.md#principled-representation

via: The path's corners on the floor, world metres, at least two; `y` is not read. heading: Its heading: along the path, or a fixed heading in degrees; along when absent. start: The film second it starts moving; 0 when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (laid, frame); ensemble/HumanFormationPath.ts (HumanFormationPath.lay, frame); ensemble/HumanFormation.ts (LAID).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3, IAutoMovieMotionHumanFormation.IMark identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IMark

## @evidence contracts/development/common.md#meaningful-documentation

speed: The speed it changes to, metres per second, at least 0.

## @evidence contracts/development/design.md#principled-representation

speed: The speed it changes to, metres per second, at least 0.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Public boundary formerly declared in ensemble/IAutoMovieMotionHumanFormation.ts; canonical declarations reference this identity directly.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in IAutoMovieMotionHumanFormation.IMark.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

samples: The origin at film seconds, at least two, in time order; held at the ends.

## @evidence contracts/development/design.md#principled-representation

samples: The origin at film seconds, at least two, in time order; held at the ends.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanCrowd.ts (HumanCrowd.steer.frames, return); ensemble/HumanCrowd.ts (HumanCrowd.steer, return); ensemble/HumanFormation.ts (coursed, frame); ensemble/HumanManoeuvre.ts (steered, frame); ensemble/HumanCrowd.ts (HumanCrowd.steer).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanFormation.ISample identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.ISample

## @evidence contracts/development/common.md#meaningful-documentation

x: World metres, x. y: World metres, y. z: World metres, z.

## @evidence contracts/development/design.md#principled-representation

x: World metres, x. y: World metres, y. z: World metres, z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.path, return); ensemble/HumanManoeuvre.ts (steered.way, _); ensemble/HumanManoeuvre.ts (steered.way, s); actions/walkStation.ts (walkStation.resolve); ensemble/HumanCrowd.ts (HumanCrowd.steer.frames); ensemble/HumanFormation.ts (HumanFormation.path).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanFormation.path.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.ISlot

## @evidence contracts/development/common.md#meaningful-documentation

at: The slot's floor point, world metres. heading: The heading the member faces in it, degrees. block: Its block's index.

## @evidence contracts/development/design.md#principled-representation

at: The slot's floor point, world metres. heading: The heading the member faces in it, degrees. block: Its block's index.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsembleMembers.ts (placeOf, slot); ensemble/HumanFormation.ts (HumanFormation.slot, return); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan.ends, return); ensemble/HumanManoeuvre.ts (steered, ends); ensemble/manoeuvreWheel.ts (manoeuvreWheel, ends); ensemble/HumanManoeuvre.ts (HumanManoeuvre.plan).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.ILocal

## @evidence contracts/development/common.md#meaningful-documentation

lateral: Metres along the frame's lateral axis. depth: Metres toward the frame's rear. facing: Degrees relative to the frame's heading.

## @evidence contracts/development/design.md#principled-representation

lateral: Metres along the frame's lateral axis. depth: Metres toward the frame's rear. facing: Degrees relative to the frame's heading.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.local, return); ensemble/manoeuvreWheel.ts (pivotOf.front, return); ensemble/manoeuvreWheel.ts (pivotOf.front, e); ensemble/manoeuvreWheel.ts (pivotOf.front, a); ensemble/manoeuvreWheel.ts (pivotOf.front, b); actions/walkStation.ts (walkStation.point).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanFormation.local.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.Reader

## @evidence contracts/development/common.md#meaningful-documentation

Reads a performer's placed root at a film second, for a guide frame: `IAutoMovieMotionHumanPerformerReader.root` of the guide.

## @evidence contracts/development/design.md#principled-representation

A subject id and film second select one canonical root pose without exposing a performance instance or its mutable state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanEnsemble.ts (HumanEnsemble.of, read); ensemble/HumanEnsembleMembers.ts (HumanEnsembleMembers.resolve, read); ensemble/HumanFormation.ts (HumanFormation.frame, read); ensemble/HumanFormation.ts (HumanFormation.slot, read); ensemble/HumanFormation.ts (HumanFormation.path, read); ensemble/HumanFormation.ts (HumanFormation.assign, read).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanActionContext.IRoot identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IFrameResult

## @evidence contracts/development/common.md#meaningful-documentation

at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.

## @evidence contracts/development/design.md#principled-representation

at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.frame, return).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IPlaceOrigin

## @evidence contracts/development/common.md#meaningful-documentation

at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.

## @evidence contracts/development/design.md#principled-representation

at: Formation origin in world metres. heading: Formation yaw in degrees about world +Y, zero toward +Z.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.place, origin).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieVector3 identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.

# src/motion/human/ensemble/IAutoMovieMotionHumanFormation.ts#IAutoMovieMotionHumanFormation.IPlacePlace

## @evidence contracts/development/common.md#meaningful-documentation

lateral: Slot's lateral offset in the formation frame, metres. depth: Slot's front-to-rear offset in the formation frame, metres.

## @evidence contracts/development/design.md#principled-representation

lateral: Slot's lateral offset in the formation frame, metres. depth: Slot's front-to-rear offset in the formation frame, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: ensemble/HumanFormation.ts (HumanFormation.place, place).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The admitted fields and units are declared here directly; runtime handling remains in HumanFormation.place.
