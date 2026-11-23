# src/architecture/IAutoMovieDesignStamp.ts#IAutoMovieDesignStamp

## @evidence contracts/development/design.md#principled-representation `validateDesignLineage` compares the revision with the head, resolves the variant and checks its base equals the revision, resolves the phase, checks the configuration's `sha256:` form, and requires field-by-field equality with every derived input's stamp.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four fields name recorded revision, alternative, phase and configuration, with null for base design or a phase-independent view. These are the lineage comparison coordinates, not a complete independently measured list of every external choice that can change output bytes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A non-head revision refuses and all four fields are required. Configuration is checked only for digest spelling/equality, not recomputed from actual lowering inputs; same stamp does not prove equivalent execution or unchanged upstream artifact bytes.

## @evidence contracts/development/common.md#meaningful-documentation

States why every field is required, what null means for the variant and the phase, and each consistency rule the stamp must satisfy against the lineage and its inputs.
