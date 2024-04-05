/* @refresh reload */
import { render } from "solid-js/web";
import Example from "./examples/gltf.tsx";

const root = document.getElementById("root");

render(() => <Example />, root!);
