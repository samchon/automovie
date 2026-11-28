# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample

## @evidence contracts/development/common.md#meaningful-documentation

The declaration describes string welding identity, lazy writer registration, optional lattice observations and sweep or curve pose bindings.

## @evidence contracts/development/design.md#principled-representation

Network sampling forms the record from a sweep edge or a curve edge. A curve endpoint can also lie on a sweep, so its lattice observation and curve binding can coexist. The registry welds by key, merges spacing per side and finalizes the shared writer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Planning can consume the stable key, the optional lattice registration and the existing rig bindings without requiring a finished mesh. Writer and probe arrays stay with the registry and rigs.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepPoint

## @evidence contracts/development/common.md#meaningful-documentation

The declaration gives the named sweep, normalized spine coordinate, section turn and four directional sample distances. It explains the meaning of Infinity at an unobserved side.

## @evidence contracts/development/design.md#principled-representation

The registry keeps the minimum spacing supplied on each side for the same welded sample. On finalization it mirrors an unconstrained side or uses zero where both sides are absent, then registers the resulting cell with its sweep rig.

## @evidence contracts/development/design.md#minimal-and-owned-surface

These values describe sampling density for one registered point. The same shape works for sweep edges and for curve endpoints anchored on a sweep.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepEdge

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies a compiled sweep rig and the coordinate it reads for the edge. It documents the pose ordering and turn convention.

## @evidence contracts/development/design.md#principled-representation

The network producer constructs the binding for sweep edges using their sampled U and V values. Bridge planning reads the borrowed rig for current normal and spine evidence at that sample.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The binding carries the rig and sampled coordinates directly. The parent record owns the separate spacing observation and stable welding key.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ICurveEdge

## @evidence contracts/development/common.md#meaningful-documentation

The declaration identifies a compiled curve rig and its normalized share. It documents which source pose data the rig needs before evaluation.

## @evidence contracts/development/design.md#principled-representation

The network producer calculates a curve-edge share from the segment ordinal and optional reversal. The bridge reads that share through the curve rig, which is refreshed after source sweeps and bones.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The binding needs one rig and one curve coordinate. The same parent record can separately carry a sweep sampling observation for an endpoint, without giving the curve binding additional sweep fields.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.key

## @evidence contracts/development/common.md#meaningful-documentation

Documents the stable welding id. The registry compares this string before allocating a new vertex.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.writer

## @evidence contracts/development/common.md#meaningful-documentation

Documents the lazy writer factory, borrowed buffer and scalar output offset. The registry invokes it when a distinct free or curve sample first receives its vertex.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.point

## @evidence contracts/development/common.md#meaningful-documentation

Documents the optional sweep lattice observation. The registry consumes it to defer registration and merge the four spacings.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Documents the domain binding for a sweep-edge sample. The bridge can query its compiled rig at the stored U and V.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.curve

## @evidence contracts/development/common.md#meaningful-documentation

Documents the curve-edge pose binding. Bridge planning uses its normalized coordinate for dependent reads.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepPoint.sweep

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the sweep registry key used when the pending position writer is finalized.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepPoint.u

## @evidence contracts/development/common.md#meaningful-documentation

Documents chord-length U, clamped on sample evaluation and welding identity construction.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepPoint.v

## @evidence contracts/development/common.md#meaningful-documentation

Documents the section turn used by the sweep and its wrapped welding identity.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepPoint.cell

## @evidence contracts/development/common.md#meaningful-documentation

Documents the four side spacings and how the registry treats each unobserved side. The final cell belongs to the shared sample.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepEdge.rig

## @evidence contracts/development/common.md#meaningful-documentation

Documents the borrowed compiled sweep rig and the requirement to update it before reading live samples.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepEdge.u

## @evidence contracts/development/common.md#meaningful-documentation

Documents the normalized U used for point and probe reads on the chosen sweep rig.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ISweepEdge.v

## @evidence contracts/development/common.md#meaningful-documentation

Documents the sweep section turn and the correspondence convention governing its wrap.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ICurveEdge.rig

## @evidence contracts/development/common.md#meaningful-documentation

Documents the borrowed curve rig and its pose dependencies prior to bridge reads.

# src/geometry/IAutoMovieSurfaceSample.ts#IAutoMovieSurfaceSample.ICurveEdge.t

## @evidence contracts/development/common.md#meaningful-documentation

Documents the curve share, including its use across point and normal queries.
