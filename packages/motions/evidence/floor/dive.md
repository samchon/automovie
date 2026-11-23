# src/floor/dive.ts#dive

## @evidence contracts/development/common.md#meaningful-documentation

States the two kinds, the root's path, the one airborne axis, the landing and the contacts, and what the first pass leaves out.

## @evidence contracts/development/design.md#principled-representation

A shape of the joints, a turn about one body axis and a root path, with the landed body read off its own lowest point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The name, the cancel table, the shapes, four constants, the parameters and the plan.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The flight turns about one axis only, as stated; no tumble is faked.

# src/floor/dive.ts#dive.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the plan and the refusal.

## @evidence contracts/development/implementation.md#principled-implementation

The crouch keeps the ankles where they stood by planted leg goals, so the lowered root bends the knees; the flight starts from the crouch's solved joints (`GymnasticsFlight.frozen`), so the pose is continuous at take-off; the flight's root is a parabola over the chord from take-off to the landed root, which is read off the landed body's lowest joint; the turn is about the one axis the kind names.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The shape, the landed root, the three phases, the contacts.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A body not on both feet is refused.

## @evidence contracts/development/implementation.md#efficient-algorithms

Target start/difference triples, fixed foot-heading/contact readers and ankle/hip name demands prepare once. Crouch observations keep full direct admission but resolve only goals affecting ankle ancestry; start-hip observation omits independent leg fits. Every actual knee hint, planted goal, landing joint centre and displayed solve remains, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Crouch/solved launch joints prepare separate target differences. The same unchanged entry feet feed Trunk.preparePlanted's original leg-goal owner, while every current root/yaw still writes its knee/contact/goal. Genuine name readers and synchronous FK/projector loans share only prerequisites; current joint projection and digit/unsupported full fallback remain.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains original entry, two fixed foot placements/goal readers, two bounded track readers, ankle/hip demands and landed geometry. Query maps/getters release on return/throw; optional FK/projector loans stay synchronous and never enter raw output or retained callbacks. No previous-query result, handle or task is retained.
