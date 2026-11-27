import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanBodyFitTypes,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/internal/AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanLeg } from "../../compose/internal/AutoMovieMotionHumanLeg";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { poseBones } from "../../posture/internal/poseBones";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { sprintStartBlocks } from "./sprintStartBlocks";
import { sprintStartSetChain } from "./sprintStartSetChain";
import { sprintStartSetFit } from "./sprintStartSetFit";
import { sprintStartSetHands } from "./sprintStartSetHands";

/*
 * The set position's hips, pitch and feet for a body in front of a line.
 * Parameter context: The body and the entry, whose feet place the set's frame
 * (`sprintStartSetHands.frame`).
 * Parameter entry: The standing posture; the line is a foot's length ahead of its
 * stand's floor point.
 * Parameter front: The front foot.
 * Parameter sex: The measured centre-of-mass stratum.
 * Parameter placedFeet: Both feet on a placed block's plates (`sprintStartBlocks`),
 * held in all three axes; the fit then keeps the front knee within its
 * measured spread (FRONT_SD) and the rear knee and hip within theirs, and the
 * centre follows from the plates instead of its measured setting, or refuses.
 * Absent places the body-scaled blocks, the rear one from the rear knee's
 * measured mean.
 * Returns: The hips' world point, the trunk's pitch, each palm's frame raised
 * over its bridge and each foot's placement on its block, all as fitted.
 */
