import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanCarried,
  HumanCarriedCoupling,
  HumanCarriedCouplingPose,
  HumanChain,
  HumanCoupled,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The helpers' compositions of #3440 keep their bounds: helping someone up
 * from the floor (`HumanCoupled.helpUp`, a support sequence whose hand
 * grips the helper, #3435) and a walk between two helpers
 * (`HumanCoupled.supportWalk`, one coupled meeting of three roles, #3437).
 *
 * Bounds: a contact within 10 mm (#3349's contact bound); the helped body
 * standing at the end when its head lies more than 0.3 of its stature above
 * its hips (`test_human_motion_carried_carries`'s standing test); the
 * release of the grip only after the feet bear, the support rule (Escande,
 * Kheddar and Miossec 2013, as `support` cites).
 *
 * Scenarios, over the pairs (m-large, f-small), (f-small, m-large) and
 * (m-average, m-average), the first named helping:
 * 1. `helpUp`, the helped person lying first and the helper standing a
 *    foot's length beyond the helped right wrist, facing it (`helperStand`): the helped hand's grip on the
 *    helper opens and closes within the rise, the feet bear to its end, the
 *    palms meet within 10 mm at the grip's middle, and the helped body ends
 *    standing.
 * 2. `supportWalk`, two average men helping the small woman and two small
 *    women helping the large man, the second helper standing where the
 *    coupling's frame puts it (`secondAt`): each helper bears a positive share
 *    summing to one, and every bearing contact lies within 10 mm of its
 *    helper's region at 20 Hz; or a capacity refusal on `mass` whose
 *    feasible maximum lies below the helped mass.
 * 3. The average man helps the average man up by the left hand. The palms
 *    meet within 10 mm at five samples from closure to release, and the helped
 *    palm slips by at most 10 mm in the helper's displayed palm-bone frame.
 *    Both feet bear on the floor before the grip releases and through the end.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Performs the records through the public chain and reads the displayed bodies and the plans' windows; a grip that never closes or never lets go, a body left on the floor, a helper bearing nothing or a contact off its region fails with its cell and numbers.
 * @evidence contracts/development/testing.md#independent-expectations The 10 mm bounds come from #3349's contact requirement and #3419's grip-slip acceptance; slip is displacement from closure in the partner's frame, distinct from the absolute palm gap. The support rule requires bearing before release.
 * @evidence contracts/development/testing.md#distinguishing-cases Three right-hand help-up pairs, one authored left-hand case at closure, through the hold and at release, and two walks between helpers of opposite builds to the helped.
 * @evidence contracts/development/testing.md#execution-ownership The discoverable in-memory test prepares polygon men and stages the helper from one lying pose. Each left-grip sample reads each body's displayed placement once and uses its palm bone. No viewer or external host runs.
 * @evidence contracts/development/common.md#meaningful-documentation States the three scenarios, world contact and local slip in metres, and the order of support transfer.
 */
export function test_human_motion_coupled_helpers(): void {
  const all: motionComplaints.IGatherer = motionComplaints();
  type Name = "m-large" | "f-small" | "m-average";
  const HELP_UPS: readonly (readonly [Name, Name, "left"?])[] = [
    ["m-large", "f-small"],
    ["f-small", "m-large"],
    ["m-average", "m-average"],
    ["m-average", "m-average", "left"],
  ];
  const SECONDS: number = 2;
  const START: number = 0.3;
  const CONTACT: number = 0.01;
  // 1. Helping someone up from the floor.
  for (const [helperName, helpedName, hand] of HELP_UPS) {
    const cell: string = `helpUp, ${helperName} helping ${helpedName}${hand === undefined ? "" : ` by the ${hand} hand`}`;
    const bodies: Record<"a" | "b", IAutoMovieMotionHumanBody> = {
      a: motionHumanBody(helperName),
      b: motionHumanBody(helpedName),
    };
    let film: IAutoMovieMotionHumanPerformance;
    try {
      const stand: { at: IAutoMovieVector3; yaw: number } = helperStand(
        bodies.b,
        bodies.a,
        hand,
      );
      film = new HumanPerformance({
        seed: "coupled-signature",
        performers: (["a", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at: subject === "a" ? stand.at : { x: 0, y: 0, z: 0 },
          yaw: subject === "a" ? stand.yaw : 0,
          proficiency: { level: "trained" as const },
        })),
        composition: HumanChain.mutual(
          HumanCoupled.helpUp,
          {
            helper: HumanChain.subject("a").stand({ seconds: START }),
            helped: HumanChain.subject("b").lieDown(),
          },
          hand === undefined ? {} : { hand },
        ).node,
      });
      film.segments("b");
    } catch (error) {
      all.check(
        `${cell}: planned expected, refused with ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
      continue;
    }
    const segments = film.segments("b");
    const rise = segments[segments.length - 1]!;
    const grips: IAutoMovieMotionHumanContactWindow[] =
      rise.plan.contacts.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.support.kind === "person" && w.support.subject === "a",
      );
    const feet: IAutoMovieMotionHumanContactWindow[] =
      rise.plan.contacts.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.part.endsWith("Foot"),
      );
    all.check(
      `${cell}: the helped hand grips the helper through the rise and lets go before its end, read ${grips.map((w) => `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ") || "none"} among the rise's windows ${rise.plan.contacts.map((w) => `${w.part} ${w.kind} on ${w.support.kind} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ")}`,
      grips.length > 0 && grips.every((w) => w.from < w.to && w.to < 1),
    );
    all.check(
      `${cell}: the feet bear to the end, read ${feet.map((w) => `${w.part} ${w.from.toFixed(3)}-${w.to.toFixed(3)}`).join(", ")}`,
      feet.some((w) => w.to === 1),
    );
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "b",
      bodies.b,
      0,
    );
    const helper: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      bodies.a,
      0,
    );
    if (hand === "left") {
      checkLeftGrip(all, cell, film, bodies, rise, grips, feet, CONTACT);
    } else
      for (const w of grips) {
        const t: number =
          rise.start + ((w.from + w.to) / 2) * rise.plan.duration;
        const gap: number = Vector3.length(
          Vector3.subtract(
            HumanSignature.region(reader, "palmRight", t),
            HumanSignature.region(helper, "palmRight", t),
          ),
        );
        all.check(
          `${cell}: at the grip's middle the palms are ${(gap * 1000).toFixed(1)} mm apart, ${CONTACT * 1000} mm at most expected`,
          gap <= CONTACT,
        );
      }
    const end: number = rise.start + rise.plan.duration;
    const upright: number =
      HumanSignature.joint(reader, end, "head").y -
      HumanSignature.joint(reader, end, "hips").y;
    all.check(
      `${cell}: at the end the helped head is ${upright.toFixed(3)} m above the hips, more than 0.3 of the stature expected (standing)`,
      upright > 0.3 * bodies.b.measure.stature,
    );
  }

  // 2. A walk between two helpers.
  for (const names of [
    ["m-average", "m-average", "f-small"],
    ["f-small", "f-small", "m-large"],
  ] as const) {
    const cell: string = `supportWalk, ${names[0]} and ${names[1]} helping ${names[2]}`;
    const bodies: Record<"a" | "c" | "b", IAutoMovieMotionHumanBody> = {
      a: motionHumanBody(names[0]),
      c: motionHumanBody(names[1]),
      b: motionHumanBody(names[2]),
    };
    let film: IAutoMovieMotionHumanPerformance;
    try {
      // The first helper at the origin, the second where the coupling puts
      // it, the helped body between them.
      const offset: IAutoMovieVector3 = secondAt(bodies.a, bodies.c, bodies.b);
      film = new HumanPerformance({
        seed: "coupled-signature",
        laws: [HumanCarried.borne, HumanCarried.bearing],
        performers: (["a", "c", "b"] as const).map((subject) => ({
          subject,
          body: bodies[subject],
          at:
            subject === "a"
              ? { x: 0, y: 0, z: 0 }
              : subject === "c"
                ? { x: offset.x, y: 0, z: offset.z }
                : { x: offset.x / 2, y: 0, z: offset.z / 2 },
          yaw: 0,
          proficiency: { level: "trained" as const },
        })),
        composition: HumanChain.mutual(
          HumanCoupled.supportWalk,
          {
            helper: HumanChain.subject("a").stand({ seconds: START }),
            second: HumanChain.subject("c").stand({ seconds: START }),
            helped: HumanChain.subject("b").stand({ seconds: START }),
          },
          { seconds: SECONDS },
        ).node,
      });
      film.segments("b");
    } catch (error) {
      const borne: number = resolveAutoMovieCenterOfMass(
        bodies.b.skeleton,
        bodies.b.profile,
      ).mass;
      all.check(
        `${cell}: planned or a capacity refusal below the borne ${borne.toFixed(1)} kg expected, read ${error instanceof Error ? error.message : String(error)}`,
        error instanceof HumanRefusal &&
          error.kind === "participant" &&
          error.axis === "mass" &&
          error.feasible?.kind === "range" &&
          error.feasible.maximum !== null &&
          error.feasible.maximum < borne,
      );
      continue;
    }
    const coupling: IAutoMovieMotionCoupling = HumanCarriedCoupling.couple(
      bodies.a,
      bodies.b,
      HumanCarried.CARRIES.supported,
      "supported",
      0,
      {
        body: bodies.c,
        row: HumanCarried.CARRIES.supportedLeft,
        carry: "supportedLeft",
      },
    );
    const share = (role: string): number =>
      coupling.contacts
        .filter(
          (c: IAutoMovieMotionCoupling.IContact): boolean => c.on.role === role,
        )
        .reduce(
          (s: number, c: IAutoMovieMotionCoupling.IContact): number =>
            s + c.load,
          0,
        );
    all.check(
      `${cell}: each helper bears a share, read ${share(HumanCarriedCoupling.BEARER).toFixed(3)} and ${share(HumanCarriedCoupling.SECOND).toFixed(3)}, both positive and summing to 1 within 1e-9`,
      share(HumanCarriedCoupling.BEARER) > 0 &&
        share(HumanCarriedCoupling.SECOND) > 0 &&
        Math.abs(
          share(HumanCarriedCoupling.BEARER) +
            share(HumanCarriedCoupling.SECOND) -
            1,
        ) <= 1e-9,
    );
    const readers: Record<
      "a" | "c" | "b",
      IAutoMovieMotionHumanSignature.IReader
    > = {
      a: HumanSignature.of(film, "a", bodies.a, 0),
      c: HumanSignature.of(film, "c", bodies.c, 0),
      b: HumanSignature.of(film, "b", bodies.b, 0),
    };
    for (const t of HumanSignature.times(
      START + HumanCarried.TAKE,
      START + SECONDS,
      20,
    ))
      for (const contact of coupling.contacts.filter(
        (c: IAutoMovieMotionCoupling.IContact): boolean => c.kind === "bear",
      )) {
        const on: IAutoMovieMotionHumanSignature.IReader =
          contact.on.role === HumanCarriedCoupling.SECOND
            ? readers.c
            : readers.a;
        const gap: number = Vector3.length(
          Vector3.subtract(
            HumanSignature.region(readers.b, contact.region, t),
            HumanSignature.region(on, contact.on.region, t),
          ),
        );
        all.check(
          `${cell} at ${t.toFixed(2)} s: the helped ${contact.region} is ${(gap * 1000).toFixed(1)} mm from the ${contact.on.role}'s ${contact.on.region}, ${CONTACT * 1000} mm at most expected`,
          gap <= CONTACT,
        );
      }
  }
  all.assert("the helpers' compositions keep their bounds");
}

/** Check the declared left grip against both displayed hands and its supporting feet. */
function checkLeftGrip(
  all: motionComplaints.IGatherer,
  cell: string,
  film: IAutoMovieMotionHumanPerformance,
  bodies: Readonly<Record<"a" | "b", IAutoMovieMotionHumanBody>>,
  rise: IAutoMovieMotionHumanSegment,
  grips: readonly IAutoMovieMotionHumanContactWindow[],
  feet: readonly IAutoMovieMotionHumanContactWindow[],
  tolerance: number,
): void {
  const target: IAutoMovieHumanoidSurfaces.IFrame =
    bodies.a.surfaces.regions.palmLeft;
  const source: IAutoMovieHumanoidSurfaces.IFrame =
    bodies.b.surfaces.regions.palmLeft;
  for (const grip of grips) {
    all.check(
      `${cell}: the helped left hand grips the helper's left palm`,
      grip.part === "leftHand" &&
        grip.kind === "grip" &&
        grip.support.kind === "person" &&
        "region" in grip.support &&
        grip.support.region === "palmLeft",
    );
    for (const foot of ["leftFoot", "rightFoot"] as const)
      all.check(
        `${cell}: the ${foot} bears on the floor before the left grip releases`,
        feet.some(
          (window: IAutoMovieMotionHumanContactWindow): boolean =>
            window.part === foot &&
            window.kind === "plant" &&
            window.support.kind === "ground" &&
            window.from < grip.to &&
            window.to === 1,
        ),
      );

    // Read five equally spaced instants including the authored closure and
    // release. The local displacement removes the helper's own motion.
    let closure: IAutoMovieVector3 | undefined;
    for (const share of [0, 0.25, 0.5, 0.75, 1]) {
      const seconds: number =
        rise.start +
        (grip.from + share * (grip.to - grip.from)) * rise.plan.duration;
      const helper: IAutoMovieResolvedBone = film
        .bones("a", seconds)
        .get(target.bone)!;
      const helped: IAutoMovieResolvedBone = film
        .bones("b", seconds)
        .get(source.bone)!;
      const difference: IAutoMovieVector3 = Vector3.subtract(
        resolveAutoMovieHumanoidSurfaces.place(source, helped).point,
        resolveAutoMovieHumanoidSurfaces.place(target, helper).point,
      );
      const local: IAutoMovieVector3 = Quaternion.rotateVector(
        Quaternion.inverse(helper.worldRotation),
        difference,
      );
      closure ??= local;
      const gap: number = Vector3.length(difference);
      const slip: number = Vector3.length(Vector3.subtract(local, closure));
      all.check(
        `${cell} at ${seconds.toFixed(3)} s: the left palm gap is ${(gap * 1000).toFixed(1)} mm and slip is ${(slip * 1000).toFixed(1)} mm, both within ${tolerance * 1000} mm expected`,
        gap <= tolerance && slip <= tolerance,
      );
    }
  }
}

/**
 * Where a helper stands to help a person up: the helped body laid down on
 * its own, the selected wrist read where it lies, and the helper a foot's
 * length beyond that wrist, away from the hips, facing it, so the wrist lies
 * under the helper's reach.
 */
function helperStand(
  helped: IAutoMovieMotionHumanBody,
  helper: IAutoMovieMotionHumanBody,
  hand: "left" | "right" = "right",
): { at: IAutoMovieVector3; yaw: number } {
  const lying: IAutoMovieMotionHumanPerformance = new HumanPerformance({
    seed: "helper-stand",
    performers: [
      {
        subject: "b",
        body: helped,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("b").lieDown().node,
  });
  const segments = lying.segments("b");
  const last = segments[segments.length - 1]!;
  const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
    lying,
    "b",
    helped,
    0,
  );
  const end: number = last.start + last.plan.duration;
  const wrist: IAutoMovieVector3 = HumanSignature.joint(
    reader,
    end,
    hand === "left" ? "leftHand" : "rightHand",
  );
  const hips: IAutoMovieVector3 = HumanSignature.joint(reader, end, "hips");
  const out: IAutoMovieVector3 = Vector3.normalize({
    x: wrist.x - hips.x,
    y: 0,
    z: wrist.z - hips.z,
  });
  return {
    at: {
      x: wrist.x + out.x * helper.measure.footLength,
      y: 0,
      z: wrist.z + out.z * helper.measure.footLength,
    },
    yaw: (Math.atan2(-out.x, -out.z) * 180) / Math.PI,
  };
}

/**
 * Where the second helper of a supported walk stands, relative to the first
 * standing still at the origin: the coupling's frame of the second helper's
 * anchor bone, read in the first's anchor bone, less where that bone lies on
 * the second helper standing at the origin.
 */
function secondAt(
  first: IAutoMovieMotionHumanBody,
  second: IAutoMovieMotionHumanBody,
  helped: IAutoMovieMotionHumanBody,
): IAutoMovieVector3 {
  const coupling: IAutoMovieMotionCoupling = HumanCarriedCoupling.couple(
    first,
    helped,
    HumanCarried.CARRIES.supported,
    "supported",
    0,
    {
      body: second,
      row: HumanCarried.CARRIES.supportedLeft,
      carry: "supportedLeft",
    },
  );
  const frame = coupling.bearers![HumanCarriedCoupling.SECOND]!;
  const anchor = HumanCarriedCouplingPose.stood(first, {
    incline: 0,
    depth: 0,
  }).get(coupling.anchor)!;
  const own: IAutoMovieVector3 = HumanCarriedCouplingPose.stood(second, {
    incline: 0,
    depth: 0,
  }).get(frame.anchor)!.worldPosition;
  return Vector3.subtract(
    Vector3.add(
      anchor.worldPosition,
      Quaternion.rotateVector(anchor.worldRotation, frame.position),
    ),
    own,
  );
}
