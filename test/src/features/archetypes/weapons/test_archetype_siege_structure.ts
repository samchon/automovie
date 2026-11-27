import { AutoMovieArchetypeRefusal, AutoMovieArchetypeSiegeEngine } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeSpanObservation } from "../../internal/archetypeSpanObservation";
import { nclose } from "../../internal/nclose";
import { siegeStructureControls } from "../../internal/siegeStructureControls";
import { siegeStructureFloor } from "../../internal/siegeStructureFloor";
import { siegeStructureMass } from "../../internal/siegeStructureMass";

/** Actual public lever-arm source and posed output. */
type Engine = ReturnType<typeof AutoMovieArchetypeSiegeEngine.create>;

/**
 * Actual siege fittings remain joined to their declared controls through a
 * throw.
 *
 * Scenarios:
 *
 * 1. Both kinds at four seeds retain their literal primary arm/axle figures,
 *    stated total mass, actual-solid composite allocation and shaft/post
 *    joins.
 * 2. Cocked, level, vertical, release and maximum-reach poses preserve actual arm
 *    length, open-cradle floor/wall joins and both real folded sling ends.
 *    Tarver's 5/8-inch cord is observed on actual primitives, not span
 *    metadata.
 * 3. The counterweight's actual short-end crossshaft follows the arm while its box
 *    stays plumb; the physical pin slides along its declared local X and its
 *    guide/trestle stays fixed and two beds and side guides support the pin's
 *    crosshead at zero, intermediate and full extraction. The windlass's actual
 *    grip follows its declared radial crank and existing turn ratio about the
 *    cross-post shaft.
 * 4. Every real solid clears floor zero over the complete declared arm/crank
 *    domains, including box corners and cylinder support stationary angles. The
 *    designed actual section places the pouch; the same armLength-based reduced
 *    launch law remains. Invalid pin/arm travel refuses.
 * 5. Reverse-order poses, returned span-state mutation and a moving fitting's
 *    returned transform mutation leave source bytes and fresh replay intact.
 *
 * The cradle is the declared tip-carried approximation, not a reconstructed
 * hanging sling or a new independent sling/rope/structural-strength
 * simulation.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines both kinds, four seeds, complete endpoint/stationary support domains, literal SI source figures, actual primitive joins/controls, section design, actual-solid mass distribution and the separate unchanged reduced launch law with its sling/strength limits.
 * @evidence contracts/development/testing.md#behavioral-verification Calls real createSiegeEngine, articulate, span and throwAt, then reads actual rods/boxes and contacts. A marker-only axle, missing physical pouch/pin/winch, detached span end, wrong pivot/axis, stretched beam, tilted counterweight or modified launch/source is a failed positive case.
 * @evidence contracts/development/testing.md#independent-expectations Saimre's arms 5.85/1.2 m and axle 3.15 m, Tarver's 16-ft six-to-one beam and 12-ft uprights, and Tarver p.155's 5/8-inch rope are literal references. Original post/base and pin/crank stock remains .25/.3 and .1/.3/.6 m; the release trestle fits below its actual supported crosshead. A supported slider requires actual bed/side contact throughout its existing 0.3 m travel and an open centre for its descending drawbar. The moving cradle's top-front corner gives radius <=(H-L*sin32)/(2*cos32+sin32) for the trebuchet, independently of production clearance. Raw actual solid volume, textbook rotated tensors and parallel-axis terms give the complete composite centre/inertia with no excluded fitting. Actual complete-solid lowest Y must be nonnegative at every analytically derived endpoint/stationary pose; no production clearance, mass or fitting helper supplies expectations.
 * @evidence contracts/development/testing.md#distinguishing-cases Crosses counterweight and traction construction, multiple valid seeds and arm endpoints/interior states; distinguishes a moving counterweight axle from its plumb box, real rod endpoints from contact origins, pin extraction from fixed guides and current geometry from untouched source/replay. Existing siege units retain detailed bands, pendulum monotonicity and projectile range/seed checks.
 * @evidence contracts/development/testing.md#execution-ownership One discoverable synchronous portable unit owns eight actual engines and bounded in-memory poses/tracks. No renderer, host, compiler, wall-clock assertion, registry mutation or foreign-method replacement is installed.
 */
