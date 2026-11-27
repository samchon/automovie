import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieAffordance, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanActionContext, IAutoMovieMotionHumanColliders, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanPropReader, IAutoMovieMotionHumanSeated, IAutoMoviePhysicalShape, IAutoMovieResolvedBone, IAutoMovieRigidTransform, IAutoMovieVector3 } from "@automovie/interface";

import { seated } from "../../everyday/internal/seated";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanPropFrame } from "../../perform/internal/HumanPropFrame";
import { HumanColliders } from "../../posture/internal/HumanColliders";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import type { HumanMountOnFrame } from "./HumanMountOnFrame";
import { prepareMountSeat } from "./prepareMountSeat";
import * as PrepareMountMaterialSeatData from "./PrepareMountMaterialSeatData";

/*
 * Prepare the seat goal of an astride mount whose two actual stirrup treads
 * and seat are declared on one carrier. Bind the real seat slab by the four
 * corners of its declared top face, so a coincident bounding box, a rail or
 * another prop's seat cannot stand in for that plane. The hips are posed at
 * the mount's own final attitude before they are placed in the slab's frame.
 * The same film observation supplies the named seat and its material. A
 * reader with only the rigid site port supplies its own declared solids.
 * Parameter context: The body and its prop reader.
 * Parameter seat: The seat authored for the mount.
 * Parameter final: Read the exact terminal frame of the mount, in world
 * coordinates. Translation is immaterial to the fitted pelvis geometry.
 * Returns: The goal for `seated.root`, or undefined when the seat has no
 * qualified material binding.
 * If the bound deck cannot bear the posed pelvis.
 */
export function prepareMountMaterialSeat(
  context: MountContext,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  final: () => HumanMountOnFrame.Frame,
): IAutoMovieVector3 | undefined {
  return bind(context, seat, final)?.goal;
}

/*
 * One preparation's already-observed material and named site poses.
 */
export namespace prepareMountMaterialSeat {
  /*
   * A named material contact from the same observation as its solid.
   */
  export interface ISite {
    /*
     * The original posed model-local declaration.
     */
    affordance: IAutoMovieAffordance;

    /*
     * The contact's world placement at the preparation second.
     */
    frame: IAutoMovieRigidTransform;
  }

  /*
   * The actual seat box and its named upper bearing.
   */
  export interface ISeatSite extends ISite {
    /*
     * The supporting box in the observed model frame.
     */
    deck: SeatBox;
  }

  /*
   * The material frame, named contacts and admitted pelvis of one mount.
   */
  export interface IContext {
    /*
     * The carrier that owns the observed material and its contacts.
     */
    readonly subject: string;

    /*
     * The carrier's world pose at the single material observation.
     */
    frame: IAutoMovieRigidTransform;

    /*
     * All observed model-local affordances.
     */
    affordances: readonly IAutoMovieAffordance[];

    /*
     * All observed model-local shapes, with independent identities.
     */
    shapes: readonly IAutoMoviePhysicalShape[];

    /*
     * The actual seat and its upper bearing frame.
     */
    seat: ISeatSite;

    /*
     * The named iron on each foot's side.
     */
    treads: Readonly<Record<AutoMovieHumanSide, ISite>>;

    /*
     * The certified local pelvis socket and its sagittal interval.
     */
    domain: prepareMountSeat.ISeat;

    /*
     * World goal in the mount's authored root convention.
     */
    goal: IAutoMovieVector3;
  }

  /*
   * Prepare one shared seated material observation for the coupled leg fit.
   * Parameter source: The body and its prop reader.
   * Parameter seat: The authored seat and its named treads.
   * Parameter final: The intended terminal pelvis frame.
   * Returns: The bound geometry, or undefined for unqualified seats.
   */
  export function context(
    source: MountContext,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    final: () => HumanMountOnFrame.Frame,
  ): IContext | undefined {
    const body: IBound | undefined = bind(source, seat, final, true);
    if (body === undefined) return undefined;
    const frame: IAutoMovieRigidTransform =
      body.frame ?? HumanPropFrame.parent(body.seat.frame, body.named);
    const site = (affordance: IAutoMovieAffordance): ISite => ({
      affordance,
      frame: HumanPropFrame.compose(frame, {
        position: affordance.frame.translation,
        rotation: affordance.frame.rotation,
      }),
    });
    return {
      subject: body.subject,
      frame,
      affordances: body.affordances,
      shapes: body.shapes,
      seat: body.seat,
      treads: { left: site(body.treads.left), right: site(body.treads.right) },
      domain: body.domain,
      goal: body.goal,
    };
  }
}

