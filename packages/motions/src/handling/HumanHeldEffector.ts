import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanHeld,
  IAutoMovieMotionHumanTouchEffector,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanHeld } from "../compose/AutoMovieMotionHumanHeld";
import { AutoMovieMotionHumanTouchEffector } from "../compose/AutoMovieMotionHumanTouchEffector";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanHand } from "../posture/HumanHand";

/** The alternatives of `HumanHeldEffectorContext`'s site. */
type HumanHeldEffectorContext = "body" | "entry" | "prop";

/**
 * Prepare the effector of a held prop's point (`HumanHeld.effector`): the point
 * and its directions in the hand's frame, read once at the entry, and for an
 * upright vessel the ring of its rim, turned per call.
 *
 * @param context The body, the entry that holds the prop and the prop reader,
 *   unchanged through the search.
 * @param row The act's use: hand surface and shape, the act's directions and
 *   whether the vessel stands upright.
 * @param side The holding hand.
 * @param subject The held prop's subject id.
 * @param point The contact id; the row's own when absent.
 * @param namedRim Start the rim at the named material point for a grasp taken
 *   to present that contact.
 * @returns The effector at a degree turn round an upright vessel's rim; a prop
 *   not upright gives the same effector at every turn.
 * @throws {HumanRefusal} When the hand does not hold the prop at the entry
 *   (`AutoMovieMotionHumanHeld.of`), no point is named, or the prop lacks the
 *   contact.
 */
export function HumanHeldEffector(
  context: Pick<IAutoMovieMotionHumanActionContext, HumanHeldEffectorContext>,
  row: IAutoMovieMotionHumanHeld.IUse,
  side: AutoMovieHumanSide,
  subject: string,
  point?: string,
  namedRim: boolean = false,
): (turn?: number) => IAutoMovieMotionHumanTouchEffector.IEffector {
  const held: IAutoMovieMotionHumanHeld.IHeld = AutoMovieMotionHumanHeld.of(
    context,
    side,
    subject,
  );
  const name: string | undefined = point ?? row.point;
  if (name === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "point",
      value: name,
      feasible: {
        kind: "alternatives",
        values: held.affordances.map(
          (affordance: IAutoMovieAffordance): string => affordance.id,
        ),
      },
      reason: "the act names no point of a held prop to bring to its region",
      fix: "name one of the prop's contacts as `point`, or perform the act without a prop",
    });

  const named: ReturnType<typeof AutoMovieMotionHumanHeld.point> =
    AutoMovieMotionHumanHeld.point(held, name);
  const socket: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    "grip",
  ).point;
  const normal: IAutoMovieVector3 = named.direction;
  const own: (
    direction: IAutoMovieMotionHumanTouchEffector.Direction | undefined,
    otherwise: IAutoMovieMotionHumanTouchEffector.Axis,
  ) => IAutoMovieVector3 = (
    direction: IAutoMovieMotionHumanTouchEffector.Direction | undefined,
    otherwise: IAutoMovieMotionHumanTouchEffector.Axis,
  ): IAutoMovieVector3 =>
    AutoMovieMotionHumanTouchEffector.direction(side, direction ?? otherwise);
  const at: IAutoMovieVector3 = Vector3.add(socket, named.point);
  const along: IAutoMovieVector3 = across(
    side,
    normal,
    own(row.effector.along, "fingers"),
  );
  let ring: IGeometry["ring"];
  if (row.upright === true) {
    const origin: IAutoMovieVector3 = Vector3.add(socket, held.frame.position);
    const centre: IAutoMovieVector3 = Vector3.add(
      origin,
      Vector3.scale(normal, Vector3.dot(Vector3.subtract(at, origin), normal)),
    );
    const radial: IAutoMovieVector3 = Vector3.subtract(at, centre);
    const radius: number = Vector3.length(radial);
    const toward: IAutoMovieVector3 =
      namedRim && radius > 0
        ? Vector3.scale(radial, 1 / radius)
        : across(side, normal, own(row.effector.facing, "palm"));
    ring = { centre, radius, toward, across: Vector3.cross(normal, toward) };
  }
  const offset: IAutoMovieVector3 = HumanHand.offset(
    context.body,
    side,
    row.effector.surface,
    row.effector.shape,
  ).point;
  return turning({
    surface: row.effector.surface,
    shape: row.effector.shape,
    at,
    normal,
    along: row.upright === true ? normal : along,
    offset,
    scale: 1 / context.body.measure.hand,
    ring,
    axes: {
      fingers: AutoMovieMotionHumanTouchEffector.axis(side, "fingers"),
      palm: AutoMovieMotionHumanTouchEffector.axis(side, "palm"),
      thumb: AutoMovieMotionHumanTouchEffector.axis(side, "thumb"),
    },
  });
}
/** The record of `IGeometryRing`'s site. */
type IGeometryRing = {
  centre: IAutoMovieVector3;
  radius: number;
  toward: IAutoMovieVector3;
  across: IAutoMovieVector3;
};

