// 01_stages.js — Seed the five Merge stages.
//
// Run with:
//   mongosh "mongodb://localhost:27017/merge?replicaSet=rs0" seed/01_stages.js
//
// Idempotent: uses upsert on _id so re-running is safe.
// Stages are ordered by xpThreshold ascending; ProgressionService uses this
// to determine the "next stage" when promoting a student.

const stages = [
  {
    _id: UUID("10000000-1000-1000-1000-000000000001"),
    name: "Scout",
    xpThreshold: 500
  },
  {
    _id: UUID("10000000-1000-1000-1000-000000000002"),
    name: "Cadet",
    xpThreshold: 1500
  },
  {
    _id: UUID("10000000-1000-1000-1000-000000000003"),
    name: "Builder",
    xpThreshold: 3000
  },
  {
    _id: UUID("10000000-1000-1000-1000-000000000004"),
    name: "Engineer",
    xpThreshold: 5000
  },
  {
    _id: UUID("10000000-1000-1000-1000-000000000005"),
    name: "Architect",
    xpThreshold: 7500
  }
];

stages.forEach(stage => {
  db.stages.updateOne(
    { _id: stage._id },
    { $set: { name: stage.name, xpThreshold: stage.xpThreshold } },
    { upsert: true }
  );
});

print(`✓ ${stages.length} stages seeded`);
