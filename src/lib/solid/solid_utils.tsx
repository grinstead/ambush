import { Component } from "solid-js";

export type Props<T extends Component<any>> = T extends Component<infer P>
  ? P
  : never;

export const ABSOLUTE_COVER =
  "position:absolute;left:0;right:0;width:100%;height:100%;";

export function rethrowError(error: unknown): any {
  throw error;
}
