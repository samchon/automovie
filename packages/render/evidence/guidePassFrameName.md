# src/guidePassFrameName.ts#guidePassFrameName

## @evidence contracts/development/implementation.md#principled-implementation

The pass becomes a second extension segment on the shared frame-name rule, so names of different passes never collide and ffmpeg's numbered-sequence pattern still matches each pass separately.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The function delegates numbering and padding to `frameName` and adds only the pass tag through the private `passExtension`, so frame naming has one owner.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The untagged `beauty` name is the documented compatibility rule for single-pass output, not a consumer special case.

## @evidence contracts/development/common.md#meaningful-documentation

The doc gives both name shapes with examples, each argument's meaning and default, and why beauty stays untagged.

## @evidence contracts/development/implementation.md#efficient-algorithms

The call builds one short string in time linear in its length.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each call formats one short name, so caching would cost more than formatting.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Each frame name is a new string the capture writer uses as a path once; nothing about the pass or index is cached, and no file is opened here.
