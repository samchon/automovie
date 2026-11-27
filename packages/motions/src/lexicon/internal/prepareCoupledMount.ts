import { AutoMovieEngineKinematics } from "@automovie/engine";
import { Quaternion, Vector3, AutoMovieEnginePhysics, AutoMovieEngineMath, AutoMovieEnginePlanarGeometry } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanLimbGoal, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanColliders, IAutoMovieMotionHumanPosture, IAutoMoviePhysicalShape, IAutoMoviePose, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { sitPlace } from "../../everyday/internal/sitPlace";
import { HumanPropFrame } from "../../perform/HumanPropFrame";
import { HumanBodyFit } from "../../posture/HumanBodyFit";
import { HumanBodyFitMerit } from "../../posture/HumanBodyFitMerit";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanFitBalance } from "../../posture/HumanFitBalance";
import { HumanFitExterior } from "../../posture/HumanFitExterior";
import { HumanFitVariables } from "../../posture/HumanFitVariables";
import { HumanFoot } from "../../posture/HumanFoot";
import { HumanLimbFit } from "../../posture/HumanLimbFit";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanMountPush } from "../HumanMountPush";
import type { prepareMountMaterialSeat } from "./prepareMountMaterialSeat";
import { prepareMountSeat } from "./prepareMountSeat";
import { prepareMountTread } from "./prepareMountTread";

/**
 * Solve the terminal mounted key in the actual seat and tread frames. The
 * pelvis bears on the deck's actual surface. The leg chains share that pelvis
 * and the tread frames. Verify the finite bearing features before publishing
 * any support and carry their actual anchors into the next action.
 *
 * @param body The measured rider.
 * @param support The named material prepared for this mount.
 * @param preferred The original settled posture, with the admitted seat root.
 * @returns The seated key or the constraint that prevented its admission.
 */
