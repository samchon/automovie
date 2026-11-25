# src/motion/human/audit/IAutoMovieMotionHumanAuditTangleModel.ts#IAutoMovieMotionHumanAuditTangleModel.IPart

## @evidence contracts/development/common.md#meaningful-documentation

Defines the carrying bone, ordered shape/axis probes, surface prefix, metre-valued local sphere, extent and the probes' offset outside the shapes.

## @evidence contracts/development/design.md#principled-representation

Actual collider corners and along-bone points share one segment-local frame, its conservative bounding sphere, and the probes' measured offset outside the segment's own shapes, which a link pair's certificate subtracts.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: audit/AutoMovieMotionHumanAuditTangleModel.ts (AutoMovieMotionHumanAuditTangleModel.build, parts); posture/HumanArmFrame.ts; posture/HumanLinkCertificate.ts; actions/walkLegCapsules.ts; touch/touchHold.ts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No probe is invented from a scene, no physical radius is padded and surface/axis ownership stays explicit.

# src/motion/human/audit/IAutoMovieMotionHumanAuditTangleModel.ts#IAutoMovieMotionHumanAuditTangleModel.IModel

## @evidence contracts/development/common.md#meaningful-documentation

States ordered parts, own-body exclusions, the two actual reference placements and the ordered-pair reference depths with their index.

## @evidence contracts/development/design.md#principled-representation

A body's actual build and fixed reference poses define its probe allowances; external bodies receive no such own-body reference.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: body/createHumanBody.ts (createHumanBody, tangle); audit/AutoMovieMotionHumanAuditTangle.ts; audit/AutoMovieMotionHumanAuditTangleMargin.ts; posture/HumanArmFrame.ts; posture/HumanArmTrajectoryAllowances.ts. The audit and arm planner share one model without duplicating collider construction or reference policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every field, the reference depths included, is built once with the body and only read after; current candidate poses and scores are not represented as model state.
