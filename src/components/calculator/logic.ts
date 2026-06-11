// Calculation logic faithfully ported from the original Webflow calculator.

export type Inputs = {
  experience: "experience-0" | "experience-1" | "experience-2";
  hourlyRate: number;

  layoutComplexity: "layout-complexity-0" | "layout-complexity-1" | "layout-complexity-2";
  uniqueLayouts: number;
  templateLayouts: number;
  interactionsComplexity:
    | "interactions-complexity-0"
    | "interactions-complexity-1"
    | "interactions-complexity-2";
  cms: number[]; // selected CMS option indexes (0 = none)
  integrations: number[]; // selected integration option indexes (0 = none)

  interesting: "interesting-0" | "interesting-1" | "interesting-2";
  important: "important-0" | "important-1" | "important-2";

  profit: number;
  efficiencyFee: number;
  rushFee: number;
  taxRate: number;
  downpayment: number;

  projectsCount: number;
  commitedHours: number; // 0 = leave blank -> defaults to 40
  deadlineBuffer: number;
};

export type Results = {
  total: number;
  breakEven: number;
  profit: number;
  efficiencyFee: number;
  rushFee: number;
  tax: number;
  downpayment: number;
  hours: number;
  weeks: number;
  bufferWeeks: number;
  totalWeeks: number;
  totalInThousands: number;
};

const clamp = (val: number, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER) =>
  Math.min(max, Math.max(min, isNaN(val) ? 0 : val));

const round = (x: number, roundTo = 10) => Math.round(x / roundTo) * roundTo;

const experienceLayoutHours: Record<string, Record<string, number>> = {
  "experience-0": { "layout-complexity-0": 8, "layout-complexity-1": 12, "layout-complexity-2": 18 },
  "experience-1": { "layout-complexity-0": 6, "layout-complexity-1": 10, "layout-complexity-2": 14 },
  "experience-2": { "layout-complexity-0": 4, "layout-complexity-1": 8, "layout-complexity-2": 12 },
};

const interactionsMap: Record<string, number> = {
  "interactions-complexity-0": 0,
  "interactions-complexity-1": 15,
  "interactions-complexity-2": 30,
};

const interestingMap: Record<string, number> = {
  "interesting-0": 10,
  "interesting-1": 0,
  "interesting-2": -10,
};

const importantMap: Record<string, number> = {
  "important-0": 10,
  "important-1": 0,
  "important-2": -10,
};

// CMS option index -> hour bucket
const simpleCMS = [3, 4, 5];
const mediumCMS = [1, 2, 7];
const complexCMS = [6, 8];

const simpleIntegrations = [1, 2, 3, 7];
const mediumIntegrations = [4, 5, 6, 8, 9, 10];
const complexIntegrations = [11];

export const experienceHourlyRate: Record<string, number> = {
  "experience-0": 30,
  "experience-1": 60,
  "experience-2": 90,
};

export const experienceEfficiencyFee: Record<string, number> = {
  "experience-0": 0,
  "experience-1": 10,
  "experience-2": 20,
};

export function calculate(i: Inputs): Results {
  const hourlyRate = clamp(i.hourlyRate, 0);
  const profitVal = clamp(i.profit, 0);
  const efficiencyFeeVal = clamp(i.efficiencyFee, 0);
  const rushFeeVal = clamp(i.rushFee, 0);
  const taxRateVal = clamp(i.taxRate, 0, 100);
  const downpaymentVal = clamp(i.downpayment, 0, 100);
  const commitedHoursVal = clamp(i.commitedHours, 1, 40);
  const deadlineBufferVal = clamp(i.deadlineBuffer, 0);
  const uniqueLayoutsVal = clamp(i.uniqueLayouts, 0);
  const templateLayoutsVal = clamp(i.templateLayouts, 0);

  let cmsHours = 0;
  simpleCMS.forEach((idx) => i.cms.includes(idx) && (cmsHours += 2));
  mediumCMS.forEach((idx) => i.cms.includes(idx) && (cmsHours += 6));
  complexCMS.forEach((idx) => i.cms.includes(idx) && (cmsHours += 8));

  let integrationHours = 0;
  simpleIntegrations.forEach((idx) => i.integrations.includes(idx) && (integrationHours += 1));
  mediumIntegrations.forEach((idx) => i.integrations.includes(idx) && (integrationHours += 2));
  complexIntegrations.forEach((idx) => i.integrations.includes(idx) && (integrationHours += 4));

  const hoursPerLayout = experienceLayoutHours[i.experience][i.layoutComplexity];
  const interactionsPct = interactionsMap[i.interactionsComplexity] / 100;
  const interestingPct = interestingMap[i.interesting] / 100;
  const importantPct = importantMap[i.important] / 100;

  let hours = hoursPerLayout * uniqueLayoutsVal;
  hours += 0.5 * hoursPerLayout * templateLayoutsVal;
  hours *= 1 + interactionsPct;
  hours += cmsHours + integrationHours;
  hours = Math.round(hours);

  const weeks = Math.ceil(hours / (commitedHoursVal === 0 ? 40 : commitedHoursVal));
  const bufferWeeks = Math.round((weeks * deadlineBufferVal) / 100);
  const totalWeeks = weeks + bufferWeeks;

  const subTotal = hours * hourlyRate;
  const profit = round((subTotal * profitVal) / 100);
  const interesting = round(subTotal * interestingPct);
  const important = round(subTotal * importantPct);
  const rushFee = round((subTotal * rushFeeVal) / 100);
  const efficiencyFee = round((subTotal * efficiencyFeeVal) / 100);

  let total = subTotal + profit + interesting + important + rushFee + efficiencyFee;
  const tax = round((total * taxRateVal) / 100);
  total += tax;
  total = round(total, 50);

  const totalInThousands = Math.floor(total / 100) / 10;
  const breakEven = subTotal;
  const downpayment = round((total * downpaymentVal) / 100, 50);

  return {
    total,
    breakEven,
    profit,
    efficiencyFee,
    rushFee,
    tax,
    downpayment,
    hours,
    weeks,
    bufferWeeks,
    totalWeeks,
    totalInThousands,
  };
}

export const formatMoney = (x: number) => `$${x.toLocaleString("en-US")}`;

export const cmsOptions = [
  "No CMS",
  "Blog",
  "Case Studies",
  "Team Members",
  "Open Roles",
  "Help Center",
  "Services",
  "Podcast",
  "Other",
];

export const integrationOptions = [
  "No Integrations",
  "Google Analytics",
  "Mailchimp",
  "Hot Jar",
  "Zapier",
  "Hubspot",
  "Chat IO",
  "Calendly",
  "Optimizely",
  "Matomo",
  "Paypal / Stripe",
  "Other",
];

export const defaultInputs: Inputs = {
  experience: "experience-0",
  hourlyRate: 30,
  layoutComplexity: "layout-complexity-0",
  uniqueLayouts: 0,
  templateLayouts: 0,
  interactionsComplexity: "interactions-complexity-0",
  cms: [0],
  integrations: [0],
  interesting: "interesting-1",
  important: "important-1",
  profit: 20,
  efficiencyFee: 0,
  rushFee: 0,
  taxRate: 0,
  downpayment: 50,
  projectsCount: 1,
  commitedHours: 0,
  deadlineBuffer: 0,
};