export function prepareCoupledMount(
  body: IAutoMovieMotionHumanBody,
  support: prepareMountMaterialSeat.IContext,
  preferred: IAutoMovieMotionHumanPosture,
): prepareCoupledMount.IResult {
  const source: IAutoMoviePose = resolveHumanPosture(body, {
    ...preferred,
    limbs: {},
  });
  const left: ITread | undefined = tread(body, support, source, "left");
  const right: ITread | undefined = tread(body, support, source, "right");
  if (left === undefined || right === undefined)
    return {
      reason: `the ${left === undefined ? "left" : "right"} tread has no bearing foothold`,
    };

  const seatSocket = body.surfaces.sockets.seat;
  const treads = [left, right];
  const hips = poseBones(
    body,
    source,
    undefined,
    new Set<AutoMovieHumanoidBone>(
      treads.flatMap<AutoMovieHumanoidBone>(({ side, candidate }) => [
        `${side}UpperLeg`,
        `${side}Foot`,
        candidate.anchor.bone,
      ]),
    ),
  );
  const anchors = treads.map((tread) => prepareAnkle(tread, hips));
  const targets = treads.map<IAutoMovieMotionHumanBodyFitTypes.ITarget>(
    ({ frame, candidate }) => ({
      bone: candidate.anchor.bone,
      point: candidate.anchor.point,
      frame,
      goal: {
        ...candidate.anchor.material,
        y:
          candidate.anchor.material.y +
          HumanBodyFitMerit.REQUIRED_TOLERANCE / 2,
      },
      required: true,
    }),
  );
  const advance = supportedReach(body, support, anchors, hips);
  const root = Vector3.add(preferred.root, advance);
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {};
  for (const { side, ankle, frame } of anchors) {
    const name: "leftLeg" | "rightLeg" = `${side}Leg`;
    const hip: IAutoMovieResolvedBone | undefined = hips.get(`${side}UpperLeg`);
    if (hip === undefined) return { reason: `the rig has no ${side} hip` };
    const joint = Vector3.add(hip.worldPosition, advance);
    const across: IAutoMovieVector3 = Quaternion.rotateVector(
      support.seat.frame.rotation,
      { x: 1, y: 0, z: 0 },
    );
    const outward: IAutoMovieVector3 = Vector3.scale(
      across,
      Vector3.dot(
        Vector3.subtract(frame.position, support.seat.frame.position),
        across,
      ),
    );
    // Project the side direction into the plane of the reachable knee circle.
    // Its outermost point gives the knee pole of the existing two-link fit.
    const bend: IAutoMovieVector3 | null = HumanMountPush.knee(
      body,
      joint,
      ankle.position,
      Vector3.add(joint, outward),
    );
    if (bend === null)
      return { reason: `the ${side} leg has no knee plane at its tread` };
    limbs[name] = { point: ankle.position, bend };
  }
  const placed = resolveHumanPosture(body, { ...preferred, root, limbs });
  const start = resolvedJoints({ ...preferred, root }, placed);
  const legs: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperLeg",
    "leftLowerLeg",
    "rightUpperLeg",
    "rightLowerLeg",
    "leftFoot",
    "leftToes",
    "rightFoot",
    "rightToes",
  ]);
  const exterior: IAutoMovieMotionHumanColliders.IExternal[] =
    support.shapes.map((shape: IAutoMoviePhysicalShape) => ({
      subject: support.subject,
      part: shape.id,
      pose: support.frame,
      shapes: [shape],
    }));
  // Keep each whole tread as an obstacle. Only its top layer can hold a foot.
  const treadSurfaces = treads.map(({ frame, plate }) => {
    const { min, max } = AutoMovieEnginePhysics.physicalShapeBounds(plate.pose, plate.shape);
    const depth = Math.min(max.y - min.y, prepareCoupledMount.PRECISION);
    return {
      subject: support.subject,
      part: `${plate.shape.id}:bearing`,
      pose: frame,
      shapes: [
        {
          ...plate.shape,
          transform: {
            position: { x: 0, y: max.y - depth / 2, z: 0 },
            rotation: Quaternion.identity(),
          },
          halfExtents: {
            x: (max.x - min.x) / 2,
            y: depth / 2,
            z: (max.z - min.z) / 2,
          },
        },
      ],
    };
  });
  const subjectBones = new Set([...legs, seatSocket.bone]);
  // The arm course uses the resolved legs when it is prepared afterwards.
  const problem: IAutoMovieMotionHumanBodyFitTypes.IProps = {
    body,
    posture: start,
    self: false,
    targets,
    variables: HumanFitVariables.BODY.filter(
      (variable) =>
        variable.kind === "place" ||
        (variable.kind === "heading" && variable.axis === "pitch") ||
        (variable.kind === "angle" && legs.has(variable.bone)),
    ),
    exterior: {
      bones: subjectBones,
      obstacles: [...exterior, ...treadSurfaces],
      clearanceBones: legs,
      contacts: [
        {
          bone: seatSocket.bone,
          subject: support.subject,
          part: support.seat.deck.id,
        },
        ...treads.map(({ side }, index) => ({
          bone: [`${side}Foot`, `${side}Toes`] as const,
          subject: support.subject,
          part: treadSurfaces[index]!.part,
        })),
      ],
    },
  };
  // Move the geometric reach seed into a neighborhood of the fixed material
  // anchors before enforcing both exact positions in every linear step.
  const neighborhood = HumanBodyFit.fit({
    ...problem,
    targets: targets.map((target) => {
      const relaxed = { ...target };
      delete relaxed.required;
      return relaxed;
    }),
  });
  const first = admittedFit(neighborhood, seatSocket.bone, targets.length)
    ? neighborhood
    : HumanBodyFit.fit({ ...problem, posture: neighborhood.posture });
  if (!admittedFit(first, seatSocket.bone, targets.length)) {
    const closest = first.exterior;
    const gaps = (first.exteriorContacts ?? []).map(
      ({ bone, part, separation }) =>
        `${bone} to ${part} ${separation.toExponential(3)} m`,
    );
    const anchors = first.residuals.map(
      ({ point }, index) =>
        `${targets[index]!.bone} anchor ${point.toExponential(3)} mm`,
    );
    const details = [first.reason, ...gaps, ...anchors].join(", ");
    return {
      reason:
        closest !== undefined && closest.separation < 0
          ? `the ${closest.bone} penetrates ${closest.subject}.${closest.part} by ${(-closest.separation).toExponential(3)} m (${details})`
          : `the rider did not retain the seat and both treads (${details})`,
    };
  }

  const posture = first.posture;
  const shown: IAutoMoviePose = resolveHumanPosture(body, posture);
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    shown,
    undefined,
    subjectBones,
  );
  const pelvisFrame: IAutoMovieRigidTransform = {
    position: AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
      seatSocket,
      bones.get(seatSocket.bone)!,
    ),
    rotation: support.seat.frame.rotation,
  };
  const pelvic = HumanPropFrame.relative(
    support.seat.frame,
    pelvisFrame,
  ).position;
  const placedBody = HumanColliders.placed(body, bones);
  if (legOverlap(placedBody)) return { reason: "the fitted legs overlap" };
  const near = admitted(
    body,
    left,
    shown,
    bones,
    first.exteriorContacts?.find(({ part }) => part === treadSurfaces[0]!.part),
  );
  const far = admitted(
    body,
    right,
    shown,
    bones,
    first.exteriorContacts?.find(({ part }) => part === treadSurfaces[1]!.part),
  );
  if (near === undefined || far === undefined)
    return {
      reason: `the ${near === undefined ? "left" : "right"} foot has no bearing point on its tread`,
    };
  if (
    !supports(body, shown, support, placedBody, pelvisFrame, pelvic, [
      near.bearing,
      far.bearing,
    ])
  )
    return {
      reason: "the actual seat and treads cannot support the fitted rider",
    };
  return { key: { posture, feet: { left: near.goal, right: far.goal } } };
}

