import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";

const TEACHERS = [
  { username: "Md Javed Iqbal",       password: "Javed123",    teacherId: "202001", mobileNumber: "01814362956" },
  { username: "Md. Shehzad Hossain",  password: "Shehzad123",  teacherId: "202004", mobileNumber: "+880 1580-441668" },
  { username: "Sajjadul Islam Rasel", password: "Rasel123",    teacherId: "202002", mobileNumber: "+880 1869-240029" },
  { username: "Arnab Das",            password: "Arnab123",    teacherId: "202003", mobileNumber: "+880 1642-778554" },
  { username: "Srikanta Das",         password: "Srikanta123", teacherId: "202005", mobileNumber: "+880 1611-913919" },
];

async function main() {
  console.log("Importing teachers...\n");

  for (const t of TEACHERS) {
    const hashed = await bcrypt.hash(t.password, 10);
    const [user] = await db.insert(users).values({
      username: t.username,
      password: hashed,
      role: "teacher",
      teacherId: t.teacherId,
      mobileNumber: t.mobileNumber,
    }).returning();
    console.log(`  Created: "${user.username}" (ID: ${user.id}, Teacher ID: ${user.teacherId})`);
  }

  console.log(`\n✓ Done! ${TEACHERS.length} teachers imported.`);
  console.log("\nTeacher logins:");
  TEACHERS.forEach(t => console.log(`  Username: "${t.username}" | Password: ${t.password}`));
}

main().catch(console.error).finally(() => process.exit());
