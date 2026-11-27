import { Quaternion, Vector3, minimumJerk, resolveAutoMovieCenterOfMass, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanWorkout,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanMaterialContact } from "../../posture/HumanMaterialContact";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";

/** The torso bones whose exterior can carry wall reaction. */
const TORSO: ReadonlySet<AutoMovieHumanoidBone> = new Set([
  "hips",
  "spine",
  "chest",
]);

/**
 * Fit the held wall sit to its named fixed face and verify the floor friction
 * needed to balance the resulting frictionless-wall reaction. Preserve the
 * lower-body goals through entry, hold and release.
 */
export function workoutWallSit(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanWorkout.IParams>,
  plan: IAutoMovieMotionHumanActionPlan,
  ready: number,
  release: number,
): IAutoMovieMotionHumanActionPlan {
  const on: IAutoMovieMotionHumanWorkout.IParams["on"] = context.params.on;
  if (context.params.kind !== "wallSit" || on === undefined) return plan;
  const reader: IAutoMovieMotionHumanPropReader = context.prop(on.prop);
  const site: HumanMaterialContact.ISite | undefined =
    HumanMaterialContact.prepare(reader, on.affordance, context.start);
  const source: IAutoMovieMotionHumanPosture = plan.posture(ready);
  const face: HumanMaterialContact.IFace | undefined = site?.at(context.start);
  if (
    site === undefined ||
    face === undefined ||
    reader.prop.motion !== undefined ||
    reader.prop.hasArticulations === true ||
    reader.prop.mounted !== undefined
  )
    throw refusal(on.affordance, "a wall sit needs a fixed finite wall face");
  const normal: IAutoMovieVector3 = Quaternion.rotateVector(
    face.frame.rotation,
    HumanMaterialContact.NORMAL,
  );
  if (
    Math.abs(normal.y) > 1e-6 ||
    Vector3.dot(normal, HumanFrame.forward(source.yaw)) < 0.99
  )
    throw refusal(
      on.affordance,
      "the wall must be upright and face the sitter's back",
    );
  const measure: ReturnType<typeof HumanMaterialContact.preparePosture> =
    HumanMaterialContact.preparePosture(context.body, TORSO);
  const approach: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
    measure(source, face);
  if (approach === undefined)
    throw refusal(on.affordance, "the sitter's back misses the finite wall");
  const delta: IAutoMovieVector3 = Vector3.scale(normal, -approach.clearance);
  const fit = (
    posture: IAutoMovieMotionHumanPosture,
    blend: number,
  ): IAutoMovieMotionHumanPosture => ({
    ...posture,
    root: Vector3.add(posture.root, Vector3.scale(delta, blend)),
  });
  const held: IAutoMovieMotionHumanPosture = fit(source, 1);
  const original: ReturnType<typeof poseBones> = poseBones(
    context.body,
    resolveHumanPosture(context.body, source),
  );
  const shown: ReturnType<typeof poseBones> = poseBones(
    context.body,
    resolveHumanPosture(context.body, held),
  );
  for (const bone of ["leftFoot", "rightFoot"] as const) {
    const a: IAutoMovieResolvedBone = original.get(bone)!;
    const b: IAutoMovieResolvedBone = shown.get(bone)!;
    if (Vector3.distance(a.worldPosition, b.worldPosition) > HumanFoot.BEARING)
      throw refusal(
        on.affordance,
        "the sitter cannot reach the wall with both feet planted",
      );
  }
  const bearing: IAutoMovieMotionHumanContactWindow.IMaterial | undefined =
    measure(held, face);
  if (bearing === undefined || Math.abs(bearing.clearance) > 1e-5)
    throw refusal(on.affordance, "the held back misses the wall");
  const center: IAutoMovieVector3 = resolveAutoMovieCenterOfMass.place(
    context.body.massModel,
    shown,
  );
  const floor: IAutoMovieVector3[] = HumanFoot.base(context.body, shown, [
    "left",
    "right",
  ]);
  const foot: readonly [number, number] | undefined = pressureRange(
    floor,
    center,
    normal,
  );
  const lever: number = foot === undefined ? Infinity : Math.max(0, foot[0]);
  const touch: IAutoMovieVector3 = HumanMaterialContact.world(
    face,
    bearing.point,
  );
  const floorHeight: number = Math.min(
    ...floor.map((point: IAutoMovieVector3): number => point.y),
  );
  const friction: number = context.params.floorFriction ?? 0.6;
  const ratio: number = workoutWallSit.reaction(
    lever,
    0,
    touch.y - floorHeight,
  );
  if (
    !Number.isFinite(friction) ||
    friction < 0 ||
    foot === undefined ||
    lever > foot[1] ||
    !Number.isFinite(ratio) ||
    ratio > friction
  )
    throw refusal(
      on.affordance,
      "the wall sit exceeds available floor friction or support",
    );

  const duration: number = plan.duration;
  return {
    ...plan,
    contacts: [
      ...plan.contacts,
      {
        part: "back",
        kind: "bear",
        region: bearing.bone === "hips" ? "lowerBack" : "upperBack",
        from: ready / duration,
        to: release / duration,
        support: site.support,
        material: bearing,
        load: 0,
      },
    ],
    posture: (
      ...args: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>
    ): IAutoMovieMotionHumanPosture => {
      const time: number = args[0];
      const envelope: number =
        minimumJerk.share(ready > 0 ? time / ready : 1) *
        (release >= duration
          ? 1
          : 1 - minimumJerk.share((time - release) / (duration - release)));
      return fit(plan.posture(...args), envelope);
    },
  };
}

