import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanDrawFromCarrier,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { operate } from "../../affordance/internal/operate";
import { HumanTrunk } from "../../everyday/internal/HumanTrunk";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { drawFromCarrierPulling } from "./drawFromCarrierPulling";

/*
 * The pulled carrier's pivot. A long blade leaves its scabbard low and in front
 * as the other hand draws the scabbard back: first along its own line, the frog
 * riding the belt, by the least slide that brings the drawn wrist within
 * `operate.REACH` of the drawing arm's length from its shoulder, as far as the
 * pulling hand can carry the throat within its own reach (both closed form: a
 * point `e` from a shoulder slid back by `r` along the line's unit direction
 * `d` lies `|e - r d|` from it, so the reach holds between the roots of `r^2 -
 * 2 r (d.e) + |e|^2 - R^2`); then, for what the slide leaves, by the least turn
 * about the slid hanger (the carrier's `belt` affordance, or its origin where
 * it declares none) toward the drawing shoulder: with `v` the drawn wrist and
 * `w` the shoulder from the hanger, the wrist turned by `t` lies `sqrt(|v|^2 +
 *
 * |w|^2 - 2|v||w|cos(phi - t))`from the shoulder,`phi` the angle between
 *
 * Them, so `t = phi - acos(c)`, `c` the law of cosines' cosine at the reach. A
 * wrist already within reach needs neither; one neither brings within it turns
 * straight at the shoulder and is refused by the reach check that follows.
 */
