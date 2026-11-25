import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  createLongGun,
  createStageBayonet,
  createStageCasing,
  createStageMatchlock,
  createStagePercussionRifle,
} from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
  IAutoMovieTransform,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanPrehension,
  HumanChain,
  HumanObject,
  HumanPerformance,
  AutoMovieMotionHumanDress,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { motionHumanBody } from "../../internal/motionHumanBody";
import { nclose } from "../../internal/nclose";

const { putDownAperture } = AutoMovieMotionHumanPrehension;

/** The two laws the bayonet take installs, by name. */
interface IFixLaws {
  /** Return the bayonet through the musket's entry onto its seat. */
  putDownAperture: typeof putDownAperture;

  /** Take the bayonet off the musket's seat. */
  takeFromCarrier: typeof AutoMovieMotionHumanDress.HumanCarrierCustody;
}

/** One museum silhouette and the figures its record reads. */
interface IRecord {
  /** The silhouette under test. */
  model: AutoMovieArchetype;

  /** The record's overall length, metres. */
  overall: number;

  /** The record's barrel length, metres. */
  barrel: number;
}

/** Rigid attachment allowance, metres: the 1 mm mount bound. */
const RIGID: number = 0.001;

/** Rigid attachment allowance, radians: one degree. */
const TURN: number = Math.PI / 180;

/** The upright musket's attitude: its bore, the model's `+Z`, turned to the world's `+Y`. */
const UPRIGHT: IAutoMovieRigidTransform["rotation"] = {
  x: -Math.SQRT1_2,
  y: 0,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * Period silhouettes match their museum records, accessories fit their
 * declared contacts, and a socket bayonet comes off and goes back on a musket
 * in a public take.
 *
 * Scenarios:
 * 1. The matchlock and percussion rifle measure the DIA and Met records'
 *    overall and barrel lengths, the rifle weighs the Met's 3657.1 g, and each
 *    carries only its own lock's parts.
 * 2. A musket's `bayonetEntry` shares its `bayonet` seat's attitude
 *    farther out along the bore than the socket is long; no other long gun has
 *    either. The bayonet's bore clears the barrel by less than 1 mm, and,
 *    seated, its blade runs parallel below the barrel past the muzzle. A
 *    carbine is refused.
 * 3. A spent .30-06 casing measures the read case length and rim diameter.
 * 4. On an upright fixed musket, the bayonet starts seated, is lifted off
 *    along the bore past the muzzle, held, and returned through the entry to
 *    the seat, in that order, keeping one frame in the hand while held.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the records compared, the accessory frames, the casing figures and the take's custody steps.
 * @evidence contracts/development/testing.md#behavioral-verification Measures generated colliders and contact frames, and runs the public custody and aperture laws through HumanPerformance, reading the displayed prop and hand frames.
 * @evidence contracts/development/testing.md#independent-expectations Lengths and the mass come from the DIA 53.220 and Met 1974.10 records and the .30-06 case figures, written here independently of the producers. The 1 mm and 1 degree bounds are the rigid mount bounds of the carrier custody test.
 * @evidence contracts/development/testing.md#distinguishing-cases Two period silhouettes against each other, the musket against the other long guns, a refused carbine, and the bayonet before, during and after its detach and refit.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on the scenario runner with a prepared polygon body and the public producers, laws and performance readers.
 */
export function test_archetype_stage_firearm_attachments(): void {
  for (const record of [
    { model: createStageMatchlock(), overall: 1.14, barrel: 0.811 },
    { model: createStagePercussionRifle(), overall: 1.102, barrel: 0.702 },
  ] satisfies IRecord[]) {
    const length: ReturnType<typeof archetypeExtent> = archetypeExtent(
      record.model,
      "z",
    );
    const barrel: ReturnType<typeof archetypeExtent> = archetypeExtent(
      record.model,
      "z",
      ["barrel"],
    );
    TestValidator.predicate(
      `${record.model.name} measures its record's overall and barrel lengths`,
      nclose(length.low, 0, 1e-9) &&
        nclose(length.high, record.overall, 1e-9) &&
        nclose(barrel.size, record.barrel, 1e-9),
    );
  }
  const matchlock: ReturnType<typeof createStageMatchlock> =
    createStageMatchlock();
  const rifle: ReturnType<typeof createStagePercussionRifle> =
    createStagePercussionRifle();
  const parts: (model: AutoMovieArchetype) => string[] = (
    model: AutoMovieArchetype,
  ): string[] =>
    model.parts.map(
      (part: AutoMovieArchetype["parts"][number]): string => part.id,
    );
  TestValidator.predicate(
    "each silhouette carries only its own lock",
    ["serpentine", "match", "pan"].every((id: string): boolean =>
      parts(matchlock).includes(id),
    ) &&
      !parts(matchlock).includes("hammer") &&
      ["hammer", "nipple"].every((id: string): boolean =>
        parts(rifle).includes(id),
      ) &&
      !parts(rifle).includes("serpentine") &&
      nclose(rifle.properties.mass, 3.6571, 1e-9),
  );

  const musket: ReturnType<typeof createLongGun> = createLongGun({
    kind: "musket",
    id: "musket",
  });
  const seat: IAutoMovieTransform = musket.affordance("bayonet").frame;
  const entry: IAutoMovieTransform = musket.affordance("bayonetEntry").frame;
  const bayonet: ReturnType<typeof createStageBayonet> = createStageBayonet({
    gun: musket,
    id: "bayonet",
  });
  const ahead: number = Vector3.dot(
    Vector3.subtract(entry.translation, seat.translation),
    AutoMovieArchetypeFrame.axis(seat, "y"),
  );
  TestValidator.predicate(
    "the musket's entry shares the seat's attitude farther out along the bore than a socket",
    Quaternion.angle(seat.rotation, entry.rotation) <= 1e-9 &&
      nclose(
        Vector3.distance(
          Vector3.add(
            seat.translation,
            Vector3.scale(AutoMovieArchetypeFrame.axis(seat, "y"), ahead),
          ),
          entry.translation,
        ),
        0,
        1e-9,
      ) &&
      ahead > bayonet.dimensions.socket! &&
      createLongGun.KINDS.filter(
        (kind: createLongGun.Kind): boolean =>
          kind !== "musket" &&
          createLongGun({ kind }).affordances.some(
            (contact: AutoMovieArchetype["affordances"][number]): boolean =>
              contact.id === "bayonet" || contact.id === "bayonetEntry",
          ),
      ).length === 0,
  );
  const radius: number = archetypeExtent(musket, "x", ["barrel"]).high;
  const bore: number = bayonet.dimensions.bore! / 2;
  const seated: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    seat,
    invert(bayonet.affordance("socket").frame),
  );
  const tip: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
    seated,
    bayonet.affordance("tip").frame,
  );
  TestValidator.predicate(
    "the seated bayonet clears the barrel and hangs its blade below and past the muzzle",
    bore > radius &&
      bore - radius < 0.001 &&
      Quaternion.angle(seated.rotation, seat.rotation) <= 1e-9 &&
      tip.translation.y < 0 &&
      tip.translation.z > seat.translation.z,
  );
  refused("a carbine has no bayonet socket", () =>
    createStageBayonet({ gun: createLongGun({ kind: "carbine" }) }),
  );
  refused("the bayonet needs its own id", () =>
    createStageBayonet({ gun: musket, id: "musket" }),
  );

  const casing: ReturnType<typeof createStageCasing> = createStageCasing();
  TestValidator.predicate(
    "the casing measures the .30-06 case length and rim",
    nclose(archetypeExtent(casing, "y").size, 0.0633, 1e-9) &&
      nclose(archetypeExtent(casing, "x").size, 0.01204, 1e-9),
  );

  fixTake(musket, bayonet);
}

