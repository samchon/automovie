import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanMountRider } from "../lexicon/HumanMountRider";
import { HumanSurfaceGlide } from "./HumanSurfaceGlide";
import { pivotSurfaceFoot } from "./pivotSurfaceFoot";

type Params = IAutoMovieMotionHumanSurface.ISnowGlideParams;
type Context = IAutoMovieMotionHumanActionContext<Params>;
type Plan = IAutoMovieMotionHumanActionPlan;
type Posture = IAutoMovieMotionHumanPosture;

/** The ski's local forward axis and the pole handle's local tangent. */
const FORWARD: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
/** Both feet checked against each set of ski edges. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * Turn on the selected ski edges or use a Nordic pole and opposite ski
 * on the shared glide. Alpine skiing measures a transfer across opposing
 * edges during the turn (https://doi.org/10.1371/journal.pone.0176975).
 * The distinct Nordic stroke follows the pole and opposite ski phases of
 * Pellegrini et al. (2020, Figure 2,
 * https://pubmed.ncbi.nlm.nih.gov/32439501/). The authored glide supplies
 * speed and stopping. The pole's own prop motion supplies its moving grip.
 *
 * @param context The entered stance and the authored snow technique.
 * @returns The fitted glide and the named edge or pole transitions.
 * @throws {HumanRefusal} When the edge change or the pole support is infeasible.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the supported techniques, sources and path and hand-contact ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Unweight between opposite ski cants about the actual support points. A Nordic pole catch carries the hand on the named moving grip through an opposite-foot kick.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare one shared glide, then overlay the optional edge transfer and the optional pole stroke.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Consume the given snow orientation and the named pole frames. A missing pole contact or a same-sign edge transfer is not converted into bilateral travel.
 * @evidence contracts/development/implementation.md#efficient-algorithms Once per pose, one base sample, two local foot rotations if the edge transfer is active, and one pole frame if the stroke is active.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the shared glide, foot pivot and round-handle fit.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the input edge or pole data and one base plan for the action.
 */
