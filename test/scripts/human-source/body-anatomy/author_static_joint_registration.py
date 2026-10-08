"""Author static shared-atlas bone operators against an identified native neutral.

From the repository root:
  python test/scripts/human-source/body-anatomy/author_static_joint_registration.py TARGET_WITNESS NEW_OPERATOR_FILE

This is source adaptation, not a public pose, ROM, clinical joint-centre fit or
an individual reconstruction. Paired acquired vertices define authored joint
references; native basis labels define target rig spans. Two-anchor spans use
positive axial scales under the existing minimum proper rotation convention.
Public flexion references are not atlas anatomical roll correspondences.
Shared three/four-anchor junctions use positive affine
frames, preserving every owned anchor rather than compensating each bone.
Bones without direct native slots
inherit their declared source-composition segment operator. No bounding box is
fitted, no mesh is edited and no target is synthesized when its label is absent.

All atlas inputs are metres +X left/+Y up/+Z forward. Each output owns both the
atlas-to-target and old-canonical-to-target affine forms, so the consumer never
reapplies the old common translation. The same A maps geometry, sites and vector
fields; normals use inverse(A).T. Additional joint-site disagreement is measured,
not concealed as biological contact. Source-frame witness admission is separate
from model, Float32, skin clearance and hardware-render acceptance.
"""
import argparse
import hashlib
import json
import platform
import sys
from pathlib import Path

import numpy as np
import scipy
from scipy.spatial.transform import Rotation

from bone_registration import shortest_rotation

ROOT = Path(__file__).resolve().parents[4]
HERE = ROOT / '.references/bodyparts3d'
BODY = ROOT / '.references/human-source-resume-20261006/authored-body'
ARTIFACTS = ROOT / '.wiki/08-campaigns/2707-human/artifacts/all-parts'


def sha(data):
    return hashlib.sha256(data).hexdigest()


def xyz(value):
    point = np.asarray([value[key] for key in ('x', 'y', 'z')] if isinstance(value, dict) else value, dtype=float)
    if point.shape != (3,) or not np.all(np.isfinite(point)):
        raise ValueError('Registration point needs finite complete XYZ coordinates')
    return point


def span_operator(source_start, source_end, target_start, target_end):
    """Match paired joint spans by minimum proper rotation and positive axial scale.

    The native joint reference defines performance and skin-binding axes, not
    a homologous anatomical direction on the atlas. Neutral source adaptation
    therefore uses the existing minimum-rotation convention instead of aligning
    that flexion reference with the atlas anterior axis. This leaves axial roll
    at the convention's neutral, not at a measured anatomical orientation.
    Opposed directions retain the rotation owner's refusal rather than selecting
    an unobserved axis. The common metre frames and both paired anchors survive.
    """
    direction = source_end-source_start
    target_direction = target_end-target_start
    source_length = float(np.linalg.norm(direction))
    target_length = float(np.linalg.norm(target_direction))
    if not np.isfinite([source_length,target_length]).all() or min(source_length,target_length) <= 1e-12:
        raise ValueError('Registration requires finite nonzero source and target spans')
    unit = direction/source_length
    rotation = shortest_rotation(direction,target_direction)
    scale = target_length/source_length
    affine = rotation @ (np.eye(3)+(scale-1)*np.outer(unit,unit))
    translation = target_start-affine@source_start
    if not np.isfinite(scale) or scale <= 0 or not np.all(np.isfinite(affine)):
        raise ValueError('Registration needs a finite positive axial scale')
    residual = max(np.linalg.norm(affine@source_start+translation-target_start),
                   np.linalg.norm(affine@source_end+translation-target_end))
    if residual > 1e-9 or abs(np.linalg.det(rotation)-1) > 1e-10:
        raise ValueError('Registration failed its endpoint/proper-rotation construction')
    return affine, translation, rotation, scale, source_length, target_length, float(residual)


