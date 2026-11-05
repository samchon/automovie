import assert from "node:assert/strict";

import type { IPerformancePoseFrame } from "../../../src/IPerformancePoseFrame";
import { performanceFrameFailures } from "../../../src/performanceFrameFailures";

/**
 * Reject finite-but-unsuccessful numerical frame feedback before capture.
 * @evidence contracts/testing.md#observable-behavior Executes the actual frame-admission function with independent admitted, unresolved, excessive-distance, clamped, nonfinite and post-release observations. It catches the earlier cache-exists readiness bug, especially zero-anchor-like finite outputs with failed actual support/grip. It does not substitute for real Human or Viewer integration.
 * @evidence contracts/testing.md#independent-cases Five-millimetre support/wrist and three-millimetre paper-face limits are authored physical tolerances. One-micrometre floor allowance follows the public Grounding admission. Native unresolved/clamped states must fail regardless of small distance. After six-second release the empty pinch no longer holds paper and is not a grip failure.
 */
export function test_frame_admission(): void {
  const frame: IPerformancePoseFrame = {
    index: 0,
    carina: { pose: {}, position: [0,0,0], rotation: [0,0,0,1] },
    harry: { pose: {}, position: [0,0,0], rotation: [0,0,0,1] },
    diagnostics: { implementedThrough: 9, time: 0,
      carina: { support: "admitted", supportError: 0, floorMinimum: 0, handMode: "wrist", wristGoalError: 0, clamps: [], pinchValid: true, pinchGap: 0.001, pinchGoalError: 0.001, reason: "converged", iterations: 2 },
      harry: { support: "admitted", supportError: 0, floorMinimum: 0, wristGoalError: null, clamps: [], reason: "converged", iterations: 2 },
    },
  };
  assert.deepEqual(performanceFrameFailures(frame), []);
  const failed: IPerformancePoseFrame = structuredClone(frame);
  failed.diagnostics.carina.pinchGap = NaN;
  failed.diagnostics.carina.pinchGoalError = 0.013;
  failed.diagnostics.harry.support = "unresolved";
  failed.diagnostics.harry.supportError = 0.038;
  failed.diagnostics.harry.wristGoalError = NaN;
  failed.diagnostics.harry.floorMinimum = -0.001;
  failed.diagnostics.harry.clamps = [{ path: "actual-observation" }];
  assert.equal(performanceFrameFailures(failed).length, 7);
  const tangentSeparated: IPerformancePoseFrame = structuredClone(frame);
  tangentSeparated.diagnostics.carina.pinchGap = 0.009;
  assert.deepEqual(performanceFrameFailures(tangentSeparated), []); // Actual finite-face validity, not coincidence, owns this admission.
  const invalidGrasp: IPerformancePoseFrame = structuredClone(frame);
  invalidGrasp.diagnostics.carina.pinchValid = false;
  assert.ok(performanceFrameFailures(invalidGrasp).some((s: string): boolean => s.includes("finite paper grasp")));
  const badCarry: IPerformancePoseFrame=structuredClone(frame);
  badCarry.diagnostics.carina.handMode="rigid-grasp-carrier";
  badCarry.diagnostics.carina.wristGoalError=null;
  badCarry.diagnostics.carina.handFrameGoal={origin:[0,0,0],rotation:[0,0,0,1],iterations:2};
  badCarry.diagnostics.carina.handFrameGoalError=0.02;
  badCarry.diagnostics.carina.handFrameFitError=0.01;
  badCarry.diagnostics.carina.handFrameRotationError=35;
  assert.equal(performanceFrameFailures(badCarry).length,3);
  const carry: IPerformancePoseFrame=structuredClone(badCarry);
  carry.diagnostics.carina.handFrameGoalError=0;
  carry.diagnostics.carina.handFrameFitError=0;
  carry.diagnostics.carina.handFrameRotationError=0;
  assert.deepEqual(performanceFrameFailures(carry),[]);
  for (const key of ["handFrameGoalError","handFrameFitError","handFrameRotationError","handFrameGoal"] as const) {
    const missing: IPerformancePoseFrame=structuredClone(carry);
    delete missing.diagnostics.carina[key];
    assert.ok(performanceFrameFailures(missing).length>0,"missing carrier receipt must fail: "+key);
  }
  const noCarrier: IPerformancePoseFrame=structuredClone(frame);
  noCarrier.diagnostics.carina.handMode="rigid-grasp-carrier";
  noCarrier.diagnostics.carina.wristGoalError=null;
  assert.equal(performanceFrameFailures(noCarrier).length,4);
  const nonfinite: IPerformancePoseFrame=structuredClone(carry);
  nonfinite.diagnostics.carina.handFrameFitError=NaN;
  assert.ok(performanceFrameFailures(nonfinite).length>0);
  const partial: IPerformancePoseFrame=structuredClone(carry);
  Reflect.deleteProperty(partial.diagnostics.carina.handFrameGoal!,"origin");
  assert.ok(performanceFrameFailures(partial).length>0);
  const negative: IPerformancePoseFrame=structuredClone(carry);negative.diagnostics.carina.handFrameFitError=-0.001;
  assert.ok(performanceFrameFailures(negative).length>0);
  const noMode: IPerformancePoseFrame=structuredClone(frame);Reflect.deleteProperty(noMode.diagnostics.carina,"handMode");
  assert.ok(performanceFrameFailures(noMode).length>0);
  const noWrist: IPerformancePoseFrame=structuredClone(frame);noWrist.diagnostics.carina.wristGoalError=null;
  assert.ok(performanceFrameFailures(noWrist).length>0);
  const directed:IPerformancePoseFrame=structuredClone(frame);directed.diagnostics.carina.handMode="directed-grasp-carrier";directed.diagnostics.carina.wristGoalError=null;directed.diagnostics.carina.handFrameGoalError=.001;directed.diagnostics.carina.handFrameFitError=.002;directed.diagnostics.carina.handDirectionError=3;directed.diagnostics.carina.handDirectionGoal={origin:[0,0,0],direction:[1,0,0],probeLength:.08,iterations:2};
  assert.deepEqual(performanceFrameFailures(directed),[]);
  const palmDirection:IPerformancePoseFrame=structuredClone(directed);palmDirection.diagnostics.carina.handMode="directed-palm";assert.deepEqual(performanceFrameFailures(palmDirection),[]);
  palmDirection.diagnostics.interaction={role:"unilateral actual pulp push",failures:["Actual finite flap penetration"],observations:{}};
  assert.deepEqual(performanceFrameFailures(palmDirection),["Actual finite flap penetration"]);
  for(const key of ["handFrameGoalError","handFrameFitError","handDirectionError","handDirectionGoal"] as const){const missing:IPerformancePoseFrame=structuredClone(directed);delete missing.diagnostics.carina[key];assert.ok(performanceFrameFailures(missing).length>0);}
  const palmActive:IPerformancePoseFrame=structuredClone(frame);palmActive.diagnostics.time=8.9;palmActive.diagnostics.carina.pinchGap=null;palmActive.diagnostics.carina.pinchGoalError=null;
  assert.equal(performanceFrameFailures(palmActive).length,3);
  palmActive.diagnostics.harry.handFrameGoalError=.001;palmActive.diagnostics.harry.handFrameFitError=.002;palmActive.diagnostics.harry.handFrameRotationError=5;
  assert.deepEqual(performanceFrameFailures(palmActive),[]);
  const normalPalm:IPerformancePoseFrame=structuredClone(palmActive);normalPalm.diagnostics.harry.handMode="palm-normal";delete normalPalm.diagnostics.harry.handFrameRotationError;normalPalm.diagnostics.harry.handDirectionError=2;normalPalm.diagnostics.harry.palmNormal=[0,1,0];assert.deepEqual(performanceFrameFailures(normalPalm),[]);
  const downPalm:IPerformancePoseFrame=structuredClone(normalPalm);downPalm.diagnostics.harry.palmNormal=[0,-1,0];assert.ok(performanceFrameFailures(downPalm).some((s:string):boolean=>s.includes("not upward")));
  const missingDirection:IPerformancePoseFrame=structuredClone(normalPalm);delete missingDirection.diagnostics.harry.handDirectionError;assert.ok(performanceFrameFailures(missingDirection).length>0);
  const negativePalm:IPerformancePoseFrame=structuredClone(palmActive);negativePalm.diagnostics.harry.handFrameGoalError=-.001;negativePalm.diagnostics.harry.handFrameFitError=-.001;negativePalm.diagnostics.harry.handFrameRotationError=-1;assert.equal(performanceFrameFailures(negativePalm).length,3);
  for(const name of ["carina","harry"] as const)for(const key of ["supportError","wristGoalError"] as const){const negative:IPerformancePoseFrame=structuredClone(frame);negative.diagnostics[name][key]=-.001;assert.ok(performanceFrameFailures(negative).length>0,"negative distance: "+name+" "+key);}
  const negativePinch:IPerformancePoseFrame=structuredClone(frame);negativePinch.diagnostics.carina.pinchGoalError=-.001;assert.ok(performanceFrameFailures(negativePinch).length>0);
  const released: IPerformancePoseFrame = structuredClone(frame);
  released.diagnostics.time = 6.1; released.diagnostics.carina.pinchGap = null; released.diagnostics.carina.pinchGoalError = null;
  assert.deepEqual(performanceFrameFailures(released), []);
}
