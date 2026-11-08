import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import * as THREE from "three";
import { AutoMovieHumanRigControls } from "@automovie/human";

import { inspectGraspModel } from "../../../src/inspectGraspModel";
import { createHumanHandContacts } from "../../../src/createHumanHandContacts";
import { createHumanPerformer } from "../../../src/createHumanPerformer";
import { sampleWalkingApproach } from "../../../src/sampleWalkingApproach";
import { measurePaperContact } from "../../../src/measurePaperContact";
import { paperGripThickness } from "../../../src/paperGripThickness";
import { createHumanSupport } from "../../../src/createHumanSupport";
import { fitHumanSurfaceContact } from "../../../src/fitHumanSurfaceContact";

/**
 * Exercise both actual commissioned Human models, hands and complete support.
 * @evidence contracts/testing.md#observable-behavior Builds the real female1.70m and male1.76m actors with foot/neck exterior and school shoes, checks complete source projection, anatomical palm hemisphere, actual grip residuals and original-triangle honestly distinguished radial-key/palmar pad addresses within the distal65–85percent segment interval, rigid-root contact covariance and cold/cached support with changed upper-body pose, knee-length skirt/robe bounds and body-frame cloth invariance under changed scene roots. Collects all cast/side failures before one assertion. The real shoe vertices must move under an unclamped three-degree Subtalar inversion, detecting a shoe attached above that joint. The three distinct original landing arrangements cover all fourteen failed pause frames, requiring real support/floor admission and fixed root XZ without copying the old failed outputs. This is CPU integration; delivered pixel visibility and continuous movement remain actual Viewer/Render duties.
 * @evidence contracts/testing.md#independent-cases Cast stature/sex are canonical inputs, not fitted output expectations. The source radial/middle-hand span defines the palmar hemisphere; actual emitted geometry must retain every foot course without altered coordinates. Three-millimetre grip, five-millimetre support and one-micrometre floor criteria come from the movie/public admission. Root translation/rotation must carry the same contact rigidly. Unchanged feet under a neck-only change independently require identical support state; a single periodic skirt must retain shared seam vertices under asymmetric legs and reach must match an explicit application of its complete returned FK; canonical knee-length hems must remain within5cm of the knee, and the same actual FK must yield exactly identical garment-local vertices under a changed scene root.
 */
