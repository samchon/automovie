# src/motion/import/IAutoMovieExternalMotionNativeDecision.ts#IAutoMovieExternalMotionNativeDecision

## @evidence contracts/development/design.md#principled-representation

Native use needs only the take, the author's source rig and the mapping, because the tracks replay on the rig the bytes describe and nothing is converted between skeletons.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The native arm repeats the three shared fields rather than extending a base type, keeping each arm readable on its own at the cost of three duplicated property declarations.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rig is not trusted blindly: adoption recomputes each mapped bone's parent and rest from the inspected nodes and requires exact equality.

## @evidence contracts/development/common.md#meaningful-documentation

The property comments state the take id form, the rig's id, uniqueness, hips and exact-basis requirements, and that the mapping must cover every animated node.
