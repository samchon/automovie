import type { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import type { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";
import type { AutoMovieAffordanceKind } from "./AutoMovieAffordanceKind";
import type { AutoMovieGripKind } from "./AutoMovieGripKind";
import type { IAutoMovieAffordanceCoupling } from "./IAutoMovieAffordanceCoupling";

/**
 * A semantic contact point an object declares in its **own model-local frame**,
 * where another body may rest, grab, plug, or hang, independent of any bone.
 *
 * Bone attachments couple to a posed skeleton; an affordance instead marks a
 * model-local contact used by prop anchoring and support consumers.
 * propSupportFace transforms a stack-top footprint through the full affordance
 * and staged matrices for placement support. The separate rigid-only
 * affordanceSupportContacts helper currently has no product caller and does not
 * establish a wired toppling pipeline.
 *
 * The optional `grip`, `aperture`, `depth`, `back`, `astride`, `mount`,
 * `length`, `width`, `height`, `radius`, `load`, `travel` and `reverse` are the
 * few dimensions and seat flags human action laws read from an environment
 * contact (#3201 A8, the grasping section; #3368); each names the kinds that
 * read it, and the rest ignore it. `direction` states what a held object's
 * working point's `+Y` is, for the grasp that presents the object for its use.
 * `parts` and `rides` declare articulation on the model: which parts and which
 * other affordances move with an articulation's travel (#3365 decision 6);
 * `follows` couples one articulation's travel to another's (#3475). They are
 * flat optional fields of this existing record, the additive form an authored
 * contact can grow without rewriting every affordance; engine admission owns
 * the dimensions' positivity and the references' resolution.
 */
export interface IAutoMovieAffordance<Id extends string = string> {
  /** Stable id, unique within the model; action targets cite it by this. */
  id: Id;

  /** What the point is for. Drives which fields apply (see `extent`). */
  kind: AutoMovieAffordanceKind;

  /**
   * The contact frame in the model's local space: `translation` is where the
   * contact sits, `rotation` orients it (`+Y` out of a stack-top face, out of a
   * socket mouth). Seating aligns two of these frames coincident.
   *
   * A `surface` that shows a picture, a sign, a board or a label lies on the
   * model's outer surface, and a reader on its `+Y` side reads it with local
   * `+X` to the right and local `-Z` toward the face's top. Surface graphics
   * are laid out in this reading frame.
   */
  frame: IAutoMovieTransform;

  /**
   * Stack-top support points in the affordance-local XZ plane, with at least
   * three noncollinear finite XZ points; y is ignored. The intended footprint
   * is convex: propSupportFace transforms the points and constructs their
   * convex hull, filling any authored concavity. Every other kind, point- or
   * line-like, requires null. This does not establish a wired toppling
   * judgment.
   */
  extent: IAutoMovieVector3[] | null;

  /**
   * How a hand holds a `handle`, `bar`, `slider`, `knob`, `wheel` or `rein`; a
   * grasping law picks the power grip when absent. Other kinds ignore it.
   */
  grip?: AutoMovieGripKind;

  /**
   * The object's width across the grip, metres, positive: the diameter a power
   * or hook grip wraps, or the thickness a precision or lateral grip pinches.
   * The hand pre-shapes to it plus a safety margin during the reach (Jeannerod
   * 1984). Absent, a grasping law reads it from the object's own collider.
   */
  aperture?: number;

  /**
   * A `seat`'s depth from its front edge back along `-Z`, a `surface`'s,
   * `pedal`'s or `stirrup`'s extent along `+Z` centred on the frame, or a
   * `socket`'s depth from its mouth inward against its `+Y` (a bore's length, a
   * scabbard's), metres, positive; other kinds ignore it.
   */
  depth?: number;

  /**
   * The id of the model part carrying this material site. Its frame and
   * dimensions locate the site on that same part throughout its motion. Absent
   * for contacts without a declared material owner.
   */
  materialPart?: string;

  /**
   * A `seat`'s backrest height above the sitting surface, metres, positive;
   * absent for a backless seat. Other kinds ignore it.
   */
  back?: number;

  /**
   * Whether the seat serves a fixed task geometry, such as the thwart whose
   * height is set by the oarlocks. The sitting law uses the actor's joint reach
   * for such seats. Ordinary furniture keeps its ergonomic height range. Other
   * kinds ignore this flag.
   */
  workingSeat?: boolean;

  /**
   * Whether a `seat` is sat astride, a leg on either side of it, as a saddle or
   * a motorcycle's seat is. Absent or false, both legs go ahead of the seat.
   * The seat's shape does not say it (a narrow bench is not straddled, and
   * pedals lie either side of a driver's seat too), so a sitting law reads it
   * here to choose how the body gets on and off and where the legs hang. Other
   * kinds ignore it.
   */
  astride?: boolean;

  /**
   * The side a `seat` is got onto and off from, the seat's own left or right: a
   * horse is mounted from its left by convention. Absent or `either`, both
   * sides serve, as on a bicycle. A mounting law reads it to refuse the other
   * side. Other kinds ignore it.
   */
  mount?: "left" | "right" | "either";

  /**
   * The length along `+X`, centred on the frame, of a `handle`'s grip, a `bar`,
   * a `ledge` or a `rein`'s held run, or the length of the strap a `stirrup`
   * hangs from along `+Y`; metres, positive. Other kinds ignore it.
   */
  length?: number;

  /**
   * The extent along `+X`, centred on the frame, of a `seat`, a `surface`, a
   * `pedal`'s plate, a `stirrup`'s tread or an `aperture`'s opening, metres,
   * positive; other kinds ignore it.
   */
  width?: number;

  /**
   * The drawable outline of a graphic-bearing `surface` in its frame's XZ
   * plane, metres, y ignored: a simple polygon of at least three points inside
   * the `width` × `depth` rectangle centred on the frame, such as a STOP sign's
   * octagon on its square face. Surface graphics are clipped to it in every
   * pass, so nothing paints where the face has no surface. Absent, the outline
   * is that whole rectangle. Other kinds must leave it absent.
   */
  outline?: IAutoMovieVector3[];

  /**
   * An `aperture`'s clear height along `+Y` from the frame, metres, positive;
   * other kinds ignore it.
   */
  height?: number;

  /**
   * A `crank`'s arm length from the axle to its site along `+X`, a `wheel`'s
   * rim radius in the frame's XZ plane, a `bar`'s cross-section radius about
   * its `+X` axis (absent, a hand-sized bar), or the radius of the contact a
   * `socket` that is a tool's working point makes (a brush's bristles, a
   * needle's point; absent, a point), metres, positive; other kinds ignore it.
   */
  radius?: number;

  /**
   * The most weight a `bar`, `ledge`, `seat` or `surface` bears at its frame
   * before it fails, newtons, positive; absent, the contact bears any load. A
   * support law refuses a stance that loads it past this. Other kinds ignore
   * it.
   */
  load?: number;

  /**
   * The largest movement of an articulated part: a `hinge`'s opening and a
   * `knob`'s turn in degrees, a `wheel`'s turn to either side in degrees, a
   * `crank`'s turn in degrees (absent, it turns without limit), a `slider`'s
   * travel along `+X` and a `button`'s press, a `pedal`'s press and a
   * `trigger`'s pull along `-Y` in metres; positive. Absent on any articulation
   * but a `crank`, the articulation states no travel and stays at rest. Other
   * kinds ignore it.
   */
  travel?: number;

  /**
   * The largest movement of a `hinge`, `knob` or `slider` the other way from
   * rest, as a negative travel reaches it: a double-acting door's swing to its
   * other side or a gun's depression below its rest, in degrees, or a slider's
   * run along `-X` in metres; positive. Absent, the articulation does not move
   * the other way, so its travel runs from 0 to `travel`. Other kinds ignore
   * it: a `wheel` already turns either side.
   */
  reverse?: number;

  /**
   * Ids of the model's parts that move rigidly with this articulation's travel,
   * for the `hinge`, `slider`, `knob`, `button`, `trigger`, `crank`, `wheel`
   * and `pedal` kinds: a door's leaf on its hinge, a drawer's box on its
   * slider. Each id names a part of the owning model and belongs to at most one
   * affordance. Absent or empty, the articulation moves no geometry. Other
   * kinds bind no part: absent or empty.
   */
  parts?: string[];

  /**
   * What the frame's `+Y` is on a working affordance, the place a held object
   * does its work with: `along` is the direction the object runs toward this
   * point, out of its end (a muzzle's bore, a blade's or a spear's point, a
   * pole's tip, a torch's beam, a racket's sweet spot along the racket toward
   * its head's top); `normal` is the outward normal of a working face (a bat's
   * strike, a club's or a racket's face, a hammer's face, a blade's edge, a
   * shield's face, a cloth's underside). A grasp that presents the object for
   * its use reads it to know whether the object's line runs to this point along
   * `+Y` or across it. Every working affordance declares it; any other contact
   * leaves it absent.
   */
  direction?: "along" | "normal";

  /**
   * How a `handle`'s, a `bar`'s or a `rein`'s grip repeats as the hand turns
   * about the axis it wraps (`+X`): `round` when the same grasp exists at any
   * turn, the hand meeting the same part whichever way round it closes (a
   * bottle's body, a bat's handle, a rung, a bar, a rope); `half` when it
   * repeats only after half a turn, two equal faces either side of the axis (a
   * flat handle); `none` when it exists at one turn only (a pistol's grip, a
   * knife's handle, a mug's handle, a racket's flats). A grasp chooser reads it
   * to know which turns about the handle are the same grasp. Every `handle`,
   * `bar` and `rein` declares it; other kinds leave it absent.
   */
  symmetry?: "round" | "half" | "none";

  /**
   * Id of the articulation affordance of the same model that carries this
   * affordance: its frame moves rigidly with that articulation's travel, as a
   * door's handle rides the door's hinge and a pedal its crank, and when this
   * affordance is itself an articulation its `parts` move with both. The chain
   * of `rides` ends without returning to itself. Absent, the affordance is
   * fixed in the model.
   */
  rides?: string;

  /**
   * Another articulation of the same model whose travel sets this one's, for
   * the articulation kinds: a car's road wheels steer as its steering wheel
   * turns, a bow's limbs bend as its string is drawn. This articulation's
   * travel is `ratio` times the leader's, or the piecewise-linear function of
   * the leader's travel that `table` lists. A state names the leader, or a
   * follower whose coupling explicitly permits `reversible` driving. Absent,
   * the articulation is set on its own.
   */
  follows?: IAutoMovieAffordanceCoupling;
}
