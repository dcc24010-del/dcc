import { db } from "../server/db";
import { batches, students, users } from "../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const BATCH_MAP: Record<number, string> = {
  3: "HSC 2031",
  4: "HSC 2030",
  5: "HSC 2029",
  6: "HSC 2028",
  7: "HSC 2027",
};

const CSV_STUDENTS = [
  { id: 3, studentCustomId: "202803", name: "Vhumika Talukder", batchId: 6, mobileNumber: "01612578202", shift: "Morning", academicGroup: "Science", userId: 5, addedByUserId: 3, admissionDate: "2026-04-05 19:23:06.79678" },
  { id: 5, studentCustomId: "202701", name: "Annasha Dey", batchId: 7, mobileNumber: "+880 1932-045968", shift: "Morning", academicGroup: "Science", userId: 8, addedByUserId: 3, admissionDate: "2026-04-07 03:52:54.824219" },
  { id: 6, studentCustomId: "202702", name: "Md Nakibul Alam Chowdhury", batchId: 7, mobileNumber: "+8801871701647", shift: "Morning", academicGroup: "Science", userId: 15, addedByUserId: 3, admissionDate: "2026-04-07 03:55:29.164241" },
  { id: 7, studentCustomId: "202703", name: "Jannatul Adan Sumaiya", batchId: 7, mobileNumber: "01814450487", shift: "Morning", academicGroup: "Science", userId: 14, addedByUserId: 3, admissionDate: "2026-04-07 03:57:15.392285" },
  { id: 8, studentCustomId: "202704", name: "Pushpa Das", batchId: 7, mobileNumber: "01812021202", shift: "Morning", academicGroup: "Science", userId: 16, addedByUserId: 3, admissionDate: "2026-04-07 04:00:59.378411" },
  { id: 9, studentCustomId: "202707", name: "Khadija Islam Tanha", batchId: 7, mobileNumber: "01952798915", shift: "Morning", academicGroup: "Science", userId: 17, addedByUserId: 3, admissionDate: "2026-04-07 04:02:20.400281" },
  { id: 10, studentCustomId: "202710", name: "Ullash Talukder", batchId: 7, mobileNumber: "01607522447", shift: "Morning", academicGroup: "Science", userId: 19, addedByUserId: 3, admissionDate: "2026-04-07 04:02:57.518949" },
  { id: 11, studentCustomId: "202711", name: "Tabassum Sultana Samia", batchId: 7, mobileNumber: "01959061013", shift: "Morning", academicGroup: "Science", userId: 10, addedByUserId: 3, admissionDate: "2026-04-07 04:03:38.204335" },
  { id: 12, studentCustomId: "202712", name: "Arnab Das", batchId: 7, mobileNumber: "01812245365", shift: "Morning", academicGroup: "Science", userId: 20, addedByUserId: 3, admissionDate: "2026-04-07 04:05:47.850885" },
  { id: 13, studentCustomId: "202713", name: "Monisha Dhar", batchId: 7, mobileNumber: "01836202738", shift: "Morning", academicGroup: "Science", userId: 21, addedByUserId: 3, admissionDate: "2026-04-07 04:06:21.361964" },
  { id: 14, studentCustomId: "202714", name: "Tahmidu Alam Fahim", batchId: 7, mobileNumber: "01632251480", shift: "Evening", academicGroup: "Science", userId: 22, addedByUserId: 3, admissionDate: "2026-04-07 04:07:22.782283" },
  { id: 15, studentCustomId: "202716", name: "Abdullah Al Faisal", batchId: 7, mobileNumber: "01609480289", shift: "Morning", academicGroup: "Science", userId: 23, addedByUserId: 3, admissionDate: "2026-04-07 04:16:27.504295" },
  { id: 16, studentCustomId: "202731", name: "Pappu Das", batchId: 7, mobileNumber: "01830570648", shift: "Morning", academicGroup: "Commerce", userId: 24, addedByUserId: 3, admissionDate: "2026-04-07 04:18:36.828098" },
  { id: 17, studentCustomId: "202732", name: "Niloy Shil", batchId: 7, mobileNumber: "01917374914", shift: "Morning", academicGroup: "Commerce", userId: 25, addedByUserId: 3, admissionDate: "2026-04-07 04:19:12.121191" },
  { id: 18, studentCustomId: null, name: "Ebtisam Sagir", batchId: 6, mobileNumber: "01780238525", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 04:19:16.181398" },
  { id: 19, studentCustomId: "202733", name: "Jerin", batchId: 7, mobileNumber: "01818119047", shift: "Morning", academicGroup: "Commerce", userId: 26, addedByUserId: 3, admissionDate: "2026-04-07 04:19:48.08304" },
  { id: 20, studentCustomId: "202734", name: "Srikanta Das", batchId: 7, mobileNumber: "01814437202", shift: "Morning", academicGroup: "Commerce", userId: 27, addedByUserId: 3, admissionDate: "2026-04-07 04:20:12.737842" },
  { id: 21, studentCustomId: null, name: "Shahriar Alam Fahim", batchId: 6, mobileNumber: "01842306297", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 04:20:23.817254" },
  { id: 22, studentCustomId: "202736", name: "Rishika Dhar", batchId: 7, mobileNumber: "01817766599", shift: "Morning", academicGroup: "Commerce", userId: 28, addedByUserId: 3, admissionDate: "2026-04-07 04:20:42.498791" },
  { id: 23, studentCustomId: "202708", name: "Sania Mirza", batchId: 7, mobileNumber: "+880 1824-936114", shift: "Morning", academicGroup: "Science", userId: 9, addedByUserId: 3, admissionDate: "2026-04-07 05:51:50.356327" },
  { id: 25, studentCustomId: null, name: "Shreeyashi Das", batchId: 6, mobileNumber: "", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:34:00.06853" },
  { id: 26, studentCustomId: null, name: "Israt Khanom Sumi", batchId: 6, mobileNumber: "01850138313", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:34:24.530246" },
  { id: 27, studentCustomId: null, name: "Antu Dey", batchId: 6, mobileNumber: "01864312738", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:34:43.153315" },
  { id: 28, studentCustomId: null, name: "Shuvosree Dhar", batchId: 6, mobileNumber: "01781478663", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:34:57.546449" },
  { id: 29, studentCustomId: null, name: "Swapno Sushil", batchId: 6, mobileNumber: "01867619255", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:35:13.909576" },
  { id: 30, studentCustomId: null, name: "Asma Faruk", batchId: 6, mobileNumber: "01811305400", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:36:33.225548" },
  { id: 31, studentCustomId: null, name: "Poshali Ghosh Titi", batchId: 6, mobileNumber: "01825607052", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:36:53.37816" },
  { id: 32, studentCustomId: null, name: "Arpita Acharjee", batchId: 6, mobileNumber: "01889803417", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:37:14.018001" },
  { id: 33, studentCustomId: null, name: "Sakila Hossain Tarin", batchId: 6, mobileNumber: "01875115946", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:37:28.397274" },
  { id: 34, studentCustomId: null, name: "Nabanita", batchId: 6, mobileNumber: "01845676956", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:37:42.206731" },
  { id: 35, studentCustomId: null, name: "Priya Sushil", batchId: 6, mobileNumber: "01878070404", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:37:55.141145" },
  { id: 36, studentCustomId: null, name: "Dipanita Chakraborty", batchId: 6, mobileNumber: "01815378721", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:38:12.006426" },
  { id: 37, studentCustomId: null, name: "Puja Shil", batchId: 6, mobileNumber: "01828621105", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:38:30.734352" },
  { id: 38, studentCustomId: null, name: "Nilima Dev Bithi", batchId: 6, mobileNumber: "01828960540", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:38:47.611208" },
  { id: 39, studentCustomId: null, name: "Suraiya Alam Adar", batchId: 6, mobileNumber: "01883554568", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:39:05.175918" },
  { id: 41, studentCustomId: null, name: "Prithilata Shil", batchId: 6, mobileNumber: "01609017715", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:40:06.439646" },
  { id: 42, studentCustomId: null, name: "Rajashree Shil", batchId: 6, mobileNumber: "01830777903", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:40:21.60148" },
  { id: 43, studentCustomId: null, name: "Tapur Shil", batchId: 6, mobileNumber: "01843355396", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:40:52.675536" },
  { id: 44, studentCustomId: null, name: "Monisha Shil", batchId: 6, mobileNumber: "01995421653", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:41:11.604297" },
  { id: 45, studentCustomId: null, name: "Arpita Sushil", batchId: 6, mobileNumber: "01828721754", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:41:24.442231" },
  { id: 46, studentCustomId: null, name: "Ananna Das", batchId: 6, mobileNumber: "01881566133", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:41:45.362932" },
  { id: 47, studentCustomId: null, name: "Angira Roy", batchId: 6, mobileNumber: "", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:42:05.996367" },
  { id: 48, studentCustomId: null, name: "Mondira Devi", batchId: 6, mobileNumber: "01609404030", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:42:28.689572" },
  { id: 49, studentCustomId: null, name: "Arnab Dey", batchId: 6, mobileNumber: "01868878073", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:42:56.5405" },
  { id: 50, studentCustomId: null, name: "Riklu Shill", batchId: 6, mobileNumber: "01868641988", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:43:19.784705" },
  { id: 51, studentCustomId: null, name: "Tanmoy Rudra", batchId: 6, mobileNumber: "01883554523", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:43:35.586472" },
  { id: 52, studentCustomId: null, name: "Dipa Dev", batchId: 6, mobileNumber: "01829268457", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:44:15.572748" },
  { id: 53, studentCustomId: null, name: "Naran Talukder", batchId: 6, mobileNumber: "01831489158", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:44:43.161199" },
  { id: 54, studentCustomId: null, name: "Priyonty Das", batchId: 6, mobileNumber: "01813060196", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:44:56.858191" },
  { id: 55, studentCustomId: null, name: "Puja Rudra", batchId: 6, mobileNumber: "01813223215", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:45:11.584708" },
  { id: 56, studentCustomId: null, name: "Airin Sultana Happy", batchId: 6, mobileNumber: "01882367251", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:45:27.145443" },
  { id: 57, studentCustomId: null, name: "Ayesha Siddika Sabrin", batchId: 6, mobileNumber: "01331807553", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:45:49.24186" },
  { id: 58, studentCustomId: null, name: "Saika", batchId: 6, mobileNumber: "01873807545", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:46:03.2158" },
  { id: 59, studentCustomId: null, name: "Subrata Muhuri", batchId: 6, mobileNumber: "01832214788", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:46:18.570159" },
  { id: 60, studentCustomId: "203101", name: "Tithi Shil", batchId: 3, mobileNumber: "01609017715", shift: "", academicGroup: "", userId: 62, addedByUserId: 12, admissionDate: "2026-04-07 06:46:31.785931" },
  { id: 61, studentCustomId: null, name: "Kripa Das", batchId: 6, mobileNumber: "01826556360", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:46:40.244118" },
  { id: 62, studentCustomId: null, name: "Sormila Shil", batchId: 6, mobileNumber: "01859344155", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:47:10.655632" },
  { id: 63, studentCustomId: null, name: "Jayanti Rudra", batchId: 6, mobileNumber: "01824667627", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:47:25.548997" },
  { id: 64, studentCustomId: null, name: "Niladri Rudra", batchId: 6, mobileNumber: "01877221832", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:47:42.68883" },
  { id: 65, studentCustomId: null, name: "Tanmoy Rudra", batchId: 6, mobileNumber: "01868949260", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:47:56.140322" },
  { id: 66, studentCustomId: null, name: "01811181870", batchId: 6, mobileNumber: "01811181870", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:48:14.909154" },
  { id: 67, studentCustomId: null, name: "Payel Das", batchId: 6, mobileNumber: "01815090117", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:48:29.52278" },
  { id: 68, studentCustomId: "203102", name: "Nafisa Tabassum Niha", batchId: 3, mobileNumber: "01716479611", shift: "", academicGroup: "", userId: 63, addedByUserId: 12, admissionDate: "2026-04-07 06:48:34.152905" },
  { id: 69, studentCustomId: null, name: "Choiti Rudra", batchId: 6, mobileNumber: "01858725226", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:48:45.194929" },
  { id: 70, studentCustomId: null, name: "Arpita Sushil", batchId: 6, mobileNumber: "01866539943", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:49:01.217396" },
  { id: 71, studentCustomId: "203103", name: "Mishkatul Jannat", batchId: 3, mobileNumber: "01871585422", shift: "", academicGroup: "", userId: 64, addedByUserId: 12, admissionDate: "2026-04-07 06:49:04.787342" },
  { id: 72, studentCustomId: null, name: "Biplop Rudra", batchId: 6, mobileNumber: "01937413407", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:49:15.331385" },
  { id: 73, studentCustomId: "202737", name: "Anika Das", batchId: 7, mobileNumber: "01834048275", shift: "", academicGroup: "Commerce", userId: 29, addedByUserId: 3, admissionDate: "2026-04-07 06:49:26.573618" },
  { id: 74, studentCustomId: null, name: "Raghonandhan Shil", batchId: 6, mobileNumber: "01316383191", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:49:29.724844" },
  { id: 75, studentCustomId: "203104", name: "Mushfika Akter", batchId: 3, mobileNumber: "01829336778", shift: "", academicGroup: "", userId: 65, addedByUserId: 12, admissionDate: "2026-04-07 06:49:36.595364" },
  { id: 76, studentCustomId: null, name: "Jakia Jinnat Subaita", batchId: 6, mobileNumber: "01621559967", shift: null, academicGroup: null, userId: null, addedByUserId: 7, admissionDate: "2026-04-07 06:49:46.123157" },
  { id: 77, studentCustomId: "203105", name: "Shovosree Das", batchId: 3, mobileNumber: "01840337400", shift: "", academicGroup: "", userId: 66, addedByUserId: 12, admissionDate: "2026-04-07 06:50:10.37692" },
  { id: 78, studentCustomId: "202738", name: "Ipsita Khanom Shefa", batchId: 7, mobileNumber: "01864480890", shift: "", academicGroup: "Commerce", userId: 30, addedByUserId: 3, admissionDate: "2026-04-07 06:50:12.974542" },
  { id: 79, studentCustomId: "203106", name: "Akhi Purohit", batchId: 3, mobileNumber: "01874815098", shift: "", academicGroup: "", userId: 67, addedByUserId: 12, admissionDate: "2026-04-07 06:50:39.640118" },
  { id: 80, studentCustomId: "202739", name: "Horiya Jannat Shaki", batchId: 7, mobileNumber: "01864610165", shift: null, academicGroup: "Commerce", userId: 31, addedByUserId: 3, admissionDate: "2026-04-07 06:50:55.884775" },
  { id: 81, studentCustomId: "203107", name: "Sajid Khan Rumi", batchId: 3, mobileNumber: "01616252200", shift: "", academicGroup: "", userId: 68, addedByUserId: 12, admissionDate: "2026-04-07 06:51:12.225467" },
  { id: 82, studentCustomId: "203108", name: "Rittika Sikder", batchId: 3, mobileNumber: "01641308567", shift: "", academicGroup: "", userId: 70, addedByUserId: 12, admissionDate: "2026-04-07 06:51:41.746648" },
  { id: 83, studentCustomId: "202740", name: "Hujaifa Siddika Afrin", batchId: 7, mobileNumber: "01865107704", shift: "Evening", academicGroup: "Commerce", userId: 32, addedByUserId: 3, admissionDate: "2026-04-07 06:51:45.905541" },
  { id: 84, studentCustomId: "203109", name: "Nondini Sushil Rittika", batchId: 3, mobileNumber: "01868641988", shift: "", academicGroup: "", userId: 71, addedByUserId: 12, admissionDate: "2026-04-07 06:52:13.436591" },
  { id: 85, studentCustomId: "202741", name: "Probon Shil", batchId: 7, mobileNumber: "01834895989", shift: "", academicGroup: "Commerce", userId: 40, addedByUserId: 3, admissionDate: "2026-04-07 06:52:14.841442" },
  { id: 86, studentCustomId: "203110", name: "Jitul Sushil", batchId: 3, mobileNumber: "01843355396", shift: "", academicGroup: "", userId: 72, addedByUserId: 12, admissionDate: "2026-04-07 06:52:46.031663" },
  { id: 87, studentCustomId: "202742", name: "Arnab Das", batchId: 7, mobileNumber: "01855452844", shift: "", academicGroup: "Commerce", userId: 39, addedByUserId: 3, admissionDate: "2026-04-07 06:52:52.951921" },
  { id: 88, studentCustomId: "203111", name: "Shreyas Majumder", batchId: 3, mobileNumber: "01969483416", shift: "", academicGroup: "", userId: 73, addedByUserId: 12, admissionDate: "2026-04-07 06:53:15.682855" },
  { id: 89, studentCustomId: "202743", name: "Rimu Shil", batchId: 7, mobileNumber: "01790414135", shift: "", academicGroup: "Commerce", userId: 38, addedByUserId: 3, admissionDate: "2026-04-07 06:53:27.248981" },
  { id: 90, studentCustomId: "202744", name: "Moni Deb", batchId: 7, mobileNumber: "01871571998", shift: "", academicGroup: "Commerce", userId: 35, addedByUserId: 3, admissionDate: "2026-04-07 06:53:53.111524" },
  { id: 91, studentCustomId: "203112", name: "Shima Das Ostami", batchId: 3, mobileNumber: "01754350918", shift: "", academicGroup: "", userId: 74, addedByUserId: 12, admissionDate: "2026-04-07 06:53:53.535519" },
  { id: 92, studentCustomId: "203113", name: "Supriya Sushil", batchId: 3, mobileNumber: "01849819954", shift: "", academicGroup: "", userId: 75, addedByUserId: 12, admissionDate: "2026-04-07 06:54:44.501003" },
  { id: 93, studentCustomId: "202745", name: "Arpita Das", batchId: 7, mobileNumber: "01869894497", shift: null, academicGroup: "Commerce", userId: 34, addedByUserId: 3, admissionDate: "2026-04-07 06:54:58.875884" },
  { id: 94, studentCustomId: "203114", name: "Sumaiya Rahman", batchId: 3, mobileNumber: "01870017229", shift: "", academicGroup: "", userId: 76, addedByUserId: 12, admissionDate: "2026-04-07 06:55:16.987214" },
  { id: 95, studentCustomId: "202746", name: "Tushti Dhar", batchId: 7, mobileNumber: "01670531569", shift: "Morning", academicGroup: "Commerce", userId: 33, addedByUserId: 3, admissionDate: "2026-04-07 06:55:28.399923" },
  { id: 96, studentCustomId: "202762", name: "Hira", batchId: 7, mobileNumber: "01815338275", shift: "Evening", academicGroup: "Arts", userId: 41, addedByUserId: 3, admissionDate: "2026-04-07 06:56:14.204782" },
  { id: 97, studentCustomId: "203115", name: "Pujon Sushil", batchId: 3, mobileNumber: "01837136492", shift: "", academicGroup: "", userId: 77, addedByUserId: 12, admissionDate: "2026-04-07 06:56:18.652657" },
  { id: 98, studentCustomId: "202763", name: "Meher Niger", batchId: 7, mobileNumber: "01883822297", shift: "Evening", academicGroup: "Arts", userId: 42, addedByUserId: 3, admissionDate: "2026-04-07 06:56:35.290412" },
  { id: 99, studentCustomId: "203116", name: "Niloy Das", batchId: 3, mobileNumber: "", shift: "", academicGroup: "", userId: 78, addedByUserId: 12, admissionDate: "2026-04-07 06:56:35.755771" },
  { id: 100, studentCustomId: "202764", name: "Mukta Debi", batchId: 7, mobileNumber: "01812049130", shift: "Morning", academicGroup: "Arts", userId: 43, addedByUserId: 3, admissionDate: "2026-04-07 06:57:24.020946" },
  { id: 101, studentCustomId: "202765", name: "Proma", batchId: 7, mobileNumber: "01816193796", shift: "Evening", academicGroup: "Arts", userId: 44, addedByUserId: 3, admissionDate: "2026-04-07 06:58:15.136552" },
  { id: 102, studentCustomId: "202767", name: "Shakila Akter Rika", batchId: 7, mobileNumber: "01881641487", shift: "", academicGroup: "Arts", userId: 45, addedByUserId: 3, admissionDate: "2026-04-07 06:58:51.472613" },
  { id: 103, studentCustomId: "202768", name: "Abdullah Al Kalam", batchId: 7, mobileNumber: "01881641351", shift: "", academicGroup: "Arts", userId: 46, addedByUserId: 3, admissionDate: "2026-04-07 06:59:45.833496" },
  { id: 104, studentCustomId: "202769", name: "Meherunnesa Takriam", batchId: 7, mobileNumber: "01846034466", shift: "", academicGroup: "Arts", userId: 47, addedByUserId: 3, admissionDate: "2026-04-07 07:00:20.977473" },
  { id: 105, studentCustomId: "202770", name: "Raisa", batchId: 7, mobileNumber: "01812723225", shift: "Evening", academicGroup: "Arts", userId: 48, addedByUserId: 3, admissionDate: "2026-04-07 07:00:57.132717" },
  { id: 106, studentCustomId: "202771", name: "Sani Das", batchId: 7, mobileNumber: "01837182417", shift: "Morning", academicGroup: "Arts", userId: 49, addedByUserId: 3, admissionDate: "2026-04-07 07:01:22.850048" },
  { id: 107, studentCustomId: "202709", name: "Khadijatul Kubra Adiba", batchId: 7, mobileNumber: "01715033160", shift: "Morning", academicGroup: "Science", userId: 18, addedByUserId: 3, admissionDate: "2026-04-07 07:02:37.690311" },
  { id: 108, studentCustomId: "203117", name: "Ayfa Siddika Jerin", batchId: 3, mobileNumber: "01865107704", shift: "", academicGroup: "", userId: 79, addedByUserId: 12, admissionDate: "2026-04-07 07:40:48.985098" },
  { id: 109, studentCustomId: "203118", name: "Nishan Acharjee", batchId: 3, mobileNumber: "01894129148", shift: "", academicGroup: "", userId: 80, addedByUserId: 12, admissionDate: "2026-04-07 07:42:45.918749" },
  { id: 110, studentCustomId: "203119", name: "Rainandini Shil Ushi", batchId: 3, mobileNumber: "01316383191", shift: "", academicGroup: "", userId: 81, addedByUserId: 12, admissionDate: "2026-04-07 07:43:13.438041" },
  { id: 111, studentCustomId: "203120", name: "Sidratul Muntaha Hena", batchId: 3, mobileNumber: "01883130495", shift: "", academicGroup: "", userId: 82, addedByUserId: 12, admissionDate: "2026-04-07 07:43:42.209785" },
  { id: 112, studentCustomId: "203121", name: "Shreyan Karan", batchId: 3, mobileNumber: "01827877376", shift: "", academicGroup: "", userId: 83, addedByUserId: 12, admissionDate: "2026-04-07 07:44:10.435485" },
  { id: 113, studentCustomId: "203122", name: "Matuis Shil", batchId: 3, mobileNumber: "01938831669", shift: "", academicGroup: "", userId: 84, addedByUserId: 12, admissionDate: "2026-04-07 07:44:37.403359" },
  { id: 114, studentCustomId: "203123", name: "Kamrul Islam Sabbir", batchId: 3, mobileNumber: "01331807553", shift: "", academicGroup: "", userId: 85, addedByUserId: 12, admissionDate: "2026-04-07 07:45:02.034459" },
  { id: 115, studentCustomId: "203124", name: "Pushpita Das", batchId: 3, mobileNumber: "01826556360", shift: "", academicGroup: "", userId: 86, addedByUserId: 12, admissionDate: "2026-04-07 07:45:29.107895" },
  { id: 116, studentCustomId: "203125", name: "Rittika Das", batchId: 3, mobileNumber: "01840233157", shift: "", academicGroup: "", userId: 87, addedByUserId: 12, admissionDate: "2026-04-07 07:45:58.108752" },
  { id: 117, studentCustomId: "203126", name: "Raj Shil", batchId: 3, mobileNumber: "01812077596", shift: "", academicGroup: "", userId: 88, addedByUserId: 12, admissionDate: "2026-04-07 07:46:27.752427" },
  { id: 118, studentCustomId: "203127", name: "Pritthiraj Barua Subo", batchId: 3, mobileNumber: "", shift: "", academicGroup: "", userId: 89, addedByUserId: 12, admissionDate: "2026-04-07 07:46:44.84868" },
  { id: 119, studentCustomId: "202901", name: "Arin Das", batchId: 5, mobileNumber: "01841028625", shift: "", academicGroup: "", userId: 52, addedByUserId: 11, admissionDate: "2026-04-07 08:58:32.430493" },
  { id: 120, studentCustomId: "202902", name: "Sadiya Chowdhury Chandni", batchId: 5, mobileNumber: "01631056619", shift: "", academicGroup: "", userId: 50, addedByUserId: 11, admissionDate: "2026-04-07 08:59:01.848526" },
  { id: 121, studentCustomId: "202903", name: "Ertesham Arafat Radhiya", batchId: 5, mobileNumber: "01757947307", shift: "", academicGroup: "", userId: 53, addedByUserId: 11, admissionDate: "2026-04-07 08:59:35.976122" },
  { id: 122, studentCustomId: "202904", name: "Tasfika Akter", batchId: 5, mobileNumber: "", shift: "", academicGroup: "", userId: 54, addedByUserId: 11, admissionDate: "2026-04-07 08:59:49.574797" },
  { id: 123, studentCustomId: "202905", name: "Devika Dhar Tushi", batchId: 5, mobileNumber: "01811202209", shift: "", academicGroup: "", userId: 55, addedByUserId: 11, admissionDate: "2026-04-07 09:00:17.421555" },
  { id: 124, studentCustomId: "202907", name: "Nandita Sushil", batchId: 5, mobileNumber: "01713613852", shift: "", academicGroup: "", userId: 56, addedByUserId: 11, admissionDate: "2026-04-07 09:00:53.704469" },
  { id: 125, studentCustomId: "202908", name: "Prema Chakraborty", batchId: 5, mobileNumber: "01778346515", shift: "", academicGroup: "", userId: 57, addedByUserId: 11, admissionDate: "2026-04-07 09:01:33.059214" },
  { id: 126, studentCustomId: "202909", name: "Kushan Das", batchId: 5, mobileNumber: "01639228339", shift: "", academicGroup: "", userId: 58, addedByUserId: 11, admissionDate: "2026-04-07 09:01:55.086609" },
  { id: 127, studentCustomId: "202910", name: "Onti Dhar Borsha", batchId: 5, mobileNumber: "01866159639", shift: "", academicGroup: "", userId: 59, addedByUserId: 11, admissionDate: "2026-04-07 09:02:20.8445" },
  { id: 128, studentCustomId: "203002", name: "Onnika Deb Projukti", batchId: 4, mobileNumber: "01849726858", shift: "", academicGroup: "", userId: 90, addedByUserId: 11, admissionDate: "2026-04-07 09:03:04.964137" },
  { id: 129, studentCustomId: "203003", name: "Jannabi Khanom Sinha", batchId: 4, mobileNumber: "01616252200", shift: "", academicGroup: "", userId: 91, addedByUserId: 11, admissionDate: "2026-04-07 09:03:30.441695" },
  { id: 130, studentCustomId: "203004", name: "Diya Karon", batchId: 4, mobileNumber: "01811800426", shift: "", academicGroup: "", userId: 92, addedByUserId: 11, admissionDate: "2026-04-07 09:03:55.016193" },
  { id: 131, studentCustomId: "203005", name: "Araddha Das", batchId: 4, mobileNumber: "01870584538", shift: "", academicGroup: "", userId: 93, addedByUserId: 11, admissionDate: "2026-04-07 09:04:18.654337" },
  { id: 132, studentCustomId: "203006", name: "Puja Talukder", batchId: 4, mobileNumber: "01815331608", shift: "", academicGroup: "", userId: 94, addedByUserId: 11, admissionDate: "2026-04-07 09:04:36.315016" },
  { id: 133, studentCustomId: "203007", name: "Afrin Alam Nowrin", batchId: 4, mobileNumber: "01816824598", shift: "", academicGroup: "", userId: 95, addedByUserId: 11, admissionDate: "2026-04-07 09:05:05.535184" },
  { id: 134, studentCustomId: "203008", name: "Tandrila Sushil", batchId: 4, mobileNumber: "01860839344", shift: "", academicGroup: "", userId: 97, addedByUserId: 11, admissionDate: "2026-04-07 09:05:24.853998" },
  { id: 135, studentCustomId: "203009", name: "Shayantika Dhar", batchId: 4, mobileNumber: "01781478663", shift: "", academicGroup: "", userId: 98, addedByUserId: 11, admissionDate: "2026-04-07 09:05:52.550708" },
  { id: 136, studentCustomId: "203010", name: "Shanta Dhar", batchId: 4, mobileNumber: "01843425745", shift: "", academicGroup: "", userId: 99, addedByUserId: 11, admissionDate: "2026-04-07 09:06:12.905822" },
  { id: 137, studentCustomId: "203011", name: "Arpita Dhar", batchId: 4, mobileNumber: "01863601713", shift: "", academicGroup: "", userId: 100, addedByUserId: 11, admissionDate: "2026-04-07 09:06:41.642186" },
  { id: 138, studentCustomId: "203012", name: "Mohona", batchId: 4, mobileNumber: "01804293339", shift: "", academicGroup: "", userId: 101, addedByUserId: 11, admissionDate: "2026-04-07 09:06:59.648347" },
  { id: 139, studentCustomId: "203013", name: "Arpon Rudra", batchId: 4, mobileNumber: "01625314794", shift: "", academicGroup: "", userId: 102, addedByUserId: 11, admissionDate: "2026-04-07 09:07:22.672518" },
];

async function main() {
  console.log("Starting student data import...\n");

  // Step 1: Create batches
  console.log("Step 1: Creating batches...");
  const createdBatches: Record<number, number> = {};
  for (const [csvBatchId, batchName] of Object.entries(BATCH_MAP)) {
    const [batch] = await db.insert(batches).values({ name: batchName }).returning();
    createdBatches[Number(csvBatchId)] = batch.id;
    console.log(`  Created batch "${batchName}" → new ID: ${batch.id}`);
  }

  // Step 2: Create student user accounts (for students with a studentCustomId / userId)
  console.log("\nStep 2: Creating student user accounts...");
  const defaultPassword = await bcrypt.hash("student123", 10);

  // Collect all students that need a user account (have both studentCustomId and userId from CSV)
  const studentsNeedingUsers = CSV_STUDENTS.filter(s => s.studentCustomId && s.userId !== null);

  // Map from original CSV userId → new DB userId
  const userIdMap: Record<number, number> = {};

  for (const s of studentsNeedingUsers) {
    if (s.userId === null || !s.studentCustomId) continue;
    if (userIdMap[s.userId]) continue; // already created

    const [user] = await db.insert(users).values({
      username: s.studentCustomId,
      password: defaultPassword,
      role: "student",
    }).returning();
    userIdMap[s.userId] = user.id;
  }
  console.log(`  Created ${Object.keys(userIdMap).length} student user accounts`);

  // Step 3: Insert all students
  console.log("\nStep 3: Inserting students...");
  let inserted = 0;
  for (const s of CSV_STUDENTS) {
    const newBatchId = createdBatches[s.batchId];
    if (!newBatchId) {
      console.warn(`  SKIP: No batch mapping for CSV batchId ${s.batchId} (student: ${s.name})`);
      continue;
    }

    const newUserId = (s.userId !== null && userIdMap[s.userId]) ? userIdMap[s.userId] : null;

    await db.insert(students).values({
      studentCustomId: s.studentCustomId || null,
      name: s.name,
      batchId: newBatchId,
      mobileNumber: s.mobileNumber || null,
      shift: s.shift || null,
      academicGroup: s.academicGroup || null,
      userId: newUserId,
      addedByUserId: null,
      admissionDate: new Date(s.admissionDate),
    });
    inserted++;
  }

  console.log(`\n✓ Done! Inserted ${inserted} students across ${Object.keys(createdBatches).length} batches.`);
  console.log("\nBatch summary:");
  for (const [csvId, newId] of Object.entries(createdBatches)) {
    const count = CSV_STUDENTS.filter(s => s.batchId === Number(csvId)).length;
    console.log(`  ${BATCH_MAP[Number(csvId)]} (${count} students)`);
  }
  console.log("\nStudent logins: username = their student ID, password = student123");
}

main().catch(console.error).finally(() => process.exit());
