import assert from "node:assert/strict";
import * as THREE from "three";
import { placePaperOnPalm } from "../../../src/placePaperOnPalm";
/**
 * Distinguish a finite underside resting on original material from a centre embedded in skin.
 * @evidence contracts/testing.md#observable-behavior Uses independent flat source geometry and a finite 0.8mm paper box to require actual bottom-face support without interior overlap. A second closed solid enclosing the paper must fail despite unchanged zero anchor error; a non-upward palm must fail separately. Resources retire after all observations. Human carrying and moving output remain separate integration duties.
 * @evidence contracts/testing.md#independent-cases A 10mm thick palm with a 12x8x0.8mm base establishes an analytic top plane. The expected base centre is exactly half the paper thickness above that plane. The obstacle is a real enclosing box, rather than mocked numerical feedback. No generated Human geometry is replaced in production.
 */
export function test_palm_support():void {
  const root:THREE.Group=new THREE.Group();
  const base:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.012,.008,.0008));root.add(base);
  const palm:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.04,.04,.01));
  const q:THREE.Quaternion=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2);palm.quaternion.copy(q);
  const frame:{point:THREE.Vector3;normal:THREE.Vector3;rotation:THREE.Quaternion}={point:new THREE.Vector3(0,.005,0),normal:new THREE.Vector3(0,1,0),rotation:q};
  const obstacle:THREE.Mesh=new THREE.Mesh(new THREE.BoxGeometry(.03,.03,.03));obstacle.position.set(0,.0054,0);
  try {
    const contact:ReturnType<typeof placePaperOnPalm>=placePaperOnPalm(root,base,frame,palm,[palm]);
    assert.ok(contact.valid,JSON.stringify(contact));
    assert.ok(Math.abs(contact.centre.y-.0054)<1e-9);assert.ok(Math.abs(contact.bottom.y-.005)<1e-9);
    assert.ok(Math.abs(contact.support.y-.005)<1e-9&&contact.supportNormal.y>.99);
    const blocked:ReturnType<typeof placePaperOnPalm>=placePaperOnPalm(root,base,frame,palm,[palm,obstacle]);
    assert.ok(blocked.anchorError<1e-9);assert.equal(blocked.valid,false);assert.ok(blocked.volume.containments>0&&!blocked.volume.independentOutside);
    const tilted:ReturnType<typeof placePaperOnPalm>=placePaperOnPalm(root,base,{...frame,normal:new THREE.Vector3(1,0,0)},palm,[palm]);assert.equal(tilted.valid,false);
  } finally {for(const mesh of [base,palm,obstacle]){mesh.geometry.dispose();(mesh.material as THREE.Material).dispose();}root.clear();}
}