export function drawFromCarrierPivot(
  context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanDrawFromCarrier>,
  from: IAutoMovieMotionHumanDrawFromCarrier.IFrom,
  side: AutoMovieHumanSide,
  pulled: drawFromCarrierPulling.IPulled,
  posture: IAutoMovieMotionHumanPosture,
  wristOf: (frame: IAutoMovieRigidTransform) => IAutoMovieRigidTransform,
  travel: number,
): drawFromCarrierPivot.IPivot {
  const reader: ReturnType<typeof context.prop> = context.prop(from.prop);
  const carrier: IAutoMovieRigidTransform = reader.frame(context.start);
  const hangerLocal: IAutoMovieAffordance | undefined = (
    reader.prop.affordances ?? []
  ).find((a: IAutoMovieAffordance): boolean => a.id === "belt");
  const hanger: IAutoMovieVector3 =
    hangerLocal === undefined
      ? carrier.position
      : AutoMovieEngineVector3.add(
          carrier.position,
          AutoMovieEngineQuaternion.rotateVector(
            carrier.rotation,
            hangerLocal.frame.translation,
          ),
        );
  // The object's frame on the slide at a travel, the carrier unturned.
  const slid: (distance: number) => IAutoMovieRigidTransform = (
    distance: number,
  ): IAutoMovieRigidTransform => {
    const posed: IAutoMovieMotionHumanProp.IPosed | undefined =
      reader.prop.articulate?.({ [from.slider]: distance });
    const slide: IAutoMovieAffordance | undefined = posed?.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === from.slide,
    );
    if (slide === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "affordance",
        axis: "from.slide",
        value: from.slide,
        reason: `${from.prop} poses no ${from.slide} on its ${from.slider}`,
        fix: "draw from a carrier that declares the slide its slider moves",
      });
    return {
      position: AutoMovieEngineVector3.add(
        carrier.position,
        AutoMovieEngineQuaternion.rotateVector(carrier.rotation, slide.frame.translation),
      ),
      rotation: AutoMovieEngineQuaternion.normalize(
        AutoMovieEngineQuaternion.multiply(carrier.rotation, slide.frame.rotation),
      ),
    };
  };

  // The shoulders the two hands work from, and the reach of each arm.
  const shoulders: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    HumanTrunk.resolve(
      context.body,
      posture,
      undefined,
      undefined,
      new Set<AutoMovieHumanoidBone>([
        `${side}UpperArm`,
        `${pulled.side}UpperArm`,
      ]),
    );
  const shoulder: IAutoMovieVector3 = shoulders.get(
    `${side}UpperArm`,
  )!.worldPosition;
  const holding: IAutoMovieVector3 = shoulders.get(
    `${pulled.side}UpperArm`,
  )!.worldPosition;
  const reach: number =
    operate.REACH *
    (context.body.measure.upperArm + context.body.measure.forearm);
  const drawn: IAutoMovieVector3 = wristOf(slid(travel)).position;

  // First the slide back along the carrier's own line (the frog riding the
  // belt): the least that brings the drawn wrist within reach, as far as the
  // pulling hand can carry the throat. With `d` the line's unit direction, a
  // point `e` from a shoulder slid back by `r` lies `|e - r d|` from it, so
  // the reach is met between the roots of `r^2 - 2 r (d.e) + |e|^2 - R^2`.
  const along: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(
    AutoMovieEngineVector3.subtract(slid(travel).position, slid(0).position),
  );
  const roots: (e: IAutoMovieVector3) => drawFromCarrierPivot.IRoots | null = (
    e: IAutoMovieVector3,
  ): drawFromCarrierPivot.IRoots | null => {
    const de: number = AutoMovieEngineVector3.dot(along, e);
    const disc: number = de * de - AutoMovieEngineVector3.dot(e, e) + reach * reach;
    if (!(disc >= 0)) return null;
    const root: number = Math.sqrt(disc);
    return { low: de - root, high: de + root };
  };
  const most: number = Math.max(
    0,
    roots(AutoMovieEngineVector3.subtract(pulled.wrist.position, holding))?.high ?? 0,
  );
  const least: drawFromCarrierPivot.IRoots | null = roots(
    AutoMovieEngineVector3.subtract(drawn, shoulder),
  );
  const back: number = Math.min(
    most,
    least === null ? most : Math.max(0, least.low),
  );
  const slide: (share: number) => IAutoMovieVector3 = (
    share: number,
  ): IAutoMovieVector3 => AutoMovieEngineVector3.scale(along, -back * share);

  // Then the least turn about the slid hanger toward the drawing shoulder
  // that brings the drawn wrist the rest of the way within reach.
  const pivot: IAutoMovieVector3 = AutoMovieEngineVector3.add(hanger, slide(1));
  const v: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(
    AutoMovieEngineVector3.add(drawn, slide(1)),
    pivot,
  );
  const w: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(shoulder, pivot);
  const across: IAutoMovieVector3 = AutoMovieEngineVector3.cross(v, w);
  const lv: number = AutoMovieEngineVector3.length(v);
  const lw: number = AutoMovieEngineVector3.length(w);
  const angle: number = ((): number => {
    if (
      AutoMovieEngineVector3.distance(v, w) <= reach ||
      !(AutoMovieEngineVector3.length(across) > Number.EPSILON * lv * lw)
    )
      return 0;
    const phi: number = Math.acos(
      Math.min(1, Math.max(-1, AutoMovieEngineVector3.dot(v, w) / (lv * lw))),
    );
    const c: number = (lv * lv + lw * lw - reach * reach) / (2 * lv * lw);
    return c > 1 ? phi : phi - Math.acos(Math.max(-1, c));
  })();
  const axis: IAutoMovieVector3 =
    angle === 0 ? { x: 1, y: 0, z: 0 } : AutoMovieEngineVector3.normalize(across);
  const turn: (share: number) => IAutoMovieQuaternion = (
    share: number,
  ): IAutoMovieQuaternion =>
    AutoMovieEngineQuaternion.fromAxisAngle(axis, (angle * share * 180) / Math.PI);
  // A frame carried with the carrier: slid back, then turned about the
  // slid hanger.
  const carry: (
    frame: IAutoMovieRigidTransform,
    share: number,
  ) => IAutoMovieRigidTransform = (
    frame: IAutoMovieRigidTransform,
    share: number,
  ): IAutoMovieRigidTransform => {
    const q: IAutoMovieQuaternion = turn(share);
    const moved: IAutoMovieVector3 = slide(share);
    const about: IAutoMovieVector3 = AutoMovieEngineVector3.add(hanger, moved);
    return {
      position: AutoMovieEngineVector3.add(
        about,
        AutoMovieEngineQuaternion.rotateVector(
          q,
          AutoMovieEngineVector3.subtract(AutoMovieEngineVector3.add(frame.position, moved), about),
        ),
      ),
      rotation: AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(q, frame.rotation)),
    };
  };
  return {
    carry,
    blade: (share: number, distance: number): IAutoMovieRigidTransform =>
      carry(slid(distance), share),
  };
}

/*
 * `drawFromCarrierPivot` and its records.
 */
export namespace drawFromCarrierPivot {
  /*
   * The two roots of a point's slide back along a carrier's line that put it at
   * an arm's reach from a shoulder, metres; the reach holds between them.
   */
  export interface IRoots {
    /*
     * The lesser root.
     */
    low: number;

    /*
     * The greater root.
     */
    high: number;
  }

  /*
   * A pulled carrier's pivot: the frames its slide and turn about its hanger
   * give.
   */
  export interface IPivot {
    /*
     * The drawn object's world frame at a share of the pivot and a slider
     * travel, metres.
     */
    blade(share: number, travel: number): IAutoMovieRigidTransform;
    /*
     * A frame carried rigidly with the carrier by a share of the pivot: the
     * pulling hand's wrist.
     */
    carry(
      frame: IAutoMovieRigidTransform,
      share: number,
    ): IAutoMovieRigidTransform;
  }
}