/*
 * Bind the posed material once for either preparation entry.
 */
function bind(
  context: MountContext,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  final: () => HumanMountOnFrame.Frame,
  shared: boolean = false,
): IBound | undefined {
  const carrier: string | undefined = seat.carrier;
  const name: string | undefined = seat.point;
  const left: string | undefined = seat.footrestPoints?.left;
  const right: string | undefined = seat.footrestPoints?.right;
  if (
    seat.astride !== true ||
    carrier === undefined ||
    name === undefined ||
    left === undefined ||
    right === undefined ||
    left === right
  )
    return undefined;

  const prop: IAutoMovieMotionHumanPropReader = context.prop(carrier);
  const site: IAutoMovieMotionHumanPropReader["site"] = prop.site;
  const snapshot: IAutoMovieMotionHumanPropReader.ISnapshot | undefined =
    prop.snapshot?.(context.start);
  if (
    snapshot === undefined &&
    (site === undefined ||
      prop.prop.hasArticulations === true ||
      (shared && prop.prop.point !== undefined))
  )
    return undefined;
  const { affordances, shapes } = snapshot?.posed ?? prop.prop;
  if (affordances === undefined || shapes === undefined) return undefined;

  const surface: IAutoMovieAffordance | undefined = affordances.find(
    (item: IAutoMovieAffordance): boolean =>
      item.id === name && item.kind === "seat" && item.astride === true,
  );
  const leftTread: IAutoMovieAffordance | undefined = stirrup(affordances, left);
  const rightTread: IAutoMovieAffordance | undefined = stirrup(affordances, right);
  if (
    surface?.width === undefined ||
    surface.depth === undefined ||
    leftTread === undefined ||
    rightTread === undefined
  )
    return undefined;

  const named: IAutoMovieRigidTransform = {
    position: surface.frame.translation,
    rotation: surface.frame.rotation,
  };
  const local: IAutoMovieRigidTransform = HumanPropFrame.relative(named, PrepareMountMaterialSeatData.MODEL);
  const halfWidth: number = surface.width / 2;
  const depth: number = surface.depth;
  const deck: SeatBox | undefined = shapes.find(
    (shape: IAutoMoviePhysicalShape): shape is SeatBox =>
      shape.kind === "box" && top(local, shape, halfWidth, depth),
  );
  if (deck === undefined) return undefined;

  const world: IAutoMovieRigidTransform =
    snapshot === undefined
      ? site!.call(prop, name, context.start)
      : HumanPropFrame.compose(snapshot.frame, named);
  const posture: IAutoMovieMotionHumanPosture = { ...final(), limbs: {} };
  const socket: IAutoMovieHumanoidSurfaces.IFrame =
    context.body.surfaces.sockets.seat;
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    poseBones(
      context.body,
      resolveHumanPosture(context.body, posture),
      undefined,
      new Set<AutoMovieHumanoidBone>([socket.bone]),
    );
  const point: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
    socket,
    bones.get(socket.bone)!,
  );
  const basis: IAutoMovieRigidTransform = {
    position: point,
    rotation: world.rotation,
  };
  const pelvis: prepareMountSeat.ISolid[] = HumanColliders.placed(
    context.body,
    bones,
  ).flatMap(
    (part: IAutoMovieMotionHumanColliders.IPlaced): prepareMountSeat.ISolid[] => {
      const pose: IAutoMovieRigidTransform = HumanPropFrame.relative(
        basis,
        part.pose,
      );
      return part.shapes.map(
        (shape: IAutoMoviePhysicalShape): prepareMountSeat.ISolid => ({
          pose,
          shape,
        }),
      );
    },
  );
  const admitted: prepareMountSeat.ISeat | undefined = prepareMountSeat({
    deck: { pose: local, shape: deck },
    pelvis,
    obstacles: shapes.flatMap(
      (shape: IAutoMoviePhysicalShape): prepareMountSeat.ISolid[] =>
        shape === deck ? [] : [{ pose: local, shape }],
    ),
  });
  if (admitted === undefined)
    throw new AutoMovieMotionHumanRefusal({
      kind: "affordance",
      axis: "seat",
      value: name,
      feasible: null,
      reason: `the posed pelvis has no clear bearing region on ${carrier}.${name}`,
      fix: "use a saddle with a larger clear bearing surface for this rider",
    });

  const target: IAutoMovieVector3 = Vector3.add(
    world.position,
    Quaternion.rotateVector(world.rotation, admitted.point),
  );
  // The root writer names the rest-frame seat socket. Retain the actual posed
  // anatomical socket even when hips angles displace it from that reference.
  return {
    subject: prop.prop.subject,
    frame: snapshot?.frame,
    named,
    treads: { left: leftTread, right: rightTread },
    seat: { affordance: surface, frame: world, deck },
    domain: admitted,
    affordances,
    shapes,
    goal: Vector3.add(
      target,
      Vector3.subtract(seated.socket(context.body, posture), point),
    ),
  };
}

