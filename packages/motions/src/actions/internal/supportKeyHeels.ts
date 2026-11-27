
import { AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, IAutoMovieHumanoidSurfaces, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanBodyFitTypes, IAutoMovieMotionHumanPosture, IAutoMovieMotionHumanSupport, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { HumanFoot } from "../../posture/internal/HumanFoot";
import { poseBones } from "../../posture/internal/poseBones";
import { resolveHumanPosture } from "../../posture/internal/resolveHumanPosture";
import { supportContact } from "./supportContact";

/**
 * Keep the horizontal heel datum of a foot already on an unnamed floor
 * placement (`supportKey.solved`): each foot whose contact has a floor target
 * holds its heel where its toes and that target put it, or, on the ball or the
 * toe with the heel above the floor, its lowest bearing socket on the target's
 * height.
 *
 * @param body The body.
 * @param from The key before, the seed.
 * @param preferred The posture kept nearest.
 * @param contacts The stance's contacts.
 * @param points Each contact's target point, or null for one without a place.
 * @param miss How far a contact may miss its target, millimetres.
 * @returns The heel targets of the fit.
 */ export function supportKeyHeels(
  body: IAutoMovieMotionHumanBody,
  from: IAutoMovieMotionHumanPosture,
  preferred: IAutoMovieMotionHumanPosture,
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
  points: readonly (IAutoMovieVector3 | null)[],
  miss: number,
): IAutoMovieMotionHumanBodyFitTypes.ITarget[] {
  const feet: IHeel[] = [];
  for (const [k, contact] of contacts.entries()) {
    const target: IAutoMovieVector3 | null = points[k] ?? null;
    if (
      target === null ||
      !supportContact.onFloorTarget(target) ||
      !contact.part.endsWith("Foot")
    )
      continue;
    const side: AutoMovieHumanSide =
      contact.part === "leftFoot" ? "left" : "right";
    const frame: IAutoMovieHumanoidSurfaces.IFrame | undefined =
      body.surfaces.sockets[side === "left" ? "heelLeft" : "heelRight"];
    if (frame === undefined) continue;
    feet.push({
      frame,
      side,
      toes: `${side}Toes`,
      target,
    });
  }
  if (feet.length === 0) return [];
  const names: ReadonlySet<AutoMovieHumanoidBone> = new Set(
    feet.flatMap((foot: IHeel): AutoMovieHumanoidBone[] => [
      foot.frame.bone,
      foot.toes,
    ]),
  );
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = poseBones(
    body,
    resolveHumanPosture(body, from),
    undefined,
    names,
  );
  const intended: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    preferred === from
      ? bones
      : poseBones(body, resolveHumanPosture(body, preferred), undefined, names);
  return feet.map((foot: IHeel): IAutoMovieMotionHumanBodyFitTypes.ITarget => {
    const heel: IAutoMovieVector3 = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePoint(
      foot.frame,
      bones.get(foot.frame.bone)!,
    );
    const toes: IAutoMovieVector3 = bones.get(foot.toes)!.worldPosition;
    const current: ReturnType<typeof HumanFoot.sockets> = HumanFoot.sockets(
      body,
      bones,
      foot.side,
    );
    const planted: boolean =
      Math.hypot(toes.x - foot.target.x, toes.z - foot.target.z) <=
        miss / 1000 &&
      current.some(
        (socket: (typeof current)[number]): boolean =>
          Math.abs(socket.point.y - foot.target.y) <= HumanFoot.BEARING,
      );
    // A retained floor target carries its actual bearing surface forward.
    // A requested new foot placement uses the preferred posture's sole.
    const sole: ReturnType<typeof HumanFoot.sockets> =
      planted || intended === bones
        ? current
        : HumanFoot.sockets(body, intended, foot.side);
    const lowest: (typeof sole)[number] = sole.reduce(
      (
        a: (typeof sole)[number],
        b: (typeof sole)[number],
      ): (typeof sole)[number] => (a.point.y <= b.point.y ? a : b),
    );
    // A foot supported on the ball or toe can carry its heel above the
    // floor in quadruped or half kneel. Place the supporting skin itself.
    if (sole[0]!.point.y > lowest.point.y + HumanFoot.BEARING) {
      const socket: IAutoMovieHumanoidSurfaces.IFrame =
        body.surfaces.sockets[
          `${lowest.socket}${foot.side === "left" ? "Left" : "Right"}`
        ];
      return {
        bone: socket.bone,
        point: socket.point,
        goal: foot.target,
        axes: ["y"],
      };
    }
    return {
      bone: foot.frame.bone,
      point: foot.frame.point,
      goal: {
        x: foot.target.x + heel.x - toes.x,
        y: foot.target.y,
        z: foot.target.z + heel.z - toes.z,
      },
      axes: ["x", "y", "z"],
    };
  });
}

/** An existing floor toe target and the heel whose horizontal offset it keeps. */
interface IHeel {
  /** The foot whose sole bears on the floor. */
  side: AutoMovieHumanSide;
  /** The rig's heel socket. */
  frame: IAutoMovieHumanoidSurfaces.IFrame;

  /** The toe datum's bone. */
  toes: AutoMovieHumanoidBone;

  /** The toe datum's world-metre target. */
  target: IAutoMovieVector3;
}
