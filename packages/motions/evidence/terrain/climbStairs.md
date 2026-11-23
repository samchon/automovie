# src/terrain/climbStairs.ts#climbStairs.plan

## @evidence contracts/development/common.md#meaningful-documentation

The namespace states the architecture, footprint and clearance rule, timing and refusals; this plan retains those rules and prepares fixed geometry.

## @evidence contracts/development/implementation.md#principled-implementation

Each forefoot follows its tread clearance path while the heel rises about the metatarsophalangeal joint as the shank bends. Both feet use their clocked support shares through double support, toe-off and touchdown.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fixed sole geometry, footprint/edge preparation, step clock, stance heights and prepared foot/pelvis readers precede the body primitive.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No riser, tread, clearance, contact time, gait period or reach constraint changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Foot, pelvis and load intervals are selected logarithmically. Both feet share one lowered-hip FK read. Each rocker makes a bounded pitch search only when its initial pitch needs adjusting.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed body and flight share sole offsets, each side/level footprint, edge-clearance heights and toe contacts; the final clock fixes every prepared interval. Synchronous stance-height construction borrows one exact FK workspace across all actual steps, and playback borrows only its current composite observation's source.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Plan-owned footprints, edges, stance heights and readers grow with step count and release with the climb. The stance-construction FK workspace ends with that block, and neither it nor playback's current loan enters retained numeric heights or a query history.
