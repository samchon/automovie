# src/architecture/validateDesignReference.ts#validateDesignReference

## @evidence contracts/development/implementation.md#principled-implementation

Treats the reference as a graph of declared ids and checks each layer only against the layer it may cite, resolving references through id sets and frame ownership through a primitive-to-frame index; primitive families are looked up in a `Map`, so an inherited object property can never pass as a family.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The reference owns its layered rules; the frame rules live in `validateDesignSourceFrame`, and id declaration, reference resolution, blank strings and ranges come from the shared validation helpers instead of private copies.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No sheet, frame, kind or id is special-cased; an unknown scale stays null and a barren analysis stays `unsupported` or `not-run` rather than being filled in.

## @evidence contracts/development/common.md#meaningful-documentation

The documentation states the four layers and why they are kept apart, every refusal class, the frame binding of an analysis, the point units and bounds, the text rule, the path root, that nothing throws, and that asset bytes are not read.

## @evidence contracts/development/implementation.md#efficient-algorithms

Builds record/reference indexes and scans points, frame scale candidates, candidate/issue references and analysis citations. Each analysis citation walks its candidate's primitive references again for frame binding, adding their summed lengths even for repeated invalid citations; indexes do not make that repeated work linear in distinct records alone.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A validation of one reference per call that coordinates no shared work; `promoteDesignObservations` calls it once per promotion.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The id sets, frame and candidate indexes and the producing-analysis map are local and released on return, each bounded by its record count; the returned validation holds the findings.
