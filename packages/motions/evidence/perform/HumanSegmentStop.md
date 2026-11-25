# src/perform/HumanSegmentStop.ts#HumanSegmentStop.reader

## @evidence contracts/development/common.md#meaningful-documentation

States absolute film seconds, the same-skeleton operation lifetime, fresh goal frames and the separation between pose evaluation and FK math reuse.

## @evidence contracts/development/implementation.md#principled-implementation

A fixed person, explicit segment and exact stop second determine the same cold displayed pose while this synchronous weapon loop keeps plans/stops/body unchanged. Its completed result may serve several weapons; their actual effector/lower frames still resolve independently through ordered FK.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Capture body once, lazily share successful same-second stop poses only for multiweapon segments, then read each demanded frame with the common operation preparation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Failed stop evaluations are unpublished; different seconds, segments, persons and outer queries never share this result map. Every requested FK still receives ordered joint admission and fresh transforms, and no tolerance or sampling rule changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

For W stopped weapons at T distinct exact stop instants, complete displayed evaluation runs T times instead of W; each weapon still pays joint admission and its demanded effector/lower FK ancestry. Shared rig/exact FK metadata does not replace target fits or projections; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The enclosing seeded call establishes same person, segment, plans/stops and unchanged body. Only completed equal-time poses are shared in its multiweapon loop; an explicit same-body parent also lends rig and exact FK prerequisites. A new query creates a new reader and result map.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The first actual stop creates this reader; its outer evaluation releases it on return or throw. At most W distinct stop poses from that actual loop and one successful FK tuple per visited name are retained locally; singleweapon loops retain no pose map. Returned goals keep fresh numeric frame values and no reader, map, global cache or task.
