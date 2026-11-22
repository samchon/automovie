import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeUnits,
} from "../core";
import type { SiegeArm } from "./SiegeArm";
import { SiegeClearance } from "./SiegeClearance";
import type { createSiegeEngine } from "./createSiegeEngine";

/**
 * Actual coarse fittings of the existing tip-carried lever-arm launcher.
 *
 * Hansen 1992 describes axles in bearings, a net pouch, a separate firing
 * catch and loading tackle (https://linnamuuseum.ee/JaanMarss/juhendid/Mehaanilised_kaugrelvad_keskajal/andmebaas/Middelaldercentret/Peter%20Vemming%20Hansen/acta.html).
 * Those relationships motivate these parts; their dimensions are construction
 * envelopes of SiegeArm's authored sections and control grip. The moving arm
 * and cradle section are designed together against their complete angular
 * floor-support domain; the actual section places the arm-tip socket.
 * There is no independent sling swing or historical sling-length
 * claim. The windlass is the existing authored crank, not Hansen's ground tackle.
 * Cord diameter borrows Tarver's actual 5/8-inch manila sling rope (1995, p.155,
 * https://uccshes.wordpress.com/wp-content/uploads/2012/09/reconstruction-of-a-traction-trebuchet.pdf);
 * its use on the counterweight type is a declared construction transfer.
 * Every actual solid contributes its volume under the existing composite
 * relative-density premise and drawn total mass. The independent long-thin-bar
 * pendulum's stated arm mass remains its provisional launch approximation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the primary structural reference, SI construction envelopes, whole-domain section design, moving/stationary groups, tip-carried cradle premise and actual-solid mass allocation under the unchanged total/pendulum scope.
 * @evidence contracts/development/design.md#principled-representation Named rigid primitive fittings use the actual axle, arm, socket, slider and crank frames. Two declared spans join actual arm-tip and cradle points; the existing articulation owner moves all groups.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Internal to SiegeArm.lay; owns only missing physical fittings and their part membership, without another launcher law, dimension draw, physics engine or public affordance.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No measured sling length, structural rating, material density, automatic release coupling or independent projectile motion is invented. The existing explicitly provisional tip-carried launcher remains visible as that approximation.
 */
export namespace SiegeStructure {
  /** Tarver 1995 p.155's 5/8-inch manila rope, reused as coarse cord stock for both kinds; no strength or counterweight-replica measurement is implied. */
  export const CORD_RADIUS: number =
    ((5 / 8) * AutoMovieArchetypeUnits.INCH) / 2;

  /** Actual rigid pieces turned by the existing arm hinge; spans follow their ends. */
  export const ARM_PARTS: readonly string[] = [
    "arm",
    "axle",
    "pouch",
    "pouch-left",
    "pouch-right",
    "pouch-back",
  ];

  /** Actual rotating windlass group, carried only by the existing crank. */
  export const WINCH_PARTS: readonly string[] = [
    "winch-shaft",
    "winch-drum",
    "winch-crank",
    "winch-grip",
  ];

  /** Actual extracted pin/drawbar and supported crosshead; guides and beds stay fixed. */
  export const PIN_PARTS: readonly string[] = [
    "release-pin",
    "release-link",
    "release-carriage",
  ];

  /** One actual dimension-derived box, with its complete support bounds. */
  interface IBox {
    /** Actual part identity. */
    id: string;
    /** Full positive sizes, metres. */
    size: IAutoMovieVector3;
    /** Actual neutral centre, model metres. */
    at: IAutoMovieVector3;
  }

  /**
   * Design a representable moving section at the complete support boundary.
   *
   * @param d Drawn source dimensions and complete degree travel interval.
   * @param e Existing authored frame/control stock; beam caps the moving diameter.
   * @returns Admitted actual moving radius, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The existing beam section is an authored upper cap, not a sourced diameter. Actual arm-cylinder support, all cradle-box corners and both measured-radius cords constrain the same section over every declared angle.
   * @evidence contracts/development/implementation.md#principled-implementation Test the actual rounded dimension-derived cradle records, arm cylinder and vertical-cord circular supports through SiegeClearance. The homothetic section's zero-radius limit clears the floor; choose an admitted representable positive-clearance section at that analytic boundary below the authored cap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Snapshot the source angle domain, then pass one complete analytic tip-assembly predicate to the bounded representation search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No source arm length, axle height, cocked/release/reach angle, scene floor or capture placement changes; no single endpoint or sampled angle supplies the support domain.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most 66 fixed-size analytic predicates including boundary admissions; four cradle boxes and a constant number of cylinder-support signs per predicate, without building a model or running a physical solver.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same cradle records are consumed by final emission, and SiegeClearance owns all endpoint/stationary support arithmetic.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Candidate records are call-local and released after each predicate; only one scalar section escapes.
   */
  export function radius(
    d: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>>,
    e: typeof SiegeArm.ESTIMATES,
  ): number {
    const height: number = d.axleHeight!;
    const long: number = d.armLength!;
    const first: number = -d.cocked!;
    const last: number = d.reach!;
    return SiegeClearance.radius(e.beam / 2, (radius: number): boolean => {
      if (
        !(
          SiegeClearance.cylinder(
            { x: 0, y: height, z: -d.shortArm! },
            { x: 0, y: height, z: long },
            radius,
            height,
            first,
            last,
          ) > 0
        )
      )
        return false;
      for (const box of cradle(height, long, radius))
        if (!(SiegeClearance.box(box.at, box.size, height, first, last) > 0))
          return false;
      for (const offset of [0, height + radius - height])
        for (const sign of [-1, 1] as const)
          if (
            !(
              SiegeClearance.minimum(
                height,
                offset,
                long + sign * CORD_RADIUS,
                first,
                last,
              ) > 0
            )
          )
            return false;
      return true;
    });
  }

