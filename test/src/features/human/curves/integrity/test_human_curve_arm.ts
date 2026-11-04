import { assertHumanCurves } from "../../../internal/assertHumanCurves";

/**
 * The arms and their joins are sound curves, on every person.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each person through the public body law and audits the arm chains' rings, spans and shared rings, catching a kinked arm walk, a slipped ring, an open join or sides that stop mirroring (each right ring reflected and rebuilt to the left hand's own palm-length and breadth inputs distal of the wrist by `HumanAnatomyMirror`, so a person whose hands differ is judged by his own inputs). A valid arm of any girth or length passes, since no rule names a coordinate, and its sections are read in their own planes across the bone.
 * @evidence contracts/testing.md#independent-expectations Tangent, gap and mirror properties of a surface are the basis, not this construction's output. Limits sit just above what reads smooth in the viewer, so a defect below a limit passes, and a rule the viewer outgrows gets its own check; the armpit's front fold has a wider limit because it is a fold by design. The `fold` rule reads the turn 4 mm either side of the ring, since a tangent plane agreed on the ring alone hid a notch round the arm's root.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts stature ends, a heavy and a slight whole person and the masculine end against the four references. The arm's ridge and seam rules own the bone walk's bends; the hand's test owns the fingers, and the trunk's test owns the ring the arm starts from.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_curve_arm`, generating each person it reads. It starts no process, browser or GPU, and the `HumanCurve*` pieces behind `HumanCurveAudit` own every rule.
 */
export function test_human_curve_arm(): void {
  assertHumanCurves(/^arm\./);
}
