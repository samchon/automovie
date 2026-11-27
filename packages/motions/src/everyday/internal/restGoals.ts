import { AutoMovieEngineKinematics } from "@automovie/engine";
import { Vector3 } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBend, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanColliders, IAutoMovieMotionHumanFrame, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanRest, IAutoMovieQuaternion, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../../posture/HumanColliders";
import { HumanFrame } from "../../posture/HumanFrame";
import { HumanHand } from "../../posture/HumanHand";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { HumanTrunk } from "../HumanTrunk";
import { handReach } from "./handReach";
import { restClasped } from "./restClasped";
import { restCrossedArms } from "./restCrossedArms";
import { restElbowSupport } from "./restElbowSupport";

/** The alternatives of `RestGoalsSuffix`'s site. */
type RestGoalsSuffix = "Left" | "Right";

/**
 * Both hands' rest goals on a posture.
 *
 * Each place states where the elbow points, as a bend preset of
 * `AutoMovieMotionHumanBend`: akimbo and behind-the-head elbows go out wide,
 * chin-rest elbows forward and down, the others down beside the body; crossed
 * arms set their elbows exactly (`restCrossedArms`). A place that holds one
 * hand lays a hand surface on a named region with the palm facing into it; the
 * places that hold the hands together are `restClasped`'s and
 * `restCrossedArms`'s, and the hand under the other elbow is
 * `restElbowSupport`'s. A fist under the chin is moved forward by as far as its
 * thumb side reaches past the throat, so it keeps clear of the neck; both hands
 * at the chin put the chin on both fists, each beside the midline by its own
 * closed depth on the palm side. Both reaches are read from the hand's and
 * fingers' colliders, the throat by a ray cast back from the chin onto the
 * neck. A flat resting hand clears the posed surface envelope and its own
 * material depth. At the waistband that envelope includes the pelvis and the
 * region's bearing segment.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @param places Each hand's place.
 * @returns The goals of the hands that move.
 * @throws {Error} When the trunk has no surface where a clasp is laid
 *   (`restClasped`).
 */
