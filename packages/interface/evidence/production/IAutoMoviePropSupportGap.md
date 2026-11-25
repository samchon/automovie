# src/production/IAutoMoviePropSupportGap.ts#IAutoMoviePropSupportGap.IProps

## @evidence contracts/development/common.md#meaningful-documentation

How far a staged prop's underside stands above the face it rests on, in metres: negative where it sinks into the support, zero where it touches it, positive where it floats. `null` when no probe of the prop's footprint lies over the face at all, which is the answer for a prop that does not stand over its support rather than one standing at the wrong height on it. Member documentation states the supplied records, units and absence meanings used by propSupportGap.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The canonical face and box preserve one support model; finite footprint and ring probes can miss thin overlaps or interior relief and do not certify continuous contact.

## @evidence contracts/development/design.md#principled-representation

face provides a world-XZ region and height rule and bounds supplies the prop's world-metre occupancy; the result is a signed metre gap or null when no probe lies over support.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMoviePropSupportGap.IProps, used by propSupportGap. Its face, bounds members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