def anchor_affine(source_points, target_points):
    """Three anchors complete an oriented unit-normal frame; four define a volume.

    Affine interpolation maps every supplied anchor exactly. Three noncollinear
    anchors leave the out-of-plane derivative unknown: this source convention
    maps the unit source normal to the unit target normal. Four noncoplanar
    anchors instead supply all three derivatives. Refuse degenerate frames or
    an orientation reversal; proper polar rotation describes the target rest.
    """
    def columns(points):
        edges = [point-points[0] for point in points[1:]]
        if len(points) == 3:
            normal = np.cross(edges[0],edges[1])
            length = np.linalg.norm(normal)
            if length <= 1e-12:
                raise ValueError('Shared anchor frame requires a noncollinear source/target plane')
            edges.append(normal/length)
        matrix = np.column_stack(edges)
        if matrix.shape != (3,3) or not np.isfinite(matrix).all() or np.linalg.cond(matrix) > 1e10:
            raise ValueError('Shared anchor frame requires a finite independent three-dimensional basis')
        return matrix
    source_frame,target_frame = columns(source_points),columns(target_points)
    a = target_frame @ np.linalg.inv(source_frame)
    b = target_points[0]-a@source_points[0]
    if not np.isfinite(a).all() or np.linalg.det(a) <= 0:
        raise ValueError('Shared source/target anchor frames require a positive affine determinant')
    u,_,v = np.linalg.svd(a)
    rotation = u@v
    residual = max(float(np.linalg.norm(a@source+b-target)) for source,target in zip(source_points,target_points))
    if residual > 1e-9 or np.linalg.det(rotation) <= 0:
        raise ValueError('Shared anchor affine failed its exact-boundary/proper-rotation construction')
    return a,b,rotation,residual


