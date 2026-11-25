import { createHorse } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanObject } from "@automovie/motions";
import { HumanFrame, HumanPropFrame, sit } from "@automovie/motions/internal";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/** The mount's own prepared support order and settled boundary on the real tack. */
export async function test_motions_mounted_material_transfer(): Promise<void> {
  const body = await humanFixtureBody("m-average");
  const horse = createHorse(
    { withersHeight: 1.65, stirrupDrop: 0.66, tempo: 0 },
    1028,
  );
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const seat = HumanObject.seat(horse, frame, "seat", "horse");
  const prop = HumanObject.prop("horse", horse, frame);
  const reader: IAutoMovieMotionHumanPropReader = {
    prop,
    frame: () => frame,
    site: (id) => {
      const { translation, rotation } = horse.affordances.find(
        (site) => site.id === id,
      )!.frame;
      return HumanPropFrame.compose(frame, { position: translation, rotation });
    },
    snapshot: () => ({
      frame,
      posed: { affordances: horse.affordances, shapes: horse.shapes() },
    }),
  };
  const context = motionActionContext(
    body,
    { seat, hold: 0.5 },
    {
      at: HumanFrame.point(
        { origin: { ...seat.at, y: 0 }, yaw: seat.yaw },
        { x: 0.6, y: 0, z: -0.2 },
      ),
      yaw: seat.yaw,
      props: [prop],
    },
  );
  const plan = sit.plan({ ...context, prop: () => reader });
  const onto = (name: string): IAutoMovieMotionHumanContactWindow | undefined =>
    plan.contacts.find(
      ({ support }) => support.kind === "prop" && support.point === name,
    );
  const near = onto("leftStirrup");
  const far = onto("rightStirrup");
  const saddle = onto("seat");
  const farGround = plan.contacts.find(
    ({ part, support }) => part === "rightFoot" && support.kind === "ground",
  );
  const seated = plan.events.find(({ name }) => name === "seated");
  if (
    near === undefined ||
    far === undefined ||
    saddle === undefined ||
    farGround === undefined ||
    seated === undefined
  )
    throw new Error("The material mount did not expose all support handoffs");
  const settled = seated.share * plan.duration;
  const before = plan.posture(settled - 1e-4);
  const after = plan.posture(settled);
  const faults: string[] = [];
  if (near.from > farGround.to)
    faults.push(
      `near tread loads at ${near.from * plan.duration}s after the far toes release at ${farGround.to * plan.duration}s`,
    );
  if (saddle.from > far.from)
    faults.push(
      `far tread loads at ${far.from * plan.duration}s before the seat arrives at ${saddle.from * plan.duration}s`,
    );
  if (
    Vector3.distance(before.root, after.root) > 0.002 ||
    Math.abs(before.pitch - after.pitch) > 0.25
  )
    faults.push(
      "the prepared climb and the settled seat disagree at their shared boundary",
    );
  if (faults.length !== 0) throw new Error(faults.join(". "));
}
