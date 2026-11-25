# src/human/generation/foot/IAutoMovieHumanFootInterim.ts#IAutoMovieHumanFootInterim.IAnkleSource

## @evidence contracts/development/common.md#meaningful-documentation

A real leg-family ankle capability, without claiming that its upper parent is already complete.

## @evidence contracts/development/design.md#principled-representation `ankleStation`: Original physical ankle station, calibration mm. `source`: Same retained distal authority with an explicit full-parent resolver.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanFootInterim.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `ankleStation`, `source`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootInterim.ts#IAutoMovieHumanFootInterim.IDefinition

## @evidence contracts/development/design.md#principled-representation

Makes the actual foot's heel, axis and regional supports the source for every toe. `foot`: The actual foot builder input, including its shared regional support datum. `definition`: Same final original read by the attachments, metric owner and production loft. `toes`: Hallux first, each with its actual generated attachment and walk.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Owns one foot input and five explicit attachment records. Returned by AutoMovieHumanFootInterim.define.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Does not recover placement from a generated course or reuse the old skeletal foot's different yaw and origin. Required fields are `foot`, `definition`, `toes`, `diagnostics`; callers supply the complete record.

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes source inputs from a realized foot, and skin attachments from skeletal centres. The foot input and all five toe sources sharing its actual floor frame and metatarsal support origin, before loft or skin construction.

# src/human/generation/foot/IAutoMovieHumanFootInterim.ts#IAutoMovieHumanFootInterim.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Shared local source controls and child inputs; actual parent publication stays an explicit method.

## @evidence contracts/development/design.md#principled-representation `controls`: Same original scalar/frame controls consumed by the foot and its toe contacts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanFootInterim.prepare. Also types AutoMovieHumanFootInterim.shared, AutoMovieHumanLegSources.foot.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `controls`; callers supply the complete record.

# src/human/generation/foot/IAutoMovieHumanFootInterim.ts#IAutoMovieHumanFootInterim.DefineArgs

## @evidence contracts/development/common.md#meaningful-documentation

Explicit original-parent publication preserves the previous public definition contract.

## @evidence contracts/development/design.md#principled-representation

Explicit original-parent publication preserves the previous public definition contract. Ordered tuple slots are name, d, ankle, leg, measures, scale; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanFootInterim.DefineArgs is the canonical exchange used by AutoMovieHumanFootInterim.define.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanFootInterim.define for explicit original-parent publication preserves the previous public definition contract.
