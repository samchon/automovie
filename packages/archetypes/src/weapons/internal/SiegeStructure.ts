import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { SiegeArm } from "./SiegeArm";
import { SiegeClearance } from "./SiegeClearance";
import type { AutoMovieArchetypeSiegeEngine } from "../AutoMovieArchetypeSiegeEngine";

/*
 * Coarse fittings of the existing tip-carried lever-arm launcher.
 *
 * Hansen 1992 describes axles in bearings, a net pouch, a separate firing catch
 * and loading tackle
 * (https://linnamuuseum.ee/JaanMarss/juhendid/Mehaanilised_kaugrelvad_keskajal/andmebaas/Middelaldercentret/Peter%20Vemming%20Hansen/acta.html).
 * Those relationships motivate these parts; their dimensions are construction
 * envelopes of SiegeArm's authored sections and control grip. The moving arm
 * and cradle section are designed together against their complete angular
 * floor-support domain; the section places the arm-tip socket. There is no
 * independent sling swing or historical sling-length claim. The windlass is the
 * existing authored crank, not Hansen's ground tackle. Cord diameter borrows
 * Tarver's 5/8-inch manila sling rope (1995, p.155,
 * https://uccshes.wordpress.com/wp-content/uploads/2012/09/reconstruction-of-a-traction-trebuchet.pdf);
 * its use on the counterweight type is a declared construction transfer. Every
 * solid contributes its volume under the existing composite relative-density
 * premise and drawn total mass. The independent long-thin-bar pendulum's stated
 * arm mass remains its provisional launch approximation.
 */
export namespace SiegeStructure {
  /*
   * Tarver 1995 p.155's 5/8-inch manila rope, reused as coarse cord stock for
   * both kinds; no strength or counterweight-replica measurement is implied.
   */
  export const CORD_RADIUS: number =
    ((5 / 8) * AutoMovieArchetypeUnits.INCH) / 2;

  /*
   * Rigid pieces turned by the existing arm hinge; spans follow their ends.
   */
  export const ARM_PARTS: readonly string[] = [
    "arm",
    "axle",
    "pouch",
    "pouch-left",
    "pouch-right",
    "pouch-back",
  ];

  /*
   * Rotating windlass group, carried only by the existing crank.
   */
  export const WINCH_PARTS: readonly string[] = [
    "winch-shaft",
    "winch-drum",
    "winch-crank",
    "winch-grip",
  ];

  /*
   * Extracted pin/drawbar and supported crosshead; guides and beds stay fixed.
   */
  export const PIN_PARTS: readonly string[] = [
    "release-pin",
    "release-link",
    "release-carriage",
  ];

  /*
   * Design a representable moving section at the complete support boundary.
   * Parameter d: Drawn source dimensions and complete degree travel interval.
   * Parameter e: Existing authored frame/control stock; beam caps the moving
   * diameter.
   * Returns: Admitted moving radius, metres.
   */
  export function radius(
    d: Readonly<Partial<Record<AutoMovieArchetypeSiegeEngine.Dimension, number>>>,
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

  /*
   * Construct connected fittings inside the existing authored section
   * envelopes.
   * Parameter builder: Engine with its base/posts/arm and kind's contacts recorded.
   * Parameter d: Existing drawn SI dimensions; no dimension is drawn here.
   * Parameter e: Existing authored post/beam/box and control sizes.
   * Parameter counterweight: Whether the short end carries its existing hanging
   * box.
   * Parameter armRadius: The complete tip assembly's admitted section radius.
   */
  export function lay(
    builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeSiegeEngine.Affordance,
      AutoMovieArchetypeSiegeEngine.Dimension
    >,
    d: Readonly<Partial<Record<AutoMovieArchetypeSiegeEngine.Dimension, number>>>,
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

    /*
     * Each real rod is admitted in its carrier's complete angle domain.
     */
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

    /*
     * A negative lower support is a real construction refusal, without a gap
     * tolerance.
     */
    function admit(id: string, minimum: number): void {
      if (!(minimum >= 0))
        throw new RangeError(
          `Siege ${id} crosses its declared floor over the angle domain`,
        );
    }
  }

  /*
   * One dimension-derived box, with its complete support bounds.
   */
  interface IBox {
    /*
     * Part identity.
     */
    id: string;
    /*
     * Full positive sizes, metres.
     */
    size: IAutoMovieVector3;
    /*
     * Neutral centre, model metres.
     */
    at: IAutoMovieVector3;
  }

  /*
   * One homothetic moving section keeps the existing authored cradle
   * proportions.
   */
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
