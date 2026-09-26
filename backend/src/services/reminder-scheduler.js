const DEFAULT_POLL_MS = 15000;

let timer = null;
let running = false;
let lastDueSignature = "";

async function scanDueReminders(db) {
  const result = await db.query(
    `SELECT
       r.id,
       r.event_id,
       r.remind_at,
       r.channel,
       r.status,
       r.attempts,
       e.user_id,
       e.title,
       e.start_at,
       u.phone,
       u.name,
       u.timezone
     FROM reminders r
     JOIN events e ON e.id = r.event_id
     JOIN users u ON u.id = e.user_id
     WHERE r.status = 'pending'
       AND r.remind_at <= NOW()
       AND e.status = 'active'
     ORDER BY r.remind_at ASC
     LIMIT 50`
  );

  return result.rows;
}

async function tick(db) {
  if (running) return;
  running = true;

  try {
    const due = await scanDueReminders(db);

    if (!due.length) {
      lastDueSignature = "";
      return;
    }

    const signature = due.map((item) => item.id).join(",");
    if (signature !== lastDueSignature) {
      console.log(
        `[reminders] ${due.length} reminder(s) due. Delivery provider is not connected yet; leaving them pending.`
      );

      for (const reminder of due) {
        console.log(
          `[reminders] READY id=${reminder.id} event="${reminder.title}" user=${reminder.user_id} channel=${reminder.channel}`
        );
      }

      lastDueSignature = signature;
    }
  } catch (error) {
    console.error("[reminders] scheduler error:", error.message);
  } finally {
    running = false;
  }
}

export function startReminderScheduler(db) {
  if (!db) {
    console.warn("[reminders] DATABASE_URL is not configured; scheduler disabled.");
    return;
  }

  const requested = Number(process.env.FINCLARO_REMINDER_POLL_MS || DEFAULT_POLL_MS);
  const pollMs = Number.isFinite(requested) && requested >= 5000 ? requested : DEFAULT_POLL_MS;

  console.log(`[reminders] scheduler started; polling every ${pollMs}ms.`);

  void tick(db);
  timer = setInterval(() => {
    void tick(db);
  }, pollMs);

  timer.unref?.();
}

export function stopReminderScheduler() {
  if (timer) clearInterval(timer);
  timer = null;
}
