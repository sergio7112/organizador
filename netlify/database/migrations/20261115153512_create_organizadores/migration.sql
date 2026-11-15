CREATE TABLE "organizadores" (
	"usuario_id" text PRIMARY KEY,
	"datos" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
