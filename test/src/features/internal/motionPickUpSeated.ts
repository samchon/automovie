import { createDrinkware } from "@automovie/archetypes";
import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanAudit,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanSignature,
  IAutoMovieMotionHumanVerdicts,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  HumanChain,
  HumanHand,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
  HumanSignature,
  HumanVerdicts,
  seated,
} from "@automovie/motions";
import { motionHumanBody } from "./motionHumanBody";
import { nclose } from "./nclose";

/**
 * A seated person picks up a glass beyond the seated arm by leaning forward
 * from the seat, on one body, which the `test_human_motion_pick_up_seated_*`
 * specs read one body each: a seated pick up was refused outright, the body
 * never leaning.
 *
 * The person sits facing +Z on a chair as high as the popliteal height,
 * 0.1 m behind the heels, then picks a glass up by its body from a low
 * table top at the seat's height straight ahead of the right shoulder.
 *
 * Scenarios:
 * 1. A glass a tenth of a metre beyond the seated arm and the grip socket:
 *    the pick up plans, and the glass ends lifted at least 5 cm above where
 *    it stood.
 * 2. At the grasp the chest has gone forward of where it sat, at least 5 cm:
 *    the trunk leans to reach.
 * 3. The pick up keeps the seat: read five times over the plan, the body's
 *    seat socket stays within 5 mm of its point on the seat (the campaign's
 *    contact bound).
 * 4. Over the pick up, the shipped audit reads no foot sliding, lifting or
 *    sinking while planted (the campaign's 5 mm bounds), its other checks
 *    left unread.
 * 5. A glass two arm lengths beyond the seated shoulder, past any lean, is
 *    refused as a `reach` refusal on `prop` that names standing up and
 *    stepping closer. The forward population limit is 163.3% of arm-plus-hand
 *    length (Haas et al., 2023, Table 4). Inside it, the straight arm after
 *    maximal lean supplies the tighter anatomical limit.
 * The same displayed film supplies the complete verdicts for the glass of 1:
 * 6. Over the pick up, the whole shipped verdicts read clean: no tangle, no
 *    foot sliding, lifting or sinking, no joint past its range, no jump.
 *
 * @param name The body.
 * @param complaints The owning test gathers the geometry and verdicts on both bodies here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the stage, the case it comes from and the 6 scenarios with their bounds.
 * @evidence contracts/development/implementation.md#principled-implementation Reads a real glass, chest, seated socket and soles on the displayed frame, and computes both reach limits independently of the refusal.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The seated pick-up film supplies both the planned contact observations and the whole verdict before the far refusal case.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A pick up that does not plan is a complaint with the refusal's words.
 * @evidence contracts/development/implementation.md#efficient-algorithms Three short performances per body. Both original audit grids read the same admitted pick-up, with one origin at film start and one at the pick-up.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The admitted performance supplies the geometry and full verdicts that previously staged it twice.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing past the call.
 */
