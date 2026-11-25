# src/geometry/construction/AutoMovieLoftSectionOriginal.ts#AutoMovieLoftSectionOriginal.fault

## @evidence contracts/development/common.md#meaningful-documentation

States the shared admission for an exact regular section, a retained interior or an original prefix. Checks the name, station bounds in millimetres, the three required source capabilities and the two optional fixed-station readers.

## @evidence contracts/development/implementation.md#principled-implementation

A complete regular section must match both original station bounds exactly and own an uncapped domain. A prefix begins at or after the first station and ends before the last so the retained distal law owns the protected station. An interior interval exclusively owns a strict subinterval with two retained native tails.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One guard checks the record and its capabilities. The declared section mode then selects its bound and cap checks. Chain admission, the direct-source reader and the view loft share the same function.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Returns a named refusal when bounds, cap or capability declarations conflict. The actual producer owns agreement of the geometric values and derivatives at the protected station.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses constant-size checks on two bounds and the names and presence of the capabilities.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous scalar operation over its supplied inputs prepares no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader returns a refusal string or null. The source record remains with its caller.

# src/geometry/construction/AutoMovieLoftSectionOriginal.ts#AutoMovieLoftSectionOriginal.compatibility

## @evidence contracts/development/common.md#meaningful-documentation

Checks both native interfaces of an interior replacement. A prefix meets its retained distal source at one interface. Source rejection identifies the conflicting physical station or cap.

## @evidence contracts/development/implementation.md#principled-implementation

The original cap boundary bounds each retained interior. The supplied and retained `p`, `s`, `t`, `ss`, `st` and `tt` values must agree at the sampled native phases under the existing scale-aware floating-point bound.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One interval check chooses the native contact stations. A common scalar comparison covers the two-jet of either contact.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unavailable native station or incompatible derivative returns a named refusal. A caller preserves the original cap or native tail instead of repairing it with an emitted row.

## @evidence contracts/development/implementation.md#efficient-algorithms

Prepares the two second-order phase readers once at each station, then compares a finite phase sweep proportional to the declared order.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The supplied station reader and the original scalar reader both share phase-independent state during the sweep.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The comparison returns a diagnostic or null and releases its prepared contact readers.

# src/geometry/construction/AutoMovieLoftSectionOriginal.ts#AutoMovieLoftSectionOriginal.active

## @evidence contracts/development/common.md#meaningful-documentation

States that complete regular domains include both exact ends and that the prefix's protected last station belongs to the retained distal law.

## @evidence contracts/development/implementation.md#principled-implementation

Selects the admitted source on its closed interval in complete regular mode or on its half-open interval for a prefix. An absent original owns no station.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One conditional interval comparison serves the direct-source and chain readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The declared mode and exact physical station bounds determine selection.

## @evidence contracts/development/implementation.md#efficient-algorithms

Uses a constant number of comparisons.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A synchronous scalar operation over its supplied inputs prepares no shared work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the Boolean result leaves the call.
