import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanRange,
  IAutoMovieMotionHumanResolve,
  IAutoMovieMotionHumanTarget,
  IAutoMovieMotionHumanTargetGrid,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "./AutoMovieMotionHumanTargetGrid";

/** The alternatives of `BendPreset`'s site. */
type BendPreset =
  | IAutoMovieMotionHumanBend.Arm
  | IAutoMovieMotionHumanBend.IShares;

/**
 * What an authoring spec is on a body: a place in shares and in metres, an
 * elbow preset in shares and in metres, an amount as a share and in degrees,
 * the inverse from metres to shares, and a table of every name across a set of
 * bodies.
 *
 * A law is written in names and shares, and a correction is asked for in
 * centimetres ("3 cm further forward"). This owner shows both sides, so an
 * author reads what a spec is on a body before a capture and turns a requested
 * distance into the nudge that states it. Metres are in the performer's floor
 * frame: the origin on the floor under the root, `x` to the performer's left,
 * `y` up, `z` forward.
 */
export namespace AutoMovieMotionHumanResolve {
  /**
   * A place on a body, in shares and in metres.
   *
   * @param body The body.
   * @param side The acting hand.
   * @param place The place, on any rung.
   * @returns Both readings.
   * @throws {Error} When the place is refused by
   *   `AutoMovieMotionHumanTargetGrid.place`.
   */
  export function place(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    side: AutoMovieHumanSide,
    place: IAutoMovieMotionHumanTargetGrid.Place,
  ): IAutoMovieMotionHumanResolve.IPlace {
    const m = body.measure;
    const shares: IAutoMovieMotionHumanTarget.IDefault =
      AutoMovieMotionHumanTargetGrid.place(body, side, place);
    return {
      shares,
      metres: {
        x: (shares.lateral ?? 0) * m.shoulderHalfWidth,
        y: shares.height * m.stature,
        z: shares.range * (m.upperArm + m.forearm),
      },
    };
  }

  /**
   * A displacement in metres as the shares a place and a nudge state it in.
   *
   * @param body The body.
   * @param metres The displacement in the performer's floor frame.
   * @returns The shares per axis and the nudge of the left hand.
   */
  export function shares(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    metres: IAutoMovieVector3,
  ): IAutoMovieMotionHumanResolve.IShift {
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    return {
      forward: metres.z / arm,
      up: metres.y / m.stature,
      left: metres.x / m.shoulderHalfWidth,
      nudge: {
        out: metres.x / arm,
        up: metres.y / arm,
        forward: metres.z / arm,
      },
    };
  }

  /**
   * An elbow preset on a body, in shares and in metres.
   *
   * @param body The body.
   * @param preset A named preset or the shares themselves.
   * @param out Extra outward share of the upper arm; 0 by default.
   * @returns Both readings.
   */
  export function bend(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    preset: BendPreset,
    out: number = 0,
  ): IAutoMovieMotionHumanResolve.IBend {
    const base: IAutoMovieMotionHumanBend.IShares =
      typeof preset === "string"
        ? AutoMovieMotionHumanBend.ARM[preset]
        : preset;
    const shares: IAutoMovieMotionHumanBend.IShares = {
      ...base,
      out: base.out + out,
    };
    const length: number = body.measure.upperArm;
    return {
      shares,
      metres: {
        x: shares.out * length,
        y: shares.up * length,
        z: shares.forward * length,
      },
    };
  }

  /**
   * An amount on a joint, as a share of the motion's limit and in degrees.
   *
   * @param bone The joint.
   * @param motion The motion.
   * @param amount The amount, on any rung.
   * @returns Both readings.
   * @throws {Error} When the amount is refused by
   *   `AutoMovieMotionHumanRange.degrees`.
   */
  export function amount(
    bone: AutoMovieHumanoidBone,
    motion: IAutoMovieMotionHumanRange.Motion,
    amount: IAutoMovieMotionHumanRange.Amount,
  ): IAutoMovieMotionHumanResolve.IAmount {
    const degrees: number = AutoMovieMotionHumanRange.degrees(
      bone,
      motion,
      amount,
    );
    const whole: number =
      AutoMovieMotionHumanRange.degrees(bone, motion, "full") /
      AutoMovieMotionHumanRange.LEVELS.full;
    return { share: degrees / whole, degrees };
  }