/**
 * Moment balance for a frictionless wall (Biscarini et al. 2020, Fig. 1 and
 * Eqs. 12–16, doi:10.3390/app10093019).
 */
export namespace workoutWallSit {
  /**
   * Wall normal divided by body weight. The floor normal equals body weight and
   * the floor's tangential share has the opposite sign. Distances use the
   * horizontal wall-normal axis and metres.
   */
  export function reaction(
    pressure: number,
    center: number,
    height: number,
  ): number {
    return height > 0 ? (pressure - center) / height : Infinity;
  }
}

/**
 * Slice the convex floor support through the centre of mass, parallel to the
 * wall normal. Use the actual sole outlines to bound the pressure's sagittal
 * lever when a lateral offset places it near a footprint edge.
 */
function pressureRange(
  floor: readonly IAutoMovieVector3[],
  center: IAutoMovieVector3,
  normal: IAutoMovieVector3,
): readonly [number, number] | undefined {
  const along: IAutoMovieVector3 = Vector3.cross(
    HumanMaterialContact.NORMAL,
    normal,
  );
  const ring: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D([...floor]);
  const projected: IAutoMovieVector3[] = ring.map(
    (point: IAutoMovieVector3): IAutoMovieVector3 => {
      const delta: IAutoMovieVector3 = Vector3.subtract(point, center);
      return {
        x: Vector3.dot(delta, normal),
        y: 0,
        z: Vector3.dot(delta, along),
      };
    },
  );
  const bounds: number[] = [];
  for (let i: number = 0; i < projected.length; ++i) {
    const a: IAutoMovieVector3 = projected[i]!;
    const b: IAutoMovieVector3 = projected[(i + 1) % projected.length]!;
    if (a.z === 0) bounds.push(a.x);
    if ((a.z < 0 && b.z > 0) || (a.z > 0 && b.z < 0))
      bounds.push(a.x + (b.x - a.x) * (-a.z / (b.z - a.z)));
  }
  return bounds.length === 0
    ? undefined
    : [Math.min(...bounds), Math.max(...bounds)];
}

/** Report a fixed-face fit or support failure at the named wall. */
function refusal(face: string, reason: string): HumanRefusal {
  return new HumanRefusal({
    kind: "affordance",
    axis: "on",
    value: face,
    reason,
    fix: "stage a reachable upright wall and a floor that can bear the stance",
  });
}
