/**
 * Closed vocabulary of the human actions an author chains: every law the
 * package ships has exactly one name here, and a chain, an interrupt table or
 * a legality rule refers to actions only by these names. The list grows
 * additively as laws land; a name is never repurposed.
 *
 * - `stand`: quiet standing on both feet.
 * - `walk`: walking to a floor point in whole steps.
 * - `run`: jogging, running or sprinting to a floor point, with a flight phase each step.
 * - `jump`: a push-off, a ballistic flight and a two-footed landing on a floor point.
 * - `approach`: walking up to a target and stopping at an interpersonal gap.
 * - `look`: standing and turning the eyes, head and trunk to a target.
 * - `gesture`: a communicative gesture of the hands, head or trunk while standing.
 * - `rest`: standing with the hands held at rest places (pockets, hips, crossed arms).
 * - `sit`: sitting down onto a seat from standing in front of it.
 * - `rise`: standing up from a seat.
 * - `shift`: edging sideways along a seat while seated.
 * - `bend`: bending down to bring a hand to a low point, feet planted.
 * - `stepOver`: stepping over a low obstacle, lead foot then trail foot.
 * - `brace`: bracing for an expected impact, push or falling body.
 * - `typeText`: typing a text on a keyboard with the index fingertips.
 * - `punch`: a straight, hook or uppercut brought onto a target, or a feint of one.
 * - `handshake`: shaking hands with a partner at a shared meeting point.
 * - `pickUp`: reaching for a prop's grip, grasping it and lifting it.
 * - `putDown`: setting a held prop down at a place and letting go.
 * - `handOver`: handing a held prop to a receiver, letting go only after the receiver's grip closes.
 * - `receive`: taking a prop a giver holds out.
 * - `kick`: a round kick's shin or a push kick's foot brought onto a target, or a feint of one.
 * - `guard`: taking and holding the fighting stance with the gloves up.
 * - `step`: fighting-stance footwork that keeps the stance.
 * - `defend`: a cover, parry, block, check or evasion against one placed strike.
 * - `flinch`: the protective startle away from a threat or a blow.
 * - `stagger`: one unplanned capture step after a push.
 * - `knockdown`: the legs giving way and the body going down to lie supine.
 * - `knee`: a knee driven onto a target, in the clinch or free.
 * - `touch`: a hand laid on a partner's or one's own region and moved on it by a kind of touch.
 * - `handToFace`: a hand-to-face task of daily living (drink, eat, phone, read, groom).
 * - `crouch`: a crouch or squat held over the planted feet, then standing again.
 * - `kneel`: kneeling on one knee, on both, or sitting back on the heels, then rising.
 * - `climbStairs`: climbing a flight of stairs up or down, step over step or step by step.
 * - `throwObject`: throwing a held object overarm, underarm or as a toss along a ballistic path to a target.
 * - `catchObject`: catching a thrown object where its path enters the reach, giving with it and holding it.
 * - `operate`: pressing a button, turning a knob, sliding a drawer or swinging a door by its handle.
 * - `lieDown`: lying down on the floor from standing, supine, prone or on a side.
 * - `crawl`: getting down onto hands and knees and crawling in the diagonal pattern.
 * - `kiss`: the lips brought to a partner's region by a lean and a neck flexion.
 * - `highFive`: two partners' hands meeting at one shared point and instant.
 * - `selfAction`: a whole-body self action (stretch, victory arms, fist pump, neck or shoulder roll).
 * - `exercise`: a standing bodyweight exercise counted in repetitions (squat, lunge, high knees, jumping jack).
 */
export type HumanActionName =
  | "stand"
  | "walk"
  | "run"
  | "jump"
  | "approach"
  | "look"
  | "gesture"
  | "rest"
  | "punch"
  | "kick"
  | "guard"
  | "step"
  | "defend"
  | "flinch"
  | "stagger"
  | "knockdown"
  | "knee"
  | "sit"
  | "rise"
  | "shift"
  | "bend"
  | "handshake"
  | "pickUp"
  | "putDown"
  | "handOver"
  | "receive"
  | "stepOver"
  | "brace"
  | "typeText"
  | "touch"
  | "handToFace"
  | "crouch"
  | "kneel"
  | "climbStairs"
  | "throwObject"
  | "catchObject"
  | "operate"
  | "lieDown"
  | "crawl"
  | "kiss"
  | "highFive"
  | "selfAction"
  | "exercise";
