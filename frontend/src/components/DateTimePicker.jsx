import { useEffect, useState } from 'react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1); // 1–12
const MINUTES = ['00', '15', '30', '45'];

// Custom date + time (12-hour, AM/PM) picker — used instead of a native
// datetime-local input because browsers render that inconsistently (some
// always show a 24-hour clock regardless of locale). Same contract as a
// controlled input: value/onChange carry a full ISO string (or '').
export default function DateTimePicker({ label, value, onChange }) {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

  // Populate sub-fields whenever the parent hands us a new ISO value
  // (e.g. resetting the form after a successful submit).
  useEffect(() => {
    if (!value) {
      setDate('');
      setHour('12');
      setMinute('00');
      setPeriod('AM');
      return;
    }
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return;

    const h24 = d.getHours();
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;

    setDate(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    );
    setHour(String(h12));
    setMinute(String(d.getMinutes()).padStart(2, '0'));
    setPeriod(h24 >= 12 ? 'PM' : 'AM');
  }, [value]);

  // Recompute the combined ISO string on every sub-field change and notify
  // the parent immediately — no separate "confirm" step.
  const emit = (nextDate, nextHour, nextMinute, nextPeriod) => {
    if (!nextDate) {
      onChange('');
      return;
    }
    let h24 = parseInt(nextHour, 10) % 12;
    if (nextPeriod === 'PM') h24 += 12;

    const combined = new Date(nextDate);
    combined.setHours(h24, parseInt(nextMinute, 10), 0, 0);

    onChange(Number.isNaN(combined.getTime()) ? '' : combined.toISOString());
  };

  return (
    <div>
      {label && <label className="block text-sm font-medium text-neutral-900">{label}</label>}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            emit(e.target.value, hour, minute, period);
          }}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <select
          value={hour}
          onChange={(e) => {
            setHour(e.target.value);
            emit(date, e.target.value, minute, period);
          }}
          className="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-primary"
        >
          {HOURS.map((h) => (
            <option key={h} value={h}>
              {h}
            </option>
          ))}
        </select>
        <span className="text-neutral-600">:</span>
        <select
          value={minute}
          onChange={(e) => {
            setMinute(e.target.value);
            emit(date, hour, e.target.value, period);
          }}
          className="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-primary"
        >
          {MINUTES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
        <select
          value={period}
          onChange={(e) => {
            setPeriod(e.target.value);
            emit(date, hour, minute, e.target.value);
          }}
          className="rounded-xl border border-neutral-200 bg-white px-2 py-2.5 text-sm outline-none focus:border-primary"
        >
          <option value="AM">AM</option>
          <option value="PM">PM</option>
        </select>
      </div>
    </div>
  );
}
