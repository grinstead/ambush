/* @refresh reload */
import { render } from "solid-js/web";
import Example from "./examples/current.tsx";

const root = document.getElementById("root");

render(() => <Example />, root!);