export function test_archetype_siege_structure(): void {
  const findings: string[] = [];
  for (const kind of ["trebuchet", "mangonel"] as const)
    for (const seed of [0, 3, 7, 12]) {
      const label: string = `${kind}/${seed}`;
      try {
        const engine: Engine = AutoMovieArchetypeSiegeEngine.create({ kind }, seed);
        const original: string = JSON.stringify(engine);
        const d: Engine["dimensions"] = engine.dimensions;
        const long: number =
          kind === "trebuchet" ? 5.85 : (16 * 0.3048 * 6) / 7;
        const short: number = kind === "trebuchet" ? 1.2 : (16 * 0.3048) / 7;
        const height: number = kind === "trebuchet" ? 3.15 : 12 * 0.3048;
        near(`${label} primary long arm`, d.armLength!, long);
        near(`${label} primary short arm`, d.shortArm!, short);
        near(`${label} primary axle height`, d.axleHeight!, height);
        near(`${label} original total mass`, engine.body.mass, d.mass!);
        siegeStructureMass(engine, label, findings);
        siegeStructureFloor(engine, label, findings);
        const radius: number = rod(engine, "arm").radius;
        const edge: number = (32 * Math.PI) / 180;
        const expectedRadius: number =
          kind === "trebuchet"
            ? Math.min(
                0.15,
                (height - long * Math.sin(edge)) /
                  (2 * Math.cos(edge) + Math.sin(edge)),
              )
            : 0.15;
        near(
          `${label} complete cradle-corner section bound`,
          radius,
          expectedRadius,
        );
        const snapshots: Map<number, string> = new Map();
        const angles: readonly number[] = [
          -d.cocked!,
          0,
          90,
          d.release!,
          d.reach!,
        ];
        for (const angle of angles) {
          const posed: Engine = engine.articulate({ arm: angle });
          snapshots.set(angle, JSON.stringify(posed));
          truth(
            `${label}/${angle} complete model admitted`,
            AutoMovieEngineValidation.validateModel({ model: posed }).success,
          );
          const radians: number = (angle * Math.PI) / 180;
          const pivot: IAutoMovieVector3 = { x: 0, y: height, z: 0 };
          const tip: IAutoMovieVector3 = {
            x: 0,
            y: height + long * Math.sin(radians),
            z: long * Math.cos(radians),
          };
          const butt: IAutoMovieVector3 = {
            x: 0,
            y: height - short * Math.sin(radians),
            z: -short * Math.cos(radians),
          };
          const socket: IAutoMovieVector3 = {
            x: 0,
            y: tip.y + radius * Math.cos(radians),
            z: tip.z - radius * Math.sin(radians),
          };
          const beam: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
            posed,
            "arm",
          );
          point(`${label}/${angle} actual arm short endpoint`, beam[0], butt);
          point(`${label}/${angle} actual arm long endpoint`, beam[1], tip);
          near(
            `${label}/${angle} unchanged actual beam distance`,
            distance(beam[0], beam[1]),
            long + short,
          );
          const shaft: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
            posed,
            "axle",
          );
          point(
            `${label}/${angle} actual shaft pivot`,
            AutoMovieEngineVector3.scale(AutoMovieEngineVector3.add(shaft[0], shaft[1]), 0.5),
            pivot,
          );
          near(
            `${label}/${angle} shaft spans both outer post faces`,
            distance(shaft[0], shaft[1]),
            d.frameWidth! + 0.25,
          );
          for (const [side, sign] of [
            ["left", 1],
            ["right", -1],
          ] as const) {
            const post: IAutoMovieModelPart = part(posed, `post-${side}`);
            if (
              post.geometry.type !== "primitive" ||
              post.geometry.shape.type !== "box"
            )
              throw new Error("Actual posts must remain boxes");
            near(
              `${label}/${angle}/${side} post supports true pivot height`,
              post.transform!.translation.y + post.geometry.shape.height / 2,
              height,
            );
            near(
              `${label}/${angle}/${side} shaft meets actual outer post face`,
              sign * shaft[side === "left" ? 1 : 0].x,
              sign * post.transform!.translation.x +
                post.geometry.shape.width / 2,
            );
            const sling: readonly [IAutoMovieVector3, IAutoMovieVector3] = ends(
              posed,
              `sling-${side}`,
            );
            point(
              `${label}/${angle}/${side} actual sling on arm rim`,
              sling[0],
              { ...tip, x: sign * radius },
            );
            point(
              `${label}/${angle}/${side} actual sling on cradle rim`,
              sling[1],
              { ...socket, x: sign * radius },
            );
            near(
              `${label}/${angle}/${side} fixed folded sling length`,
              distance(sling[0], sling[1]),
              radius,
            );
            near(
              `${label}/${angle}/${side} Tarver actual rope radius`,
              rod(posed, `sling-${side}`).radius,
              ((5 / 8) * 0.0254) / 2,
            );
            const wall: IAutoMovieModelPart = part(posed, `pouch-${side}`);
            if (
              wall.geometry.type !== "primitive" ||
              wall.geometry.shape.type !== "box"
            )
              throw new Error("Actual cradle wall must remain a box");
            const bottom: IAutoMovieVector3 = AutoMovieEngineVector3.add(
              wall.transform!.translation,
              AutoMovieEngineQuaternion.rotateVector(wall.transform!.rotation, {
                x: 0,
                y: -wall.geometry.shape.height / 2,
                z: 0,
              }),
            );
            point(
              `${label}/${angle}/${side} wall joins physical floor`,
              bottom,
              {
                ...socket,
                x: (sign * (2 * radius - wall.geometry.shape.width)) / 2,
              },
            );
          }
          point(
            `${label}/${angle} socket follows actual section`,
            posed.affordance("pouch").frame.translation,
            socket,
          );
          const floor: IAutoMovieModelPart = part(posed, "pouch");
          if (
            floor.geometry.type !== "primitive" ||
            floor.geometry.shape.type !== "box"
          )
            throw new Error("Actual cradle floor must remain a box");
          const top: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            floor.transform!.translation,
            AutoMovieEngineQuaternion.rotateVector(floor.transform!.rotation, {
              x: 0,
              y: floor.geometry.shape.height / 2,
              z: 0,
            }),
          );
          point(
            `${label}/${angle} socket meets physical inner floor`,
            top,
            socket,
          );
          const back: IAutoMovieModelPart = part(posed, "pouch-back");
          if (
            back.geometry.type !== "primitive" ||
            back.geometry.shape.type !== "box"
          )
            throw new Error("Actual cradle back must remain a box");
          const backBottom: IAutoMovieVector3 = AutoMovieEngineVector3.add(
            back.transform!.translation,
            AutoMovieEngineQuaternion.rotateVector(back.transform!.rotation, {
              x: 0,
              y: -back.geometry.shape.height / 2,
              z: 0,
            }),
          );
          const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
            floor.transform!.rotation,
            { x: 0, y: 1, z: 0 },
          );
          near(
            `${label}/${angle} actual back joins floor plane`,
            AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(backBottom, socket), normal),
            0,
          );
          truth(
            `${label}/${angle} actual cradle has a positive open interior`,
            back.geometry.shape.width > 0 &&
              back.geometry.shape.width < floor.geometry.shape.width,
          );
          if (kind === "trebuchet") {
            const box: IAutoMovieModelPart = part(posed, "counterweight");
            point(
              `${label}/${angle} real counterweight pin follows short endpoint`,
              AutoMovieEngineVector3.scale(
                AutoMovieEngineVector3.add(...ends(posed, "counterweight-axle")),
                0.5,
              ),
              butt,
            );
            point(
              `${label}/${angle} plumb box remains on actual pin`,
              AutoMovieEngineVector3.add(box.transform!.translation, { x: 0, y: 0.5, z: 0 }),
              butt,
            );
            point(
              `${label}/${angle} actual box stays plumb`,
              AutoMovieEngineQuaternion.rotateVector(box.transform!.rotation, {
                x: 0,
                y: 1,
                z: 0,
              }),
              { x: 0, y: 1, z: 0 },
            );
          }
          siegeStructureControls(
            engine,
            posed,
            angle,
            `${label}/${angle}`,
            findings,
          );
          for (const actual of posed.parts)
            rigid(actual.transform!, `${label}/${angle}/${actual.id}`);
        }
        for (const angle of [...angles].reverse())
          truth(
            `${label}/${angle} unordered replay`,
            JSON.stringify(engine.articulate({ arm: angle })) ===
              snapshots.get(angle),
          );
        const shot: AutoMovieArchetypeSiegeEngine.IThrow = AutoMovieArchetypeSiegeEngine.throwAt(
          engine,
          0.5,
        );
        const launchAngle: number = (d.release! * Math.PI) / 180;
        const rate: number = ((shot.track.launch!.rate * Math.PI) / 180) * long;
        point(`${label} unchanged launch velocity`, shot.velocity, {
          x: 0,
          y: rate * Math.cos(launchAngle),
          z: -rate * Math.sin(launchAngle),
        });
        point(
          `${label} launch on actual cradle`,
          shot.origin,
          engine.articulate({ arm: d.release! }).affordance("pouch").frame
            .translation,
        );
        refusal(`${label} pin past original range`, (): unknown =>
          engine.articulate({ pin: 0.3 + 1e-6 }),
        );
        refusal(`${label} arm past original range`, (): unknown =>
          engine.articulate({ arm: d.reach! + 1e-6 }),
        );
        const state: ReturnType<Engine["span"]> = engine.span("sling-left");
        const stateBytes: string = JSON.stringify(state);
        state.from.x += 100;
        state.length += 100;
        truth(
          `${label} returned span state cannot rewrite source`,
          JSON.stringify(engine.span("sling-left")) === stateBytes,
        );
        const mutable: Engine = engine.articulate({ arm: 30 });
        const replay: string = JSON.stringify(mutable);
        part(mutable, "pouch").transform!.translation.y += 100;
        truth(
          `${label} moving fitting output cannot rewrite replay`,
          JSON.stringify(engine.articulate({ arm: 30 })) === replay,
        );
        truth(
          `${label} complete source bytes remain unchanged`,
          JSON.stringify(engine) === original,
        );
      } catch (error) {
        findings.push(
          `${label}: required actual structure failed: ${String(error)}`,
        );
      }
    }
  TestValidator.equals(
    "actual siege structure, controls and preserved launcher",
    findings,
    [],
  );

  /** Actual bar endpoints are read from the placed primitive, never span state. */
  function ends(
    engine: Engine,
    id: string,
  ): readonly [IAutoMovieVector3, IAutoMovieVector3] {
    return archetypeSpanObservation.ends(part(engine, id));
  }

  /**
   * Missing actual geometry is a failed scenario rather than an affordance
   * substitute.
   */
  function part(engine: Engine, id: string): IAutoMovieModelPart {
    const value: IAutoMovieModelPart | undefined = engine.parts.find(
      (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
    );
    if (value === undefined) throw new Error(`Missing actual part ${id}`);
    return value;
  }

  /** Read actual positive circular dimensions used by the rod observations. */
  function rod(engine: Engine, id: string): { radius: number; height: number } {
    const value: IAutoMovieModelPart = part(engine, id);
    if (
      value.geometry.type !== "primitive" ||
      value.geometry.shape.type !== "cylinder"
    )
      throw new Error(`Actual ${id} must be a cylinder`);
    return value.geometry.shape;
  }

  /**
   * Euclidean distances are independent of declared span length and launcher
   * laws.
   */
  function distance(a: IAutoMovieVector3, b: IAutoMovieVector3): number {
    return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  }

  /** Every actual emitted fitting must retain a unit rigid frame. */
  function rigid(value: IAutoMovieTransform, label: string): void {
    for (const axis of ["x", "y", "z"] as const) {
      near(`${label} unit scale ${axis}`, value.scale[axis], 1);
    }
    near(
      `${label} unit quaternion`,
      Math.hypot(
        value.rotation.x,
        value.rotation.y,
        value.rotation.z,
        value.rotation.w,
      ),
      1,
    );
  }

  /**
   * Compare independent three-component SI observations at absolute precision
   * 1e-9.
   */
  function point(
    label: string,
    actual: IAutoMovieVector3,
    expected: IAutoMovieVector3,
  ): void {
    for (const axis of ["x", "y", "z"] as const)
      near(`${label}.${axis}`, actual[axis], expected[axis]);
  }

  /** Existing numeric assertion seam; nonfinite values fail. */
  function near(label: string, actual: number, expected: number): void {
    truth(
      `${label}: ${actual} expected ${expected}`,
      nclose(actual, expected, 1e-9),
    );
  }

  /** Travel outside the unchanged public range must give its structured refusal. */
  function refusal(label: string, request: () => unknown): void {
    let error: unknown;
    try {
      request();
    } catch (caught) {
      error = caught;
    }
    truth(label, error instanceof AutoMovieArchetypeRefusal);
  }

  /** Preserve all independent physical findings for the complete cause round. */
  function truth(label: string, condition: boolean): void {
    try {
      TestValidator.predicate(label, condition);
    } catch (error) {
      findings.push(String(error));
    }
  }
}
