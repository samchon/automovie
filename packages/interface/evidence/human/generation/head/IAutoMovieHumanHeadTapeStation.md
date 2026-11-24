# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation

## @evidence contracts/development/common.md#meaningful-documentation

Original physical-station preparations and phase readers, retaining the exact source behind each measured point. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only IValue, IPrepared, IReading, IOutput, CreateEnds, VectorLocal declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

IValue, IPrepared, IReading, IOutput, CreateEnds, VectorLocal separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanHeadTapeStation exchanges the named IValue, IPrepared, IReading, IOutput, CreateEnds, VectorLocal contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.IValue

## @evidence contracts/development/common.md#meaningful-documentation

An actual value query and the identical station that produced it.

## @evidence contracts/development/design.md#principled-representation `point`: Original world point, calibration mm. `source`: Same input/station preparation, not another inverse trial.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanHeadTapeSource.locate. Also types AutoMovieHumanHeadTapeSource.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `source`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

One original numeric station; no inverse solve or physical2 is hidden in it.

## @evidence contracts/development/design.md#principled-representation `reader`: Actual unchanged original reader owning this station. `station`: Original physical station, calibration mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadTapeStation.prepare. Also types AutoMovieHumanHeadTapeStation.endpoints, AutoMovieHumanHeadTapeStation.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `reader`, `station`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.IReading

## @evidence contracts/development/common.md#meaningful-documentation

Complete phase reading before the separate physical source2 request.

## @evidence contracts/development/design.md#principled-representation `point`: Original world point, calibration mm. `frame`: Original world frame of the prepared physical station. `local`: Same native point and its first two phase derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadTapeSource.original, AutoMovieHumanHeadTapeStation.local.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `frame`, `local`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

A course reader owns the admitted scalar field and can prepare its fixed integration endpoints. Value inversion and the final physical jet read the same original field.

## @evidence contracts/development/design.md#principled-representation

The declared integration interval determines the endpoint preparations. The physical jet is requested at the selected station. A phase-only query can receive the numeric station preparation that produced its point trial.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadTapeStation.create. Read by AutoMovieHumanHeadTapeSource.course. Also types AutoMovieHumanHeadTapeSource.sources.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation carries the point or phase operation on the actual original station. It exposes no lookup state and stores no previous trial output.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.CreateEnds

## @evidence contracts/development/common.md#meaningful-documentation

Ordered physical stations to prepare for repeated integration, in calibration mm.

## @evidence contracts/development/design.md#principled-representation

The readonly pair supplies the lower and upper physical stations of the measured course. Equal values request one preparation for a horizontal course.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadTapeStation.CreateEnds is the canonical exchange used by AutoMovieHumanHeadTapeStation.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The pair describes fixed input stations of one integration. It carries neither bracket state nor previous trial outputs.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.VectorLocal

## @evidence contracts/development/common.md#meaningful-documentation

Restore a native local vector without an origin translation.

## @evidence contracts/development/design.md#principled-representation

Restore a native local vector without an origin translation. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadTapeStation.VectorLocal is the canonical exchange used by AutoMovieHumanHeadTapeStation.vector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTapeStation.vector for restore a native local vector without an origin translation.
