import { schedule } from "node-cron";
import { runMonthlyInvoices } from "./invoices";

type CronGlobal = typeof globalThis & { __blackwellCronStarted?: boolean };

export function startMonthlyCron() {
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  const g = globalThis as CronGlobal;
  if (g.__blackwellCronStarted) return;
  g.__blackwellCronStarted = true;

  // 1st of each month at 08:05 Europe/London, if this Node process stays running.
  schedule(
    "5 8 1 * *",
    () => {
      runMonthlyInvoices().catch((error) => {
        console.error("Monthly invoice job failed", error);
      });
    },
    { timezone: "Europe/London", name: "blackwell-monthly-invoices" },
  );
}
