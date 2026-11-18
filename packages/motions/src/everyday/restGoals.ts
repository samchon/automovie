import { Quaternion, Vector3, physicalShapeSpan } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanRest,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanBend } from "../compose/AutoMovieMotionHumanBend";
import { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanTrunk } from "./HumanTrunk";
import { restClasped } from "./restClasped";
import { restCrossedArms } from "./restCrossedArms";
import { restElbowSupport } from "./restElbowSupport";

/**
 * Both hands' rest goals on a posture.
 *
 * Each place states where the elbow points, as a bend preset of
 * `AutoMovieMotionHumanBend`: akimbo and behind-the-head elbows go
 * out wide, chin-rest elbows forward and down, the others down beside the
 * body; crossed arms set their elbows exactly (`restCrossedArms`). A place
 * that holds one hand lays a hand surface on a named region with the palm
 * facing into it; the places that hold the hands together are
 * `restClasped`'s and `restCrossedArms`'s, and the hand under the other
 * elbow is `restElbowSupport`'s. A fist under the chin is moved forward by
 * as far as its thumb side reaches past the throat, so it keeps clear of
 * the neck; both hands at the chin put the chin on both fists, each beside
 * the midline by its own closed depth on the palm side. Both reaches are
 * read from the hand's and fingers' colliders, the throat by a ray cast
 * back from the chin onto the neck.
 *
 * @param body The body.
 * @param posture The standing posture.
 * @param places Each hand's place.
 * @returns The goals of the hands that move.
 * @throws {Error} When the trunk has no surface where a clasp is laid (`restClasped`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what each kind of place lays where and which function owns the paired ones.
 * @evidence contracts/development/implementation.md#principled-implementation Every place is an effector goal on the body's own surface, with the elbow's side stated by a named preset.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One case per place and one pass for the places that depend on another hand's goal.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No body is special-cased; a place is a region and directions in the performer's frame.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per place beyond the paired places' own solves. One lazily prepared coefficient pair serves all direction transforms at this operation's already captured yaw; every current local direction still produces a fresh world vector.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanTrunk region placement, HumanHand rotation and the bend presets. A lazy zero-origin HumanFrame preparation shares only this operation's captured numeric yaw across direction reads; borrowed posture/root inputs and all actual point/goal calculations remain live.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
 */
export function restGoals(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  places: Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.Place>,
): Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>> {
  const out: Partial<Record<AutoMovieHumanSide, IAutoMovieMotionHumanRest.IGoal>> = {};
  const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
  const targets: Partial<Record<AutoMovieHumanSide, AutoMovieHumanoidRegion>> = {};
  for (const side of ["left", "right"] as const) {
    const suffix: "Left" | "Right" = side === "left" ? "Left" : "Right";
    const place: IAutoMovieMotionHumanRest.Place = places[side];
    const name: AutoMovieHumanoidRegion | undefined = place === "pocket"
      ? `pocketFront${suffix}`
      : place === "hip" ? `hip${suffix}`
        : place === "behindHead" ? "headBack"
          : place === "chinRest" ? "chin" : undefined;
    if (name !== undefined) targets[side] = name;
  }
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    Object.values(targets).map(
      (name: AutoMovieHumanoidRegion): AutoMovieHumanoidBone =>
        body.surfaces.regions[name].bone,
    ),
  );
  let trunk: HumanTrunk.IReading | undefined;
  let neck: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone> | undefined;
  const region: (side: AutoMovieHumanSide) => HumanTrunk.ISurface = (
    side: AutoMovieHumanSide,
  ): HumanTrunk.ISurface =>
    (trunk ??= HumanTrunk.prepare(body, posture, requested)).region(targets[side]!);
  const frame: IAutoMovieMotionHumanFrame = { origin: posture.root, yaw: posture.yaw };
  let direction: HumanFrame.IPrepared | undefined;
  const dir: (x: number, y: number, z: number) => IAutoMovieVector3 =
    (x: number, y: number, z: number): IAutoMovieVector3 =>
      (direction ??= HumanFrame.prepare({ origin: { x: 0, y: 0, z: 0 }, yaw: frame.yaw }))
        .direction({ x, y, z });
  // The hint rides the root and the heading only, as the rest places were
  // captured: a standing rest does not pitch or roll the trunk.
  const elbow: (side: AutoMovieHumanSide, place: keyof typeof BENDS) => IAutoMovieVector3 = (
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
  ): IAutoMovieMotionHumanRest.IGoal => ({
    surface,
    shape,
    point,
    rotation: HumanHand.rotation(side, { fingers, palm }),
    elbow: elbow(side, place),
  });
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
        const beside: IAutoMovieVector3 = Vector3.addScaled(
          head.point, dir(1, 0, 0), sign * BESIDE * m.headRadius,
        );
        out[side] = lay(
          side,
          place,
          "palm",
          "flat",
          beside,
          dir(-sign, NAPE, 0),
          Vector3.scale(head.normal, -1),
        );
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
        const rotation: IAutoMovieQuaternion = HumanHand.rotation(side, { fingers, palm });
        const reach: (direction: IAutoMovieVector3) => number = fistReach(body, posture, side, rotation);
        const rear: number = reach(back);
        const throat: IAutoMovieMotionHumanColliders.IHit | undefined = rear > 0
          ? HumanColliders.cast(body, (neck ??= necked(body, posture)), chin.point, back, rear)
          : undefined;
        const under: IAutoMovieVector3 = throat === undefined
          ? chin.point
          : Vector3.addScaled(chin.point, back, Vector3.distance(throat.point, chin.point) - rear);
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

