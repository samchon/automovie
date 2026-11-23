# src/motion/human/dressing/IAutoMovieMotionHumanWardrobe.ts#IAutoMovieMotionHumanWardrobe

## @evidence contracts/development/common.md#meaningful-documentation

Names each mode and the members it takes.

## @evidence contracts/development/design.md#principled-representation

A discriminated union on `kind`: each mode carries only the side or hand it reads.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The modes the wardrobe law performs, read by `wardrobe` and the lexicon's upperDress row.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every mode names the staged wearable prop; no garment geometry is restated here.

# src/motion/human/dressing/IAutoMovieMotionHumanWardrobe.ts#IAutoMovieMotionHumanWardrobe.Sided

## @evidence contracts/development/common.md#meaningful-documentation

Names the four one-sided modes: thread or clear a sleeve, close or open the zip.

## @evidence contracts/development/design.md#principled-representation

A closed union of the modes that act on one side, the discriminant of `ISide`.

## @evidence contracts/development/design.md#minimal-and-owned-surface `ISide.kind` reads it and `wardrobe` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per mode, so a one-sided mode cannot carry the jacket's or the foot's members.

# src/motion/human/dressing/IAutoMovieMotionHumanWardrobe.ts#IAutoMovieMotionHumanWardrobe.Footwear

## @evidence contracts/development/common.md#meaningful-documentation

Names the two seated footwear modes, on and off.

## @evidence contracts/development/design.md#principled-representation

A closed union of the footwear modes, the discriminant of `IFoot`.

## @evidence contracts/development/design.md#minimal-and-owned-surface `IFoot.kind` reads it and `wardrobe` branches on it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One literal per mode, so a footwear mode cannot carry the jacket's or the sleeve's members.

# src/motion/human/dressing/IAutoMovieMotionHumanWardrobe.ts#IAutoMovieMotionHumanWardrobe.IJacket

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The mode, the jacket and the hand that holds it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by `wardrobe`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The jacket's sleeves and hold are its own contacts.

# src/motion/human/dressing/IAutoMovieMotionHumanWardrobe.ts#IAutoMovieMotionHumanWardrobe.ISide

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning.

## @evidence contracts/development/design.md#principled-representation

The mode, the garment and the side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three members, read by `wardrobe`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The sleeve and the slider are the garment's own contacts.

# src/motion/human/dressing/IAutoMovieMotionHumanWardrobe.ts#IAutoMovieMotionHumanWardrobe.IFoot

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning and default.

## @evidence contracts/development/design.md#principled-representation

The mode, the footwear, the foot and the hand.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, read by `wardrobe`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The footwear's opening is its own contact.