export function restGoals(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  places: Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.Place>,
): Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>> {
  const out: Partial<
    Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>
  > = {};
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const targets: Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>> =
    {};
  for (const side of ["left", "right"] as const) {
    const suffix: RestGoalsSuffix = side === "left" ? "Left" : "Right";
    const place: IAutoMovieMotionHumanRest.Place = places[side];
    const name: AutoMovieHumanoidRegion | undefined =
      place === "pocket"
        ? `pocketFront${suffix}`
        : place === "hip"
          ? `hip${suffix}`
          : place === "behindHead"
            ? "headBack"
            : place === "chinRest"
              ? "chin"
              : undefined;
    if (name !== undefined) targets[side] = name;
  }
  const requested: Set<AutoMovieHumanoidBone> = new Set(
    Object.values(targets).map(
      (name: AutoMovieHumanoidRegion): AutoMovieHumanoidBone =>
        body.surfaces.regions[name].bone,
    ),
  );

  // The waistband crosses the pelvis and proximal thigh. Their outer envelope
  // supports the hand even when the named landmark rides the other segment.
  if (
    Object.values(places).some(
      (place: IAutoMovieMotionHumanRest.Place): boolean =>
        place === "hip" || place === "pocket",
    )
  )
    requested.add("hips");
  // The posed surfaces the places lay a hand on, and the neck a chin rest
  // casts back onto, each posed once here when a place reads it.
  const laid: readonly IAutoMovieMotionHumanRest.Place[] =
    Object.values(places);
  const anatomy: ReturnType<typeof poseBones> | undefined = laid.some(
    (place: IAutoMovieMotionHumanRest.Place): boolean =>
      place === "pocket" ||
      place === "hip" ||
      place === "behindHead" ||
      place === "chinRest",
  )
    ? poseBones(
        body,
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          {},
          undefined,
          requested,
        ).pose,
        undefined,
        requested,
      )
    : undefined;
  const neck:
    | ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>
    | undefined = laid.includes("chinRest") ? necked(body, posture) : undefined;
  const region = (side: AutoMovieHumanSide): HumanTrunk.ISurface => {
    const frame: IAutoMovieHumanoidSurfaces.IFrame =
      body.surfaces.regions[targets[side]!];
    return AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePointNormal(
      frame,
      anatomy!.get(frame.bone)!,
    );
  };
  const frame: IAutoMovieMotionHumanFrame = {
    origin: posture.root,
    yaw: posture.yaw,
  };
  const direction: HumanFrame.IPrepared = HumanFrame.prepare({
    origin: { x: 0, y: 0, z: 0 },
    yaw: frame.yaw,
  });
  const dir: (x: number, y: number, z: number) => IAutoMovieVector3 = (
    x: number,
    y: number,
    z: number,
  ): IAutoMovieVector3 => direction.direction({ x, y, z });
  // The hint rides the root and the heading only, as the rest places were
  // captured: a standing rest does not pitch or roll the trunk.
  const elbow: (
    side: AutoMovieHumanSide,
    place: keyof typeof BENDS,
  ) => IAutoMovieVector3 = (
    side: AutoMovieHumanSide,
    place: keyof typeof BENDS,
  ): IAutoMovieVector3 =>
    AutoMovieMotionHumanBend.arm(
      body,
      { root: posture.root, yaw: posture.yaw },
      side,
      BENDS[place],
    );
  const lay: (
    side: AutoMovieHumanSide,
    place: keyof typeof BENDS,
    surface: IAutoMovieMotionHumanHand.Surface,
    shape: IAutoMovieMotionHumanHand.Shape,
    point: IAutoMovieVector3,
    fingers: IAutoMovieVector3,
    palm: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanRest.IGoal = (
    side: AutoMovieHumanSide,
    place: keyof typeof BENDS,
    surface: IAutoMovieMotionHumanHand.Surface,
    shape: IAutoMovieMotionHumanHand.Shape,
    point: IAutoMovieVector3,
    fingers: IAutoMovieVector3,
    palm: IAutoMovieVector3,
  ): IAutoMovieMotionHumanRest.IGoal => {
    const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
      fingers,
      palm,
    });
    let contact: IAutoMovieVector3 = point;
    if (shape === "flat" && targets[side] !== undefined) {
      const bone: AutoMovieHumanoidBone =
        body.surfaces.regions[targets[side]!].bone;
      const read: IAutoMovieResolvedBone | undefined = anatomy?.get(bone);
      if (read !== undefined) {
        const support: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          new Map([[bone, read]]);
        const pelvis: IAutoMovieResolvedBone | undefined = anatomy?.get("hips");
        if ((place === "hip" || place === "pocket") && pelvis !== undefined)
          support.set("hips", pelvis);
        const hit: IAutoMovieMotionHumanColliders.IHit | undefined =
          HumanColliders.cast(
            body,
            support,
            Vector3.addScaled(point, palm, -m.stature),
            palm,
            2 * m.stature,
          );
        const depth: number = handReach(
          body,
          { ...posture, limbs: {} },
          side,
          rotation,
          "palm",
          shape,
        )(palm);
        contact = Vector3.addScaled(
          hit?.point ?? point,
          palm,
          -Math.max(0, depth),
        );
      }
    }
    return {
      surface,
      shape,
      point: contact,
      rotation,
      elbow: elbow(side, place),
    };
  };
  for (const side of ["left", "right"] as const) {
    const sign: number = side === "left" ? 1 : -1;
    const place: IAutoMovieMotionHumanRest.Place = places[side];
    switch (place) {
      case "side":
      case "crossed":
      case "elbowSupport":
        break;
      case "pocket": {
        // A hand in a pocket lies flat along the thigh, its palm laid on the
        // surface against its normal: a relaxed curl would close the
        // fingers into the thigh they lie on.
        const pocket: HumanTrunk.ISurface = region(side);
        out[side] = lay(
          side,
          place,
          "palm",
          "flat",
          pocket.point,
          dir(POCKET.x, POCKET.y, POCKET.z),
          Vector3.scale(pocket.normal, -1),
        );
        break;
      }
      case "hip": {
        const hip: HumanTrunk.ISurface = region(side);
        const up: number = 0.5 * (m.waistHeight - m.hipHeight);
        out[side] = lay(
          side,
          place,
          "palm",
          "flat",
          Vector3.add(hip.point, { x: 0, y: up, z: 0 }),
          dir(AKIMBO.x, AKIMBO.y, AKIMBO.z),
          Vector3.scale(hip.normal, -1),
        );
        break;
      }
      case "claspedFront":
      case "claspedBehind": {
        if (side === "right") break;
        const elbows: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
          left: elbow("left", place),
          right: elbow("right", place),
        };
        Object.assign(
          out,
          place === "claspedFront"
            ? restClasped.front(body, posture, elbows)
            : restClasped.behind(body, posture, elbows),
        );
        break;
      }
      case "behindHead": {
        const head: HumanTrunk.ISurface = region(side);
        const fingers: IAutoMovieVector3 = dir(-sign, NAPE, 0);
        const palm: IAutoMovieVector3 = Vector3.scale(head.normal, -1);
        const inward: IAutoMovieVector3 = dir(-sign, 0, 0);
        const width: number = handReach(
          body,
          posture,
          side,
          HumanHand.rotation(side, { fingers, palm }),
          "palm",
          "flat",
        )(inward);
        const beside: IAutoMovieVector3 = Vector3.addScaled(
          head.point,
          inward,
          -width,
        );
        out[side] = lay(side, place, "palm", "flat", beside, fingers, palm);
        break;
      }
      case "chinRest": {
        // The chin on both fists when both hands rest it: each fist beside
        // the midline by its own depth on the palm side, so the two fists,
        // palms in, meet at the midline, where one place would put both
        // fists into each other.
        // The fist's thumb side lies behind its top, so the fist is moved
        // forward by as far as that side reaches past the throat behind the
        // chin, and its body keeps clear of the neck.
        const chin: HumanTrunk.ISurface = region(side);
        const fingers: IAutoMovieVector3 = dir(0, 1, 0);
        const palm: IAutoMovieVector3 = dir(-sign, 0, 0);
        const back: IAutoMovieVector3 = dir(0, 0, -1);
        const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, {
          fingers,
          palm,
        });
        const reach: (direction: IAutoMovieVector3) => number = handReach(
          body,
          posture,
          side,
          rotation,
          "fist",
          "fist",
        );
        const rear: number = reach(back);
        const throat: IAutoMovieMotionHumanColliders.IHit | undefined =
          rear > 0
            ? HumanColliders.cast(body, neck!, chin.point, back, rear)
            : undefined;
        const under: IAutoMovieVector3 =
          throat === undefined
            ? chin.point
            : Vector3.addScaled(
                chin.point,
                back,
                Vector3.distance(throat.point, chin.point) - rear,
              );
        out[side] = lay(
          side,
          place,
          "fist",
          "fist",
          places.left === "chinRest" && places.right === "chinRest"
            ? Vector3.addScaled(under, palm, -reach(palm))
            : under,
          fingers,
          palm,
        );
        break;
      }
    }
  }
  if (places.left === "crossed")
    Object.assign(out, restCrossedArms(body, posture));
  for (const side of ["left", "right"] as const) {
    if (places[side] !== "elbowSupport") continue;
    const other: AutoMovieHumanSide = side === "left" ? "right" : "left";
    out[side] = restElbowSupport(
      body,
      posture,
      side,
      out[other]!,
      elbow(side, "elbowSupport"),
    );
  }
  return out;
}