/** The posture's neck alone, posed, for a ray that meets the throat and nothing of the head above it. */
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
 * How far a fist laid at a world rotation reaches past its own fist surface
 * along a world direction: the highest point of the hand's and the fingers'
 * colliders along it, the hand closed in the fist, less the fist surface's
 * own. The fist is closed on the posture's own hand once, and each direction
 * is read in that hand's frame, which the laid hand turns to the rotation.
 */
function fistReach(
  body: IAutoMovieMotionHumanBody,
  posture: IAutoMovieMotionHumanPosture,
  side: AutoMovieHumanSide,
  rotation: IAutoMovieQuaternion,
): (direction: IAutoMovieVector3) => number {
  const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    [...HumanColliders.bones(body)].filter(
      (bone: AutoMovieHumanoidBone): boolean =>
        bone === `${side}Hand` ||
        (bone.startsWith(side) && /(Thumb|Index|Middle|Ring|Little)/.test(bone)),
    ),
  );
  const bones: ReturnType<typeof poseBones> = poseBones(
    body,
    resolveHumanPosture(body, {
      ...posture,
      joints: { ...posture.joints, ...HumanHand.shape(side, "fist") },
    }),
    undefined,
    new Set([...requested, ...HumanHand.frameBones(body, side, "fist")]),
  );
  const placed: ReturnType<typeof HumanColliders.placed> = HumanColliders.placed(body, bones);
  const surface: IAutoMovieVector3 = HumanHand.frame(body, bones, side, "fist", "fist").point;
  return (direction: IAutoMovieVector3): number => {
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      bones.get(`${side}Hand`)!.worldRotation,
      Quaternion.rotateVector(Quaternion.inverse(rotation), direction),
    );
    let high: number = -Infinity;
    for (const segment of placed)
      if (requested.has(segment.bone))
        for (const shape of segment.shapes)
          high = Math.max(high, physicalShapeSpan(segment.pose, shape, axis)[1]);
    return high - Vector3.dot(surface, axis);
  };
}

/** A pocketed hand's fingers in the performer's frame: down along the thigh, tipped forward with it (provisional). */
const POCKET: IAutoMovieVector3 = { x: 0, y: -1, z: 0.35 };

/** An akimbo hand's fingers in the performer's frame: forward and down over the hip (provisional). */
const AKIMBO: IAutoMovieVector3 = { x: 0, y: -0.6, z: 0.8 };

/** How far beside the midline each palm lies on the back of the head, as a share of the head's radius (provisional). */
const BESIDE: number = 0.25;

/** How far up a palm behind the head points its fingers, against one unit across toward the midline (provisional). */
const NAPE: number = 0.6;

/** The elbow's bend preset of `AutoMovieMotionHumanBend` by place, one per place that has an elbow hint. */
const BENDS: Readonly<
  Record<
    Exclude<IAutoMovieMotionHumanRest.Place, "side" | "crossed">,
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
