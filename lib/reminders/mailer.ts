import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: Number(process.env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

export type ReminderEmailInput = {
  dealId: string;
  contactName: string;
  categoryLabel: string;
  description: string;
  dueAt: Date;
};

/**
 * Shared by both the dry-run preview and the real send, so what a preview
 * shows the user is always exactly what would actually go out — never two
 * copies of the same formatting logic drifting apart.
 */
export function buildReminderEmail({
  dealId,
  contactName,
  categoryLabel,
  description,
  dueAt,
}: ReminderEmailInput) {
  const subject = `Reminder: ${categoryLabel} — ${contactName}`;
  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const text = [
    `${categoryLabel} due ${dueAt.toLocaleString()} for ${contactName}.`,
    "",
    description,
    "",
    `${baseUrl}/deals/${dealId}`,
  ].join("\n");
  return { subject, text };
}

export async function sendReminderEmail(input: ReminderEmailInput) {
  const { subject, text } = buildReminderEmail(input);
  await getTransporter().sendMail({
    from: process.env.SMTP_USER,
    to: process.env.REMINDER_TO_EMAIL,
    subject,
    text,
  });
}
