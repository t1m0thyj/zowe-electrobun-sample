import { useState, useRef, useEffect } from "preact/hooks";
import {
  createTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  createColumnHelper,
  type TableOptionsResolved,
  type SortingState,
  type PaginationState,
  type TableState,
  type ColumnDef,
  type Header,
  type Cell,
} from "@tanstack/table-core";
import type { JobInfo } from "../../shared/rpc-types";
import { StatusBadge, Retcode } from "./StatusBadge";
import { SpoolFileList } from "./SpoolFileList";

interface JobTableProps {
  jobs: JobInfo[];
  onRefresh?: () => void;
  profileName?: string;
}

const colHelper = createColumnHelper<JobInfo>();

const columnDefs: ColumnDef<JobInfo, any>[] = [
  colHelper.display({ id: "expand", header: "", enableSorting: false }),
  colHelper.accessor("jobname", { header: "Job Name" }),
  colHelper.accessor("jobid", { header: "Job ID" }),
  colHelper.accessor("owner", { header: "Owner" }),
  colHelper.accessor("status", { header: "Status" }),
  colHelper.accessor("retcode", { header: "Return Code" }),
  colHelper.accessor("class", { header: "Class" }),
  colHelper.accessor("phaseName", { header: "Phase" }),
  colHelper.display({ id: "actions", header: "Actions", enableSorting: false }),
];

