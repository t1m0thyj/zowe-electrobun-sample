interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toUpperCase();
  let cls = "badge badge-default";
  if (s === "ACTIVE") cls = "badge badge-active";
  else if (s === "OUTPUT") cls = "badge badge-output";
  else if (s === "INPUT") cls = "badge badge-input";

  return <span class={cls}>{s || "\u2014"}</span>;
}

interface RetcodeProps {
  retcode: string | null;
}

export function Retcode({ retcode }: RetcodeProps) {
  if (!retcode) return <span class="retcode-none">{"\u2014"}</span>;

  const upper = retcode.toUpperCase();
  if (upper === "CC 0000" || upper === "CC 0")
    return <span class="retcode-ok">{retcode}</span>;
  if (upper.includes("ABEND") || upper.includes("JCL ERROR"))
    return <span class="retcode-err">{retcode}</span>;
  return <span class="retcode-warn">{retcode}</span>;
}
