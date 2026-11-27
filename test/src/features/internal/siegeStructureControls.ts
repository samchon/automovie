import type { AutoMovieArchetypeSiegeEngine } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeSpanObservation } from "./archetypeSpanObservation";
import { nclose } from "./nclose";

/** The actual public launcher and its current real controls. */
type Engine = ReturnType<typeof AutoMovieArchetypeSiegeEngine.create>;

/**
 * Observe the actual pin/drawbar, fixed trestle and cross-post windlass.
 *
 * @param source Actual neutral producer output.
 * @param posed Actual public articulation at angle, with the pin unpulled.
 * @param angle Arm travel in degrees.
 * @param label Complete kind/seed/angle identity.
 * @param findings Whole-round failure collector.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines actual source/current primitives, independent degree-to-crank relation, metre control envelopes, pin extraction on local X, cocked-tip catch, fixed guide/base joins and crosshead support throughout the slider interval.
 * @evidence contracts/development/implementation.md#principled-implementation A radial crank about model X has endpoint Y=hubY+R*cos(turn), Z=R*sin(turn); its real axial grip joins that endpoint. Actual shaft/drum endpoints meet post faces. The independent cocked-arm formula supplies the release drawbar's catch, while actual slider +Z moves the pin, drawbar and crosshead together and leaves guides/rails fixed. Actual guide axes and bed faces must contain and touch both crosshead ends at zero, middle and full travel, while the centre opening clears the drawbar. Constant transverse coordinates and containment at both translation endpoints establish support throughout the interval.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Inspect windlass hub/radius/grip/drum, pull the actual pin, inspect both rod ends and drawbar/catch, then compare fixed trestle joins and the complete supported slider interval.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads no production fitting/clearance calculation, substitutes no affordance marker for a solid and changes no source/output method. Literal control stock is the existing authored specification, not a claimed historical measurement.
 * @evidence contracts/development/implementation.md#efficient-algorithms A fixed number of actual part scans and endpoint observations plus one actual public articulation, independent of film duration.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the independent actual-cylinder endpoint observer and nclose scalar predicate; the same real source/current records serve all coupled-control concerns.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains no source, posed model or external resource after this call.
 */