function usePreactTable(opts: {
  data: JobInfo[];
  globalFilter: string;
  pagination: PaginationState;
  onPaginationChange: (p: PaginationState) => void;
}) {
  const rerender = useState(0)[1];
  const tableRef = useRef<ReturnType<typeof createTable<JobInfo>> | null>(null);
  const stateRef = useRef<TableState | null>(null);

  if (!tableRef.current) {
    const resolvedOpts: TableOptionsResolved<JobInfo> = {
      data: opts.data,
      columns: columnDefs,
      state: {},
      onStateChange: () => {},
      getCoreRowModel: getCoreRowModel(),
      getSortedRowModel: getSortedRowModel(),
      getFilteredRowModel: getFilteredRowModel(),
      getPaginationRowModel: getPaginationRowModel(),
      globalFilterFn: "includesString",
      renderFallbackValue: null,
    };
    tableRef.current = createTable<JobInfo>(resolvedOpts);
    stateRef.current = {
      ...tableRef.current.initialState,
      globalFilter: opts.globalFilter,
      pagination: opts.pagination,
    };
  }

  const table = tableRef.current;

  table.setOptions((prev) => ({
    ...prev,
    data: opts.data,
    columns: columnDefs,
    state: {
      ...stateRef.current!,
      globalFilter: opts.globalFilter,
      pagination: opts.pagination,
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    onPaginationChange: (updater) => {
      const newPag = typeof updater === "function"
        ? updater(opts.pagination)
        : updater;
      opts.onPaginationChange(newPag);
    },
    onStateChange: (updater) => {
      const newState = typeof updater === "function"
        ? updater(stateRef.current!)
        : updater;
      stateRef.current = newState;
      rerender((n) => n + 1);
    },
  }));

  return table;
}

function RenderCell({
  cell,
  isExpanded,
  onToggle,
}: {
  cell: Cell<JobInfo, unknown>;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const id = cell.column.id;
  const job = cell.row.original;

  const stopAndToggle = (e: Event) => {
    e.stopPropagation();
    onToggle();
  };

  switch (id) {
    case "expand":
      return (
        <span class="expand-toggle" onClick={stopAndToggle}>
          {isExpanded ? "\u25BC" : "\u25B6"}
        </span>
      );
    case "jobname":
      return <span class="cell-bold">{job.jobname}</span>;
    case "jobid":
      return <span class="job-id">{job.jobid}</span>;
    case "status":
      return <StatusBadge status={job.status} />;
    case "retcode":
      return <Retcode retcode={job.retcode} />;
    case "class":
      return <span class="cell-mono">{job.class}</span>;
    case "actions":
      return (
        <div class="actions-cell" onClick={(e: Event) => e.stopPropagation()}>
          <button
            class="btn btn-sm btn-icon"
            title="Copy job name and ID"
            onClick={() =>
              navigator.clipboard
                .writeText(`${job.jobname} ${job.jobid}`)
                .catch(() => {})
            }
          >
            {"\uD83D\uDCCB"}
          </button>
        </div>
      );
    default:
      return <>{(cell.getValue() as string) ?? ""}</>;
  }
}

function RenderHeader({ header }: { header: Header<JobInfo, unknown> }) {
  const sorted = header.column.getIsSorted();
  const canSort = header.column.getCanSort();

  if (header.column.id === "expand") {
    return <th class="col-expand" />;
  }

  return (
    <th
      class={`${canSort ? "sortable" : ""} ${sorted ? "sorted" : ""}`}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
    >
      {header.column.columnDef.header as string}
      {canSort && (
        <span class="sort-arrow">
          {sorted === "asc" ? "\u25B2" : sorted === "desc" ? "\u25BC" : "\u25B2"}
        </span>
      )}
    </th>
  );
}

function ExpandPanel({ children }: { children: any }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    requestAnimationFrame(() => {
      if (ref.current) ref.current.classList.add("open");
    });
  }, []);
  return (
    <div ref={ref} class="detail-expand">
      {children}
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];

export function JobTable({ jobs, onRefresh, profileName }: JobTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const table = usePreactTable({
    data: jobs,
    globalFilter,
    pagination,
    onPaginationChange: setPagination,
  });

  const rows = table.getRowModel().rows;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageCount = table.getPageCount();
  const colCount = table.getHeaderGroups()[0].headers.length;

  return (
    <div>
      <div class="toolbar">
        <h1>Jobs</h1>
        <div class="toolbar-actions">
          <input
            type="text"
            class="search-input"
            placeholder="Filter by name, ID, owner, status..."
            value={globalFilter}
            onInput={(e) => {
              setGlobalFilter((e.target as HTMLInputElement).value);
              setPagination((p) => ({ ...p, pageIndex: 0 }));
            }}
          />
        </div>
      </div>

      <div class="grid-card">
        {rows.length === 0 && globalFilter ? (
          <div class="empty-state">
            <div class="icon">{"\uD83D\uDD0D"}</div>
            No jobs match "{globalFilter}".
          </div>
        ) : (
          <div class="table-scroll">
            <table class="job-table">
              <thead>
                <tr>
                  {table.getHeaderGroups()[0].headers.map((h) => (
                    <RenderHeader key={h.id} header={h} />
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const job = row.original;
                  const rowKey = `${job.jobname}:${job.jobid}`;
                  const isExpanded = expandedId === rowKey;
                  const toggle = () => setExpandedId(isExpanded ? null : rowKey);

                  return (
                    <>
                      <tr
                        key={row.id}
                        class={isExpanded ? "row-expanded" : ""}
                        onClick={toggle}
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>
                            <RenderCell
                              cell={cell}
                              isExpanded={isExpanded}
                              onToggle={toggle}
                            />
                          </td>
                        ))}
                      </tr>
                      {isExpanded && (
                        <tr key={`${row.id}-detail`} class="detail-row">
                          <td colSpan={colCount}>
                            <ExpandPanel>
                              <SpoolFileList jobname={job.jobname} jobid={job.jobid} profileName={profileName} />
                            </ExpandPanel>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div class="status-bar">
          <span>
            {filteredCount === jobs.length
              ? `${jobs.length} jobs`
              : `${filteredCount} of ${jobs.length} jobs`}
          </span>

          <div class="pagination">
            <select
              class="page-size-select"
              value={pagination.pageSize}
              onChange={(e) =>
                setPagination({
                  pageIndex: 0,
                  pageSize: Number((e.target as HTMLSelectElement).value),
                })
              }
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s} / page
                </option>
              ))}
            </select>
            <button
              class="btn btn-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: 0 }))
              }
            >
              {"<<"}
            </button>
            <button
              class="btn btn-sm"
              disabled={!table.getCanPreviousPage()}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex - 1 }))
              }
            >
              {"<"}
            </button>
            <span class="page-info">
              {pagination.pageIndex + 1} / {pageCount}
            </span>
            <button
              class="btn btn-sm"
              disabled={!table.getCanNextPage()}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: p.pageIndex + 1 }))
              }
            >
              {">"}
            </button>
            <button
              class="btn btn-sm"
              disabled={!table.getCanNextPage()}
              onClick={() =>
                setPagination((p) => ({ ...p, pageIndex: pageCount - 1 }))
              }
            >
              {">>"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
