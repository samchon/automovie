import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanKickboxingRing,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";

/**
 * The ring a placed prop is.
 *
 * @param prop The ring's prop.
 * @returns Its centre on the canvas, its size between the ropes and its
 *   heading.
 * @throws {HumanRefusal} When the prop declares no canvas, a top rope or a
 *   corner post, its ropes stand no square apart, or a post stands off its
 *   corner.
 */
export function KickboxingRing(
  prop: Pick<IAutoMovieMotionHumanProp, OfProp>,
): IAutoMovieMotionHumanKickboxingRing.IRing {
  const affordances: readonly IAutoMovieAffordance[] = prop.affordances ?? [];
  const refuse: (reason: string) => IAutoMovieMotionHumanRefusal = (
    reason: string,
  ): IAutoMovieMotionHumanRefusal =>
    new HumanRefusal({
      kind: "affordance",
      axis: "ring",
      value: prop.subject,
      feasible: {
        kind: "alternatives",
        values: affordances.map((a: IAutoMovieAffordance): string => a.id),
      },
      reason,
      fix: "name a ring whose canvas, top ropes and corner posts its contacts declare, as AutoMovieArchetypeRing.create does",
    });
  const at: (id: string) => IAutoMovieVector3 = (
    id: string,
  ): IAutoMovieVector3 => {
    const found: IAutoMovieAffordance | undefined = affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined) throw refuse(`${prop.subject} declares no ${id}`);
    return Vector3.add(
      prop.frame.position,
      Quaternion.rotateVector(prop.frame.rotation, found.frame.translation),
    );
  };
  const canvas: IAutoMovieVector3 = at("canvas");
  const across: (a: string, b: string) => number = (
    a: string,
    b: string,
  ): number => {
    const d: IAutoMovieVector3 = Vector3.subtract(at(a), at(b));
    return Math.hypot(d.x, d.z);
  };
  const size: number = across("northRope", "southRope");
  if (!(Math.abs(across("eastRope", "westRope") - size) <= 1e-3))
    throw refuse(
      `${prop.subject}'s ropes stand ${size.toFixed(3)} m apart one way and ${across("eastRope", "westRope").toFixed(3)} m the other, no square`,
    );
  const forward: IAutoMovieVector3 = Quaternion.rotateVector(
    prop.frame.rotation,
    { x: 0, y: 0, z: 1 },
  );
  const ring: IAutoMovieMotionHumanKickboxingRing.IRing = {
    centre: canvas,
    size,
    yaw: (Math.atan2(forward.x, forward.z) * 180) / Math.PI,
  };
  for (const name of Object.keys(
    KickboxingRing.POSTS,
  ) as IAutoMovieMotionHumanKickboxingRing.Corner[]) {
    const post: IAutoMovieVector3 = at(KickboxingRing.POSTS[name]);
    const foot: IAutoMovieVector3 = KickboxingRing.corner(ring, name);
    if (!(Math.hypot(post.x - foot.x, post.z - foot.z) <= 1e-3))
      throw refuse(
        `${prop.subject}'s ${KickboxingRing.POSTS[name]} stands off the ${name} corner its ropes put it at`,
      );
  }
  return ring;
}

/**
 * A bounded fighting area: a square ring on the floor, centred on a point and
 * turned by a heading, inside its ropes. Footwork and staging read it to keep
 * the fighters' stances inside the ropes and to find its corners.
 *
 * The ring is a square of `size` metres between the ropes (GLORY rings are 6.1
 * to 7.3 m inside the ropes; the size is the production's). Corners are named
 * in the ring's own frame: the red and blue corners on one diagonal, the two
 * neutral corners on the other. A ring placed in the scene is read from its own
 * contacts (`of`, `AutoMovieArchetypeRing.create`'s): its centre and floor from the `canvas`, its
 * size from the top ropes on opposite sides, its heading from the placement,
 * and its corners named on its posts' tops, `corner1` (`+X +Z`) blue, `corner3`
 * red, `corner4` and `corner2` the neutral corners.
 */
export namespace KickboxingRing {
  /**
   * The posts' tops by corner (`AutoMovieArchetypeRing.create`'s `corner1` to `corner4`, counted
   * round from `+X +Z`).
   */
  export const POSTS: Readonly<
    Record<IAutoMovieMotionHumanKickboxingRing.Corner, string>
  > = {
    blue: "corner1",
    neutralB: "corner2",
    red: "corner3",
    neutralA: "corner4",
  };

  /**
   * A corner's floor point, a margin inside the ropes along both sides.
   *
   * @param ring The ring.
   * @param corner Which corner.
   * @param margin How far inside the ropes, metres.
   * @returns World metres.
   */
  export function corner(
    ring: IAutoMovieMotionHumanKickboxingRing.IRing,
    corner: IAutoMovieMotionHumanKickboxingRing.Corner,
    margin: number = 0,
  ): IAutoMovieVector3 {
    const h: number = ring.size / 2 - margin;
    const local: Record<
      IAutoMovieMotionHumanKickboxingRing.Corner,
      [number, number]
    > = {
      red: [-h, -h],
      blue: [h, h],
      neutralA: [h, -h],
      neutralB: [-h, h],
    };
    const [x, z] = local[corner];
    return world(ring, x, z);
  }

  /**
   * Whether a floor point lies at least a margin inside the ropes.
   *
   * @param ring The ring.
   * @param point The point, world metres.
   * @param margin The margin, metres.
   * @returns True inside.
   */
  export function inside(
    ring: IAutoMovieMotionHumanKickboxingRing.IRing,
    point: IAutoMovieVector3,
    margin: number = 0,
  ): boolean {
    const [x, z] = local(ring, point);
    const h: number = ring.size / 2 - margin;
    return Math.abs(x) <= h + 1e-12 && Math.abs(z) <= h + 1e-12;
  }

  /**
   * The nearest floor point at least a margin inside the ropes.
   *
   * @param ring The ring.
   * @param point The point, world metres.
   * @param margin The margin, metres; below half the size.
   * @returns World metres, at floor height.
   * @throws {Error} When the margin is half the size or more.
   */
  export function clamp(
    ring: IAutoMovieMotionHumanKickboxingRing.IRing,
    point: IAutoMovieVector3,
    margin: number = 0,
  ): IAutoMovieVector3 {
    const h: number = ring.size / 2 - margin;
    if (!(h >= 0)) throw new Error("A ring margin is less than half its size");
    const [x, z] = local(ring, point);
    return world(
      ring,
      Math.max(-h, Math.min(h, x)),
      Math.max(-h, Math.min(h, z)),
    );
  }

  /** A ring-local point in world metres. */
  function world(
    ring: IAutoMovieMotionHumanKickboxingRing.IRing,
    x: number,
    z: number,
  ): IAutoMovieVector3 {
    const r: number = (ring.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    return {
      x: ring.centre.x + x * c + z * s,
      y: ring.centre.y,
      z: ring.centre.z - x * s + z * c,
    };
  }

  /** A world point in ring-local coordinates. */
  function local(
    ring: IAutoMovieMotionHumanKickboxingRing.IRing,
    p: IAutoMovieVector3,
  ): [number, number] {
    const r: number = (ring.yaw * Math.PI) / 180;
    const c: number = Math.cos(r);
    const s: number = Math.sin(r);
    const dx: number = p.x - ring.centre.x;
    const dz: number = p.z - ring.centre.z;
    return [dx * c - dz * s, dx * s + dz * c];
  }
}

/** The alternatives of `OfProp`'s site. */
type OfProp = "subject" | "frame" | "affordances";
