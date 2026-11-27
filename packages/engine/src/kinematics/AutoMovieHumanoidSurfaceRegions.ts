import type { AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieHumanoidSurfaceRegions, IAutoMovieVector3 } from "@automovie/interface";

/**
 * The costal margin's lowest point as a share of stature: the tenth rib height
 * of ANSUR II (Gordon et al. 2014, NATICK/TR-15/007; means of the public
 * records, 1,986 women and 4,082 men: tenth rib 1056.3 and 1120.7 mm, stature
 * 1628.5 and 1756.2 mm), the greater of the women's and the men's shares, so
 * the station stands at or just above the margin on either body. Declared
 * before the table, whose initialiser reads it.
 */
const COSTAL_MARGIN: number = Math.max(1056.3 / 1628.5, 1120.7 / 1756.2);

/**
 * The definitions of the anatomical regions a humanoid's surfaces resolve
 * (`resolveAutoMovieHumanoidSurfaces`): each region's station on a bone's
 * segment and its outward direction in the rest frame, the ray that finds its
 * point on the colliders.
 */
export namespace AutoMovieHumanoidSurfaceRegions {
  /** The interface contract (`IAutoMovieHumanoidSurfaceRegions.ILevel`). */
  export type ILevel = IAutoMovieHumanoidSurfaceRegions.ILevel;

