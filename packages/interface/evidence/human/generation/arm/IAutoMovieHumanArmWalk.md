# src/human/generation/arm/IAutoMovieHumanArmWalk.ts#IAutoMovieHumanArmWalk.IMeasuring

## @evidence contracts/development/common.md#meaningful-documentation

Symmetric arms-down width and the independently placed GH, calibration mm.

## @evidence contracts/development/design.md#principled-representation `breadth`: Public maximum horizontal breadth in the deltoid region. `lateral`: Absolute lateral GH coordinate in the neutral measuring convention. `humerus`: Actual rigid GH-to-elbow length.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmWalk.prepare, AutoMovieHumanArmWalk.create.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `breadth`, `lateral`, `humerus`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmWalk.ts#IAutoMovieHumanArmWalk.ISiteLaw

## @evidence contracts/development/common.md#meaningful-documentation

One site's law: its name, place, box and owner.

## @evidence contracts/development/design.md#principled-representation `site`: The measurement site, named in diagnostics. `bone`: Bone: 1 the humerus, 2 the forearm, 3 the third metacarpal (0 is the run inside the girdle). `share`: Share of the bone from its proximal centre.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanArmInterim.sites. Read by AutoMovieHumanArmWalk.prepare, AutoMovieHumanArmWalk.create. Also types AutoMovieHumanArmFrame.laws, AutoMovieHumanArmFrame.first.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `site`, `bone`, `share`, `edges`, `fullness`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmWalk.ts#IAutoMovieHumanArmWalk.IPrepared

## @evidence contracts/development/common.md#meaningful-documentation

Common original controls and the declared hand region; no completed arm is retained.

## @evidence contracts/development/design.md#principled-representation `controls`: Null controls preserve failure; a null hand chart means the caller supplied no named wrist.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by region, AutoMovieHumanArmWalk.prepare. Read by AutoMovieHumanHandAttachment.fromControls, AutoMovieHumanHandParent.fromControls. Also types AutoMovieHumanArmSources.armControls, AutoMovieHumanArmWalk.fail.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `controls`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmWalk.ts#IAutoMovieHumanArmWalk.IHandChart

## @evidence contracts/development/common.md#meaningful-documentation

Physical hand chart on the common distal scalar law, beginning at its named wrist tape.

## @evidence contracts/development/design.md#principled-representation `domain`: Actual wrist measurement station through the distal cap, calibration mm. `stations`: Only original hand-chart bracketing stations; no proximal-arm coordinates are prepared.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Also types AutoMovieHumanArmWalk.hand.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `domain`, `stations`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmWalk.ts#IAutoMovieHumanArmWalk.IShared

## @evidence contracts/development/common.md#meaningful-documentation

One invocation shares direct frame and local hand controls across both original consumers.

## @evidence contracts/development/design.md#principled-representation `frame`: Bone-relative chart without section solves or part publication. `hand`: Local forearm-to-palm owner, independent of upper-arm measurements.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by AutoMovieHumanArmWalk.prepare.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `frame`, `hand`; callers supply the complete record.

# src/human/generation/arm/IAutoMovieHumanArmWalk.ts#IAutoMovieHumanArmWalk.DefineArgs

## @evidence contracts/development/common.md#meaningful-documentation

Publish this actual arm from its shared generating controls; callers needing the palm request prepare directly.

## @evidence contracts/development/design.md#principled-representation

Publish this actual arm from its shared generating controls; callers needing the palm request prepare directly. Ordered tuple slots are name, bones, knuckle, reach, sites, joints, gap, crease, radial, measuring, connection; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanArmWalk.DefineArgs is the canonical exchange used by AutoMovieHumanArmWalk.define.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanArmWalk.define for publish this actual arm from its shared generating controls; callers needing the palm request prepare directly.