export function sprintStartSet(
  context: Pick<IAutoMovieMotionHumanActionContext, OfContext>,
  entry: IAutoMovieMotionHumanPosture,
  front: AutoMovieHumanSide,
  sex: OfSex = "male",
  placedFeet?: sprintStartBlocks.IPlaced["feet"],
): sprintStartSetFit.ISet {
  const body: IAutoMovieMotionHumanBody = context.body;
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const trunkBones: ReadonlySet<AutoMovieHumanoidBone> = new Set([
    "leftUpperArm",
    "rightUpperArm",
    "hips",
    "leftUpperLeg",
    "rightUpperLeg",
  ]);
  const projector: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const frame: IAutoMovieMotionHumanFrame = sprintStartSetHands.frame(
    body,
    context.entry.feet,
    entry.yaw,
  );
  const forward: IAutoMovieVector3 = HumanFrame.point(
    { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
    { x: 0, y: 0, z: 1 },
  );
  // The hands on the bridge of the thumb and index finger at the line
  // (`sprintStartSetHands`); the shoulders stand the arms' reach from the
  // seed's wrists.
  const bridges: Record<AutoMovieHumanSide, sprintStartSetHands.IBridge> = {
    left: sprintStartSetHands(body, frame, "left"),
    right: sprintStartSetHands(body, frame, "right"),
  };
  const wrist: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
    left: bridges.left.wrist,
    right: bridges.right.wrist,
  };
  const wrists: IAutoMovieVector3 = Vector3.lerp(wrist.left, wrist.right, 0.5);
  const arm: number = sprintStartSet.REACH * (m.upperArm + m.forearm);

  // A world point in the run's vertical plane: along the heading from the
  // frame's origin, and up.
  const plane: (p: IAutoMovieVector3) => sprintStartSetChain.IPoint = (
    p: IAutoMovieVector3,
  ): sprintStartSetChain.IPoint => ({
    u: Vector3.dot(
      { x: p.x - frame.origin.x, y: 0, z: p.z - frame.origin.z },
      forward,
    ),
    v: p.y,
  });

  // The front foot in its block, the ball on the floor and the sole on
  // the block's face, its ball behind the line by the anthropometry-driven
  // setting's share of the leg's length (`FRONT_DISTANCE`).
  const rear: AutoMovieHumanSide = front === "left" ? "right" : "left";
  const leg: number = m.thigh + m.shank;
  const ahead: IAutoMovieMotionHumanFoot.IPlacement =
    placedFeet?.[front] ??
    sprintStartBlocks.scaled(
      body,
      entry,
      frame,
      front,
      sprintStartSet.FRONT_DISTANCE * leg,
      sprintStartSet.FRONT_BLOCK,
    );

  // The sagittal chain from that ankle to the wrists at the measured front
  // knee and hip angles on a trunk of `trunk` metres, and the rear foot in
  // its block where the rear leg from the chain's hip has the rear knee's
  // measured mean (`sprintStartSetChain`, `rear`).
  const onLine: sprintStartSetChain.IPoint | undefined =
    placedFeet === undefined
      ? plane(
          sprintStartBlocks.scaled(
            body,
            entry,
            frame,
            rear,
            0,
            sprintStartSet.REAR_BLOCK,
          ).ankle,
        )
      : undefined;
  const solve: (trunk: number) => ISolved = (trunk: number): ISolved => {
    const chain: sprintStartSetChain.ISet | undefined = sprintStartSetChain({
      ankle: plane(ahead.ankle),
      wrist: plane(wrists),
      thigh: m.thigh,
      shank: m.shank,
      trunk,
      arm,
      knee: sprintStartSet.FRONT,
      hip: (sprintStartSet.HIP[0] + sprintStartSet.HIP[1]) / 2,
    });
    // Placed plates fix both feet; the rear knee's range is then the
    // whole-body fit's to meet or refuse.
    if (chain !== undefined && placedFeet !== undefined)
      return { chain, feet: placedFeet };
    const u: number | undefined =
      chain === undefined || onLine === undefined
        ? undefined
        : sprintStartSetChain.rear(
            chain.hip,
            onLine,
            m.thigh,
            m.shank,
            (sprintStartSet.REAR[0] + sprintStartSet.REAR[1]) / 2,
          );
    if (chain === undefined || onLine === undefined || u === undefined)
      throw new HumanRefusal({
        kind: "reach",
        axis: "set",
        value: arm,
        reason: `no set of the front knee at ${sprintStartSet.FRONT} degrees and the front hip at ${(sprintStartSet.HIP[0] + sprintStartSet.HIP[1]) / 2} brings the shoulders the arms' reach from the hands with the rear leg on its block`,
        fix: "use a body whose arms reach the line from the front block",
      });
    return {
      chain,
      feet: {
        [front]: ahead,
        [rear]: sprintStartBlocks.scaled(
          body,
          entry,
          frame,
          rear,
          onLine.u - u,
          sprintStartSet.REAR_BLOCK,
        ),
      } as Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>,
    };
  };

  // The trunk inclined by a total tilt shared by the lumbopelvic rhythm,
  // the pelvis taking no more than the planted legs' hip range leaves it
  // and the spine the rest (`HumanTrunk.incline`), its root placed so the
  // shoulders stand at `shoulders`.
  const posed: (
    q: number,
    shoulders: IAutoMovieVector3,
    feet: ISolved["feet"],
  ) => IStance = (
    q: number,
    shoulders: IAutoMovieVector3,
    feet: ISolved["feet"],
  ): IStance => {
    const at: (limit: number) => IStance = (limit: number): IStance => {
      const tilt: IPosedAtTilt = HumanTrunk.incline(entry.joints, q, limit);
      const turned: IAutoMovieMotionHumanPosture = {
        ...entry,
        root: { x: 0, y: 0, z: 0 },
        pitch: tilt.pitch,
        roll: 0,
        joints: tilt.joints,
        // The trunk alone is read: the limbs' goals move no joint of it.
        limbs: {},
      };
      const bones: ReturnType<typeof poseBones> = poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          turned,
          undefined,
          undefined,
          resolution,
          undefined,
          projector,
        ).pose,
        resolution(),
        trunkBones,
      );
      const mid: (
        a: AutoMovieHumanoidBone,
        b: AutoMovieHumanoidBone,
      ) => IAutoMovieVector3 = (
        a: AutoMovieHumanoidBone,
        b: AutoMovieHumanoidBone,
      ): IAutoMovieVector3 =>
        Vector3.lerp(
          bones.get(a)!.worldPosition,
          bones.get(b)!.worldPosition,
          0.5,
        );
      const root: IAutoMovieVector3 = Vector3.subtract(
        shoulders,
        mid("leftUpperArm", "rightUpperArm"),
      );
      return {
        pitch: tilt.pitch,
        joints: tilt.joints,
        hips: Vector3.add(root, bones.get("hips")!.worldPosition),
        pelvis: Vector3.add(root, mid("leftUpperLeg", "rightUpperLeg")),
        root,
      };
    };
    const free: IStance = at(Infinity);
    return at(
      HumanTrunk.pelvisLimit(
        body,
        Vector3.subtract(free.hips, body.rest.get("hips")!),
        entry.yaw,
        { left: feet.left.ankle, right: feet.right.ankle },
      ),
    );
  };

  // The trunk's total tilt from the vertical along a hip-to-shoulders
  // direction, and the chain's shoulders in the world.
  const tilt: (
    from: sprintStartSetChain.IPoint,
    to: sprintStartSetChain.IPoint,
  ) => number = (
    from: sprintStartSetChain.IPoint,
    to: sprintStartSetChain.IPoint,
  ): number => 90 + (Math.atan2(from.v - to.v, to.u - from.u) * 180) / Math.PI;
  const placed: (chain: sprintStartSetChain.ISet) => IAutoMovieVector3 = (
    chain: sprintStartSetChain.ISet,
  ): IAutoMovieVector3 =>
    Vector3.add(
      { ...wrists, y: chain.shoulders.v },
      Vector3.scale(forward, chain.shoulders.u - plane(wrists).u),
    );

  // The chain on the rest trunk first. The posed trunk bends along the
  // spine, so its hip-to-shoulders length and direction at that tilt are
  // read back once, the chain set again on that length and the tilt turned
  // by the direction's difference: the fit starts at the measured set.
  const rested: IAutoMovieVector3 = Vector3.subtract(
    Vector3.lerp(
      body.rest.get("leftUpperArm")!,
      body.rest.get("rightUpperArm")!,
      0.5,
    ),
    Vector3.lerp(
      body.rest.get("leftUpperLeg")!,
      body.rest.get("rightUpperLeg")!,
      0.5,
    ),
  );
  let set: ISolved = solve(Math.hypot(rested.y, rested.z));
  let q: number = tilt(set.chain.hip, set.chain.shoulders);
  const shoulders: sprintStartSetChain.IPoint = plane(placed(set.chain));
  const pelvis: sprintStartSetChain.IPoint = plane(
    posed(q, placed(set.chain), set.feet).pelvis,
  );
  const bent: number = tilt(pelvis, shoulders);
  set = solve(Math.hypot(shoulders.u - pelvis.u, shoulders.v - pelvis.v));
  q += tilt(set.chain.hip, set.chain.shoulders) - bent;
  const feet: ISolved["feet"] = set.feet;
  const seed: IStance = posed(q, placed(set.chain), feet);
  const posture: IAutoMovieMotionHumanPosture = {
    ...entry,
    root: seed.root,
    pitch: seed.pitch,
    roll: 0,
    joints: seed.joints,
    limbs: {},
  };
  const limbs: IAutoMovieMotionHumanPosture["limbs"] = {
    leftLeg: AutoMovieMotionHumanLeg.goal(
      body,
      posture,
      "left",
      feet.left,
      true,
    ),
    rightLeg: AutoMovieMotionHumanLeg.goal(
      body,
      posture,
      "right",
      feet.right,
      true,
    ),
    leftArm: {
      point: wrist.left,
      bend: AutoMovieMotionHumanBend.hang(body, posture, "left"),
    },
    rightArm: {
      point: wrist.right,
      bend: AutoMovieMotionHumanBend.hang(body, posture, "right"),
    },
  };
  const posedSeed: IAutoMoviePose = resolveHumanPosture.seeded(
    body,
    {
      ...posture,
      limbs,
    },
    undefined,
    undefined,
    resolution,
    undefined,
    projector,
  ).pose;
  const solved: IAutoMovieMotionHumanBodyFitTypes.IResult = sprintStartSetFit({
    body,
    posture,
    seed: posedSeed,
    feet,
    placed: placedFeet !== undefined,
    bridges: { left: bridges.left.targets, right: bridges.right.targets },
    front,
    // Placed plates fix the foot, so the front knee takes the measured
    // spread, 90 +/- 8 (Cavedon et al. 2019), not its mean.
    knee:
      placedFeet === undefined
        ? sprintStartSet.FRONT
        : [
            sprintStartSet.FRONT - sprintStartSet.FRONT_SD,
            sprintStartSet.FRONT + sprintStartSet.FRONT_SD,
          ],
    rear: sprintStartSet.REAR,
    hip: sprintStartSet.HIP,
    // The measured centre belongs to the anthropometric block setting;
    // on placed plates it follows from where the plates stand.
    centre:
      placedFeet === undefined
        ? {
            point: HumanFrame.point(frame, {
              x: 0,
              y: 0,
              z: m.footLength - sprintStartSet.CENTRE[sex],
            }),
            axes: [forward],
          }
        : undefined,
  });
  return sprintStartSetFit.read(body, solved.posture, resolution, projector);
}