/** Lift the seated bayonet off an upright musket, hold it, and return it. */
function fixTake(
  musket: ReturnType<typeof createLongGun>,
  bayonet: ReturnType<typeof createStageBayonet>,
): void {
  const socket: IAutoMovieTransform = bayonet.affordance("socket").frame;
  const offset: IAutoMovieTransform = invert(socket);
  const gun: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop("musket", musket, {
      at: { x: -0.15, y: 0, z: 0.38 },
      yaw: 0,
      fixed: true,
    }),
  };
  const props: IAutoMovieMotionHumanProp[] = [
    { ...gun, frame: { ...gun.frame, rotation: UPRIGHT } },
    {
      ...HumanObject.prop("bayonet", bayonet, {
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
      }),
      mounted: {
        prop: "musket",
        point: "bayonet",
        offset: { position: offset.translation, rotation: offset.rotation },
      },
    },
  ];
  const laws: IAutoMovieMotionHumanChain.IExtension<IFixLaws> =
    HumanChain.extend({
      putDownAperture,
      takeFromCarrier: AutoMovieMotionHumanDress.HumanCarrierCustody,
    });
  const chain: IAutoMovieMotionHumanChain = laws
    .subject("drill")
    .takeFromCarrier({ prop: "bayonet", handle: "handle", lift: 0.18 })
    .stand({ hold: 0.5, sway: 0 })
    .putDownAperture({
      prop: "bayonet",
      onto: {
        prop: "musket",
        aperture: "bayonetEntry",
        point: "bayonet",
        via: "socket",
      },
    });
  const performance: HumanPerformance = new HumanPerformance({
    seed: "stage-bayonet-fix",
    props,
    laws: [putDownAperture, AutoMovieMotionHumanDress.HumanCarrierCustody],
    performers: [
      {
        subject: "drill",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: chain.node,
  });

  const seatAt: (time: number) => IAutoMovieRigidTransform = (
    time: number,
  ): IAutoMovieRigidTransform =>
    place(performance.prop("musket", time), musket.affordance("bayonet").frame);
  const socketAt: (time: number) => IAutoMovieRigidTransform = (
    time: number,
  ): IAutoMovieRigidTransform =>
    place(performance.prop("bayonet", time), socket);
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("drill");
  const [take, hold, fix] = segments;
  if (take === undefined || hold === undefined || fix === undefined)
    throw new Error("The bayonet take needs its three segments");
  const end: number = performance.duration;
  const mated: (time: number) => boolean = (time: number): boolean =>
    Vector3.distance(seatAt(time).position, socketAt(time).position) <= RIGID &&
    Quaternion.angle(seatAt(time).rotation, socketAt(time).rotation) <= TURN;
  TestValidator.predicate(
    "the bayonet starts seated and ends seated again on the musket",
    mated(0) && mated(end),
  );

  // While held, the socket's back end is past the muzzle on the bore's line,
  // and the hand keeps one frame on the handle.
  const times: number[] = [0, 0.5, 1].map(
    (u: number): number => hold.start + u * (hold.end - hold.start),
  );
  const clear: boolean = times.every((time: number): boolean => {
    const along: number = inFrame(seatAt(time), socketAt(time)).position.y;
    return along >= bayonet.dimensions.socket!;
  });
  const handle: IAutoMovieRigidTransform[] = times.map(
    (time: number): IAutoMovieRigidTransform => {
      const bone: NonNullable<
        ReturnType<ReturnType<HumanPerformance["bones"]>["get"]>
      > = performance.bones("drill", time).get("rightHand")!;
      return inFrame(
        { position: bone.worldPosition, rotation: bone.worldRotation },
        place(
          performance.prop("bayonet", time),
          bayonet.affordance("handle").frame,
        ),
      );
    },
  );
  TestValidator.predicate(
    "the held bayonet clears the muzzle and rides the hand",
    clear &&
      handle.every(
        (frame: IAutoMovieRigidTransform): boolean =>
          Vector3.distance(frame.position, handle[0]!.position) <= RIGID &&
          Quaternion.angle(frame.rotation, handle[0]!.rotation) <= TURN,
      ),
  );
  TestValidator.predicate(
    "the take detaches, holds and refits in order",
    take.end <= hold.start && hold.end <= fix.start && fix.end <= end,
  );
}

/** Require a named producer admission failure on the gun. */
function refused(label: string, build: () => unknown): void {
  let error: unknown;
  try {
    build();
  } catch (caught: unknown) {
    error = caught;
  }
  TestValidator.predicate(
    label,
    error instanceof AutoMovieArchetypeRefusal && error.axis === "gun",
  );
}

/** The inverse of a unit-scale model frame. */
function invert(frame: IAutoMovieTransform): IAutoMovieTransform {
  const rotation: IAutoMovieTransform["rotation"] = Quaternion.inverse(
    frame.rotation,
  );
  return {
    translation: Quaternion.rotateVector(
      rotation,
      Vector3.scale(frame.translation, -1),
    ),
    rotation,
    scale: { x: 1, y: 1, z: 1 },
  };
}

/** A model-local frame carried by a displayed prop frame into the world. */
function place(
  frame: IAutoMovieRigidTransform,
  local: IAutoMovieTransform,
): IAutoMovieRigidTransform {
  return {
    position: Vector3.add(
      frame.position,
      Quaternion.rotateVector(frame.rotation, local.translation),
    ),
    rotation: Quaternion.multiply(frame.rotation, local.rotation),
  };
}

/** Express a world frame in another world frame. */
function inFrame(
  parent: IAutoMovieRigidTransform,
  child: IAutoMovieRigidTransform,
): IAutoMovieRigidTransform {
  const inverse: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
    parent.rotation,
  );
  return {
    position: Quaternion.rotateVector(
      inverse,
      Vector3.subtract(child.position, parent.position),
    ),
    rotation: Quaternion.multiply(inverse, child.rotation),
  };
}
