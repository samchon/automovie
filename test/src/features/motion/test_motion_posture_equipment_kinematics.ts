import {createBarbell} from "@automovie/archetypes";
import {Quaternion,Vector3} from "@automovie/engine";
import {HumanChain,HumanObject,HumanPerformance,WorkoutLoad,poseBones,resolveHumanPosture} from "@automovie/motions";
import {TestValidator} from "@nestia/e2e";
import {motionHumanBody} from "../internal/motionHumanBody";

/**
 * The second hand meets a bar's other grip when a held bar is levelled.
 *
 * Scenarios:
 * 1. Acquire the bar by its right handle and apply the two-hand load to one posture.
 * 2. The projected hand separation follows the physical handle spacing. A one-hand load leaves the unoccupied arm untouched.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the grasp, the two independent handle landmarks and the one-hand control.
 * @evidence contracts/development/testing.md#behavioral-verification Obtains a real grip at entry, applies the public load writer and measures the resolved hand positions.
 * @evidence contracts/development/testing.md#independent-expectations The bar model supplies the grip span. The wrist allowance is the original loaded exercise's 0.12 m per hand.
 * @evidence contracts/development/testing.md#distinguishing-cases A one-handle and a two-handle constraint operate on the same held bar.
 * @evidence contracts/development/testing.md#execution-ownership One real pickup prepares the grip for the isolated loaded posture.
 */
export function test_motion_posture_equipment_kinematics():void {
   const bar: ReturnType<typeof createBarbell> = createBarbell({
    kind: "mens",
    grip: 0.5,
    load: 0,
  });

 const body=motionHumanBody("f-small");
 const stature=body.measure.stature;
       const film = new HumanPerformance({
        seed: "loaded",
        
        performers: [
          {
            subject: "a",
            body,
            at: { x: 0, y: 0, z: 0 },
            yaw: 0,
            proficiency: { level: "trained" },
          },
        ],
        props: [
          // The bar across the body before the hips, at their height: a
          // standing arm reaches no lower without a bend the pick-up does
          // not take (at 0.42 of the stature it refused, 52 mm short).
          HumanObject.prop("bar", bar, {
            position: { x: 0, y: 0.56 * stature, z: 0.12 * stature },
            rotation: Quaternion.fromAxisAngle({ x: 0, y: 1, z: 0 }, 0),
          }),
        ],
        composition: HumanChain.subject("a")
          .stand({ seconds: 0.3 })
          .pickUp({
            prop: "bar",
            handle: "gripRight",
            use: { tip: "gripLeft", line: "square" },
          })

 .stand({seconds:0.3,sway:0}).node,
 });
 const context=film.segments("a").at(-1)!.context;
 const both=WorkoutLoad.of(context,{prop:"bar",handle:"gripRight",other:"gripLeft"});
 const one=WorkoutLoad.of(context,{prop:"bar",handle:"gripRight"});
 const pose=context.entry.posture;
 TestValidator.equals("one hand leaves other arm goal untouched",one.apply(pose).limbs.leftArm,pose.limbs.leftArm);
 const placed=poseBones(body,resolveHumanPosture(body,both.apply(pose)));
 const before=poseBones(body, resolveHumanPosture(body,pose)).get("rightHand")!;
 const after=placed.get("rightHand")!;
 const carried=film.prop("bar",film.segments("a").at(-1)!.start);
 const handle = (id: string) => {
   const initial=Vector3.add(carried.position,Quaternion.rotateVector(carried.rotation,bar.affordance(id).frame.translation));
   const local=Quaternion.rotateVector(Quaternion.inverse(before.worldRotation),Vector3.subtract(initial,before.worldPosition));
   return Vector3.add(after.worldPosition,Quaternion.rotateVector(after.worldRotation,local));
 };
 const left=handle("gripLeft"),right=handle("gripRight");
 TestValidator.predicate("the two physical handles are level within 15 mm",Math.abs(left.y-right.y)<=0.015);
 TestValidator.predicate("left wrist follows the left grip within 120 mm",Vector3.distance(placed.get("leftHand")!.worldPosition,left)<=0.12);
 TestValidator.predicate("right wrist follows the right grip within 120 mm",Vector3.distance(after.worldPosition,right)<=0.12);
}