/** The current polygon rider accepts millimetre-scale surface error. */
function admittedFit(
  fit: IAutoMovieMotionHumanBodyFitTypes.IResult,
  seatBone: AutoMovieHumanoidBone,
  feet: number,
): boolean {
  return (
    fit.feasible ||
    ((fit.exterior?.separation ?? -Infinity) >=
      -prepareCoupledMount.PRECISION &&
      fit.exteriorContacts?.length === feet + 1 &&
      fit.exteriorContacts.every(
        ({ bone, separation }) =>
          Math.abs(separation) <=
          (bone === seatBone
            ? prepareCoupledMount.PRECISION
            : HumanFoot.BEARING),
      ))
  );
}

/** A chosen material anchor and the ankle it holds at the seed rotation. */
interface IAnchor {
  side: AutoMovieHumanSide;
  frame: IAutoMovieRigidTransform;
  ankle: IAutoMovieRigidTransform;
}

/** Recover the ankle from the real witness, which can belong to the toes. */
function prepareAnkle(
  tread: ITread,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IAnchor {
  const { side, frame, candidate } = tread;
  const foot = bones.get(`${side}Foot`)!;
  const bone = bones.get(candidate.anchor.bone)!;
  const footLocal = HumanPropFrame.relative(
    { position: foot.worldPosition, rotation: foot.worldRotation },
    { position: bone.worldPosition, rotation: bone.worldRotation },
  );
  const contact = Vector3.add(
    footLocal.position,
    Quaternion.rotateVector(footLocal.rotation, candidate.anchor.point),
  );
  const rotation = Quaternion.multiply(
    frame.rotation,
    candidate.ankle.rotation,
  );
  const material = candidate.anchor.material;
  const target = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, {
      ...material,
      y: material.y + HumanBodyFitMerit.REQUIRED_TOLERANCE / 2,
    }),
  );
  return {
    side,
    frame,
    ankle: {
      position: Vector3.subtract(
        target,
        Quaternion.rotateVector(rotation, contact),
      ),
      rotation,
    },
  };
}

/** Choose the nearest supported station inside both anchored leg's reach shells. */
function supportedReach(
  body: IAutoMovieMotionHumanBody,
  support: prepareMountMaterialSeat.IContext,
  feet: readonly IAnchor[],
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
): IAutoMovieVector3 {
  type Interval = readonly [number, number];
  const direction = Quaternion.rotateVector(support.seat.frame.rotation, {
    x: 0,
    y: 0,
    z: 1,
  });
  const { point, range } = support.domain;
  let stations: Interval[] = [[range[0] - point.z, range[1] - point.z]];
  for (const { side, ankle } of feet) {
    const difference = Vector3.subtract(
      ankle.position,
      bones.get(`${side}UpperLeg`)!.worldPosition,
    );
    const along = Vector3.dot(direction, difference);
    const across = Math.max(
      0,
      Vector3.dot(difference, difference) - along ** 2,
    );
    const geometry = body.chains[`${side}Leg`]?.rig?.span.geometry;
    const [minimum, maximum] = sitPlace.band(body, side);
    const lower =
      geometry === undefined || geometry === null
        ? minimum ** 2
        : geometry.k - geometry.span;
    const upper =
      geometry === undefined || geometry === null
        ? maximum ** 2
        : geometry.k + geometry.span;
    if (across > upper) return { x: 0, y: 0, z: 0 };
    const outside = Math.sqrt(upper - across);
    const inside = Math.sqrt(Math.max(0, lower - across));
    const reach: Interval[] =
      inside === 0
        ? [[along - outside, along + outside]]
        : [
            [along - outside, along - inside],
            [along + inside, along + outside],
          ];
    stations = stations.flatMap(([a, b]) =>
      reach.flatMap(([c, d]): Interval[] => {
        const start = Math.max(a, c);
        const end = Math.min(b, d);
        return start <= end ? [[start, end]] : [];
      }),
    );
  }
  const best = stations.reduce((nearest, [start, end]) => {
    const candidate = Math.max(start, Math.min(end, 0));
    return Math.abs(candidate) < Math.abs(nearest) ? candidate : nearest;
  }, Infinity);
  return Vector3.scale(direction, Number.isFinite(best) ? best : 0);
}

