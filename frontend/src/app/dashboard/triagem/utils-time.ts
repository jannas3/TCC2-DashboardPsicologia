// Helpers simples para lidar com datas/horários em inputs HTML.

export function toDateStr(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`; // YYYY-MM-DD
}

export function toTimeStr(d: Date) {
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`; // HH:mm
}

export function combineDateTime(dateStr: string, timeStr: string) {
  // dateStr = 'YYYY-MM-DD', timeStr = 'HH:mm'
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const out = new Date(y, (m - 1), d, hh, mm, 0, 0);
  return out;
}

export function addMinutes(d: Date, minutes: number) {
  const nd = new Date(d);
  nd.setMinutes(nd.getMinutes() + minutes);
  return nd;
}

export function roundToStep(d: Date, step = 30) {
  const nd = new Date(d);
  const m = nd.getMinutes();
  const rounded = Math.round(m / step) * step;
  nd.setMinutes(rounded, 0, 0);
  return nd;
}
