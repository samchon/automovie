import { createHolster, createSword } from "@automovie/archetypes";
import { Quaternion, Transform, Vector3, cutSequence } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieAffordance,
  IAutoMovieClip,
  IAutoMovieCut,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSheath,
  IAutoMovieMotionHumanStand,
  IAutoMovieMotionHumanWalkParams,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDress,
  AutoMovieMotionHumanPrehension,
  AutoMovieMotionHumanStance,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import {
  HumanHand,
  HumanPropFrame,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

const { putDownAperture } = AutoMovieMotionHumanPrehension;

/** Rigid attachment allowance, metres: the 1 mm mount bound. */
const RIGID: number = 0.001;
/** Rigid attachment attitude allowance, radians. */
const TURN: number = 0.001;
/** Lateral slack of the blade in its carrier, metres: half of Wulflund's 2 cm width allowance over the blade. */
const SLACK: number = 0.01;
/** Aperture placement's seat tolerance, metres. */
const PLACE: number = 0.015;
/** How far the drawn tip clears the mouth, metres: the staged clearance. */
const CLEARANCE: number = 0.03;
/** Film frames per second of the edit. */
const FPS: number = 24;
/** The held beat between draw and return, seconds. */
const HOLD: number = 0.8;

/** One cast with its blade and carrier. */
interface ICast {
  /** The cast's label. */
  name: string;

  /** The performer's polygon man. */
  body: IAutoMovieMotionHumanBody;

  /** The blade's archetype parameters. */
  blade: createSword.IParams;

  /** The carrier's archetype parameters. */
  carrier: createHolster.IParams;

  /** How far the worn carrier's mouth tilts forward from plumb, degrees: the scene's authored hang. */
  cant: number;
}

/** The staged take's props and identities. */
interface IStage {
  /** The carrier, worn, and the blade mounted in it. */
  props: IAutoMovieMotionHumanProp[];

  /** The staged identities. */
  sheath: IAutoMovieMotionHumanSheath.IStaged;

  /** The blade's tip in its own frame, metres. */
  tip: IAutoMovieVector3;

  /** The blade's grip in its own frame, metres. */
  grip: IAutoMovieVector3;
}

/** The chain the two custody laws extend. */
type Chain = IAutoMovieMotionHumanChain;

/** The two casts: a man with an arming sword in a scabbard and a smaller woman with a knife in a sheath. */
const CASTS: readonly ICast[] = [
  {
    name: "arming sword",
    body: motionHumanBody("m-average"),
    blade: { kind: "armingSword", model: "knight" },
    carrier: { kind: "scabbard", blade: "knight" },
    cant: 15,
  },
  {
    name: "knife",
    body: motionHumanBody("f-small"),
    blade: { kind: "knife" },
    carrier: { kind: "sheath", blade: "knife" },
    cant: 0,
  },
];

/**
 * A blade drawn on screen from the carrier worn at the hip, held, returned
 * and carried away seated, with the same prop through every custody.
 *
 * Scenarios:
 * 1. Seated until grip closure, the palm closes on the hilt, the blade leaves
 *    on the carrier's guide inside its lateral slack and its tip clears the
 *    mouth; the hand takes it there and keeps it rigidly through the held
 *    beat.
 * 2. The return meets the entry, rides the guide inside the slack to the
 *    seat and releases, the blade stays seated while the wearer walks, the prop never jumps at a custody event
 *    and forward, reverse and repeated seeks agree.
 * 3. A wide shot trimmed in the held beat cuts to a close-up of the same
 *    prop node, and the edit's prop check passes at the real trim boundary.
 * 4. A cut before grip closure leaves the blade seated; a cut during the
 *    withdrawal keeps the grip with no jump.
 * 6. A longsword, longer than the arm draws alone, leaves its left-hip
 *    scabbard as the left hand turns the scabbard at its throat toward the
 *    right shoulder and the trunk turns: the blade stays on the line, the tip clears the mouth, the
 *    left hand keeps the throat through the draw and the scabbard hangs from
 *    the hips again after it, and the take passes the verdict report.
 * 5. A missing carrier, an unknown mouth and an off-axis tip are refused at
 *    their located axes, a plumb arming sword whose drawing hand cannot
 *    follow its guide is refused on the opening, and one canted far forward
 *    is refused for the arm's reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staged custody sequence, the displayed reads, the edit and the refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Composes HumanSheath's draw and return through HumanPerformance and reads displayed hand, blade and carrier frames, then runs the public edit check over clips sampled from the same take.
 * @evidence contracts/development/testing.md#independent-expectations The seat and entry come from the archetypes' mouth and tip; the slack is half of the scabbard maker's 2 cm width allowance, the clearance is the staged one, the 1 mm bound is the mount bound and 15 mm is aperture placement's seat tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases Seated, gripped, withdrawing, drawn, held, returning and carried states; two casts and two carriers; cuts before and after closure; one refusal per invalid input.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous in-memory specification of the motions and edit packages; the website scene and its smoke check own the host.
 */
export function test_motion_blade_carrier_draw(): void {
  const failures: string[] = [];
  const run: (label: string, check: () => void) => void = (
    label: string,
    check: () => void,
  ): void => {
    try {
      check();
    } catch (error: unknown) {
      failures.push(
        label + ": " + (error instanceof Error ? error.message : String(error)),
      );
    }
  };
  for (const cast of CASTS) {
    const staged: IStage = stage(
      cast.body,
      cast.blade,
      cast.carrier,
      cast.cant,
    );
    const scene: (
      chain: Chain,
      props?: IAutoMovieMotionHumanProp[],
    ) => HumanPerformance = (
      chain: Chain,
      props: IAutoMovieMotionHumanProp[] = staged.props,
    ): HumanPerformance =>
      new HumanPerformance({
        seed: "blade-carrier-draw",
        props,
        laws: [
          AutoMovieMotionHumanDress.HumanCarrierCustody,
          AutoMovieMotionHumanDress.drawFromCarrier,
          putDownAperture,
        ],
        performers: [
          {
            subject: "fencer",
            body: cast.body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        composition: chain.node,
      });
    const pose: IAutoMovieMotionHumanStand.IParams = { hold: 0.3, sway: 0 };
    const hold: IAutoMovieMotionHumanStand.IParams = {
      hold: HOLD,
      sway: 0,
    };
    const walk: IAutoMovieMotionHumanWalkParams = {
      to: { x: 0.3, y: 0, z: 0.5 },
      face: 35,
    };
    const drawn: () => Chain = (): Chain =>
      AutoMovieMotionHumanDress.HumanSheath.draw(
        HumanChain.subject("fencer").stand(pose),
        staged.sheath,
        "right",
        "draw",
      );

    run(cast.name + " draw, hold and return", () => {
      const film: HumanPerformance = scene(
        AutoMovieMotionHumanDress.HumanSheath.sheathe(
          drawn().stand(hold),
          staged.sheath,
          "right",
        ).walk(walk),
      );
      const [
        ,
        grip,
        draw,
        held,
        back,
      ]: readonly IAutoMovieMotionHumanSegment[] = film.segments("fencer");
      assertTakeClean(cast.name + " draw, hold and return", film);
      const close: number = at(grip!, "gripClosed");
      const liftOff: number = at(draw!, "unseated");
      const lifted: number = at(draw!, "drawn");
      const entry: number = at(back!, "aperture");
      const placed: number = at(back!, "placed");
      const release: number = at(back!, "release");
      const seat: IAutoMovieRigidTransform = socket(staged, "seat");
      const mouth: IAutoMovieRigidTransform = socket(staged, "entry");

      for (const t of [0, close - 0.01, close])
        TestValidator.predicate(
          `seated at ${t.toFixed(3)}`,
          same(local(film, staged, t), seat, RIGID),
        );
      const palm: IAutoMovieVector3 = HumanHand.frame(
        cast.body,
        film.bones("fencer", close),
        "right",
        "palm",
        "flat",
      ).point;
      TestValidator.predicate(
        "the palm closes on the hilt",
        Vector3.distance(
          palm,
          place(film.prop(staged.sheath.blade, close), staged.grip),
        ) <= 0.05,
      );
      const out: IAutoMovieVector3 = Vector3.subtract(
        mouth.position,
        seat.position,
      );
      const height: (t: number) => number = (t: number): number =>
        Vector3.dot(
          Vector3.subtract(
            place(local(film, staged, t), staged.tip),
            seat.position,
          ),
          Vector3.normalize(out),
        );
      for (let i: number = 0; i <= 16; ++i) {
        const t: number = liftOff + ((lifted - liftOff) * i) / 16;
        if (height(t) < 0)
          inside(
            local(film, staged, t),
            staged,
            seat,
            `withdrawing at ${t.toFixed(3)}`,
          );
      }
      TestValidator.predicate(
        "the drawn tip clears the mouth",
        height(lifted) >= CLEARANCE - PLACE,
      );
      TestValidator.predicate(
        "the hand keeps the blade through the held beat",
        same(
          hand(film, staged, lifted + 0.01),
          hand(film, staged, held!.end),
          RIGID,
        ),
      );
      TestValidator.predicate(
        "the return meets the entry, the seat and the release in order",
        held!.end <= entry &&
          entry < placed &&
          placed < release &&
          Vector3.distance(
            local(film, staged, entry).position,
            mouth.position,
          ) <= PLACE &&
          Vector3.distance(
            local(film, staged, placed).position,
            seat.position,
          ) <= PLACE &&
          Quaternion.angle(
            local(film, staged, placed).rotation,
            seat.rotation,
          ) <=
            Math.PI / 12,
      );
      for (let i: number = 0; i <= 16; ++i) {
        const t: number = entry + ((placed - entry) * i) / 16;
        if (height(t) < 0)
          inside(
            local(film, staged, t),
            staged,
            seat,
            `sheathing at ${t.toFixed(3)}`,
          );
      }
      const end: number = film.duration;
      TestValidator.predicate(
        "the blade stays seated while the wearer walks",
        same(local(film, staged, release), local(film, staged, end), RIGID) &&
          Vector3.distance(
            film.prop(staged.sheath.carrier, release).position,
            film.prop(staged.sheath.carrier, end).position,
          ) > 0.2,
      );
      for (const t of [close, liftOff, lifted, entry, placed, release])
        TestValidator.predicate(
          `the blade does not jump at ${t.toFixed(3)}`,
          same(
            film.prop(staged.sheath.blade, t - 1e-4),
            film.prop(staged.sheath.blade, t + 1e-4),
            RIGID,
          ),
        );
      const times: number[] = [
        0,
        close,
        lifted,
        held!.end,
        entry,
        placed,
        release,
        end,
      ];
      const first: IAutoMovieRigidTransform[] = times.map(
        (t: number): IAutoMovieRigidTransform =>
          film.prop(staged.sheath.blade, t),
      );
      const again: HumanPerformance = scene(
        AutoMovieMotionHumanDress.HumanSheath.sheathe(
          drawn().stand(hold),
          staged.sheath,
          "right",
        ).walk(walk),
      );
      for (const i of [...times.keys()].reverse().concat([...times.keys()]))
        TestValidator.predicate(
          "seeks and a rebuilt take restore the blade",
          same(film.prop(staged.sheath.blade, times[i]!), first[i]!, 1e-9) &&
            same(again.prop(staged.sheath.blade, times[i]!), first[i]!, 1e-9),
        );

      // A wide shot trimmed in the held beat, then a close-up of the same node.
      const trim: number = lifted + HOLD / 2;
      const clip: IAutoMovieClip = sample(
        film,
        staged.sheath.blade,
        film.duration,
      );
      const shot: (id: string, camera: string) => IAutoMovieShot = (
        id: string,
        camera: string,
      ): IAutoMovieShot => ({
        id,
        name: null,
        scene: "armoury",
        camera,
        cameraMotion: null,
        performances: [],
        objectMotions: [{ ...clip, id: id + "-blade" }],
        duration: film.duration,
      });
      const shots: IAutoMovieShot[] = [
        shot("wide", "wide"),
        shot("close", "close"),
      ];
      const cut: IAutoMovieCut = cutSequence(
        {
          sequence: { id: "draw-cut", name: "Draw and hold" },
          fps: FPS,
          entries: [
            {
              shot: "wide",
              trim: { start: 0, duration: trim },
              transition: null,
            },
            {
              shot: "close",
              trim: { start: trim, duration: film.duration - trim },
              transition: null,
            },
          ],
          requiredPropContinuity: [
            {
              entry: 1,
              node: staged.sheath.blade,
              component: "translation",
              tolerance: RIGID,
            },
            {
              entry: 1,
              node: staged.sheath.blade,
              component: "rotation",
              tolerance: TURN,
            },
          ],
          pacing:
            "Hold the wide through the draw, then close on the held blade.",
          continuity: "The close-up continues the held beat on the same clock.",
        },
        shots,
      );
      TestValidator.predicate("the match cut keeps the blade", cut.success);
    });

    // Cuts before closure and during the withdrawal.
    run(cast.name + " cuts", () => {
      const [, reach, out]: readonly IAutoMovieMotionHumanSegment[] = scene(
        drawn().stand(pose),
      ).segments("fencer");
      const close: number = at(reach!, "gripClosed");
      const liftOff: number = at(out!, "unseated");
      const lifted: number = at(out!, "drawn");
      for (const [phase, t] of [
        ["before closure", reach!.start + (close - reach!.start) * 0.6],
        ["withdrawing", liftOff + (lifted - liftOff) * 0.4],
      ] as const)
        run(cast.name + " cut " + phase, () => {
          const grip: Chain = HumanChain.subject("fencer").stand(pose);
          const cut: HumanPerformance = scene(
            phase === "before closure"
              ? grip
                  .registered("takeFromCarrier", {
                    prop: staged.sheath.blade,
                    handle: staged.sheath.handle,
                    lift: 0,
                  })
                  .until({ share: (t - reach!.start) / reach!.plan.duration })
                  .stand(pose)
              : drawn()
                  .until({ share: (t - out!.start) / out!.plan.duration })
                  .stand(pose),
          );
          const segments: readonly IAutoMovieMotionHumanSegment[] =
            cut.segments("fencer");
          const held: string | undefined =
            segments[segments.length - 1]!.context.entry.holds.right;
          TestValidator.equals(
            "the cut keeps the current custody",
            held,
            phase === "before closure" ? undefined : staged.sheath.blade,
          );
          TestValidator.predicate(
            "the cut does not jump the blade",
            same(
              cut.prop(staged.sheath.blade, t - 1e-4),
              cut.prop(staged.sheath.blade, t + 1e-4),
              RIGID,
            ),
          );
          TestValidator.predicate(
            "the cut keeps the blade where its custody holds it",
            phase === "before closure"
              ? same(
                  local(cut, staged, cut.duration),
                  socket(staged, "seat"),
                  RIGID,
                )
              : same(
                  hand(cut, staged, t + 0.01),
                  hand(cut, staged, cut.duration),
                  RIGID,
                ),
          );
        });
    });

    if (cast.name !== "arming sword") continue;
    const refused: (axis: string, build: () => unknown) => void = (
      axis: string,
      build: () => unknown,
    ): void =>
      run(cast.name + " refuses " + axis, () => {
        let refusal: unknown;
        try {
          build();
        } catch (error: unknown) {
          refusal = error;
        }
        TestValidator.predicate(
          `refused on ${axis}: ${String(refusal)}`,
          refusal instanceof HumanRefusal && refusal.axis === axis,
        );
      });
    const drawOnly: (other: IStage) => HumanPerformance = (
      other: IStage,
    ): HumanPerformance =>
      scene(
        AutoMovieMotionHumanDress.HumanSheath.draw(
          HumanChain.subject("fencer").stand(pose),
          other.sheath,
        ),
        other.props,
      );
    refused("props." + staged.sheath.blade + ".mounted.prop", () =>
      scene(drawn(), [staged.props[1]!]),
    );
    refused("mouth", () =>
      stage(cast.body, cast.blade, cast.carrier, cast.cant, "right", "throat"),
    );
    refused("tip", () =>
      stage(
        cast.body,
        { kind: "sabre" },
        { kind: "scabbard", blade: "sabre" },
        0,
      ),
    );

    // Plumb, the raised wrist cannot hold the blade's attitude on the line;
    // canted far forward, the drawn hilt lies beyond the arm.
    refused("from.aperture", () =>
      drawOnly(stage(cast.body, cast.blade, cast.carrier, 0)),
    );
    refused("prop", () =>
      drawOnly(stage(cast.body, cast.blade, cast.carrier, 30)),
    );
  }

  run("longsword pulled from the left hip", () => longsword());
  TestValidator.equals("blade carrier findings", failures, []);
}

/** The longsword's scabbard tilts forward from plumb by this, degrees: steep enough that the drawn hilt rises toward the drawing shoulder, authored. */
const CANT: number = 20;
/** The longsword's mouth from the body's midline, metres on a 1.75 m body: worn forward of the hip for the cross draw, authored. */
const LATERAL: number = 0.1;
/** The longsword's mouth ahead of the hips, metres: authored. */
const AHEAD: number = 0.24;
/** How far the trunk turns away from the drawing side in the long draw, degrees: authored. */
const OPEN: number = 45;

/** A longsword drawn from the left hip, the scabbard turned toward the drawing shoulder. */
function longsword(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const staged: IStage = stage(
    body,
    { kind: "longsword", model: "crecy" },
    { kind: "scabbard", blade: "crecy" },
    CANT,
    "left",
    "mouth",
    LATERAL,
    AHEAD,
  );
  // The throat below the mouth is where the left hand takes the scabbard.
  const carrier: IAutoMovieMotionHumanProp = staged.props[0]!;
  const mouth: IAutoMovieAffordance = carrier.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "mouth",
  )!;
  const throat: IAutoMovieAffordance = {
    id: "throat",
    kind: "handle",
    frame: Transform.of(
      Vector3.subtract(
        mouth.frame.translation,
        Quaternion.rotateVector(mouth.frame.rotation, { x: 0, y: 0.06, z: 0 }),
      ),
      mouth.frame.rotation,
    ),
    extent: null,
    grip: "power",
    symmetry: "round",
    aperture: 0.04,
  };
  const props: IAutoMovieMotionHumanProp[] = [
    { ...carrier, affordances: [...carrier.affordances!, throat] },
    staged.props[1]!,
  ];
  const film: HumanPerformance = new HumanPerformance({
    seed: "blade-carrier-longsword",
    props,
    laws: [
      AutoMovieMotionHumanDress.HumanCarrierCustody,
      AutoMovieMotionHumanDress.drawFromCarrier,
      putDownAperture,
    ],
    performers: [
      {
        subject: "fencer",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieMotionHumanDress.HumanSheath.draw(
      HumanChain.subject("fencer").stand({ hold: 0.3, sway: 0 }),
      staged.sheath,
      "right",
      "draw",
      { handle: "throat", turn: OPEN },
    ).stand({ hold: HOLD, sway: 0 }).node,
  });
  const draw: IAutoMovieMotionHumanSegment = film
    .segments("fencer")
    .find((s: IAutoMovieMotionHumanSegment): boolean => s.id === "draw")!;
  const liftOff: number = at(draw, "unseated");
  const lifted: number = at(draw, "drawn");
  const seat: IAutoMovieRigidTransform = socket(staged, "seat");
  const out: IAutoMovieVector3 = Vector3.subtract(
    socket(staged, "entry").position,
    seat.position,
  );
  const height: (t: number) => number = (t: number): number =>
    Vector3.dot(
      Vector3.subtract(
        place(local(film, staged, t), staged.tip),
        seat.position,
      ),
      Vector3.normalize(out),
    );
  const inLeft: (t: number) => IAutoMovieRigidTransform = (
    t: number,
  ): IAutoMovieRigidTransform =>
    HumanPropFrame.relative(
      HumanPropFrame.bone(film.bones("fencer", t).get("leftHand")!),
      film.prop(staged.sheath.carrier, t),
    );
  const onHips: (t: number) => IAutoMovieRigidTransform = (
    t: number,
  ): IAutoMovieRigidTransform =>
    HumanPropFrame.relative(
      HumanPropFrame.bone(film.bones("fencer", t).get("hips")!),
      film.prop(staged.sheath.carrier, t),
    );
  for (let i: number = 0; i <= 16; ++i) {
    const t: number = liftOff + ((lifted - liftOff) * i) / 16;
    if (height(t) < 0)
      inside(
        local(film, staged, t),
        staged,
        seat,
        `long draw at ${t.toFixed(3)}`,
      );
    TestValidator.predicate(
      `the left hand keeps the throat at ${t.toFixed(3)}`,
      same(inLeft(t), inLeft(liftOff), RIGID),
    );
  }
  TestValidator.predicate(
    "the long drawn tip clears the mouth",
    height(lifted) >= CLEARANCE - PLACE,
  );
  TestValidator.predicate(
    "the scabbard hangs from the hips again",
    same(onHips(lifted + 0.02), onHips(film.duration), RIGID),
  );
  TestValidator.predicate(
    "the right hand keeps the longsword",
    same(
      hand(film, staged, lifted + 0.01),
      hand(film, staged, film.duration),
      RIGID,
    ),
  );
  assertTakeClean("longsword draw", film);
}

/** The closed hand's surfaces that wrap a handle farthest from its axis: the thumb's tip and the longest finger's. */
const WRAPPING: readonly IAutoMovieMotionHumanHand.Surface[] = [
  "thumbTip",
  "middleTip",
];

/** Wear the carrier at a hip, its mouth tilted forward by the cant, and seat the blade in it. */
function stage(
  body: IAutoMovieMotionHumanBody,
  bladeParams: createSword.IParams,
  carrierParams: createHolster.IParams,
  cant: number,
  side: AutoMovieHumanSide = "right",
  mouth: string = "mouth",
  lateral?: number,
  ahead: number = 0.12,
): IStage {
  const blade: ReturnType<typeof createSword> = createSword(bladeParams);
  const carrier: ReturnType<typeof createHolster> = createHolster({
    ...carrierParams,
    id: "carrier",
  });
  const length: number = carrier.affordance("mouth").frame.translation.y;
  const neutral: IAutoMoviePose = resolveHumanPosture(
    body,
    AutoMovieMotionHumanStance.stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
  );
  const hips: IAutoMovieRigidTransform = HumanPropFrame.bone(
    poseBones(body, neutral).get("hips")!,
  );
  // The mouth sits just above the hip joint, in front of the hip.
  const hang: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
    { x: 1, y: 0, z: 0 },
    cant,
  );
  // Hung at the side by default: the hip's outer surface (the hip joint's
  // half width and the thigh's radius) and, beyond it, the closed hand's
  // reach about the grip (its thumb and fingertips wrap the handle on the
  // hip's side) or the forearm's radius, whichever is more, so the drawing
  // hand closes on the hilt and the forearm comes down beside the hip
  // without touching it; an authored lateral (the cross draw's) scales with
  // the body.
  // The closed hand's reach about the handle: the farthest its wrapping tips
  // lie from the grip socket.
  const grip: IAutoMovieVector3 = HumanHand.offset(body, side, "grip").point;
  const wrap: number = Math.max(
    ...WRAPPING.map((surface: IAutoMovieMotionHumanHand.Surface): number =>
      Vector3.distance(
        HumanHand.offset(body, side, surface, "fist").point,
        grip,
      ),
    ),
  );
  const out: number =
    lateral === undefined
      ? body.measure.hipHalfWidth +
        body.measure.thighRadius +
        Math.max(wrap, body.measure.forearmRadius)
      : lateral * (body.measure.stature / 1.75);
  const mouthAt: IAutoMovieVector3 = {
    x: side === "left" ? out : -out,
    y: body.measure.hipHeight + 0.05,
    z: ahead,
  };
  const placed: IAutoMovieRigidTransform = {
    position: Vector3.subtract(
      mouthAt,
      Quaternion.rotateVector(hang, { x: 0, y: length, z: 0 }),
    ),
    rotation: hang,
  };
  const worn: IAutoMovieMotionHumanProp = {
    ...HumanObject.prop("carrier", carrier, {
      position: placed.position,
      rotation: placed.rotation,
    }),
    worn: {
      subject: "fencer",
      bone: "hips",
      offset: HumanPropFrame.relative(hips, placed),
    },
  };
  const staging: IAutoMovieMotionHumanSheath.IStaging =
    AutoMovieMotionHumanDress.HumanSheath.of(
      worn,
      HumanObject.prop("blade", blade, { at: { x: 0, y: 0, z: 0 }, yaw: 0 }),
      { mouth, tip: "point", handle: "grip", clearance: CLEARANCE },
    );
  return {
    props: [staging.carrier, staging.blade],
    sheath: staging.sheath,
    tip: blade.affordance("point").frame.translation,
    grip: blade.affordance("grip").frame.translation,
  };
}

/** The staged socket's frame in the carrier. */
function socket(
  stage: IStage,
  which: "seat" | "entry",
): IAutoMovieRigidTransform {
  const id: string = which === "seat" ? stage.sheath.seat : stage.sheath.entry;
  const found: IAutoMovieAffordance = stage.props[0]!.affordances!.find(
    (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
  )!;
  return { position: found.frame.translation, rotation: found.frame.rotation };
}

/** The blade in the carrier's displayed frame. */
function local(
  film: HumanPerformance,
  stage: IStage,
  t: number,
): IAutoMovieRigidTransform {
  return HumanPropFrame.relative(
    film.prop(stage.sheath.carrier, t),
    film.prop(stage.sheath.blade, t),
  );
}

/** The blade in the drawing hand's displayed frame. */
function hand(
  film: HumanPerformance,
  stage: IStage,
  t: number,
): IAutoMovieRigidTransform {
  const bone: IAutoMovieResolvedBone = film
    .bones("fencer", t)
    .get("rightHand")!;
  return HumanPropFrame.relative(
    HumanPropFrame.bone(bone),
    film.prop(stage.sheath.blade, t),
  );
}

/** Check that the blade's shoulder and the part of the blade below the mouth stay on the carrier's line. */
function inside(
  frame: IAutoMovieRigidTransform,
  stage: IStage,
  seat: IAutoMovieRigidTransform,
  label: string,
): void {
  const axis: IAutoMovieVector3 = Quaternion.rotateVector(seat.rotation, {
    x: 0,
    y: 1,
    z: 0,
  });
  const off: (point: IAutoMovieVector3) => number = (
    point: IAutoMovieVector3,
  ): number => {
    const d: IAutoMovieVector3 = Vector3.subtract(point, seat.position);
    return Vector3.length(
      Vector3.subtract(d, Vector3.scale(axis, Vector3.dot(d, axis))),
    );
  };
  TestValidator.predicate(
    label +
      " keeps the blade on the carrier's line (" +
      off(frame.position).toFixed(4) +
      ", " +
      off(place(frame, stage.tip)).toFixed(4) +
      " m)",
    off(frame.position) <= SLACK && off(place(frame, stage.tip)) <= SLACK,
  );
}

/** Sample a prop's displayed frame as one node's translation and rotation tracks. */
function sample(
  film: HumanPerformance,
  node: string,
  duration: number,
): IAutoMovieClip {
  const times: number[] = [];
  const translation: number[] = [];
  const rotation: number[] = [];
  for (let frame: number = 0; frame <= Math.ceil(duration * FPS); ++frame) {
    const t: number = Math.min(duration, frame / FPS);
    const shown: IAutoMovieRigidTransform = film.prop(node, t);
    const q: IAutoMovieQuaternion = shown.rotation;
    times.push(t);
    translation.push(shown.position.x, shown.position.y, shown.position.z);
    rotation.push(q.x, q.y, q.z, q.w);
  }
  return {
    id: node,
    name: null,
    duration,
    loop: false,
    tracks: [
      {
        channel: { kind: "node", node, path: "translation" },
        interpolation: "linear",
        times,
        values: translation,
      },
      {
        channel: { kind: "node", node, path: "rotation" },
        interpolation: "linear",
        times,
        values: rotation,
      },
    ],
  };
}

/** An action event in film seconds. */
function at(segment: IAutoMovieMotionHumanSegment, name: string): number {
  const event: IAutoMovieMotionEvent = segment.plan.events.find(
    (candidate: IAutoMovieMotionEvent): boolean => candidate.name === name,
  )!;
  return segment.start + segment.plan.duration * event.share;
}

/** A local point placed in a frame. */
function place(
  frame: IAutoMovieRigidTransform,
  point: IAutoMovieVector3,
): IAutoMovieVector3 {
  return Vector3.add(
    frame.position,
    Quaternion.rotateVector(frame.rotation, point),
  );
}

/** Two frames within a distance and the rigid attitude bound. */
function same(
  a: IAutoMovieRigidTransform,
  b: IAutoMovieRigidTransform,
  distance: number,
): boolean {
  return (
    Vector3.distance(a.position, b.position) <= distance &&
    Quaternion.angle(a.rotation, b.rotation) <= TURN
  );
}
