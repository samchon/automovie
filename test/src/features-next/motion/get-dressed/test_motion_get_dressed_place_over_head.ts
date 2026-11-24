import { type AutoMovieArchetype, createNecklace } from "@automovie/archetypes";
import {
  Quaternion,
  Vector3,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGetDressed,
  AutoMovieMotionHumanSeat,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { everydayTake } from "../../../features/internal/everydayTake";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The rigid custody bound: a worn loop's drift on its bone, metres. */
const RIGID: number = 0.001;

/**
 * How near the worn loop's back lies to the nape, metres: the ribbon's
 * thickness and a skin contact (provisional).
 */
const NAPE: number = 0.015;

/**
 * How far ahead of the dresser a partner seated facing away has the seat's
 * front edge, metres (staging: the dresser behind the seated back).
 */
const BEHIND: number = 0.75;

/**
 * How far ahead of the dresser a partner seated facing the dresser has the
 * seat's front edge, metres (staging: the dresser at the knees).
 */
const FRONT: number = 0.3;

/** The partner's sitting's anchor, which the dresser waits for. */
const SEATING: string = "seating";

/**
 * How long the dresser may stand waiting for the partner to sit, seconds: an
 * upper bound past any sitting's `seated`.
 */
const SIT: number = 6;

/**
 * How the partner waits for the loop: seated facing the dresser, seated facing
 * away, or standing facing the dresser.
 */
type Pose = "front" | "behind" | "stand";

/** A performer's chain. */
type Chain = ReturnType<typeof HumanChain.subject>;

/** A neck loop model. */
type Loop = AutoMovieArchetype<
  createNecklace.Affordance,
  createNecklace.Dimension
>;

/** One scene: the kind, who gives and who receives. */
interface ICase {
  /** The loop's kind. */
  kind: createNecklace.Kind;

  /** The dresser's body. */
  dresser: motionHumanBody.Name;

  /** The partner's body. */
  partner: motionHumanBody.Name;
}

/**
 * A medal ceremony and a necklace (#4015): a ribbon medal set over a seated
 * partner's head from in front, and a necklace set over a seated partner's head
 * from behind.
 *
 * Scenarios, each take clean, the average man dressing the small woman and the
 * reverse for each kind:
 *
 * 1. Both hands' grips on the loop end as it is worn, on the partner's upper
 *    chest, the second hand's grip carrying nothing.
 * 2. The worn loop's back lies on the partner's nape.
 * 3. The worn loop keeps its offset on the partner's upper chest as the partner
 *    rises.
 * 4. A small woman cannot set a loop over a standing tall man's head: the refusal
 *    names the reach. Over the same man seated facing her she can: that staging
 *    builds without a refusal.
 *
 * Each scene, each check and each refusal case gather their own results, so a
 * failing scene hides no other. The loop's grasp is
 * `test_motion_action_pick_up`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the scenes, the bounds and the refusal.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the plan's windows and the displayed loop against the partner's displayed nape and upper chest; grips that outlast the wear, a loop off the nape or sliding on the chest, or an admitted unreachable crown fails.
 * @evidence contracts/development/testing.md#independent-expectations A worn prop is rigid on its bone within 1 mm, the dressing specifications' bound; the nape contact is a skin contact.
 * @evidence contracts/development/testing.md#distinguishing-cases Two kinds from in front and behind on two body pairs, and the standing refusal beside the seated admission; the loop's own geometry is its producer's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory two-performer performances through the public chain.
 */
export function test_motion_get_dressed_place_over_head(): void {
  const cases: readonly ICase[] = [
    { kind: "ribbon", dresser: "m-average", partner: "f-small" },
    { kind: "ribbon", dresser: "f-small", partner: "m-average" },
    { kind: "chain", dresser: "m-average", partner: "f-small" },
    { kind: "chain", dresser: "f-small", partner: "m-average" },
  ];
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of cases) {
    const label: string = `${c.dresser} sets a ${c.kind} on ${c.partner}`;
    try {
      dress(checks, label, c);
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  const standing: HumanRefusal | undefined = tall(checks, "stand");
  checks.check(
    `the small woman cannot set a loop over the standing tall man's head (${describe(standing)})`,
    standing !== undefined &&
      standing.axis === "partner" &&
      /beyond the arm's reach/.test(standing.message),
  );
  const seated: HumanRefusal | undefined = tall(checks, "front");
  checks.check(
    `the small woman sets a loop over the seated tall man's head (${describe(seated)})`,
    seated === undefined,
  );
  checks.assert("place over head");
}

/**
 * The refusal the small woman's ribbon on the tall man in a pose throws, if
 * any.
 */
function tall(
  checks: motionComplaints.IGatherer,
  pose: Pose,
): HumanRefusal | undefined {
  try {
    return everydayTake.refusal(() =>
      scene(
        motionHumanBody("f-small"),
        motionHumanBody("m-tall"),
        createNecklace({ id: "loop", kind: "ribbon" }),
        pose,
      ).bones("a", 3),
    );
  } catch (error: unknown) {
    checks.check(
      `the tall man, ${pose}: ${everydayTake.describe(error)}`,
      false,
    );
    return undefined;
  }
}

/** A refusal's axis and message, or that the build was admitted. */
function describe(refused: HumanRefusal | undefined): string {
  return refused === undefined
    ? "admitted"
    : `${refused.axis}: ${refused.message}`;
}

/** One scene and its checks. */
function dress(
  checks: motionComplaints.IGatherer,
  label: string,
  c: ICase,
): void {
  const b: IAutoMovieMotionHumanBody = motionHumanBody(c.partner);
  const loop: Loop = createNecklace({ id: "loop", kind: c.kind });
  const film: HumanPerformance = scene(
    motionHumanBody(c.dresser),
    b,
    loop,
    c.kind === "ribbon" ? "front" : "behind",
  );
  try {
    assertTakeClean(label, film);
  } catch (error: unknown) {
    checks.check(`${label}: ${everydayTake.describe(error)}`, false);
  }
  const act: IAutoMovieMotionHumanSegment = film
    .segments("a")
    .find(
      (s: IAutoMovieMotionHumanSegment): boolean => s.name === "placeOverHead",
    )!;
  const worn: number =
    act.start +
    act.plan.duration *
      act.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === "strokeEnd",
      )!.share;
  const grips: readonly IAutoMovieMotionHumanContactWindow[] =
    act.plan.contacts.filter(
      (w: IAutoMovieMotionHumanContactWindow): boolean =>
        w.kind === "grip" &&
        w.support.kind === "prop" &&
        w.support.subject === "loop",
    );
  checks.check(
    `${label}: both grips end as the loop is worn, one carrying it`,
    grips.length === 2 &&
      grips.every(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          Math.abs(act.start + w.to * act.plan.duration - worn) <= 1e-9,
      ) &&
      grips.filter(
        (w: IAutoMovieMotionHumanContactWindow): boolean =>
          w.support.kind === "prop" && w.support.carries === false,
      ).length === 1,
  );
  const at: number = worn + 0.02;
  const frame: IAutoMovieRigidTransform = film.prop("loop", at);
  const back: IAutoMovieVector3 = Vector3.add(
    frame.position,
    Quaternion.rotateVector(
      frame.rotation,
      loop.affordance("wear").frame.translation,
    ),
  );
  const nape: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(
    b.surfaces.regions.nape,
    film.bones("b", at).get(b.surfaces.regions.nape.bone)!,
  ).point;
  checks.check(
    `${label}: the loop's back lies on the nape (${(Vector3.distance(back, nape) * 1000).toFixed(0)} mm)`,
    Vector3.distance(back, nape) <= NAPE,
  );
  const bone: AutoMovieHumanoidBone = b.surfaces.regions.sternum.bone;
  const first: IAutoMovieVector3 = local(frame, film.bones("b", at).get(bone)!);
  const drifts: readonly number[] = [0.5, 1].map((share: number): number => {
    const t: number = at + share * (film.duration - at);
    return Vector3.distance(
      local(film.prop("loop", t), film.bones("b", t).get(bone)!),
      first,
    );
  });
  checks.check(
    `${label}: the loop rides the partner (${drifts.map((d: number): string => (d * 1000).toFixed(2)).join(", ")} mm)`,
    drifts.every((d: number): boolean => d <= RIGID),
  );
}

/**
 * `b` sits facing `a`, sits facing away or stands facing `a`; `a` takes the
 * loop up and sets it over `b`'s head, then a seated `b` rises.
 */
function scene(
  a: IAutoMovieMotionHumanBody,
  b: IAutoMovieMotionHumanBody,
  loop: Loop,
  pose: Pose,
): HumanPerformance {
  const behind: boolean = pose === "behind";
  // The seat's front edge: ahead of the dresser by `BEHIND` for a partner
  // seated facing away, so the dresser stands behind the seated back, or by
  // `FRONT` for one seated facing the dresser, who stands at the knees; the
  // partner stands before it, a foot's offset from the edge, as the sit
  // stages it.
  const foot: number = b.rest.get("leftFoot")!.z - 0.1;
  const edge: number = behind ? BEHIND : FRONT;
  const at: number = behind ? edge - foot : edge + foot;
  const seat: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: AutoMovieMotionHumanSeat.seated.popliteal(b), z: edge },
    yaw: behind ? 0 : 180,
    depth: 0.45,
  };
  const partner: Chain = HumanChain.subject("b");
  const first: Chain =
    pose === "stand"
      ? partner.stand({ hold: 8 })
      : partner.sit({ seat, hold: 8 }, SEATING).rise({});
  // The dresser reads the head where it is as the setting starts, so it
  // waits until a seated partner has sat (the stand is cut there, its own
  // length only an upper bound): read while the partner was still lowering,
  // the crown stood a sitting's height above where it came to rest and the
  // loop's apex fell inside the dresser's own trunk.
  // A partner seated facing the dresser sits down, and later rises, with the
  // trunk pitched forward over the knees the dresser stands at (its chest
  // went 0.106 m into the dresser's spine as it sat), so the dresser waits
  // `AWAY` back and walks in once the partner has sat.
  const waiting: Chain =
    pose === "stand"
      ? HumanChain.subject("a")
      : HumanChain.subject("a")
          .stand({ hold: SIT })
          .until({ of: SEATING, event: "seated" });
  // It stops a foot's length short of the seated partner's shins (at the
  // seat's edge its shank stood 46.5 mm into the partner's as it stepped
  // off) and reaches the head by the hip hinge the setting takes.
  const dresser: Chain =
    pose === "front"
      ? waiting.walk({
          to: { x: 0, y: 0, z: -a.measure.footLength },
          face: 0,
        })
      : waiting;
  return new HumanPerformance({
    seed: "place-over-head",
    laws: [AutoMovieMotionHumanGetDressed.placeOverHead],
    performers: [
      {
        subject: "a",
        body: a,
        at: { x: 0, y: 0, z: pose === "front" ? -AWAY : 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "b",
        body: b,
        at: { x: 0, y: 0, z: pose === "stand" ? 0.55 : at },
        yaw: behind ? 0 : 180,
        proficiency: { level: "trained" },
      },
    ],
    props: [
      HumanObject.prop("loop", loop, {
        // On a stand at the dresser's right, the loop level, laid the way it
        // will be worn: its front toward the way the partner faces and its
        // left on the partner's left, so the right hand takes the handle on
        // the dresser's right and the loop never turns in the hands.
        position: { x: -0.3, y: 1.0, z: 0.05 },
        rotation: behind
          ? Quaternion.identity()
          : Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 180),
      }),
    ],
    // The partner is placed first, so the dresser reads where the head is.
    composition: first.with(
      ((placing: Chain): Chain =>
        // A partner seated facing the dresser rises forward over the knees
        // the dresser stands at (its head went 0.11 m into the dresser's
        // hips), so the dresser walks off to its side first: turning to walk
        // back, its first step went 38.7 mm into the partner's shins.
        pose === "front"
          ? placing.walk({
              to: { x: -AWAY, y: 0, z: -a.measure.footLength },
              face: -90,
            })
          : placing)(
        dresser
          .pickUp({
            prop: "loop",
            handle: behind ? "holdRight" : "holdLeft",
            hand: "right",
            lift: 0.05,
          })
          .registered(AutoMovieMotionHumanGetDressed.placeOverHead.name, {
            prop: "loop",
            partner: "b",
          }),
      ),
    ).node,
  });
}

/**
 * How far the dresser walks off a partner seated facing it before the partner
 * rises, metres (staging: clear of a rising trunk's forward lean).
 */
const AWAY: number = 0.6;

/** A prop's position in a displayed bone's frame. */
function local(
  prop: IAutoMovieRigidTransform,
  bone: IAutoMovieResolvedBone,
): IAutoMovieVector3 {
  return Quaternion.rotateVector(
    Quaternion.inverse(bone.worldRotation),
    Vector3.subtract(prop.position, bone.worldPosition),
  );
}
