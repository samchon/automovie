# src/physics/reachesXpbdJointBound.ts#reachesXpbdJointBound

## @evidence contracts/development/common.md#meaningful-documentation

States the rows and when one is active.

## @evidence contracts/development/implementation.md#principled-implementation

Bullet's joint-limit rows (bulletphysics/bullet3, src/BulletDynamics/Featherstone/btMultiBodyJointLimitConstraint.cpp lines 104-116 at c517c434e6e017d131ba3ad97ce4ec317226a2b7, zlib, Copyright (c) 2013 Erwin Coumans): penetrations q - lower and upper - q, a row active when its penetration is at most zero.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two comparisons.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No threshold of its own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A pure comparison.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a boolean; retains nothing.
