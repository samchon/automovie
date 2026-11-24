import {
  type AutoMovieArchetype,
  createTable,
  createTool,
  createTray,
  createVessel,
} from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  physicalShapeSpan,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanProp,
  IAutoMoviePhysicalShape,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanObject } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { householdFilm } from "../../../../features/internal/householdFilm";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { motionHumanLaw } from "../../../../features/internal/motionHumanLaw";

/** Bound for a rigid grasp or a resting object's anchored position, metres. */
const GRIP: number = 0.001;

/** Working surface and fit allowance, metres. */
const CONTACT: number = 0.01;

/** The height of the counter top, metres. */
const TOP: number = 0.914;

/** The world frame's vertical unit vector. */
const UP: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };

/** The quarter turn that lies a +Y spoon along +Z. */
const SPOON_REST: IAutoMovieRigidTransform["rotation"] =
  Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90);

/**
 * A kitchen spoon keeps its own scene identity through a complete prepare
 * and clean-up performance on the public chain.
 *
 * Scenarios, on the canonical average man and small woman:
 * 1. Take the spoon from the counter; every stir contact puts its bowl inside
 *    the modeled saucepan, between its floor and rim.
 * 2. The spoon keeps its wrist-local offset from grip closure to placement.
 * 3. It rests at the cleanup tray's home on the tray floor at release and at
 *    the last beat.
 * 4. The free left palm wipes at the counter top's height.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the workflow, its four observable phases and the bodies.
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the whole public chain and measures the displayed spoon frame, hand bones and palm socket at each phase; a bowl outside the pan, a slipping grip, a misplaced rest or a palm off the counter fails.
 * @evidence contracts/development/testing.md#independent-expectations The modeled pan inside width, floor and rim, the tray floor, the authored home and the counter height give the expected positions; the 1 mm rigid and 10 mm working bounds are the campaign's.
 * @evidence contracts/development/testing.md#distinguishing-cases Holding, working and released phases are checked separately on two body sizes; the laundry and floor workflows own their own specifications.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance on canonical bodies through the public chain, without a capture host.
 */
export function test_motion_household_kitchen(): void {
  const failures: string[] = [];
  for (const fit of ["m-average", "f-small"] as const) {
    try {
      kitchen(motionHumanBody(fit), failures);
    } catch (error: unknown) {
      failures.push(
        `${fit} kitchen: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
  TestValidator.equals("complete kitchen workflow", failures, []);
}

/** Read the spoon, saucepan, tray and actual palm in the complete kitchen take. */
function kitchen(body: IAutoMovieMotionHumanBody, failures: string[]): void {
  const counter: AutoMovieArchetype<
    createTable.Affordance,
    createTable.Dimension
  > = createTable({ kind: "counter", height: TOP });
  const pan: AutoMovieArchetype<
    createVessel.Affordance,
    createVessel.Dimension
  > = createVessel({ kind: "saucepan" });
  const spoon: AutoMovieArchetype<createTool.Affordance, createTool.Dimension> =
    createTool({ kind: "spoon", gripDiameter: 0.01, length: 0.15 });
  const tray: AutoMovieArchetype<createTray.Affordance, createTray.Dimension> =
    createTray({ kind: "tray" });
  const panAt: IAutoMovieVector3 = { x: 0.02, y: TOP, z: 0.39 };
  const trayAt: IAutoMovieVector3 = { x: -0.31, y: TOP, z: 0.42 };
  const fit: number = spoon.affordance("grip").aperture! / 2;
  const home: IAutoMovieVector3 = {
    ...trayAt,
    y: TOP + tray.site("inside").translation.y + fit,
    z: trayAt.z - spoon.dimensions.length! / 2,
  };
  const stageProps: IAutoMovieMotionHumanProp[] = [
    householdFilm.fixed("counter", counter, { x: 0, y: 0, z: 0.6 }, 180),
    householdFilm.fixed("pan", pan, panAt),
    householdFilm.fixed("tray", tray, trayAt),
    HumanObject.prop("spoon", spoon, {
      position: { x: -0.18, y: TOP + fit, z: 0.27 },
      rotation: SPOON_REST,
    }),
  ];
  const film: motionHumanLaw.IFilm = householdFilm.stage(
    body,
    HumanChain.subject("a")
      .pickUp({
        prop: "spoon",
        handle: "grip",
        use: { tip: "face", line: "square" },
      })
      .useTool({
        tool: "stir",
        prop: "spoon",
        on: { kind: "prop", subject: "pan", point: "inside" },
        count: 2,
      })
      .putDown({ prop: "spoon", to: home, yaw: 0 })
      .wipe({
        hand: "left",
        on: { kind: "point", at: { x: 0.28, y: TOP, z: 0.35 }, frame: "world" },
        count: 1,
      })
      .stand({ hold: 0.3 }),
    stageProps,
  );
  const stir: householdFilm.EventTimes = householdFilm.events(film, "useTool");
  const inside: number = pan.affordance("inside").width! / 2;
  const bottom: number = panAt.y + pan.site("inside").translation.y;
  const rim: number = panAt.y + pan.site("rim").translation.y;
  for (const [event, t] of Object.entries(stir)) {
    if (!event.startsWith("contact")) continue;
    const tip: IAutoMovieVector3 = householdFilm.point(
      film.performance.prop("spoon", t),
      spoon.site("face").translation,
    );
    const radial: number = Math.hypot(tip.x - panAt.x, tip.z - panAt.z);
    householdFilm.near(
      failures,
      "spoon bowl inside the actual pan",
      Math.max(radial - inside, bottom - tip.y, tip.y - rim),
      0,
    );
  }
  const pick: householdFilm.EventTimes = householdFilm.events(film, "pickUp");
  const place: householdFilm.EventTimes = householdFilm.events(film, "putDown");
  householdFilm.keep(
    film,
    "spoon",
    pick.gripClosed!,
    place.placed! - 1e-5,
    GRIP,
    failures,
  );
  for (const t of [place.release!, film.duration]) {
    const rest: IAutoMovieRigidTransform = film.performance.prop("spoon", t);
    householdFilm.near(
      failures,
      "spoon at the cleanup tray",
      Vector3.distance(rest.position, home),
      GRIP,
    );
    const y: number = Math.min(
      ...spoon
        .shapes()
        .map(
          (item: IAutoMoviePhysicalShape): number =>
            physicalShapeSpan(rest, item, UP)[0],
        ),
    );
    householdFilm.near(
      failures,
      "spoon bottom rests on the cleaning tray",
      Math.abs(y - (TOP + tray.site("inside").translation.y)),
      GRIP,
    );
  }
  const wipe: householdFilm.EventTimes = householdFilm.events(film, "wipe");
  const t: number = (wipe.strokeStart! + wipe.strokeEnd!) / 2;
  const socket: IAutoMovieHumanoidSurfaces.IFrame =
    body.surfaces.sockets.palmLeft;
  const palm: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    socket,
    film.bones("a", t).get(socket.bone)!,
  ).point;
  householdFilm.near(
    failures,
    "cleanup palm at the counter",
    Math.abs(palm.y - TOP),
    CONTACT,
  );
}
