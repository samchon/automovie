# src/motion/integrateAirborneRotation.ts#integrateAirborneRotation

## @evidence contracts/development/implementation.md#principled-implementation

Exact dispatch requires the native owner's whole-curve constant proof and the helper's supported commuting class and derivative/control capabilities; explicit dense physical budgets retain the original numerical path. The fallback uses conservation of angular momentum about the centre of mass of a torque-free multibody, with the root's angular velocity solved from the composite inertia. Unobserved factory tensors use diagonally equilibrated SPD Cholesky solves; public or foreign principals retain their original inverse application. Forward sensitivity differentiates this same ODE, with eta' = -w cross eta + I^-1((R^T L) cross eta + R^T dL), in the instantaneous body's frame. Explicit dense control reconstructs R(I omega+h) from the same tensor, retaining anisotropy and cancellation. Companion observe: Delegates to the native observation owner; histories borrow only its private counter storage and never invoke a caller method.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One right-hand side over the history, with the requested variations, handed to the existing trajectory integrator. Companion observe: One factory forwards observation ownership without an ambient context or altered physical input.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rate is clamped and no angle scripted: the orientation is whatever the momentum and the shape give. Only this operation's matching symbol scope permits enriching a numeric failure; foreign history errors retain their identity, message and metadata, even when they have the same error class. Companion observe: No monkeypatch, callback notification, trusted caller flag or default instrumentation is introduced.

## @evidence contracts/development/implementation.md#efficient-algorithms

The exact supported branch keeps only completed constant-size numeric data; its eligibility work belongs to the invariant owner. The numerical fallback uses four new right-hand sides per fixed step; adaptive cost follows the owning stepper's trial-stage and dense-probe populations. Each right-hand side reads one history instant and does linear work in requested variation directions, without a separately integrated derivative. Explicit dense physical control adds one history read and fixed-size momentum reconstruction per controller probe. One flat rate array receives tangent components directly; an indexed loop reads each tangent's scalar coordinates without a callback or tangent record, and cross terms keep their original association without intermediate cross/difference records. Inverse applications divide their exclusively owned local rotated vector in place before rotating it back. Companion observe: Allocates one fixed-size counter record only on this explicit request; ordinary histories allocate no observation record.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The history keeps each exact instant's shape-only inertia and relative momentum across stages and shooting trials. rated forwards actual current bone derivatives to the shared centroidal owner once per numeric-node construction, caching numeric momentum or unavailability independently of first being requested or a stencil neighbor; no second shape callback is needed. Factory-issued unobserved tensors share one factor across physical rate, all tangent columns and dense reconstruction without principal materialization. Observed/changed/foreign instants retain the original principal path and copied Object.is inverse checks. An optional operation partition shares exact time boundaries only; every trial recomputes its current state and error checks. Companion observe: The same explicit handle can accumulate actual history epochs; repeated reads copy totals rather than triggering physical work.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

AirborneRotationFlight constructs playback outside the RHS scope from numeric trajectory/tangent count only; accepted-step count remains unbounded under adaptation. A general history's fallback owns one copied quaternion/inverse until return/throw. An engine history with N exact queries and S parts owns O(N) I/h/inverses and at most 3N+6 numeric mass nodes, O(N*S), until clear. Raw bones/full poses are released after posing and never enter those maps. Companion observe: The caller owns the small handle; private weak registration retains no observer after callers and histories release it. It contains no body, pose, query log or process.

## @evidence contracts/development/common.md#meaningful-documentation

States conservation, root/relative decomposition, sources, frames and translation/heading invariance. Namespace history documents pure root-frame bones, unchanged millisecond central differences/boundary correction, exact I/h and operation-owned numeric mass nodes with O(N*S) retention, and separate raw/prepared-model lifetime; clear releases all transient numeric preparation. rated declares actual same-instant common-frame bone rates and first-node derivative assessment, including stencil neighbors, with numeric-only packets and explicit unavailable fallback.