class Registration:
    """One owner of source joint labels, target labels and segment composition."""
    def __init__(self, parent, body_refs, upper, registration, witness):
        self.nodes = {node['id']:node for node in parent['nodes']}
        self.translation = xyz(registration['translationMetres'])
        self.references = {ref['bone']:{'point':xyz(ref['atlasReferenceMetres']),
                                      'account':ref['sourcePair']} for ref in body_refs['references']}
        for account in upper['jointAccounts']:
            ref = account['reference']
            self.references[account['bone']] = {'point':(xyz(ref['child']['world'])+xyz(ref['parent']['world']))/2,
                                                'account':ref}
        self.landmarks = witness['landmarks']
        self.targets = {joint['bone']:joint for joint in witness['sourceJointDefinitions']}
        self.targets.update({joint['bone']:joint for joint in witness['sourceToeRays']})
        self.operators, self.anchors = {}, {}

    def source(self, bone):
        if bone not in self.references:
            raise ValueError('Required paired source joint is absent: '+bone)
        return self.references[bone]['point']

    def target(self, bone, end):
        if bone not in self.targets:
            raise ValueError('Required native target slot is absent: '+bone)
        label = self.targets[bone][end]
        if label not in self.landmarks:
            raise ValueError('Required native target landmark is absent: '+label)
        return xyz(self.landmarks[label]), label

    def distal(self, bone, child=None):
        if child is not None:
            return self.source(child), {'kind':'paired-source-joint', 'bone':child}
        node = self.nodes[bone]
        origin = xyz(node['rest']['position'])
        endpoints = [site for site in node['sites'] if site['id'] in ('principalInferiorEnd', 'principalSuperiorEnd')]
        if len(endpoints) != 2:
            raise ValueError('Terminal source span has no two shaft endpoints: '+bone)
        proximal = self.source(bone)
        site = max(endpoints, key=lambda row:np.linalg.norm(origin+xyz(row['position'])-proximal))
        return origin+xyz(site['position']), {'kind':'acquired-shaft-extremum', 'bone':bone,
                                             'site':site['id'], 'account':site['account'],
                                             'qualification':'Principal source end, not an imaged distal joint centre.'}

    def add(self, owner, start, end, target, source_labels, target_points=None):
        native_start, head_label = self.target(target, 'head')
        native_end, tail_label = self.target(target, 'tail')
        first, last = (native_start, native_end) if target_points is None else target_points
        joint = self.targets[target]
        if target_points is not None:
            # Virtual composition spans consume explicit shared target points;
            # their coordinates are transported, not additional native markers.
            head_label, tail_label = source_labels['targetLabels']
        a,b,r,s,sl,tl,error = span_operator(start,end,first,last)
        self.operators[owner] = {'a':a, 'b':b, 'r':r, 'scale':s,
                                 'sourceSpan':{'startMetres':start.tolist(), 'endMetres':end.tolist(),
                                               'lengthMetres':sl, 'labels':source_labels,
                                               'neutralRollProtocol':'Minimum proper rotation of paired source/target joint spans; no measured axial-roll claim'},
                                 'targetSpan':{'startMetres':first.tolist(), 'endMetres':last.tolist(),
                                               'lengthMetres':tl, 'head':head_label, 'tail':tail_label,
                                               'nativeSlot':target,'nativePerformanceReference':self.targets[target].get('reference'),
                                               'nativeSlotAxisHead':joint['head'],'nativeSlotAxisTail':joint['tail'],
                                               'nativeSlotAxisStartMetres':native_start.tolist(),
                                               'nativeSlotAxisEndMetres':native_end.tolist(),
                                               'endpointProtocol':source_labels.get('targetProtocol','actual-native-slot-head-tail')}, 'endpointResidualMetres':error}

    def inherited(self, bone, owner, reason):
        if owner not in self.operators:
            raise ValueError('Composition segment operator unavailable: '+bone+'/'+owner)
        self.anchors[bone] = {'operatorOwner':owner, 'compositionReason':reason}

    def junction(self, owner, source_points, target_points, labels):
        a,b,r,error = anchor_affine(source_points,target_points)
        op = self.operators[owner]
        op.update({'a':a,'b':b,'r':r,'endpointResidualMetres':error,
                   'sharedAnchorFrame':{'sourceMetres':[point.tolist() for point in source_points],
                                       'targetMetres':[point.tolist() for point in target_points],
                                       'labels':labels,'positiveDeterminant':float(np.linalg.det(a)),
                                       'singularScales':np.linalg.svd(a,compute_uv=False).tolist(),
                                       'normalDerivativeProtocol':'Oriented unit normal, authored convention' if len(source_points)==3 else 'Fourth actual source/target anchor determines the normal derivative',
                                       'properRotationProtocol':'Positive affine polar rotation; stretch/shear remain in the same geometry/site operator'}})

    def build(self):
        # Pelvic members share the actual paired hip span. Lumbar, thoracic and
        # cervical sections use source intervertebral references, never the
        # covariance major axis (which often runs across a vertebra's processes).
        left,lhead = self.target('leftUpperLeg','head')
        right,rhead = self.target('rightUpperLeg','head')
        self.add('sacrum',self.source('leftFemur'),self.source('rightFemur'),'hips',
                 {'start':'leftFemur','end':'rightFemur','targetLabels':[lhead,rhead],
                  'targetProtocol':'Actual bilateral native hip heads, not the hips rig axis-tail'},(left,right))
        spine_head,spine_label = self.target('spine','head')
        self.junction('sacrum',[self.source('leftFemur'),self.source('rightFemur'),self.source('l5')],
                      [left,right,spine_head],{'source':['leftFemur','rightFemur','l5'],
                                              'target':[lhead,rhead,spine_label],
                                              'ownership':'One pelvis frame owns both hip references and the shared sacrum/L5 boundary.'})
        left_sc,left_label = self.target('leftShoulder','head')
        right_sc,right_label = self.target('rightShoulder','head')
        self.add('sternum',self.source('leftClavicle'),self.source('rightClavicle'),'leftShoulder',
                 {'start':'leftClavicle','end':'rightClavicle','targetLabels':[left_label,right_label],
                  'targetProtocol':'The two acquired sternoclavicular paired references and actual bilateral native clavicle heads own the sternum boundary span. A simplified thoracic parent axis is not a sternoclavicular attachment.'},(left_sc,right_sc))
        sections = [('thoracolumbar','l5','c7','spine'),('cervical','c7','c1','neck')]
        for owner,start,end,target in sections:
            if owner == 'thoracolumbar':
                first,first_label = self.target(target,'head')
                last,last_label = self.target('neck','head')
                self.add(owner,self.source(start),self.source(end),target,
                         {'start':start,'end':end,'targetLabels':[first_label,last_label],
                          'targetProtocol':'Actual spine head to native neck head spans the contiguous acquired lumbar/thoracic column. Simplified native spine/chest/upperChest axis-tail markers establish no individual vertebral-level correspondence.'},(first,last))
            else:
                self.add(owner,self.source(start),self.source(end),target,{'start':start,'end':end})
        for side in ('left','right'):
            own = lambda suffix:side+suffix
            wrist_bones = [own(part) for part in ('Scaphoid','Lunate','Triquetrum')]
            toe_heads = [own(ray+'ProximalPhalanx') for ray in ('Hallux','SecondToe','ThirdToe','FourthToe','FifthToe')]
            spans = [('Clavicle','Shoulder',own('Clavicle'),own('Humerus')),
                     ('Humerus','UpperArm',own('Humerus'),own('Ulna')),
                     ('Ulna','LowerArm',own('Ulna'),wrist_bones),
                     ('handSegment','Hand',wrist_bones,own('MiddleFingerProximalPhalanx')),
                     ('Femur','UpperLeg',own('Femur'),own('Tibia')),
                     ('Tibia','LowerLeg',own('Tibia'),own('Talus')),
                     ('footSegment','Foot',own('Talus'),toe_heads)]
            for suffix,target,start_label,end_label in spans:
                start = np.mean([self.source(bone) for bone in start_label],axis=0) if isinstance(start_label,list) else self.source(start_label)
                end = np.mean([self.source(bone) for bone in end_label],axis=0) if isinstance(end_label,list) else self.source(end_label)
                labels = {'start':start_label,'end':end_label,
                          'groupProtocol':'Arithmetic mean of the named source paired references where a group is present.'}
                if suffix == 'handSegment':
                    first,first_label = self.target(own('Hand'),'head')
                    last,last_label = self.target(own('MiddleProximal'),'head')
                    labels.update({'targetLabels':[first_label,last_label],
                                   'targetProtocol':'Actual wrist head to native middle-finger MCP head corresponds to the source wrist-to-MCP span; Hand axis-tail is an interior palm marker.'})
                    self.add(own(suffix),start,end,own(target),labels,(first,last))
                else:
                    self.add(own(suffix),start,end,own(target),labels)
            # Three distinct radiocarpal source pairs share the forearm's
            # targets, not a fabricated single wrist centre. The actual middle
            # MCP supplies the fourth independent anchor of the hand frame.
            forearm = self.operators[own('Ulna')]
            source_wrist = [self.source(bone) for bone in wrist_bones]
            target_wrist = [forearm['a']@point+forearm['b'] for point in source_wrist]
            middle_mcp,middle_label = self.target(own('MiddleProximal'),'head')
            self.junction(own('handSegment'),source_wrist+[self.source(own('MiddleFingerProximalPhalanx'))],
                          target_wrist+[middle_mcp],{'source':wrist_bones+[own('MiddleFingerProximalPhalanx')],
                                                   'target':['forearm-owned/'+bone for bone in wrist_bones]+[middle_label],
                                                   'ownership':'Forearm owns all three distinct radiocarpal boundary targets; hand consumes them and the actual native middle MCP.'})
            for finger in ('Thumb','Index','Middle','Ring','Little'):
                ray = finger if finger == 'Thumb' else finger+'Finger'
                stages = ('Proximal','Distal') if finger == 'Thumb' else ('Proximal','Middle','Distal')
                for at,stage in enumerate(stages):
                    bone = own(ray+stage+'Phalanx')
                    child = own(ray+stages[at+1]+'Phalanx') if at+1 < len(stages) else None
                    end,end_label = self.distal(bone,child)
                    self.add(bone,self.source(bone),end,own(finger+('Intermediate' if stage == 'Middle' else stage)),
                             {'start':bone,'end':end_label})
                meta = own('ThumbFirstMetacarpal' if finger == 'Thumb' else ray+'Metacarpal')
                distal = self.source(own(ray+'ProximalPhalanx'))
                if finger == 'Thumb':
                    self.add(meta,self.source(meta),distal,own('ThumbMetacarpal'),{'start':meta,'end':own(ray+'ProximalPhalanx')})
                    trapezium = own('Trapezium')
                    hand = self.operators[own('handSegment')]
                    carpal_target = hand['a']@self.source(trapezium)+hand['b']
                    cmc_target,cmc_label = self.target(own('ThumbMetacarpal'),'head')
                    self.add(trapezium,self.source(trapezium),self.source(meta),own('ThumbMetacarpal'),
                             {'start':trapezium,'end':meta,'targetLabels':['hand-owned/'+trapezium,cmc_label],
                              'targetProtocol':'Scaphoid/Trapezium source junction consumes its hand-owned target; Trapezium/Thumb metacarpal consumes the same actual native CMC target as the thumb metacarpal.'},(carpal_target,cmc_target))
                else:
                    hand = self.operators[own('handSegment')]
                    target_start = hand['a']@self.source(meta)+hand['b']
                    target_end,label = self.target(own(finger+'Proximal'),'head')
                    self.add(meta,self.source(meta),distal,own(finger+'Proximal'),
                             {'start':meta,'end':own(ray+'ProximalPhalanx'),
                              'targetLabels':['transported-hand/'+meta,label],
                              'targetProtocol':'Hand-owned transported proximal junction and actual native finger MCP head'},(target_start,target_end))
            for ray in ('Hallux','SecondToe','ThirdToe','FourthToe','FifthToe'):
                stages = ('Proximal','Distal') if ray == 'Hallux' else ('Proximal','Middle','Distal')
                for at,stage in enumerate(stages):
                    bone = own(ray+stage+'Phalanx')
                    child = own(ray+stages[at+1]+'Phalanx') if at+1 < len(stages) else None
                    end,end_label = self.distal(bone,child)
                    self.add(bone,self.source(bone),end,own(ray+stage),{'start':bone,'end':end_label})
                meta = own('HalluxFirstMetatarsal' if ray == 'Hallux' else ray+'Metatarsal')
                foot = self.operators[own('footSegment')]
                target_start = foot['a']@self.source(meta)+foot['b']
                target_end,label = self.target(own(ray+'Proximal'),'head')
                self.add(meta,self.source(meta),self.source(own(ray+'ProximalPhalanx')),own(ray+'Proximal'),
                         {'start':meta,'end':own(ray+'ProximalPhalanx'),
                          'targetLabels':['transported-foot/'+meta,label],
                          'targetProtocol':'Foot-owned transported proximal junction and actual native toe MTP head'},(target_start,target_end))
        for bone,node in self.nodes.items():
            if bone in self.operators:
                self.inherited(bone,bone,'Direct paired-joint/native-span source adaptation.')
            elif bone in ('sacrum','coccyx','leftCoxalBone','rightCoxalBone'):
                self.inherited(bone,'sacrum','Shared pelvic source composition.')
            elif bone[0] in 'ctl' and bone[1:].isdigit():
                owner = 'cervical' if bone[0]=='c' else 'thoracolumbar'
                self.inherited(bone,owner,'Vertebral member shares its contiguous source spinal-section operator.')
            elif bone.startswith(('leftRib','rightRib')) or bone=='sternum':
                self.inherited(bone,self.anchors[node['parent']]['operatorOwner'], 'Thoracic composition follows its declared vertebral parent.')
            else:
                side = 'left' if bone.startswith('left') else 'right'
                suffix = bone[len(side):]
                owner = side+'Clavicle' if suffix=='Scapula' else side+'Ulna' if suffix=='Radius' else side+'Femur' if suffix=='Patella' else side+'Tibia' if suffix=='Fibula' else side+'footSegment' if suffix in ('Talus','Calcaneus','Navicular','Cuboid','MedialCuneiform','IntermediateCuneiform','LateralCuneiform') else side+'handSegment'
                if suffix not in ('Scapula','Radius','Patella','Fibula','Talus','Calcaneus','Navicular','Cuboid','MedialCuneiform','IntermediateCuneiform','LateralCuneiform','Scaphoid','Lunate','Triquetrum','Pisiform','Trapezium','Trapezoid','Capitate','Hamate'):
                    raise ValueError('No explicit source-composition segment for bone: '+bone)
                self.inherited(bone,owner,'Named source member has no direct native slot; shares its girdle/shaft/hand/foot composition operator.')
        return self.packet()

    def packet(self):
        operators = []
        for bone,node in self.nodes.items():
            declaration = self.anchors[bone]
            op = self.operators[declaration['operatorOwner']]
            a,b,r = op['a'],op['b'],op['r']
            position = xyz(node['rest']['position'])
            source_quaternion = np.asarray([node['rest']['rotation'][key] for key in ('x','y','z','w')])
            if not np.isfinite(source_quaternion).all() or abs(np.dot(source_quaternion,source_quaternion)-1) > 1e-10:
                raise ValueError('Source rest must retain its finite proper rotation: '+bone)
            target_rotation = Rotation.from_matrix(r)*Rotation.from_quat(source_quaternion)
            operators.append({'bone':bone, 'parent':node['parent'], **declaration,
                              'atlasToTarget':{'linear':a.reshape(-1).tolist(),'translation':b.tolist()},
                              'canonicalToTarget':{'linear':a.reshape(-1).tolist(),
                                                   'translation':(b-a@self.translation).tolist()},
                              'normalLinearRowMajor':np.linalg.inv(a).T.reshape(-1).tolist(),
                              'positiveAxialScale':op['scale'], 'sourceSpan':op['sourceSpan'],'targetSpan':op['targetSpan'],
                              'operatorKind':'positive-shared-anchor-affine' if 'sharedAnchorFrame' in op else 'positive-axial-span',
                              'sharedAnchorFrame':op.get('sharedAnchorFrame'),
                              'endpointResidualMetres':op['endpointResidualMetres'],
                              'sourceRest':{'atlasMetres':position.tolist(),'canonicalMetres':(position+self.translation).tolist(),
                                            'rotation':node['rest']['rotation']},
                              'targetRest':{'position':dict(zip(('x','y','z'),map(float,a@position+b))),
                                            'rotation':dict(zip(('x','y','z','w'),map(float,target_rotation.as_quat())))},
                              'sourceBytes':node['sources']})
        seams = []
        for bone,reference in self.references.items():
            parent = self.nodes[bone]['parent']
            own = self.operators[self.anchors[bone]['operatorOwner']]
            upstream = self.operators[self.anchors[parent]['operatorOwner']]
            point = reference['point']
            first,last = own['a']@point+own['b'],upstream['a']@point+upstream['b']
            seams.append({'bone':bone,'parent':parent,'sourcePair':reference['account'],
                          'childTargetMetres':first.tolist(),'parentTargetMetres':last.tolist(),
                          'sharedSiteResidualMetres':float(np.linalg.norm(first-last)),
                          'qualification':'Additional joint/site discrepancy is retained; operator construction is not cartilage contact.'})
        return {'transforms':operators,'sharedJointSiteAudit':seams,
                'maximumSharedSiteResidualMetres':max(row['sharedSiteResidualMetres'] for row in seams)}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('target_witness',type=Path)
    parser.add_argument('output',type=Path)
    args = parser.parse_args()
    inputs = {'parents':BODY/'body-kinematic-parent-packet.json','bodyReferences':BODY/'body-joint-reference-packet.json',
              'upper':HERE/'upper-source-articulation.json','registration':BODY/'common-atlas-registration.json',
              'targetWitness':args.target_witness.resolve()}
    blobs = {name:path.read_bytes() for name,path in inputs.items()}
    values = {name:json.loads(data) for name,data in blobs.items()}
    names = [node['id'] for node in values['parents']['nodes']]
    if len(names) != len(set(names)):
        raise ValueError('Actual source parent graph has duplicate bone identities')
    if values['bodyReferences']['parentPacketSha256'] != sha(blobs['parents']):
        raise ValueError('Body paired-reference packet belongs to a different parent generation')
    if values['parents']['upperArticulationPacketSha256'] != sha(blobs['upper']):
        raise ValueError('Upper source articulation belongs to a different parent generation')
    if values['parents']['registrationSha256'] != sha(blobs['registration']) or values['bodyReferences']['registrationSha256'] != sha(blobs['registration']):
        raise ValueError('Actual source packets disagree on their common frame registration')
    for node in values['parents']['nodes']:
        for source in node['sources']:
            if sha((ROOT/source['uri']).read_bytes()) != source['sha256']:
                raise ValueError('Actual source bone bytes changed: '+node['id']+'/'+source['uri'])
    if len(values['targetWitness']['sourceJointDefinitions']) != 52 or len(values['targetWitness']['sourceToeRays']) != 28:
        raise ValueError('Actual native target witness must contain all 52 joint slots and 28 toe ray slots')
    registration = values['registration']
    if registration['scale'] != [1,1,1] or registration['rotationQuaternionXYZW'] != [0,0,0,1]:
        raise ValueError('Old canonical conversion must be the identified unit-preserving common translation')
    output = args.output.resolve()
    if not output.is_relative_to(ARTIFACTS):
        raise ValueError('Registration output must belong to campaign all-parts artifacts')
    result = Registration(values['parents'],values['bodyReferences'],values['upper'],registration,values['targetWitness']).build()
    if len(result['transforms']) != len(values['parents']['nodes']):
        raise ValueError('Static registration is missing actual source bone operators')
    if result['maximumSharedSiteResidualMetres'] > 1e-9:
        raise ValueError('Static registration separated an actual source shared joint boundary: '
                         + str(result['maximumSharedSiteResidualMetres']))
    result.update({'version':1,'mode':'neutral-static-source-adaptation',
                   'sourceFrame':'unregistered-common-atlas-metres,+X-left,+Y-up,+Z-forward',
                   'targetFrame':values['targetWitness']['coordinateFrame'],
                   'targetWitness':{key:values['targetWitness'][key] for key in ('generation','bodyBasis','bodyInputSha256','documentSha256','coordinateFrame','modelBuilt')},
                   'targetBodyBasis':values['targetWitness']['bodyBasis'],
                   'targetShape':values['targetWitness']['document']['body']['shape'],
                   'oldCanonicalTranslationMetres':registration['translationMetres'],
                   'inputReceipts':{name:{'uri':str(path.relative_to(ROOT)).replace('\\','/'),'sha256':sha(blobs[name])} for name,path in inputs.items()},
                   'recipeSha256':sha(Path(__file__).read_bytes()),
                   'rotationRecipeSha256':sha((Path(__file__).resolve().parent/'bone_registration.py').read_bytes()),
                   'runtime':{'pythonVersion':platform.python_version(),'executable':sys.executable,
                              'numpyVersion':np.__version__,'scipyVersion':scipy.__version__},
                   'sourceRights':{'attribution':'BodyParts3D, The Database Center for Life Science; preserve original CC-BY-SA-2.1-JP notices and official acquisition attribution.',
                                   'licenseUri':'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
                                   'geometry':'Original acquired vertices/labels preserved; these matrices are a separately identified authored generic adaptation.'},
                   'qualification':'Generic static source adaptation from paired artist references to native basis labels; no clinical joint centres, physiological motion, target skin containment or rendered acceptance established.',
                   'targetWitnessQualification':values['targetWitness'].get('qualification')})
    output.parent.mkdir(parents=True,exist_ok=True)
    encoded = json.dumps(result,indent=2,allow_nan=False).encode()
    with output.open('xb') as stream:
        stream.write(encoded)
    print(json.dumps({'output':str(output.relative_to(ROOT)), 'sha256':sha(encoded),
                      'boneOperators':len(result['transforms']),
                      'maximumSharedSiteResidualMetres':result['maximumSharedSiteResidualMetres']}))


if __name__ == '__main__':
    main()
