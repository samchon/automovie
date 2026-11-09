import {
  AutoMovieLoftViewRead,
  AutoMovieLoftViewSource,
  AutoMovieNativeCoordinate,
} from "@automovie/engine";

import { AutoMovieHumanTrunkGuides } from "../AutoMovieHumanTrunkGuides";
import type { AutoMovieHumanTorsoArmSource } from "./AutoMovieHumanTorsoArmSource";
import type { AutoMovieHumanTorsoSource } from "./AutoMovieHumanTorsoSource";

/** Original axillary chart loops on the actual composed S00, independently of GH and finished-loft contact. */
export namespace AutoMovieHumanTorsoArmPort {
  /** Exact derivatives of one source-chart loop with respect to its own radian clock. */
  export interface IChart {
    /** Physical station mm and actual S00 material clock radians. */
    readonly p: readonly [number, number];
    /** First derivative per port radian. */
    readonly t: readonly [number, number];
    /** Second derivative per port radian squared. */
    readonly tt: readonly [number, number];
  }

  /** Original parent boundary authority; aliases carry exact integer turns, not re-inverted rounded coordinates. */
  export interface IBoundary {
    /** Actual immutable port invocation, distinct from another equal-name family. */
    readonly owner: IPort;
    /** Principal original port clock, radians in [0,period). */
    readonly clock: number;
    /** Semantic port-loop turn, kept separate from its floating principal clock. */
    readonly turn: number;
    /** Semantic parent material-period turn, without floating add/subtract round trips. */
    readonly parentTurn: number;
    /** Invocation-local parent shared-point key; aliases retain the identical key. */
    readonly key: string;
  }

  /** Known boundary resolution supplies no arbitrary-coordinate classifier, cut or band. */
  export interface IResolved {
    /** Original shared boundary key, independent of either turn. */
    readonly key: string;
    /** Same original chart and its actual first/second port-clock derivatives. */
    readonly chart: IChart;
    /** Actual parent Point0, calibration mm; chart2 is not a fabricated world2. */
    readonly point: readonly [number, number, number];
    /** Original boundary role, without floating inside/outside reclassification. */
    readonly role: "boundary";
  }

  /** One full closed original loop and its declared removed interior, not a four-point attachment. */
  export interface IPort {
    /** Stable anatomical port identity. */
    readonly id: string;
    /** Complete unchanged parent generating owner. */
    readonly parent: AutoMovieHumanTorsoSource.IOutput;
    /** Actual child original and independent GH/bind datum. */
    readonly child: AutoMovieHumanTorsoArmSource.IArm;
    /** Original port clock, radian period and traversal. */
    readonly domain: readonly [0, number];
    /** One entire unchanged radian cycle, independently of the parent's material clock. */
    readonly period: number;
    /** Winding in the parent's (physical station, material phase) chart; reflection reverses it. */
    readonly orientation: 1 | -1;
    /** Real source-chart extent, not a completed surface intersection. */
    readonly bounds: Readonly<{
      /** Actual lower/upper physical plane, calibration mm. */
      station: readonly [number, number];
      /** Actual parent material-clock extent, radians, away from the cover seam. */
      phase: readonly [number, number];
    }>;
    /** Original material/weight roles are named separately; no sewn weight equality is implied. */
    readonly material: "torso.skin";
    /** A surface port and a GH datum do not supply the eventual shared skin weights. */
    readonly sharedWeights: "unrequested";
    /** The eventual engine hole consumer keeps outside and first retains these original boundary identities. */
    readonly keptSide: "outside";
    /** Arbitrary source-chart inside/outside and actual trim consumption remain unsupported here. */
    readonly chartClassification: "unprovided";
    /** Entire C2 chart loop, with no sampled boundary fit. */
    chart(clock: number): IChart;
    /** Actual composed parent Point0 on the entire loop, calibration mm. */
    point(clock: number): [number, number, number];
    /** Own a known principal boundary address, keeping period aliases as exact integer metadata. */
    boundary(clock: number, turn?: number, parentTurn?: number): IBoundary;
    /** Resolve this actual owner's boundary for the later engine hole/shared-ID consumer. */
    resolve(address: IBoundary): IResolved;
  }

