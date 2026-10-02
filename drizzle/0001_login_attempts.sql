CREATE TABLE "login_attempts" (
	"ip_hash" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "login_attempts_ip_hash_window_start_pk" PRIMARY KEY("ip_hash","window_start")
);
