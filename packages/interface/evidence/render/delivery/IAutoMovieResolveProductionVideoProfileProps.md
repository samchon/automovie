# src/render/delivery/IAutoMovieResolveProductionVideoProfileProps.ts#IAutoMovieResolveProductionVideoProfileProps

## @evidence contracts/development/design.md#principled-representation

Already admitted video dimensions and rational frame rate. resolveProductionVideoProfile adds fixed codec metadata without validating or cloning these inputs; the returned profile shares frameRate with its caller.

## @evidence contracts/development/design.md#minimal-and-owned-surface

resolveProductionVideoProfile exchanges width, height, frameRate; their canonical owner is this contract and their concrete meanings are documented on the members.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Already admitted video dimensions and rational frame rate. resolveProductionVideoProfile adds fixed codec metadata without validating or cloning these inputs; the returned profile shares frameRate with its caller.

## @evidence contracts/development/common.md#meaningful-documentation

Already admitted video dimensions and rational frame rate. resolveProductionVideoProfile adds fixed codec metadata without validating or cloning these inputs; the returned profile shares frameRate with its caller. The prose and members document how resolveProductionVideoProfile interprets and admits these values.
