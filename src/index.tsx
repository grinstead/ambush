/* @refresh reload */
import { render } from "solid-js/web";
import { Canvas } from "./lib/Canvas.tsx";

const root = document.getElementById("root");

render(() => <Canvas width={512} height={512} />, root!);