export function siegeStructureControls(
  source: Engine,
  posed: Engine,
  angle: number,
  label: string,
  findings: string[],
): void {
  const d: Engine["dimensions"] = source.dimensions;
  const turn: number = (-d.winchRatio! * angle * Math.PI) / 180;
  const hub: IAutoMovieVector3 = { x: d.frameWidth! / 2 + 0.25, y: 0.6, z: 0 };
  const grip: IAutoMovieVector3 = {
    x: hub.x,
    y: hub.y + d.winchRadius! * Math.cos(turn),
    z: d.winchRadius! * Math.sin(turn),
  };
  const crank: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    posed,
    "winch-crank",
  );
  point(`${label} actual crank hub`, crank[0], hub);
  point(`${label} actual crank radius endpoint`, crank[1], grip);
  const held: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    posed,
    "winch-grip",
  );
  point(`${label} actual axial grip starts at crank`, held[0], grip);
  point(`${label} actual axial grip end`, held[1], {
    ...grip,
    x: grip.x + 0.3,
  });
  near(
    `${label} original winch ratio`,
    posed.travel("winch"),
    -d.winchRatio! * angle,
  );
  const shaft: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    posed,
    "winch-shaft",
  );
  point(
    `${label} actual windlass through posts`,
    AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(shaft[0], shaft[1]), 0.5),
    { x: 0, y: 0.6, z: 0 },
  );
  const drum: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    posed,
    "winch-drum",
  );
  point(`${label} actual drum begins at inner post face`, drum[0], {
    x: -(d.frameWidth! - 0.25) / 2,
    y: 0.6,
    z: 0,
  });
  point(`${label} actual drum ends at inner post face`, drum[1], {
    x: (d.frameWidth! - 0.25) / 2,
    y: 0.6,
    z: 0,
  });
  truth(
    `${label} actual drum surrounds its shaft`,
    rod(posed, "winch-drum").radius > rod(posed, "winch-shaft").radius,
  );
  const pulled: Engine = source.articulate({ arm: angle, pin: 0.3 });
  const pin: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    pulled,
    "release-pin",
  );
  const at: IAutoMovieVector3 = pulled.affordance("pin").frame.translation;
  point(
    `${label} actual pin grip centre`,
    AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(pin[0], pin[1]), 0.5),
    at,
  );
  point(`${label} actual pin extracts on declared slider X`, at, {
    x: 0,
    y: 0.3,
    z: d.armLength! + 0.3,
  });
  point(`${label} actual pin first end follows slider axis`, pin[0], {
    ...at,
    z: at.z - 0.15,
  });
  point(`${label} actual pin second end follows slider axis`, pin[1], {
    ...at,
    z: at.z + 0.15,
  });
  const cocked: number = (-d.cocked! * Math.PI) / 180;
  const catchPoint: IAutoMovieVector3 = {
    x: 0,
    y: d.axleHeight! + d.armLength! * Math.sin(cocked),
    z: d.armLength! * Math.cos(cocked),
  };
  const link: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    pulled,
    "release-link",
  );
  point(`${label} actual release drawbar meets physical grip`, link[0], at);
  point(`${label} actual release drawbar extracts from cocked tip`, link[1], {
    ...catchPoint,
    z: catchPoint.z + 0.3,
  });
  if (angle === -d.cocked!)
    point(
      `${label} actual unpulled catch meets actual cocked arm`,
      ends(posed, "release-link")[1],
      ends(posed, "arm")[1],
    );
  near(`${label} original pin grip length`, distance(pin[0], pin[1]), 0.3);
  near(
    `${label} actual pin grip diameter`,
    2 * rod(pulled, "release-pin").radius,
    pulled.affordance("pin").aperture!,
  );
  for (const id of [
    "release-crossbar",
    "release-bed--1",
    "release-bed-1",
    "release-rail-left",
    "release-rail-right",
    "release-guide--1",
    "release-guide-1",
  ])
    point(
      `${label}/${id} fixed support`,
      part(pulled, id).transform!.translation,
      part(source, id).transform!.translation,
    );
  const rails: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
    source,
    "release-rail-left",
  );
  near(
    `${label} actual rail joins original base front`,
    rails[0].z,
    d.armLength! / 2,
  );
  near(
    `${label} actual rail reaches fully extracted pin end`,
    rails[1].z,
    pin[1].z,
  );
  for (const [side, sign] of [["left", 1], ["right", -1]] as const) {
    const bed: IAutoMovieModelPart = part(source, `release-bed-${sign}`);
    if (bed.geometry.type !== "primitive" || bed.geometry.shape.type !== "box")
      throw new Error("The retained control requires two actual support beds");
    const size: typeof bed.geometry.shape = bed.geometry.shape;
    const centre: IAutoMovieVector3 = bed.transform!.translation;
    point(
      `${label}/${side} bed has a horizontal support face`,
      AutoMovieEngineQuaternion.rotateVector(bed.transform!.rotation, { x: 0, y: 1, z: 0 }),
      { x: 0, y: 1, z: 0 },
    );
    point(
      `${label}/${side} bed follows the slider direction`,
      AutoMovieEngineQuaternion.rotateVector(bed.transform!.rotation, { x: 0, y: 0, z: 1 }),
      { x: 0, y: 0, z: 1 },
    );
    const low: IAutoMovieVector3 = {
      x: centre.x - size.width / 2,
      y: centre.y - size.height / 2,
      z: centre.z - size.depth / 2,
    };
    const high: IAutoMovieVector3 = {
      x: centre.x + size.width / 2,
      y: centre.y + size.height / 2,
      z: centre.z + size.depth / 2,
    };
    const rail: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
      source,
      `release-rail-${side}`,
    );
    const radius: number = rod(source, `release-rail-${side}`).radius;
    truth(
      `${label}/${side} fixed bed joins its base-connected rail`,
      Math.hypot(
        Math.max(low.x - rail[0].x, 0, rail[0].x - high.x),
        Math.max(low.y - rail[0].y, 0, rail[0].y - high.y),
      ) <= radius &&
        low.z < rail[1].z && high.z > rail[0].z,
    );
    near(`${label}/${side} open centre clears the descending drawbar`,
      sign === 1 ? low.x : -high.x, rod(source, "release-link").radius);
    for (const travel of [0, 0.15, 0.3]) {
      const retained: Engine = source.articulate({ arm: angle, pin: travel });
      const current: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
        retained,
        "release-pin",
      );
      const crosshead: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
        retained,
        "release-carriage",
      );
      const endpoint: IAutoMovieVector3 = crosshead[sign === 1 ? 1 : 0];
      const crossheadRadius: number = rod(retained, "release-carriage").radius;
      point(`${label}/${travel} actual crosshead carries the pin centre`,
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(crosshead[0], crosshead[1]), 0.5),
        AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(current[0], current[1]), 0.5));
      near(`${label}/${travel}/${side} actual bed touches crosshead underside`,
        high.y, endpoint.y - crossheadRadius);
      truth(
        `${label}/${travel}/${side} bed covers actual crosshead end`,
        low.x < endpoint.x && high.x > endpoint.x &&
          low.z <= endpoint.z - crossheadRadius + 1e-9 &&
          high.z >= endpoint.z + crossheadRadius - 1e-9,
      );
      const id: string = `release-guide-${sign}`;
      const guide: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
        retained,
        id,
      );
      const guideRadius: number = rod(retained, id).radius;
      for (const end of guide) {
        near(`${label}/${travel}/${side} side guide touches crosshead cap`,
          sign * (end.x - endpoint.x), guideRadius);
        near(`${label}/${travel}/${side} side guide shares crosshead height`,
          end.y, endpoint.y);
        near(`${label}/${travel}/${side} fixed guide rests on its bed`,
          end.y - guideRadius, high.y);
        truth(`${label}/${travel}/${side} bed supports the guide axis`,
          low.x < end.x && high.x > end.x);
      }
      truth(
        `${label}/${travel}/${sign} guide covers both actual pin ends`,
        guide[0].z <= current[0].z + 1e-9 &&
          guide[1].z >= current[1].z - 1e-9,
      );
    }
  }

  /** Read actual cylinder endpoints, never declared span/control positions. */
  function ends(
    engine: Engine,
    id: string,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    return archetypeSpanObservation.ends(part(engine, id));
  }

  /** A missing real control is a failed positive scenario. */
  function part(engine: Engine, id: string): IAutoMovieModelPart {
    const value: IAutoMovieModelPart | undefined = engine.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (value === undefined) throw new Error(`Missing actual control ${id}`);
    return value;
  }

  /** Actual circular dimensions own the held run's physical diameter. */
  function rod(engine: Engine, id: string): { radius: number; height: number } {
    const value: IAutoMovieModelPart = part(engine, id);
    if (
      value.geometry.type !== "primitive" ||
      value.geometry.shape.type !== "cylinder"
    )
      throw new Error(`Unsupported actual control ${id}`);
    return value.geometry.shape;
  }

  /** Euclidean separation observes physical lengths without a control solver. */
  function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /** All three observed coordinates retain the existing arithmetic precision. */
  function point(
    name: string,
    actual: IAutoMovieVector3,
    expected: IAutoMovieVector3,
  ): void {
    for (const axis of ["x", "y", "z"] as const)
      near(`${name}.${axis}`, actual[axis], expected[axis]);
  }

  /** Every independent scalar keeps the original 1e-9 comparison budget. */
  function near(name: string, actual: number, expected: number): void {
    truth(
      `${name}: ${actual} expected ${expected}`,
      nclose(actual, expected, 1e-9),
    );
  }

  /** Preserve all coupled-control findings for the complete cause round. */
  function truth(name: string, condition: boolean): void {
    try {
      TestValidator.predicate(name, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
