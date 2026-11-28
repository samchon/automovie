# src/perform/AutoMovieMotionHumanPerformance.ts#AutoMovieMotionHumanPerformance

## @evidence contracts/development/common.md#meaningful-documentation

The class describes what construction admits, how film seconds address playback, and when a flight uses staged or physical rotation. `instant` identifies the clock used for its played-event queries. `simulate` describes how a baked window changes displayed reads.

## @evidence contracts/development/design.md#principled-representation

Each instance resolves a schedule from the input's performer identities, law plans and composition. `HumanPerformanceState` validates participant identities, windows and rules before exposing prepared display records. A baked window retains its own input, mode and time range, and the most recent covering window owns a displayed pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The performance owns the clock, placed people, prop state and interaction records used by authoring, audit and delivery. Its public readers address those results by subject or instant. Internal preparation, dependencies and provisional values stay inside construction. Each new performance resolves its own input and owns its playback records.

# src/perform/AutoMovieMotionHumanPerformance.ts#AutoMovieMotionHumanPerformance.prototype.instant

## @evidence contracts/development/common.md#meaningful-documentation

The method names absolute film seconds, action occurrences and cue tracks. It gives the default action contact or entry, the exact-cut inclusion rule, the order of repeated events, the offset and refusals for unknown or unavailable events.

## @evidence contracts/development/implementation.md#principled-implementation

The resolver `HumanPerformanceLayers.instant` finds the placed action or declared track. The action's inclusive entry and clipped end are on the schedule's own clock. Filtering the placed events before indexing preserves an event at the cut and withholds abandoned events. A track has its own declared seconds. The resolver applies the offset after finding a valid occurrence.

## @evidence contracts/development/implementation.md#efficient-algorithms

An absolute second returns directly. A named action scans its entry and events, and a cue track scans its own events. A missing occurrence reports the available names from that same population. The resolver performs no playback or preparation and retains no results between reads.
