import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";

dayjs.extend(isoWeek);

export { dayjs };
export type { Dayjs } from "dayjs";
