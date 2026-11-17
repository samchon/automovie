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
 * the chin's height beside their own jaw, the rear glove just ahead of the
 * face and the lead glove a forearm ahead, less its shoulder's withdrawal
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
 * @evidence contracts/development/implementation.md#principled-implementation Reads the chin, the jaws and the face's forward on the current trunk, puts each fist at the chin's height a radius outside its jaw, the rear one the near distance ahead and the lead one a forearm ahead less its shoulder's withdrawal, and bends each elbow toward a point below and ahead of its shoulder; StrikingStance.glove turns each into a wrist goal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One demanded trunk read feeds both sides' goals; the stance facade keeps the public entry while this owner holds guard placement and its exact FK prerequisites.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every coached coefficient and vector operation is unchanged. Demand selects the actual region-carrying bones plus both shoulders, while authored joint/clamp admission and output freshness remain with their owners.
 * @evidence contracts/development/implementation.md#efficient-algorithms Without supplied frames, FK admits all joints but returns only four region owners and two shoulders plus their ancestry. One supplied operation reader shares equal scalar prerequisites with lowering/other reads; two side computations remain constant work. The chin requests point only, face normal only, and jaw point/normal; unused direction/position rotations and wrappers are omitted by their canonical owner, with speedup unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work A supplied map must describe this exact body/posture, and a supplied reader belongs to the same synchronous person evaluation. Both gloves share the actual completed trunk read, and chin placement requests only its world point, face requests only its actual normal, and jaws retain both consumed fields from the same original placement owner. No pose/time answer is retained.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The unchanged body's weak metadata owner retains at most six requested names; each fresh trunk map and optional borrowed reader end on return or throw. Returned goals own their new vectors and retain no map, getter or query history.
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
  const chinFrame: resolveAutoMovieHumanoidSurfaces.IFrame = body.surfaces.regions.chin;
  const chin: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.point(chinFrame, bones.get(chinFrame.bone)!);
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
    // front of your face", the front hand "at the same height but pushed a
    // little further forward" (the boxing and MMA guard), the arms
    // "projected out further" with "nearly vertical forearms" in the Muay
    // Thai guard. Both gloves stand at the chin's height beside their own
    // jaw, so the lane between them is open down the line; the rear one
    // `near` ahead of its jaw and the lead one a forearm ahead, less what its
    // shoulder is drawn back by a turning trunk. The resting arms do not
    // close the ribs: a body kick is answered by dropping the elbow to the
    // raised knee, an action (`defend`), not a posture.
    //
    // Measured at the staged punch range: with the lead glove half a radius
    // inside its jaw on a head that rode the stance turn, the partner's lead
    // wrist stood 17 mm from the axis of a jab's forearm; with the rear
    // glove at the jaw's own height, a jab's fist met the partner's rear
    // middle finger 13 mm before the face; with both gloves drawn in to
    // `near` and the elbows under them, every staged body kick was stopped
    // on a forearm.
    const withdrawn: number = Math.max(0, 0.5 * Vector3.dot(
      Vector3.subtract(bones.get(`${side === "left" ? "right" : "left"}UpperArm`)!.worldPosition, shoulder), forward,
    ));
    const near: number = 2 * m.forearmRadius + 0.25 * m.forearm;
    const fistAt: IAutoMovieVector3 = Vector3.add(
      Vector3.add({ ...jaw.point, y: chin.y }, Vector3.scale(outward, m.forearmRadius)),
      Vector3.scale(forward, lead ? Math.max(near, m.forearm - withdrawn) : near),
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