export function HumanSnowGlide(context: Context): Plan {
  const base: Plan = HumanSurfaceGlide.plan(context);
  const transfer: Params["edgeTransfer"] = context.params.edgeTransfer;
  const stroke: Params["nordic"] = context.params.nordic;
  if (transfer === undefined && stroke === undefined) return base;
  if (transfer !== undefined && stroke !== undefined)
    throw new HumanRefusal({
      kind: "parameter",
      axis: "nordic",
      value: stroke,
      feasible: null,
      reason: "one snow glide uses either alpine edging or a Nordic stroke",
      fix: "stage the two techniques as separate glides",
    });
  if (transfer !== undefined) {
    HumanBound.within(
      "edgeTransfer.at",
      transfer.at,
      0,
      base.duration,
      "s",
      "both",
    );
    HumanBound.within("edgeTransfer.counter", transfer.counter, 0, 35, "deg");
    for (const [name, edge] of [
      ["first", transfer.first],
      ["next", transfer.next],
    ] as const) {
      HumanBound.within(
        `edgeTransfer.${name}.degrees`,
        edge.degrees,
        -45,
        45,
        "deg",
      );
      for (const side of SIDES) {
        const pivot: IAutoMovieVector3 = edge.pivots[side];
        HumanBound.within(
          `edgeTransfer.${name}.pivots.${side}.x`,
          pivot.x,
          -1,
          1,
          "m",
        );
        HumanBound.within(
          `edgeTransfer.${name}.pivots.${side}.y`,
          pivot.y,
          -1,
          1,
          "m",
        );
        HumanBound.within(
          `edgeTransfer.${name}.pivots.${side}.z`,
          pivot.z,
          -1,
          1,
          "m",
        );
      }
    }
    if (transfer.first.degrees * transfer.next.degrees >= 0)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "edgeTransfer.next.degrees",
        value: transfer.next.degrees,
        feasible: null,
        reason: "the new ski edges must have the opposite sign",
        fix: "select the other pair of ski edges with the opposite cant",
      });
    return {
      ...base,
      events: [
        ...base.events,
        { name: "edgeChange", share: transfer.at / base.duration },
      ].sort(byShare),
      posture: (at: number): Posture => {
        const posture: Posture = base.posture(at);
        const first: boolean = at <= transfer.at;
        const edge: IAutoMovieMotionHumanSurface.IBladeEdge = first
          ? transfer.first
          : transfer.next;
        const share: number = first
          ? at / transfer.at
          : (at - transfer.at) / (base.duration - transfer.at);
        const weight: number =
          minimumJerk.share(2 * share) * (1 - minimumJerk.share(2 * share - 1));
        const twist: number =
          transfer.counter * weight * Math.sign(edge.degrees);
        const chest: readonly [number, number, number] = posture.joints
          .chest ?? [0, 0, 0];
        return {
          ...posture,
          joints: {
            ...posture.joints,
            chest: [chest[0], chest[1], chest[2] - twist],
          },
          limbs: {
            ...posture.limbs,
            leftLeg: pivotSurfaceFoot(
              posture.limbs.leftLeg!,
              edge.pivots.left,
              FORWARD,
              edge.degrees * weight,
            ),
            rightLeg: pivotSurfaceFoot(
              posture.limbs.rightLeg!,
              edge.pivots.right,
              FORWARD,
              edge.degrees * weight,
            ),
          },
        };
      },
    };
  }
  if (stroke === undefined) return base;
  const [catchAt, release]: typeof stroke.window = stroke.window;
  HumanBound.within("nordic.window[0]", catchAt, 0, base.duration, "s", "both");
  HumanBound.within(
    "nordic.window[1]",
    release,
    catchAt,
    base.duration,
    "s",
    "both",
  );
  HumanBound.within(
    "nordic.kick",
    stroke.kick,
    0,
    context.body.measure.shank,
    "m",
    "minimum",
  );
  const pole: IAutoMovieMotionHumanPropReader = context.prop(stroke.on);
  const read = (at: number): IAutoMovieMotionHumanProp.IPlacedPoint => {
    const target: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
      pole.prop.point?.(stroke.grip, context.start + at);
    if (target !== undefined) return target;
    throw new HumanRefusal({
      kind: "affordance",
      axis: "nordic.grip",
      value: stroke.grip,
      feasible: null,
      reason: "the named pole does not supply a moving grip frame",
      fix: "give the pole a film-clock point reader for its grip",
    });
  };
  read(catchAt);
  read(release);
  const leg: "rightLeg" | "leftLeg" =
    stroke.hand === "left" ? "rightLeg" : "leftLeg";
  return {
    ...base,
    events: [
      ...base.events,
      { name: "poleCatch", share: catchAt / base.duration },
      { name: "poleRelease", share: release / base.duration },
    ].sort(byShare),
    contacts: [
      ...base.contacts,
      {
        part: `${stroke.hand}Hand`,
        kind: "grip",
        support: { kind: "prop", subject: stroke.on },
        from: catchAt / base.duration,
        to: release / base.duration,
      },
    ],
    posture: (at: number): Posture => {
      const posture: Posture = base.posture(at);
      const amount: number =
        minimumJerk.share((at - catchAt) / (release - catchAt)) *
        (1 - minimumJerk.share((at - release) / (base.duration - release)));
      const foot: IAutoMovieHumanLimbGoal = posture.limbs[leg]!;
      const kick: IAutoMovieVector3 = Quaternion.rotateVector(foot.rotation!, {
        x: 0,
        y: 0,
        z: -stroke.kick * amount,
      });
      const next: Posture = {
        ...posture,
        limbs: {
          ...posture.limbs,
          [leg]: {
            ...foot,
            point: Vector3.add(foot.point, kick),
            bend: Vector3.add(foot.bend, kick),
          },
        },
      };
      const gain: number =
        minimumJerk.share(at / catchAt) *
        (1 - minimumJerk.share((at - release) / (base.duration - release)));
      if (gain === 0) return next;
      const contact: IAutoMovieMotionHumanProp.IPlacedPoint = read(at);
      const radius: number =
        (pole.prop.affordances?.find(
          (item: NonNullable<typeof pole.prop.affordances>[number]): boolean =>
            item.id === stroke.grip,
        )?.aperture ?? 0) / 2;
      const arm: ReturnType<typeof HumanMountRider.hold> = HumanMountRider.hold(
        context.body,
        stroke.hand,
        next,
        {
          point: contact.point,
          normal: contact.normal,
          radius,
          ...(contact.rotation === undefined
            ? {}
            : { axis: Quaternion.rotateVector(contact.rotation, FORWARD) }),
        },
        gain,
        {},
      );
      return {
        ...next,
        joints: { ...next.joints, ...arm.fingers },
        limbs: { ...next.limbs, [`${stroke.hand}Arm`]: arm.arm },
      };
    },
  };
}

/** Emit simultaneous support events in chronological order. */
function byShare(left: { share: number }, right: { share: number }): number {
  return left.share - right.share;
}
