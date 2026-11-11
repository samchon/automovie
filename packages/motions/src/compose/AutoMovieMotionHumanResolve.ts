import { DEFAULT_HUMANOID_ROM } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { HumanHand } from "../posture/HumanHand";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanRange } from "./AutoMovieMotionHumanRange";
import { AutoMovieMotionHumanTarget } from "./AutoMovieMotionHumanTarget";

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
 * @evidence contracts/development/design.md#minimal-and-owned-surface Five functions over the place, bend and range owners; it resolves and owns no table of its own.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every value comes from the owner a law reads it from, so the table cannot disagree with a performance.
 */
export namespace AutoMovieMotionHumanResolve {
  /**
   * A place on a body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and frame.
   * @evidence contracts/development/design.md#principled-representation The share record beside the point it is on this body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the place owner's record.
   */
  export interface IPlace {
    /** The share record. */
    shares: AutoMovieMotionHumanTarget.IDefault;

    /** The point in the performer's floor frame, metres. */
    metres: IAutoMovieVector3;
  }

  /**
   * A displacement in the units a place and a nudge are written in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation One share per axis, each of the measure its axis is read against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members; returned by `shares`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The nudge is given in its own unit, so it is not converted by hand.
   */
  export interface IShift {
    /** Forward, in arm lengths: a difference of `range`. */
    forward: number;

    /** Upward, in statures: a difference of `height`. */
    up: number;

    /** To the performer's left, in half shoulder widths: a difference of `lateral`. */
    left: number;

    /** The same displacement as a nudge of the left hand, in arm lengths. */
    nudge: Required<AutoMovieMotionHumanTarget.INudge>;
  }

  /**
   * An elbow hint on a body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit and origin.
   * @evidence contracts/development/design.md#principled-representation The preset's shares beside the offset from the shoulder they are on this body.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `bend`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the bend owner's record.
   */
  export interface IBend {
    /** The shares, the extra outward share included. */
    shares: AutoMovieMotionHumanBend.IShares;

    /** The offset from the shoulder's rest place, metres: `x` outward, `y` up, `z` forward. */
    metres: IAutoMovieVector3;
  }

  /**
   * An amount on a joint.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The share of the motion's limit beside the signed degrees.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; returned by `amount`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Both are read from the range owner.
   */
  export interface IAmount {
    /** The share of the motion's limit. */
    share: number;

    /** Signed clinical degrees. */
    degrees: number;
  }

  /**
   * A named body of a table.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its role.
   * @evidence contracts/development/design.md#principled-representation The column's label and the measure the column is computed from.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `table`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Only the measure is asked for, so a capture body and a test stub both fit.
   */
  export interface IBody {
    /** The column's label. */
    name: string;

    /** The body. */
    body: Pick<IHumanBody, "measure">;
  }