/** Retain the rig's solved branch without a further endpoint fit. */
function resolvedJoints(
  posture: IAutoMovieMotionHumanPosture,
  pose: IAutoMoviePose,
): IAutoMovieMotionHumanPosture {
  return {
    ...posture,
    limbs: {},
    joints: Object.fromEntries(
      pose.joints.map((joint) => [
        joint.bone,
        [joint.flexion ?? 0, joint.abduction ?? 0, joint.twist ?? 0],
      ]),
    ),
  };
}

/** Verify the actual top contact and, for an edge support, the load footprint. */
function supports(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  material: prepareMountMaterialSeat.IContext,
  placed: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  pelvisFrame: IAutoMovieRigidTransform,
  socket: IAutoMovieVector3,
  footholds: readonly IAutoMovieVector3[],
): boolean {
  const deck = {
    pose: HumanPropFrame.relative(material.seat.frame, material.frame),
    shape: material.seat.deck,
  };
  const hips = placed.filter(
    (part) => part.bone === body.surfaces.sockets.seat.bone,
  );
  const pelvis = hips.flatMap((part) => {
    const pose = HumanPropFrame.relative(pelvisFrame, part.pose);
    return part.shapes.map((shape) => ({ pose, shape }));
  });
  if (prepareMountSeat.bears({ deck, pelvis }, socket)) return true;

  const seat = bearingPoints(
    hips,
    material.seat.frame,
    material.frame,
    deck.shape,
    prepareCoupledMount.PRECISION,
  );
  if (seat.length === 0) return false;
  const centre = HumanFitBalance.centre(body, poseBones(body, pose));
  return AutoMovieEnginePlanarGeometry.pointInPolygon(
    { x: centre.x, y: centre.z },
    AutoMovieEngineMath.convexHull2D([...seat, ...footholds]).map((point) => ({
      x: point.x,
      y: point.z,
    })),
  );
}

/** Read actual pairs on the exposing face, excluding contacts on its rim. */
function bearingPoints(
  actors: readonly IAutoMovieMotionHumanColliders.IPlaced[],
  site: IAutoMovieRigidTransform,
  owner: IAutoMovieRigidTransform,
  surface: IAutoMoviePhysicalShape,
  band: number,
): IAutoMovieVector3[] {
  const normal = Quaternion.rotateVector(site.rotation, { x: 0, y: -1, z: 0 });
  const points: IAutoMovieVector3[] = [];
  for (const actor of actors)
    for (const shape of actor.shapes)
      for (const { pointA, pointB } of AutoMovieEnginePhysics.physicalShapeContactManifold(
        actor.pose,
        shape,
        owner,
        surface,
        normal,
        band,
      ))
        if (
          Vector3.distance(pointA, pointB) <= band &&
          Math.abs(
            Vector3.dot(normal, Vector3.subtract(pointB, site.position)),
          ) <= HumanBodyFit.TOLERANCE
        )
          points.push(pointB);
  return points;
}

function legOverlap(
  parts: readonly IAutoMovieMotionHumanColliders.IPlaced[],
): boolean {
  const right: IAutoMovieMotionHumanColliders.IExternal[] = parts
    .filter((part) => part.bone.startsWith("right"))
    .map((part) => ({ ...part, subject: "rider", part: part.bone }));
  const left = parts.filter((part) => part.bone.startsWith("left"));
  const overlap = HumanFitExterior.prepare(right, HumanBodyFit.TOLERANCE);
  return overlap(left).some(
    (pair) => pair.contact.distance < -HumanBodyFit.TOLERANCE,
  );
}

interface ITread {
  side: AutoMovieHumanSide;
  frame: IAutoMovieRigidTransform;
  plate: prepareMountTread.IPlate;
  iron: Parameters<typeof prepareMountTread>[0]["iron"];
  candidate: prepareMountTread.ICandidate;
}

/** Prefer the placement with the greatest margin to both ends of its interval. */
function footprint(
  body: IAutoMovieMotionHumanBody,
  pose: IAutoMoviePose,
  { side, plate, iron }: Pick<ITread, "side" | "plate" | "iron">,
  rotation: IAutoMovieQuaternion,
): prepareMountTread.ICandidate | undefined {
  return prepareMountTread({
    body,
    pose,
    side,
    plate,
    iron,
    rotation,
    depth: 0,
  }).reduce<prepareMountTread.ICandidate | undefined>(
    (best, current) =>
      best === undefined ||
      current.range[1] - current.range[0] > best.range[1] - best.range[0]
        ? current
        : best,
    undefined,
  );
}