  /**
   * Every region's definition, both sides from one table: +X is the body's
   * left.
   */
  export const TABLE: Readonly<
    Partial<
      Record<
        AutoMovieHumanoidRegion,
        IAutoMovieHumanoidSurfaceRegions.IDefinition
      >
    >
  > = (() => {
    const v = (x: number, y: number, z: number): IAutoMovieVector3 => ({
      x,
      y,
      z,
    });
    const head: IAutoMovieHumanoidSurfaceRegions.IStation = {
      bone: "head",
      toward: "centre",
      share: 0,
    };
    const neck: IAutoMovieHumanoidSurfaceRegions.IStation = {
      bone: "neck",
      toward: "head",
      share: 0.5,
    };
    const chest = (
      share: number,
    ): IAutoMovieHumanoidSurfaceRegions.IStation => ({
      bone: "chest",
      toward: "neck",
      share,
    });
    const spine = (
      share: number,
    ): IAutoMovieHumanoidSurfaceRegions.IStation => ({
      bone: "spine",
      toward: "chest",
      share,
    });

    // The lower rib cage: the costal margin's lowest point, the tenth rib,
    // which a body kick, a hook to the liver or a punch to the kidney lands
    // on or just above. The rig's spine runs from the omphalion to the
    // xiphion, so the margin lies on it, at the tenth rib's height.
    const costal: ILevel = {
      bone: "spine",
      toward: "chest",
      level: COSTAL_MARGIN,
    };
    const table: Partial<
      Record<
        AutoMovieHumanoidRegion,
        IAutoMovieHumanoidSurfaceRegions.IDefinition
      >
    > = {
      crown: { station: head, direction: v(0, 1, 0) },
      forehead: { station: head, direction: v(0, 0.45, 1) },
      face: { station: head, direction: v(0, 0, 1) },
      noseBridge: { station: head, direction: v(0, 0.1, 1) },
      nose: { station: head, direction: v(0, -0.15, 1) },
      mouth: { station: head, direction: v(0, -0.4, 1) },
      chin: { station: head, direction: v(0, -0.75, 0.65) },
      headBack: { station: head, direction: v(0, 0, -1) },
      throat: { station: neck, direction: v(0, 0, 1) },
      nape: { station: neck, direction: v(0, 0, -1) },
      sternum: { station: chest(0.5), direction: v(0, 0, 1) },
      solarPlexus: { station: chest(0), direction: v(0, 0, 1) },

      // The liver lies under the right lower ribs and the spleen under the
      // left ninth to eleventh, both above the costal margin's lowest point
      // (Moore, Dalley and Agur, Clinically Oriented Anatomy, 7th ed., ch.
      // 2); a strike reaches them through the margin, front and side.
      liver: { station: costal, direction: v(-0.8, 0, 0.6) },
      spleen: { station: costal, direction: v(0.8, 0, 0.6) },
      upperBack: { station: chest(0.5), direction: v(0, 0, -1) },
      // The yoke: the top of the back between the shoulders, behind the
      // neck's base, where a shoulder-ride's rider sits and a yoke or a
      // carried pole rests; on the thorax's collider near the neck, facing up
      // and a little back along the trapezius (provisional).
      yoke: { station: chest(0.95), direction: v(0, 1, -0.3) },
      abdomen: { station: spine(0.4), direction: v(0, 0, 1) },
      lowerBack: { station: spine(0.4), direction: v(0, 0, -1) },
      groin: {
        station: { bone: "hips", toward: "centre", share: 0 },
        direction: v(0, -0.6, 0.8),
      },
    };
    for (const [Side, x] of [
      ["Left", 1],
      ["Right", -1],
    ] as const) {
      const s = (name: string): AutoMovieHumanoidBone =>
        `${Side.toLowerCase()}${name}` as AutoMovieHumanoidBone;
      const set = (
        name: string,
        def: IAutoMovieHumanoidSurfaceRegions.IDefinition,
      ): void => {
        table[`${name}${Side}` as AutoMovieHumanoidRegion] = def;
      };
      set("jaw", { station: head, direction: v(0.7 * x, -0.55, 0.45) });
      // The cheek: the zygomatic prominence over the buccal area, at the
      // nose's height (its ray's -0.15) and 40 degrees out from the face's
      // forward ray, tan 40 = 0.84 (provisional).
      set("cheek", { station: head, direction: v(0.84 * x, -0.15, 1) });
      set("temple", { station: head, direction: v(x, 0.25, 0.3) });
      set("ear", { station: head, direction: v(x, 0, 0) });
      set("neck", { station: neck, direction: v(x, 0, 0) });
      set("chest", { station: chest(0.55), direction: v(0.45 * x, 0, 1) });
      set("ribs", { station: costal, direction: v(x, 0, 0.15) });

      // The kidney lies behind the lowest ribs, from the twelfth thoracic to
      // the third lumbar vertebra (Moore, Dalley and Agur, ch. 2), so the
      // flank at the costal margin's height is over it.
      set("kidney", { station: costal, direction: v(0.6 * x, 0, -0.8) });
      set("hip", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0 },
        direction: v(x, 0, 0),
      });
      // The top of the shoulder over the acromion, on the thorax's collider
      // at nine tenths of the way from the chest's joint to the shoulder's,
      // facing up and a little out along the trapezius' slope
      // (provisional). It rode the upper arm's capsule before; with the arm
      // hanging, that point and its normal turned to the arm's outer side.
      set("shoulder", {
        station: { bone: "chest", toward: s("UpperArm"), share: 0.9 },
        direction: v(0.3 * x, 1, 0),
      });
      set("upperArm", {
        station: { bone: s("UpperArm"), toward: s("LowerArm"), share: 0.5 },
        direction: v(0, 1, 0),
      });
      set("elbow", {
        station: { bone: s("LowerArm"), toward: s("Hand"), share: 0 },
        direction: v(0, 0, -1),
      });
      set("forearm", {
        station: { bone: s("LowerArm"), toward: s("Hand"), share: 0.5 },
        direction: v(0, 1, 0),
      });
      set("wrist", {
        station: { bone: s("LowerArm"), toward: s("Hand"), share: 0.95 },
        direction: v(0, 1, 0),
      });
      set("pocketFront", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.15 },
        direction: v(0.35 * x, 0, 1),
      });
      set("handBack", {
        station: { bone: s("Hand"), toward: s("MiddleProximal"), share: 0.5 },
        direction: v(0, 1, 0),
      });
      set("thighFront", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.5 },
        direction: v(0, 0, 1),
      });
      set("thighOuter", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.5 },
        direction: v(x, 0, 0),
      });
      set("thighInner", {
        station: { bone: s("UpperLeg"), toward: s("LowerLeg"), share: 0.5 },
        direction: v(-x, 0, 0),
      });
      set("knee", {
        station: { bone: s("LowerLeg"), toward: s("Foot"), share: 0 },
        direction: v(0, 0, 1),
      });
      set("shin", {
        station: { bone: s("LowerLeg"), toward: s("Foot"), share: 0.5 },
        direction: v(0, 0, 1),
      });
      set("calf", {
        station: { bone: s("LowerLeg"), toward: s("Foot"), share: 0.35 },
        direction: v(0, 0, -1),
      });
      set("footTop", {
        station: { bone: s("Foot"), toward: s("Toes"), share: 0.5 },
        direction: v(0, 1, 0),
      });
    }
    return table;
  })();
}
