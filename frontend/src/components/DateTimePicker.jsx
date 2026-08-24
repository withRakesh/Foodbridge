import { useEffect, useState } from 'react';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1);
const MINUTES = ['00', '15', '30', '45'];

export default function DateTimePicker({ label, value, onChange }) {
  const [date, setDate] = useState('');
  const [hour, setHour] = useState('12');
  const [minute, setMinute] = useState('00');
  const [period, setPeriod] = useState('AM');

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
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
        d.getDate()
      ).padStart(2, '0')}`
    );

    setHour(String(h12));
    setMinute(String(d.getMinutes()).padStart(2, '0'));
    setPeriod(h24 >= 12 ? 'PM' : 'AM');
  }, [value]);

  const emit = (
    nextDate,
    nextHour,
    nextMinute,
    nextPeriod
  ) => {
    if (!nextDate) {
      onChange('');
      return;
    }

    let h24 = parseInt(nextHour, 10) % 12;

    if (nextPeriod === 'PM') {
      h24 += 12;
    }

    const combined = new Date(nextDate);

    combined.setHours(
      h24,
      parseInt(nextMinute, 10),
      0,
      0
    );

    onChange(
      Number.isNaN(combined.getTime())
        ? ''
        : combined.toISOString()
    );
  };

  const inputClass =
    'h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';

  return (
    <div className="min-w-0">
      {label && (
        <label className="block text-sm font-medium text-neutral-900">
          {label}
        </label>
      )}

      <div className="mt-2 space-y-2.5 sm:flex sm:items-center sm:gap-2 sm:space-y-0">

        {/* Date */}
        <div className="min-w-0 flex-1">
          <input
            type="date"
            value={date}
            onChange={(e) => {
              const newDate = e.target.value;

              setDate(newDate);

              emit(
                newDate,
                hour,
                minute,
                period
              );
            }}
            className={`${inputClass} w-full`}
          />
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">

          {/* Hour */}
          <select
            value={hour}
            onChange={(e) => {
              const newHour = e.target.value;

              setHour(newHour);

              emit(
                date,
                newHour,
                minute,
                period
              );
            }}
            className={`${inputClass} w-[70px] px-2`}
            aria-label={`${label} hour`}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>

          <span className="text-sm font-medium text-neutral-400">
            :
          </span>

          {/* Minute */}
          <select
            value={minute}
            onChange={(e) => {
              const newMinute = e.target.value;

              setMinute(newMinute);

              emit(
                date,
                hour,
                newMinute,
                period
              );
            }}
            className={`${inputClass} w-[70px] px-2`}
            aria-label={`${label} minute`}
          >
            {MINUTES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* AM / PM */}
          <select
            value={period}
            onChange={(e) => {
              const newPeriod = e.target.value;

              setPeriod(newPeriod);

              emit(
                date,
                hour,
                minute,
                newPeriod
              );
            }}
            className={`${inputClass} w-[78px] px-2`}
            aria-label={`${label} AM or PM`}
          >
            <option value="AM">AM</option>
            <option value="PM">PM</option>
          </select>

        </div>
      </div>
    </div>
  );
}