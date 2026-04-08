import { db } from "../server/db";
import { batches, students, incomes } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

// CSV batch_id → correct batch name
const BATCH_NAME_MAP: Record<number, string> = {
  3: "Class 6",
  4: "Class 7",
  5: "Class 8",
  6: "Class 9",
  7: "Class 10",
};

// CSV batch_id → DB batch_id (from our previous seed which inserted in order 3→1, 4→2, 5→3, 6→4, 7→5)
const CSV_BATCH_TO_DB_BATCH: Record<number, number> = {
  3: 1,
  4: 2,
  5: 3,
  6: 4,
  7: 5,
};

// Income records from CSV
// Fields: csvStudentId, csvBatchId, month, amount, date, status, addedBy
const CSV_INCOMES = [
  { csvStudentId: 5, csvBatchId: 7, month: "January", amount: 1500, date: "2026-04-07 04:50:04.620724", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 5, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 04:50:28.04639", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 5, csvBatchId: 7, month: "March", amount: 1500, date: "2026-04-07 04:50:47.328256", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 6, csvBatchId: 7, month: "January", amount: 1500, date: "2026-04-07 09:14:05.871357", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 23, csvBatchId: 7, month: "January", amount: 1500, date: "2026-04-07 09:14:28.744913", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 13, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 09:16:47.42806", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 16, csvBatchId: 7, month: "January", amount: 1000, date: "2026-04-07 09:17:22.149848", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 16, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:17:51.656909", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 15, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 09:18:51.832188", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 10, csvBatchId: 7, month: "February", amount: 800, date: "2026-04-07 09:19:32.135891", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 19, csvBatchId: 7, month: "January", amount: 1000, date: "2026-04-07 09:22:28.561418", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 8, csvBatchId: 7, month: "January", amount: 1500, date: "2026-04-07 09:22:52.372822", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 11, csvBatchId: 7, month: "January", amount: 1500, date: "2026-04-07 09:23:17.129704", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 7, csvBatchId: 7, month: "January", amount: 1000, date: "2026-04-07 09:23:43.124178", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 19, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:24:06.510189", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 6, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 09:24:34.797392", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 8, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 09:25:10.67602", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 85, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:25:36.507603", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 102, csvBatchId: 7, month: "January", amount: 800, date: "2026-04-07 09:26:34.843474", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 102, csvBatchId: 7, month: "February", amount: 800, date: "2026-04-07 09:26:50.639887", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 23, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 09:27:04.778715", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 11, csvBatchId: 7, month: "February", amount: 1500, date: "2026-04-07 09:27:16.713685", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 80, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:28:09.284849", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 20, csvBatchId: 7, month: "January", amount: 1000, date: "2026-04-07 09:28:43.610847", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 20, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:28:55.713188", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 9, csvBatchId: 7, month: "January", amount: 1000, date: "2026-04-07 09:29:20.999158", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 9, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:29:34.186631", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 7, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:30:17.0032", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 83, csvBatchId: 7, month: "February", amount: 1000, date: "2026-04-07 09:30:57.523581", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 7, csvBatchId: 7, month: "March", amount: 1000, date: "2026-04-07 09:42:28.334325", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 23, csvBatchId: 7, month: "March", amount: 1500, date: "2026-04-07 09:43:05.102341", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 128, csvBatchId: 4, month: "March", amount: 800, date: "2026-04-07 09:44:21.72628", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 128, csvBatchId: 4, month: "February", amount: 800, date: "2026-04-07 09:44:34.933048", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 68, csvBatchId: 3, month: "March", amount: 800, date: "2026-04-07 09:45:02.044296", status: "Verified", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 88, csvBatchId: 3, month: "March", amount: 800, date: "2026-04-07 09:45:29.853512", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 97, csvBatchId: 3, month: "March", amount: 800, date: "2026-04-07 09:46:05.101328", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 26, csvBatchId: 6, month: "March", amount: 1500, date: "2026-04-07 09:47:21.46526", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 39, csvBatchId: 6, month: "March", amount: 1500, date: "2026-04-07 09:47:52.164079", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 95, csvBatchId: 7, month: "February", amount: 800, date: "2026-04-07 09:48:26.669189", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 92, csvBatchId: 3, month: "March", amount: 800, date: "2026-04-07 09:50:35.543416", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 86, csvBatchId: 3, month: "January", amount: 700, date: "2026-04-08 02:23:00.874657", status: "Pending", addedBy: "Arnab Das" },
  { csvStudentId: 71, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:24:06.909643", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 75, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:24:34.222358", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 68, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:25:17.431435", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 82, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:25:49.468799", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 84, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:26:46.490526", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 77, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:27:17.724006", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 92, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:27:48.410731", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 60, csvBatchId: 3, month: "January", amount: 600, date: "2026-04-08 02:28:25.672099", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 91, csvBatchId: 3, month: "January", amount: 800, date: "2026-04-08 02:29:00.565305", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 79, csvBatchId: 3, month: "February", amount: 600, date: "2026-04-08 02:29:59.465442", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 86, csvBatchId: 3, month: "February", amount: 700, date: "2026-04-08 02:30:27.464641", status: "Pending", addedBy: "Arnab Das" },
  { csvStudentId: 71, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:31:01.150379", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 68, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:31:30.44512", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 75, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:31:51.565371", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 99, csvBatchId: 3, month: "February", amount: 400, date: "2026-04-08 02:32:47.044402", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 97, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:33:31.117245", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 91, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:34:01.414882", status: "Pending", addedBy: "Arnab Das" },
  { csvStudentId: 77, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:34:31.875488", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 88, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:35:14.2264", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 94, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:35:50.355853", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 60, csvBatchId: 3, month: "February", amount: 600, date: "2026-04-08 02:36:09.933222", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 115, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:37:08.29009", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 118, csvBatchId: 3, month: "February", amount: 800, date: "2026-04-08 02:37:34.035381", status: "Pending", addedBy: "Arnab Das" },
  { csvStudentId: 109, csvBatchId: 3, month: "February", amount: 500, date: "2026-04-08 02:38:12.922093", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 108, csvBatchId: 3, month: "February", amount: 500, date: "2026-04-08 02:38:51.935669", status: "Pending", addedBy: "Sajjadul Islam Rasel" },
  { csvStudentId: 110, csvBatchId: 3, month: "February", amount: 500, date: "2026-04-08 02:39:53.886104", status: "Pending", addedBy: "Md Javed Iqbal" },
  { csvStudentId: 111, csvBatchId: 3, month: "February", amount: 500, date: "2026-04-08 02:41:04.046318", status: "Pending", addedBy: "Arnab Das" },
  { csvStudentId: 112, csvBatchId: 3, month: "February", amount: 400, date: "2026-04-08 02:41:30.850351", status: "Pending", addedBy: "Arnab Das" },
  { csvStudentId: 77, csvBatchId: 3, month: "March", amount: 800, date: "2026-04-08 02:44:38.340743", status: "Pending", addedBy: "Arnab Das" },
];

// Mapping from original CSV student_id → the student_custom_id from the student CSV
// (so we can look up the new DB student ID by custom_id)
const CSV_STUDENT_TO_CUSTOM_ID: Record<number, string> = {
  5: "202701",
  6: "202702",
  7: "202703",
  8: "202704",
  9: "202707",
  10: "202710",
  11: "202711",
  13: "202713",
  15: "202716",
  16: "202731",
  19: "202733",
  20: "202734",
  23: "202708",
  60: "203101",
  68: "203102",
  71: "203103",
  75: "203104",
  77: "203105",
  79: "203106",
  80: "202739",
  82: "203108",
  83: "202740",
  84: "203109",
  85: "202741",
  86: "203110",
  88: "203111",
  91: "203112",
  92: "203113",
  94: "203114",
  95: "202746",
  97: "203115",
  99: "203116",
  102: "202767",
  108: "203117",
  109: "203118",
  110: "203119",
  111: "203120",
  112: "203121",
  115: "203124",
  118: "203127",
  128: "203002",
};

// Students without custom IDs that appear in incomes — match by name
const CSV_STUDENT_BY_NAME: Record<number, string> = {
  26: "Israt Khanom Sumi",
  39: "Suraiya Alam Adar",
};

async function main() {
  console.log("Starting batch rename + income import...\n");

  // Step 1: Rename batches
  console.log("Step 1: Renaming batches...");
  for (const [csvBatchId, batchName] of Object.entries(BATCH_NAME_MAP)) {
    const dbBatchId = CSV_BATCH_TO_DB_BATCH[Number(csvBatchId)];
    await db.update(batches).set({ name: batchName }).where(eq(batches.id, dbBatchId));
    console.log(`  DB batch ${dbBatchId}: renamed to "${batchName}"`);
  }

  // Step 2: Build student ID map (CSV student_id → DB student_id)
  console.log("\nStep 2: Building student ID mapping...");
  const allStudents = await db.select().from(students);

  const csvToDbStudentId: Record<number, number> = {};

  // Map by custom ID
  for (const [csvStudentId, customId] of Object.entries(CSV_STUDENT_TO_CUSTOM_ID)) {
    const found = allStudents.find(s => s.studentCustomId === customId);
    if (found) {
      csvToDbStudentId[Number(csvStudentId)] = found.id;
    } else {
      console.warn(`  WARNING: Could not find student with custom ID "${customId}" (CSV id: ${csvStudentId})`);
    }
  }

  // Map by name (for students without custom IDs)
  for (const [csvStudentId, name] of Object.entries(CSV_STUDENT_BY_NAME)) {
    const found = allStudents.find(s => s.name === name);
    if (found) {
      csvToDbStudentId[Number(csvStudentId)] = found.id;
      console.log(`  Mapped CSV student ${csvStudentId} ("${name}") → DB student ID ${found.id}`);
    } else {
      console.warn(`  WARNING: Could not find student named "${name}" (CSV id: ${csvStudentId})`);
    }
  }

  console.log(`  Mapped ${Object.keys(csvToDbStudentId).length} students`);

  // Step 3: Insert income records
  console.log("\nStep 3: Inserting income records...");
  let inserted = 0;
  let skipped = 0;

  for (const row of CSV_INCOMES) {
    const dbStudentId = csvToDbStudentId[row.csvStudentId];
    const dbBatchId = CSV_BATCH_TO_DB_BATCH[row.csvBatchId];

    if (!dbStudentId) {
      console.warn(`  SKIP income: CSV student ID ${row.csvStudentId} not mapped`);
      skipped++;
      continue;
    }
    if (!dbBatchId) {
      console.warn(`  SKIP income: CSV batch ID ${row.csvBatchId} not mapped`);
      skipped++;
      continue;
    }

    await db.insert(incomes).values({
      studentId: dbStudentId,
      batchId: dbBatchId,
      month: row.month,
      amount: row.amount,
      date: new Date(row.date),
      status: row.status,
      addedBy: row.addedBy,
    });
    inserted++;
  }

  console.log(`\n✓ Done!`);
  console.log(`  Batches renamed: 5`);
  console.log(`  Income records inserted: ${inserted}`);
  if (skipped > 0) console.log(`  Skipped: ${skipped}`);

  // Verify
  const batchList = await db.select().from(batches);
  console.log("\nFinal batches:");
  batchList.forEach(b => console.log(`  [${b.id}] ${b.name}`));

  const { count } = await import("drizzle-orm");
  const [incomeCount] = await db.select({ count: count() }).from(incomes);
  console.log(`\nTotal income records in DB: ${incomeCount.count}`);
}

main().catch(console.error).finally(() => process.exit());
