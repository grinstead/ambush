import { SignalInternals } from "./SignalInternals.ts";

export class Signal<T> {
  _i: SignalInternals = new SignalInternals();

  result?: Signal<unknown>;
  get(): T {
    return null as any;
  }
}

export interface Process<Result, InterimResult> extends Signal<InterimResult> {
  result: Signal<Result>;
}

export function isDefined(signal: Signal<any>): boolean {}
