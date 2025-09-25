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

/**
 * Garante que um intervalo [start, start+duration] caiba entre START_HOUR e END_HOUR.
 * Retorna o start ajustado e a duration ajustada.
 */
export function clampIntervalToWindow(
  start: Date,
  duration: number,
  startHour: number,
  endHour: number,
  step = 30
) {
  let nd = new Date(start);
  nd.setSeconds(0, 0);

  // mínimo = startHour
  if (nd.getHours() < startHour) {
    nd.setHours(startHour, 0, 0, 0);
  }

  // arredonda para step (ex.: 30 em 30)
  const minutes = nd.getMinutes();
  const rounded = Math.floor(minutes / step) * step;
  nd.setMinutes(rounded, 0, 0);

  // fim proposto
  let proposedEnd = addMinutes(nd, duration);
  const endLimit = new Date(nd);
  endLimit.setHours(endHour, 0, 0, 0);

  if (proposedEnd > endLimit) {
    // reduz duração para caber
    duration = Math.max(step, Math.floor((+endLimit - +nd) / 60000));
    proposedEnd = addMinutes(nd, duration);
  }

  return { start: nd, duration };
}

/**
 * Retorna o próximo slot (arredondado para step) dentro da janela startHour–endHour.
 */
export function nextSlotWithinWindow(
  from: Date,
  step: number,
  startHour: number,
  endHour: number
) {
  const rounded = roundToStep(from, step);
  const h = rounded.getHours();
  if (h < startHour) {
    rounded.setHours(startHour, 0, 0, 0);
  } else if (h >= endHour) {
    // joga pro próximo dia, início da janela
    rounded.setDate(rounded.getDate() + 1);
    rounded.setHours(startHour, 0, 0, 0);
  }
  return rounded;
}

// =======================
// Ajuste de Fuso Horário
// =======================

// Fuso esperado pelo backend (ex.: Manaus = -04:00). 
// Se o back estiver em outro TZ, troque aqui.
export const SERVER_TZ_MINUTES = -4 * 60;

export function getLocalTzMinutes(d = new Date()) {
  // ex.: Brasília (-03:00) => -180
  return -d.getTimezoneOffset();
}

/**
 * Ajusta um Date local para que o servidor (em outro fuso)
 * enxergue a MESMA hora de parede escolhida no front.
 *
 * Fórmula: L' = L + (offsetBrowser - offsetServidor)
 */
export function shiftToServerTimezone(d: Date, serverTzMinutes = SERVER_TZ_MINUTES) {
  const browser = getLocalTzMinutes(d);
  const deltaMin = browser - serverTzMinutes;
  return new Date(d.getTime() + deltaMin * 60_000);
}
