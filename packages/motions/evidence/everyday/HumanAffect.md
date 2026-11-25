# src/everyday/HumanAffect.ts#HumanAffect.angles

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs' units, the seed's role and default, the clinical-degree output, the empty result outside the display and the refusal; each pattern is documented on the namespace.

## @evidence contracts/development/implementation.md#principled-implementation

Joint-angle pulses under minimum-jerk envelopes, zero with zero velocity at both ends; the laugh note interval is Provine's 210 ms and the yawn length Provine's, other amplitudes and timings provisional as documented. A sob's and a weep's pulse times come from a counter-based random stream keyed by the seed, so any time can be read in any order. Angles are the rig's clinical degrees per bone.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One switch over the display, shared with the layer, writes the angles through one ramp, one pulse, one pulse train, the shared sigh and yawn clock and one joint writer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No special case: the amplitudes are named in the namespace documentation as cited or provisional, a length the display cannot fit throws instead of being clamped, and the sob's intensity range that scales its density is named with its Nyquist basis.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per call for most displays: at most three pulses for a cough and a fixed set of bones per display; a sob or weep walks the pulses before the time read, at most its length over its shortest interval.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sigh and yawn share limits on a fixed normalized clock. Each angle is evaluated for the requested second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Allocates one small record per call and retains nothing.

# src/everyday/HumanAffect.ts#HumanAffect.layer

## @evidence contracts/development/common.md#meaningful-documentation

States that displays add in any order and overlap, the layer's name and the refusal; the layer adds clinical degrees to the posture's joints at film seconds.

## @evidence contracts/development/implementation.md#principled-implementation

An additive animation layer: each display's angles are summed onto the posture's joints, leaving limb goals untouched so the arms are solved after the trunk and contacts stay; an arm the action poses by joint angles while it holds a contact on that hand gets a limb goal at the hand's pre-layer frame (`affectHeldHands`), so the trunk moves under it without sliding the contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Every display's length is checked once, when the layer is built; each posture then skips displays outside their window and writes the active ones into one joint copy through the pattern `angles` uses, the default lengths staying in LENGTH.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A length a display cannot fit is refused when the layer is built, before any frame is drawn; every active display is summed by the same formulas as `angles`.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the D displays per posture plus the active displays' few bones, with no intermediate angle map.

## @evidence contracts/development/implementation.md#reuse-equivalent-work `angles` and the layer share the pattern; every display and time is evaluated afresh.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The layer holds the caller's display list for its lifetime and allocates one joint record per posture.
