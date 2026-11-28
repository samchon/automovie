# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.nominalWidth

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the standardized leaf width. The width draw picks the first record when the field and seed are absent.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.nominalHeight

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the standardized leaf height used for frame height and clear opening.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.nominalThickness

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the standardized leaf thickness used for body depth and hardware locations.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.latchBackset

## @evidence contracts/development/common.md#meaningful-documentation

Selects the offset from the latch edge where the chosen variant supplies it. The draw refuses an explicit choice without an applicable table.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.lever

## @evidence contracts/development/common.md#meaningful-documentation

Identifies a matched lever length and projection record. Other hardware lacks this catalogue and refuses the option.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

Selects a hinge or slide. The factory defaults to a hinged leaf and admits both saved alternatives.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.hinge

## @evidence contracts/development/common.md#meaningful-documentation

Names the side seen from the pull face. The right side defaults to positive X and sets rotation origin or slide direction.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.hardware

## @evidence contracts/development/common.md#meaningful-documentation

Selects the hinged lever, knob or plate combination. Hinged leaves default to levers. Sliding leaves use two pull bars and refuse this field.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams.id

## @evidence contracts/development/common.md#meaningful-documentation

Names the scene model. The builder uses the door family ID when the input omits it.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.create

## @evidence contracts/development/common.md#meaningful-documentation

The doc states the default right-hinged lever and how to select a sliding door. It names the frame origin, pull and push faces, stationary aperture, shared latch and refusal cases.

## @evidence contracts/development/implementation.md#principled-implementation

The leaf's chosen catalogue supplies its dimensions once. The hinge side places the rotation axis at the leaf edge or chooses the slide direction. The hardware contacts ride either the leaf carrier itself or its child latch. The aperture remains on the frame because it describes the clear span. The mark test reads the exposed hinge as a point.

## @evidence contracts/development/implementation.md#efficient-algorithms

One draw session resolves the applicable bands and five catalogue axes. The bounded frame and hardware construction emits two contact faces and at most one shared latch. Each call owns the temporary part lists and builder.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.BREAKING

## @evidence contracts/development/common.md#meaningful-documentation

The public value gives joules and identifies the hinge-only leaf release model. Its referenced prototype threshold is kept at the numeric owner.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies the two leaf motions.

## @evidence contracts/development/design.md#principled-representation

The selected value decides whether the leaf uses hinge rotation or slider translation. The factory validates its saved kind through the shared alternatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One kind determines geometry, articulation, travel and permitted hardware.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.KINDS

## @evidence contracts/development/common.md#meaningful-documentation

The array lists the saved kinds accepted by the factory.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Hardware

## @evidence contracts/development/common.md#meaningful-documentation

The type names the three selectable hinged hardware configurations.

## @evidence contracts/development/design.md#principled-representation

Levers and knobs create a linked latch with two handles. Plate hardware uses an independent push surface and pull bar. Slider construction uses fixed hardware and declines this option.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Hardware choice is owned by the door factory. The normal affordance records carry the shape and mounting details to consumers.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.HARDWARE

## @evidence contracts/development/common.md#meaningful-documentation

The array lists the accepted hinged leaf options used during runtime choice validation.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.PULL_HEIGHT

## @evidence contracts/development/common.md#meaningful-documentation

The constant gives pull bar centre height from the threshold in metres. The underlying documented standard value is 42 inches.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.PLATE_HEIGHT

## @evidence contracts/development/common.md#meaningful-documentation

The constant places the plate centre vertically above the threshold in metres. The underlying documented standard value is 45 inches.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.PLATE

## @evidence contracts/development/common.md#meaningful-documentation

The record gives width and height in metres used both for the push plate geometry and its contact surface.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.PULL

## @evidence contracts/development/common.md#meaningful-documentation

The record identifies estimated grip length and clearance in metres. The builder uses it for the upright bar and its grip geometry.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Affordance

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names which leaf exposes a hinge or slider, which side each hold belongs to and when the latch is present.

## @evidence contracts/development/design.md#principled-representation

A door emits one leaf carrier, the clear aperture and contacts on each face. It only emits a latch for levers or knobs, whose grips then ride that latch. The actual model graph validates its articulation targets.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Consumers select names on the actual emitted model. Existing interface types describe their frames, permitted movement and hand contact geometry.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Dimension

## @evidence contracts/development/common.md#meaningful-documentation

Each dimension identifies a leaf, hardware or force measurement. Its documentation gives the material units, including degrees for rotation, newtons for opening force and kilograms for mass.

## @evidence contracts/development/design.md#principled-representation

The producer uses catalogue records for leaf dimensions and applies variant-owned bands only for free values. The draw session refuses nonfinite and inapplicable fixed dimensions.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Input overrides, emitted metadata and catalogue bounds use the same shared keys. The articulation read uses the applicable mechanical axis and travel, while reference force remains a recorded value.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.UNITS

## @evidence contracts/development/common.md#meaningful-documentation

The map identifies metres for geometry, degrees for rotation, newtons for force and kilograms for mass.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Width

## @evidence contracts/development/common.md#meaningful-documentation

The public type names nominal widths from the cited standard.

## @evidence contracts/development/design.md#principled-representation

The identifiers are nominal sizes rather than metres. The selected width record supplies the frame and leaf measurement through the draw session.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The factory shares one catalogue axis for both signatures and emitted width provenance.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Height

## @evidence contracts/development/common.md#meaningful-documentation

The public type names nominal heights from the cited standard.

## @evidence contracts/development/design.md#principled-representation

Each saved identifier resolves to the height record used for the clear doorway and the frame geometry. The selector admits only the available catalogue values.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The author chooses a standard leaf size while the draw session handles conversion and labeling.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Thickness

## @evidence contracts/development/common.md#meaningful-documentation

The public type identifies the supported nominal thicknesses from the cited standard.

## @evidence contracts/development/design.md#principled-representation

Thickness choice uses a catalogue key validated by the draw session. Its resolved metre value sets the leaf depth and hardware face locations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The dimension and band outputs use the catalogue's single thickness measurement rather than accepting an independent unverified depth.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Backset

## @evidence contracts/development/common.md#meaningful-documentation

The type names the two Schlage cylindrical lock offsets.

## @evidence contracts/development/design.md#principled-representation

The key identifies a catalogue offset from the latch edge. The factory supplies a variant backset table for applicable hardware and the draw refuses a key where no table exists.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The catalogue owns numeric backset. An author selects the measured configuration without restating its offset.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.Lever

## @evidence contracts/development/common.md#meaningful-documentation

The declaration names the available Schlage lever records and their length and projection meaning.

## @evidence contracts/development/design.md#principled-representation

A style selects an entire length-and-projection entry on a lever door. The draw session checks the choice and declines it on other hardware.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Saved IDs refer to catalogue choices while the runtime sees the resolved grip length and projection together.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The fields document the default right hinge, lever, hinged leaf and scene ID. They identify nominal catalogue selections and the variant restrictions for each optional control.

## @evidence contracts/development/design.md#principled-representation

Optional controls describe a saved door request. The factory checks selected kind, hardware and hinge side, validates named records under the chosen hardware and resolves fixed free dimensions with variant bands.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The factory uses nominal sizes for the three sourced leaf dimensions. Its other editable measurements use the named dimension keys shared with model provenance.

# src/architecture/AutoMovieArchetypeDoor.ts#AutoMovieArchetypeDoor.BANDS

## @evidence contracts/development/common.md#meaningful-documentation

The table lists applicable free dimensions by hinged hardware and sliding variant. The draw session applies its units and bounds.
