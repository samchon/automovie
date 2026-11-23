# src/ingestDocument.ts#ingestDocument

## @evidence contracts/development/implementation.md#principled-implementation

Node and clip structure is mapped one to one with index ids, kinds follow a fixed precedence of joint, mesh, camera, then group, and each channel is checked against glTF's own sampler rules: an allowed path and interpolation, strictly increasing times, finite values, and output arity of keyframes times components times three for cubic splines; normalized accessors decode through `accessorValues`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function builds the id, parent, joint and resource-index maps once and maps nodes and animations; `toTrack` owns all channel validation, and the path and interpolation tables enumerate supported sampler vocabulary.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An unknown interpolation or target path throws rather than receiving a fallback interpretation, and no fixture-specific node, path or value is special-cased; lights are documented as not read.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states what each node keeps, the kind precedence, the interpolation mapping, normalized decoding, every refusal, and that the returned arrays share no storage with the document.

## @evidence contracts/development/implementation.md#efficient-algorithms

Work follows nodes and child links, meshes, cameras, skins and joints, animations and channels, and all per-track copied keyframe components; resource-index maps are built once and lookups use expected constant-time hash operations.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Maps are reused within one call over a mutable Document; a sampler shared by channels is copied per track so each track owns its arrays, and no cache coordinates separate calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The lookup maps are local and released on return or throw; the result retains new node records and per-track copies of keyframe data proportional to the document's animation size, owned by the caller, and no handle or task.