/**
 * The posture's neck alone, posed, for a ray that meets the throat and nothing
 * of the head above it.
 */
function necked(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
): ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, posture),
    undefined,
    new Set<AutoMovieHumanoidBone>(["neck"]),
  );
  return new Map([["neck", bones.get("neck")!]]);
}

/**
 * A pocketed hand's fingers in the performer's frame: down along the thigh,
 * tipped forward with it (provisional).
 */
const POCKET: IAutoMovieVector3 = { x: 0, y: -1, z: 0.35 };

/**
 * An akimbo hand's fingers in the performer's frame: forward and down over the
 * hip (provisional).
 */
const AKIMBO: IAutoMovieVector3 = { x: 0, y: -0.6, z: 0.8 };

/**
 * How far up a palm behind the head points its fingers, against one unit across
 * toward the midline (provisional).
 */
const NAPE: number = 0.6;
/** The alternatives of `BENDSEntryItem`'s site. */
type BENDSEntryItem = "side" | "crossed";

/**
 * The elbow's bend preset of `AutoMovieMotionHumanBend` by place, one per place
 * that has an elbow hint.
 */
const BENDS: Readonly<
  Record<
    Exclude<IAutoMovieMotionHumanRest.Place, BENDSEntryItem>,
    IAutoMovieMotionHumanBend.Arm
  >
> = {
  pocket: "tucked",
  hip: "akimbo",
  claspedFront: "front",
  claspedBehind: "behind",
  behindHead: "raised",
  chinRest: "forward",
  elbowSupport: "folded",
};
