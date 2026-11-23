# src/production/IAutoMovieExternalMotionAdoption.ts#IAutoMovieExternalMotionAdoption

## @evidence contracts/development/design.md#principled-representation

Asset, take, shot, actor, exposed clip, source rig and mapping explicitly describe one intended conversion. This pure declaration has no surviving production inventory/conversion reader; byte identity, rig compatibility, conversion precision and actor binding require an explicit host rather than following from these fields.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Asset and take selection, actor ownership, exposed clip and mapping are declared once, with retarget-only translation scale confined to the mode union.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No automatic asset/take selection or name-derived mapping is declared. Actor/clip exclusivity and actual enactment are intended obligations without a surviving production enforcement gate; retaining this metadata does not create a converted clip.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies user ownership of every adoption choice, manifest and inspected take addressing, shot and actor scope, exposed clip identity and byte-grounded source characterization.