/*
 * A named stirrup with an explicit two-dimensional tread.
 */
function stirrup(
  affordances: readonly IAutoMovieAffordance[],
  id: string,
): IAutoMovieAffordance | undefined {
  return affordances.find(
    (item: IAutoMovieAffordance): boolean =>
      item.id === id &&
      item.kind === "stirrup" &&
      item.width !== undefined &&
      item.depth !== undefined,
  );
}

/*
 * Match the actual upper face in the named front-edge frame.
 */
function top(
  local: IAutoMovieRigidTransform,
  shape: SeatBox,
  halfWidth: number,
  depth: number,
): boolean {
  const pose: IAutoMovieRigidTransform = HumanPropFrame.compose(
    local,
    shape.transform,
  );
  // Only bound rounding in the composed rigid transform and the corner
  // projections. The named plane gains no clearance or physical thickness.
  const roundoff: number =
    64 *
    Number.EPSILON *
    Math.max(1, depth, halfWidth, Vector3.length(pose.position));
  if (
    Vector3.distance(Quaternion.rotateVector(pose.rotation, PrepareMountMaterialSeatData.UP), PrepareMountMaterialSeatData.UP) > roundoff
  )
    return false;
  const half: IAutoMovieVector3 = shape.halfExtents;
  for (const x of [-half.x, half.x])
    for (const z of [-half.z, half.z]) {
      const corner: IAutoMovieVector3 = Vector3.add(
        pose.position,
        Quaternion.rotateVector(pose.rotation, { x, y: half.y, z }),
      );
      if (
        Math.abs(corner.y) > roundoff ||
        Math.abs(Math.abs(corner.x) - halfWidth) > roundoff ||
        Math.min(Math.abs(corner.z), Math.abs(corner.z + depth)) > roundoff
      )
        return false;
    }
  return true;
}

/*
 * The mount's body and named material at its entry on the film clock.
 */
type MountContext = Pick<
  IAutoMovieMotionHumanActionContext,
  "body" | "prop" | "start"
>;

/*
 * The finite bearing box whose top face matches the named seat.
 */
type SeatBox = Extract<IAutoMoviePhysicalShape, { kind: "box" }>;

/*
 * The site declarations before their common carrier frame places them.
 */
type Declarations = Readonly<Record<AutoMovieHumanSide, IAutoMovieAffordance>>;

/*
 * The shared material and chosen pelvis, before placing the two tread sites.
 */
interface IBound {
  /*
   * The carrier whose posed material this provides.
   */
  readonly subject: string;

  /*
   * The exact carrier pose when the reader has a same-film snapshot.
   */
  frame: IAutoMovieRigidTransform | undefined;

  /*
   * Both named treads from the same model observation.
   */
  treads: Declarations;

  /*
   * The admitted site and actual box.
   */
  seat: prepareMountMaterialSeat.ISeatSite;

  /*
   * The declared seat's own model-local frame.
   */
  named: IAutoMovieRigidTransform;

  /*
   * All affordances in the same model observation.
   */
  affordances: readonly IAutoMovieAffordance[];

  /*
   * All actual physical components in the same model observation.
   */
  shapes: readonly IAutoMoviePhysicalShape[];

  /*
   * The prepared socket and its clear interval in the seat itself.
   */
  domain: prepareMountSeat.ISeat;

  /*
   * World goal in the mount's authored root convention.
   */
  goal: IAutoMovieVector3;
}