/*
 * The sprint start's set geometry: block placement, the front knee's opening
 * and the body's centre of mass, solved on the performer's measured rig. The
 * athletics law owns timing and movements and delegates its set here.
 */
export namespace sprintStartSet {
  /*
   * The front knee's included angle in the set, degrees: 90 (SD 8) measured
   * with the anthropometry-driven block setting (Cavedon et al. 2019, PLoS One
   * 14:e0213979, table 2), Harland and Steele's (1997) "about 90".
   */
  export const FRONT: number = 90;

  /*
   * The front knee's measured standard deviation in the set, degrees: 8
   * (Cavedon et al. 2019, table 2), the spread a set on placed plates may use.
   */
  export const FRONT_SD: number = 8;

  /*
   * The front block's distance behind the start line, a share of the leg's
   * length (greater trochanter to lateral malleolus): the anthropometry-driven
   * setting (Cavedon et al. 2019, table 2).
   */
  export const FRONT_DISTANCE: number = 0.6;

  /*
   * The rear knee's included angle in the set, degrees: 117 (SD 11) with the
   * anthropometry-driven block setting (Cavedon et al. 2019, table 2). The rear
   * block is placed where the rear leg from the set's hip has the mean, so the
   * setting's spacing (0.45 of the leg) follows from the body's own set rather
   * than being laid down beside it.
   */
  export const REAR: [number, number] = [106, 128];