  /**
   * Every name on a set of bodies, as text: one row per whole place, height,
   * lateral, distance and elbow preset with one column per body, then one row
   * per joint motion with one column per level.
   *
   * @param bodies The bodies, in column order.
   * @returns The table, lines joined by a line feed; lengths in metres to three
   *   decimals, angles in degrees to two.
   */
  export function table(
    bodies: readonly IAutoMovieMotionHumanResolve.IBody[],
  ): string {
    const lines: string[] = [];
    const row = (
      label: string,
      cell: (body: Pick<IAutoMovieMotionHumanBody, "measure">) => string,
    ): void => {
      lines.push(
        [
          label,
          ...bodies.map((b: IAutoMovieMotionHumanResolve.IBody): string =>
            cell(b.body),
          ),
        ].join("\t"),
      );
    };
    const f = (value: number): string => value.toFixed(3);
    const point = (v: IAutoMovieVector3): string =>
      `${f(v.x)},${f(v.y)},${f(v.z)}`;
    lines.push(
      [
        "name",
        ...bodies.map(
          (b: IAutoMovieMotionHumanResolve.IBody): string => b.name,
        ),
      ].join("\t"),
    );
    for (const name of Object.keys(
      AutoMovieMotionHumanTarget.DEFAULTS,
    ) as IAutoMovieMotionHumanTarget.Name[])
      row(`place ${name} (x,y,z m)`, (body): string =>
        point(place(body, "left", name).metres),
      );
    for (const name of AutoMovieMotionHumanTargetGrid.HEIGHTS)
      row(`height ${name} (share / m)`, (body): string => {
        const share: number = AutoMovieMotionHumanTargetGrid.height(body, name);
        return `${f(share)} / ${f(share * body.measure.stature)}`;
      });
    for (const name of Object.keys(
      AutoMovieMotionHumanTargetGrid.LATERALS,
    ) as IAutoMovieMotionHumanTargetGrid.Lateral[])
      row(
        `lateral ${name} (share / m)`,
        (body): string =>
          `${f(AutoMovieMotionHumanTargetGrid.LATERALS[name])} / ${f(
            AutoMovieMotionHumanTargetGrid.LATERALS[name] *
              body.measure.shoulderHalfWidth,
          )}`,
      );
    for (const name of Object.keys(
      AutoMovieMotionHumanTargetGrid.DISTANCES,
    ) as IAutoMovieMotionHumanTargetGrid.Distance[])
      row(
        `distance ${name} (share / m)`,
        (body): string =>
          `${f(AutoMovieMotionHumanTargetGrid.DISTANCES[name])} / ${f(
            AutoMovieMotionHumanTargetGrid.DISTANCES[name] *
              (body.measure.upperArm + body.measure.forearm),
          )}`,
      );
    for (const name of Object.keys(
      AutoMovieMotionHumanBend.ARM,
    ) as IAutoMovieMotionHumanBend.Arm[])
      row(`bend ${name} (out,up,forward m)`, (body): string =>
        point(bend(body, name).metres),
      );

    const levels: IAutoMovieMotionHumanRange.Level[] = Object.keys(
      AutoMovieMotionHumanRange.LEVELS,
    ) as IAutoMovieMotionHumanRange.Level[];
    lines.push("");
    lines.push(["level (degrees)", ...levels].join("\t"));
    for (const bone of BONES)
      for (const motion of AutoMovieMotionHumanRange.MOTIONS) {
        if (AutoMovieMotionHumanRange.limit(bone, motion) === null) continue;
        lines.push(
          [
            `${bone} ${motion}`,
            ...levels.map((level: IAutoMovieMotionHumanRange.Level): string =>
              AutoMovieMotionHumanRange.degrees(bone, motion, level).toFixed(2),
            ),
          ].join("\t"),
        );
      }
    return lines.join("\n");
  }

