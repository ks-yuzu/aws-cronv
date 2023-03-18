import awsCronParser from "aws-cron-parser"
import { Rule } from "./rules_parser"

export interface Schedule {
  [key: string]: ({timestamp: number} & Rule)[]
}

export class ScheduleBuilder {
  static build(rules: Array<Rule>, dateString: string = (new Date).toISOString()): Schedule {
    const baseTimestamp = (new Date(dateString)).getTime()
    const schedule: { [key: string]: Set<Schedule[keyof Schedule][0]> } = {}

    for (const rule of rules) {
      const currentDate = new Date(dateString)

      while (true) {
        const next: Date | null = awsCronParser.next(rule.schedule, currentDate)
        if (!next) {
          break
        }
        const timestamp = next.getTime()
        if (!this.withinTargetDay(baseTimestamp, timestamp)) {
          break
        }

        schedule[rule.name] ??= new Set()
        if (this.withinTargetDay(baseTimestamp, timestamp)) {
          schedule[rule.name].add({...rule, timestamp})
        }

        currentDate.setTime(timestamp)
      }
    }
    const built: Schedule = {}
    for (const name in schedule) {
      built[name] = Array.from(schedule[name])
    }
    return built
  }

  static withinTargetDay(base: number, target: number) {
    return (((target - base) / 1000) < parseInt(process.env.SCHEDULE_DURATION ?? '86400'))
  }
}
