import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieMotionHumanProp } from "@automovie/interface";
import {
  AutoMovieMotionHumanFall,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";

/** Temporary probe; deleted after use. */
export function test_motion_fall_thrown_probe(): void {
  const wall: IAutoMovieMotionHumanProp = {
    subject: "wall",
    fixed: true,
    frame: { position: { x: 0, y: 0, z: -1.2 }, rotation: Quaternion.identity() },
    points: { face: { point: { x: 0, y: 1, z: 0 }, normal: { x: 0, y: 0, z: 1 } } },
    affordances: [],
    shapes: [],
  };
  const film: HumanPerformance = new HumanPerformance({
    seed: "thrown-wall",
    laws: [AutoMovieMotionHumanFall.thrown],
    props: [wall],
    performers: [
      { subject: "a", body: require("../../internal/motionHumanBody").motionHumanBody("m-average"), at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
    ],
    composition: HumanChain.subject("a")
      .stand({ hold: 0.3, sway: 0 })
      .registered(AutoMovieMotionHumanFall.thrown.name, {
        rig: "blast",
        target: { kind: "point", at: { x: 0, y: 1, z: 2 }, frame: "world" },
        distance: 3,
        height: 0.5,
        wall: { kind: "prop", subject: "wall", point: "face" },
      }).node,
  });
  const s = film.segments("a");
  console.log("PROBE segments", s.map((g) => `${g.name} ${g.start.toFixed(5)}-${g.end.toFixed(5)} entry ${g.entryTime.toFixed(5)}`).join("; "));
  const at = (t: number) => film.bones("a", t).get("leftLowerLeg")!.worldPosition;
  let prev = at(0.38);
  for (let t = 0.38; t <= 0.42 + 1e-9; t += 0.00125) {
    const p = at(t);
    console.log(`PROBE ${t.toFixed(5)} knee ${p.x.toFixed(4)} ${p.y.toFixed(4)} ${p.z.toFixed(4)} step ${Vector3.distance(p, prev).toFixed(5)}`);
    prev = p;
  }
  const plan = s[1]!.plan;
  for (const u of [0.099, 0.09996, 0.1, 0.10004, 0.1005, 0.10125, 0.1025]) {
    const q = plan.posture(u);
    const leg = q.limbs.leftLeg;
    console.log(`PROBE plan ${u} root ${q.root.x.toFixed(4)} ${q.root.y.toFixed(4)} ${q.root.z.toFixed(4)} pitch ${q.pitch.toFixed(3)} leg ${leg === undefined ? "none" : `${leg.point.x.toFixed(4)} ${leg.point.y.toFixed(4)} ${leg.point.z.toFixed(4)} planted ${leg.planted} bend ${leg.bend.z.toFixed(4)}`} ul ${JSON.stringify(q.joints.leftUpperLeg)} ll ${JSON.stringify(q.joints.leftLowerLeg)} keys ${Object.keys(q).join(",")}`);
    const shown = film.bones("a", 0.3 + u);
    const k = shown.get("leftLowerLeg")!.worldPosition;
    const f = shown.get("leftFoot")!.worldPosition;
    const h = shown.get("hips")!.worldPosition;
    console.log(`PROBE shown ${u} hips ${h.x.toFixed(4)} ${h.y.toFixed(4)} ${h.z.toFixed(4)} knee ${k.x.toFixed(4)} ${k.y.toFixed(4)} ${k.z.toFixed(4)} foot ${f.x.toFixed(4)} ${f.y.toFixed(4)} ${f.z.toFixed(4)}`);
  }
  console.log("PROBE planKeys", Object.keys(plan).join(","), JSON.stringify((plan as any).still), JSON.stringify((plan as any).legsStill));
  for (const t of [0.39996, 0.4, 0.40004]) {
    const p = at(t);
    console.log(`PROBE fine ${t} ${p.x.toFixed(5)} ${p.y.toFixed(5)} ${p.z.toFixed(5)}`);
  }
}
