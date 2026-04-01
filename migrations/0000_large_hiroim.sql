CREATE TABLE "batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "batches_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" integer NOT NULL,
	"month" text DEFAULT '' NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "incomes" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"batch_id" integer NOT NULL,
	"month" text NOT NULL,
	"amount" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"recorded_by" integer,
	"status" text DEFAULT 'Pending' NOT NULL,
	"added_by" text
);
--> statement-breakpoint
CREATE TABLE "model_test_drafts" (
	"id" serial PRIMARY KEY NOT NULL,
	"group_id" text NOT NULL,
	"exam_name" text NOT NULL,
	"batch_id" integer NOT NULL,
	"subjects" json NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "model_test_drafts_group_id_unique" UNIQUE("group_id")
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"batch_id" integer NOT NULL,
	"subject" text NOT NULL,
	"exam_name" text NOT NULL,
	"total_marks" integer NOT NULL,
	"obtained_marks" integer NOT NULL,
	"is_model_test" boolean DEFAULT false NOT NULL,
	"model_test_group_id" text,
	"date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_custom_id" text,
	"name" text NOT NULL,
	"batch_id" integer NOT NULL,
	"mobile_number" text,
	"shift" text,
	"academic_group" text,
	"user_id" integer,
	"added_by_user_id" integer,
	"admission_date" timestamp DEFAULT now(),
	CONSTRAINT "students_student_custom_id_unique" UNIQUE("student_custom_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'teacher' NOT NULL,
	"teacher_id" text,
	"mobile_number" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_teacher_id_unique" UNIQUE("teacher_id")
);
--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incomes" ADD CONSTRAINT "incomes_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_test_drafts" ADD CONSTRAINT "model_test_drafts_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "results" ADD CONSTRAINT "results_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_batch_id_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."batches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "students" ADD CONSTRAINT "students_added_by_user_id_users_id_fk" FOREIGN KEY ("added_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;