# src/terrain/climbStairsProfile.ts#climbStairsProfile

## @evidence contracts/development/common.md#meaningful-documentation

States the fixed architecture, floor frame, clearance band and metre-valued query/result.

## @evidence contracts/development/implementation.md#principled-implementation

Uses the original surface under the point and maximum of both millimetre-sided samples at each nearby nosing plus authored clearance; binary selection omits only edges whose original distance comparison cannot hold.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed nosing heights precede a lower-bound lookup and a scan of only the overlapping edge bands.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves the original inclusive absolute-distance predicate, straddling offsets, surface rule and clearance; no edge or sole point is sampled less often.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear preparation/storage in tread count and logarithmic edge selection plus the overlapping bands per profile read, replacing the full edge scan.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed flight and clearance band determine each edge and its height once; the reader evaluates every actual sole coordinate and stores no queried height.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader owns one edge record per tread until its climb plan releases it, without a sample history or external handle.