export function motionPickUpSeated(
  name: motionHumanBody.Name,
  complaints: string[],
): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
  const arm: number = body.measure.upperArm + body.measure.forearm;
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const chair: IAutoMovieMotionHumanSeated.ISeat = {
    at: { x: 0, y: seated.popliteal(body), z: -0.1 },
    yaw: 0,
    depth: 0.45,
  };
  const perform = (
    at: IAutoMovieVector3 | null,
  ): IAutoMovieMotionHumanPerformance => {
    const sitting: IAutoMovieMotionHumanChain = HumanChain.subject("a").sit({
      seat: chair,
      seconds: 0.5,
    });
    return new HumanPerformance({
      seed: "seated",
      props:
        at === null ? [] : [HumanObject.prop("glass", glass, { at, yaw: 0 })],
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (at === null
        ? sitting
        : sitting.pickUp({ prop: "glass", handle: "body" })
      ).node,
    });
  };
  const said = (error: unknown): string =>
    error instanceof Error ? error.message : String(error);

  // The seated shoulder and chest, from a film that only sits.
  const still: IAutoMovieMotionHumanPerformance = perform(null);
  const sat: IAutoMovieMotionHumanSegment = still.segments("a")[0]!;
  const seatedBones: ReturnType<typeof still.bones> = still.bones("a", sat.end);
  const shoulder: IAutoMovieVector3 = seatedBones.get("rightUpperArm")!.worldPosition;
  const chest: IAutoMovieVector3 = seatedBones.get("chest")!.worldPosition;
  const socket: number = Vector3.length(
    HumanHand.offset(body, "right", "grip").point,
  );
  const grip: IAutoMovieVector3 = glass.affordance("body").frame.translation;
  // The glass placed so its grip lies `ahead` beyond the shoulder.
  const placed = (ahead: number): IAutoMovieVector3 => ({
    x: shoulder.x - grip.x,
    y: chair.at.y,
    z: shoulder.z + ahead - grip.z,
  });

  // 1 to 4. A glass just beyond the seated arm.
  try {
    const at: IAutoMovieVector3 = placed(arm + socket + 0.1);
    const film: IAutoMovieMotionHumanPerformance = perform(at);
    const reader: IAutoMovieMotionHumanSignature.IReader = HumanSignature.of(
      film,
      "a",
      body,
      0,
    );
    const pick: IAutoMovieMotionHumanSegment = film
      .segments("a")
      .find((s: IAutoMovieMotionHumanSegment): boolean => s.name === "pickUp")!;
    const grasp: number =
      pick.start +
      (pick.plan.events.find((e): boolean => e.name === "gripClosed")?.share ??
        Number.NaN) *
        pick.plan.duration;
    // 6. The whole shipped verdicts over the pick up.
    const report: IAutoMovieMotionHumanVerdicts.IReport = HumanVerdicts.of(
      film,
      24,
      {
        from: pick.start,
        to: pick.end,
      },
    );
    if (!report.clean)
      complaints.push(
        `${name}: the shipped verdicts over the pick up: ${HumanVerdicts.describe(report)}`,
      );

    const lifted: number = film.prop("glass", pick.end).position.y - at.y;
    if (!(lifted >= 0.05))
      complaints.push(
        `${name}: the glass ends ${(lifted * 1000).toFixed(0)} mm above where it stood, at least 50 expected`,
      );
    const forward: number =
      HumanSignature.joint(reader, grasp, "chest").z - chest.z;
    if (!(forward >= 0.05))
      complaints.push(
        `${name}: at the grasp the chest has gone ${(forward * 1000).toFixed(0)} mm forward, at least 50 expected`,
      );
    const sitting: IAutoMovieVector3 = seated.point(body, chair);
    let drift: number = 0;
    const seat: typeof body.surfaces.sockets.seat = body.surfaces.sockets.seat;
    for (let i: number = 0; i <= 4; i++) {
      const t: number = pick.start + (pick.plan.duration * i) / 4;
      const bones: ReturnType<typeof film.bones> = film.bones("a", t);
      const point: IAutoMovieVector3 = resolveAutoMovieHumanoidSurfaces.place(seat, bones.get(seat.bone)!).point;
      drift = Math.max(drift, Vector3.distance(point, sitting));
    }
    if (!(drift <= 0.005))
      complaints.push(
        `${name}: the seat socket leaves the seat by ${(drift * 1000).toFixed(1)} mm during the pick up, within 5 mm expected`,
      );
    // The shipped audit's floor, slip and lift on the feet, its other
    // checks left unread (`AutoMovieMotionHumanAudit.run`'s null limits).
    for (const finding of AutoMovieMotionHumanAudit.run(film, "a", body, {
      limits: {
        tangle: null,
        jump: null,
        reversal: null,
        speed: null,
        balance: null,
      },
    }).findings.filter(
      (f: IAutoMovieMotionHumanAudit.IFinding): boolean =>
        f.seconds >= pick.start - 1e-6 &&
        f.seconds <= pick.end + 1e-6 &&
        /Foot|Toes/.test(f.where),
    ))
      complaints.push(
        `${name}: ${finding.check} ${(finding.value * 1000).toFixed(1)} mm at ${finding.seconds.toFixed(2)} s (${finding.where}), within ${(finding.limit * 1000).toFixed(0)} mm expected`,
      );
  } catch (error) {
    complaints.push(
      `${name}: a glass just beyond the seated arm: expected to plan, got ${said(error)}`,
    );
  }

  // 5. Past any lean.
  let thrown: unknown = null;
  try {
    perform(placed(2 * arm));
  } catch (error) {
    thrown = error;
  }
  // Straight ahead the Haas et al. (2023) seated reach is 163.3% of the
  // acromion-to-fingertip length. Horizontal and vertical offsets form
  // the independent hypotenuse from this seated shoulder to the grip.
  const maximum: number = 1.633 * (arm + body.measure.hand);
  const distance: number = Math.hypot(2 * arm, chair.at.y + grip.y - shoulder.y);
  // A grip inside the population reach envelope can still exceed this
  // body's two straight arm segments after maximal seated lean. Then
  // leaning must shorten the distance, yet leave a positive reach deficit.
  const envelopeExceeded: boolean = distance > maximum;
  if (
    !(
      thrown instanceof HumanRefusal &&
      thrown.kind === "reach" &&
      thrown.axis === "prop" &&
      /stand/.test(thrown.fix ?? "") &&
      typeof thrown.value === "number" &&
      (envelopeExceeded ? nclose(thrown.value, distance) : thrown.value > arm && thrown.value < distance) &&
      thrown.feasible?.kind === "range" && thrown.feasible.minimum === 0 &&
      thrown.feasible.unit === "m" && nclose(thrown.feasible.maximum ?? NaN, envelopeExceeded ? maximum : arm)
    )
  )
    complaints.push(
      `${name}: a glass two arm lengths ahead: starting distance ${distance} m, expected maximum ${envelopeExceeded ? maximum : arm} m, got ${said(thrown)}`,
    );
}
