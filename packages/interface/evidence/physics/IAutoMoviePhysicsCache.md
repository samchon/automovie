# src/physics/IAutoMoviePhysicsCache.ts#IAutoMoviePhysicsCache

## @evidence contracts/development/common.md#meaningful-documentation

Fixed-step display/audit frames and complete state needed to restart the same physical performance.

## @evidence contracts/development/design.md#principled-representation

Frames use local film seconds at cached rate; checkpoint keys count cached intervals, while ownership and contact samples may carry finer native times.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMoviePhysicalSimulation fills this cache and freezes published ordinary records. Methods allocate samples, but public arrays, Maps and snapshot buffers are borrowed producer state.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

readonly prevents property reassignment, not Map or typed-buffer mutation. Consumers must preserve snapshots and records; frames alone cannot restore native/controller state.
