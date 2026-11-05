import type { IPerformancePoseFrame } from "./IPerformancePoseFrame";

/**
 * Admit actual measured frame feedback independently of successful evaluation.
 * @evidence contracts/common.md#implementation-and-ownership Keeps all native unresolved statuses and applies five-millimetre support/wrist and three-millimetre actual paper-surface contact requirements. Opposing finger contacts may differ tangentially; raw pair distance remains telemetry, while finite face coverage, separating margin, normal orientation and no tab-interior intersection must pass independently through pinchValid. A zero anchor residual cannot replace these checks.
 * @evidence contracts/common.md#authoring-interface Supply one actually evaluated frame. Returns every numerical failure for that frame; empty means these explicit numerical requirements pass, not visual or collision acceptance. Pinch applies only while Carina owns the paper through the release at six seconds.
 */
export function performanceFrameFailures(frame: IPerformancePoseFrame): string[] {
  const failures: string[] = [];
  failures.push(...(frame.diagnostics.interaction?.failures??[]));
  for (const name of ["carina", "harry"] as const) {
    const value: IPerformancePoseFrame["diagnostics"][typeof name] = frame.diagnostics[name];
    if (value.support !== "admitted") failures.push(name + ": support " + value.reason);
    if (!Number.isFinite(value.supportError) || value.supportError < 0 || value.supportError > 0.005) failures.push(name + ": support distance " + value.supportError);
    if (!Number.isFinite(value.floorMinimum) || value.floorMinimum < -0.000001) failures.push(name + ": floor " + value.floorMinimum);
    if (value.wristGoalError !== null && (!Number.isFinite(value.wristGoalError) || value.wristGoalError < 0 || value.wristGoalError > 0.005)) failures.push(name + ": wrist target " + value.wristGoalError);
    if (name === "carina") {
      const actual: IPerformancePoseFrame["diagnostics"]["carina"]=frame.diagnostics.carina;
      if (actual.handMode === "rigid-grasp-carrier") {
        if (typeof actual.handFrameGoalError !== "number"||!Number.isFinite(actual.handFrameGoalError)||actual.handFrameGoalError<0||actual.handFrameGoalError>0.005) failures.push("carina: missing/failed actual rigid hand-frame target "+actual.handFrameGoalError);
        if (typeof actual.handFrameFitError !== "number"||!Number.isFinite(actual.handFrameFitError)||actual.handFrameFitError<0||actual.handFrameFitError>0.005) failures.push("carina: missing/failed reference grasp fit "+actual.handFrameFitError);
        if (typeof actual.handFrameRotationError !== "number"||!Number.isFinite(actual.handFrameRotationError)||actual.handFrameRotationError<0||actual.handFrameRotationError>20) failures.push("carina: missing/failed actual hand-frame orientation "+actual.handFrameRotationError);
        const goal: typeof actual.handFrameGoal = actual.handFrameGoal;
        if (!goal||!Array.isArray(goal.origin)||!Array.isArray(goal.rotation)||goal.origin.length!==3||goal.rotation.length!==4||![...goal.origin,...goal.rotation].every(Number.isFinite)||Math.abs(goal.rotation.reduce((sum:number,v:number):number=>sum+v*v,0)-1)>1e-6||!Number.isSafeInteger(goal.iterations)||goal.iterations<0||goal.iterations>16) failures.push("carina: missing/invalid rigid carrier goal receipt");
      } else if((actual.handMode==="directed-grasp-carrier"||actual.handMode==="directed-palm")) {
        for(const [label,value,limit] of [["position",actual.handFrameGoalError,.005],["fit",actual.handFrameFitError,.005],["heading",actual.handDirectionError,25]] as const)if(typeof value!=="number"||!Number.isFinite(value)||value<0||value>limit)failures.push("Carina: actual directed grasp "+label+" "+value);
        const goal:typeof actual.handDirectionGoal=actual.handDirectionGoal;
        if(!goal||!Array.isArray(goal.origin)||goal.origin.length!==3||!Array.isArray(goal.direction)||goal.direction.length!==3||![...goal.origin,...goal.direction].every(Number.isFinite)||Math.abs(goal.direction.reduce((sum:number,x:number):number=>sum+x*x,0)-1)>1e-6||goal.probeLength!==.08||!Number.isSafeInteger(goal.iterations)||goal.iterations<0||goal.iterations>16)failures.push("Carina: missing/invalid directed grasp goal");
      } else if (actual.handMode === "wrist") {
        if (actual.wristGoalError===null) failures.push("carina: wrist mode requires its actual goal receipt");
      } else failures.push("carina: missing/unknown hand goal mode");
    }
    if(name==="harry"&&frame.diagnostics.time>6.2) {
      const h:typeof frame.diagnostics.harry=frame.diagnostics.harry;
      if(typeof h.handFrameGoalError!=="number"||!Number.isFinite(h.handFrameGoalError)||h.handFrameGoalError<0||h.handFrameGoalError>.005)failures.push("Harry: actual palm-frame position "+h.handFrameGoalError);
      if(typeof h.handFrameFitError!=="number"||!Number.isFinite(h.handFrameFitError)||h.handFrameFitError<0||h.handFrameFitError>.005)failures.push("Harry: actual palm-frame fit "+h.handFrameFitError);
      if(h.handMode==="palm-normal"){
        if(typeof h.handDirectionError!=="number"||!Number.isFinite(h.handDirectionError)||h.handDirectionError<0||h.handDirectionError>20)failures.push("Harry: actual supporting-palm normal "+h.handDirectionError);
        if(!h.palmNormal||h.palmNormal.length!==3||!h.palmNormal.every(Number.isFinite)||Math.abs(h.palmNormal.reduce((s:number,v:number):number=>s+v*v,0)-1)>1e-6||h.palmNormal[1]!<.95)failures.push("Harry: actual original palm is not upward");
      }else if(typeof h.handFrameRotationError!=="number"||!Number.isFinite(h.handFrameRotationError)||h.handFrameRotationError<0||h.handFrameRotationError>20)failures.push("Harry: actual palm-frame orientation "+h.handFrameRotationError);
    }
    if (value.clamps.length !== 0) failures.push(name + ": requested clinical controls clamped");
  }
  if (frame.diagnostics.time <= 6) {
    const value: IPerformancePoseFrame["diagnostics"]["carina"] = frame.diagnostics.carina;
    if (value.pinchGap === null || !Number.isFinite(value.pinchGap) || value.pinchGap <= 0) failures.push("Carina: invalid actual contact-point distance " + value.pinchGap);
    if (value.pinchGoalError === null || !Number.isFinite(value.pinchGoalError) || value.pinchGoalError < 0 || value.pinchGoalError > 0.003) failures.push("Carina: grip target " + value.pinchGoalError);
    if (value.pinchValid !== true) failures.push("Carina: finite paper grasp not admitted");
  }
  return failures;
}