  /**
   * Author the complete scye candidate from original axillary material guides and public heights.
   * TrunkGuides' anterior/posterior lateral shares are retained reference-set priors,
   * not supplied fold landmarks. Their original wall clocks at the axilla remain
   * material addresses on the new composed field; no claim is made that their world
   * lateral coordinate remains that fraction at every height after composition.
   * The ellipse lies between actual axilla/acromion planes and never crosses the
   * parent's periodic cover seam. Its chart simplicity is analytic; world regularity,
   * child-band compatibility, anatomy and shared binding still need validation.
   */
  export function create(
    original: AutoMovieHumanTorsoSource.IOutput,
    arms: AutoMovieHumanTorsoArmSource.IOutput,
  ): readonly IPort[] {
    const axilla: number =
      original.plan.measures.axillaHeight * original.plan.scale;
    const acromion: number =
      original.plan.measures.acromialHeight * original.plan.scale;
    if (
      !(
        original.plan.domain[0] < axilla &&
        axilla < acromion &&
        acromion < original.plan.domain[1]
      )
    )
      throw new Error(
        "Original arm-port planes leave the composed torso domain",
      );
    const prepared: ReturnType<typeof AutoMovieLoftViewSource.create> =
      AutoMovieLoftViewSource.create(original.wall);
    if (prepared === null || prepared.source === null)
      throw new Error("Original arm port has no native wall control owner");
    const values: ReturnType<typeof AutoMovieLoftViewRead.values> =
      AutoMovieLoftViewRead.values(prepared.source, axilla);
    if (typeof values === "string") throw new Error(values);
    const anterior: number = AutoMovieNativeCoordinate.locate(
      values,
      1,
      1,
      AutoMovieHumanTrunkGuides.SHARE.anteriorAxillary * values.extents[1],
    ).phase;
    const posterior: number = AutoMovieNativeCoordinate.locate(
      values,
      1,
      -1,
      AutoMovieHumanTrunkGuides.SHARE.posteriorAxillary * values.extents[1],
    ).phase;
    if (!(0 < anterior && anterior < posterior && posterior < Math.PI))
      throw new Error(
        "Original axillary material guides have no ordered same-side chart",
      );
    const centre: number = (anterior + posterior) / 2;
    const width: number = (posterior - anterior) / 2;
    const middle: number = (axilla + acromion) / 2;
    const height: number = (acromion - axilla) / 2;
    if (
      arms.arms.length !== 2 ||
      new Set(
        arms.arms.map(
          (child: AutoMovieHumanTorsoArmSource.IArm): string => child.name,
        ),
      ).size !== 2
    )
      throw new Error(
        "Original torso ports need both distinct sided arm owners",
      );
    return arms.arms.map((child: AutoMovieHumanTorsoArmSource.IArm): IPort => {
      if (child.name !== "arm.left" && child.name !== "arm.right")
        throw new Error(
          "Original torso port has an unknown anatomical arm owner",
        );
      const sign: 1 | -1 = child.name === "arm.left" ? 1 : -1;
      const phase: number = sign === 1 ? centre : 2 * Math.PI - centre;

      /** Period aliases evaluate the same actual loop, including its exact repeated endpoint. */
      const chart: (clock: number) => IChart = (clock: number): IChart => {
        if (!(Number.isFinite(clock) && clock >= 0 && clock <= 2 * Math.PI))
          throw new Error("Original arm port clock leaves its closed period");
        const u: number = clock === 2 * Math.PI ? 0 : clock;
        return {
          p: [
            middle + height * Math.cos(u),
            phase + sign * width * Math.sin(u),
          ],
          t: [-height * Math.sin(u), sign * width * Math.cos(u)],
          tt: [-height * Math.cos(u), -sign * width * Math.sin(u)],
        };
      };
      const port: IPort = {
        id: "S00.port." + child.name,
        parent: original,
        child,
        domain: [0, 2 * Math.PI],
        period: 2 * Math.PI,
        orientation: sign,
        bounds: {
          station: [axilla, acromion],
          phase: [phase - width, phase + width],
        },
        material: "torso.skin",
        sharedWeights: "unrequested",
        keptSide: "outside",
        chartClassification: "unprovided",
        chart,
        point: (clock: number): [number, number, number] => {
          const [s, t]: readonly [number, number] = chart(clock).p;
          const p: [number, number] = original.point(s, t);
          return [p[0], s, p[1]];
        },
        boundary: (
          clock: number,
          turn: number = 0,
          parentTurn: number = 0,
        ): IBoundary => {
          chart(clock);
          const principal: number = clock === port.period ? 0 : clock;
          const turns: number = turn + (clock === port.period ? 1 : 0);
          if (![turn, parentTurn, turns].every(Number.isSafeInteger))
            throw new Error(
              "Original port aliases require exact safe integer turns",
            );
          return Object.freeze({
            owner: port,
            clock: principal,
            turn: turns,
            parentTurn,
            key: port.id + ".parent@" + principal.toString(),
          });
        },
        resolve: (address: IBoundary): IResolved => {
          if (
            address.owner !== port ||
            address.clock < 0 ||
            address.clock >= port.period ||
            ![address.turn, address.parentTurn].every(Number.isSafeInteger) ||
            address.key !== port.id + ".parent@" + address.clock.toString()
          )
            throw new Error(
              "Original port boundary belongs to another family or invalid address",
            );
          return {
            key: address.key,
            chart: chart(address.clock),
            point: port.point(address.clock),
            role: "boundary",
          };
        },
      };
      return port;
    });
  }
}
