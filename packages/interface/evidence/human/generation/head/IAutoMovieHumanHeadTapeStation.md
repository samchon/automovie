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

## @evidence contracts/development/design.md#principled-representation `point`: Original world point, calibration mm. `frame`: Actual current world frame; phase reads do not borrow an inverse trial's frame. `local`: Same native point and its first two phase derivatives.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanHeadTapeSource.original, AutoMovieHumanHeadTapeStation.local.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `point`, `frame`, `local`; callers supply the complete record.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.IOutput

## @evidence contracts/development/common.md#meaningful-documentation

One measured course retains only its two successful endpoint preparations.

## @evidence contracts/development/design.md#principled-representation

One measured course retains only its two successful endpoint preparations.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanHeadTapeStation.create. Read by AutoMovieHumanHeadTapeSource.course. Also types AutoMovieHumanHeadTapeSource.sources.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTapeSource.course, AutoMovieHumanHeadTapeSource.sources, AutoMovieHumanHeadTapeStation.create for one measured course retains only its two successful endpoint preparations.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.CreateEnds

## @evidence contracts/development/common.md#meaningful-documentation

Share only exact unchanged endpoints, and carry an arbitrary selected bracket trial directly into its final phase read.

## @evidence contracts/development/design.md#principled-representation

Share only exact unchanged endpoints, and carry an arbitrary selected bracket trial directly into its final phase read. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadTapeStation.CreateEnds is the canonical exchange used by AutoMovieHumanHeadTapeStation.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTapeStation.create for share only exact unchanged endpoints, and carry an arbitrary selected bracket trial directly into its final phase read.

# src/human/generation/head/IAutoMovieHumanHeadTapeStation.ts#IAutoMovieHumanHeadTapeStation.VectorLocal

## @evidence contracts/development/common.md#meaningful-documentation

Restore a native local vector without an origin translation.

## @evidence contracts/development/design.md#principled-representation

Restore a native local vector without an origin translation. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanHeadTapeStation.VectorLocal is the canonical exchange used by AutoMovieHumanHeadTapeStation.vector.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanHeadTapeStation.vector for restore a native local vector without an origin translation.
