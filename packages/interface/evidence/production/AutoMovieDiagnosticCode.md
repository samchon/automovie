# src/production/AutoMovieDiagnosticCode.ts#AutoMovieDiagnosticCode

## @evidence contracts/development/design.md#principled-representation

Explicit literals constrain typed diagnostic identities. Engine validators and realization still emit a subset, while retired Production codes remain representable for compatibility; the removed runtime catalog no longer establishes an exhaustive current producer registry.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The pure authoring package owns the erased code constraint and Engine producers choose their findings explicitly, without importing a runtime catalog into this type.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The union remains closed after removal of the obsolete prose-grader reservation; code membership constrains producers without widening to string or proving every declared code has a current producer.

## @evidence contracts/development/common.md#meaningful-documentation

Defines closed machine identity and distinguishes representable legacy codes from current producers and user-facing correction prose.
