import type { AutoMovieHumanoidBone, IAutoMovieMotionHumanBend, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanHand, IAutoMovieMotionHumanRange, IAutoMovieMotionHumanResolve, IAutoMovieMotionHumanTarget, IAutoMovieMotionHumanTargetGrid, IAutoMovieVector3 } from "@automovie/interface";

import { Vector3 } from "@automovie/engine";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanTargetGrid } from "./AutoMovieMotionHumanTargetGrid";

/**
 * What an authoring spec is on a body: a place in shares and in metres, an
 * elbow preset in shares and in metres, an amount as a share and in degrees,
 * the inverse from metres to shares, and a table of every name across a set
 * of bodies.
 *
 * A law is written in names and shares, and a correction is asked for in
 * centimetres ("3 cm further forward"). This owner shows both sides, so an
 * author reads what a spec is on a body before a capture and turns a
 * requested distance into the nudge that states it. Metres are in the
 * performer's floor frame: the origin on the floor under the root, `x` to
 * the performer's left, `y` up, `z` forward.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is resolved, why an author needs both units, and the frame of every metre value.
 * @evidence contracts/development/design.md#principled-representation Each result pairs the record the layer uses with its metric reading on one body, so neither is derived by hand.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Six functions over the place, bend and range owners; it resolves and owns no table of its own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every value comes from the owner a law reads it from, so the table cannot disagree with a performance.
 */
export namespace AutoMovieMotionHumanResolve {

  /**
   * A place on a body, in shares and in metres.
   *
   * @param body The body.
   * @param side The acting hand.
   * @param place The place, on any rung.
   * @returns Both readings.
   * @throws {Error} When the place is refused by `AutoMovieMotionHumanTargetGrid.place`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal's owner.
   * @evidence contracts/development/implementation.md#principled-implementation The shares times the stature, the arm and the half shoulder width, the products `AutoMovieMotionHumanTarget.fallback` forms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and three products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rung is resolved here: the place owner resolves it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTargetGrid.place`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function place(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    side: IAutoMovieMotionHumanHand.Side,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input's frame and both forms of the result.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of `place`: each component over the measure its axis is read against, and all three over the arm for a nudge.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Six quotients.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A displacement past a nudge's bound is still reported; `AutoMovieMotionHumanTargetGrid.place` is what refuses it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The shares times the upper arm, the product `AutoMovieMotionHumanBend.arm` forms before it carries the point by the trunk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and three products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The preset's shares are read from `AutoMovieMotionHumanBend.ARM`, not copied.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the bend owner's table.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function bend(
    body: Pick<IAutoMovieMotionHumanBody, "measure">,
    preset: IAutoMovieMotionHumanBend.Arm | IAutoMovieMotionHumanBend.IShares,
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
   * @throws {Error} When the amount is refused by `AutoMovieMotionHumanRange.degrees`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal's owner.
   * @evidence contracts/development/implementation.md#principled-implementation The degrees are the range owner's; the share is their quotient by the limit, which is the degrees of an explicit amount at the limit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two calls and one quotient.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limit is read through the range owner, not from the table directly.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanRange.degrees`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
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
   * @returns The table, lines joined by a line feed; lengths in metres to three decimals, angles in degrees to two.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rows, the columns, the units and the precision.
   * @evidence contracts/development/implementation.md#principled-implementation Each cell is read through the function a law resolves the name by, for the left hand, so the table is what a performance uses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One row builder and one loop per name family.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A joint motion with no range is left out of the table instead of printed as 0.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in names times bodies.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates every cell to `place`, `bend`, the place owner's tables and the range owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function table(bodies: readonly IAutoMovieMotionHumanResolve.IBody[]): string {
    const lines: string[] = [];
    const row = (
      label: string,
      cell: (body: Pick<IAutoMovieMotionHumanBody, "measure">) => string,
    ): void => {
      lines.push(
        [label, ...bodies.map((b: IAutoMovieMotionHumanResolve.IBody): string => cell(b.body))].join("\t"),
      );
    };
    const f = (value: number): string => value.toFixed(3);
    const point = (v: IAutoMovieVector3): string =>
      `${f(v.x)},${f(v.y)},${f(v.z)}`;
    lines.push(
      ["name", ...bodies.map((b: IAutoMovieMotionHumanResolve.IBody): string => b.name)].join("\t"),
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
      for (const motion of MOTIONS) {
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
   * The solved elbow beside the `hang` preset on a set of bodies, as text:
   * one row per place with one column per body.
   *
   * Each body stands at rest heading +Z, and the left wrist is put on the
   * place with no hand rotation. A cell gives the angle from the preset's
   * elbow to the solved one about the line from the shoulder to the wrist,
   * then the strain of the solved elbow and the strain of the preset's. A
   * place the arm cannot reach reads `out of reach`.
   *
   * @param bodies The bodies, in column order.
   * @returns The table, lines joined by a line feed; angles in whole degrees, strains to three decimals.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the stance, what a cell holds, the units and the cell of a refused place.
   * @evidence contracts/development/implementation.md#principled-implementation Both elbows are projected across the shoulder-to-wrist line and the angle between the projections is the swivel between them, the one freedom the solver chooses.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One cell builder over the named places and the grid places the gesture laws use.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A refused place is printed as refused, not as a zero angle.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three solver searches per cell; the table is printed on demand, not during a performance.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanBend.solve`, `strain` and `arm` and the place owner.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing; the solver's per-body cache is the solver's own.
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
      } catch {
        return "out of reach";
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

/** The grid places the swivel table lists beside the named ones: the places of `stopPalm`, `wave` and `raiseHand`, and a hand at the hip. */
const SWIVEL_GRIDS: readonly IAutoMovieMotionHumanTargetGrid.IGrid[] = [
  { height: "shoulder", lateral: "inside", distance: "far" },
  { height: "eye", lateral: "outside", distance: "near" },
  { height: "overhead", lateral: "shoulder", distance: "close" },
  { height: "hip", lateral: "outside", distance: "close" },
];

/** The joints the table lists: the trunk and the head, and the left limbs, which the right mirror. */
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

/** The motions the table lists, in the order of the range owner's union. */
const MOTIONS: readonly IAutoMovieMotionHumanRange.Motion[] = [
  "flexion",
  "extension",
  "abduction",
  "adduction",
  "external",
  "internal",
];