export function test_human_contact_support(): void {
  const errors: string[] = [];
  const observations:unknown[]=[];
  assert.equal(createHash("sha256").update(readFileSync(new URL("../../../src/createHumanPerformer.ts",import.meta.url))).digest("hex"),"680d3aace4ea73765bec5a1b730f38e5b8ff6aa3cf5f3199770881d0cc0b30db");
  for (const female of [true, false]) {
    let actor: ReturnType<typeof createHumanPerformer> | undefined;
    let support: ReturnType<typeof createHumanSupport> | undefined;
    try {
      actor = createHumanPerformer({ female, stature: female ? 1.7 : 1.76, houseColor: female ? 0x23553e : 0x7d2830 });
      assert.ok(actor.model.vertices > 0 && actor.model.footSamples > 0);
      assert.equal(actor.model.maximumFootProjectionError, 0);
      for(const side of ["left","right"] as const){
        const material=actor.feet[side].vertices;
        assert.ok(material.every((p):boolean=>p.bone===side+"Subtalar"),"the real shoe must share its actual hindfoot carrier");
        const shoe:THREE.Object3D|undefined=actor.drawing.bones.get(side+"Subtalar")!.children.find((item:THREE.Object3D):boolean=>item instanceof THREE.Mesh&&item.geometry instanceof THREE.BoxGeometry);
        assert.ok(shoe instanceof THREE.Mesh&&shoe.geometry instanceof THREE.BoxGeometry,"the rendered shoe must use the same actual carrier");
        const positions:THREE.BufferAttribute=shoe.geometry.getAttribute("position") as THREE.BufferAttribute;
        assert.equal(positions.count,material.length);
        actor.pose({});
        actor.object.updateMatrixWorld(true);
        const before:THREE.Vector3[]=material.map((_,i):THREE.Vector3=>shoe.localToWorld(new THREE.Vector3().fromBufferAttribute(positions,i)));
        const legs:NonNullable<Parameters<typeof actor.pose>[0]["legs"]>={left:{},right:{}};
        legs[side]={foot:{subtalarInversion:3}};
        const moved:ReturnType<typeof actor.pose>=actor.pose({legs});
        actor.object.updateMatrixWorld(true);
        assert.equal(moved.clamped.length,0);
        const displacement:number=Math.max(...material.map((p,i):number=>{
          const displayed:THREE.Vector3=shoe.localToWorld(new THREE.Vector3().fromBufferAttribute(positions,i));
          const described:THREE.Vector3=actor!.object.localToWorld(actor!.point(p.bone,p.localPoint));
          assert.ok(displayed.distanceTo(described)<1e-8,"display and original support witness must share the actual carrier transform");
          return displayed.distanceTo(before[i]!);
        }));
        assert.ok(displacement>.0001,"actual three-degree hindfoot inversion must move the rigid shoe's displayed material");
        actor.pose({});
      }

      for (const side of ["left", "right"] as const) {
        try {
          observations.push({phase:"coherent-actual-factory-before-grasp",female,side,parameters:structuredClone(actor.parameters),model:structuredClone(actor.model),evaluatorRest:structuredClone(actor.evaluate({}).bones),identity:inspectGraspModel(actor,side)});
          const contact: ReturnType<typeof createHumanHandContacts> = createHumanHandContacts(actor, side);
          const point: (suffix: string) => THREE.Vector3 = (suffix: string): THREE.Vector3 => new THREE.Vector3(...actor!.neutral.bones.find((bone): boolean => bone.bone === side + suffix)!.position);
          const radial: THREE.Vector3 = point("IndexProximal").sub(point("LittleProximal"));
          const along: THREE.Vector3 = point("MiddleProximal").sub(point("Hand"));
          const localNormal: THREE.Vector3 = radial.cross(along).normalize().multiplyScalar(side === "left" ? 1 : -1);
          const handFrame: THREE.Group = actor.drawing.bones.get(side + "Hand")!;
          actor.object.updateMatrixWorld(true);
          const expectedNormal: THREE.Vector3 = localNormal.transformDirection(handFrame.matrixWorld);
          assert.ok(contact.palm().normal.dot(expectedNormal) > 0);
          const grip: ReturnType<typeof contact.pinch> = contact.pinch({});
          const base: THREE.Mesh = new THREE.Mesh(new THREE.BoxGeometry(0.012,0.008,paperGripThickness));
          base.position.copy(grip.point); base.quaternion.copy(grip.rotation);
          const skin: THREE.Mesh[] = [...actor.drawing.parts].filter(([id]): boolean => id.startsWith(side) && /Hand|Index|Thumb|Middle|Ring|Little/.test(id)).map(([,mesh]): THREE.Mesh => mesh);
          try {
            const measured: ReturnType<typeof measurePaperContact> = measurePaperContact(base,grip,skin);
            const preparation: ReturnType<typeof contact.preparation>=contact.preparation();
            const feasible: boolean=preparation.candidates.some((candidate): boolean=>Object.values(candidate.constraints).every(Boolean));
            observations.push({female,side,preparation,measured});
            assert.equal(preparation.candidates.length,1);
            assert.equal(preparation.valid,feasible);
            for(const candidate of preparation.candidates) {
              assert.equal(candidate.fit.request.channels?.length,9,"both original finger chains participate");
              assert.ok(candidate.fit.request.channels?.some((channel):boolean=>channel.includes(".index.")));
              assert.ok(candidate.fit.request.channels?.some((channel):boolean=>channel.includes(".thumb.")));
              assert.equal(candidate.fit.request.targets.length,2,"distinct actual material targets, not an auxiliary normal pretending to be skin");
              assert.equal(candidate.fit.request.constraints?.length,8);
              assert.equal(candidate.constraints.nativeOriginalTargetsReached,candidate.fit.error<=0.0007);
              assert.equal(candidate.constraints.nativeFiniteFaceIntervals,candidate.fit.constraintsSatisfied);
              assert.ok(candidate.fit.directionProbe.purpose.includes("not a material contact"));
            }
            for(const candidate of preparation.candidates) for(const material of [candidate.material.index,candidate.material.thumb]) {
              const bone=actor.neutral.bones.find((b): boolean=>b.bone===material.bone)!;
              const end=bone.tip??actor.neutral.bones.find((b): boolean=>b.parent===bone.bone)!.position;
              const span: THREE.Vector3=new THREE.Vector3(...end).sub(new THREE.Vector3(...bone.position));
              const fraction: number=new THREE.Vector3(...material.local).dot(span.clone().normalize())/span.length();
              assert.ok(fraction>=0.65&&fraction<=0.85,"actual source patch must exclude joint seams");
              const sourcePalmar: THREE.Vector3=point("IndexProximal").sub(point("LittleProximal")).cross(point("MiddleProximal").sub(point("Hand"))).normalize().multiplyScalar(side==="left"?1:-1);
              const axis: THREE.Vector3=span.clone().normalize();
              const volar: THREE.Vector3=sourcePalmar.clone().addScaledVector(axis,-sourcePalmar.dot(axis)).normalize();
              const agreement: number=new THREE.Vector3(...material.normal).dot(volar);
              assert.ok(Math.abs(agreement-material.palmarAgreement)<1e-9,"palmar agreement remains honest for radial key contact");
              const radialSide:THREE.Vector3=point("IndexProximal").sub(point("LittleProximal")).normalize();radialSide.addScaledVector(axis,-radialSide.dot(axis)).normalize();
              const actualSite:number=material.siteRole==="radial-side"?new THREE.Vector3(...material.normal).dot(radialSide):agreement;
              assert.ok(actualSite>.25&&Math.abs(actualSite-material.siteAgreement)<1e-9);
              assert.equal(material.siteRole,female&&material.bone.includes("Index")?"radial-side":"palmar-pulp");
              const mesh: THREE.Mesh=actor.drawing.parts.get(material.bone)!;
              const positions: THREE.BufferAttribute=mesh.geometry.getAttribute("position") as THREE.BufferAttribute;
              const indices: THREE.BufferAttribute|null=mesh.geometry.getIndex();
              const vertices: THREE.Vector3[]=[0,1,2].map((n: number): THREE.Vector3=>new THREE.Vector3().fromBufferAttribute(positions,indices?indices.getX(material.triangle*3+n):material.triangle*3+n));
              const triangle: THREE.Triangle=new THREE.Triangle(vertices[0]!,vertices[1]!,vertices[2]!);
              const local: THREE.Vector3=new THREE.Vector3(...material.local);
              assert.ok(Number.isSafeInteger(material.triangle)&&triangle.closestPointToPoint(local,new THREE.Vector3()).distanceTo(local)<1e-9,"recorded pad must lie on its original triangle");

            }
            assert.ok(preparation.candidates.every((candidate): boolean=>Object.keys(candidate.constraints).length===15&&candidate.measured.triangleCoverage.length===skin.length));
            assert.ok(grip.valid&&grip.error<=0.003&&measured.valid,"complete original-hand finite grasp: "+JSON.stringify({grip:{valid:grip.valid,gap:grip.gap,error:grip.error},measured,preparation}));

          } finally {base.geometry.dispose();(base.material as THREE.Material).dispose();}
          const before: THREE.Vector3 = contact.palm().point;
          const material:ReturnType<typeof contact.preparation>["candidates"][number]["material"]["index"]=contact.preparation().candidates[0]!.material.index;
          const originalPoint:[number,number,number]=[material.local[0]!,material.local[1]!,material.local[2]!];
          const originalNormal:[number,number,number]=[material.normal[0]!,material.normal[1]!,material.normal[2]!];
          const surface:ReturnType<typeof fitHumanSurfaceContact>=fitHumanSurfaceContact(actor,grip.pose,side,{bone:material.bone,point:originalPoint,normal:originalNormal},{point:actor.object.localToWorld(actor.point(material.bone,originalPoint)),normal:new THREE.Vector3(...originalNormal).transformDirection(actor.drawing.bones.get(material.bone)!.matrixWorld)});
          assert.ok(surface.result.error<=.003&&surface.positionError<=.003&&surface.normalError<=1e-4,"already feasible original material point/normal must survive public world/body fitting");
          assert.equal(surface.request.targets.length,2);assert.equal(surface.request.channels?.length,10);
          assert.equal(surface.result.output.clamped.length,0);
          const cone:ReturnType<typeof fitHumanSurfaceContact>=fitHumanSurfaceContact(actor,surface.result.pose,side,{bone:material.bone,point:originalPoint,normal:originalNormal},{point:surface.point,normal:surface.normal,normalMinimum:.3,tolerance:.0007});
          assert.equal(cone.request.targets.length,1);assert.equal(cone.request.constraints?.length,1);assert.equal(cone.request.tolerance,.0007);
          assert.equal(cone.result.constraintsSatisfied,true);assert.ok(cone.result.error<=.0007);assert.ok(cone.result.constraintValues[0]!.value>=.003);
          const fixedActor:ReturnType<typeof createHumanPerformer>=actor;
          assert.throws(()=>fitHumanSurfaceContact(fixedActor,surface.result.pose,side,{bone:material.bone,point:originalPoint,normal:originalNormal},{point:surface.point,normal:surface.normal,normalMinimum:1.01}));
          const fixed:ReturnType<typeof contact.carrierFrame>=contact.carrierFrame();
          actor.object.position.set(2, 0.1, -1); actor.object.rotation.y = 0.4; actor.object.updateMatrixWorld(true);
          assert.ok(contact.palm().point.distanceTo(before.clone().applyMatrix4(actor.object.matrixWorld)) < 1e-10);
          const actualBeak:THREE.Vector3=new THREE.Vector3(.018,.09,0);
          const heading:THREE.Vector3=actualBeak.clone().normalize().applyQuaternion(fixed.rotation).transformDirection(actor.object.matrixWorld);
          const expectedOrigin:THREE.Vector3=fixed.point.clone().applyMatrix4(actor.object.matrixWorld);
          const aimed:ReturnType<typeof contact.aim>=contact.aim(grip.pose,expectedOrigin,heading,actualBeak);
          assert.ok(aimed.error<=.005&&aimed.output.clamped.length===0,"world/body heading request must preserve an already feasible actual frame");
          const originalEvaluation:ReturnType<typeof actor.evaluate>=actor.evaluate(grip.pose);
          for(const digit of ["index","thumb","middle","ring","little"] as const)for(const channel of AutoMovieHumanRigControls.chain({region:"finger",side,digit}))assert.equal(AutoMovieHumanRigControls.readApplied(aimed.pose,channel,aimed.output.clamped),AutoMovieHumanRigControls.readApplied(grip.pose,channel,originalEvaluation.clamped),"all actual clinical finger values remain fixed, including omitted neutral zero");
          assert.ok(contact.carrierFrame().point.distanceTo(expectedOrigin)<=.005);
        } catch (error: unknown) { errors.push((female ? "female" : "male") + " " + side + ": " + String(error)); }
        actor.object.position.set(0,0,0); actor.object.quaternion.identity(); actor.pose({});
      }
      if (female) {
        const skirt: THREE.Object3D | undefined = actor.drawing.object.getObjectByName("closed-skirt-wrap");
        const robe: THREE.Object3D | undefined = actor.drawing.object.getObjectByName("left-robe-half-wrap");
        assert.ok(skirt instanceof THREE.Mesh && robe instanceof THREE.Mesh);
        const knee: THREE.Group = actor.drawing.bones.get("leftLowerLeg")!;
        actor.object.updateMatrixWorld(true);
        const kneeHeight: number = knee.getWorldPosition(new THREE.Vector3()).y;
        assert.ok(Math.abs(new THREE.Box3().setFromObject(skirt, true).min.y - kneeHeight) < 0.05);
        assert.ok(Math.abs(new THREE.Box3().setFromObject(robe, true).min.y - kneeHeight) < 0.05);
        const before: number = new THREE.Box3().setFromObject(skirt, true).max.x;
        const posed: Parameters<typeof actor.pose>[0] = { legs: { left: { hip: { flexion: 45 }, knee: { flexion: 70 } }, right: { hip: { flexion: 45 }, knee: { flexion: 70 } } } };
        actor.pose(posed);
        assert.ok(new THREE.Box3().setFromObject(skirt, true).max.x > before + 0.1);
        // One closed ring shares seam vertices even when only the left thigh bends.
        actor.pose({ legs: { left: { hip: { flexion: 50 }, knee: { flexion: 80 } }, right: {} } });
        assert.equal((skirt.geometry.getAttribute("position") as THREE.BufferAttribute).count, 48);
        const indices: THREE.BufferAttribute = skirt.geometry.getIndex()!;
        for (let tier: number = 0; tier < 2; tier++) {
          const rows: number[] = Array.from(indices.array).slice(tier * 96, (tier + 1) * 96);
          const wrap: boolean = Array.from({length:rows.length / 3}, (_: unknown,n: number): number[] => rows.slice(n*3,n*3+3)).some((triangle: number[]): boolean => triangle.includes(tier * 16) && triangle.includes(tier * 16 + 15));
          assert.ok(wrap, "one actual triangle must contain both periodic wrap endpoints");
        }
        actor.pose({}); // The reach input below has unapplied asymmetric legs.
        const target: [number,number,number] = actor.point("rightHand").add(new THREE.Vector3(0.02,0.02,0)).toArray();
        const reached: ReturnType<typeof actor.reach> = actor.reach({ legs: { left: { hip: { flexion: 50 }, knee: { flexion: 80 } }, right: {} } }, "right", target);
        const viaReach: number[] = Array.from((skirt.geometry.getAttribute("position") as THREE.BufferAttribute).array);
        actor.pose(reached.pose);
        assert.deepEqual(Array.from((skirt.geometry.getAttribute("position") as THREE.BufferAttribute).array), viaReach, "reach must update garments from its returned complete FK");
        actor.pose(posed);
        const saved: number[] = Array.from((skirt.geometry.getAttribute("position") as THREE.BufferAttribute).array);
        actor.object.position.set(1, 0.25, -3); actor.object.rotation.y = 0.9; actor.pose(posed);
        assert.deepEqual(Array.from((skirt.geometry.getAttribute("position") as THREE.BufferAttribute).array), saved);
        actor.object.position.set(0,0,0); actor.object.quaternion.identity(); actor.pose({});
      }
      support = createHumanSupport(actor);
      const feet: { left: THREE.Vector3; right: THREE.Vector3 } = { left: support.rest.left.clone(), right: support.rest.right.clone() };
      feet.left.y = 0; feet.right.y = 0;
      const first: ReturnType<typeof support.place> = support.place({}, [0,0,0], 0, feet);
      const cached: ReturnType<typeof support.place> = support.place({ neck: { atlantoAxial: { rotation: 10 } } }, [0,0,0], 0, feet);
      assert.equal(first.status, "admitted"); assert.equal(cached.status, "admitted");
      assert.ok(first.floorMinimum >= -1e-6 && cached.floorMinimum >= -1e-6);
      assert.deepEqual(first.root, cached.root); assert.deepEqual(first.pose.legs, cached.pose.legs);
      assert.equal(cached.pose.neck?.atlantoAxial?.rotation, 10);
      const swing: ReturnType<typeof sampleWalkingApproach> = sampleWalkingApproach({ seconds: 0.5, begin: 0, end: 4, start: new THREE.Vector3(), finish: new THREE.Vector3(0.8,0,0), yaw: 0, steps: 4, rest: support.rest });
      const moved: ReturnType<typeof support.place> = support.place({}, swing.root.toArray(), 0, swing.feet);
      assert.equal(moved.status, "admitted", "actual stance/swing support: " + JSON.stringify({ error: moved.error, reason: moved.reason }));
      assert.ok(moved.floorMinimum >= -1e-6);
      const roles:ReturnType<typeof support.place>=support.place({},swing.root.toArray(),0,swing.feet,{headings:{left:0,right:0},swing:swing.swing,kneeSeed:8,contacts:{left:swing.swing==="left"?"air":"toe",right:swing.swing==="right"?"air":"toe"}});
      assert.equal(roles.status,"admitted","actual original toe/air supports retain all-foot floor: "+JSON.stringify({error:roles.error,reason:roles.reason}));
      assert.equal(roles.root.translation[0],swing.root.x);assert.equal(roles.root.translation[2],swing.root.z);assert.ok(roles.floorMinimum>=-1e-6);
      const turning:ReturnType<typeof support.place>=support.place({},[0,0,0],.08,feet,{headings:{left:0,right:0},swing:null});
      assert.equal(turning.status,"admitted","body may turn while both original planted sole headings remain fixed: "+JSON.stringify({error:turning.error,reason:turning.reason}));
      assert.ok(turning.floorMinimum>=-1e-6);
      if(female){
        // Three distinct recorded landing arrangements account for all14 failed
        // actual frames. Expected admission comes from physical5mm support and
        // full-foot floor, not from copying the old failed numerical outputs.
        const entryLegs:NonNullable<Parameters<typeof actor.pose>[0]["legs"]>={"left":{"hip":{"flexion":-12.156737121306922,"abduction":-0.01662782348974887,"rotation":-0.4965648091953429},"knee":{"flexion":1.0849513621059625,"rotation":-0.29789403038677603},"ankle":{"dorsiflexion":13.249999132698107},"foot":{"subtalarInversion":-0.000014632481090437043,"midfootSupination":-0.000006403480994508366}},"right":{"hip":{"flexion":16.591857541595445,"abduction":-0.2002511452660719,"rotation":1.2656167937171858},"knee":{"flexion":7.539084929973721,"rotation":-0.22339334476555367},"ankle":{"dorsiflexion":-9.152231463542165},"foot":{"subtalarInversion":-0.000017000016109528316,"midfootSupination":-0.000008053555127571814}}};
        const landings:{index:number;root:[number,number,number];yaw:number;feet:{left:[number,number,number];right:[number,number,number]};headings:{left:number;right:number};contacts:{left:"flat"|"toe";right:"flat"|"toe"}}[]=[{"index":245,"root":[4.319358341574264,-0.012433688839964055,0.8775421848453304],"yaw":-2.3,"feet":{"left":[4.219208460869132,0,0.7788362088950121],"right":[4.375176121018999,0,1.0819598932195433]},"headings":{"left":-2.15,"right":-2.3},"contacts":{"left":"toe","right":"flat"}},{"index":262,"root":[4.322679084456956,-0.012433688839964055,1.0557585445778386],"yaw":-2.5,"feet":{"left":[4.205674698724695,0,1.1242586745675336],"right":[4.375176121018999,0,1.0819598932195433]},"headings":{"left":-2.5,"right":-2.3},"contacts":{"left":"flat","right":"toe"}},{"index":279,"root":[4.292632020660165,-0.012433688839964055,1.3331761618340914],"yaw":-2.8,"feet":{"left":[4.205674698724695,0,1.1242586745675336],"right":[4.289898468944825,0,1.6133549536153564]},"headings":{"left":-2.5,"right":-2.8},"contacts":{"left":"toe","right":"flat"}}];
        for(const landing of landings){
          const result:ReturnType<typeof support.place>=support.place({legs:entryLegs},landing.root,landing.yaw,{left:new THREE.Vector3(...landing.feet.left),right:new THREE.Vector3(...landing.feet.right)},{headings:landing.headings,contacts:landing.contacts,swing:null,kneeSeed:8});
          observations.push({scope:"landing-recovery",index:landing.index,request:landing,result:{status:result.status,error:result.error,floor:result.floorMinimum,root:result.root,legs:result.pose.legs}});
          if(result.status!=="admitted"||result.error>.005||result.floorMinimum< -1e-6||result.root.translation[0]!==landing.root[0]||result.root.translation[2]!==landing.root[2])errors.push("Carina landing "+landing.index+": "+JSON.stringify({error:result.error,floor:result.floorMinimum,root:result.root,reason:result.reason}));
        }
      }

    } catch (error: unknown) { errors.push((female ? "female" : "male") + ": " + String(error)); }
    finally { support?.clearCache(); actor?.dispose(); }
  }
  const output:URL=new URL("../../../.cache/video-production/grasp-integration/"+new Date().toISOString().replace(/[:.]/g,"-")+"/",import.meta.url);
  mkdirSync(output,{recursive:true});writeFileSync(new URL("four-hand-cpu.json",output),JSON.stringify({observations,errors},null,2));
  console.log("Actual four-hand integration receipt: "+new URL("four-hand-cpu.json",output).href);
  assert.deepEqual(errors, []);
}