/** The alternatives of `GeometryAxesEntry`'s site. */
type GeometryAxesEntry = "fingers" | "palm" | "thumb";

/** A held contact's hand-local geometry. */
interface IGeometry {
  /** The hand surface the effector is measured from. */
  surface: IAutoMovieMotionHumanHand.Surface;

  /** The hand form. */
  shape: IAutoMovieMotionHumanHand.Shape;

  /** The contact point from the wrist in hand axes, metres, before any rim turn. */
  at: IAutoMovieVector3;

  /** The contact's outward unit direction in hand axes. */
  normal: IAutoMovieVector3;

  /**
   * The act's along direction laid across the normal, or the vessel's axis when
   * upright.
   */
  along: IAutoMovieVector3;

  /** The hand surface's point from the wrist in hand axes, metres. */
  offset: IAutoMovieVector3;

  /** One over the body's hand length, for tool weights in hand lengths. */
  scale: number;

  /** The hand's three orthonormal anatomical axes. */
  axes: Record<GeometryAxesEntry, IAutoMovieVector3>;

  /**
   * An upright vessel's rim: centre, radius and the two in-plane directions;
   * absent for other props.
   */
  ring: IGeometryRing | undefined;
}

/**
 * The least share of a unit direction left after projecting out the contact's
 * normal for the direction to be laid across it, the sine of the angle between
 * them (provisional: about 17.5 degrees; nearer the normal the projection's
 * heading swings with small changes of either, so the hand axis least along the
 * normal is taken instead).
 */
const ACROSS: number = 0.3;
/** The alternatives of `AcrossSpareAxis`'s site. */
type AcrossSpareAxis = "fingers" | "palm" | "thumb";

/**
 * A direction laid across the normal: its projection, or the hand axis least
 * along the normal when too little is left.
 */
function across(
  side: AutoMovieHumanSide,
  normal: IAutoMovieVector3,
  direction: IAutoMovieVector3,
): IAutoMovieVector3 {
  const flat: (vector: IAutoMovieVector3) => IAutoMovieVector3 = (
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 =>
    Vector3.subtract(
      vector,
      Vector3.scale(normal, Vector3.dot(vector, normal)),
    );
  const projected: IAutoMovieVector3 = flat(direction);
  if (Vector3.length(projected) > ACROSS) return Vector3.normalize(projected);
  const spare: IAutoMovieVector3 = (["fingers", "palm", "thumb"] as const)
    .map(
      (axis: AcrossSpareAxis): IAutoMovieVector3 =>
        AutoMovieMotionHumanTouchEffector.axis(side, axis),
    )
    .sort(
      (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
        Math.abs(Vector3.dot(a, normal)) - Math.abs(Vector3.dot(b, normal)),
    )[0]!;
  return Vector3.normalize(flat(spare));
}

/**
 * The effector at a turn round the rim: the point and facing turned, then
 * weighed on the hand's axes.
 */
function turning(
  fixed: IGeometry,
): (turn?: number) => IAutoMovieMotionHumanTouchEffector.IEffector {
  return (turn: number = 0): IAutoMovieMotionHumanTouchEffector.IEffector => {
    let at: IAutoMovieVector3 = fixed.at;
    let facing: IAutoMovieVector3 = fixed.normal;
    if (fixed.ring !== undefined) {
      const angle: number = (turn * Math.PI) / 180;
      facing = Vector3.add(
        Vector3.scale(fixed.ring.toward, Math.cos(angle)),
        Vector3.scale(fixed.ring.across, Math.sin(angle)),
      );
      at = Vector3.add(
        fixed.ring.centre,
        Vector3.scale(facing, fixed.ring.radius),
      );
    }
    const from: IAutoMovieVector3 = Vector3.subtract(at, fixed.offset);
    return {
      surface: fixed.surface,
      shape: fixed.shape,
      tool: weights(Vector3.scale(from, fixed.scale), fixed.axes),
      facing: weights(facing, fixed.axes),
      along: weights(fixed.along, fixed.axes),
    };
  };
}
/** The alternatives of `WeightsEntryResult`'s site. */
type WeightsEntryResult = "fingers" | "palm" | "thumb";

/** A vector's components along the hand's anatomical axes. */
function weights(
  vector: IAutoMovieVector3,
  axes: IGeometry["axes"],
): Record<WeightsEntryResult, number> {
  return {
    fingers: Vector3.dot(vector, axes.fingers),
    palm: Vector3.dot(vector, axes.palm),
    thumb: Vector3.dot(vector, axes.thumb),
  };
}
