/**
 * Yang Virtual Solutions — Availability Status Config
 * ─────────────────────────────────────────────────────
 * Edit the values below to update the availability badge
 * shown in the Pricing section for each service niche.
 *
 * Change only the values inside AVAILABILITY_STATUS.
 * Each niche can have a different availability status.
 *
 * Allowed values:
 *   "full-time"               → Available Full-time
 *   "part-time"               → Available Part-time
 *   "full-time-and-part-time" → Available Full-time and Part-time
 *   "fully-booked"            → Currently Fully Booked
 */
const AVAILABILITY_STATUS = {
  course: "full-time-and-part-time",  // Course & Website pricing
  ghl:    "full-time-and-part-time",  // GHL CRM & Automation pricing
  side:   "part-time",                // Side Niche Support pricing
};

// ── Do not edit below this line ──────────────────────────

(function () {
  var labels = {
    "full-time":               "Available Full-time",
    "part-time":               "Available Part-time",
    "full-time-and-part-time": "Available Full-time and Part-time",
    "fully-booked":            "Currently Fully Booked",
  };

  function applyBadge(id, status) {
    var badge = document.getElementById(id);
    if (!badge) return;
    var text = labels[status] || "Available Full-time and Part-time";
    badge.textContent = text;
    badge.classList.add("avail-status-badge--visible");
    if (status === "fully-booked") {
      badge.classList.add("avail-status-badge--booked");
    }
  }

  applyBadge("avail-badge-course", AVAILABILITY_STATUS.course);
  applyBadge("avail-badge-ghl",    AVAILABILITY_STATUS.ghl);
  applyBadge("avail-badge-side",   AVAILABILITY_STATUS.side);
})();
