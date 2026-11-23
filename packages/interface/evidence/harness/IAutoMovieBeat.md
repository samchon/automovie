# src/harness/IAutoMovieBeat.ts#IAutoMovieBeat

## @evidence contracts/development/design.md#principled-representation

The beat id joins flat script, optional tree nodes, blocking/performance and historical slice addressing; shot:<id> is the default compiled name, not a mandatory identity. Stored-script case-collision refusal protects distinct slice identities on case-insensitive hosts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields, an id, a title, a prose brief and a length hint, hold what a later stage needs to block the shot, with staging and dialogue kept in the script tree's beat payload.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The duration hint is not copied into the shot's duration by any stage, so a rough guess never silently becomes a timing fact; case collisions are refused before a file could be clobbered.

## @evidence contracts/development/common.md#meaningful-documentation

States what the id names and why its rules exist, every field rule project validation applies, and which consumer reads each field; members restate the unit and purpose of each.