  /**
   * A place on a body, in shares and in metres.
   *
   * @param body The body.
   * @param side The acting hand.
   * @param place The place, on any rung.
   * @returns Both readings.
   * @throws {Error} When the place is refused by `AutoMovieMotionHumanTarget.place`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal's owner.
   * @evidence contracts/development/implementation.md#principled-implementation The shares times the stature, the arm and the half shoulder width, the products `AutoMovieMotionHumanTarget.fallback` forms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One resolution and three products.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No rung is resolved here: the place owner resolves it.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `AutoMovieMotionHumanTarget.place`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function place(
    body: Pick<IHumanBody, "measure">,
    side: HumanHand.Side,
    place: AutoMovieMotionHumanTarget.Place,
  ): IPlace {
    const m = body.measure;
    const shares: AutoMovieMotionHumanTarget.IDefault =
      AutoMovieMotionHumanTarget.place(body, side, place);
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
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A displacement past a nudge's bound is still reported; `AutoMovieMotionHumanTarget.place` is what refuses it.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function shares(
    body: Pick<IHumanBody, "measure">,
    metres: IAutoMovieVector3,
  ): IShift {
    const m = body.measure;
    const arm: number = m.upperArm + m.forearm;
    return {
      forward: metres.z / arm,
      up: metres.y / m.stature,
      left: metres.x / m.shoulderHalfWidth,
      nudge: { out: metres.x / arm, up: metres.y / arm, forward: metres.z / arm },
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
    body: Pick<IHumanBody, "measure">,
    preset: AutoMovieMotionHumanBend.Arm | AutoMovieMotionHumanBend.IShares,
    out: number = 0,
  ): IBend {
    const base: AutoMovieMotionHumanBend.IShares =
      typeof preset === "string" ? AutoMovieMotionHumanBend.ARM[preset] : preset;
    const shares: AutoMovieMotionHumanBend.IShares = {
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
    motion: AutoMovieMotionHumanRange.Motion,
    amount: AutoMovieMotionHumanRange.Amount,
  ): IAmount {
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
  export function table(bodies: readonly IBody[]): string {
    const lines: string[] = [];
    const row = (
      label: string,
      cell: (body: Pick<IHumanBody, "measure">) => string,
    ): void => {
      lines.push(
        [label, ...bodies.map((b: IBody): string => cell(b.body))].join("\t"),
      );
    };
    const f = (value: number): string => value.toFixed(3);
    const point = (v: IAutoMovieVector3): string =>
      `${f(v.x)},${f(v.y)},${f(v.z)}`;
    lines.push(["name", ...bodies.map((b: IBody): string => b.name)].join("\t"));
    for (const name of Object.keys(
      AutoMovieMotionHumanTarget.DEFAULTS,
    ) as AutoMovieMotionHumanTarget.Name[])
      row(`place ${name} (x,y,z m)`, (body): string =>
        point(place(body, "left", name).metres),
      );
    for (const name of AutoMovieMotionHumanTarget.HEIGHTS)
      row(`height ${name} (share / m)`, (body): string => {
        const share: number = AutoMovieMotionHumanTarget.height(body, name);
        return `${f(share)} / ${f(share * body.measure.stature)}`;
      });
    for (const name of Object.keys(
      AutoMovieMotionHumanTarget.LATERALS,
    ) as AutoMovieMotionHumanTarget.Lateral[])
      row(
        `lateral ${name} (share / m)`,
        (body): string =>
          `${f(AutoMovieMotionHumanTarget.LATERALS[name])} / ${f(
            AutoMovieMotionHumanTarget.LATERALS[name] *
              body.measure.shoulderHalfWidth,
          )}`,
      );
    for (const name of Object.keys(
      AutoMovieMotionHumanTarget.DISTANCES,
    ) as AutoMovieMotionHumanTarget.Distance[])
      row(
        `distance ${name} (share / m)`,
        (body): string =>
          `${f(AutoMovieMotionHumanTarget.DISTANCES[name])} / ${f(
            AutoMovieMotionHumanTarget.DISTANCES[name] *
              (body.measure.upperArm + body.measure.forearm),
          )}`,
      );
    for (const name of Object.keys(
      AutoMovieMotionHumanBend.ARM,
    ) as AutoMovieMotionHumanBend.Arm[])
      row(`bend ${name} (out,up,forward m)`, (body): string =>
        point(bend(body, name).metres),
      );

    const levels: AutoMovieMotionHumanRange.Level[] = Object.keys(
      AutoMovieMotionHumanRange.LEVELS,
    ) as AutoMovieMotionHumanRange.Level[];
    lines.push("");
    lines.push(["level (degrees)", ...levels].join("\t"));
    for (const bone of BONES)
      for (const motion of MOTIONS) {
        const joint = DEFAULT_HUMANOID_ROM[bone];
        const axis =
          motion === "flexion" || motion === "extension"
            ? joint?.flexion
            : motion === "abduction" || motion === "adduction"
              ? joint?.abduction
              : joint?.twist;
        const end: number | undefined =
          axis === undefined || axis === null
            ? undefined
            : motion === "flexion" ||
                motion === "abduction" ||
                motion === "external"
              ? axis.max
              : axis.min;
        if (end === undefined || end === 0) continue;
        lines.push(
          [
            `${bone} ${motion}`,
            ...levels.map((level: AutoMovieMotionHumanRange.Level): string =>
              AutoMovieMotionHumanRange.degrees(bone, motion, level).toFixed(2),
            ),
          ].join("\t"),
        );
      }
    return lines.join("\n");
  }
}

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
const MOTIONS: readonly AutoMovieMotionHumanRange.Motion[] = [
  "flexion",
  "extension",
  "abduction",
  "adduction",
  "external",
  "internal",
];