  /**
   * The solved elbow beside the `hang` preset on a set of bodies, as text: one
   * row per place with one column per body.
   *
   * Each body stands at rest heading +Z, and the left wrist is put on the place
   * with no hand rotation. A cell gives the angle from the preset's elbow to
   * the solved one about the line from the shoulder to the wrist, then the
   * strain of the solved elbow and the strain of the preset's. A place the arm
   * cannot reach reads `out of reach`.
   *
   * @param bodies The bodies, in column order.
   * @returns The table, lines joined by a line feed; angles in whole degrees,
   *   strains to three decimals.
   */
  export function swivel(
    bodies: IAutoMovieMotionHumanResolve.ISwivelBodies,
  ): string {
    const places: [string, IAutoMovieMotionHumanTargetGrid.Place][] = [
      ...(
        Object.keys(
          AutoMovieMotionHumanTarget.DEFAULTS,
        ) as IAutoMovieMotionHumanTarget.Name[]
      ).map((name): [string, IAutoMovieMotionHumanTargetGrid.Place] => [
        name,
        name,
      ]),
      ...SWIVEL_GRIDS.map(
        (grid): [string, IAutoMovieMotionHumanTargetGrid.Place] => [
          `${grid.height} ${grid.lateral} ${grid.distance}`,
          grid,
        ],
      ),
    ];
    const cell = (
      body: IAutoMovieMotionHumanBody,
      place: IAutoMovieMotionHumanTargetGrid.Place,
    ): string => {
      const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
      const shoulder: IAutoMovieVector3 = body.rest.get("leftUpperArm")!;
      const props: IAutoMovieMotionHumanBend.ISolve = {
        body,
        posture,
        side: "left",
        point: AutoMovieMotionHumanTarget.fallback(
          body,
          posture,
          AutoMovieMotionHumanTargetGrid.place(body, "left", place),
        ).point,
      };
      const preset: IAutoMovieVector3 = AutoMovieMotionHumanBend.arm(
        body,
        posture,
        "left",
        "hang",
      );
      let solved: IAutoMovieVector3;
      try {
        solved = AutoMovieMotionHumanBend.solve(props);
      } catch (error) {
        // The solver refuses a wrist it cannot reach; anything else is a
        // defect and propagates.
        if (error instanceof HumanRefusal) return "out of reach";
        throw error;
      }
      const axis: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(props.point, shoulder),
      );
      const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
        const v: IAutoMovieVector3 = Vector3.subtract(p, shoulder);
        return Vector3.normalize(
          Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis))),
        );
      };
      const angle: number =
        (Math.acos(
          Math.max(
            -1,
            Math.min(1, Vector3.dot(across(solved), across(preset))),
          ),
        ) *
          180) /
        Math.PI;
      return `${angle.toFixed(0)} deg, ${AutoMovieMotionHumanBend.strain(
        props,
        solved,
      ).toFixed(
        3,
      )} / ${AutoMovieMotionHumanBend.strain(props, preset).toFixed(3)}`;
    };
    return [
      [
        "place (swivel from hang, strain solved / hang)",
        ...bodies.map((b) => b.name),
      ].join("\t"),
      ...places.map(([label, place]): string =>
        [label, ...bodies.map((b): string => cell(b.body, place))].join("\t"),
      ),
    ].join("\n");
  }
}

/**
 * The grid places the swivel table lists beside the named ones: the places of
 * `stopPalm`, `wave` and `raiseHand`, and a hand at the hip.
 */
const SWIVEL_GRIDS: readonly IAutoMovieMotionHumanTargetGrid.IGrid[] = [
  { height: "shoulder", lateral: "inside", distance: "far" },
  { height: "eye", lateral: "outside", distance: "near" },
  { height: "overhead", lateral: "shoulder", distance: "close" },
  { height: "hip", lateral: "outside", distance: "close" },
];

/**
 * The joints the table lists: the trunk and the head, and the left limbs, which
 * the right mirror.
 */
const BONES: readonly AutoMovieHumanoidBone[] = [
  "spine",
  "chest",
  "upperChest",
  "neck",
  "head",
  "leftShoulder",
  "leftUpperArm",
  "leftLowerArm",
  "leftHand",
  "leftIndexProximal",
  "leftUpperLeg",
  "leftLowerLeg",
  "leftFoot",
];
