/**
 * Closed vocabulary of the human actions an author chains: every law the
 * package ships has exactly one name here, and a chain, an interrupt table or
 * a legality rule refers to actions only by these names. The list grows
 * additively as laws land; a name is never repurposed.
 *
 * - `stand`: quiet standing on both feet.
 * - `walk`: walking to a floor point in whole steps.
 * - `approach`: walking up to a target and stopping at an interpersonal gap.
 * - `look`: standing and turning the eyes, head and trunk to a target.
 * - `gesture`: a communicative gesture of the hands, head or trunk while standing.
 * - `rest`: standing with the hands held at rest places (pockets, hips, crossed arms).
 * - `sit`: sitting down onto a seat from standing in front of it.
 * - `rise`: standing up from a seat.
 * - `shift`: edging sideways along a seat while seated.
 * - `bend`: bending down to bring a hand to a low point, feet planted.
 * - `punch`: a straight, hook or uppercut brought onto a target, or a feint of one.
 * - `handshake`: shaking hands with a partner at a shared meeting point.
 * - `kick`: a round kick's shin or a push kick's foot brought onto a target, or a feint of one.
 * - `guard`: taking and holding the fighting stance with the gloves up.
 * - `step`: fighting-stance footwork that keeps the stance.
 * - `defend`: a cover, parry, block, check or evasion against one placed strike.
 * - `flinch`: the protective startle away from a threat or a blow.
 * - `stagger`: one unplanned capture step after a push.
 * - `knockdown`: the legs giving way and the body going down to lie supine.
 */
export type HumanActionName = "stand" | "walk" | "approach" | "look" | "gesture" | "rest" | "punch" | "kick" | "guard" | "step" | "defend" | "flinch" | "stagger" | "knockdown" | "sit" | "rise" | "shift" | "bend" | "handshake";
