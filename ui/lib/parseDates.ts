const MONTHS: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export interface DateRange { checkIn: Date; checkOut: Date; }

const MONTH_PAT = '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const SEP = '(?:\\s*[-–]|(?:\\s+(?:to|through|thru)\\s+))';

function monthIndex(name: string): number {
  return MONTHS[name.slice(0, 3)] ?? MONTHS[name] ?? 0;
}

export function parseDateRange(text: string): DateRange | null {
  const s = text.toLowerCase();
  const year = new Date().getFullYear();

  // Same-month: "may 11-13", "may 11 to 13"
  const sameMonth = s.match(
    new RegExp(`\\b${MONTH_PAT}\\s+(\\d{1,2})${SEP}(\\d{1,2})\\b`)
  );
  if (sameMonth) {
    const m = monthIndex(sameMonth[1]);
    return {
      checkIn: new Date(year, m, parseInt(sameMonth[2])),
      checkOut: new Date(year, m, parseInt(sameMonth[3])),
    };
  }

  // Cross-month: "may 11 to june 2", "may 11 – june 2"
  const crossMonth = s.match(
    new RegExp(`\\b${MONTH_PAT}\\s+(\\d{1,2})\\s*(?:[-–]|to|through|thru)\\s*${MONTH_PAT}\\s+(\\d{1,2})\\b`)
  );
  if (crossMonth) {
    return {
      checkIn: new Date(year, monthIndex(crossMonth[1]), parseInt(crossMonth[2])),
      checkOut: new Date(year, monthIndex(crossMonth[3]), parseInt(crossMonth[4])),
    };
  }

  return null;
}