  /*
   * The front hip's included angle in the set between the knee and the
   * shoulders, degrees: 43 (SD 6), the same setting (Cavedon et al. 2019, table
   * 2).
   */
  export const HIP: [number, number] = [37, 49];

  /*
   * The whole body's centre of mass behind the start line in the set, metres
   * along the ground, by the sprinter's sex as the sources stratify it: 22.9 cm
   * for elite men (Slawinski et al. 2010, J Strength Cond Res 24:896, n = 6)
   * and 16.2 cm for world-class women (Ciacci et al. 2017, J Sports Sci
   * 35:1270, n = 4), both read as Valamatos et al. 2022 report them (Int J
   * Environ Res Public Health 19:4074, section 4.1.2), the primary texts being
   * closed.
   */
  export const CENTRE: Readonly<Record<CENTREEntryItem, number>> = {
    female: 0.162,
    male: 0.229,
  };

  /*
   * The front block's face from the floor, degrees (provisional, within a
   * competition block's adjustment).
   */
  export const FRONT_BLOCK: number = 50;

  /*
   * The rear block's face from the floor, degrees (provisional, within a
   * competition block's adjustment).
   */
  export const REAR_BLOCK: number = 65;

  /*
   * The arm extension of the initial geometric guess (provisional); the
   * whole-body fit may change it to meet the measured constraints.
   */
  export const REACH: number = 0.98;
}

/*
 * The record of `IPosedAtTilt`'s site.
 */
type IPosedAtTilt = {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
};

/*
 * The alternatives of `OfSex`'s site.
 */
type OfSex = "female" | "male";

/*
 * The alternatives of `OfContext`'s site.
 */
type OfContext = "body" | "entry";

/*
 * The alternatives of `CENTREEntryItem`'s site.
 */
type CENTREEntryItem = "female" | "male";

/*
 * A set stance at one total tilt: pelvis pitch, spine flexion, and hips and
 * root placed so the shoulders stand over the hands, world metres.
 */
interface IStance {
  pitch: number;
  joints: IAutoMovieMotionHumanPosture["joints"];
  hips: IAutoMovieVector3;
  /*
   * The hip joints' midpoint.
   */
  pelvis: IAutoMovieVector3;
  root: IAutoMovieVector3;
}

/*
 * The set's chain and both feet in their blocks.
 */
interface ISolved {
  chain: sprintStartSetChain.ISet;
  feet: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;
}
