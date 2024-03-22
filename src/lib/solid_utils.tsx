import {
  Accessor,
  JSX,
  JSXElement,
  Show,
  children,
  createComputed,
  createSignal,
} from "solid-js";
import { Result } from "./utils.ts";

export type AsChildren<T> = JSXElement | T | (() => T) | Array<AsChildren<T>>;

export type ShowResultProps<T, Error> = {
  value: PromiseLike<Result<T, Error>>;
  success: (value: T) => JSX.Element;
  failure?: (error: Error) => JSX.Element;
  fallback?: JSX.Element;
};

export function childrenArray<T>(props: {
  children?: AsChildren<T>;
}): Accessor<Array<T>> {
  const accessor = children(() => props.children as JSXElement);
  return () => accessor.toArray() as any as Array<T>;
}

export function ShowResult<T, Error>(props: ShowResultProps<T, Error>) {
  const [result, setResult] = createSignal<Result<T, Error>>();

  // every time we are passed a new value, register to it
  createComputed(() => {
    setResult(undefined);
    props.value.then(setResult);
  });

  return (
    <Show when={result()} fallback={props.fallback}>
      {(r) => {
        const item = r();
        const { failure } = item;

        if (!failure) {
          return props.success(item.value);
        } else if (props.failure) {
          return props.failure(failure.error);
        } else {
          console.error(item.failure);
          return null;
        }
      }}
    </Show>
  );
}
