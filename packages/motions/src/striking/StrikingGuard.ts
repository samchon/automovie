import { type IAutoMovieResolvedBone, Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type { AutoMovieHumanoidBone, IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { StrikingBody } from "./StrikingBody";
import { StrikingGuardBones } from "./StrikingGuardBones";
import { StrikingStance } from "./StrikingStance";

/**
 * Place the fighting guard's two glove goals on the current trunk: both at
 * their ear's height the same short distance ahead of their jaw, the rear
 * glove outside its ear and the lead glove before its own shoulder
 * (`StrikingStance` gives the sources).
 *
 * @param body The unchanged canonical body.
 * @param posture The current base carrying the guard.
 * @param stance The leading side.
 * @param drop Each glove's downward displacement, metres.
 * @param posed Optional trunk frames already read from this exact body/posture.
 * @param resolution Optional exact FK reader borrowed only by this synchronous evaluation.
 * @returns The two actual world-metre glove goals.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States current-body ownership, lead/rear placement, metre units and exact borrowed-frame/reader premises.
 * @evidence contracts/development/implementation.md#principled-implementation Reads the jaws, the ears and the face's forward on the current trunk, puts each fist at its ear's height the near distance ahead of its jaw, the rear one a radius outside its ear and the lead one before its shoulder joint, and bends each elbow toward a point below and ahead of its shoulder; StrikingStance.glove turns each into a wrist goal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One demanded trunk read feeds both sides' goals; the stance facade keeps the public entry while this owner holds guard placement and its exact FK prerequisites.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every coached coefficient and vector operation is unchanged. Demand selects the actual region-carrying bones plus both shoulders, while authored joint/clamp admission and output freshness remain with their owners.
 * @evidence contracts/development/implementation.md#efficient-algorithms Without supplied frames, FK admits all joints but returns only the six region owners and two shoulders plus their ancestry. One supplied operation reader shares equal scalar prerequisites with lowering/other reads; two side computations remain constant work. The face requests its normal only, and the jaws and the ears their points and normals; unused direction/position rotations and wrappers are omitted by their canonical owner, with speedup unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied map must describe this exact body/posture, and a supplied reader belongs to the same synchronous person evaluation. Both gloves share the actual completed trunk read, the face requests only its actual normal, and the jaws and the ears are read by the one region owner. No pose/time answer is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The unchanged body's weak metadata owner retains at most eight requested names; each fresh trunk map and optional borrowed reader end on return or throw. Returned goals own their new vectors and retain no map, getter or query history.
 */
export function StrikingGuard(
  body: IHumanBody,
  posture: IHumanPosture,
  stance: Pick<StrikingStance.IStance, "lead">,
  drop: Partial<Record<"left" | "right", number>>,
  posed?: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
  resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
): Pick<IHumanPosture["limbs"], "leftArm" | "rightArm"> {
  const bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = posed ?? StrikingBody.trunk(
    body, posture, resolution, StrikingGuardBones(body),
  );
  const m: IHumanBody["measure"] = body.measure;
  const faceFrame: resolveAutoMovieHumanoidSurfaces.IFrame = StrikingBody.frame(body, "face");
  const forward: IAutoMovieVector3 = horizontal(resolveAutoMovieHumanoidSurfaces.normal(faceFrame, bones.get(faceFrame.bone)!));
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const out: Pick<IHumanPosture["limbs"], "leftArm" | "rightArm"> = {};
  for (const side of ["left", "right"] as const) {
    const lead: boolean = side === stance.lead;
    const jaw: ReturnType<typeof StrikingBody.region> = StrikingBody.region(
      body, bones, side === "left" ? "jawLeft" : "jawRight",
    );
    const outward: IAutoMovieVector3 = horizontal(jaw.normal);
    const shoulder: IAutoMovieVector3 = bones.get(`${side}UpperArm`)!.worldPosition;

    // The guard of a striker who faces kicks as well as punches: the rear
    // hand "as if holding a phone to your ear and then pushed forward just in
    // front of your face", the front hand "at the same height" before its
    // own shoulder (the boxing and MMA guard; the Muay Thai guard's arms
    // "projected out further" with "nearly vertical forearms"). Both fists
    // stand at their ear's height, the same short distance ahead of their
    // jaw: the rear one a fist's half width outside its ear, the lead one
    // before its own shoulder joint. The resting arms do not close the ribs:
    // a body kick is answered by dropping the elbow to the raised knee, an
    // action (`defend`), not a posture.
    //
    // Each place answers a measured line of the staged scenes on the average
    // man (two equal guards, 0.99 m apart for a punch, 0.83 m for a kick):
    // - a jab runs down the line at the face's height, so each glove stands
    //   0.06 m or more beside it (0.12 m here);
    // - a rear straight runs from the rear glove to the face and passes the
    //   other's lead glove where the line is 0.11 m from the head's centre
    //   line: a lead glove a fist's half width outside its ear stood 0.029 m
    //   from that line and stopped the fist; before its shoulder it stands
    //   0.06 m outside it;
    // - a round kick's shin arrives at the flank between 1.09 and 1.25 m, so
    //   the elbows hang above it only under ear-high fists: under chin-high
    //   ones they stood at 1.14 to 1.17 m and stopped every staged kick;
    // - neither glove is carried beyond `near`, or the two guards stand
    //   inside each other at the kick's range.
    const near: number = 2 * m.forearmRadius + 0.25 * m.forearm;
    const ear: IAutoMovieVector3 = StrikingBody.region(
      body, bones, side === "left" ? "earLeft" : "earRight",
    ).point;
    const beside: number = lead
      ? Vector3.dot(Vector3.subtract(shoulder, jaw.point), outward)
      : Math.max(0, Vector3.dot(Vector3.subtract(ear, jaw.point), outward)) + m.forearmRadius;
    const fistAt: IAutoMovieVector3 = Vector3.add(
      Vector3.add({ ...jaw.point, y: ear.y }, Vector3.scale(outward, beside)),
      Vector3.scale(forward, near),
    );
    const sag: IAutoMovieVector3 = { ...fistAt, y: fistAt.y - (drop[side] ?? 0) };
    const bend: IAutoMovieVector3 = Vector3.add(shoulder,
      Vector3.add(Vector3.scale(up, -0.8 * m.upperArm), Vector3.scale(forward, 0.5 * m.upperArm)));
    out[side === "left" ? "leftArm" : "rightArm"] = StrikingStance.glove(body, side, sag, bend);
  }
  return out;
}

/** The existing horizontal-normal convention, with +Z when horizontal length is at most 1e-9. */
function horizontal(v: IAutoMovieVector3): IAutoMovieVector3 {
  const h: IAutoMovieVector3 = { x: v.x, y: 0, z: v.z };
  return Vector3.length(h) > 1e-9 ? Vector3.normalize(h) : { x: 0, y: 0, z: 1 };
}