  /**
   * Construct connected fittings inside the existing authored section envelopes.
   *
   * @param builder Engine with its actual base/posts/arm and kind's contacts recorded.
   * @param d Existing drawn SI dimensions; no dimension is drawn here.
   * @param e Existing authored post/beam/box and control sizes.
   * @param counterweight Whether the short end carries its existing hanging box.
   * @param armRadius The complete tip assembly's admitted actual section radius.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines SI inputs, separate frame/control and admitted moving-arm stocks, actual socket/controls, rigid ownership and real span endpoints. Every actual fitting contributes its real volume to the existing total-mass composite allocation.
   * @evidence contracts/development/implementation.md#principled-implementation The section-sized crossshaft spans both posts at the true hinge. The same designed cradle records put the inner floor on the actual arm-radius socket. Short sling spans join actual arm/cradle rims. Admit every moving fitting's complete angular box/cylinder support, all crank rotations, and each fixed/pin support before recording the real solid. A real crosshead carries the extracted pin/drawbar on two fixed beds and parallel side guides throughout the existing slider interval; the central opening clears the descending drawbar and the trestle reaches the far end.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Build pivot and optional short-end axle, the open tip cradle and two spans, fixed release rails/guide and the slider pin, then the rotating windlass.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The unsourced moving section is designed by actual whole-domain support, separately from fixed stock. Rope diameter is Tarver's read reconstruction value, explicitly transferred to the counterweight construction. No zero-share fitting, hidden physical proxy, soil offset, runtime pose clamp, hanging-sling dynamics, wound-cable law or rated strength is introduced. Source lengths, angles, total mass and long-thin-bar launch law remain fixed.
   * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of boxes/rods and two spans; builder lookups are linear in the engine's bounded part list, and each pose reuses the generic articulation/span owners.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses existing primitive construction, actual-part anchor conversion and span realization. Existing authored control stock supplies coarse detail envelopes rather than another physical-size table.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Records only builder-owned primitive/span data; retains no caller records, cache, sampled pose history or external resource.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      createSiegeEngine.Affordance,
      createSiegeEngine.Dimension
    >,
    d: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>>,
    e: typeof SiegeArm.ESTIMATES,
    counterweight: boolean,
    armRadius: number,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const wood: AutoMovieArchetypeBuilder.IOptions = { color: "#6b5a3e" };
    const iron: AutoMovieArchetypeBuilder.IOptions = { color: "#5a5a5a" };
    const cord: AutoMovieArchetypeBuilder.IOptions = { color: "#645139" };
    const axle: number = d.axleHeight!;
    const width: number = d.frameWidth!;
    const long: number = d.armLength!;
    const stock: number = e.pin.aperture / 2;
    const socket: IAutoMovieVector3 = v(0, axle + armRadius, long);
    const shaftRadius: number = Math.min(e.post / 2, armRadius);
    const first: number = -d.cocked!;
    const last: number = d.reach!;

    rod(
      "axle",
      shaftRadius,
      v(-(width + e.post) / 2, axle, 0),
      v((width + e.post) / 2, axle, 0),
      wood,
      "arm",
    );
    if (counterweight)
      rod(
        "counterweight-axle",
        shaftRadius,
        v(-e.box / 2, axle, -d.shortArm!),
        v(e.box / 2, axle, -d.shortArm!),
        iron,
        "arm",
      );

    for (const box of cradle(axle, long, armRadius)) {
      admit(box.id, SiegeClearance.box(box.at, box.size, axle, first, last));
      builder.box(box.id, box.size, box.at, cord);
    }
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const) {
      const from: IAutoMovieVector3 = v(sign * armRadius, axle, long);
      const to: IAutoMovieVector3 = v(sign * armRadius, socket.y, long);
      admit(
        `sling-${side}`,
        SiegeClearance.cylinder(from, to, CORD_RADIUS, axle, first, last),
      );
      builder.span(
        `sling-${side}`,
        builder.anchor("arm", from),
        builder.anchor("pouch", to),
        CORD_RADIUS,
        cord,
      );
    }

    // A crosshead supports the extracted control on two beds. Their open
    // centre clears the drawbar that slopes below the pin on the trebuchet.
    const guideStart: number = long - e.pin.length / 2;
    const guideEnd: number = long + e.pin.pull + e.pin.length / 2;
    const bedTop: number = e.beam - stock;
    const bedWidth: number = e.beam / 2 + stock;
    const railHeight: number = e.beam / 2;
    const railRadius: number = Math.min(e.post / 2, bedTop - railHeight);
    for (const sign of [-1, 1] as const) {
      const bed: IBox = {
        id: `release-bed-${sign}`,
        size: v(bedWidth, 2 * stock, guideEnd - guideStart),
        at: v(
          sign * (stock + bedWidth / 2),
          bedTop - stock,
          (guideStart + guideEnd) / 2,
        ),
      };
      admit(bed.id, SiegeClearance.box(bed.at, bed.size, 0, 0, 0));
      builder.box(bed.id, bed.size, bed.at, wood);
    }
    rod(
      "release-carriage",
      stock,
      v(-e.beam / 2, e.beam, long),
      v(e.beam / 2, e.beam, long),
      iron,
      "frame",
    );

    // The trestle connects this whole fixed channel back to the original base.
    // Its round stock fits below the same carriage support plane as the beds.
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      rod(
        `release-rail-${side}`,
        railRadius,
        v((sign * e.beam) / 2, railHeight, long / 2),
        v((sign * e.beam) / 2, railHeight, guideEnd),
        wood,
        "frame",
      );
    rod(
      "release-crossbar",
      railRadius,
      v(-e.beam / 2, railHeight, guideEnd),
      v(e.beam / 2, railHeight, guideEnd),
      wood,
      "frame",
    );
    rod(
      "release-pin",
      stock,
      v(0, e.beam, long - e.pin.length / 2),
      v(0, e.beam, long + e.pin.length / 2),
      iron,
      "frame",
    );
    const cocked: number = -d.cocked! * AutoMovieArchetypeUnits.DEGREE;
    rod(
      "release-link",
      stock,
      v(0, e.beam, long),
      v(0, axle + long * Math.sin(cocked), long * Math.cos(cocked)),
      iron,
      "frame",
    );
    for (const sign of [-1, 1] as const)
      rod(
        `release-guide-${sign}`,
        stock,
        v(sign * (e.beam / 2 + stock), e.beam, guideStart),
        v(sign * (e.beam / 2 + stock), e.beam, guideEnd),
        iron,
        "frame",
      );

    const crankX: number = width / 2 + e.post;
    rod(
      "winch-shaft",
      stock,
      v(-crankX, e.winch, 0),
      v(crankX, e.winch, 0),
      iron,
      "winch",
    );
    rod(
      "winch-drum",
      e.beam / 2,
      v(-(width - e.post) / 2, e.winch, 0),
      v((width - e.post) / 2, e.winch, 0),
      wood,
      "winch",
    );
    rod(
      "winch-crank",
      stock,
      v(crankX, e.winch, 0),
      v(crankX, e.winch + d.winchRadius!, 0),
      iron,
      "winch",
    );
    rod(
      "winch-grip",
      stock,
      v(crankX, e.winch + d.winchRadius!, 0),
      v(crankX + e.pin.length, e.winch + d.winchRadius!, 0),
      wood,
      "winch",
    );

    /** Each real rod is admitted in its actual carrier's complete angle domain. */
    function rod(
      id: string,
      radius: number,
      from: IAutoMovieVector3,
      to: IAutoMovieVector3,
      options: AutoMovieArchetypeBuilder.IOptions,
      carrier: "arm" | "frame" | "winch",
    ): void {
      const pivot: number =
        carrier === "arm" ? axle : carrier === "winch" ? e.winch : 0;
      const ratio: number =
        carrier === "winch" ? d.winchRatio! : carrier === "arm" ? 1 : 0;
      admit(
        id,
        SiegeClearance.cylinder(
          from,
          to,
          radius,
          pivot,
          first * ratio,
          last * ratio,
        ),
      );
      builder.rod(id, radius, from, to, options);
    }

    /** A negative lower support is a real construction refusal, without a gap tolerance. */
    function admit(id: string, minimum: number): void {
      if (!(Number.isFinite(minimum) && minimum >= 0))
        throw new RangeError(
          `Siege ${id} crosses its declared floor over the angle domain`,
        );
    }
  }

  /** One homothetic moving section keeps the existing authored cradle proportions. */
  function cradle(
    height: number,
    long: number,
    radius: number,
  ): readonly IBox[] {
    const section: number = 2 * radius;
    const stock: number = section / 6;
    const socket: number = height + radius;
    return [
      {
        id: "pouch",
        size: { x: section, y: stock, z: section },
        at: { x: 0, y: socket - stock / 2, z: long },
      },
      ...([1, -1] as const).map(
        (sign: number): IBox => ({
          id: `pouch-${sign === 1 ? "left" : "right"}`,
          size: { x: stock, y: radius, z: section },
          at: {
            x: (sign * (section - stock)) / 2,
            y: socket + radius / 2,
            z: long,
          },
        }),
      ),
      {
        id: "pouch-back",
        size: { x: section - 2 * stock, y: radius, z: stock },
        at: { x: 0, y: socket + radius / 2, z: long - (section - stock) / 2 },
      },
    ];
  }
}
