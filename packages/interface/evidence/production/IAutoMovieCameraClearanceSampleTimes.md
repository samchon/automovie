# src/production/IAutoMovieCameraClearanceSampleTimes.ts#IAutoMovieCameraClearanceSampleTimes.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Build the clearance sample clock of one shot: a function from a take's camera motion to the strictly increasing shot-local seconds at which that take must be inspected. Member documentation states the supplied records, units and absence meanings used by cameraClearanceSampleTimes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sample-clock input retains the source clips and their common timebase; interpolation/seam admission and rotation bounds remain required, and sampling alone does not prove continuous collision freedom.

## @evidence contracts/development/design.md#principled-representation

duration is shot-local seconds and sampleRate is finite positive hertz; actor motions and object clips refine the fixed clock with their key boundaries before each take adds its camera boundaries.

## @evidence contracts/development/design.md#minimal-and-owned-surface

interface owns IAutoMovieCameraClearanceSampleTimes.IProps, used by cameraClearanceSampleTimes. Its duration, sampleRate, motions, objectMotions members carry this operation's declared inputs or results; imported domain records keep their existing definitions.
