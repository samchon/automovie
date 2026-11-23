# src/human/generation/f1/IAutoMovieHumanF1Frames.ts#IAutoMovieHumanF1Frames.ISegment

## @evidence contracts/development/common.md#meaningful-documentation

One segment: its name, parent, rule and reference frame.

## @evidence contracts/development/design.md#principled-representation `name`: Name, such as `humerus` or `index.middle`. `parent`: Parent segment; null for the root. `rule`: The written definition of its origin and axes, with its source or its declared substitute.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1Frames.segments. Also types AutoMovieHumanF1Frames.out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `name`, `parent`, `rule`, `frame`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1Frames.ts#IAutoMovieHumanF1Frames.IAngles

## @evidence contracts/development/common.md#meaningful-documentation

A joint ISB writes angles for: the segment it moves and the angle sequence.

## @evidence contracts/development/design.md#principled-representation `joint`: Joint name. `segment`: The child segment, whose rotation relative to its parent the angles read. `sequence`: ISB's sequence: Y-X-Y Euler (shoulder, Wu et al.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanF1Frames.ANGLES.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `joint`, `segment`, `sequence`, `names`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1Frames.ts#IAutoMovieHumanF1Frames.IJointLandmarks

## @evidence contracts/development/common.md#meaningful-documentation

Every segment parent-first, in the reference pose, by its rule.

## @evidence contracts/development/design.md#principled-representation `upperarm`: Reference joint `upperarm_r`. `lowerarm`: Reference joint `lowerarm_r`. `hand`: Reference joint `hand_r`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1Frames.IJointLandmarks is the canonical exchange used by AutoMovieHumanF1Frames.segments.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `upperarm`, `lowerarm`, `hand`, `thigh`, `calf`, `foot`, `index1`, `index2`, `index3`, `middle1`, `middle2`, `middle3`, `ring1`, `ring2`, `ring3`, `pinky1`, `pinky2`, `pinky3`, `thumb1`, `thumb2`, `thumb3`, `bigtoe1`, `bigtoe2`, `indextoe1`, `indextoe2`, `middletoe1`, `middletoe2`, `ringtoe1`, `ringtoe2`, `littletoe1`, `littletoe2`, `indexPad`, `middlePad`, `ringPad`, `pinkyPad`, `thumbPad`, `bigtoePad`, `indextoePad`, `middletoePad`, `ringtoePad`, `littletoePad`, `plate`, `breastRoot`, `breastTip`; callers supply the complete record.

# src/human/generation/f1/IAutoMovieHumanF1Frames.ts#IAutoMovieHumanF1Frames.ILandmarks

## @evidence contracts/development/common.md#meaningful-documentation

Every segment parent-first, in the reference pose, by its rule.

## @evidence contracts/development/design.md#principled-representation `epicondyleLateral`: EL, the lateral humeral epicondyle (Wu et al. `epicondyleMedial`: EM, the medial humeral epicondyle: the same section's extreme on the medial side (skin breadth EL to EM 75.0 mm; bony 61.9 +- 4.2 mm). `styloidRadial`: RS, the radial styloid (Wu et al.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanF1Frames.ILandmarks is the canonical exchange used by AutoMovieHumanF1Frames.segments.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `epicondyleLateral`, `epicondyleMedial`, `styloidRadial`, `styloidUlnar`, `femoralEpicondyleLateral`, `femoralEpicondyleMedial`, `pternion`, `suprasternale`, `pronasale`, `nasion`, `subnasale`, `metacarpalBase`, `tragion`; callers supply the complete record.
