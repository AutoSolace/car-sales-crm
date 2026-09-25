import type {
  LeadSource,
  PreferredContactMethod,
  DealStage,
  Outcome,
  AdditionalProductType,
  ActivityLogType,
  NextActionCategory,
} from "@prisma/client";

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  WALK_IN: "Walk-in",
  REFERRAL: "Referral",
  WEBSITE: "Website",
  PHONE_ENQUIRY: "Phone enquiry",
  SOCIAL_MEDIA: "Social media",
  SOCIAL_MEDIA_AD: "Social media ad",
  OTHER: "Other",
};

export const PREFERRED_CONTACT_METHOD_LABELS: Record<
  PreferredContactMethod,
  string
> = {
  PHONE: "Phone",
  EMAIL: "Email",
  TEXT_SMS: "Text/SMS",
  WHATSAPP: "WhatsApp",
};

export const DEAL_STAGE_LABELS: Record<DealStage, string> = {
  LEAD: "Lead",
  CONTACTED: "Contacted",
  FIND_CAR: "Find Car",
  PROPOSAL_SUBMITTED: "Proposal Submitted",
  PROPOSAL_ACCEPTED: "Proposal Accepted",
  COMPLETED_LOST: "Completed/Lost",
};

export const DEAL_STAGE_ORDER: DealStage[] = [
  "LEAD",
  "CONTACTED",
  "FIND_CAR",
  "PROPOSAL_SUBMITTED",
  "PROPOSAL_ACCEPTED",
  "COMPLETED_LOST",
];

export const OUTCOME_LABELS: Record<Outcome, string> = {
  PENDING: "Pending",
  YES: "Yes",
  NO: "No",
};

export const ADDITIONAL_PRODUCT_TYPE_LABELS: Record<
  AdditionalProductType,
  string
> = {
  WARRANTY_2YR: "2 Year Warranty",
  WARRANTY_3YR: "3 Year Warranty",
  SHINE_PROTECT_1YR: "Shine Protect 1 Year",
  SHINE_PROTECT_2YR: "Shine Protect 2 Year",
};

export const ACTIVITY_LOG_TYPE_LABELS: Record<ActivityLogType, string> = {
  STAGE_CHANGE: "Stage change",
  CALL: "Call",
  NOTE: "Note",
  REMINDER_SENT: "Reminder sent",
  NEXT_ACTION_COMPLETED: "Next action completed",
};

export const NEXT_ACTION_CATEGORY_LABELS: Record<NextActionCategory, string> = {
  CALL: "Call",
  EMAIL: "Email",
  MEETING: "Meeting",
  VIEWING: "Viewing",
  OTHER: "Other",
};

export const CONTACT_IMPORT_FIELDS = [
  "firstName",
  "lastName",
  "phone",
  "email",
  "address",
  "leadSource",
  "preferredContactMethod",
  "notes",
  "createdDate",
] as const;

export type ContactImportField = (typeof CONTACT_IMPORT_FIELDS)[number];

export const CONTACT_IMPORT_FIELD_LABELS: Record<ContactImportField, string> =
  {
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone",
    email: "Email",
    address: "Address",
    leadSource: "Lead source",
    preferredContactMethod: "Preferred contact method",
    notes: "Notes",
    createdDate: "Created date",
  };
