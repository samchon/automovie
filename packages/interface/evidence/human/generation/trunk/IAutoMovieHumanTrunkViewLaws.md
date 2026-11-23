# src/human/generation/trunk/IAutoMovieHumanTrunkViewLaws.ts#IAutoMovieHumanTrunkViewLaws

## @evidence contracts/development/common.md#meaningful-documentation

Describes person-specific trunk profile and section-box laws with named upper stations and retained mass setbacks; nested declarations retain their units, frames, optional states and callback contracts.

## @evidence contracts/development/design.md#principled-representation

Person-specific trunk profile and section-box laws with named upper stations and retained mass setbacks. Named nested records and aliases preserve these distinctions; callers must satisfy their numeric premises because structural types do not enforce numeric validity.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Interface owns these dependency-free exchange types for AutoMovieHumanTrunkViews; Human retains the producer, evaluator and validation code, while imported geometry contracts keep their original owner.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups the existing TrunkViewLaws contracts without adding runtime factories, fixture selectors or alternative representations; any fitted or conventional quantities remain identified by their nested declarations.

# src/human/generation/trunk/IAutoMovieHumanTrunkViewLaws.ts#IAutoMovieHumanTrunkViewLaws.ILaws

## @evidence contracts/development/common.md#meaningful-documentation

The laws the views read beyond the published measures, each a pure function of the person in calibration millimetres.

## @evidence contracts/development/design.md#principled-representation `chest`: Shared chest/bust-apex height from the generating placement, calibration mm; the interim caller still transfers its old course solve. `backStations`: Retained stations of the same back law. `perineum`: The perineum's forward place, mm.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanTrunkInterim.upperSites, AutoMovieHumanTrunkLaws.of. Read by AutoMovieHumanMassInterim.breast, AutoMovieHumanMassInterim.gluteal, AutoMovieHumanTrunkViews.of. Also types AutoMovieHumanBodyLaneInterim.pending, AutoMovieHumanBodyLaneInterim.laws.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `backStations`: Retained stations of the same back law.

# src/human/generation/trunk/IAutoMovieHumanTrunkViewLaws.ts#IAutoMovieHumanTrunkViewLaws.IBox

## @evidence contracts/development/common.md#meaningful-documentation

A breadth and depth of a level, mm.

## @evidence contracts/development/design.md#principled-representation `breadth`: Whole breadth. `depth`: Whole depth.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanTrunkViews.topHipBox, AutoMovieHumanTrunkViews.underbust.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `depth`; callers supply the complete record.

# src/human/generation/trunk/IAutoMovieHumanTrunkViewLaws.ts#IAutoMovieHumanTrunkViewLaws.IOfAmplitudes

## @evidence contracts/development/common.md#meaningful-documentation

Retained breast and gluteal wall setbacks in calibration millimetres. Actual local mass projections remain separately determined by their source wall and anatomical AP apex.

## @evidence contracts/development/design.md#principled-representation

Retained breast and gluteal wall setbacks in calibration millimetres. Actual local mass projections remain separately determined by their source wall and anatomical AP apex.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkViewLaws.IOfAmplitudes is the canonical exchange used by AutoMovieHumanTrunkViews.of.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The alias retains the existing AutoMovieHumanTrunkViews input/result boundary and its documented ordering, units and absence states; it introduces no fixture-specific branch or widened escape type.
