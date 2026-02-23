import { render } from "preact";
import { Electroview } from "electrobun/view";
import type { ZoweRPCType } from "../shared/rpc-types";
import { ElectrobunProvider } from "./context/electrobun";
import { App } from "./App";

const rpc = Electroview.defineRPC<ZoweRPCType>({
  handlers: {
    requests: {},
    messages: {},
  },
});

const electrobun = new Electroview({ rpc });

render(
  <ElectrobunProvider value={electrobun}>
    <App />
  </ElectrobunProvider>,
  document.getElementById("root")!
);