function tread(
  body: IAutoMovieMotionHumanBody,
  support: prepareMountMaterialSeat.IContext,
  pose: IAutoMoviePose,
  side: AutoMovieHumanSide,
): ITread | undefined {
  const { affordance, frame } = support.treads[side];
  if (affordance.width === undefined || affordance.depth === undefined)
    return undefined;
  const local: IAutoMovieRigidTransform = HumanPropFrame.relative(
    frame,
    support.frame,
  );
  const width: number = affordance.width;
  const depth: number = affordance.depth;
  // Named dimensions and placed solid differ only by rigid-frame roundoff.
  const precision: number = 64 * Number.EPSILON * Math.max(1, width, depth);
  const shape: Extract<IAutoMoviePhysicalShape, { kind: "box" }> | undefined =
    support.shapes.find(
      (
        item: IAutoMoviePhysicalShape,
      ): item is Extract<IAutoMoviePhysicalShape, { kind: "box" }> => {
        if (item.kind !== "box") return false;
        const { min, max }: ReturnType<typeof AutoMovieEnginePhysics.physicalShapeBounds> =
          AutoMovieEnginePhysics.physicalShapeBounds(local, item);
        return (
          Math.abs(min.x + width / 2) <= precision &&
          Math.abs(max.x - width / 2) <= precision &&
          Math.abs(min.z + depth / 2) <= precision &&
          Math.abs(max.z - depth / 2) <= precision &&
          Math.abs(max.y) <= precision
        );
      },
    );
  if (shape === undefined) return undefined;
  const plate: prepareMountTread.IPlate = { pose: local, shape };
  const iron: ITread["iron"] = support.shapes
    .filter((item) => item !== shape)
    .map((item) => ({ pose: local, shape: item }));
  const candidate: prepareMountTread.ICandidate | undefined = footprint(
    body,
    pose,
    { side, plate, iron },
    Quaternion.identity(),
  );
  return candidate === undefined
    ? undefined
    : { side, frame, plate, iron, candidate };
}

function admitted(
  body: IAutoMovieMotionHumanBody,
  tread: ITread,
  pose: IAutoMoviePose,
  bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  witness:
    | IAutoMovieMotionHumanBodyFitTypes.IExteriorContactResidual
    | undefined,
): { goal: IAutoMovieHumanLimbGoal; bearing: IAutoMovieVector3 } | undefined {
  if (witness === undefined) return undefined;
  const { side, frame, plate } = tread;
  const footBone = side === "left" ? "leftFoot" : "rightFoot";
  const foot = bones.get(footBone)!;
  const knee = bones.get(side === "left" ? "leftLowerLeg" : "rightLowerLeg")!;
  const local = Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(witness.pointB, frame.position),
  );
  const { min, max } = AutoMovieEnginePhysics.physicalShapeBounds(plate.pose, plate.shape);
  const top = {
    x: Math.max(min.x, Math.min(max.x, local.x)),
    y: max.y,
    z: Math.max(min.z, Math.min(max.z, local.z)),
  };
  const bearing = Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, top),
  );
  if (Vector3.distance(witness.pointA, bearing) > HumanFoot.BEARING)
    return undefined;
  const seed = HumanLimbFit.seed(
    body,
    pose,
    side === "left" ? "leftLeg" : "rightLeg",
  );
  return {
    bearing,
    goal: {
      point: foot.worldPosition,
      rotation: foot.worldRotation,
      bend: knee.worldPosition,
      contact: Quaternion.rotateVector(
        Quaternion.inverse(foot.worldRotation),
        Vector3.subtract(bearing, foot.worldPosition),
      ),
      planted: true,
      ...(seed === null ? {} : { seed }),
    },
  };
}

/** Prepared mounted pose and its associated contact goals. */
export namespace prepareCoupledMount {
  /** Positional tolerance for PolygonMan's mounted surface fit, metres. */
  export const PRECISION: number = HumanFitVariables.resolution({
    kind: "place",
    axis: "y",
  });

  /** Whether the posed body meets the material requirements of the key. */
  export type IResult =
    | { key: IKey; reason?: never }
    | { reason: string; key?: never };

  /** The seated posture and the verified world goals carried by both treads. */
  export interface IKey {
    posture: IAutoMovieMotionHumanPosture;
    feet: Readonly<Record<AutoMovieHumanSide, IAutoMovieHumanLimbGoal>>;
  }
}
